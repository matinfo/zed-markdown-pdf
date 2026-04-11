# Corporate Letterhead

A professional corporate letterhead with company logo, document title, and comprehensive footer.

## Preview

```
┌──────────────────────────────────────────────────────────────┐
│ [LOGO] Acme Corporation     Document Title     June 14, 2025 │
│──────────────────────────────────────────────────────────────│
│                                                              │
│                       Document Content                       │
│                                                              │
│──────────────────────────────────────────────────────────────│
│ © 2025 Acme Corp         Page 1 of 10           Confidential │
└──────────────────────────────────────────────────────────────┘
```

## Configuration

### Global Settings (settings.json)

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "page_format": "A4",
        "margin": {
          "top": "25mm",
          "right": "20mm",
          "bottom": "25mm",
          "left": "20mm"
        },
        "font_family": "Helvetica Neue, Arial, sans-serif",
        "header": {
          "height": "20mm",
          "padding": "0 15mm",
          "font_size": "9px",
          "border_bottom": "2px solid #0066cc",
          "left": [
            {
              "type": "image",
              "src": "./assets/logo.svg",
              "height": "16mm"
            },
            {
              "type": "text",
              "content": "{company}",
              "font_weight": "bold",
              "color": "#0066cc"
            }
          ],
          "center": {
            "type": "title",
            "font_weight": "600"
          },
          "right": {
            "type": "date",
            "format": "MMMM d, yyyy",
            "color": "#666"
          }
        },
        "footer": {
          "height": "15mm",
          "padding": "0 15mm",
          "font_size": "8px",
          "color": "#666",
          "border_top": "1px solid #ddd",
          "left": {
            "type": "text",
            "content": "© {date:yyyy} {company}"
          },
          "center": {
            "type": "text",
            "content": "Page {page} of {pages}"
          },
          "right": {
            "type": "text",
            "content": "Confidential",
            "font_weight": "bold",
            "color": "#cc0000"
          }
        }
      }
    }
  }
}
```

### Front Matter Override

For specific documents, override settings in front matter:

```yaml
---
title: Q2 Financial Report
author: Jane Smith
company: Acme Corporation
department: Finance Division
classification: Internal Use Only
markdown-pdf:
  header:
    left:
      - type: image
        src: ./assets/logo.svg
        height: 16mm
      - type: text
        content: "{company}"
        font_weight: bold
        color: "#0066cc"
      - type: text
        content: "{department}"
        font_size: 7px
        color: "#999"
    center:
      type: title
      font_weight: 600
    right:
      type: date
      format: MMMM d, yyyy
  footer:
    left:
      type: text
      content: "© {date:yyyy} {company}"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "{classification}"
      font_weight: bold
      color: "#cc6600"
---

# Q2 Financial Report

Content goes here...
```

## Variations

### Simple Corporate Header

Minimal corporate header with just logo and title:

```json
{
  "header": {
    "height": "18mm",
    "padding": "0 15mm",
    "border_bottom": "3px solid #003366",
    "left_image": "./logo.svg",
    "left_image_height": "14mm",
    "center_text": "{title}",
    "right_text": "{date:yyyy-MM-dd}"
  }
}
```

### Department-Specific Header

Include department information:

```yaml
---
company: Acme Corporation
department: Human Resources
division: Talent Acquisition
markdown-pdf:
  header:
    height: 22mm
    padding: 0 15mm
    left:
      type: image
      src: ./assets/logo.svg
      height: 18mm
    center:
      - type: text
        content: "{department}"
        font_weight: bold
        font_size: 11px
      - type: text
        content: "{division}"
        font_size: 8px
        color: "#666"
    right:
      type: date
      format: MMMM yyyy
---
```

### Legal/Compliance Footer

For documents requiring legal disclaimers:

```json
{
  "footer": {
    "height": "18mm",
    "padding": "0 10mm",
    "font_size": "7px",
    "color": "#888",
    "border_top": "1px solid #ccc",
    "left": {
      "type": "text",
      "content": "Document ID: {doc_id}"
    },
    "center": [
      {
        "type": "text",
        "content": "Page {page} of {pages}"
      },
      {
        "type": "text",
        "content": "This document is confidential and intended for internal use only.",
        "font_size": "6px"
      }
    ],
    "right": {
      "type": "text",
      "content": "Printed: {date:yyyy-MM-dd HH:mm}"
    }
  }
}
```

## Custom Stylesheet

Pair with a corporate CSS file for consistent branding:

```css
/* corporate.css */

:root {
  --brand-primary: #0066cc;
  --brand-secondary: #003366;
  --text-dark: #333;
  --text-muted: #666;
  --border-light: #e0e0e0;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: var(--text-dark);
}

h1 {
  color: var(--brand-primary);
  font-size: 24pt;
  border-bottom: 3px solid var(--brand-primary);
  padding-bottom: 0.3em;
}

h2 {
  color: var(--brand-secondary);
  font-size: 18pt;
  margin-top: 1.5em;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background-color: var(--brand-primary);
  color: white;
  padding: 0.75em;
  text-align: left;
}

td {
  border: 1px solid var(--border-light);
  padding: 0.5em 0.75em;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

blockquote {
  border-left: 4px solid var(--brand-primary);
  margin: 1em 0;
  padding: 0.5em 1em;
  background-color: #f5f9fc;
}

@media print {
  h1, h2, h3 {
    page-break-after: avoid;
  }
  
  table, pre, blockquote {
    page-break-inside: avoid;
  }
}
```

Reference in settings:

```json
{
  "include_default_styles": true,
  "stylesheet_path": "./styles/corporate.css"
}
```

## Complete Example Document

```markdown
---
title: Annual Report 2025
author: John Smith, CFO
company: Acme Corporation
department: Finance
fiscal_year: 2025
classification: Confidential
markdown-pdf:
  page_format: A4
  orientation: portrait
  margin:
    top: 28mm
    bottom: 28mm
  stylesheet_path: ./styles/corporate.css
  header:
    height: 22mm
    padding: 0 15mm
    font_size: 9px
    border_bottom: 2px solid #0066cc
    left:
      - type: image
        src: ./assets/acme-logo.svg
        height: 18mm
        alt: Acme Corporation
    center:
      - type: title
        font_weight: bold
        font_size: 12px
      - type: text
        content: "FY{fiscal_year}"
        font_size: 8px
        color: "#666"
    right:
      - type: date
        format: MMMM d, yyyy
      - type: text
        content: "{classification}"
        color: "#cc0000"
        font_size: 8px
  footer:
    height: 14mm
    padding: 0 15mm
    font_size: 8px
    color: "#666"
    border_top: 1px solid #ddd
    left:
      type: text
      content: "© {date:yyyy} {company} • {department}"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "Prepared by {author}"
---

# Annual Report 2025

## Executive Summary

This annual report presents the financial performance and strategic 
achievements of Acme Corporation for the fiscal year 2025.

## Financial Highlights

| Metric | FY2024 | FY2025 | Change |
|--------|--------|--------|--------|
| Revenue | $10.5M | $12.3M | +17% |
| Net Income | $2.1M | $2.8M | +33% |
| EBITDA | $3.2M | $4.1M | +28% |

## Strategic Initiatives

1. **Market Expansion** — Entered three new geographic markets
2. **Product Innovation** — Launched five new product lines
3. **Operational Efficiency** — Reduced costs by 12%

<div class="page"></div>

## Outlook for FY2026

We anticipate continued growth driven by...
```

## Tips

1. **Use SVG logos** — They scale perfectly and keep file sizes small
2. **Set appropriate margins** — Leave room for header and footer (25mm top/bottom works well)
3. **Test print output** — Export a sample PDF to verify alignment
4. **Keep text concise** — Headers/footers have limited space
5. **Use consistent branding** — Match colors with your company's brand guidelines

## Related Examples

- [Two-Logo Header](/examples/two-logo) — Dual branding
- [Academic Paper](/examples/academic) — Formal academic style
- [Custom Variables](/examples/custom-variables) — Advanced placeholder usage
