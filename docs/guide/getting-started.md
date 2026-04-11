# Getting Started

Markdown PDF is a Zed extension that exports Markdown files to high-quality PDFs using Playwright and Chromium.

## Features

- **Native Zed integration** — works directly in the AI assistant
- **Structured headers & footers** — declarative configuration with zones and typed elements
- **Custom placeholders** — use front matter variables in headers/footers
- **Date formatting** — flexible date-fns patterns
- **Image embedding** — SVG, PNG, JPG converted to data URIs
- **Syntax highlighting** — 80+ highlight.js themes
- **Custom CSS** — bring your own stylesheet
- **Per-document overrides** — configure via YAML front matter

## How It Works

1. You ask the AI assistant to export a Markdown file
2. The extension parses the Markdown and any front matter configuration
3. HTML is generated with syntax highlighting and emoji rendering
4. Playwright/Chromium converts the HTML to PDF
5. The PDF is saved next to your source file (or to a custom path)

## Quick Example

Open any Markdown file and ask:

```
Export this file to PDF
```

Or with options:

```
Export this file to PDF in landscape with header and footer
```

## Structured Header/Footer

The extension supports a declarative header/footer system:

```json
{
  "header": {
    "height": "15mm",
    "left": { "type": "image", "src": "./logo.svg", "height": "12mm" },
    "center": { "type": "title" },
    "right": { "type": "date", "format": "MMMM d, yyyy" }
  },
  "footer": {
    "center": { "type": "text", "content": "Page {page} of {pages}" }
  }
}
```

Or configure per-document via front matter:

```yaml
---
title: My Report
author: Jane Smith
pdf:
  header:
    left_text: "{author}"
    center_text: "{title}"
    right_text: "{date:yyyy-MM-dd}"
---
```

## Next Steps

- [Installation](/guide/installation) — Set up the extension
- [First Export](/guide/first-export) — Your first PDF export
- [Header & Footer](/guide/header-footer) — Configure headers and footers