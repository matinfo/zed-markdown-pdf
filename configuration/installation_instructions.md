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

The server's JavaScript dependencies are bundled for normal dev installs.
If `server/node_modules` is missing the server will repair itself by running
`npm install` the first time you invoke a tool.

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

**If automatic installation fails**, you can install Chromium manually:

```bash
# macOS
cd ~/Library/Application\ Support/Zed/extensions/installed/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium

# Linux
cd ~/.local/share/zed/extensions/installed/markdown-pdf/server
node node_modules/playwright-core/cli.js install chromium
```

## Usage

After enabling the extension:

1. Open any Markdown file in Zed.
2. Trigger an export using one of the methods below.
3. The `export_markdown_pdf` tool generates a high-quality PDF next to the
   source file (or in `output_directory` if configured).

No manual setup is required.

### Slash commands (quickest)

Type `/` in the assistant panel to invoke a slash command directly:

| Command | What it does |
|---|---|
| `/export-pdf` | Export the current Markdown file to PDF |
| `/export-pdf README.md` | Export a specific file (resolved from the worktree root) |
| `/export-pdf-with-headers` | Export with header and footer enabled |
| `/export-pdf-with-headers README.md` | Targeted export with header and footer |

> **Note:** Zed's WASM extension API does not expose a Cmd+Shift+P
> command-palette registration hook. Slash commands in the assistant panel
> (`/`) are the closest equivalent the current Zed extension API allows.

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
| `nord.css` | Nord |
| `tokyo-night-dark.css` | Tokyo Night dark |
| `tokyo-night-light.css` | Tokyo Night light |
| `rose-pine.css` | Rosé Pine |
| `rose-pine-dawn.css` | Rosé Pine Dawn (light) |
| `rose-pine-moon.css` | Rosé Pine Moon |
| `a11y-light.css` | Accessible light |
| `a11y-dark.css` | Accessible dark |
| `stackoverflow-light.css` | Stack Overflow light |
| `stackoverflow-dark.css` | Stack Overflow dark |
| `intellij-light.css` | IntelliJ IDEA light |
| `panda-syntax-dark.css` | Panda Syntax dark |
| `panda-syntax-light.css` | Panda Syntax light |
| `night-owl.css` | Night Owl |
| `agate.css` | Agate |
| `docco.css` | Docco |
| `grayscale.css` | Grayscale |
| `xcode.css` | Xcode |

Browse all available styles at the
[highlight.js demo page](https://highlightjs.org/demo).

### Header and footer

| Key | Type | Default | Description |
|---|---|---|---|
| `display_header_footer` | `boolean` | `false` | Show a header and footer on every PDF page. |
| `header_template` | `string` | title left, date right | HTML template for the page header. |
| `footer_template` | `string` | page number centred | HTML template for the page footer. |

#### Template placeholder variables

The following placeholders are replaced before the template is passed to
Chromium. They are available in both `header_template` and `footer_template`.

| Placeholder | Replaced with |
|---|---|
| `%%ISO-DATE%%` | Current date in `YYYY-MM-DD` format |
| `%%ISO-DATETIME%%` | Current date and time in `YYYY-MM-DD HH:MM:SS` format |
| `%%ISO-TIME%%` | Current time in `HH:MM:SS` format |
| `%%TITLE%%` | Document title (from front matter `title:` or the filename stem) |

#### Chromium native span classes

Chromium also populates certain `<span>` elements inside header/footer
templates automatically. Use them like this:

```html
<span class="pageNumber"></span>   <!-- current page number -->
<span class="totalPages"></span>   <!-- total number of pages -->
<span class="date"></span>         <!-- formatted print date (browser locale) -->
<span class="title"></span>        <!-- document <title> element -->
<span class="url"></span>          <!-- document URL -->
```

**Important:** Chromium header/footer templates are rendered in a separate,
isolated context. Inline styles must be applied directly — external
stylesheets and the page stylesheet do not apply. Font size defaults to `0`;
always set an explicit `font-size` on your template elements.

#### Default templates

```html
<!-- header_template default -->
<div style="font-size:9px;margin-left:1cm;flex:1">
  <span class="title"></span>
</div>
<div style="font-size:9px;margin-right:1cm">%%ISO-DATE%%</div>

<!-- footer_template default -->
<div style="font-size:9px;margin:0 auto">
  <span class="pageNumber"></span> / <span class="totalPages"></span>
</div>
```

#### Custom header/footer example

```json
{
  "display_header_footer": true,
  "header_template": "<div style='font-size:9px;margin-left:1cm;flex:1'>%%TITLE%%</div><div style='font-size:9px;margin-right:1cm'>%%ISO-DATE%%</div>",
  "footer_template": "<div style='font-size:9px;width:100%;text-align:center'><span class='pageNumber'></span> of <span class='totalPages'></span></div>"
}
```

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

---

## Debugging

The server writes a debug log to your system temp directory:

```text
/tmp/zed-markdown-pdf-debug.log          # macOS / Linux
%TEMP%\zed-markdown-pdf-debug.log        # Windows
```

Use the `doctor_markdown_pdf` tool to inspect the current settings, Chromium
availability, and server directory in one call.