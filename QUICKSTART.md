# Quick Start: Markdown PDF Extension

Get started with Markdown to PDF export in Zed in under 5 minutes.

## Installation

### Step 1: Install the Extension

1. Open Zed
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: `zed: install dev extension`
4. Navigate to the `zed-markdown-pdf` directory and select it

Zed will build and install the extension automatically.

### Step 2: Enable the MCP Server

1. Open Zed Settings (`Cmd+,` on macOS)
2. Navigate to **Agent** → **Context Servers**
3. Enable the **markdown-pdf** server

### Step 3: That's it!

On your first PDF export, Chromium (~150MB) will download automatically in the background. You'll see a message like:

```
Chromium not found, installing automatically (this may take a few minutes)...
Chromium installed successfully
```

This happens only once. After the initial download, all subsequent exports are instant.

**If automatic installation fails**, you can manually install Chromium:

```bash
# macOS
cd ~/Library/Application\ Support/Zed/extensions/installed/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium

# Linux
cd ~/.local/share/zed/extensions/installed/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium
```

## Usage

### Export a Markdown File to PDF

1. Open any Markdown file in Zed
2. Open the Assistant panel
3. Ask: **"Export this file to PDF"**

The AI will use the `export_markdown_pdf` tool to generate a PDF in the same directory as your Markdown file.

### Example Prompts

- "Export this to PDF"
- "Convert this Markdown to PDF with custom styling"
- "Export README.md to build/output.pdf"
- "Check if the PDF exporter is set up correctly" (uses `doctor_markdown_pdf`)

## Optional: Configure Settings

Add custom settings in your Zed settings file:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "stylesheet_path": "./custom.css",
        "output_directory": "./pdf",
        "page_format": "Letter",
        "open_after_export": true,
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

## Test the Extension

Use the included test fixture:

1. Open `test-fixtures/sample.md` in Zed
2. Ask the AI: "Export this to PDF"
3. Chromium will download automatically on first use (if not already installed)
4. Check that `sample.pdf` was created

Or run the standalone test script:

```bash
cd zed-markdown-pdf/server
npm install
npm run test
```

The test script will automatically install Chromium if needed.

## Custom Styling

Create a CSS file to customize PDF appearance:

```css
/* custom.css */
body {
  font-family: 'Georgia', serif;
  font-size: 12pt;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
}
```

Then configure in settings:
```json
{
  "stylesheet_path": "./custom.css"
}
```

See `test-fixtures/custom.css` for a complete example.

## Troubleshooting

### Chromium installation in progress

**Message**: `Chromium not found, installing automatically...`

**What's happening**: The extension is downloading Chromium (~150MB) automatically. This happens once on first use and takes a few minutes depending on your internet connection. Just wait for it to complete.

### MCP server not starting

**Solution**: 
1. Check the MCP server is enabled in Agent settings
2. Restart Zed
3. Check Zed logs (Help → View Logs)

### Export fails

**Solution**:
1. Ask the AI: "Check the Markdown PDF setup using doctor_markdown_pdf"
2. Verify Chromium is installed
3. Check file paths are correct

## Learn More

- **README.md** - Complete documentation with all features and settings
- **TESTING.md** - Developer testing guide
- **test-fixtures/** - Sample Markdown files and custom CSS examples

## Features

- **Zero manual setup** - Chromium installs automatically on first use
- Zero system dependencies - no external binaries required
- Modern CSS support (Flexbox, Grid, custom fonts)
- Cross-platform (macOS, Linux, Windows)
- MCP-native integration with Zed AI assistant
- Custom styling with CSS
- Configurable page formats and margins
- Automatic relative asset resolution

## What You Get

Input: `document.md` with Markdown content  
Output: `document.pdf` with professional formatting

That's it! Start exporting your Markdown files to beautiful PDFs.
