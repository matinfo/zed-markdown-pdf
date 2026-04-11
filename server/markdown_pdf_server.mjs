/**
 * Markdown PDF MCP server
 *
 * Runs as a stdio MCP server.
 * External npm packages are imported lazily so the MCP handshake can succeed
 * even before dependencies are installed.
 */

/**
 * Example of a supported tool call :
 * {
 *  "input_path": "/Users/me/docs/report.md",
 *  "page_format": "A4",
 *  "margin": {
 *    "top": "10mm",
 *    "bottom": "12mm"
 *  }
 * }
 */

// ── Built-in imports only at top level ────────────────────────────────────────
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

// ── Debug logging ──────────────────────────────────────────────────────────────
const DEBUG_LOG = path.join(os.tmpdir(), "zed-markdown-pdf-debug.log");

function debugLog(message) {
  try {
    fsSync.appendFileSync(
      DEBUG_LOG,
      `[${new Date().toISOString()}] ${message}\n`,
    );
  } catch {
    // Never let logging break the server.
  }
}

debugLog(`server starting — pid=${process.pid} node=${process.execPath}`);
debugLog(`argv=${JSON.stringify(process.argv)}`);
debugLog(`cwd=${process.cwd()}`);
debugLog(`__filename=${fileURLToPath(import.meta.url)}`);
debugLog(`PATH=${process.env.PATH ?? ""}`);

// ── Constants ─────────────────────────────────────────────────────────────────
const SERVER_NAME = "markdown-pdf";
const SERVER_VERSION = "1.0.0";
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSS_PATH = path.join(SERVER_DIR, "default.css");

const DEFAULT_SETTINGS = {
  stylesheet_path: null,
  output_directory: null,
  open_after_export: false,
  page_format: "A4",
  print_background: true,
  margin: {
    top: "18mm",
    right: "18mm",
    bottom: "18mm",
    left: "18mm",
  },
};

const ALLOWED_PAGE_FORMATS = new Set([
  "A4",
  "Letter",
  "Legal",
  "Tabloid",
  "Ledger",
  "A0",
  "A1",
  "A2",
  "A3",
  "A5",
  "A6",
]);

// ── Settings ──────────────────────────────────────────────────────────────────
function normalizeNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function normalizeBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePageFormat(value, fallback = DEFAULT_SETTINGS.page_format) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return ALLOWED_PAGE_FORMATS.has(trimmed) ? trimmed : fallback;
}

function normalizeMargin(raw, fallback = DEFAULT_SETTINGS.margin) {
  const safe = raw && typeof raw === "object" ? raw : {};

  return {
    top:
      typeof safe.top === "string" && safe.top.trim() !== ""
        ? safe.top
        : fallback.top,
    right:
      typeof safe.right === "string" && safe.right.trim() !== ""
        ? safe.right
        : fallback.right,
    bottom:
      typeof safe.bottom === "string" && safe.bottom.trim() !== ""
        ? safe.bottom
        : fallback.bottom,
    left:
      typeof safe.left === "string" && safe.left.trim() !== ""
        ? safe.left
        : fallback.left,
  };
}

function normalizeSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};

  return {
    stylesheet_path: normalizeNonEmptyString(safe.stylesheet_path),
    output_directory: normalizeNonEmptyString(safe.output_directory),
    open_after_export: normalizeBoolean(
      safe.open_after_export,
      DEFAULT_SETTINGS.open_after_export,
    ),
    page_format: normalizePageFormat(safe.page_format),
    print_background: normalizeBoolean(
      safe.print_background,
      DEFAULT_SETTINGS.print_background,
    ),
    margin: normalizeMargin(safe.margin, DEFAULT_SETTINGS.margin),
  };
}

function loadSettings() {
  try {
    const parsed = JSON.parse(process.env.MARKDOWN_PDF_SETTINGS ?? "{}");
    return normalizeSettings(parsed);
  } catch (error) {
    debugLog(
      `settings parse failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return normalizeSettings({});
  }
}

const settings = loadSettings();

function buildEffectiveOptions(args = {}) {
  return {
    stylesheet_path:
      normalizeNonEmptyString(args.stylesheet_path) ?? settings.stylesheet_path,
    output_path: normalizeNonEmptyString(args.output_path),
    open_after_export:
      typeof args.open_after_export === "boolean"
        ? args.open_after_export
        : settings.open_after_export,
    page_format: normalizePageFormat(args.page_format, settings.page_format),
    print_background:
      typeof args.print_background === "boolean"
        ? args.print_background
        : settings.print_background,
    margin: normalizeMargin(args.margin, settings.margin),
  };
}

// ── Dependency management ─────────────────────────────────────────────────────
let dependenciesPromise = null;

function ensureDependencies() {
  if (!dependenciesPromise) {
    dependenciesPromise = installDepsIfNeeded().catch((error) => {
      dependenciesPromise = null;
      throw error;
    });
  }
  return dependenciesPromise;
}

async function installDepsIfNeeded() {
  const requiredPackages = ["playwright-core", "markdown-it"];

  try {
    await Promise.all(
      requiredPackages.map((packageName) =>
        fs.access(path.join(SERVER_DIR, "node_modules", packageName)),
      ),
    );
    debugLog("required node_modules found — skipping npm install");
    return;
  } catch {
    // Continue to installation.
  }

  debugLog("required node_modules missing — running npm install");
  console.error("Installing npm dependencies (first run)…");

  const { spawn } = await import("node:child_process");
  const npmPath = findNpmPath();

  await new Promise((resolve, reject) => {
    const proc = spawn(
      npmPath,
      ["install", "--no-audit", "--no-fund", "--prefer-offline"],
      {
        cwd: SERVER_DIR,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("exit", (code) => {
      if (code === 0) {
        debugLog("npm install succeeded");
        if (stdout.trim()) debugLog(`npm stdout: ${stdout.trim()}`);
        if (stderr.trim()) debugLog(`npm stderr: ${stderr.trim()}`);
        console.error("npm dependencies installed successfully.");
        resolve();
        return;
      }

      const message =
        `npm install failed (exit ${code}).\n` +
        `${stderr.trim() || stdout.trim()}\n` +
        `Please run manually:\n  cd ${SERVER_DIR}\n  npm install`;

      debugLog(message);
      reject(new Error(message));
    });

    proc.on("error", (error) => {
      const message =
        `Failed to run npm (${npmPath}): ${error.message}\n` +
        `Please run manually:\n  cd ${SERVER_DIR}\n  npm install`;

      debugLog(message);
      reject(new Error(message));
    });
  });
}

function findNpmPath() {
  const nodeDir = path.dirname(process.execPath);
  const candidates = [
    path.join(nodeDir, "npm"),
    path.join(nodeDir, "npm.cmd"),
    path.join(nodeDir, "npm.bat"),
    "npm",
  ];

  for (const candidate of candidates) {
    if (candidate === "npm") return candidate;
    if (fsSync.existsSync(candidate)) return candidate;
  }

  return "npm";
}

// ── Lazy module loading ───────────────────────────────────────────────────────
let chromiumSingleton = null;
async function getChromium() {
  if (!chromiumSingleton) {
    await ensureDependencies();
    const playwright = await import("playwright-core");
    chromiumSingleton = playwright.chromium;
  }
  return chromiumSingleton;
}

let markdownSingleton = null;
async function getMarkdown() {
  if (!markdownSingleton) {
    await ensureDependencies();
    const MarkdownIt = (await import("markdown-it")).default;
    markdownSingleton = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });
  }
  return markdownSingleton;
}

// ── Browser setup ─────────────────────────────────────────────────────────────
async function ensureChromiumInstalled() {
  const chromium = await getChromium();

  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    debugLog("Chromium launch test passed");
    return;
  } catch (error) {
    debugLog(
      `Chromium launch failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  console.error("Chromium not found, installing automatically…");

  const { spawn } = await import("node:child_process");
  const playwrightCliPath = path.join(
    SERVER_DIR,
    "node_modules",
    "playwright-core",
    "cli.js",
  );

  await new Promise((resolve, reject) => {
    const proc = spawn(
      process.execPath,
      [playwrightCliPath, "install", "chromium"],
      {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      },
    );

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("exit", (code) => {
      if (code === 0) {
        debugLog("Chromium installed successfully");
        if (stdout.trim()) debugLog(`playwright stdout: ${stdout.trim()}`);
        if (stderr.trim()) debugLog(`playwright stderr: ${stderr.trim()}`);
        console.error("Chromium installed successfully.");
        resolve();
        return;
      }

      const message =
        `Chromium install failed (exit ${code}).\n` +
        `${stderr.trim() || stdout.trim()}\n` +
        `Please install manually:\n` +
        `  cd ${SERVER_DIR}\n` +
        `  node node_modules/playwright-core/cli.js install chromium`;

      debugLog(message);
      reject(new Error(message));
    });

    proc.on("error", (error) => {
      const message =
        `Failed to start Chromium installer: ${error.message}\n` +
        `Please install manually:\n` +
        `  cd ${SERVER_DIR}\n` +
        `  node node_modules/playwright-core/cli.js install chromium`;

      debugLog(message);
      reject(new Error(message));
    });
  });
}

// ── MCP stdio framing ─────────────────────────────────────────────────────────
//
// The MCP specification (2024-11-05) defines the stdio transport as
// newline-delimited JSON (NDJSON): one JSON object per line, separated
// by '\n'.  Some older clients/tooling still use LSP-style
// "Content-Length" framing.  We auto-detect the framing on the very
// first non-whitespace byte of stdin and stick with that mode for the
// rest of the session.
// ───────────────────────────────────────────────────────────────────────────────

let buffer = Buffer.alloc(0);
/** @type {"ndjson"|"lsp"|null} */
let framingMode = null;

process.stdin.on("data", (chunk) => {
  debugLog(`stdin data: ${chunk.length} bytes`);
  buffer = Buffer.concat([buffer, chunk]);
  processIncomingMessages();
});

process.stdin.on("end", () => {
  debugLog("stdin ended — exiting");
  process.exit(0);
});

function processIncomingMessages() {
  // Auto-detect framing on first meaningful byte.
  if (!framingMode) {
    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      // Skip whitespace / newlines
      if (byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d)
        continue;
      // '{' → newline-delimited JSON; anything else → LSP Content-Length
      framingMode = byte === 0x7b ? "ndjson" : "lsp";
      break;
    }
    if (!framingMode) return;
    debugLog(`framing mode detected: ${framingMode}`);
  }

  if (framingMode === "ndjson") {
    processNdjsonMessages();
  } else {
    processLspMessages();
  }
}

// ── NDJSON framing (MCP spec) ─────────────────────────────────────────────────
function processNdjsonMessages() {
  while (true) {
    const newlineIndex = buffer.indexOf(0x0a); // '\n'
    if (newlineIndex === -1) return;

    const line = buffer.subarray(0, newlineIndex).toString("utf8").trim();
    buffer = buffer.subarray(newlineIndex + 1);

    if (line.length === 0) continue;

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      debugLog(
        `JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    handleMessage(message).catch((error) => {
      const messageText =
        error instanceof Error ? error.message : String(error);
      debugLog(`handleMessage error: ${messageText}`);
      console.error(messageText);
    });
  }
}

// ── LSP Content-Length framing (legacy / tooling compat) ──────────────────────
function processLspMessages() {
  while (true) {
    let headerEnd = buffer.indexOf("\r\n\r\n");
    let separatorLength = 4;

    // Also accept \n\n (some tools omit \r)
    if (headerEnd === -1) {
      headerEnd = buffer.indexOf("\n\n");
      separatorLength = 2;
    }

    if (headerEnd === -1) return;

    const headerText = buffer.subarray(0, headerEnd).toString("utf8");
    const match = headerText.match(/Content-Length:\s*(\d+)/i);

    if (!match) {
      debugLog("Missing Content-Length header — discarding buffer");
      buffer = Buffer.alloc(0);
      return;
    }

    const contentLength = Number.parseInt(match[1], 10);
    const messageStart = headerEnd + separatorLength;
    const messageEnd = messageStart + contentLength;

    if (buffer.length < messageEnd) return;

    const rawMessage = buffer
      .subarray(messageStart, messageEnd)
      .toString("utf8");
    buffer = buffer.subarray(messageEnd);

    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch (error) {
      debugLog(
        `JSON parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    handleMessage(message).catch((error) => {
      const messageText =
        error instanceof Error ? error.message : String(error);
      debugLog(`handleMessage error: ${messageText}`);
      console.error(messageText);
    });
  }
}

// ── Write outgoing messages ───────────────────────────────────────────────────
function writeMessage(message) {
  const json = JSON.stringify(message);
  if (framingMode === "lsp") {
    // LSP-style Content-Length framing
    process.stdout.write(
      `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`,
    );
  } else {
    // MCP spec: newline-delimited JSON
    process.stdout.write(json + "\n");
  }
}

function respond(id, result) {
  writeMessage({ jsonrpc: "2.0", id, result });
}

function respondError(id, code, message) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: { code, message },
  });
}

// ── MCP dispatch ──────────────────────────────────────────────────────────────
async function handleMessage(message) {
  if (!message.method) {
    debugLog(`received message without method: ${JSON.stringify(message)}`);
    return;
  }

  debugLog(
    `handling method=${message.method} id=${message.id ?? "(notification)"}`,
  );

  switch (message.method) {
    case "initialize":
      respond(message.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
      return;

    case "notifications/initialized":
      return;

    case "ping":
      respond(message.id, {});
      return;

    case "tools/list":
      respond(message.id, {
        tools: [
          {
            name: "export_markdown_pdf",
            title: "Export Markdown PDF",
            description:
              "Render a Markdown file to HTML and convert it to PDF with Playwright/Chromium.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              required: ["input_path"],
              properties: {
                input_path: {
                  type: "string",
                  description:
                    "Absolute or relative path to the Markdown file.",
                },
                output_path: {
                  type: "string",
                  description: "Optional output PDF path.",
                },
                stylesheet_path: {
                  type: "string",
                  description:
                    "Optional CSS file applied after the built-in stylesheet.",
                },
                open_after_export: {
                  type: "boolean",
                  description: "Open the PDF after export.",
                },
                page_format: {
                  type: "string",
                  enum: [...ALLOWED_PAGE_FORMATS],
                  description: "Paper format.",
                },
                print_background: {
                  type: "boolean",
                  description:
                    "Whether to print background colours and images.",
                },
                margin: {
                  type: "object",
                  description:
                    "Optional per-call page margins. Any omitted side falls back to settings/defaults.",
                  additionalProperties: false,
                  properties: {
                    top: {
                      type: "string",
                      description: "Top margin, for example '10mm' or '0.5in'.",
                    },
                    right: {
                      type: "string",
                      description:
                        "Right margin, for example '10mm' or '0.5in'.",
                    },
                    bottom: {
                      type: "string",
                      description:
                        "Bottom margin, for example '10mm' or '0.5in'.",
                    },
                    left: {
                      type: "string",
                      description:
                        "Left margin, for example '10mm' or '0.5in'.",
                    },
                  },
                },
              },
            },
          },
          {
            name: "doctor_markdown_pdf",
            title: "Doctor Markdown PDF",
            description:
              "Inspect Playwright/Chromium setup and current server settings.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {
                input_path: {
                  type: "string",
                  description:
                    "Optional Markdown file used to resolve relative settings.",
                },
              },
            },
          },
        ],
      });
      return;

    case "tools/call": {
      const result = await callTool(
        message.params?.name,
        message.params?.arguments ?? {},
      );
      respond(message.id, result);
      return;
    }

    default:
      if (message.id !== undefined) {
        respondError(message.id, -32601, `Method not found: ${message.method}`);
      }
  }
}

// ── Tool dispatch ─────────────────────────────────────────────────────────────
async function callTool(name, args) {
  try {
    await ensureDependencies();

    switch (name) {
      case "export_markdown_pdf":
        return toolResult(await exportMarkdownPdf(args));

      case "doctor_markdown_pdf":
        return toolResult(await doctorMarkdownPdf(args));

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    debugLog(`callTool(${name}) error: ${message}`);
    return toolError(message);
  }
}

function toolResult(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

function toolError(message) {
  return {
    content: [{ type: "text", text: message }],
    structuredContent: { error: message },
    isError: true,
  };
}

// ── Tool implementations ──────────────────────────────────────────────────────
async function doctorMarkdownPdf(args) {
  const inputPath = args.input_path
    ? await resolveInputPath(args.input_path)
    : null;

  let browserInfo;
  try {
    const chromium = await getChromium();
    const browser = await chromium.launch({ headless: true });
    const version = browser.version();
    await browser.close();

    browserInfo = {
      available: true,
      version,
      backend: "Chromium (Playwright)",
    };
  } catch (error) {
    browserInfo = {
      available: false,
      error: error instanceof Error ? error.message : String(error),
      hint: `Run: node ${path.join(SERVER_DIR, "node_modules", "playwright-core", "cli.js")} install chromium`,
    };
  }

  return {
    browser: browserInfo,
    settings,
    default_settings: DEFAULT_SETTINGS,
    server_dir: SERVER_DIR,
    input_path: inputPath,
    debug_log: DEBUG_LOG,
  };
}

async function exportMarkdownPdf(args) {
  const inputPath = await resolveInputPath(args.input_path);
  const markdownDir = path.dirname(inputPath);
  const options = buildEffectiveOptions(args);

  const outputPath = await resolveOutputPath(inputPath, options.output_path);
  const stylesheetPath = resolveStylesheetPath(
    markdownDir,
    options.stylesheet_path,
  );

  const html = await renderMarkdownToHtml(inputPath, stylesheetPath);

  await ensureChromiumInstalled();

  const chromium = await getChromium();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    await page.goto(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      { waitUntil: "networkidle" },
    );

    await page.pdf({
      path: outputPath,
      format: options.page_format,
      printBackground: options.print_background,
      margin: options.margin,
    });
  } finally {
    await browser.close();
  }

  if (options.open_after_export) {
    void openFile(outputPath);
  }

  return {
    input_path: inputPath,
    output_path: outputPath,
    backend: "Playwright/Chromium",
    stylesheet_path: stylesheetPath,
    page_format: options.page_format,
    print_background: options.print_background,
    margin: options.margin,
    open_after_export: options.open_after_export,
  };
}

// ── Path helpers ──────────────────────────────────────────────────────────────
async function resolveInputPath(inputPath) {
  if (typeof inputPath !== "string" || inputPath.trim() === "") {
    throw new Error("input_path must be a non-empty string");
  }

  const absolutePath = path.resolve(inputPath);
  await assertFileExists(absolutePath, "Markdown input");
  return absolutePath;
}

async function resolveOutputPath(inputPath, outputPath) {
  if (typeof outputPath === "string" && outputPath.trim() !== "") {
    const resolved = path.resolve(path.dirname(inputPath), outputPath);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    return resolved;
  }

  const baseDirectory = settings.output_directory
    ? path.resolve(path.dirname(inputPath), settings.output_directory)
    : path.dirname(inputPath);

  await fs.mkdir(baseDirectory, { recursive: true });
  return path.join(baseDirectory, `${path.parse(inputPath).name}.pdf`);
}

function resolveStylesheetPath(baseDirectory, stylesheetPath) {
  if (!stylesheetPath) return null;
  return path.resolve(baseDirectory, stylesheetPath);
}

// ── HTML rendering ────────────────────────────────────────────────────────────
async function renderMarkdownToHtml(inputPath, stylesheetPath) {
  const source = await fs.readFile(inputPath, "utf8");
  const { body, title } = splitFrontmatter(source, inputPath);

  const markdown = await getMarkdown();
  const rendered = markdown.render(body);

  const defaultCss = await fs.readFile(DEFAULT_CSS_PATH, "utf8");
  const customCss = stylesheetPath
    ? await fs.readFile(stylesheetPath, "utf8")
    : "";

  const baseHref = `${pathToFileURL(path.dirname(inputPath)).href}/`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <base href="${baseHref}">
    <style>${defaultCss}</style>
    ${customCss ? `<style>${customCss}</style>` : ""}
  </head>
  <body>
    <main>
      ${rendered}
    </main>
  </body>
</html>`;
}

function splitFrontmatter(source, inputPath) {
  const stem = path.parse(inputPath).name;

  if (!source.startsWith("---\n")) {
    return { body: source, title: stem };
  }

  const end = source.indexOf("\n---\n", 4);
  if (end === -1) {
    return { body: source, title: stem };
  }

  const frontmatter = source.slice(4, end);
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);

  return {
    body: source.slice(end + 5),
    title: titleMatch ? titleMatch[1].trim().replace(/^['"]|['"]$/g, "") : stem,
  };
}

// ── Filesystem helpers ────────────────────────────────────────────────────────
async function assertFileExists(filePath, label) {
  if (!(await fileExists(filePath))) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

async function fileExists(filePath) {
  try {
    return (await fs.stat(filePath)).isFile();
  } catch {
    return false;
  }
}

// ── Open file with OS default application ─────────────────────────────────────
async function openFile(filePath) {
  const { spawn } = await import("node:child_process");

  let command;
  let args;

  if (process.platform === "darwin") {
    command = "open";
    args = [filePath];
  } else if (process.platform === "win32") {
    command = "cmd";
    args = ["/C", "start", "", filePath];
  } else {
    command = "xdg-open";
    args = [filePath];
  }

  spawn(command, args, {
    detached: true,
    stdio: "ignore",
  }).unref();
}

// ── Misc utilities ────────────────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
