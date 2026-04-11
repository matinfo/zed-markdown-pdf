# Element Types Reference

Complete reference for all element types available in structured headers and footers.

## Overview

| Type | Description | Primary Property |
|------|-------------|------------------|
| [`text`](#text) | Static or dynamic text | `content` |
| [`image`](#image) | Embedded image | `src` |
| [`date`](#date) | Formatted date/time | `format` |
| [`title`](#title) | Document title | `fallback` |
| [`page_number`](#page-number) | Current page | `format` |
| [`total_pages`](#total-pages) | Total pages | `format` |
| [`spacer`](#spacer) | Flexible/fixed space | `width` |

## text

Display static text or dynamic content with placeholders.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"text"` | ✓ | Element type |
| `content` | `string` | ✓ | Text content with [placeholders](/reference/placeholders) |
| `font_size` | `string` | | CSS font-size |
| `font_weight` | `string \| number` | | CSS font-weight |
| `font_style` | `string` | | CSS font-style (`normal`, `italic`, `oblique`) |
| `color` | `string` | | CSS color |
| `style` | `string` | | Additional inline CSS |

### Examples

```json
// Simple text
{ "type": "text", "content": "Confidential" }

// With placeholder
{ "type": "text", "content": "Author: {author}" }

// Page numbers
{ "type": "text", "content": "Page {page} of {pages}" }

// Styled
{
  "type": "text",
  "content": "DRAFT",
  "font_size": "12px",
  "font_weight": "bold",
  "color": "red"
}

// With custom CSS
{
  "type": "text",
  "content": "Important",
  "style": "text-transform: uppercase; letter-spacing: 2px;"
}
```

## image

Embed an image (SVG, PNG, or JPG). Images are converted to base64 data URIs.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"image"` | ✓ | Element type |
| `src` | `string` | ✓ | Path to image (relative to Markdown file) |
| `height` | `string` | | CSS height (`"12mm"`, `"20px"`) |
| `width` | `string` | | CSS width (usually omit for aspect ratio) |
| `alt` | `string` | | Alt text for accessibility |
| `style` | `string` | | Additional inline CSS |

### Supported Formats

- **SVG** (`.svg`) — Recommended for logos, scales perfectly
- **PNG** (`.png`) — Good for images with transparency
- **JPEG** (`.jpg`, `.jpeg`) — Good for photos

### Examples

```json
// Basic logo
{ "type": "image", "src": "./logo.svg", "height": "15mm" }

// With alt text
{
  "type": "image",
  "src": "./images/logo.png",
  "height": "12mm",
  "alt": "Company Logo"
}

// Fixed width
{ "type": "image", "src": "./icon.svg", "width": "20mm" }
```

## date

Display a formatted date or time using date-fns patterns.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"date"` | ✓ | Element type |
| `format` | `string` | | date-fns format (default: `"yyyy-MM-dd"`) |
| `font_size` | `string` | | CSS font-size |
| `font_weight` | `string \| number` | | CSS font-weight |
| `color` | `string` | | CSS color |
| `style` | `string` | | Additional inline CSS |

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

See [Date Formats](/reference/date-formats) for complete reference.

### Examples

```json
// ISO date (default)
{ "type": "date" }

// US format
{ "type": "date", "format": "MMMM d, yyyy" }

// European format
{ "type": "date", "format": "d MMMM yyyy" }

// With time
{ "type": "date", "format": "yyyy-MM-dd HH:mm" }

// Styled
{
  "type": "date",
  "format": "MMMM d, yyyy",
  "font_size": "8px",
  "color": "#666"
}
```

## title

Display the document title from front matter, H1, or filename.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"title"` | ✓ | Element type |
| `fallback` | `string` | | Text if no title found |
| `font_size` | `string` | | CSS font-size |
| `font_weight` | `string \| number` | | CSS font-weight |
| `font_style` | `string` | | CSS font-style |
| `color` | `string` | | CSS color |
| `style` | `string` | | Additional inline CSS |

### Title Resolution Order

1. `title` field in YAML front matter
2. First H1 heading in the document
3. Filename (without extension)
4. `fallback` value (if specified)

### Examples

```json
// Basic
{ "type": "title" }

// With fallback
{ "type": "title", "fallback": "Untitled Document" }

// Styled
{
  "type": "title",
  "font_weight": "bold",
  "font_style": "italic",
  "color": "#2c3e50"
}
```

## page_number

Display the current page number. Rendered by Chromium at print time.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"page_number"` | ✓ | Element type |
| `format` | `string` | | Format with `{page}` placeholder |
| `font_size` | `string` | | CSS font-size |
| `color` | `string` | | CSS color |
| `style` | `string` | | Additional inline CSS |

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

## total_pages

Display the total number of pages. Rendered by Chromium at print time.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"total_pages"` | ✓ | Element type |
| `format` | `string` | | Format with `{pages}` placeholder |
| `font_size` | `string` | | CSS font-size |
| `color` | `string` | | CSS color |
| `style` | `string` | | Additional inline CSS |

### Examples

```json
// Just the number
{ "type": "total_pages" }

// With text
{ "type": "total_pages", "format": "of {pages}" }
```

::: tip
For "Page X of Y" format, use a text element:
```json
{ "type": "text", "content": "Page {page} of {pages}" }
```
:::

## spacer

Add flexible or fixed space between elements in a zone.

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"spacer"` | ✓ | Element type |
| `width` | `string` | | Fixed width; omit for flexible (`flex: 1`) |

### Examples

```json
// Flexible spacer (fills available space)
{ "type": "spacer" }

// Fixed width
{ "type": "spacer", "width": "15mm" }
```

### Use Case

Push elements apart within a zone:

```json
{
  "left": [
    { "type": "image", "src": "./logo.svg", "height": "10mm" },
    { "type": "spacer" },
    { "type": "text", "content": "Division Name" }
  ]
}
```

## Common Styling Properties

Most elements support these properties:

| Property | Type | Description |
|----------|------|-------------|
| `font_size` | `string` | CSS font-size (`"9px"`, `"10pt"`) |
| `font_weight` | `string \| number` | CSS font-weight (`"bold"`, `600`) |
| `font_style` | `string` | CSS font-style (`"normal"`, `"italic"`) |
| `color` | `string` | CSS color (`"#333"`, `"gray"`) |
| `style` | `string` | Arbitrary inline CSS |

### style Property

The `style` property accepts arbitrary CSS:

```json
{
  "type": "text",
  "content": "Notice",
  "style": "text-transform: uppercase; letter-spacing: 1px; text-decoration: underline;"
}
```

## See Also

- [Header/Footer Schema](/reference/header-footer-schema) — Container and zone properties
- [Placeholders](/reference/placeholders) — Dynamic content
- [Date Formats](/reference/date-formats) — date-fns format patterns