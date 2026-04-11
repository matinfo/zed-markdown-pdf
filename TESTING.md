# Testing the Markdown PDF Extension

This guide covers local testing of the extension both as a standalone MCP server and as an installed Zed extension.

## Prerequisites

1. **Node.js** version 18 or higher (required for the MCP server)

2. **Rust toolchain** (for building the extension)

3. **Nothing else!** – Chromium downloads automatically on first use

## Quick Start: Install in Zed

### Step 1: Build the extension

```sh
cd zed-markdown-pdf
cargo check
```

This verifies the Rust code compiles correctly.

### Step 2: Install as dev extension

1. Open Zed
2. Open the command palette (Cmd+Shift+P on macOS)
3. Run: `zed: install dev extension`
4. Navigate to the `zed-markdown-pdf` directory and select it

Zed will build and install the extension. You should see it appear in the Extensions list.

### Step 3: Enable the MCP server and start using it

1. Open Zed settings (Cmd+, on macOS)
2. Navigate to **Agent** settings
3. Find **Context Servers** section
4. Enable the `markdown-pdf` server
5. (Optional) Configure server settings:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "stylesheet_path": "",
        "output_directory": "",
        "open_after_export": false,
        "page_format": "A4",
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

### Step 4: Test with sample fixture

1. Open `test-fixtures/sample.md` in Zed
2. Open the Assistant panel
3. Ask: "Export this Markdown file to PDF"
4. **On first use only:** Chromium (~150MB) will download automatically. You'll see a message in the Assistant:
   ```
   Chromium not found, installing automatically (this may take a few minutes)...
   Chromium installed successfully
   ```
5. The AI will use the `export_markdown_pdf` MCP tool
6. Check that `sample.pdf` was created in the `test-fixtures` directory

After the first export, all subsequent exports are instant with no download needed.

## Standalone Testing (Without Zed)

You can test the MCP server directly without installing it in Zed:

### Step 1: Install dependencies

```sh
cd zed-markdown-pdf/server
npm install
```

This installs `markdown-it` and `playwright-core`. Chromium will be downloaded automatically on the first export path that needs it.

### Step 2: Run the test script

```sh
# Syntax check the MCP server
cd server
npm run build

# Basic test with default styling
npm run test

# Test with custom CSS
node ../test-fixtures/test-export.mjs --custom-css custom.css
```

On first run, the export step will automatically download Chromium (~150MB). You'll see:
```
Chromium not found, installing automatically (this may take a few minutes)...
Chromium installed successfully
```

### Expected output

```
Markdown PDF MCP Server Test

Starting MCP server...
Initializing server...
Server initialized: markdown-pdf v0.1.0

Listing available tools...
Found 2 tools:
  - export_markdown_pdf: Render a Markdown file to HTML and convert it to PDF with Playwright/Chromium.
  - doctor_markdown_pdf: Inspect Playwright/Chromium setup and current server settings.

Running doctor to check Playwright/Chromium...
Chromium available: Chromium (Playwright) 120.0.6099.28
Settings: {...}

Exporting sample.md to PDF...
PDF exported successfully!

Verifying output file...
PDF created: test-fixtures/sample.pdf
File size: XX.XX KB

All tests passed!
```
</text>

<old_text line=127>
- `stylesheet_path` (optional): Custom CSS file
- `open_after_export` (optional): Auto-open the PDF

## Testing MCP Tools

The extension provides two MCP tools:

### `export_markdown_pdf`

Converts a Markdown file to PDF.

**Arguments:**
- `input_path` (required): Path to the Markdown file
- `output_path` (optional): Where to save the PDF
- `stylesheet_path` (optional): Custom CSS file
- `open_after_export` (optional): Auto-open the PDF
**Example prompts in Zed:**
- "Export this file to PDF"
- "Convert docs/README.md to PDF with custom styling from print.css"
- "Export this to build/output.pdf"

### `doctor_markdown_pdf`

Diagnoses the Playwright/Chromium setup and shows current settings.

**Arguments:**
- `input_path` (optional): Markdown file for resolving relative paths

**Example prompt:**
- "Check the Markdown PDF setup"
- "Show me the Chromium configuration"
- "Verify the PDF exporter is working"

## Troubleshooting

### Chromium installation in progress

**Message:** `Chromium not found, installing automatically...`

**What's happening:**
On first use, the extension automatically downloads Chromium (~150MB). This takes a few minutes depending on your internet connection. Just wait for the installation to complete.

**If automatic installation fails:**
1. Check your internet connection
2. Manually install Chromium:
   ```sh
   # macOS
   cd ~/Library/Application\ Support/Zed/extensions/installed/markdown-pdf/server
   node node_modules/playwright-core/cli.js install chromium
   
   # Linux
   cd ~/.local/share/zed/extensions/installed/markdown-pdf/server
   node node_modules/playwright-core/cli.js install chromium
   ```

### Extension not loading

**Symptom:** Extension doesn't appear after installation

**Solutions:**
1. Check the Zed log (Help → View Logs)
2. Verify `cargo check` passes
3. Try restarting Zed
4. Reinstall the extension

### MCP server not starting

**Symptom:** Tools don't appear in the Assistant

**Solutions:**
1. Verify the server is enabled in Agent settings
2. Check that Node.js is available: `which node`
3. View the MCP server logs in Zed (Agent panel → Server logs)
4. Run `doctor_markdown_pdf` to check configuration

### PDF export fails

**Symptom:** Export completes but no PDF is created

**Solutions:**
1. Check file permissions in the output directory
2. Verify the input Markdown file exists
3. Run the standalone test script to isolate the issue
4. Check for error messages in the Assistant panel

### Windows-specific issues

On Windows:
1. Chromium installs automatically to `%USERPROFILE%\AppData\Local\ms-playwright\`
2. Ensure you have sufficient disk space (~150MB) for the browser download
3. If Windows Defender or antivirus blocks the download, add an exception for Playwright
4. File paths in settings should use forward slashes or escaped backslashes in JSON

## Test Fixtures

The `test-fixtures` directory contains:

- **`sample.md`**: Comprehensive Markdown document with various features
- **`custom.css`**: Example custom stylesheet
- **`test-export.mjs`**: Standalone test script
- **`README.md`**: Detailed fixture documentation

Use these to validate:
- Basic Markdown rendering (headings, lists, code blocks)
- Advanced features (tables, blockquotes, inline HTML)
- Custom styling
- Cross-platform compatibility

## Development Workflow

When making changes to the extension:

1. **Rust changes** (`src/lib.rs`):
   ```sh
   cargo check
   # Build the WASM binary (requires wasm32-wasip1 target)
   cargo build --target wasm32-wasip1 --release
   cp target/wasm32-wasip1/release/markdown_pdf.wasm extension.wasm
   # Reinstall dev extension in Zed
   ```

2. **Server changes** (`server/markdown_pdf_server.mjs`):
   ```sh
   cd server
   npm install  # if dependencies changed
   node --check markdown_pdf_server.mjs
   # Reload the MCP server in Zed (disable/enable in settings)
   ```

3. **CSS changes** (`server/default.css`):
   - Changes take effect immediately on next export
   - No reload needed

4. **Dependency changes** (`server/package.json`):
   ```sh
   cd server
   npm install
   # Reinstall dev extension in Zed
   ```

## Next Steps

After validating locally:

1. Test across different operating systems if possible
2. Try exporting various Markdown documents from real projects
3. Experiment with custom CSS for different use cases
4. Report any issues or edge cases
5. Consider contributing improvements back to the repository

## Feedback

If you encounter issues not covered here, check:
- The main README.md for architecture details and Playwright advantages
- The README.md for architecture and design decisions
- GitHub Issues for similar problems
- The MCP server logs in Zed for detailed error messages
- Playwright documentation: https://playwright.dev/
