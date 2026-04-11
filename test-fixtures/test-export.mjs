#!/usr/bin/env node

/**
 * End-to-end test script for Markdown PDF MCP server
 *
 * This script tests the MCP server by:
 * 1. Checking Playwright/Chromium availability with doctor_markdown_pdf
 * 2. Exporting the sample.md fixture to PDF
 * 3. Verifying the output file exists
 *
 * Usage:
 *   node test-export.mjs [--custom-css path/to/custom.css]
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SCRIPT = path.join(
  __dirname,
  "..",
  "server",
  "markdown_pdf_server.mjs",
);
const SAMPLE_MD = path.join(__dirname, "sample.md");
const OUTPUT_PDF = path.join(__dirname, "sample.pdf");

let messageId = 1;

async function main() {
  console.log("Markdown PDF MCP Server Test\n");

  // Parse command line args
  const args = process.argv.slice(2);
  const customCssIndex = args.indexOf("--custom-css");
  const customCss = customCssIndex !== -1 ? args[customCssIndex + 1] : null;

  // Check that server script exists
  try {
    await fs.access(SERVER_SCRIPT);
  } catch {
    console.error(`Server script not found: ${SERVER_SCRIPT}`);
    process.exit(1);
  }

  // Check that sample markdown exists
  try {
    await fs.access(SAMPLE_MD);
  } catch {
    console.error(`Sample markdown not found: ${SAMPLE_MD}`);
    process.exit(1);
  }

  // Clean up any existing output PDF
  try {
    await fs.unlink(OUTPUT_PDF);
    console.log("Cleaned up previous test output\n");
  } catch {
    // File doesn't exist, that's fine
  }

  // Start the server
  console.log("Starting MCP server...");
  const server = spawn("node", [SERVER_SCRIPT], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      MARKDOWN_PDF_SETTINGS: JSON.stringify({
        open_after_export: false,
        page_format: "A4",
        print_background: true,
      }),
    },
  });

  let buffer = Buffer.alloc(0);
  const responses = new Map();

  server.stdout.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    processResponses();
  });

  server.stderr.on("data", (chunk) => {
    const message = chunk.toString("utf8").trim();
    if (message) {
      console.error(`Server stderr: ${message}`);
    }
  });

  function processResponses() {
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const headerText = buffer.subarray(0, headerEnd).toString("utf8");
      const match = headerText.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        console.error("Missing Content-Length header");
        return;
      }

      const contentLength = Number.parseInt(match[1], 10);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;
      if (buffer.length < messageEnd) return;

      const message = buffer
        .subarray(messageStart, messageEnd)
        .toString("utf8");
      buffer = buffer.subarray(messageEnd);

      const parsed = JSON.parse(message);
      if (parsed.id !== undefined) {
        responses.set(parsed.id, parsed);
      }
    }
  }

  function sendRequest(method, params = {}) {
    const id = messageId++;
    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    const json = JSON.stringify(request);
    const message = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
    server.stdin.write(message);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request ${id} (${method}) timed out`));
      }, 30000);

      const interval = setInterval(() => {
        if (responses.has(id)) {
          clearInterval(interval);
          clearTimeout(timeout);
          const response = responses.get(id);
          responses.delete(id);

          if (response.error) {
            reject(
              new Error(`${response.error.message || response.error.code}`),
            );
          } else {
            resolve(response.result);
          }
        }
      }, 50);
    });
  }

  try {
    // Step 1: Initialize
    console.log("Initializing server...");
    const initResult = await sendRequest("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    });
    console.log(
      `Server initialized: ${initResult.serverInfo.name} v${initResult.serverInfo.version}\n`,
    );

    // Step 2: List tools
    console.log("Listing available tools...");
    const toolsResult = await sendRequest("tools/list");
    console.log(`Found ${toolsResult.tools.length} tools:`);
    toolsResult.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Step 3: Run doctor
    console.log("Running doctor to check Playwright/Chromium...");
    const doctorResult = await sendRequest("tools/call", {
      name: "doctor_markdown_pdf",
      arguments: {
        input_path: SAMPLE_MD,
      },
    });

    if (doctorResult.isError) {
      console.error(`Doctor failed: ${doctorResult.content[0].text}`);
      process.exit(1);
    }

    const doctorData = doctorResult.structuredContent;
    if (doctorData.browser.available) {
      console.log(
        `Chromium available: ${doctorData.browser.backend} ${doctorData.browser.version}`,
      );
    } else {
      console.log(`Chromium not available yet: ${doctorData.browser.error}`);
      console.log(`Hint: ${doctorData.browser.hint}`);
      console.log("Continuing to export so the server can install Chromium.\n");
    }
    console.log(`Settings:`);
    console.log(JSON.stringify(doctorData.settings, null, 2));
    console.log();

    // Step 4: Export PDF
    console.log("Exporting sample.md to PDF...");
    const exportArgs = {
      input_path: SAMPLE_MD,
      output_path: OUTPUT_PDF,
      open_after_export: false,
    };

    if (customCss) {
      console.log(`  Using custom CSS: ${customCss}`);
      exportArgs.stylesheet_path = customCss;
    }

    const exportResult = await sendRequest("tools/call", {
      name: "export_markdown_pdf",
      arguments: exportArgs,
    });

    if (exportResult.isError) {
      console.error(`Export failed: ${exportResult.content[0].text}`);
      process.exit(1);
    }

    const exportData = exportResult.structuredContent;
    console.log(`PDF exported successfully!`);
    console.log(`  Input: ${exportData.input_path}`);
    console.log(`  Output: ${exportData.output_path}`);
    console.log(`  Backend: ${exportData.backend}`);
    if (exportData.stylesheet_path) {
      console.log(`  Stylesheet: ${exportData.stylesheet_path}`);
    }
    if (exportData.page_format) {
      console.log(`  Page format: ${exportData.page_format}`);
    }
    console.log();

    // Step 5: Verify output exists
    console.log("Verifying output file...");
    const stat = await fs.stat(OUTPUT_PDF);
    console.log(`PDF created: ${OUTPUT_PDF}`);
    console.log(`File size: ${(stat.size / 1024).toFixed(2)} KB`);
    console.log();

    console.log("All tests passed!");
  } catch (error) {
    console.error(`\nTest failed: ${error.message}`);
    process.exit(1);
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
