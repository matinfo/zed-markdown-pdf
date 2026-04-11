# Basic Header/Footer

Simple header and footer configurations to get you started.

## Minimal Footer

The simplest configuration — just page numbers:

```json
{
  "footer": {
    "center_text": "Page {page} of {pages}"
  }
}
```

## Simple Header with Title and Date

```json
{
  "header": {
    "height": "15mm",
    "left_text": "{title}",
    "right_text": "{date:yyyy-MM-dd}"
  }
}
```

## Header and Footer Together

```json
{
  "header": {
    "height": "15mm",
    "padding": "0 10mm",
    "font_size": "9px",
    "center_text": "{title}",
    "right_text": "{date:MMMM d, yyyy}"
  },
  "footer": {
    "height": "10mm",
    "padding": "0 10mm",
    "font_size": "8px",
    "center_text": "Page {page} of {pages}"
  }
}
```

## With Author Information

```json
{
  "header": {
    "height": "15mm",
    "left_text": "{author}",
    "center_text": "{title}",
    "right_text": "{date:yyyy-MM-dd}"
  },
  "footer": {
    "height": "10mm",
    "center_text": "Page {page} of {pages}"
  }
}
```

## Front Matter Version

Use in your Markdown document:

```yaml
---
title: My Document
author: Jane Smith
pdf:
  header:
    height: 15mm
    left_text: "{author}"
    center_text: "{title}"
    right_text: "{date:MMMM d, yyyy}"
  footer:
    height: 10mm
    center_text: "Page {page} of {pages}"
---

# My Document

Content goes here...
```

## With Borders

Add subtle borders for visual separation:

```json
{
  "header": {
    "height": "15mm",
    "padding": "0 15mm",
    "font_size": "9px",
    "border_bottom": "1px solid #ddd",
    "left_text": "{title}",
    "right_text": "{date:MMMM d, yyyy}"
  },
  "footer": {
    "height": "10mm",
    "padding": "0 15mm",
    "font_size": "8px",
    "border_top": "1px solid #eee",
    "center_text": "Page {page} of {pages}"
  }
}
```

## Styled Footer

Footer with custom styling:

```json
{
  "footer": {
    "height": "12mm",
    "padding": "0 15mm",
    "font_size": "8px",
    "color": "#666",
    "border_top": "1px solid #e0e0e0",
    "left_text": "{filename}",
    "center_text": "Page {page} of {pages}",
    "right_text": "{date:yyyy-MM-dd}"
  }
}
```

## Using Element Objects

For more control, use full element definitions instead of shorthands:

```json
{
  "header": {
    "height": "15mm",
    "padding": "0 15mm",
    "left": {
      "type": "text",
      "content": "{title}",
      "font_weight": "bold"
    },
    "right": {
      "type": "date",
      "format": "MMMM d, yyyy",
      "color": "#666"
    }
  },
  "footer": {
    "height": "10mm",
    "center": {
      "type": "text",
      "content": "Page {page} of {pages}",
      "font_size": "8px",
      "color": "#888"
    }
  }
}
```

## Next Steps

- [Two-Logo Header](/examples/two-logo) — Add company logos
- [Corporate Letterhead](/examples/corporate) — Professional branding
- [Custom Variables](/examples/custom-variables) — Use front matter fields