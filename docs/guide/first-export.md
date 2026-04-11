# First Export

This guide walks you through creating your first PDF export with Markdown PDF.

## Basic Export

1. Open any Markdown file in Zed
2. Open the assistant panel (`Cmd+Enter` / `Ctrl+Enter`)
3. Type:

   ```
   Export this file to PDF
   ```

4. The PDF will be created next to your source file

That's it! The extension handles everything automatically.


## Export with Options

You can specify options directly in your prompt:

```
Export this file to PDF in landscape orientation
```

```
Export to docs/output.pdf with the monokai theme
```

```
Export with header and footer showing page numbers
```

## Add a Header and Footer

To add a structured header and footer, use front matter:

```yaml
---
title: My Document
pdf:
  header:
    height: 15mm
    center_text: "{title}"
    right_text: "{date:yyyy-MM-dd}"
  footer:
    center_text: "Page {page} of {pages}"
---

# My Document

Content goes here...
```

Then export normally:

```
Export this file to PDF
```

## Output Location

By default, PDFs are saved next to the source file:

```
docs/
├── report.md
└── report.pdf    ← Generated here
```

To specify a different location:

```
Export to build/output.pdf
```

Or configure a default output directory in settings:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "output_directory": "./build"
      }
    }
  }
}
```

## Open After Export

To automatically open the PDF after export:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "open_after_export": true
      }
    }
  }
}
```

Or ask the assistant:

```
Export this file to PDF and open it
```

## Syntax Highlighting

Code blocks are automatically syntax-highlighted using the `github.css` theme. To change the theme:

```
Export with the atom-one-dark theme
```

Or set a default in settings:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "highlight_style": "atom-one-dark.css"
      }
    }
  }
}
```

## Verify Your Setup

If something doesn't work, run the diagnostic tool:

```
Run doctor_markdown_pdf
```

This shows:
- Chromium availability and version
- Current settings
- Server directory path

## Next Steps

- [Header & Footer](/guide/header-footer) — Add professional headers and footers
- [Placeholders](/guide/placeholders) — Use dynamic content
- [Examples](/examples/basic) — Copy-paste ready configurations