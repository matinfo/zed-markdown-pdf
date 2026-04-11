# Test Fixtures

This directory contains the sample files and the end-to-end test runner used
for both automated CI and manual interactive testing in Zed.

---

## Contents

| File | Purpose |
|------|---------|
| `sample.md` | Reference Markdown input that exercises every rendering feature |
| `custom.css` | Custom stylesheet fixture for CSS-override scenarios |
| `test-export.mjs` | End-to-end test runner (8 scenarios, MCP NDJSON transport) |
| `README.md` | This file |
| `sample.pdf` | Last generated output from the default scenario (committed for reference) |

---

## Running the tests

From the `server/` directory:

```sh
npm test
```

This is equivalent to:

```sh
node ../test-fixtures/test-export.mjs
```

### CLI flags

| Flag | Effect |
|------|--------|
| *(none)* | Run all 8 scenarios, delete output PDFs on exit |
| `--keep` | Keep all generated PDFs in `test-fixtures/` after the run |
| `--verbose` | Print every server stderr line and extra failure detail |

### Examples

```sh
# Run all scenarios and keep the PDFs so you can open them
node test-export.mjs --keep

# Debugging a failure with full server output
node test-export.mjs --verbose

# Both flags together
node test-export.mjs --keep --verbose
```

---

## Test scenarios

The runner starts **one server process** and executes all scenarios through it
sequentially, reusing the same Chromium instance. Per-call argument overrides
are used for each scenario so no server restart is needed.

| # | Name | What it tests |
|---|------|---------------|
| 01 | Default export | A4, `github.css` highlight theme, emoji enabled — the baseline |
| 02 | Dark highlight theme | `atom-one-dark.css` syntax highlighting with `print_background: true` |
| 03 | Header and footer | `display_header_footer: true` — `%%ISO-DATE%%`, title span, page numbers |
| 04 | Landscape orientation | A4 landscape at `scale: 0.9` |
| 05 | Custom stylesheet (stacked) | Built-in neutral styles + `custom.css` appended on top |
| 06 | No default styles | `include_default_styles: false` — `custom.css` as the sole stylesheet |
| 07 | Hard line breaks | `breaks: true` — single newlines become `<br>` elements |
| 08 | Highlight disabled | `highlight: false` — plain preformatted code, no hljs CSS injected |

Each scenario:
- Exports `sample.md` to a unique output file (`out-01-default.pdf`, etc.)
- Asserts the output file exists and is above a minimum size threshold
- Reports the output size and elapsed time on pass, or the failure reason on fail

### Baseline server settings

The server is started with these defaults (all overridable per scenario):

```json
{
  "open_after_export": false,
  "page_format": "A4",
  "highlight": true,
  "highlight_style": "github.css",
  "emoji": true,
  "breaks": false,
  "print_background": true,
  "include_default_styles": true,
  "display_header_footer": false,
  "orientation": "portrait",
  "scale": 1,
  "margin": { "top": "15mm", "right": "15mm", "bottom": "15mm", "left": "15mm" }
}
```

---

## sample.md — feature coverage

The fixture Markdown file is structured to exercise each rendering feature in
its own named section:

| Section | Feature exercised |
|---------|-------------------|
| Text Formatting | inline code, bold, italic, strikethrough, links, h4–h6 headings |
| Emoji | `:shortcode:` rendering via markdown-it-emoji, inline and in a table |
| Syntax Highlighting | code fences in TypeScript, Rust, JavaScript, Bash, SQL, JSON, YAML |
| Hard Line Breaks | consecutive single-newline lines to show `breaks` on vs off |
| Lists | nested unordered, nested ordered, task list with checkboxes |
| Blockquotes | single-level, emoji in blockquote, triple-nested |
| Tables | feature matrix with emoji checkmarks, highlight theme reference table |
| Inline HTML | styled `<div>` callout, `<details>` collapsible element |
| Page Break | `<div class="page"></div>` — forces a hard page break |
| Content After Break | verifies rendering continues correctly after a page break |
| Long paragraphs | reflow and pagination stress test |

---

## custom.css — what it demonstrates

`custom.css` is a complete, real-world stylesheet override using a serif body
font and blue heading accents. It is used by scenarios **05** and **06**.

Key points:

- **`pre:not(.hljs)`** receives the custom box style (blue left border, light
  background). This avoids fighting with highlight.js-generated `pre.hljs`
  blocks, which control their own background and text colours.
- **`pre.hljs`** gets only the left-accent border and layout rules — the active
  hljs theme supplies everything else.
- **`.page`** forces a page break (matches the built-in default.css utility
  class name). The old `.page-break` alias has been removed.
- **`.avoid-break`** prevents a page break inside an element (useful for tables
  and figures).

---

## Manual testing in Zed

1. Install the extension as a dev extension
2. Enable `markdown-pdf` in **Agent → Context Servers**
3. Open `test-fixtures/sample.md`
4. Ask the assistant:

```
Export this file to PDF
```

5. Confirm that `sample.pdf` is created next to `sample.md`

To test a specific scenario interactively:

```
Export this file to PDF using the atom-one-dark theme with header and footer enabled
```

```
Export this file to PDF in landscape, scale 0.9, with custom stylesheet test-fixtures/custom.css
```

---

## Troubleshooting

### Chromium downloads on first run

On the very first export, Chromium (~150 MB) downloads automatically. The test
runner handles this gracefully — it passes the `doctor_markdown_pdf` check even
when Chromium is not yet installed, then waits up to 3 minutes per scenario for
the download and first render to complete.

### A scenario fails with "output too small"

The minimum size threshold is intentionally conservative (40 KB for most
scenarios, 20 KB for the no-default-styles scenario). If a scenario consistently
produces a file that is smaller than the threshold, the rendered HTML may be
empty or truncated — run with `--verbose` to see server-side error output.

### Keeping the output PDFs

Pass `--keep` to retain all generated PDFs after the run. Open them in a PDF
viewer to visually verify each scenario:

```sh
node test-export.mjs --keep
open out-01-default.pdf          # macOS
xdg-open out-01-default.pdf      # Linux
```
