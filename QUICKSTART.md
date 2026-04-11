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

## 4. Common Prompts

| What you want | What to ask |
|---|---|
| Basic export | `Export this file to PDF` |
| Custom output path | `Export to docs/report.pdf` |
| Dark code theme | `Export with the monokai theme` |
| Landscape layout | `Export in landscape orientation` |
| Header and footer | `Export with header and footer showing page numbers` |
| Check setup | `Run doctor_markdown_pdf` |

---

## 5. Settings

Add settings to your Zed `settings.json` for permanent defaults:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "font_family": null,
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

## 6. Syntax Highlighting

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

## 7. Header and Footer

There are two ways to add headers and footers:

### Structured (Recommended)

Use zones (`left`, `center`, `right`) with typed elements:

```json
{
  "header": {
    "height": "15mm",
    "left_image": "./logo.svg",
    "left_image_height": "12mm",
    "center_text": "{title}",
    "right_text": "{date:MMMM d, yyyy}"
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

**Placeholders:** `{page}`, `{pages}`, `{date}`, `{date:FORMAT}`, `{title}`, `{filename}`, `{author}`, plus any front matter variable.

**Element types:** `text`, `image`, `page_number`, `total_pages`, `date`, `title`, `spacer`.

---

## 8. Page Layout Options

| Setting | Values | Default |
|---|---|---|
| `page_format` | `A4`, `Letter`, `Legal`, `A3`, `A5`, … | `A4` |
| `orientation` | `portrait`, `landscape` | `portrait` |
| `scale` | `0.1` – `2` | `1` |
| `page_ranges` | `"1-5, 8"` | all pages |
| `print_background` | `true` / `false` | `true` |

---

## 9. Custom Stylesheet

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

## 10. Page Breaks

The built-in stylesheet includes a `.page` utility class:

```html
<div class="page"></div>
```

Place it anywhere in your Markdown — HTML pass-through is enabled by default.

---

## 11. Front Matter

### Document Title

The `title` field sets the document title used in headers and the HTML `<title>`:

```markdown
---
title: Project Report Q2
---
```

### Per-Document PDF Settings

Override any setting for a specific document with `markdown-pdf:`:

```markdown
---
title: Quarterly Report
author: Jane Smith
company: Acme Corp
markdown-pdf:
  page_format: Letter
  header:
    left_text: "{company}"
    center_text: "{title}"
    right_text: "{date:MMMM d, yyyy}"
  footer:
    center_text: "Page {page} of {pages}"
---
```

Custom front matter fields (`company`, `author`) become `{placeholders}` in headers/footers.

---

## 12. Diagnostics

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

## Full Documentation

- [`README.md`](README.md) — Complete settings reference
- [`configuration/installation_instructions.md`](configuration/installation_instructions.md) — Installation guide
- [Online Documentation](https://matinfo.github.io/zed-markdown-pdf/) — Full structured header/footer reference