# Markdown PDF — Quick Start

Export any Markdown file to a polished PDF directly from Zed's AI assistant.

---

## 1. Install the Extension

1. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run `zed: install dev extension`
3. Select the `zed-markdown-pdf` folder

Zed compiles and installs the extension automatically.

> **Requires:** Rust with `rustup target add wasm32-wasip1` and Node.js ≥ 18

---

## 2. Enable the Context Server

1. Open Zed Settings (`Cmd+,`)
2. Go to **Agent → Context Servers**
3. Enable **markdown-pdf**

---

## 3. First Export

Open any `.md` file and ask the assistant:

```
Export this file to PDF
```

On the very first run, Chromium (~150 MB) downloads automatically:

```
Installing npm dependencies (first run)…
Chromium not found, installing automatically…
Chromium installed successfully.
```

This happens **once**. After that, exports are instant.

The PDF is saved next to your Markdown file by default.

---

## 4. Slash Commands

The extension registers two slash commands in the assistant panel. Type `/` to see them — they are the fastest way to trigger an export without writing a prompt:

| Command | What it does |
|---|---|
| `/export-pdf` | Export the current Markdown file to PDF |
| `/export-pdf README.md` | Export a specific file (resolved from the worktree root) |
| `/export-pdf-with-headers` | Export with `display_header_footer: true` |
| `/export-pdf-with-headers README.md` | Targeted export with header and footer |

> **Note:** Zed's WASM extension API does not expose a Cmd+Shift+P command-palette
> hook, so these commands live in the assistant panel (`/`) rather than the global
> palette — the closest equivalent the current Zed extension API allows.

---

## 5. Common Prompts

| What you want | What to ask |
|---|---|
| Basic export | `Export this file to PDF` |
| Custom output path | `Export to docs/report.pdf` |
| Dark code theme | `Export with the monokai theme` |
| Landscape layout | `Export in landscape orientation` |
| Header and footer | `Export with header and footer showing page numbers` |
| Check setup | `Run doctor_markdown_pdf` |

---

## 6. Settings

Add settings to your Zed `settings.json` for permanent defaults:

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

---

## 7. Syntax Highlighting

Highlighting is **on by default** using the `github.css` theme.

Change the theme in settings or ask the assistant directly:

```
Export this file to PDF using the atom-one-dark theme
```

Popular themes:

| `github.css` | Light GitHub (default) |
|---|---|
| `github-dark.css` | Dark GitHub |
| `monokai.css` | Classic Monokai dark |
| `atom-one-dark.css` | Atom One Dark |
| `nord.css` | Nord |
| `tokyo-night-dark.css` | Tokyo Night |
| `rose-pine.css` | Rosé Pine |
| `vs.css` | Visual Studio light |
| `vs2015.css` | Visual Studio dark |
| `a11y-light.css` | Accessible light |
| `a11y-dark.css` | Accessible dark |

80+ themes available — browse them at [highlightjs.org/demo](https://highlightjs.org/demo).

To disable highlighting entirely:

```json
{ "highlight": false }
```

---

## 8. Header and Footer

Disabled by default. Enable with:

```json
{
  "display_header_footer": true
}
```

The default templates render the document title on the left, the current date on
the right of the header, and a centred page count (`1 / 4`) in the footer.

### Template placeholders

| Placeholder | Output |
|---|---|
| `%%ISO-DATE%%` | `2025-06-14` |
| `%%ISO-DATETIME%%` | `2025-06-14 09:30:00` |
| `%%ISO-TIME%%` | `09:30:00` |
| `%%TITLE%%` | Document title |

Chromium also fills these `<span>` classes automatically:

```html
<span class="pageNumber"></span>   <!-- current page -->
<span class="totalPages"></span>   <!-- total pages -->
<span class="title"></span>        <!-- document <title> -->
<span class="date"></span>         <!-- print date -->
```

### Custom header/footer

```json
{
  "display_header_footer": true,
  "header_template": "<div style='font-size:9px;margin-left:1cm;flex:1'>%%TITLE%%</div><div style='font-size:9px;margin-right:1cm'>%%ISO-DATE%%</div>",
  "footer_template": "<div style='font-size:9px;width:100%;text-align:center'><span class='pageNumber'></span> of <span class='totalPages'></span></div>"
}
```

> Header/footer templates are isolated from page styles. Always use **inline styles**
> and set `font-size` explicitly (Chromium defaults it to `0`).

---

## 9. Page Layout Options

| Setting | Values | Default |
|---|---|---|
| `page_format` | `A4`, `Letter`, `Legal`, `A3`, `A5`, … | `A4` |
| `orientation` | `portrait`, `landscape` | `portrait` |
| `scale` | `0.1` – `2` | `1` |
| `page_ranges` | `"1-5, 8"` | all pages |
| `print_background` | `true` / `false` | `true` |

---

## 10. Custom Stylesheet

Append your own CSS on top of the built-in neutral styles:

```json
{ "stylesheet_path": "./custom.css" }
```

To use **only** your stylesheet (no built-in CSS):

```json
{
  "include_default_styles": false,
  "stylesheet_path": "./custom.css"
}
```

---

## 11. Page Breaks

The built-in stylesheet includes a `.page` utility class:

```html
<div class="page"></div>
```

Place it anywhere in your Markdown — HTML pass-through is enabled by default.

---

## 12. Front Matter

The `title` field in YAML front matter sets the document title used in the
HTML `<title>` tag, the `%%TITLE%%` placeholder, and Chromium's
`<span class="title">`:

```markdown
---
title: Project Report Q2
---

# Content starts here…
```

---

## 13. Diagnostics

If something goes wrong, ask:

```
Run doctor_markdown_pdf
```

Or check the debug log:

```
/tmp/zed-markdown-pdf-debug.log        # macOS / Linux
%TEMP%\zed-markdown-pdf-debug.log      # Windows
```

---

## Full Settings Reference

See [`configuration/installation_instructions.md`](configuration/installation_instructions.md)
for the complete settings reference, or [`README.md`](README.md) for full documentation.