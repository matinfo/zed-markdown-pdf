
# Installation instruction

This extension exports Markdown files to PDF using a modern,
fully automated pipeline:

1. Render Markdown to HTML with `markdown-it`
2. Apply built-in print stylesheet and optional user CSS
3. Convert HTML to PDF with Playwright's Chromium browser

## Zero external dependencies

Unlike traditional PDF exporters, this extension requires **no manual system installation**.

This extension bundle includes the server's JavaScript dependencies for normal
dev installs. If `server/node_modules` is missing, the server will repair it by
running `npm install` the first time you use a tool.

## Automatic browser setup

On your first PDF export, Chromium (~150MB) will download automatically in
the background. You'll see a brief message while it installs:

```sh
Chromium not found, installing automatically (this may take a few minutes)...
Chromium installed successfully
```

This happens only once. The browser is cached on your system and shared across
all Playwright-based tools. Subsequent exports are instant and work identically
on macOS, Linux, and Windows.

**If automatic installation fails**, you can manually install Chromium:

```sh
# macOS
cd ~/Library/Application\ Support/Zed/extensions/installed/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium

# Linux
cd ~/.local/share/zed/extensions/installed/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium
```

## Usage

After enabling the server:

1. Open any Markdown file in Zed
2. Ask the AI assistant: "Export this to PDF"
3. The `export_markdown_pdf` tool will generate a high-quality PDF
4. On first use, wait a few minutes for automatic Chromium installation

No manual setup required. It just works.
