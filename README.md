
# Markdown PDF for Zed

Export Markdown files to high-quality PDFs directly from Zed using Playwright and Chromium.

## Overview

Markdown PDF adds a context server to Zed that lets the assistant export Markdown documents to PDF with:

- custom CSS styling
- configurable page format and margins
- optional automatic opening after export
- relative asset resolution for local images and files
- per-export overrides for output path, stylesheet, margins, and more

The extension is designed for a smooth first-run experience:
- npm dependencies are installed automatically when needed
- Chromium is installed automatically on first PDF export

---

## Features

- Native Zed integration through a context server
- Markdown to PDF conversion powered by Playwright and Chromium
- Custom stylesheet support
- Configurable default output directory
- Configurable default page format and margins
- Per-export overrides for key PDF options
- Automatic relative asset resolution from the Markdown file location
- Cross-platform support for macOS, Linux, and Windows
- Built-in diagnostic tool with `doctor_markdown_pdf`

---

## Requirements

For local development and dev-extension installation in Zed:

- Rust installed via `rustup`
- `wasm32-wasip1` target installed
- Node.js 18 or newer

Example:

```bash
rustup target add wasm32-wasip1
node --version
````

---

## Installation

### Install as a dev extension

1. Open Zed
2. Open the command palette

   * macOS: `Cmd+Shift+P`
   * Windows/Linux: `Ctrl+Shift+P`
3. Run:

```text
zed: install dev extension
```

4. Select the root folder of this repository

Zed will compile and install the extension.

### Enable the context server

1. Open Zed settings
2. Go to **Agent** → **Context Servers**
3. Enable **markdown-pdf**

---

## First Run

On first use, the server may need to install:

* npm dependencies
* Chromium for Playwright

You may see messages such as:

```text
Installing npm dependencies (first run)…
Chromium not found, installing automatically…
Chromium installed successfully.
```

This setup normally happens only once.

If automatic installation fails, install Chromium manually from the `server/` directory:

```bash
cd server
npm install
node node_modules/playwright-core/cli.js install chromium
```

---

## Usage

Open a Markdown file in Zed, then ask the assistant something like:

* `Export this file to PDF`
* `Export this Markdown file to build/output.pdf`
* `Export this file to PDF with a custom stylesheet`
* `Run doctor_markdown_pdf`

The extension exposes two tools:

* `export_markdown_pdf`
* `doctor_markdown_pdf`

---

## Settings

Configure defaults in Zed settings.

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "stylesheet_path": "./custom.css",
        "output_directory": "./pdf",
        "page_format": "A4",
        "open_after_export": false,
        "print_background": true,
        "margin": {
          "top": "18mm",
          "right": "18mm",
          "bottom": "18mm",
          "left": "18mm"
        }
      }
    }
  }
}
```

### Available Settings

| Setting             | Type      | Description                                             |
| ------------------- | --------- | ------------------------------------------------------- |
| `stylesheet_path`   | `string`  | Optional CSS file applied after the built-in stylesheet |
| `output_directory`  | `string`  | Optional output directory for exported PDFs             |
| `page_format`       | `string`  | Default paper format such as `A4`, `Letter`, or `Legal` |
| `open_after_export` | `boolean` | Automatically open the generated PDF                    |
| `print_background`  | `boolean` | Include background colors and images in the PDF         |
| `margin`            | `object`  | Default page margins for PDF export                     |

### Supported Page Formats

* `A0`
* `A1`
* `A2`
* `A3`
* `A4`
* `A5`
* `A6`
* `Letter`
* `Legal`
* `Tabloid`
* `Ledger`

---

## Per-Export Overrides

In addition to default settings, the export tool supports per-call overrides for:

* `output_path`
* `stylesheet_path`
* `open_after_export`
* `page_format`
* `print_background`
* `margin`

Example request:

```text
Export this file to PDF with 10mm top margin, 12mm bottom margin, and output it to build/report.pdf
```

Per-call margin overrides are merged with defaults, so omitted sides fall back to configured settings.

---

## Custom Styling

You can apply a custom stylesheet to control the PDF appearance.

Example:

```css
body {
  font-family: Georgia, serif;
  font-size: 12pt;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
}
```

Then configure:

```json
{
  "stylesheet_path": "./custom.css"
}
```

---

## Project Structure

```text
.
├─ src/
│  └─ lib.rs
├─ configuration/
│  ├─ installation_instructions.md
│  ├─ settings_schema.json
│  └─ default_settings.json
├─ server/
│  ├─ markdown_pdf_server.mjs
│  ├─ default.css
│  └─ package.json
├─ test-fixtures/
├─ Cargo.toml
└─ extension.toml
```

---

## Development

### Rust extension

Install the required Rust target:

```bash
rustup target add wasm32-wasip1
```

### Server

Install server dependencies:

```bash
cd server
npm install
```

### Validate server syntax

```bash
npm run check
```

### Run the server test fixture

```bash
npm run test
```

---

## Testing in Zed

1. Install the extension as a dev extension
2. Enable the `markdown-pdf` context server
3. Open `test-fixtures/sample.md`
4. Ask:

```text
Export this file to PDF
```

5. Confirm that a PDF is generated

You can also run:

```text
Run doctor_markdown_pdf
```

to verify that the environment is correctly configured.

---

## Troubleshooting

### Dev extension fails to install

Make sure Rust is installed with `rustup` and the WebAssembly target is available:

```bash
rustup target add wasm32-wasip1
```

Also verify that `rustc`, `cargo`, and `rustup` come from `~/.cargo/bin` if you are on macOS with multiple Rust installations.

### Context server does not start

* Verify that `markdown-pdf` is enabled in Zed settings
* Restart Zed
* Check Zed logs
* Inspect the server debug log written to the system temp directory

### PDF export fails

Run:

```text
Run doctor_markdown_pdf
```

Then verify:

* Chromium is installed
* npm dependencies are installed
* the Markdown file exists
* stylesheet and output paths are valid

### Chromium installation fails

From the `server/` directory:

```bash
npm install
node node_modules/playwright-core/cli.js install chromium
```

---

## Architecture

This extension consists of two parts:

### 1. Rust Zed extension

Responsible for:

* registering the extension
* exposing the context server configuration
* passing settings from Zed to the server

### 2. Node.js MCP server

Responsible for:

* handling tool calls
* rendering Markdown to HTML
* generating PDFs with Playwright and Chromium
* installing npm dependencies and Chromium when needed

---

## Why Playwright

Playwright provides a robust browser-based rendering engine for Markdown to PDF export, which enables:

* modern CSS support
* reliable print rendering
* accurate pagination
* good compatibility with local assets and stylesheets

---

## Diagnostics

The `doctor_markdown_pdf` tool helps inspect:

* whether Chromium is available
* the active server settings
* the server directory
* the debug log location
* path resolution context

This is the fastest way to diagnose setup and runtime issues.

---

## Roadmap Ideas

Potential future improvements:

* header and footer templates
* page numbering options
* table of contents generation
* theme presets
* direct command palette actions for export
* multi-file export workflows

---

## License

MIT
