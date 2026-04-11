# Installation Instructions

This extension exports Markdown files to PDF using a modern,
fully automated pipeline:

1. Parse YAML front matter for the document title
2. Render Markdown to HTML with `markdown-it`
3. Apply syntax highlighting with `highlight.js` (optional, on by default)
4. Render emoji shortcodes via `markdown-it-emoji` (optional, on by default)
5. Apply the built-in neutral stylesheet and optional user CSS
6. Convert HTML to PDF with Playwright's Chromium browser

## Zero external dependencies

Unlike traditional PDF exporters, this extension requires **no manual system
installation**.

The MCP server script is **not bundled** with the extension. Instead, the
extension downloads `markdown-pdf-server.tar.gz` from the matching GitHub
release the first time you invoke a tool. If `server/node_modules` is missing,
the server repairs itself by running `npm install` automatically.

## Automatic browser setup

On your first PDF export, Chromium (~150 MB) will download automatically in
the background. You will see a brief message while it installs:

```text
Chromium not found, installing automatically (this may take a few minutes)...
Chromium installed successfully
```

This happens only once. The browser is cached on your system and shared across
all Playwright-based tools. Subsequent exports are instant and work identically
on macOS, Linux, and Windows.

**If automatic installation fails**, you can install Chromium manually.
The server is extracted into the extension's working directory:

```bash
# macOS
cd ~/Library/Application\ Support/Zed/extensions/work/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium

# Linux
cd ~/.local/share/zed/extensions/work/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium
```

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

### Output

| Key | Type | Default | Description |
|---|---|---|---|
| `output_directory` | `string \| null` | `null` | Directory for the output PDF. Relative paths are resolved from the Markdown file's location. |
| `open_after_export` | `boolean` | `false` | Open the PDF in the system default viewer after export. |

### Page layout

| Key | Type | Default | Description |
|---|---|---|---|
| `page_format` | `string` | `"A4"` | Paper size. One of `A4`, `Letter`, `Legal`, `Tabloid`, `Ledger`, `A0`–`A3`, `A5`, `A6`. |
| `orientation` | `string` | `"portrait"` | Page orientation: `"portrait"` or `"landscape"`. |
| `scale` | `number` | `1` | Zoom factor for the page rendering (0.1 – 2). |
| `page_ranges` | `string` | `""` | Pages to include, e.g. `"1-5, 8, 11-13"`. Leave empty to print all pages. |
| `print_background` | `boolean` | `true` | Print background colours and images. |
| `margin` | `object` | see below | Per-side page margins as CSS length strings (e.g. `"20mm"`, `"0.5in"`). |

Default margin:

```json
{ "top": "15mm", "right": "15mm", "bottom": "15mm", "left": "15mm" }
```

### Content / rendering

| Key | Type | Default | Description |
|---|---|---|---|
| `font_family` | `string \| null` | `null` | CSS `font-family` value for the document body **and** header/footer. `null` keeps the default system font stack. Example: `"Georgia, 'Times New Roman', serif"`. |
| `include_default_styles` | `boolean` | `true` | Include the built-in neutral stylesheet. Set to `false` to use only your own `stylesheet_path`. |
| `stylesheet_path` | `string \| null` | `null` | Path to a custom CSS file appended after the built-in styles. Relative paths are resolved from the Markdown file's directory. |
| `breaks` | `boolean` | `false` | Convert single newlines inside paragraphs into hard `<br>` line breaks. |
| `emoji` | `boolean` | `true` | Render `:shortcode:` emoji (e.g. `:wave:` → 👋) via `markdown-it-emoji`. |

### Syntax highlighting

| Key | Type | Default | Description |
|---|---|---|---|
| `highlight` | `boolean` | `true` | Enable syntax highlighting for fenced code blocks. |
| `highlight_style` | `string` | `"github.css"` | Highlight.js theme filename. See the full list below. |

About 80 themes are available. A few popular choices:

| Theme file | Style |
|---|---|
| `github.css` | Light, GitHub-style (default) |
| `github-dark.css` | Dark GitHub style |
| `github-dark-dimmed.css` | Dimmed dark GitHub style |
| `monokai.css` | Classic dark Monokai |
| `monokai-sublime.css` | Monokai Sublime variant |
| `atom-one-dark.css` | Atom One Dark |
| `atom-one-light.css` | Atom One Light |
| `vs.css` | Visual Studio light |
| `vs2015.css` | Visual Studio dark |

Browse all available styles at the
[highlight.js demo page](https://highlightjs.org/demo).

### Header and footer

**Structured configuration** (recommended) — declarative JSON with zones and typed elements.

| Key | Type | Default | Description |
|---|---|---|---|
| `display_header_footer` | `boolean` | `false` | Show a header and footer on every PDF page. |
| `header` | `object \| null` | `null` | Structured header configuration (see below). |
| `footer` | `object \| null` | `null` | Structured footer configuration (see below). |

When `header` or `footer` is set as an object, structured mode is used and
`display_header_footer` is automatically enabled.

---

### Structured header/footer

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

#### Placeholders

Use these in `text` elements or `format` strings:

| Placeholder | Description |
|---|---|
| `{page}` | Current page number (rendered by Chromium) |
| `{pages}` | Total pages (rendered by Chromium) |
| `{date}` | Current date (ISO format) |
| `{date:FORMAT}` | Formatted date using date-fns pattern |
| `{title}` | Document title |
| `{filename}` | Source filename |
| `{author}` | Author from front matter |
| `{custom}` | Any front matter variable |

#### Shorthand properties

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

Available shorthands: `left_text`, `left_image`, `left_image_height`,
`center_text`, `center_image`, `center_image_height`,
`right_text`, `right_image`, `right_image_height`.

#### Container properties

| Property | Description |
|---|---|
| `height` | Header/footer height (e.g., `"15mm"`) |
| `padding` | CSS padding (e.g., `"0 10mm"`) |
| `font_family` | Default font for all text |
| `font_size` | Default font size |
| `color` | Default text color |
| `border_bottom` | Header bottom border |
| `border_top` | Footer top border |
| `background` | Background color |

---

## Per-document settings (front matter)

Override any setting for a specific document using the `markdown-pdf:` block
in YAML front matter:

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
        "display_header_footer": true,
        "open_after_export": false
      }
    }
  }
}
```

A landscape handout with a custom theme and no default styles:

```json
{
  "page_format": "A4",
  "orientation": "landscape",
  "scale": 0.9,
  "include_default_styles": false,
  "stylesheet_path": "styles/handout.css",
  "highlight_style": "atom-one-dark.css",
  "print_background": true
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
