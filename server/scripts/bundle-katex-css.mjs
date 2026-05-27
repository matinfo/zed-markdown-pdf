#!/usr/bin/env node
// Build-time bundler: produces server/vendor/katex-inline.css with every
// font file rewritten as a base64 data: URI. Ships in the release tarball
// so KaTeX renders correctly without external font requests.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(SCRIPT_DIR, "..");
const KATEX_DIST = path.join(SERVER_DIR, "node_modules", "katex", "dist");
const FONTS_DIR = path.join(KATEX_DIST, "fonts");
const SOURCE_CSS = path.join(KATEX_DIST, "katex.min.css");
const OUT_DIR = path.join(SERVER_DIR, "vendor");
const OUT_FILE = path.join(OUT_DIR, "katex-inline.css");

// Inline only woff2 (Chromium supports it, smallest format). Drop the
// `url(...woff)` and `url(...ttf)` references entirely so the browser does
// not attempt missing-font network requests.

const fontCache = new Map();
async function woff2DataUri(file) {
  if (fontCache.has(file)) return fontCache.get(file);
  const buf = await fs.readFile(path.join(FONTS_DIR, file));
  const uri = `data:font/woff2;base64,${buf.toString("base64")}`;
  fontCache.set(file, uri);
  return uri;
}

async function main() {
  let css = await fs.readFile(SOURCE_CSS, "utf8");

  // Replace each `src: ...;` declaration that mentions a KaTeX font with a
  // single `src: url(<woff2 data uri>) format("woff2");` rule.
  const SRC_RE = /src:\s*([^;]+);/g;
  const URL_RE = /url\(\s*(?:'([^']+)'|"([^"]+)"|([^)]+?))\s*\)/g;

  const rewrites = [];
  let match;
  while ((match = SRC_RE.exec(css))) {
    const block = match[1];
    if (!block.includes("fonts/")) continue;

    let woff2File = null;
    let urlMatch;
    URL_RE.lastIndex = 0;
    while ((urlMatch = URL_RE.exec(block))) {
      const ref = (urlMatch[1] || urlMatch[2] || urlMatch[3] || "").trim();
      if (ref.startsWith("fonts/") && ref.toLowerCase().endsWith(".woff2")) {
        woff2File = path.basename(ref);
        break;
      }
    }
    if (!woff2File) continue;

    const dataUri = await woff2DataUri(woff2File);
    rewrites.push({
      raw: match[0],
      replacement: `src: url(${dataUri}) format("woff2");`,
    });
  }

  let out = css;
  for (const { raw, replacement } of rewrites) {
    out = out.replace(raw, replacement);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, out, "utf8");
  const stat = await fs.stat(OUT_FILE);
  console.log(`Wrote ${OUT_FILE} (${(stat.size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
