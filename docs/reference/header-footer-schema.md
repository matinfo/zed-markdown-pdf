# Header/Footer Schema

Complete reference for the structured header and footer configuration.

## Container Properties

Both `header` and `footer` support these container properties:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `height` | `string` | Container height | `"15mm"`, `"0.5in"` |
| `padding` | `string` | CSS padding | `"0 10mm"`, `"5mm 15mm"` |
| `font_family` | `string` | Default font for all text | `"Georgia, serif"` |
| `font_size` | `string` | Default font size | `"9px"`, `"10pt"` |
| `color` | `string` | Default text color | `"#333"`, `"gray"` |
| `border_bottom` | `string` | Header bottom border | `"1px solid #ddd"` |
| `border_top` | `string` | Footer top border | `"1px solid #ddd"` |
| `background` | `string` | Background color | `"#f9f9f9"`, `"white"` |
| `style` | `string` | Additional inline CSS | `"opacity: 0.9"` |

## Zone Properties

Zones define content areas within the header/footer:

| Property | Type | Description |
|----------|------|-------------|
| `left` | `Element \| Element[]` | Left-aligned content |
| `center` | `Element \| Element[]` | Centered content |
| `right` | `Element \| Element[]` | Right-aligned content |

Each zone can contain:
- A single element object
- An array of element objects
- `null` (empty zone)

## Shorthand Properties

For simple configurations without full element definitions:

| Property | Type | Description |
|----------|------|-------------|
| `left_text` | `string` | Text content for left zone |
| `left_image` | `string` | Image path for left zone |
| `left_image_height` | `string` | Height for left image |
| `center_text` | `string` | Text content for center zone |
| `center_image` | `string` | Image path for center zone |
| `center_image_height` | `string` | Height for center image |
| `right_text` | `string` | Text content for right zone |
| `right_image` | `string` | Image path for right zone |
| `right_image_height` | `string` | Height for right image |

::: warning
Don't mix shorthands with full zone definitions for the same zone. Use one or the other.
:::

## Element Types

### text

Display static or dynamic text with placeholder support.

```json
{
  "type": "text",
  "content": "Page {page} of {pages}",
  "font_size": "9px",
  "font_weight": "bold",
  "font_style": "italic",
  "color": "#333",
  "style": "text-transform: uppercase"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"text"` | Yes | Element type |
| `content` | `string` | Yes | Text with [placeholders](/reference/placeholders) |
| `font_size` | `string` | No | CSS font-size |
| `font_weight` | `string \| number` | No | CSS font-weight |
| `font_style` | `string` | No | `"normal"`, `"italic"`, `"oblique"` |
| `color` | `string` | No | CSS color |
| `style` | `string` | No | Additional inline CSS |

### image

Embed an image (SVG, PNG, JPG).

```json
{
  "type": "image",
  "src": "./logo.svg",
  "height": "12mm",
  "width": "auto",
  "alt": "Company Logo",
  "style": "opacity: 0.9"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"image"` | Yes | Element type |
| `src` | `string` | Yes | Path to image (relative to Markdown file) |
| `height` | `string` | No | CSS height |
| `width` | `string` | No | CSS width |
| `alt` | `string` | No | Alt text for accessibility |
| `style` | `string` | No | Additional inline CSS |

**Supported formats:** `.svg`, `.png`, `.jpg`, `.jpeg`

### date

Display a formatted date/time.

```json
{
  "type": "date",
  "format": "MMMM d, yyyy",
  "font_size": "9px",
  "color": "#666"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"date"` | Yes | Element type |
| `format` | `string` | No | date-fns format (default: `"yyyy-MM-dd"`) |
| `font_size` | `string` | No | CSS font-size |
| `color` | `string` | No | CSS color |
| `style` | `string` | No | Additional inline CSS |

See [Date Formats](/reference/date-formats) for format patterns.

### title

Display the document title.

```json
{
  "type": "title",
  "fallback": "Untitled Document",
  "font_size": "10px",
  "font_weight": "bold",
  "font_style": "italic",
  "color": "#333"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"title"` | Yes | Element type |
| `fallback` | `string` | No | Text if no title found |
| `font_size` | `string` | No | CSS font-size |
| `font_weight` | `string \| number` | No | CSS font-weight |
| `font_style` | `string` | No | CSS font-style |
| `color` | `string` | No | CSS color |
| `style` | `string` | No | Additional inline CSS |

**Title resolution order:**
1. Front matter `title:` field
2. First H1 heading
3. Filename (without extension)
4. `fallback` value

### page_number

Display the current page number.

```json
{
  "type": "page_number",
  "format": "Page {page}",
  "font_size": "9px",
  "color": "#666"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"page_number"` | Yes | Element type |
| `format` | `string` | No | Format with `{page}` placeholder |
| `font_size` | `string` | No | CSS font-size |
| `color` | `string` | No | CSS color |
| `style` | `string` | No | Additional inline CSS |

### total_pages

Display the total page count.

```json
{
  "type": "total_pages",
  "format": "of {pages}",
  "font_size": "9px",
  "color": "#666"
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"total_pages"` | Yes | Element type |
| `format` | `string` | No | Format with `{pages}` placeholder |
| `font_size` | `string` | No | CSS font-size |
| `color` | `string` | No | CSS color |
| `style` | `string` | No | Additional inline CSS |

### spacer

Add flexible or fixed space between elements.

```json
{ "type": "spacer" }
```

```json
{ "type": "spacer", "width": "10mm" }
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `"spacer"` | Yes | Element type |
| `width` | `string` | No | Fixed width; omit for flexible space |

## Complete Example

```json
{
  "header": {
    "height": "18mm",
    "padding": "0 15mm",
    "font_family": "Helvetica, Arial, sans-serif",
    "font_size": "9px",
    "color": "#333",
    "border_bottom": "1px solid #ddd",
    "left": [
      {
        "type": "image",
        "src": "./logo.svg",
        "height": "14mm",
        "alt": "Company Logo"
      },
      {
        "type": "spacer",
        "width": "5mm"
      },
      {
        "type": "text",
        "content": "{company}",
        "font_weight": "bold"
      }
    ],
    "center": {
      "type": "title",
      "font_style": "italic"
    },
    "right": {
      "type": "date",
      "format": "MMMM d, yyyy"
    }
  },
  "footer": {
    "height": "12mm",
    "padding": "0 15mm",
    "font_size": "8px",
    "color": "#666",
    "border_top": "1px solid #eee",
    "left": {
      "type": "text",
      "content": "v{version}"
    },
    "center": {
      "type": "text",
      "content": "Page {page} of {pages}"
    },
    "right": {
      "type": "text",
      "content": "{author}"
    }
  }
}
```

## Front Matter Example

```yaml
---
title: Quarterly Report
author: Jane Smith
company: Acme Corp
version: 1.0.0
markdown-pdf:
  header:
    height: 18mm
    padding: 0 15mm
    border_bottom: 1px solid #ddd
    left:
      - type: image
        src: ./logo.svg
        height: 14mm
      - type: text
        content: "{company}"
        font_weight: bold
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
    center:
      type: text
      content: "Page {page} of {pages}"
---
```

## CSS Units

Supported CSS length units for dimensions:

| Unit | Description | Example |
|------|-------------|---------|
| `mm` | Millimeters | `"15mm"` |
| `cm` | Centimeters | `"1.5cm"` |
| `in` | Inches | `"0.5in"` |
| `px` | Pixels | `"20px"` |
| `pt` | Points | `"12pt"` |
| `em` | Relative to font-size | `"1.5em"` |

## Related

- [Element Types](/reference/element-types) — Detailed element documentation
- [Placeholders](/reference/placeholders) — All available placeholders
- [Date Formats](/reference/date-formats) — date-fns format patterns