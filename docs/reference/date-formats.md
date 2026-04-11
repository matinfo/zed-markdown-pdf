# Date Formats Reference

Complete reference for date-fns format patterns used in headers and footers.

## Usage

Use date formats in the `{date:FORMAT}` placeholder or with the `date` element type:

```json
// In text content
{ "type": "text", "content": "{date:MMMM d, yyyy}" }

// With date element
{ "type": "date", "format": "MMMM d, yyyy" }
```

## Common Formats

| Format | Example Output | Use Case |
|--------|----------------|----------|
| `yyyy-MM-dd` | 2025-06-14 | ISO date, technical docs |
| `MMMM d, yyyy` | June 14, 2025 | US formal |
| `d MMMM yyyy` | 14 June 2025 | UK/EU formal |
| `MM/dd/yyyy` | 06/14/2025 | US short |
| `dd/MM/yyyy` | 14/06/2025 | UK/EU short |
| `dd.MM.yyyy` | 14.06.2025 | German/Swiss |
| `yyyy年MM月dd日` | 2025年06月14日 | Japanese |
| `EEEE, MMMM d, yyyy` | Saturday, June 14, 2025 | Full date |
| `EEE, MMM d` | Sat, Jun 14 | Compact |
| `MMM yyyy` | Jun 2025 | Month and year |
| `Q'Q' yyyy` | 2Q 2025 | Quarter |

## Format Tokens

### Year

| Token | Description | Example |
|-------|-------------|---------|
| `yyyy` | 4-digit year | 2025 |
| `yy` | 2-digit year | 25 |
| `y` | Numeric year | 2025 |

### Quarter

| Token | Description | Example |
|-------|-------------|---------|
| `Q` | Quarter number | 2 |
| `Qo` | Quarter ordinal | 2nd |
| `QQQ` | Quarter abbreviated | Q2 |
| `QQQQ` | Quarter full | 2nd quarter |

### Month

| Token | Description | Example |
|-------|-------------|---------|
| `M` | Month number | 6 |
| `MM` | Month 2-digit | 06 |
| `MMM` | Month abbreviated | Jun |
| `MMMM` | Month full | June |
| `MMMMM` | Month narrow | J |

### Week

| Token | Description | Example |
|-------|-------------|---------|
| `w` | Week of year | 24 |
| `ww` | Week 2-digit | 24 |
| `wo` | Week ordinal | 24th |

### Day of Month

| Token | Description | Example |
|-------|-------------|---------|
| `d` | Day of month | 5 |
| `dd` | Day 2-digit | 05 |
| `do` | Day ordinal | 5th |

### Day of Week

| Token | Description | Example |
|-------|-------------|---------|
| `E` | Weekday narrow | S |
| `EE` | Weekday narrow | Sa |
| `EEE` | Weekday abbreviated | Sat |
| `EEEE` | Weekday full | Saturday |
| `EEEEE` | Weekday narrow | S |

### Day of Year

| Token | Description | Example |
|-------|-------------|---------|
| `D` | Day of year | 165 |
| `DD` | Day of year 2-digit | 165 |
| `DDD` | Day of year 3-digit | 165 |

### Hour

| Token | Description | Example |
|-------|-------------|---------|
| `H` | 24-hour | 14 |
| `HH` | 24-hour 2-digit | 14 |
| `h` | 12-hour | 2 |
| `hh` | 12-hour 2-digit | 02 |

### Minute

| Token | Description | Example |
|-------|-------------|---------|
| `m` | Minute | 5 |
| `mm` | Minute 2-digit | 05 |

### Second

| Token | Description | Example |
|-------|-------------|---------|
| `s` | Second | 9 |
| `ss` | Second 2-digit | 09 |

### Fraction of Second

| Token | Description | Example |
|-------|-------------|---------|
| `S` | Tenths | 1 |
| `SS` | Hundredths | 12 |
| `SSS` | Milliseconds | 123 |

### AM/PM

| Token | Description | Example |
|-------|-------------|---------|
| `a` | AM/PM | PM |
| `aa` | AM/PM | PM |
| `aaa` | am/pm | pm |
| `aaaa` | a.m./p.m. | p.m. |

### Timezone

| Token | Description | Example |
|-------|-------------|---------|
| `z` | Timezone abbreviated | EST |
| `zzzz` | Timezone full | Eastern Standard Time |
| `Z` | Timezone offset | -0500 |
| `ZZ` | Timezone offset | -05:00 |
| `ZZZZZ` | Timezone offset | -05:00:00 |

## Regional Examples

### United States

```json
// Standard US date
{ "type": "date", "format": "MM/dd/yyyy" }
// → 06/14/2025

// Formal US
{ "type": "date", "format": "MMMM d, yyyy" }
// → June 14, 2025

// Full with day
{ "type": "date", "format": "EEEE, MMMM d, yyyy" }
// → Saturday, June 14, 2025
```

### United Kingdom / Europe

```json
// UK short
{ "type": "date", "format": "dd/MM/yyyy" }
// → 14/06/2025

// UK formal
{ "type": "date", "format": "d MMMM yyyy" }
// → 14 June 2025

// European with dots
{ "type": "date", "format": "dd.MM.yyyy" }
// → 14.06.2025
```

### ISO Standard

```json
// ISO date
{ "type": "date", "format": "yyyy-MM-dd" }
// → 2025-06-14

// ISO datetime
{ "type": "date", "format": "yyyy-MM-dd HH:mm:ss" }
// → 2025-06-14 14:30:00

// ISO with timezone
{ "type": "date", "format": "yyyy-MM-dd'T'HH:mm:ssZZZZZ" }
// → 2025-06-14T14:30:00-05:00
```

## Time Formats

### 24-Hour

```json
{ "type": "date", "format": "HH:mm" }
// → 14:30

{ "type": "date", "format": "HH:mm:ss" }
// → 14:30:45
```

### 12-Hour

```json
{ "type": "date", "format": "h:mm a" }
// → 2:30 PM

{ "type": "date", "format": "hh:mm:ss a" }
// → 02:30:45 PM
```

## Combined Date & Time

```json
// Standard datetime
{ "type": "date", "format": "MMMM d, yyyy 'at' h:mm a" }
// → June 14, 2025 at 2:30 PM

// Compact datetime
{ "type": "date", "format": "MM/dd/yy HH:mm" }
// → 06/14/25 14:30

// Full datetime
{ "type": "date", "format": "EEEE, MMMM d, yyyy h:mm a" }
// → Saturday, June 14, 2025 2:30 PM
```

## Escaping Text

Use single quotes to include literal text:

```json
// Include literal text
{ "type": "date", "format": "'Generated on' MMMM d, yyyy" }
// → Generated on June 14, 2025

// Quarter notation
{ "type": "date", "format": "'Q'Q yyyy" }
// → Q2 2025

// Time with literal "at"
{ "type": "date", "format": "MMM d 'at' h:mm a" }
// → Jun 14 at 2:30 PM
```

## Default Format

If no format is specified, the default is `yyyy-MM-dd`:

```json
// These are equivalent:
{ "type": "date" }
{ "type": "date", "format": "yyyy-MM-dd" }
// → 2025-06-14
```

## In Text Placeholders

```json
{
  "type": "text",
  "content": "Report generated {date:MMMM d, yyyy} at {date:h:mm a}"
}
// → Report generated June 14, 2025 at 2:30 PM
```

## Front Matter Example

```yaml
---
title: Monthly Report
markdown-pdf:
  header:
    right:
      type: date
      format: MMMM yyyy
      font_size: 10px
  footer:
    left_text: "Generated: {date:yyyy-MM-dd HH:mm}"
    center_text: "Page {page} of {pages}"
---
```

## See Also

- [Date Formatting Guide](/guide/date-formatting)
- [Placeholders Reference](/reference/placeholders)
- [Element Types Reference](/reference/element-types)
- [date-fns Documentation](https://date-fns.org/docs/format)