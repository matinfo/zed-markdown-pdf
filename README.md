# Markdown PDF for Zed

Export Markdown files to high-quality PDFs directly from Zed using Playwright and Chromium.

## Overview

Markdown PDF adds a context server to Zed that lets the AI assistant export Markdown documents to PDF with:

- **Syntax highlighting** for fenced code blocks via highlight.js (80+ themes)
- **Emoji shortcodes** rendered to Unicode via markdown-it-emoji
- **Structured header/footer** with zones (left, center, right), custom variables, and date formatting
- **Per-document overrides** via YAML front matter (`markdown-pdf:` block)
- **Configurable page layout** — format, orientation, scale, margins, page ranges
- **Custom CSS** support appended after the built-in neutral stylesheet
- **Automatic setup** — npm dependencies and Chromium install themselves on first use

---

## Features

- Native Zed integration through a context server (MCP)
- Markdown to PDF powered by Playwright / Chromium
- Neutral, GitHub-style built-in stylesheet (or disable it and bring your own)
- Syntax highlighting via highlight.js — 80+ themes to choose from
- Emoji `:shortcode:` rendering via markdown-it-emoji
- Hard line-break mode for poetry or source-formatted text
- Structured header/footer with zones, typed elements, and custom variables
- Per-document settings via YAML front matter (`markdown-pdf:` block)
- Portrait and landscape orientation
- Page scale factor
- Page ranges (print only selected pages)
- Per-export overrides for every PDF option
- Slash commands `/export-pdf` and `/export-pdf-with-headers` in the assistant panel
- Automatic relative asset resolution (local images, fonts, …)
- Built-in diagnostic tool (`doctor_markdown_pdf`)
- Cross-platform: macOS, Linux, Windows

---

## Requirements

To install the extension from source (dev extension):

- Rust with the `wasm32-wasip1` target
- Node.js 18 or newer

```bash
rustup target add wasm32-wasip1
node --version   # must be ≥ 18
```

---

## Installation

### Install as a dev extension

1. Open Zed
2. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run `zed: install dev extension`
4. Select the root folder of this repository

Zed will compile and install the extension.

### Enable the context server

1. Open Zed Settings
2. Go to **Agent → Context Servers**
3. Enable **markdown-pdf**

---

## First Run

On the very first export the server installs itself:

```
Installing npm dependencies (first run)…
Chromium not found, installing automatically…
Chromium installed successfully.
```

Both steps happen only once. If automatic installation fails, run manually:

```bash
# macOS
cd ~/Library/Application\ Support/Zed/extensions/installed/markdown-pdf/server

# Linux
cd ~/.local/share/zed/extensions/installed/markdown-pdf/server

npm install
node node_modules/playwright-core/cli.js install chromium
```

---

## Usage

### Slash Commands

The extension registers two slash commands in the Zed assistant panel. Type `/` to
invoke them — they are the quickest way to trigger an export without writing a prompt:

| Command | What it does |
|---------|--------------|
| `/export-pdf` | Export the current Markdown file to PDF with default settings |
| `/export-pdf README.md` | Export a specific file (path resolved from the worktree root) |
| `/export-pdf-with-headers` | Export the current file with `display_header_footer: true` |
| `/export-pdf-with-headers README.md` | Targeted export with header and footer |

> **Note:** Zed's WASM extension API does not expose a Cmd+Shift+P command-palette
> registration hook, so these live in the assistant panel (`/`) rather than the global
> palette. This is the closest equivalent the current Zed extension API allows.

> ⚠️ **Zed Agent users:** Slash commands from extensions are **not supported** in the
> Agent panel. If you type `/export-pdf` there you will see:
> *"The /export-pdf command is not supported by Zed Agent."*
> Use natural language instead — the agent calls the MCP tool automatically:
> `Export README.md to PDF`

### Natural-language prompts

You can also open any Markdown file and describe what you want to the assistant:

| Prompt | What happens |
|--------|-------------|
| `Export this file to PDF` | Generates a PDF next to the source file |
| `Export to build/report.pdf with monokai theme` | Custom output path + highlight theme |
| `Export in landscape A4 with header and footer` | Orientation + header/footer enabled |
| `Run doctor_markdown_pdf` | Shows Chromium status and active settings |

### MCP tools

The extension exposes two MCP tools directly callable by the AI:

- **`export_markdown_pdf`** — convert a Markdown file to PDF
- **`doctor_markdown_pdf`** — inspect Chromium availability and current settings

---

## Settings

Place settings in your Zed `settings.json` under `context_servers.markdown-pdf.settings`.

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "page_format": "A4",
        "orientation": "portrait",
        "print_background": true,
        "highlight": true,
        "highlight_style": "github.css",
        "emoji": true,
        "display_header_footer": false,
        "open_after_export": false,
        "margin": {
          "top": "15mm",
          "right": "15mm",
          "bottom": "15mm",
          "left": "15mm"
        }
      }
    }
  }
}
```

### Output

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `output_directory` | `string \| null` | `null` | Directory for the output PDF. Relative to the Markdown file. |
| `open_after_export` | `boolean` | `false` | Open the PDF in the system viewer after export. |

### Page Layout

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `page_format` | `string` | `"A4"` | Paper size: `A4`, `Letter`, `Legal`, `Tabloid`, `Ledger`, `A0`–`A3`, `A5`, `A6`. |
| `orientation` | `string` | `"portrait"` | `"portrait"` or `"landscape"`. |
| `scale` | `number` | `1` | Page rendering zoom (0.1 – 2). |
| `page_ranges` | `string` | `""` | Pages to print, e.g. `"1-5, 8, 11-13"`. Empty = all pages. |
| `print_background` | `boolean` | `true` | Print background colours and images. |
| `margin` | `object` | see below | Per-side page margins as CSS length strings. |

Default margins: `{ "top": "15mm", "right": "15mm", "bottom": "15mm", "left": "15mm" }`

### Content / Rendering

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `font_family` | `string \| null` | `null` | CSS `font-family` value for the document body **and** header/footer. `null` keeps the default system-font stack. Example: `"Georgia, 'Times New Roman', serif"`. |
| `include_default_styles` | `boolean` | `true` | Include the built-in neutral CSS. Set `false` to use only your own `stylesheet_path`. |
| `stylesheet_path` | `string \| null` | `null` | Path to a custom CSS file appended after built-in styles. Relative to the Markdown file. |
| `breaks` | `boolean` | `false` | Convert single newlines inside paragraphs to hard `<br>` line breaks. |
| `emoji` | `boolean` | `true` | Render `:shortcode:` emoji (`:wave:` → 👋). |

### Syntax Highlighting

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `highlight` | `boolean` | `true` | Enable syntax highlighting for fenced code blocks. |
| `highlight_style` | `string` | `"github.css"` | Highlight.js theme filename. See the list below. |

Popular themes:

| Theme | Style |
|-------|-------|
| `github.css` | Light GitHub (default) |
| `github-dark.css` | Dark GitHub |
| `monokai.css` | Classic Monokai |
| `atom-one-dark.css` | Atom One Dark |
| `vs.css` | Visual Studio light |
| `vs2015.css` | Visual Studio dark |
| `nord.css` | Nord |
| `tokyo-night-dark.css` | Tokyo Night dark |
| `rose-pine.css` | Rosé Pine |
| `a11y-light.css` | Accessible light |
| `a11y-dark.css` | Accessible dark |
| `obsidian.css` | Dark Obsidian |
| `stackoverflow-light.css` | Stack Overflow light |
| `stackoverflow-dark.css` | Stack Overflow dark |

Browse all 80+ themes at the [highlight.js demo](https://highlightjs.org/demo).

### Header and Footer

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `display_header_footer` | `boolean` | `false` | Show header and footer on every page. |
| `header` | `object \| null` | `null` | Structured header configuration. |
| `footer` | `object \| null` | `null` | Structured footer configuration. |

When `header` or `footer` is configured, `display_header_footer` is automatically enabled.

---

### Structured Header/Footer (Recommended)

The structured format uses zones (`left`, `center`, `right`) with typed elements:

```json
{
  "header": {
    "height": "15mm",
    "padding": "0 10mm",
    "font_size": "9px",
    "border_bottom": "1px solid #ddd",
    "left": {
      "type": "image",
      "src": "./logo.svg",
      "height": "12mm"
    },
    "center": {
      "type": "title",
      "font_style": "italic"
    },
    "right": {
      "type": "date",
      "format": "MMMM d, yyyy"
    }
  },
  "footer": {
    "height": "10mm",
    "center": {
      "type": "text",
      "content": "Page {page} of {pages}"
    }
  }
}
```

#### Element Types

| Type | Description | Key Properties |
|------|-------------|----------------|
| `text` | Static or dynamic text | `content` (with placeholders) |
| `image` | Embedded image (SVG, PNG, JPG) | `src`, `height`, `width` |
| `page_number` | Current page number | `format` (e.g., `"Page {page}"`) |
| `total_pages` | Total page count | `format` |
| `date` | Formatted date/time | `format` (date-fns pattern) |
| `title` | Document title | `fallback` |
| `spacer` | Flexible space | `width` (fixed) or flex |

#### Placeholders

Use placeholders in `text` elements or `format` strings:

| Placeholder | Description |
|-------------|-------------|
| `{page}` | Current page number (Chromium) |
| `{pages}` | Total pages (Chromium) |
| `{date}` | Current date (ISO format) |
| `{date:FORMAT}` | Formatted date (date-fns) |
| `{title}` | Document title |
| `{filename}` | Source filename |
| `{author}` | Author from front matter |
| `{custom}` | Any front matter variable |

#### Date Formats (date-fns)

| Format | Example |
|--------|---------|
| `yyyy-MM-dd` | 2025-06-14 |
| `MMMM d, yyyy` | June 14, 2025 |
| `MM/dd/yyyy` | 06/14/2025 |
| `dd.MM.yyyy` | 14.06.2025 |
| `d MMMM yyyy` | 14 June 2025 |

#### Shorthand Properties

For simple cases, use shorthand instead of full element definitions:

```json
{
  "header": {
    "left_image": "./logo.svg",
    "left_image_height": "12mm",
    "center_text": "{title}",
    "right_text": "{date:MMMM d, yyyy}"
  }
}
```

#### Container Properties

| Property | Description |
|----------|-------------|
| `height` | Header/footer height (e.g., `"15mm"`) |
| `padding` | CSS padding (e.g., `"0 10mm"`) |
| `font_family` | Default font for all text |
| `font_size` | Default font size |
| `color` | Default text color |
| `border_bottom` | Header bottom border |
| `border_top` | Footer top border |
| `background` | Background color |

---

## Per-Export Overrides

Every setting can also be passed directly in the tool call for a one-off override.
Just describe what you want to the assistant:

```
Export this to PDF in landscape, Letter format, with the monokai theme,
header and footer enabled, and output it to build/slides.pdf
```

Margin overrides are merged: omitted sides fall back to your configured defaults.

---

## Front Matter

### Document Title

The YAML front matter `title` field is used as the document title (HTML `<title>` and Chromium's `<span class="title">`).

```markdown
---
title: My Report
---

# Content starts here
```

If no `title` is present, the filename stem is used.

### Per-Document PDF Settings

Override any setting for a specific document using the `markdown-pdf:` block:

```markdown
---
title: Quarterly Report
author: Jane Smith
company: Acme Corp
version: 1.0.0
markdown-pdf:
  page_format: Letter
  orientation: landscape
  header:
    height: 18mm
    padding: 0 15mm
    border_bottom: 1px solid #ccc
    left:
      - type: text
        content: "{company}"
        font_weight: bold
    center:
      type: title
      font_style: italic
    right:
      type: date
      format: MMMM d, yyyy
  footer:
    height: 12mm
    left:
      type: text
      content: "v{version}"
      color: "#666"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "{author}"
---

# Content starts here
```

**Custom variables:** Any front matter field (like `company`, `version`) becomes
available as a `{fieldname}` placeholder in headers and footers.

**Priority order:** Front matter settings override global settings, which override defaults.

---

## Custom Styling

Append a custom stylesheet to control the PDF appearance:

```css
/* custom.css */
body {
  font-family: Georgia, serif;
  font-size: 12pt;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
}
```

```json
{
  "stylesheet_path": "./custom.css"
}
```

Set `"include_default_styles": false` to use your stylesheet exclusively, without the built-in neutral CSS.

---

## Page Break Helper

The built-in stylesheet provides a `.page` utility class for hard page breaks:

```html
<div class="page"></div>
```

Place it anywhere in your Markdown (HTML pass-through is enabled by default).

---

## Project Structure

```
.
├── src/
│   └── lib.rs                        # Rust Zed extension
├── configuration/
│   ├── installation_instructions.md  # Shown in Zed's context server UI
│   ├── settings_schema.json          # JSON Schema for settings validation
│   └── default_settings.json        # Default values
├── server/
│   ├── markdown_pdf_server.mjs       # MCP server (Node.js)
│   ├── default.css                   # Built-in neutral stylesheet
│   └── package.json
├── test-fixtures/
├── Cargo.toml
└── extension.toml
```

---

## Development

### Rust extension

```bash
rustup target add wasm32-wasip1
```

### Server

```bash
cd server
npm install
npm run check    # syntax check
npm test         # end-to-end export test
```

### Testing in Zed

1. Install as a dev extension
2. Enable `markdown-pdf` in Agent → Context Servers
3. Open `test-fixtures/sample.md`
4. Ask: `Export this file to PDF`

---

## Troubleshooting

### Dev extension fails to build

Ensure Rust and the WASM target are installed:

```bash
rustup target add wasm32-wasip1
```

On macOS with multiple Rust installations, ensure `rustc`, `cargo`, and `rustup` all resolve from `~/.cargo/bin`.

### Context server does not start

- Confirm `markdown-pdf` is enabled in **Agent → Context Servers**
- Restart Zed
- Check Zed logs (**Help → View Logs**)
- Inspect the debug log at `/tmp/zed-markdown-pdf-debug.log` (macOS/Linux)

### PDF export fails

Ask the assistant:

```
Run doctor_markdown_pdf
```

This reports Chromium availability, active settings, and the server directory in one call.

### Chromium installation fails

```bash
cd server
npm install
node node_modules/playwright-core/cli.js install chromium
```

---

## Architecture

### Rust Zed extension (`src/lib.rs`)

- Registers the extension with Zed
- Exposes context server configuration and settings schema
- Passes `MARKDOWN_PDF_SETTINGS` env var to the Node server

### Node.js MCP server (`server/markdown_pdf_server.mjs`)

- Handles MCP tool calls over stdio
- Renders Markdown → HTML with `markdown-it`, `highlight.js`, `markdown-it-emoji`
- Converts HTML → PDF with Playwright / Chromium
- Self-installs npm dependencies and Chromium on first run

---

## Why Playwright

Playwright provides a full browser rendering engine, which means:

- accurate CSS rendering (Flexbox, Grid, custom fonts, `@media print`)
- reliable pagination and page breaks
- native PDF header/footer support with page numbers
- correct resolution of local assets (images, fonts)

---

## License

MIT