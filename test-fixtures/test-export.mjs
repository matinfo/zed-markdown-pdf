#!/usr/bin/env node
/**
 * End-to-end test suite for the Markdown PDF MCP server.
 *
 * Starts one server process, runs N named scenarios through it using the MCP
 * NDJSON transport, then reports a pass/fail summary with per-scenario timing.
 * All generated PDFs are deleted on exit unless --keep is passed.
 *
 * Usage:
 *   node test-export.mjs            # run all scenarios
 *   node test-export.mjs --keep     # keep output PDFs after the run
 *   node test-export.mjs --verbose  # print every server stderr line
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Paths ─────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_SCRIPT = path.join(
  __dirname,
  "..",
  "server",
  "markdown_pdf_server.mjs",
);
const SAMPLE_MD = path.join(__dirname, "sample.md");
const STRUCTURED_HEADER_MD = path.join(__dirname, "structured-header-test.md");
const CUSTOM_CSS = path.join(__dirname, "custom.css");

const KEEP_OUTPUT = process.argv.includes("--keep");
const VERBOSE = process.argv.includes("--verbose");

// ── Scenarios ─────────────────────────────────────────────────────────────────
//
// Each scenario sends one `export_markdown_pdf` tool call with the given args
// on top of the server's baseline settings. The server is started once and
// reused for all scenarios so Chromium is only launched once.

/** @type {Array<{name: string, description: string, args: object, output: string, minSizeBytes: number}>} */
const SCENARIOS = [
  {
    name: "01 — Default export",
    description: "A4, github.css highlight theme, emoji enabled, all defaults",
    args: {},
    output: path.join(__dirname, "out-01-default.pdf"),
    minSizeBytes: 40_000,
  },
  {
    name: "02 — Dark highlight theme",
    description:
      "atom-one-dark.css syntax highlighting, print_background: true",
    args: {
      highlight_style: "atom-one-dark.css",
      print_background: true,
    },
    output: path.join(__dirname, "out-02-dark-theme.pdf"),
    minSizeBytes: 40_000,
  },
  {
    name: "03 — Header and footer",
    description:
      "display_header_footer with %%ISO-DATE%%, title, and page numbers",
    args: {
      display_header_footer: true,
    },
    output: path.join(__dirname, "out-03-header-footer.pdf"),
    minSizeBytes: 40_000,
  },
  {
    name: "04 — Landscape orientation",
    description: "A4 landscape at scale 0.9",
    args: {
      orientation: "landscape",
      scale: 0.9,
    },
    output: path.join(__dirname, "out-04-landscape.pdf"),
    minSizeBytes: 40_000,
  },
  {
    name: "05 — Custom stylesheet (stacked)",
    description: "Built-in neutral styles + custom.css appended on top",
    args: {
      stylesheet_path: CUSTOM_CSS,
    },
    output: path.join(__dirname, "out-05-custom-css.pdf"),
    minSizeBytes: 40_000,
  },
  {
    name: "06 — No default styles",
    description:
      "include_default_styles: false — custom.css as the sole stylesheet",
    args: {
      include_default_styles: false,
      stylesheet_path: CUSTOM_CSS,
    },
    output: path.join(__dirname, "out-06-no-default-styles.pdf"),
    minSizeBytes: 20_000,
  },
  {
    name: "07 — Hard line breaks",
    description: "breaks: true — single newlines inside paragraphs become <br>",
    args: {
      breaks: true,
    },
    output: path.join(__dirname, "out-07-breaks.pdf"),
    minSizeBytes: 40_000,
  },
  {
    name: "08 — Highlight disabled",
    description:
      "highlight: false — plain preformatted code blocks, no hljs CSS injected",
    args: {
      highlight: false,
    },
    output: path.join(__dirname, "out-08-no-highlight.pdf"),
    minSizeBytes: 40_000,
  },
  {
    name: "09 — Structured header/footer (front matter)",
    description:
      "Structured header/footer config via YAML front matter with custom variables",
    args: {},
    input: STRUCTURED_HEADER_MD,
    output: path.join(__dirname, "out-09-structured-header.pdf"),
    minSizeBytes: 30_000,
  },
];

// ── MCP server wrapper (NDJSON transport) ─────────────────────────────────────

function createServer() {
  const proc = spawn("node", [SERVER_SCRIPT], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      // Baseline settings for the whole test run.
      // Per-scenario overrides are passed as individual tool-call arguments.
      MARKDOWN_PDF_SETTINGS: JSON.stringify({
        open_after_export: false,
        page_format: "A4",
        highlight: true,
        highlight_style: "github.css",
        emoji: true,
        breaks: false,
        print_background: true,
        include_default_styles: true,
        display_header_footer: false,
        orientation: "portrait",
        scale: 1,
        margin: { top: "25mm", right: "20mm", bottom: "25mm", left: "20mm" },
      }),
    },
  });

  let msgId = 1;
  let lineBuffer = "";

  /** @type {Map<number, {resolve: Function, reject: Function, timer: NodeJS.Timeout}>} */
  const pending = new Map();

  // ── stdout: NDJSON lines ──
  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (chunk) => {
    lineBuffer += chunk;
    let newline;
    while ((newline = lineBuffer.indexOf("\n")) !== -1) {
      const line = lineBuffer.slice(0, newline).trim();
      lineBuffer = lineBuffer.slice(newline + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        // Not valid JSON — ignore (debug framing, etc.)
        continue;
      }
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve, reject, timer } = pending.get(msg.id);
        pending.delete(msg.id);
        clearTimeout(timer);
        if (msg.error) {
          reject(new Error(`[${msg.error.code}] ${msg.error.message}`));
        } else {
          resolve(msg.result);
        }
      }
    }
  });

  // ── stderr: forward when verbose ──
  proc.stderr.setEncoding("utf8");
  proc.stderr.on("data", (chunk) => {
    if (!VERBOSE) return;
    for (const line of chunk.split("\n")) {
      if (line.trim())
        process.stderr.write(`  \x1b[2m[server] ${line.trim()}\x1b[0m\n`);
    }
  });

  /**
   * Send an MCP request and return a promise for the result.
   * @param {string} method
   * @param {object} [params]
   * @param {number} [timeoutMs]
   * @returns {Promise<object>}
   */
  function send(method, params = {}, timeoutMs = 120_000) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Timeout after ${timeoutMs}ms: ${method} (id=${id})`));
      }, timeoutMs);

      pending.set(id, { resolve, reject, timer });

      const json = JSON.stringify({ jsonrpc: "2.0", id, method, params });
      proc.stdin.write(json + "\n");
    });
  }

  function kill() {
    try {
      proc.stdin.end();
    } catch {}
    try {
      proc.kill("SIGTERM");
    } catch {}
  }

  return { send, kill, proc };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** ANSI colour helpers (gracefully degrade when not a TTY). */
const isTTY = process.stdout.isTTY;
const green = (s) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s);
const yellow = (s) => (isTTY ? `\x1b[33m${s}\x1b[0m` : s);
const dim = (s) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s);
const bold = (s) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s);

function pad(str, width) {
  return String(str).padEnd(width);
}

function formatBytes(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} MB`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} KB`;
  return `${n} B`;
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

const generatedFiles = [];

async function cleanupOutputs() {
  if (KEEP_OUTPUT) return;
  for (const f of generatedFiles) {
    try {
      await fs.unlink(f);
    } catch {}
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const suiteStart = Date.now();

  console.log(bold("\nMarkdown PDF — MCP Server Test Suite"));
  console.log(dim("─".repeat(60)));

  // ── Preflight checks ──
  for (const file of [SERVER_SCRIPT, SAMPLE_MD, CUSTOM_CSS]) {
    try {
      await fs.access(file);
    } catch {
      console.error(red(`✗ Required file not found: ${file}`));
      process.exit(1);
    }
  }

  // ── Clean up any leftover output files from previous runs ──
  const existingOuts = SCENARIOS.map((s) => s.output);
  for (const f of existingOuts) {
    try {
      await fs.unlink(f);
    } catch {}
  }

  // ── Start server ──
  console.log("\nStarting MCP server…");
  const server = createServer();

  try {
    // Initialize
    const init = await server.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-suite", version: "1.0.0" },
    });
    console.log(
      dim(`Server: ${init.serverInfo.name} v${init.serverInfo.version}`),
    );

    // Notify initialized
    server.proc.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      }) + "\n",
    );

    // ── Doctor check ──
    console.log("\nRunning doctor_markdown_pdf…");
    const doctorResult = await server.send("tools/call", {
      name: "doctor_markdown_pdf",
      arguments: { input_path: SAMPLE_MD },
    });

    if (doctorResult.isError) {
      console.error(red(`  doctor failed: ${doctorResult.content[0].text}`));
      process.exit(1);
    }

    const doctor = doctorResult.structuredContent;
    if (doctor.browser.available) {
      console.log(
        green(
          `  ✓ Chromium ${doctor.browser.version} (${doctor.browser.backend})`,
        ),
      );
    } else {
      console.log(
        yellow(`  ⚠ Chromium not yet available — ${doctor.browser.error}`),
      );
      console.log(dim(`    ${doctor.browser.hint}`));
      console.log(
        dim(
          "  Proceeding; the server will install Chromium on first export.\n",
        ),
      );
    }

    // Print active baseline settings
    console.log(dim("\n  Active server settings:"));
    for (const [k, v] of Object.entries(doctor.settings)) {
      const val = typeof v === "object" ? JSON.stringify(v) : String(v);
      console.log(dim(`    ${pad(k, 24)} ${val}`));
    }

    // ── Run scenarios ──
    console.log(bold(`\nRunning ${SCENARIOS.length} scenarios…`));
    console.log(dim("─".repeat(60)));

    const results = [];

    for (const scenario of SCENARIOS) {
      const label = pad(scenario.name, 40);
      process.stdout.write(`  ${label} `);

      const start = Date.now();
      let passed = false;
      let failReason = "";
      let sizeBytes = 0;

      try {
        const exportArgs = {
          input_path: scenario.input || SAMPLE_MD,
          output_path: scenario.output,
          open_after_export: false,
          ...scenario.args,
        };

        const result = await server.send(
          "tools/call",
          { name: "export_markdown_pdf", arguments: exportArgs },
          // Give up to 3 minutes per scenario (Chromium can be slow on first run)
          180_000,
        );

        if (result.isError) {
          failReason = result.content[0]?.text ?? "unknown error";
        } else {
          // Verify the output file was created and meets the minimum size
          try {
            const stat = await fs.stat(scenario.output);
            sizeBytes = stat.size;
            generatedFiles.push(scenario.output);

            if (sizeBytes < scenario.minSizeBytes) {
              failReason = `output too small: ${formatBytes(sizeBytes)} < ${formatBytes(scenario.minSizeBytes)}`;
            } else {
              passed = true;
            }
          } catch {
            failReason = `output file not found: ${scenario.output}`;
          }
        }
      } catch (err) {
        failReason = err.message;
      }

      const elapsed = Date.now() - start;

      if (passed) {
        console.log(
          `${green("✓")}  ${dim(`${formatBytes(sizeBytes).padStart(9)}  ${formatMs(elapsed)}`)}`,
        );
      } else {
        console.log(`${red("✗")}  ${red(failReason)}`);
      }

      if (VERBOSE && !passed) {
        console.log(
          dim(`     Scenario args: ${JSON.stringify(scenario.args)}`),
        );
      }

      results.push({ scenario, passed, failReason, sizeBytes, elapsed });
    }

    // ── Summary ──
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const totalMs = Date.now() - suiteStart;

    console.log(dim("─".repeat(60)));

    if (failed === 0) {
      console.log(
        bold(green(`\n  ✓ All ${passed} scenarios passed`)) +
          dim(`  (${formatMs(totalMs)} total)\n`),
      );
    } else {
      console.log(
        bold(`\n  ${green(`${passed} passed`)}, ${red(`${failed} failed`)}`) +
          dim(`  (${formatMs(totalMs)} total)\n`),
      );

      console.log(red("  Failed scenarios:"));
      for (const r of results.filter((r) => !r.passed)) {
        console.log(red(`    • ${r.scenario.name}`));
        console.log(dim(`      ${r.scenario.description}`));
        console.log(red(`      Reason: ${r.failReason}`));
      }
      console.log();
    }

    if (KEEP_OUTPUT && generatedFiles.length > 0) {
      console.log(dim("  Output PDFs kept (--keep):"));
      for (const f of generatedFiles) {
        console.log(dim(`    ${path.relative(process.cwd(), f)}`));
      }
      console.log();
    }

    process.exitCode = failed > 0 ? 1 : 0;
  } catch (err) {
    console.error(red(`\nFatal error: ${err.message}`));
    if (VERBOSE) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    server.kill();
    await cleanupOutputs();
  }
}

main().catch((err) => {
  console.error(red(`Unhandled error: ${err.message}`));
  process.exit(1);
});
