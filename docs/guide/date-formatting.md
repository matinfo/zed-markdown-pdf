# Date Formatting

The Markdown PDF extension uses [date-fns](https://date-fns.org/) for date formatting. This gives you powerful, flexible control over how dates appear in your headers and footers.

## Basic Usage

Use the `{date:FORMAT}` placeholder in text elements:

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

Or with the dedicated `date` element type:

```json
{
  "header": {
    "right": {
      "type": "date",
      "format": "MMMM d, yyyy"
    }
  }
}
```

Both produce: **June 14, 2025**

## Common Formats

| Format | Example | Use Case |
|--------|---------|----------|
| `yyyy-MM-dd` | 2025-06-14 | ISO date, sorting |
| `MMMM d, yyyy` | June 14, 2025 | US formal |
| `d MMMM yyyy` | 14 June 2025 | UK/EU formal |
| `MM/dd/yyyy` | 06/14/2025 | US short |
| `dd/MM/yyyy` | 14/06/2025 | UK/EU short |
| `dd.MM.yyyy` | 14.06.2025 | German/Swiss |
| `yyyy年MM月dd日` | 2025年06月14日 | Japanese |

## Format Tokens

### Year

| Token | Output | Example |
|-------|--------|---------|
| `yyyy` | 4-digit year | 2025 |
| `yy` | 2-digit year | 25 |

### Month

| Token | Output | Example |
|-------|--------|---------|
| `MMMM` | Full month name | January |
| `MMM` | Abbreviated month | Jan |
| `MM` | 2-digit month | 01 |
| `M` | Month number | 1 |

### Day

| Token | Output | Example |
|-------|--------|---------|
| `dd` | 2-digit day | 05 |
| `d` | Day number | 5 |
| `EEEE` | Full weekday | Monday |
| `EEE` | Abbreviated weekday | Mon |
| `E` | Short weekday | M |

### Time

| Token | Output | Example |
|-------|--------|---------|
| `HH` | 24-hour hour (2-digit) | 14 |
| `H` | 24-hour hour | 14 |
| `hh` | 12-hour hour (2-digit) | 02 |
| `h` | 12-hour hour | 2 |
| `mm` | Minutes (2-digit) | 05 |
| `m` | Minutes | 5 |
| `ss` | Seconds (2-digit) | 09 |
| `s` | Seconds | 9 |
| `a` | AM/PM | PM |

### Other

| Token | Output | Example |
|-------|--------|---------|
| `Q` | Quarter | 2 |
| `Qo` | Quarter (ordinal) | 2nd |
| `w` | Week of year | 24 |

## Preset Formats

For convenience, you can use named presets:

| Preset | Format | Example |
|--------|--------|---------|
| `iso` | `yyyy-MM-dd` | 2025-06-14 |
| `us` | `MM/dd/yyyy` | 06/14/2025 |
| `us-long` | `MMMM d, yyyy` | June 14, 2025 |
| `eu` | `dd/MM/yyyy` | 14/06/2025 |
| `eu-long` | `d MMMM yyyy` | 14 June 2025 |
| `eu-dot` | `dd.MM.yyyy` | 14.06.2025 |

## Examples

### US Format

```json
{
  "header": {
    "right_text": "{date:MMMM d, yyyy}"
  }
}
```
→ **June 14, 2025**

### European Format

```json
{
  "header": {
    "right_text": "{date:d MMMM yyyy}"
  }
}
```
→ **14 June 2025**

### ISO Date

```json
{
  "footer": {
    "left_text": "Generated: {date:yyyy-MM-dd}"
  }
}
```
→ **Generated: 2025-06-14**

### With Time

```json
{
  "footer": {
    "right_text": "{date:yyyy-MM-dd HH:mm}"
  }
}
```
→ **2025-06-14 14:30**

### Day of Week

```json
{
  "header": {
    "right_text": "{date:EEEE, MMMM d, yyyy}"
  }
}
```
→ **Saturday, June 14, 2025**

### Quarter

```json
{
  "footer": {
    "left_text": "Q{date:Q} {date:yyyy}"
  }
}
```
→ **Q2 2025**

## Date Element Type

Use the `date` element type for standalone date display:

```json
{
  "header": {
    "right": {
      "type": "date",
      "format": "MMMM d, yyyy",
      "font_size": "10px",
      "color": "#666"
    }
  }
}
```

### Date Element Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | `"date"` | Element type |
| `format` | `string` | date-fns format string |
| `font_size` | `string` | CSS font size |
| `font_weight` | `string\|number` | CSS font weight |
| `color` | `string` | CSS color |
| `style` | `string` | Additional inline CSS |

## Combining with Other Placeholders

Date placeholders work alongside other placeholders:

```json
{
  "footer": {
    "center_text": "{title} • {date:MMMM yyyy} • Page {page}"
  }
}
```
→ **My Report • June 2025 • Page 3**

## Default Format

If you use `{date}` without a format, it defaults to ISO format (`yyyy-MM-dd`):

```json
{
  "footer": {
    "left_text": "{date}"
  }
}
```
→ **2025-06-14**

## Time Zones

Dates are rendered using the local time of the machine running the export. The current time is captured at the start of the export and used consistently throughout.

## Front Matter Example

```yaml
---
title: Quarterly Report
pdf:
  header:
    height: 15mm
    left_text: "Acme Corp"
    right:
      type: date
      format: MMMM d, yyyy
  footer:
    center_text: "{date:Q}Q {date:yyyy} Report • Page {page} of {pages}"
---
```

## Next Steps

- [Placeholders](/guide/placeholders) — All available placeholders
- [Elements](/guide/elements) — Element types reference
- [Examples](/examples/corporate) — See date formatting in action