# Two-Logo Header

A header with logos on both left and right sides — common for joint reports, partnerships, or documents with organization and certification logos.

## Configuration

```json
{
  "header": {
    "height": "20mm",
    "padding": "0 15mm",
    "border_bottom": "1px solid #e0e0e0",
    "left": {
      "type": "image",
      "src": "./assets/company-logo.svg",
      "height": "16mm",
      "alt": "Company Logo"
    },
    "center": {
      "type": "title",
      "font_size": "11px",
      "font_weight": "bold"
    },
    "right": {
      "type": "image",
      "src": "./assets/partner-logo.svg",
      "height": "16mm",
      "alt": "Partner Logo"
    }
  },
  "footer": {
    "height": "10mm",
    "padding": "0 15mm",
    "font_size": "8px",
    "color": "#666",
    "center": {
      "type": "text",
      "content": "Page {page} of {pages}"
    }
  }
}
```

## Front Matter Version

```yaml
---
title: Joint Project Report
markdown-pdf:
  header:
    height: 20mm
    padding: 0 15mm
    border_bottom: 1px solid #e0e0e0
    left:
      type: image
      src: ./assets/company-logo.svg
      height: 16mm
    center:
      type: title
      font_size: 11px
      font_weight: bold
    right:
      type: image
      src: ./assets/partner-logo.svg
      height: 16mm
  footer:
    height: 10mm
    center_text: "Page {page} of {pages}"
---

# Joint Project Report

Content goes here...
```

## Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [LOGO A]          Joint Project Report         [LOGO B]   │
│─────────────────────────────────────────────────────────────│
```

## Variations

### Logos Only (No Title)

```json
{
  "header": {
    "height": "20mm",
    "padding": "0 15mm",
    "left": {
      "type": "image",
      "src": "./logo-left.svg",
      "height": "16mm"
    },
    "right": {
      "type": "image",
      "src": "./logo-right.svg",
      "height": "16mm"
    }
  }
}
```

### With Date Instead of Title

```json
{
  "header": {
    "height": "20mm",
    "padding": "0 15mm",
    "left": {
      "type": "image",
      "src": "./company-logo.svg",
      "height": "16mm"
    },
    "center": {
      "type": "date",
      "format": "MMMM yyyy"
    },
    "right": {
      "type": "image",
      "src": "./certification-badge.svg",
      "height": "16mm"
    }
  }
}
```

### With Company Names Below Logos

```json
{
  "header": {
    "height": "22mm",
    "padding": "0 12mm",
    "font_size": "8px",
    "left": [
      {
        "type": "image",
        "src": "./company-a.svg",
        "height": "14mm"
      },
      {
        "type": "text",
        "content": "Acme Corp",
        "font_size": "7px",
        "color": "#666"
      }
    ],
    "center": {
      "type": "title",
      "font_weight": "bold"
    },
    "right": [
      {
        "type": "image",
        "src": "./company-b.svg",
        "height": "14mm"
      },
      {
        "type": "text",
        "content": "Partner Inc",
        "font_size": "7px",
        "color": "#666"
      }
    ]
  }
}
```

## Tips

### Image Alignment

Both logos use the same `height` value to appear balanced. The actual image files don't need to be the same dimensions — the extension scales them proportionally.

### File Formats

SVG is recommended for logos because:
- Scales perfectly at any size
- Typically smaller file size
- Sharp edges on text and lines

### Fallback for Missing Images

If an image file is not found, the extension logs a warning and continues. Consider adding a text fallback:

```json
{
  "left": [
    { "type": "image", "src": "./logo.svg", "height": "14mm" },
    { "type": "text", "content": "Company Name" }
  ]
}
```

If the image fails to load, the text still appears.

## Complete Example

```yaml
---
title: Partnership Agreement
author: Legal Department
effective_date: 2025-07-01
markdown-pdf:
  page_format: Letter
  header:
    height: 22mm
    padding: 0 15mm
    border_bottom: 2px solid #0066cc
    left:
      type: image
      src: ./assets/acme-logo.svg
      height: 18mm
      alt: Acme Corporation
    center:
      type: title
      font_size: 12px
      font_weight: bold
      color: "#333"
    right:
      type: image
      src: ./assets/globex-logo.svg
      height: 18mm
      alt: Globex Industries
  footer:
    height: 12mm
    padding: 0 15mm
    font_size: 8px
    color: "#666"
    border_top: 1px solid #e0e0e0
    left:
      type: text
      content: "Effective: {effective_date}"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "Confidential"
---

# Partnership Agreement

This agreement is entered into between...
```

## See Also

- [Basic Header/Footer](/examples/basic) — Simple configurations
- [Corporate Letterhead](/examples/corporate) — Single logo with branding
- [Images & Assets Guide](/guide/images) — Working with images