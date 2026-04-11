# Placeholders

Placeholders let you insert dynamic content into headers and footers. They are replaced at export time with actual values from the document, front matter, or system.

## Syntax

Placeholders use curly braces:

```
{placeholder}
{placeholder:format}
```

The format argument is optional and only applies to certain placeholders (like `date`).

## Built-in Placeholders

### Page Numbers

| Placeholder | Description | Rendered As |
|-------------|-------------|-------------|
| `{page}` | Current page number | `<span class="pageNumber"></span>` |
| `{pages}` | Total pages | `<span class="totalPages"></span>` |

Page number placeholders are rendered by Chromium at print time — they're the only way to get accurate page numbers in PDFs.

```json
{
  "footer": {
    "center": {
      "type": "text",
      "content": "Page {page} of {pages}"
    }
  }
}
```

### Date and Time

| Placeholder | Description | Example Output |
|-------------|-------------|----------------|
| `{date}` | Current date (ISO) | `2025-06-14` |
| `{date:FORMAT}` | Formatted date | `June 14, 2025` |
| `{time}` | Current time | `14:30:00` |
| `{datetime}` | Date and time | `2025-06-14 14:30:00` |

#### Date Format Examples

```json
{
  "header": {
    "right": {
      "type": "text",
      "content": "{date:MMMM d, yyyy}"
    }
  }
}
```

Common formats:

| Format | Output |
|--------|--------|
| `{date}` | `2025-06-14` |
| `{date:yyyy-MM-dd}` | `2025-06-14` |
| `{date:MMMM d, yyyy}` | `June 14, 2025` |
| `{date:MM/dd/yyyy}` | `06/14/2025` |
| `{date:dd.MM.yyyy}` | `14.06.2025` |
| `{date:d MMMM yyyy}` | `14 June 2025` |

See [Date Formatting](/guide/date-formatting) for complete format reference.

### Document Metadata

| Placeholder | Description | Source |
|-------------|-------------|--------|
| `{title}` | Document title | Front matter `title:` or filename |
| `{author}` | Author name | Front matter `author:` |
| `{filename}` | Source filename | File path |

```yaml
---
title: Quarterly Report
author: Jane Smith
---
```

```json
{
  "header": {
    "left_text": "{author}",
    "center_text": "{title}"
  }
}
```

## Custom Variables

Any field in your front matter becomes a placeholder:

```yaml
---
title: Project Report
company: Acme Corporation
department: Engineering
version: 1.2.3
project_code: PRJ-2025-001
---
```

All these are available:

| Front Matter | Placeholder |
|--------------|-------------|
| `company: Acme Corporation` | `{company}` |
| `department: Engineering` | `{department}` |
| `version: 1.2.3` | `{version}` |
| `project_code: PRJ-2025-001` | `{project_code}` |

### Using Custom Variables

```yaml
---
title: Project Report
company: Acme Corp
version: 2.0.0
pdf:
  header:
    left_text: "{company}"
    center_text: "{title}"
    right_text: "v{version}"
  footer:
    center_text: "Page {page} of {pages}"
---
```

## Using Placeholders in Elements

### In Text Elements

```json
{
  "type": "text",
  "content": "Document: {title} | Author: {author}"
}
```

### In page_number Format

```json
{
  "type": "page_number",
  "format": "Page {page}"
}
```

### In date Format

The `date` element uses a date-fns format string, not placeholders:

```json
{
  "type": "date",
  "format": "MMMM d, yyyy"
}
```

### In title Element

The `title` element doesn't use placeholders — it automatically uses the document title. Use `fallback` for a default:

```json
{
  "type": "title",
  "fallback": "Untitled Document"
}
```

## Combining Placeholders

You can combine multiple placeholders and static text:

```json
{
  "type": "text",
  "content": "{company} — {title} — {date:yyyy}"
}
```

Output: `Acme Corp — Quarterly Report — 2025`

## Escaping

Currently, there's no way to escape curly braces. If you need literal `{` or `}` characters, use the Unicode equivalents or avoid the placeholder syntax.

## Placeholder Resolution

Placeholders are resolved at export time in this order:

1. **Chromium placeholders** (`{page}`, `{pages}`) → Converted to `<span>` elements
2. **Date placeholders** → Formatted using date-fns
3. **Document metadata** → From front matter or filename
4. **Custom variables** → From front matter
5. **Unknown placeholders** → Left as-is (useful for debugging)

## Debugging Placeholders

If a placeholder doesn't resolve:

1. Check the front matter field name (case-insensitive)
2. Ensure the front matter is valid YAML
3. Check the debug log: `/tmp/zed-markdown-pdf-debug.log`

```yaml
# This works:
---
company: Acme Corp
---

# Also works (YAML flexibility):
---
Company: Acme Corp
---
```

Both can be used as `{company}`.

## Complete Example

```yaml
---
title: Q2 Financial Report
author: Jane Smith
company: Acme Corporation
department: Finance
fiscal_year: 2025
confidential: true
pdf:
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
    color: "#666"
    border_top: 1px solid #eee
    left:
      type: text
      content: "FY{fiscal_year}"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "{author}"
---

# Q2 Financial Report

Content goes here...
```

## Next Steps

- [Date Formatting](/guide/date-formatting) — Complete date-fns format reference
- [Elements](/guide/elements) — All element types
- [Front Matter](/guide/front-matter) — Configure per-document settings