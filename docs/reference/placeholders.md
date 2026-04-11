# Placeholders Reference

Complete reference for all placeholders available in headers and footers.

## Syntax

```
{placeholder}
{placeholder:format}
```

The `:format` suffix is optional and only applies to certain placeholders (like `date`).

## Page Placeholders

Rendered by Chromium at print time — guaranteed accurate.

| Placeholder | Description | HTML Output |
|-------------|-------------|-------------|
| `{page}` | Current page number | `<span class="pageNumber"></span>` |
| `{pages}` | Total page count | `<span class="totalPages"></span>` |

### Example

```json
{
  "footer": {
    "center_text": "Page {page} of {pages}"
  }
}
```

Output: **Page 3 of 10**

## Date & Time Placeholders

Resolved at export time using [date-fns](https://date-fns.org/).

| Placeholder | Default Format | Example Output |
|-------------|----------------|----------------|
| `{date}` | `yyyy-MM-dd` | `2025-06-14` |
| `{date:FORMAT}` | Custom | See below |
| `{time}` | `HH:mm:ss` | `14:30:00` |
| `{datetime}` | `yyyy-MM-dd HH:mm:ss` | `2025-06-14 14:30:00` |

### Date Format Examples

| Placeholder | Output |
|-------------|--------|
| `{date}` | `2025-06-14` |
| `{date:yyyy-MM-dd}` | `2025-06-14` |
| `{date:MMMM d, yyyy}` | `June 14, 2025` |
| `{date:MM/dd/yyyy}` | `06/14/2025` |
| `{date:dd/MM/yyyy}` | `14/06/2025` |
| `{date:dd.MM.yyyy}` | `14.06.2025` |
| `{date:d MMMM yyyy}` | `14 June 2025` |
| `{date:EEE, MMM d}` | `Sat, Jun 14` |
| `{date:EEEE, MMMM d, yyyy}` | `Saturday, June 14, 2025` |
| `{date:Q}` | `2` (quarter) |
| `{date:yyyy}` | `2025` |

### Time Format Examples

| Placeholder | Output |
|-------------|--------|
| `{time}` | `14:30:00` |
| `{date:HH:mm}` | `14:30` |
| `{date:h:mm a}` | `2:30 PM` |
| `{date:HH:mm:ss}` | `14:30:00` |

### Date-fns Format Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `yyyy` | 4-digit year | `2025` |
| `yy` | 2-digit year | `25` |
| `MMMM` | Full month | `January` |
| `MMM` | Abbreviated month | `Jan` |
| `MM` | 2-digit month | `01` |
| `M` | Month number | `1` |
| `dd` | 2-digit day | `05` |
| `d` | Day number | `5` |
| `EEEE` | Full weekday | `Monday` |
| `EEE` | Abbreviated weekday | `Mon` |
| `HH` | 24-hour hour | `14` |
| `hh` | 12-hour hour | `02` |
| `mm` | Minutes | `30` |
| `ss` | Seconds | `45` |
| `a` | AM/PM | `PM` |
| `Q` | Quarter | `2` |

## Document Metadata Placeholders

| Placeholder | Source | Description |
|-------------|--------|-------------|
| `{title}` | Front matter `title:` or filename | Document title |
| `{author}` | Front matter `author:` | Author name |
| `{filename}` | File path | Source filename with extension |

### Example

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

Output: **Jane Smith** | **Quarterly Report**

## Custom Variable Placeholders

Any field in front matter becomes a placeholder:

```yaml
---
title: Project Report
company: Acme Corporation
department: Engineering
version: 2.0.0
project_code: PRJ-2025-001
client_name: BigCorp Inc.
fiscal_year: 2025
---
```

All are available as placeholders:

| Front Matter Field | Placeholder |
|--------------------|-------------|
| `company: Acme Corporation` | `{company}` |
| `department: Engineering` | `{department}` |
| `version: 2.0.0` | `{version}` |
| `project_code: PRJ-2025-001` | `{project_code}` |
| `client_name: BigCorp Inc.` | `{client_name}` |
| `fiscal_year: 2025` | `{fiscal_year}` |

### Using Custom Variables

```yaml
---
company: Acme Corp
version: 1.0.0
markdown-pdf:
  header:
    left_text: "{company}"
    right_text: "v{version}"
  footer:
    center_text: "Page {page} of {pages}"
---
```

## Combining Placeholders

Multiple placeholders can be combined in a single text:

```json
{
  "type": "text",
  "content": "{company} — {title} — {date:yyyy}"
}
```

Output: **Acme Corp — Quarterly Report — 2025**

```json
{
  "type": "text",
  "content": "Generated {date:MMMM d, yyyy} at {date:HH:mm}"
}
```

Output: **Generated June 14, 2025 at 14:30**

## Placeholder Resolution

Placeholders are resolved in this order:

1. **Page placeholders** (`{page}`, `{pages}`) → Chromium spans
2. **Date/time placeholders** → date-fns formatted strings
3. **Document metadata** (`{title}`, `{author}`, `{filename}`)
4. **Custom variables** → From front matter
5. **Unknown** → Left as-is (for debugging)

## Case Sensitivity

Placeholder names are **case-insensitive**:

```yaml
---
Company: Acme Corp
DEPARTMENT: Engineering
---
```

Both work as `{company}` and `{department}`.

## Reserved Names

These names are reserved and have special handling:

| Name | Type |
|------|------|
| `page` | Chromium page number |
| `pages` | Chromium total pages |
| `date` | Current date |
| `time` | Current time |
| `datetime` | Current date and time |
| `title` | Document title |
| `author` | Document author |
| `filename` | Source filename |

Avoid using these as custom front matter field names.

## Escaping

Currently, there is no escape syntax for literal curly braces. Avoid text that matches the `{name}` pattern unless you want placeholder substitution.

## Troubleshooting

### Placeholder Not Replaced

1. Check spelling and case
2. Verify front matter is valid YAML
3. Ensure the field exists in front matter
4. Check the debug log: `/tmp/zed-markdown-pdf-debug.log`

### Date Format Invalid

If a date format is invalid, it falls back to ISO format (`yyyy-MM-dd`). Check the format string against [date-fns documentation](https://date-fns.org/docs/format).

### Unknown Placeholder Shows

Unknown placeholders are left as-is. This helps with debugging:

```
{compnay}  → {compnay}  (typo, not replaced)
{company}  → Acme Corp  (correct)
```
