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

// ── Structured header/footer pipeline imports ─────────────────────────────────
import {
  parseFrontMatter,
  ensureYamlLoaded,
} from "./lib/frontmatter-parser.mjs";
import { mergeConfig, detectMode } from "./lib/config-merger.mjs";
import { createAssetResolver } from "./lib/asset-resolver.mjs";
import {
  createPlaceholderResolver,
  createRenderContext,
  ensureDateFnsLoaded,
} from "./lib/placeholder-resolver.mjs";
import { createHtmlGenerator } from "./lib/html-generator.mjs";

// ── Debug logging ──────────────────────────────────────────────────────────────
// On macOS os.tmpdir() returns /var/folders/…/T which is hard to find.
// Use /tmp directly on macOS/Linux so the path matches what is documented.
const DEBUG_LOG =
  process.platform === "win32"
    ? path.join(os.tmpdir(), "zed-markdown-pdf-debug.log")
    : "/tmp/zed-markdown-pdf-debug.log";

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
const SERVER_VERSION = "0.2.0";
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSS_PATH = path.join(SERVER_DIR, "default.css");

const DEFAULT_SETTINGS = {
  // output
  stylesheet_path: null,
  output_directory: null,
  assets_directory: null,
  open_after_export: false,
  // page layout
  page_format: "A4",
  orientation: "portrait",
  scale: 1,
  page_ranges: "",
  print_background: true,
  margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
  // content / rendering
  font_family: null,
  include_default_styles: true,
  highlight: true,
  highlight_style: "github.css",
  breaks: false,
  emoji: true,
  // math (KaTeX)
  math: false,
  math_options: {
    throw_on_error: false,
    error_color: "#cc0000",
    macros: {},
  },
  // headings / TOC
  heading_anchors: false,
  toc: false,
  toc_options: {
    level: [1, 2, 3],
    list_type: "ul",
  },
  // header / footer
  display_header_footer: false,
};

const ALLOWED_ORIENTATIONS = new Set(["portrait", "landscape"]);

const HIGHLIGHT_STYLES = new Set([
  "1c-light.css",
  "a11y-dark.css",
  "a11y-light.css",
  "agate.css",
  "an-old-hope.css",
  "androidstudio.css",
  "arduino-light.css",
  "arta.css",
  "ascetic.css",
  "atom-one-dark-reasonable.css",
  "atom-one-dark.css",
  "atom-one-light.css",
  "brown-paper.css",
  "codepen-embed.css",
  "color-brewer.css",
  "cybertopia-cherry.css",
  "cybertopia-dimmer.css",
  "cybertopia-icecap.css",
  "cybertopia-saturated.css",
  "dark.css",
  "default.css",
  "devibeans.css",
  "docco.css",
  "far.css",
  "felipec.css",
  "foundation.css",
  "github-dark-dimmed.css",
  "github-dark.css",
  "github.css",
  "gml.css",
  "googlecode.css",
  "gradient-dark.css",
  "gradient-light.css",
  "grayscale.css",
  "hybrid.css",
  "idea.css",
  "intellij-light.css",
  "ir-black.css",
  "isbl-editor-dark.css",
  "isbl-editor-light.css",
  "kimbie-dark.css",
  "kimbie-light.css",
  "lightfair.css",
  "lioshi.css",
  "magula.css",
  "mono-blue.css",
  "monokai-sublime.css",
  "monokai.css",
  "night-owl.css",
  "nnfx-dark.css",
  "nnfx-light.css",
  "nord.css",
  "obsidian.css",
  "panda-syntax-dark.css",
  "panda-syntax-light.css",
  "paraiso-dark.css",
  "paraiso-light.css",
  "pojoaque.css",
  "purebasic.css",
  "qtcreator-dark.css",
  "qtcreator-light.css",
  "rainbow.css",
  "rose-pine-dawn.css",
  "rose-pine-moon.css",
  "rose-pine.css",
  "routeros.css",
  "school-book.css",
  "shades-of-purple.css",
  "srcery.css",
  "stackoverflow-dark.css",
  "stackoverflow-light.css",
  "sunburst.css",
  "tokyo-night-dark.css",
  "tokyo-night-light.css",
  "tomorrow-night-blue.css",
  "tomorrow-night-bright.css",
  "vs.css",
  "vs2015.css",
  "xcode.css",
  "xt256.css",
]);

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

function normalizeMathOptions(raw, fallback = DEFAULT_SETTINGS.math_options) {
  const safe = raw && typeof raw === "object" ? raw : {};
  const macros =
    safe.macros && typeof safe.macros === "object" && !Array.isArray(safe.macros)
      ? safe.macros
      : fallback.macros;
  return {
    throw_on_error: normalizeBoolean(safe.throw_on_error, fallback.throw_on_error),
    error_color:
      typeof safe.error_color === "string" && safe.error_color.trim() !== ""
        ? safe.error_color
        : fallback.error_color,
    macros,
  };
}

function normalizeTocOptions(raw, fallback = DEFAULT_SETTINGS.toc_options) {
  const safe = raw && typeof raw === "object" ? raw : {};
  let level = fallback.level;
  if (Array.isArray(safe.level)) {
    const filtered = safe.level
      .map((n) => (typeof n === "number" ? Math.floor(n) : NaN))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 6);
    if (filtered.length > 0) level = filtered;
  } else if (typeof safe.level === "number" && safe.level >= 1 && safe.level <= 6) {
    level = [Math.floor(safe.level)];
  }
  const list_type =
    safe.list_type === "ol" || safe.list_type === "ul"
      ? safe.list_type
      : fallback.list_type;
  return { level, list_type };
}

function normalizeSettings(raw) {
  const safe = raw && typeof raw === "object" ? raw : {};
  return {
    stylesheet_path: normalizeNonEmptyString(safe.stylesheet_path),
    output_directory: normalizeNonEmptyString(safe.output_directory),
    assets_directory: normalizeNonEmptyString(safe.assets_directory),
    open_after_export: normalizeBoolean(
      safe.open_after_export,
      DEFAULT_SETTINGS.open_after_export,
    ),
    page_format: normalizePageFormat(safe.page_format),
    orientation:
      typeof safe.orientation === "string" &&
      ALLOWED_ORIENTATIONS.has(safe.orientation.trim())
        ? safe.orientation.trim()
        : DEFAULT_SETTINGS.orientation,
    scale:
      typeof safe.scale === "number" && safe.scale > 0
        ? safe.scale
        : DEFAULT_SETTINGS.scale,
    page_ranges:
      typeof safe.page_ranges === "string" ? safe.page_ranges.trim() : "",
    print_background: normalizeBoolean(
      safe.print_background,
      DEFAULT_SETTINGS.print_background,
    ),
    margin: normalizeMargin(safe.margin, DEFAULT_SETTINGS.margin),
    include_default_styles: normalizeBoolean(
      safe.include_default_styles,
      DEFAULT_SETTINGS.include_default_styles,
    ),
    highlight: normalizeBoolean(safe.highlight, DEFAULT_SETTINGS.highlight),
    highlight_style:
      typeof safe.highlight_style === "string" &&
      HIGHLIGHT_STYLES.has(safe.highlight_style.trim())
        ? safe.highlight_style.trim()
        : DEFAULT_SETTINGS.highlight_style,
    breaks: normalizeBoolean(safe.breaks, DEFAULT_SETTINGS.breaks),
    emoji: normalizeBoolean(safe.emoji, DEFAULT_SETTINGS.emoji),
    math: normalizeBoolean(safe.math, DEFAULT_SETTINGS.math),
    math_options: normalizeMathOptions(safe.math_options),
    heading_anchors: normalizeBoolean(
      safe.heading_anchors,
      DEFAULT_SETTINGS.heading_anchors,
    ),
    toc: normalizeBoolean(safe.toc, DEFAULT_SETTINGS.toc),
    toc_options: normalizeTocOptions(safe.toc_options),
    display_header_footer: normalizeBoolean(
      safe.display_header_footer,
      DEFAULT_SETTINGS.display_header_footer,
    ),

    font_family: normalizeNonEmptyString(safe.font_family),

    // Structured header/footer configs – pass through as-is for the
    // config-merger / html-generator pipeline to consume.
    header: safe.header && typeof safe.header === "object" ? safe.header : null,
    footer: safe.footer && typeof safe.footer === "object" ? safe.footer : null,
  };
}

function loadSettings() {
  const raw = process.env.MARKDOWN_PDF_SETTINGS ?? "{}";
  debugLog(`MARKDOWN_PDF_SETTINGS env: ${raw}`);

  // Empty or missing env — use defaults silently
  if (!raw || raw.trim() === "" || raw.trim() === "{}") {
    return normalizeSettings({});
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(
      `[markdown-pdf] ⚠️  Could not parse settings — falling back to defaults.\n` +
        `  Reason : ${msg}\n` +
        `  Fix    : Check the "context_servers.markdown-pdf.settings" block in your Zed settings.json for syntax errors.\n` +
        `  Tip    : Use a JSON validator (e.g. https://jsonlint.com) to locate the problem.`,
    );
    debugLog(`raw settings that failed to parse: ${raw}`);
    return normalizeSettings({});
  }

  try {
    const normalized = normalizeSettings(parsed);
    debugLog(
      `normalized settings.display_header_footer: ${normalized.display_header_footer}`,
    );
    return normalized;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(
      `[markdown-pdf] ⚠️  Settings parsed but failed to normalize — falling back to defaults.\n` +
        `  Reason : ${msg}`,
    );
    return normalizeSettings({});
  }
}

const settings = loadSettings();
debugLog(
  `final loaded settings.display_header_footer: ${settings.display_header_footer}`,
);

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
    orientation:
      typeof args.orientation === "string" &&
      ALLOWED_ORIENTATIONS.has(args.orientation.trim())
        ? args.orientation.trim()
        : settings.orientation,
    scale:
      typeof args.scale === "number" && args.scale > 0
        ? args.scale
        : settings.scale,
    page_ranges:
      typeof args.page_ranges === "string"
        ? args.page_ranges.trim()
        : settings.page_ranges,
    print_background:
      typeof args.print_background === "boolean"
        ? args.print_background
        : settings.print_background,
    margin: normalizeMargin(args.margin, settings.margin),
    include_default_styles:
      typeof args.include_default_styles === "boolean"
        ? args.include_default_styles
        : settings.include_default_styles,
    highlight:
      typeof args.highlight === "boolean" ? args.highlight : settings.highlight,
    highlight_style:
      typeof args.highlight_style === "string" &&
      HIGHLIGHT_STYLES.has(args.highlight_style.trim())
        ? args.highlight_style.trim()
        : settings.highlight_style,
    breaks: typeof args.breaks === "boolean" ? args.breaks : settings.breaks,
    emoji: typeof args.emoji === "boolean" ? args.emoji : settings.emoji,
    math: typeof args.math === "boolean" ? args.math : settings.math,
    math_options:
      args.math_options && typeof args.math_options === "object"
        ? normalizeMathOptions(args.math_options, settings.math_options)
        : settings.math_options,
    heading_anchors:
      typeof args.heading_anchors === "boolean"
        ? args.heading_anchors
        : settings.heading_anchors,
    toc: typeof args.toc === "boolean" ? args.toc : settings.toc,
    toc_options:
      args.toc_options && typeof args.toc_options === "object"
        ? normalizeTocOptions(args.toc_options, settings.toc_options)
        : settings.toc_options,
    display_header_footer:
      typeof args.display_header_footer === "boolean"
        ? args.display_header_footer
        : settings.display_header_footer,

    font_family:
      normalizeNonEmptyString(args.font_family) ?? settings.font_family,
  };
}

// ── Dependency management ─────────────────────────────────────────────────────
let dependenciesPromise = null;

function ensureDependencies() {
  if (!dependenciesPromise) {
    dependenciesPromise = installDepsIfNeeded()
      .then(() => Promise.all([ensureYamlLoaded(), ensureDateFnsLoaded()]))
      .catch((error) => {
        dependenciesPromise = null;
        throw error;
      });
  }
  return dependenciesPromise;
}

async function installDepsIfNeeded() {
  const requiredPackages = [
    "playwright-core",
    "markdown-it",
    "highlight.js",
    "markdown-it-emoji",
    "@vscode/markdown-it-katex",
    "katex",
    "markdown-it-anchor",
    "markdown-it-toc-done-right",
    "yaml",
    "date-fns",
  ];

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

let hljs_module = null;
async function getHljs() {
  if (!hljs_module) {
    await ensureDependencies();
    hljs_module = (await import("highlight.js")).default;
  }
  return hljs_module;
}

let katexPlugin = null;
async function getKatexPlugin() {
  if (!katexPlugin) {
    await ensureDependencies();
    const mod = await import("@vscode/markdown-it-katex");
    // The CJS->ESM bridge nests the plugin under .default.default
    let plugin = mod.default ?? mod;
    if (typeof plugin !== "function" && typeof plugin?.default === "function") {
      plugin = plugin.default;
    }
    katexPlugin = plugin;
  }
  return katexPlugin;
}

let anchorPlugin = null;
async function getAnchorPlugin() {
  if (!anchorPlugin) {
    await ensureDependencies();
    const mod = await import("markdown-it-anchor");
    anchorPlugin = mod.default ?? mod;
  }
  return anchorPlugin;
}

let tocPlugin = null;
async function getTocPlugin() {
  if (!tocPlugin) {
    await ensureDependencies();
    const mod = await import("markdown-it-toc-done-right");
    tocPlugin = mod.default ?? mod;
  }
  return tocPlugin;
}

function ghSlugify(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^\w\sÀ-￿-]/g, "")
    .replace(/\s+/g, "-");
}

let emojiPlugin = null;
async function getEmojiPlugin() {
  if (!emojiPlugin) {
    await ensureDependencies();
    // markdown-it-emoji v3 uses named exports; `full` includes all emoji sets
    const mod = await import("markdown-it-emoji");
    emojiPlugin = mod.full ?? mod.bare ?? mod.default;
  }
  return emojiPlugin;
}

async function createMarkdown(options) {
  await ensureDependencies();
  const MarkdownIt = (await import("markdown-it")).default;

  let highlightFn = undefined;
  if (options.highlight) {
    const hljs = await getHljs();
    highlightFn = (str, lang) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return (
            '<pre class="hljs"><code>' +
            hljs.highlight(str, { language: lang, ignoreIllegals: true })
              .value +
            "</code></pre>"
          );
        } catch {
          // fall through to plain escaping
        }
      }
      return (
        '<pre class="hljs"><code>' +
        MarkdownIt().utils.escapeHtml(str) +
        "</code></pre>"
      );
    };
  }

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: options.breaks ?? false,
    highlight: highlightFn,
  });

  if (options.emoji) {
    try {
      const emoji = await getEmojiPlugin();
      md.use(emoji);
    } catch {
      debugLog("markdown-it-emoji not available, skipping emoji support");
    }
  }

  if (options.math) {
    try {
      const katex = await getKatexPlugin();
      md.use(katex, {
        throwOnError: options.math_options.throw_on_error,
        errorColor: options.math_options.error_color,
        macros: options.math_options.macros,
      });
    } catch (error) {
      debugLog(
        `KaTeX plugin not available: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (options.heading_anchors || options.toc) {
    try {
      const anchor = await getAnchorPlugin();
      md.use(anchor, { permalink: false, slugify: ghSlugify });
    } catch (error) {
      debugLog(
        `markdown-it-anchor not available: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (options.toc) {
    try {
      const toc = await getTocPlugin();
      md.use(toc, {
        level: options.toc_options.level,
        listType: options.toc_options.list_type,
        containerClass: "markdown-toc",
        slugify: ghSlugify,
      });
    } catch (error) {
      debugLog(
        `markdown-it-toc-done-right not available: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return md;
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
                orientation: {
                  type: "string",
                  enum: ["portrait", "landscape"],
                  description: "Paper orientation.",
                },
                scale: {
                  type: "number",
                  description: "Scale of the page rendering (default 1).",
                },
                page_ranges: {
                  type: "string",
                  description:
                    "Paper ranges to print, e.g. '1-5, 8, 11-13'. Empty means all pages.",
                },
                include_default_styles: {
                  type: "boolean",
                  description: "Include the built-in default CSS stylesheet.",
                },
                highlight: {
                  type: "boolean",
                  description: "Enable syntax highlighting for code blocks.",
                },
                highlight_style: {
                  type: "string",
                  enum: [...HIGHLIGHT_STYLES].sort(),
                  description:
                    "Highlight.js style filename to use (e.g. 'github.css', 'monokai.css').",
                },
                breaks: {
                  type: "boolean",
                  description:
                    "Enable hard line breaks in the Markdown renderer.",
                },
                emoji: {
                  type: "boolean",
                  description:
                    "Render :emoji: shortcodes as Unicode characters.",
                },
                math: {
                  type: "boolean",
                  description:
                    "Render LaTeX math via KaTeX. Use $inline$ and $$display$$ syntax.",
                },
                math_options: {
                  type: "object",
                  additionalProperties: false,
                  description: "KaTeX rendering options.",
                  properties: {
                    throw_on_error: {
                      type: "boolean",
                      description:
                        "If true, abort rendering on a LaTeX error. Default false (renders error inline).",
                    },
                    error_color: {
                      type: "string",
                      description: "CSS color used for inline error messages.",
                    },
                    macros: {
                      type: "object",
                      additionalProperties: { type: "string" },
                      description:
                        'User-defined LaTeX macros, e.g. {"\\\\RR": "\\\\mathbb{R}"}.',
                    },
                  },
                },
                heading_anchors: {
                  type: "boolean",
                  description:
                    "Add id slugs to headings (required infrastructure for TOC links).",
                },
                toc: {
                  type: "boolean",
                  description:
                    "Render a [[toc]] marker as an auto-generated table of contents (also enables heading anchors).",
                },
                toc_options: {
                  type: "object",
                  additionalProperties: false,
                  description: "Table-of-contents rendering options.",
                  properties: {
                    level: {
                      type: "array",
                      items: { type: "number" },
                      description: "Heading levels to include, e.g. [1, 2, 3].",
                    },
                    list_type: {
                      type: "string",
                      enum: ["ul", "ol"],
                      description: "List type for the TOC.",
                    },
                  },
                },
                display_header_footer: {
                  type: "boolean",
                  default: false,
                  description:
                    "Display header and footer on each page. Defaults to false — omit this parameter to use the saved setting (which defaults to false if not configured).",
                },

                font_family: {
                  type: "string",
                  description:
                    "CSS font-family value for the document body and header/footer. Overrides the default system font stack. Example: \"Georgia, 'Times New Roman', serif\".",
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
    settings: {
      stylesheet_path: settings.stylesheet_path,
      output_directory: settings.output_directory,
      assets_directory: settings.assets_directory,
      open_after_export: settings.open_after_export,
      page_format: settings.page_format,
      orientation: settings.orientation,
      scale: settings.scale,
      page_ranges: settings.page_ranges,
      print_background: settings.print_background,
      margin: settings.margin,
      include_default_styles: settings.include_default_styles,
      highlight: settings.highlight,
      highlight_style: settings.highlight_style,
      breaks: settings.breaks,
      emoji: settings.emoji,
      display_header_footer: settings.display_header_footer,
      font_family: settings.font_family,
    },
    default_settings: DEFAULT_SETTINGS,
    server_dir: SERVER_DIR,
    input_path: inputPath,
    debug_log: DEBUG_LOG,
  };
}

async function exportMarkdownPdf(args) {
  const inputPath = await resolveInputPath(args.input_path);
  debugLog(`exportMarkdownPdf args: ${JSON.stringify(args)}`);
  debugLog(
    `exportMarkdownPdf args.display_header_footer: ${args.display_header_footer} (type: ${typeof args.display_header_footer})`,
  );

  // ── Step 1: Read source and parse front matter ────────────────────────────
  const source = await fs.readFile(inputPath, "utf8");
  const filename = path.basename(inputPath);

  const {
    data: frontMatterData,
    body: markdownBody,
    validation: fmValidation,
    parseError: fmParseError,
  } = parseFrontMatter(source, { filename, validate: true });

  if (fmParseError) {
    debugLog(`Front matter parse error: ${fmParseError}`);
  }
  if (fmValidation && !fmValidation.valid) {
    debugLog(
      `Front matter validation errors: ${JSON.stringify(fmValidation.errors)}`,
    );
  }
  if (fmValidation && fmValidation.warnings.length > 0) {
    debugLog(
      `Front matter validation warnings: ${JSON.stringify(fmValidation.warnings)}`,
    );
  }

  const {
    title,
    author,
    pdfConfig: frontMatterPdfConfig,
    customVariables,
  } = frontMatterData;
  debugLog(
    `Parsed front matter - title: ${title}, author: ${author}, pdfConfig: ${JSON.stringify(frontMatterPdfConfig)}`,
  );

  // ── Step 2: Build effective options from args (tool call params) ──────────
  const options = buildEffectiveOptions(args);
  debugLog(
    `exportMarkdownPdf options.display_header_footer: ${options.display_header_footer}`,
  );

  // ── Step 3: Merge config (defaults < settings < front matter) ─────────────
  // Build settings object from current options (which already merged args with global settings)
  const settingsForMerge = {
    page_format: options.page_format,
    orientation: options.orientation,
    scale: options.scale,
    page_ranges: options.page_ranges,
    print_background: options.print_background,
    margin: options.margin,
    font_family: options.font_family,
    include_default_styles: options.include_default_styles,
    highlight: options.highlight,
    highlight_style: options.highlight_style,
    breaks: options.breaks,
    emoji: options.emoji,
    display_header_footer: options.display_header_footer,
    // Include structured header/footer from settings if present
    header: settings.header || null,
    footer: settings.footer || null,
  };

  const { config: mergedConfig, hasHeaderFooter } = mergeConfig(
    settingsForMerge,
    frontMatterPdfConfig,
    {
      applyDefaults: false,
    },
  );

  debugLog(`hasHeaderFooter: ${hasHeaderFooter}`);
  debugLog(`Merged config: ${JSON.stringify(mergedConfig)}`);

  // Override options with merged config values that may have come from front matter
  const effectiveOptions = {
    ...options,
    page_format: mergedConfig.page_format ?? options.page_format,
    orientation: mergedConfig.orientation ?? options.orientation,
    scale: mergedConfig.scale ?? options.scale,
    page_ranges: mergedConfig.page_ranges ?? options.page_ranges,
    print_background: mergedConfig.print_background ?? options.print_background,
    margin: mergedConfig.margin ?? options.margin,
    font_family: mergedConfig.font_family ?? options.font_family,
    include_default_styles:
      mergedConfig.include_default_styles ?? options.include_default_styles,
    highlight: mergedConfig.highlight ?? options.highlight,
    highlight_style: mergedConfig.highlight_style ?? options.highlight_style,
    breaks: mergedConfig.breaks ?? options.breaks,
    emoji: mergedConfig.emoji ?? options.emoji,
    math: mergedConfig.math ?? options.math,
    math_options:
      mergedConfig.math_options ?? options.math_options,
    heading_anchors:
      mergedConfig.heading_anchors ?? options.heading_anchors,
    toc: mergedConfig.toc ?? options.toc,
    toc_options: mergedConfig.toc_options ?? options.toc_options,
    display_header_footer:
      hasHeaderFooter ||
      mergedConfig.display_header_footer ||
      options.display_header_footer,
  };

  const outputPath = await resolveOutputPath(inputPath, options.output_path);

  // ── Step 4: Render Markdown to HTML ───────────────────────────────────────
  const { html } = await renderMarkdownToHtmlWithBody(
    inputPath,
    markdownBody,
    title,
    effectiveOptions,
  );

  await ensureChromiumInstalled();

  const chromium = await getChromium();
  const browser = await chromium.launch({ headless: true });

  let displayHeaderFooterResult = false;

  try {
    const page = await browser.newPage();

    // Write HTML to a uniquely-named temp file so parallel exports don't collide
    const { randomUUID } = await import('node:crypto');
    const tempHtmlPath = path.join(path.dirname(inputPath), `.${randomUUID()}.temp_render.html`);
    await fs.writeFile(tempHtmlPath, html, 'utf8');

    try {
      const tempUrl = pathToFileURL(tempHtmlPath).href;
      await page.goto(tempUrl, { waitUntil: "networkidle" });
    } finally {
      try {
        await fs.unlink(tempHtmlPath);
      } catch {
        // ignore cleanup errors
      }
    }

    const pdfOptions = {
      path: outputPath,
      format: effectiveOptions.page_format,
      landscape: effectiveOptions.orientation === "landscape",
      scale: effectiveOptions.scale,
      printBackground: effectiveOptions.print_background,
      margin: effectiveOptions.margin,
    };

    if (
      effectiveOptions.page_ranges &&
      effectiveOptions.page_ranges.trim() !== ""
    ) {
      pdfOptions.pageRanges = effectiveOptions.page_ranges;
    }

    debugLog(`pdfOptions before header/footer: ${JSON.stringify(pdfOptions)}`);
    debugLog(`hasHeaderFooter: ${hasHeaderFooter}`);

    // ── Step 5: Generate header/footer templates ────────────────────────────
    if (hasHeaderFooter || effectiveOptions.display_header_footer) {
      debugLog("BRANCH: header/footer is enabled");
      pdfOptions.displayHeaderFooter = true;

      // Create render context for placeholders
      const renderContext = createRenderContext({
        inputPath,
        title: title || "",
        author: author || "",
        frontMatter: { ...customVariables },
        now: new Date(),
      });

      // Create resolvers
      const placeholderResolver = createPlaceholderResolver(renderContext);
      const assetResolver = createAssetResolver({
        basePath: inputPath,
        assetsDirectory: settings.assets_directory,
      });

      // Create HTML generator
      const htmlGenerator = createHtmlGenerator({
        placeholderResolver,
        assetResolver,
        fontFamily: effectiveOptions.font_family,
      });

      // Generate header template
      if (mergedConfig.header) {
        try {
          pdfOptions.headerTemplate = await htmlGenerator.generateHeader(
            mergedConfig.header,
          );
          debugLog(
            `Generated structured header: ${pdfOptions.headerTemplate.substring(0, 200)}...`,
          );
        } catch (err) {
          debugLog(`Error generating structured header: ${err.message}`);
          pdfOptions.headerTemplate = "<span></span>";
        }
      } else {
        pdfOptions.headerTemplate = "<span></span>";
      }

      // Generate footer template
      if (mergedConfig.footer) {
        try {
          pdfOptions.footerTemplate = await htmlGenerator.generateFooter(
            mergedConfig.footer,
          );
          debugLog(
            `Generated structured footer: ${pdfOptions.footerTemplate.substring(0, 200)}...`,
          );
        } catch (err) {
          debugLog(`Error generating structured footer: ${err.message}`);
          pdfOptions.footerTemplate = "<span></span>";
        }
      } else {
        pdfOptions.footerTemplate = "<span></span>";
      }

      // Log any asset warnings
      const assetWarnings = assetResolver.getWarnings();
      if (assetWarnings.length > 0) {
        debugLog(`Asset warnings: ${JSON.stringify(assetWarnings)}`);
      }
    } else {
      debugLog("BRANCH: header/footer is disabled");
      pdfOptions.displayHeaderFooter = false;
      pdfOptions.headerTemplate = "";
      pdfOptions.footerTemplate = "";
    }

    debugLog(`final pdfOptions: ${JSON.stringify(pdfOptions)}`);
    displayHeaderFooterResult = pdfOptions.displayHeaderFooter;
    await page.pdf(pdfOptions);
  } finally {
    await browser.close();
  }

  if (effectiveOptions.open_after_export) {
    void openFile(outputPath);
  }

  return {
    input_path: inputPath,
    output_path: outputPath,
    backend: "Playwright/Chromium",
    page_format: effectiveOptions.page_format,
    orientation: effectiveOptions.orientation,
    scale: effectiveOptions.scale,
    print_background: effectiveOptions.print_background,
    margin: effectiveOptions.margin,
    open_after_export: effectiveOptions.open_after_export,
    display_header_footer: displayHeaderFooterResult,
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

/**
 * Render Markdown to HTML with pre-parsed body and title.
 * Used by the new structured header/footer pipeline where front matter
 * is already parsed.
 */
async function renderMarkdownToHtmlWithBody(inputPath, body, title, options) {
  const markdown = await createMarkdown(options);
  const rendered = markdown.render(body);

  // Build style blocks
  let styleBlocks = "";

  if (options.include_default_styles) {
    const defaultCss = await fs.readFile(DEFAULT_CSS_PATH, "utf8");
    styleBlocks += `<style>${defaultCss}</style>\n    `;
  }

  // Font family override (after default CSS so it wins over the root stack)
  if (options.font_family) {
    styleBlocks += `<style>:root { font-family: ${options.font_family}; }</style>\n    `;
  }

  // KaTeX stylesheet (with inlined fonts when bundled, else read from node_modules)
  if (options.math) {
    try {
      const vendorCss = path.join(SERVER_DIR, "vendor", "katex-inline.css");
      const katexCssPath = (await fileExists(vendorCss))
        ? vendorCss
        : path.join(SERVER_DIR, "node_modules", "katex", "dist", "katex.min.css");
      const katexCss = await fs.readFile(katexCssPath, "utf8");
      styleBlocks += `<style>${katexCss}</style>\n    `;
    } catch (error) {
      debugLog(
        `Could not load KaTeX CSS: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Highlight.js stylesheet
  if (options.highlight && options.highlight_style) {
    try {
      const hljsStylesDir = path.join(
        SERVER_DIR,
        "node_modules",
        "highlight.js",
        "styles",
      );
      const hljsCssPath = path.join(hljsStylesDir, options.highlight_style);
      const hljsCss = await fs.readFile(hljsCssPath, "utf8");
      styleBlocks += `<style>${hljsCss}</style>\n    `;
    } catch {
      debugLog(`Could not load highlight style: ${options.highlight_style}`);
    }
  }

  // Custom stylesheet
  const stylesheetPath = resolveStylesheetPath(
    path.dirname(inputPath),
    options.stylesheet_path,
  );
  if (stylesheetPath) {
    try {
      const customCss = await fs.readFile(stylesheetPath, "utf8");
      styleBlocks += `<style>${customCss}</style>\n    `;
    } catch {
      debugLog(`Could not load stylesheet: ${stylesheetPath}`);
    }
  }

  const baseHref = `${pathToFileURL(path.dirname(inputPath)).href}/`;

  return {
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <base href="${baseHref}">
    ${styleBlocks}
  </head>
  <body>
    <main>
      ${rendered}
    </main>
  </body>
</html>`,
    title,
  };
}

/**
 * Original render function - reads file and parses front matter internally.
 * Kept for backward compatibility.
 */
async function renderMarkdownToHtml(inputPath, options) {
  const source = await fs.readFile(inputPath, "utf8");
  const { body, title } = splitFrontmatter(source, inputPath);

  return renderMarkdownToHtmlWithBody(inputPath, body, title, options);
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
