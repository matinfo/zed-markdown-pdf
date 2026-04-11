# Elements

Elements are the building blocks of headers and footers. Each element has a `type` and type-specific properties.

## Element Types Overview

| Type | Description | Primary Property |
|------|-------------|------------------|
| `text` | Static or dynamic text | `content` |
| `image` | Embedded image (SVG, PNG, JPG) | `src` |
| `date` | Formatted date/time | `format` |
| `title` | Document title | `fallback` |
| `page_number` | Current page number | `format` |
| `total_pages` | Total page count | `format` |
| `spacer` | Flexible or fixed space | `width` |

## Text Element

Display static text or dynamic content with placeholders.

```json
{
  "type": "text",
  "content": "Page {page} of {pages}",
  "font_size": "9px",
  "font_weight": "bold",
  "font_style": "italic",
  "color": "#333"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `content` | `string` | Text content, supports [placeholders](/guide/placeholders) |
| `font_size` | `string` | CSS font-size (`"9px"`, `"10pt"`) |
| `font_weight` | `string \| number` | CSS font-weight (`"bold"`, `"normal"`, `600`) |
| `font_style` | `string` | CSS font-style (`"normal"`, `"italic"`, `"oblique"`) |
| `color` | `string` | CSS color (`"#333"`, `"gray"`, `"rgb(100,100,100)"`) |
| `style` | `string` | Additional inline CSS |

### Examples

```json
// Simple text
{ "type": "text", "content": "Confidential" }

// With placeholder
{ "type": "text", "content": "Author: {author}" }

// Styled
{
  "type": "text",
  "content": "DRAFT",
  "font_size": "12px",
  "font_weight": "bold",
  "color": "red"
}

// Page numbers
{ "type": "text", "content": "Page {page} of {pages}" }
```

## Image Element

Embed an image (SVG, PNG, or JPG). Images are converted to base64 data URIs.

```json
{
  "type": "image",
  "src": "./logo.svg",
  "height": "12mm",
  "alt": "Company Logo"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string` | Path to image file (relative to Markdown file) |
| `height` | `string` | CSS height (`"12mm"`, `"20px"`) |
| `width` | `string` | CSS width (usually omit to preserve aspect ratio) |
| `alt` | `string` | Alt text for accessibility |
| `style` | `string` | Additional inline CSS |

### Supported Formats

- **SVG** — Recommended for logos, scales perfectly
- **PNG** — Good for images with transparency
- **JPG/JPEG** — Good for photos

### Examples

```json
// Basic logo
{ "type": "image", "src": "./logo.svg", "height": "15mm" }

// With alt text
{
  "type": "image",
  "src": "./images/company-logo.png",
  "height": "12mm",
  "alt": "Acme Corporation"
}

// Fixed width (height auto-scales)
{ "type": "image", "src": "./icon.svg", "width": "20mm" }
```

::: tip
Keep images small for faster PDF generation. SVGs are ideal because they're typically small and scale perfectly at any size.
:::

## Date Element

Display a formatted date or time.

```json
{
  "type": "date",
  "format": "MMMM d, yyyy",
  "font_size": "9px"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `format` | `string` | date-fns format pattern (default: `"yyyy-MM-dd"`) |
| `font_size` | `string` | CSS font-size |
| `color` | `string` | CSS color |
| `style` | `string` | Additional inline CSS |

### Common Formats

| Format | Example Output |
|--------|----------------|
| `yyyy-MM-dd` | 2025-06-14 |
| `MMMM d, yyyy` | June 14, 2025 |
| `MM/dd/yyyy` | 06/14/2025 |
| `dd.MM.yyyy` | 14.06.2025 |
| `d MMMM yyyy` | 14 June 2025 |
| `EEE, MMM d` | Sat, Jun 14 |
| `HH:mm` | 14:30 |
| `h:mm a` | 2:30 PM |

See [Date Formatting](/guide/date-formatting) for the full reference.

### Examples

```json
// ISO date (default)
{ "type": "date" }

// US format
{ "type": "date", "format": "MM/dd/yyyy" }

// Long format
{ "type": "date", "format": "MMMM d, yyyy" }

// Date and time
{ "type": "date", "format": "yyyy-MM-dd HH:mm" }

// Styled
{
  "type": "date",
  "format": "MMMM d, yyyy",
  "font_size": "8px",
  "color": "#666"
}
```

## Title Element

Display the document title from front matter or the filename.

```json
{
  "type": "title",
  "font_weight": "bold",
  "fallback": "Untitled Document"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `fallback` | `string` | Text to show if no title is found |
| `font_size` | `string` | CSS font-size |
| `font_weight` | `string \| number` | CSS font-weight |
| `font_style` | `string` | CSS font-style |
| `color` | `string` | CSS color |
| `style` | `string` | Additional inline CSS |

### Title Resolution

The title is resolved in this order:

1. `title` field in YAML front matter
2. First H1 heading in the document
3. Filename (without extension)
4. `fallback` value (if specified)

### Examples

```json
// Basic
{ "type": "title" }

// With fallback
{ "type": "title", "fallback": "Untitled" }

// Styled
{
  "type": "title",
  "font_weight": "bold",
  "font_style": "italic",
  "color": "#2c3e50"
}
```

## Page Number Element

Display the current page number.

```json
{
  "type": "page_number",
  "format": "Page {page}",
  "font_size": "9px"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `format` | `string` | Format string with `{page}` placeholder |
| `font_size` | `string` | CSS font-size |
| `color` | `string` | CSS color |
| `style` | `string` | Additional inline CSS |

### Examples

```json
// Just the number
{ "type": "page_number" }

// With prefix
{ "type": "page_number", "format": "Page {page}" }

// Styled
{
  "type": "page_number",
  "format": "- {page} -",
  "font_size": "8px",
  "color": "#999"
}
```

::: info
Page numbers are rendered by Chromium at print time, so they're always accurate.
:::

## Total Pages Element

Display the total number of pages.

```json
{
  "type": "total_pages",
  "format": "{pages} pages"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `format` | `string` | Format string with `{pages}` placeholder |
| `font_size` | `string` | CSS font-size |
| `color` | `string` | CSS color |
| `style` | `string` | Additional inline CSS |

### Examples

```json
// Just the number
{ "type": "total_pages" }

// With text
{ "type": "total_pages", "format": "of {pages}" }
```

::: tip
For "Page X of Y" format, use a text element instead:
```json
{ "type": "text", "content": "Page {page} of {pages}" }
```
:::

## Spacer Element

Add flexible or fixed space between elements in a zone.

```json
{ "type": "spacer" }
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `width` | `string` | Fixed width (`"10mm"`, `"20px"`). If omitted, uses `flex: 1` |

### Examples

```json
// Flexible spacer (fills available space)
{ "type": "spacer" }

// Fixed width
{ "type": "spacer", "width": "15mm" }
```

### Use Case: Push Elements Apart

```json
{
  "header": {
    "left": [
      { "type": "image", "src": "./logo.svg", "height": "10mm" },
      { "type": "spacer" },
      { "type": "text", "content": "Division Name" }
    ]
  }
}
```

The spacer pushes "Division Name" to the right edge of the left zone.

## Common Styling Properties

Most elements support these styling properties:

| Property | Type | Description |
|----------|------|-------------|
| `font_size` | `string` | CSS font-size |
| `font_weight` | `string \| number` | CSS font-weight |
| `font_style` | `string` | CSS font-style |
| `color` | `string` | CSS color |
| `style` | `string` | Additional inline CSS styles |

The `style` property allows arbitrary CSS:

```json
{
  "type": "text",
  "content": "Important",
  "style": "text-transform: uppercase; letter-spacing: 2px;"
}
```

## Next Steps

- [Placeholders](/guide/placeholders) — Dynamic content in text elements
- [Date Formatting](/guide/date-formatting) — All date-fns format patterns
- [Images & Assets](/guide/images) — Working with images