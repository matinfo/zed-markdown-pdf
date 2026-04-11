# Front Matter

YAML front matter lets you configure PDF settings on a per-document basis. Any setting can be overridden in the `markdown-pdf:` block.

## Basic Structure

```yaml
---
title: My Document
author: Jane Smith
markdown-pdf:
  page_format: Letter
  header:
    center_text: "{title}"
---

# Document Content
```

The `markdown-pdf:` block contains all PDF-specific settings. Other front matter fields (like `title` and `author`) are available as placeholders.

## Document Metadata

Standard front matter fields are automatically extracted:

| Field | Description | Placeholder |
|-------|-------------|-------------|
| `title` | Document title | `{title}` |
| `author` | Author name | `{author}` |
| `date` | Document date | (not a placeholder) |

```yaml
---
title: Quarterly Report
author: Jane Smith
date: 2025-06-14
---
```

## Custom Variables

Any field in front matter becomes a placeholder:

```yaml
---
title: Project Report
company: Acme Corporation
department: Engineering
version: 2.0.0
project_code: PRJ-2025-001
client: BigCorp Inc.
---
```

Use them in headers and footers:

```yaml
---
title: Project Report
company: Acme Corp
version: 2.0.0
markdown-pdf:
  header:
    left_text: "{company}"
    center_text: "{title}"
    right_text: "v{version}"
---
```

## PDF Settings

All global settings can be overridden in `markdown-pdf:`:

### Page Layout

```yaml
---
markdown-pdf:
  page_format: Letter
  orientation: landscape
  scale: 0.9
  page_ranges: "1-5"
  print_background: true
  margin:
    top: 20mm
    right: 15mm
    bottom: 20mm
    left: 15mm
---
```

### Content & Rendering

```yaml
---
markdown-pdf:
  font_family: "Georgia, serif"
  include_default_styles: true
  stylesheet_path: "./custom.css"
  highlight: true
  highlight_style: "atom-one-dark.css"
  breaks: false
  emoji: true
---
```

### Header & Footer

```yaml
---
markdown-pdf:
  header:
    height: 15mm
    left_image: "./logo.svg"
    left_image_height: 12mm
    center_text: "{title}"
    right_text: "{date:MMMM d, yyyy}"
  footer:
    height: 10mm
    center_text: "Page {page} of {pages}"
---
```

## Complete Example

```yaml
---
title: Q2 Financial Report
author: Jane Smith
company: Acme Corporation
department: Finance
fiscal_year: 2025
version: 1.0.0
markdown-pdf:
  page_format: Letter
  orientation: portrait
  margin:
    top: 25mm
    bottom: 25mm
  header:
    height: 18mm
    padding: 0 15mm
    font_size: 9px
    border_bottom: 1px solid #ddd
    left:
      - type: text
        content: "{company}"
        font_weight: bold
      - type: text
        content: "{department}"
        font_size: 8px
        color: "#666"
    center:
      type: title
      font_style: italic
    right:
      type: date
      format: MMMM d, yyyy
  footer:
    height: 12mm
    padding: 0 15mm
    font_size: 8px
    border_top: 1px solid #eee
    left:
      type: text
      content: "FY{fiscal_year} • v{version}"
      color: "#666"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "{author}"
      color: "#666"
---

# Q2 Financial Report

Content goes here...
```

## Priority Order

Settings are merged with this priority (highest to lowest):

1. **Front matter** (`markdown-pdf:` block)
2. **Tool call arguments** (from AI assistant)
3. **Global settings** (`settings.json`)
4. **Extension defaults**

```yaml
# This overrides any global settings:
---
markdown-pdf:
  page_format: Letter  # Takes priority over "A4" in settings.json
---
```

## Disabling Header/Footer

To disable a header or footer for a specific document:

```yaml
---
markdown-pdf:
  header: null
  footer:
    center_text: "Page {page}"
---
```

Setting `header: null` explicitly removes the header, even if one is configured globally.

## Zone Override Behavior

When you define a zone in front matter, it **replaces** the global setting for that zone (not merged):

```json
// Global settings
{
  "header": {
    "left": { "type": "image", "src": "./logo.svg" },
    "center": { "type": "title" },
    "right": { "type": "date" }
  }
}
```

```yaml
# Front matter - replaces only the left zone
---
markdown-pdf:
  header:
    left:
      type: text
      content: "Different Left"
---
```

Result: Left shows "Different Left", center and right use global settings.

## Validation

Invalid front matter configuration triggers warnings in the debug log:

```
/tmp/zed-markdown-pdf-debug.log
```

Common issues:

- Invalid element type
- Missing required properties
- Invalid CSS values

## YAML Tips

### Multi-line Strings

```yaml
---
markdown-pdf:
  footer:
    center_text: >
      Page {page} of {pages}
      - Confidential
---
```

### Quotes for Special Characters

```yaml
---
markdown-pdf:
  header:
    left_text: "{company}"  # Quotes recommended for curly braces
    right_text: "Date: {date:yyyy-MM-dd}"
---
```

### Arrays

```yaml
---
markdown-pdf:
  header:
    left:
      - type: image
        src: ./logo.svg
        height: 12mm
      - type: text
        content: "{company}"
---
```

## Working with Settings

### Check Active Settings

Ask the AI assistant:

```
Run doctor_markdown_pdf
```

This shows the effective settings after merging.

### Debug Front Matter

Check the debug log to see how front matter is parsed:

```bash
tail -f /tmp/zed-markdown-pdf-debug.log
```

## Next Steps

- [Placeholders](/guide/placeholders) — All available placeholders
- [Global Settings](/guide/global-settings) — Configure default settings
- [Header & Footer](/guide/header-footer) — Structured configuration guide