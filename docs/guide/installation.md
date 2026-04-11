# Installation

This guide walks you through installing the Markdown PDF extension for Zed.

## Prerequisites

Before installing, ensure you have:

- **Zed Editor** — [Download from zed.dev](https://zed.dev)
- **Node.js 18+** — Required for the MCP server
- **Rust with WASM target** — Only for dev extension installation

```bash
# Check Node.js version
node --version   # Must be ≥ 18

# Add Rust WASM target (for dev extension only)
rustup target add wasm32-wasip1
```

## Installation Methods

### From Zed Extensions (Recommended)

1. Open Zed
2. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Search for **Extensions: Install Extension**
4. Search for `markdown-pdf`
5. Click **Install**

### As a Dev Extension

For development or to use the latest unreleased features:

1. Clone the repository:
   ```bash
   git clone https://github.com/matinfo/zed-markdown-pdf.git
   ```

2. Open Zed

3. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)

4. Run **zed: install dev extension**

5. Select the `zed-markdown-pdf` folder

Zed will compile and install the extension automatically.

## Enable the Context Server

After installation, enable the context server:

1. Open Zed Settings (`Cmd+,` / `Ctrl+,`)
2. Navigate to **Agent → Context Servers**
3. Find **markdown-pdf** and enable it

Or add to your `settings.json`:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "enabled": true
    }
  }
}
```

## Automatic Setup

On first use, the extension automatically:

1. **Downloads the MCP server** from GitHub releases
2. **Installs npm dependencies** (~30 seconds)
3. **Downloads Chromium** (~150 MB, ~2 minutes)

You'll see progress messages:

```
Installing npm dependencies (first run)…
Chromium not found, installing automatically…
Chromium installed successfully.
```

This happens **once**. Subsequent exports are instant.

## Manual Chromium Installation

If automatic installation fails, install Chromium manually:

::: code-group

```bash [macOS]
cd ~/Library/Application\ Support/Zed/extensions/work/markdown-pdf/server
npm install
node node_modules/playwright-core/cli.js install chromium
```

```bash [Linux]
cd ~/.local/share/zed/extensions/work/markdown-pdf/server
npm install
node node_modules/playwright-core/cli.js install chromium
```

```powershell [Windows]
cd $env:APPDATA\Zed\extensions\work\markdown-pdf\server
npm install
node node_modules\playwright-core\cli.js install chromium
```

:::

## Verify Installation

To verify everything is working:

1. Open any Markdown file in Zed
2. Open the assistant panel
3. Ask: `Run doctor_markdown_pdf`

You should see output like:

```json
{
  "browser": {
    "available": true,
    "backend": "Chromium (Playwright)",
    "version": "147.0.7727.15"
  }
}
```

## Troubleshooting

### Extension fails to build

Ensure Rust and the WASM target are installed:

```bash
rustup target add wasm32-wasip1
```

### Context server doesn't start

1. Confirm `markdown-pdf` is enabled in **Agent → Context Servers**
2. Restart Zed
3. Check Zed logs: **Help → View Logs**
4. Check debug log: `/tmp/zed-markdown-pdf-debug.log`

### Node.js not found

Ensure Node.js is in your PATH:

```bash
which node   # Should return a path
node --version   # Should be ≥ 18
```

## Next Steps

- [First Export](/guide/first-export) — Create your first PDF
- [Header & Footer](/guide/header-footer) — Add professional headers and footers
- [Global Settings](/guide/global-settings) — Configure default options