# Installation Instructions

This extension exports Markdown files to PDF using a modern, fully automated pipeline.

## Zero external dependencies

Unlike traditional PDF exporters, this extension requires **no manual system
installation**.

The MCP server script is **not bundled** with the extension. Instead, the
extension downloads `markdown-pdf-server.tar.gz` from the matching GitHub
release the first time you invoke a tool. If `server/node_modules` is missing,
the server repairs itself by running `npm install` automatically.

## Usage

After enabling the extension:

1. Open any Markdown file in Zed.
2. Trigger an export using one of the methods below.
3. On the very first use the extension downloads the MCP server from GitHub
   and installs its npm dependencies — this takes a few seconds and happens
   only once.
4. The `export_markdown_pdf` tool generates a high-quality PDF next to the
   source file (or in `output_directory` if configured).

No manual setup is required.

### Natural-language prompts

You can also just describe what you want to the assistant:

- *"Export this to PDF"*
- *"Export in landscape with the monokai theme"*
- *"Export with header and footer showing page numbers"*

---

## Settings reference

All settings can be placed in your Zed `settings.json` under the
`context_servers.markdown-pdf.settings` key, or passed directly as tool-call
arguments to override them on a per-export basis.

For the full settings reference and header/footer documentation, see the [online documentation](https://matinfo.github.io/zed-markdown-pdf/).

## Example settings

Minimal Zed `settings.json` snippet:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "page_format": "Letter",
        "orientation": "portrait",
        "margin": { "top": "20mm", "right": "18mm", "bottom": "20mm", "left": "18mm" },
        "highlight": true,
        "highlight_style": "github.css",
        "emoji": true,
        "display_header_footer": false,
        "open_after_export": false
      }
    }
  }
}
```

---

## Page-break helper

The built-in stylesheet provides a `.page` utility class that forces a page
break after the element:

```html
<div class="page"></div>
```

Place it in your Markdown (HTML pass-through is enabled) wherever you want a
hard page break.
