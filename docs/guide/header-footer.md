# Header & Footer

The Markdown PDF extension provides a structured, declarative system for configuring PDF headers and footers. No raw HTML required — just describe what you want using zones and typed elements.

## Overview

Headers and footers use a **three-zone layout**:

```
┌─────────────────────────────────────────────────────────┐
│  LEFT          │       CENTER       │           RIGHT  │
└─────────────────────────────────────────────────────────┘
```

Each zone can contain:
- A single element
- Multiple elements (array)
- Nothing (empty)

## Basic Example

```json
{
  "header": {
    "height": "15mm",
    "left": { "type": "image", "src": "./logo.svg", "height": "12mm" },
    "center": { "type": "title" },
    "right": { "type": "date", "format": "MMMM d, yyyy" }
  },
  "footer": {
    "height": "10mm",
    "center": { "type": "text", "content": "Page {page} of {pages}" }
  }
}
```

This creates:
- **Header**: Logo on the left, document title centered, formatted date on the right
- **Footer**: Page numbers centered

## Where to Configure

### Global Settings (settings.json)

Apply to all exports:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "header": {
          "height": "15mm",
          "center_text": "{title}",
          "right_text": "{date:yyyy-MM-dd}"
        }
      }
    }
  }
}
```

### Per-Document (Front Matter)

Override for a specific document:

```yaml
---
title: Quarterly Report
author: Jane Smith
markdown-pdf:
  header:
    left_text: "{author}"
    center_text: "{title}"
---
```

Front matter settings take priority over global settings.

## Shorthand Syntax

For simple configurations, use shorthand properties:

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

This is equivalent to:

```json
{
  "header": {
    "left": { "type": "image", "src": "./logo.svg", "height": "12mm" },
    "center": { "type": "text", "content": "{title}" },
    "right": { "type": "text", "content": "{date:MMMM d, yyyy}" }
  }
}
```

## Element Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Static or dynamic text | `"Page {page}"` |
| `image` | Embedded image | Logo, icon |
| `date` | Formatted date/time | `"June 14, 2025"` |
| `title` | Document title | From front matter |
| `page_number` | Current page | `1`, `2`, `3`... |
| `total_pages` | Total pages | `10` |
| `spacer` | Flexible space | Push elements apart |

See [Elements](/guide/elements) for detailed documentation.

## Placeholders

Use placeholders in text content:

| Placeholder | Description |
|-------------|-------------|
| `{page}` | Current page number |
| `{pages}` | Total pages |
| `{date}` | Current date (ISO) |
| `{date:FORMAT}` | Formatted date |
| `{title}` | Document title |
| `{author}` | From front matter |
| `{filename}` | Source filename |
| `{custom}` | Any front matter field |

See [Placeholders](/guide/placeholders) for all options.

## Container Styling

Style the header/footer container:

```json
{
  "header": {
    "height": "18mm",
    "padding": "0 15mm",
    "font_size": "9px",
    "font_family": "Georgia, serif",
    "color": "#333",
    "border_bottom": "1px solid #ddd",
    "background": "#f9f9f9"
  }
}
```

| Property | Description |
|----------|-------------|
| `height` | Container height (`15mm`, `0.5in`) |
| `padding` | CSS padding (`0 10mm`) |
| `font_family` | Default font for text |
| `font_size` | Default text size |
| `color` | Default text color |
| `border_bottom` | Header bottom border |
| `border_top` | Footer top border |
| `background` | Background color |

## Multiple Elements per Zone

Add multiple elements to a zone using an array:

```json
{
  "header": {
    "left": [
      { "type": "image", "src": "./logo.svg", "height": "10mm" },
      { "type": "text", "content": "Acme Corp", "font_weight": "bold" }
    ],
    "right": { "type": "date", "format": "yyyy-MM-dd" }
  }
}
```

Elements are laid out horizontally within the zone.

## Automatic Enabling

When you set `header` or `footer` as an object, the extension automatically:

1. Enables `display_header_footer`
2. Generates the HTML template
3. Resolves images to data URIs
4. Resolves placeholders

You don't need to set `display_header_footer: true` manually.

## Next Steps

- [Zones & Layout](/guide/zones) — Understand the three-zone system
- [Elements](/guide/elements) — All element types in detail
- [Placeholders](/guide/placeholders) — Dynamic content
- [Date Formatting](/guide/date-formatting) — Format dates with date-fns
- [Images](/guide/images) — Embed logos and images