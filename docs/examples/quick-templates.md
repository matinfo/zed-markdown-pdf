# Quick Start Templates

Copy-paste ready configurations for common use cases. Pick one and customize!

## Zed Settings Templates

Add these to your Zed `settings.json` under `context_servers.markdown-pdf.settings`:

---

### Minimal — Just Page Numbers

The simplest setup. Adds page numbers at the bottom.

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                     Document Content                       │
│                                                            │
│                                                            │
│                                                            │
│                      Page 1 of 5                           │
└────────────────────────────────────────────────────────────┘
```

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "footer": {
          "center_text": "Page {page} of {pages}"
        }
      }
    }
  }
}
```

---

### Simple Header & Footer

Title and date in header, page numbers in footer.

```
┌────────────────────────────────────────────────────────────┐
│ My Document                                     2026-04-11 │
│                                                            │
│                                                            │
│                     Document Content                       │
│                                                            │
│                                                            │
│                      Page 1 of 5                           │
└────────────────────────────────────────────────────────────┘
```

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "header": {
          "height": "15mm",
          "left_text": "{title}",
          "right_text": "{date:yyyy-MM-dd}"
        },
        "footer": {
          "height": "10mm",
          "center_text": "Page {page} of {pages}"
        }
      }
    }
  }
}
```

---

### Professional Document

Clean look with borders and styling.

```
┌────────────────────────────────────────────────────────────┐
│ Project Report                            April 11, 2026   │
│────────────────────────────────────────────────────────────│
│                                                            │
│                     Document Content                       │
│                                                            │
│────────────────────────────────────────────────────────────│
│ Jane Smith              Page 1 of 5              report.md │
└────────────────────────────────────────────────────────────┘
```

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "margin": {
          "top": "25mm",
          "bottom": "25mm"
        },
        "header": {
          "height": "15mm",
          "padding": "0 15mm",
          "font_size": "9px",
          "border_bottom": "1px solid #ddd",
          "left_text": "{title}",
          "right_text": "{date:MMMM d, yyyy}"
        },
        "footer": {
          "height": "12mm",
          "padding": "0 15mm",
          "font_size": "8px",
          "color": "#666",
          "border_top": "1px solid #eee",
          "left_text": "{author}",
          "center_text": "Page {page} of {pages}",
          "right_text": "{filename}"
        }
      }
    }
  }
}
```

---

### Company Logo Header

Logo on left, title centered, date on right.

```
┌────────────────────────────────────────────────────────────┐
│ [LOGO]          Project Report            April 11, 2026   │
│════════════════════════════════════════════════════════════│
│                                                            │
│                     Document Content                       │
│                                                            │
│                                                            │
│                      Page 1 of 5                           │
└────────────────────────────────────────────────────────────┘
```

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "assets_directory": "~/.config/zed-markdown-pdf/assets",
        "margin": {
          "top": "25mm",
          "bottom": "20mm"
        },
        "header": {
          "height": "18mm",
          "padding": "0 15mm",
          "border_bottom": "2px solid #0066cc",
          "left_image": "@/company-logo.svg",
          "left_image_height": "14mm",
          "center_text": "{title}",
          "right_text": "{date:MMMM d, yyyy}"
        },
        "footer": {
          "height": "10mm",
          "padding": "0 15mm",
          "font_size": "8px",
          "color": "#666",
          "center_text": "Page {page} of {pages}"
        }
      }
    }
  }
}
```

::: tip Logo Setup
Place your logo at `~/.config/zed-markdown-pdf/assets/company-logo.svg`
:::

---

### Two Logos — Partner Branding

Your logo on left, partner logo on right.

```
┌────────────────────────────────────────────────────────────┐
│ [OUR LOGO]         Joint Proposal          [PARTNER LOGO] │
│────────────────────────────────────────────────────────────│
│                                                            │
│                     Document Content                       │
│                                                            │
│────────────────────────────────────────────────────────────│
│ © 2026 Company           Page 1 of 5          Confidential │
└────────────────────────────────────────────────────────────┘
```

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "assets_directory": "~/.config/zed-markdown-pdf/assets",
        "margin": {
          "top": "28mm",
          "bottom": "22mm"
        },
        "header": {
          "height": "22mm",
          "padding": "0 15mm",
          "border_bottom": "1px solid #ddd",
          "left_image": "@/our-logo.svg",
          "left_image_height": "18mm",
          "center_text": "{title}",
          "right_image": "@/partner-logo.svg",
          "right_image_height": "18mm"
        },
        "footer": {
          "height": "12mm",
          "padding": "0 15mm",
          "font_size": "8px",
          "color": "#666",
          "left_text": "© {date:yyyy} Company Name",
          "center_text": "Page {page} of {pages}",
          "right_text": "Confidential"
        }
      }
    }
  }
}
```

---

### Academic Paper

Author-focused with institutional format.

```
┌────────────────────────────────────────────────────────────┐
│ Dr. Jane Smith                  Research on Climate Change │
│┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄│
│                                                            │
│                     Document Content                       │
│                                                            │
│                                                            │
│                            5                               │
└────────────────────────────────────────────────────────────┘
```

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "font_family": "Times New Roman, Georgia, serif",
        "margin": {
          "top": "25mm",
          "right": "25mm",
          "bottom": "25mm",
          "left": "25mm"
        },
        "header": {
          "height": "12mm",
          "padding": "0 20mm",
          "font_size": "10px",
          "font_style": "italic",
          "color": "#555",
          "border_bottom": "0.5px solid #ccc",
          "left_text": "{author}",
          "right_text": "{title}"
        },
        "footer": {
          "height": "12mm",
          "padding": "0 20mm",
          "font_size": "10px",
          "center_text": "{page}"
        }
      }
    }
  }
}
```

---

### Technical Report

Detailed footer with document metadata.

```
┌────────────────────────────────────────────────────────────┐
│ API Documentation                             Version 2.1  │
│════════════════════════════════════════════════════════════│
│                                                            │
│                     Document Content                       │
│                                                            │
│────────────────────────────────────────────────────────────│
│ J. Smith • Engineering    Page 1 of 12    Updated: 2026-04 │
└────────────────────────────────────────────────────────────┘
```

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "font_family": "Helvetica Neue, Arial, sans-serif",
        "margin": {
          "top": "25mm",
          "bottom": "25mm"
        },
        "header": {
          "height": "16mm",
          "padding": "0 15mm",
          "font_size": "9px",
          "border_bottom": "2px solid #333",
          "left_text": "{title}",
          "right_text": "Version {version}"
        },
        "footer": {
          "height": "14mm",
          "padding": "0 15mm",
          "font_size": "8px",
          "color": "#666",
          "border_top": "1px solid #ddd",
          "left_text": "{author} • {department}",
          "center_text": "Page {page} of {pages}",
          "right_text": "Updated: {date:yyyy-MM}"
        }
      }
    }
  }
}
```

---

## Front Matter Templates

Add these to the top of your Markdown files:

---

### Basic Document

```
┌────────────────────────────────────────────────────────────┐
│ My Document                                     2026-04-11 │
│                                                            │
│                                                            │
│                     Document Content                       │
│                                                            │
│                                                            │
│                      Page 1 of 5                           │
└────────────────────────────────────────────────────────────┘
```

```yaml
---
title: My Document Title
author: Your Name
pdf:
  header:
    height: 15mm
    left_text: "{title}"
    right_text: "{date:yyyy-MM-dd}"
  footer:
    height: 10mm
    center_text: "Page {page} of {pages}"
---

# Your Content Here

Start writing...
```

---

### Meeting Notes

```
┌────────────────────────────────────────────────────────────┐
│ Project X           Team Meeting Notes          2026-04-11 │
│────────────────────────────────────────────────────────────│
│                                                            │
│                     Document Content                       │
│                                                            │
│────────────────────────────────────────────────────────────│
│ Attendees: Alice, Bob, Charlie                     Page 1  │
└────────────────────────────────────────────────────────────┘
```

```yaml
---
title: Team Meeting Notes
author: Note Taker
date: 2026-04-11
attendees: Alice, Bob, Charlie
project: Project X
pdf:
  header:
    height: 16mm
    padding: 0 15mm
    font_size: 9px
    border_bottom: 1px solid #ccc
    left_text: "{project}"
    center_text: "{title}"
    right_text: "{date}"
  footer:
    height: 10mm
    padding: 0 15mm
    font_size: 8px
    color: "#666"
    left_text: "Attendees: {attendees}"
    right_text: "Page {page}"
---

# Meeting Notes

## Agenda
1. Item one
2. Item two

## Discussion

## Action Items
- [ ] Task 1
- [ ] Task 2
```

---

### Project Proposal

```
┌────────────────────────────────────────────────────────────┐
│ Project Proposal      Phase 1 Implementation         v1.0  │
│════════════════════════════════════════════════════════════│
│                                                            │
│                     Document Content                       │
│                                                            │
│────────────────────────────────────────────────────────────│
│ Engineering • J. Smith    Page 1 of 8    Draft — 2026-04   │
└────────────────────────────────────────────────────────────┘
```

```yaml
---
title: Project Proposal
subtitle: Phase 1 Implementation
author: Your Name
department: Engineering
date: 2026-04-11
version: "1.0"
status: Draft
pdf:
  margin:
    top: 28mm
    bottom: 25mm
  header:
    height: 18mm
    padding: 0 15mm
    font_size: 9px
    border_bottom: 2px solid #0066cc
    left_text: "{title}"
    center_text: "{subtitle}"
    right_text: "v{version}"
  footer:
    height: 14mm
    padding: 0 15mm
    font_size: 8px
    color: "#666"
    border_top: 1px solid #eee
    left_text: "{department} • {author}"
    center_text: "Page {page} of {pages}"
    right_text: "{status} — {date}"
---

# Project Proposal

## Executive Summary

## Objectives

## Timeline

## Budget
```

---

### Report with Logo

```
┌────────────────────────────────────────────────────────────┐
│ [LOGO]              Quarterly Report              Q1 2026  │
│                                                  April 2026│
│════════════════════════════════════════════════════════════│
│                                                            │
│                     Document Content                       │
│                                                            │
│────────────────────────────────────────────────────────────│
│ © 2026 Company         Page 1 of 10           Confidential │
└────────────────────────────────────────────────────────────┘
```

```yaml
---
title: Quarterly Report
author: Jane Smith
quarter: Q1 2026
pdf:
  margin:
    top: 28mm
    bottom: 22mm
  header:
    height: 20mm
    padding: 0 15mm
    border_bottom: 2px solid #003366
    left:
      type: image
      src: "@/company-logo.svg"
      height: 16mm
    center:
      type: title
      font_weight: bold
    right:
      - type: text
        content: "{quarter}"
        font_weight: bold
      - type: date
        format: "MMMM yyyy"
        font_size: 8px
        color: "#666"
  footer:
    height: 12mm
    padding: 0 15mm
    font_size: 8px
    color: "#666"
    left_text: "© {date:yyyy} Company Name"
    center_text: "Page {page} of {pages}"
    right_text: "Confidential"
---

# Quarterly Report — Q1 2026

## Highlights

## Metrics

## Next Quarter Goals
```

---

### Invoice / Formal Document

```
┌────────────────────────────────────────────────────────────┐
│ [LOGO]                                            INVOICE  │
│                                               INV-2026-001 │
│                                                            │
│                     Document Content                       │
│                                                            │
│────────────────────────────────────────────────────────────│
│ Due: 2026-05-11         Page 1 of 2    Thank you!          │
└────────────────────────────────────────────────────────────┘
```

```yaml
---
title: Invoice
invoice_number: INV-2026-001
client: Client Company Name
date: 2026-04-11
due_date: 2026-05-11
pdf:
  page_format: A4
  margin:
    top: 30mm
    bottom: 25mm
  header:
    height: 22mm
    padding: 0 15mm
    left:
      type: image
      src: "@/company-logo.svg"
      height: 18mm
    right:
      - type: text
        content: "INVOICE"
        font_size: 16px
        font_weight: bold
        color: "#333"
      - type: text
        content: "{invoice_number}"
        font_size: 10px
        color: "#666"
  footer:
    height: 16mm
    padding: 0 15mm
    font_size: 8px
    color: "#666"
    border_top: 1px solid #ddd
    left_text: "Due: {due_date}"
    center_text: "Page {page} of {pages}"
    right_text: "Thank you!"
---

**Bill To:** {client}

**Date:** {date}

**Due Date:** {due_date}

| Description | Quantity | Unit Price | Total |
|-------------|----------|------------|-------|
| Service A   | 10       | $100       | $1,000 |
| Service B   | 5        | $200       | $1,000 |

**Total Due: $2,000**
```

---

## Quick Customizations

### Change Date Format

| Format | Result |
|--------|--------|
| `{date:yyyy-MM-dd}` | 2026-04-11 |
| `{date:MMMM d, yyyy}` | April 11, 2026 |
| `{date:dd/MM/yyyy}` | 11/04/2026 |
| `{date:MMM yyyy}` | Apr 2026 |

### Common Colors

| Use | Color Code |
|-----|------------|
| Primary Blue | `#0066cc` |
| Dark Blue | `#003366` |
| Muted Text | `#666666` |
| Light Border | `#dddddd` |
| Warning Red | `#cc0000` |

### Recommended Heights

| Element | Height |
|---------|--------|
| Simple header | `12mm` - `15mm` |
| Header with logo | `18mm` - `22mm` |
| Simple footer | `10mm` - `12mm` |
| Detailed footer | `14mm` - `16mm` |

### Recommended Margins

| Style | Top/Bottom | Left/Right |
|-------|------------|------------|
| Compact | `15mm` | `15mm` |
| Normal | `20mm` | `15mm` |
| With header/footer | `25mm` | `15mm` |
| Academic | `25mm` | `25mm` |

---

## Global Assets Setup

For logos and shared images:

**1. Create the assets folder:**

```bash
mkdir -p ~/.config/zed-markdown-pdf/assets
```

**2. Copy your logos there:**

```bash
cp company-logo.svg ~/.config/zed-markdown-pdf/assets/
```

**3. Reference with @/ prefix:**

```json
{
  "assets_directory": "~/.config/zed-markdown-pdf/assets",
  "header": {
    "left_image": "@/company-logo.svg"
  }
}
```

---

## Next Steps

- [Images & Assets](/guide/images) — Image handling details
- [Placeholders](/guide/placeholders) — All available placeholders
- [Date Formatting](/guide/date-formatting) — Date format options
- [Custom Styling](/guide/custom-styling) — CSS customization