# Zones & Layout

The structured header/footer system uses a **three-zone layout**: left, center, and right. Each zone can contain one or more elements.

## Zone Layout

```
┌─────────────────────────────────────────────────────────┐
│  LEFT          │       CENTER       │          RIGHT   │
│  (flex-shrink) │    (flex: 1)       │   (flex-shrink)  │
└─────────────────────────────────────────────────────────┘
```

- **Left zone** — Shrinks to fit content, aligned left
- **Center zone** — Expands to fill available space, content centered
- **Right zone** — Shrinks to fit content, aligned right

## Basic Example

```json
{
  "header": {
    "height": "15mm",
    "left": { "type": "text", "content": "Company Name" },
    "center": { "type": "title" },
    "right": { "type": "date", "format": "yyyy-MM-dd" }
  }
}
```

This creates a header with:
- Company name on the left
- Document title centered
- Date on the right

## Multiple Elements per Zone

Each zone can contain an array of elements:

```json
{
  "header": {
    "left": [
      { "type": "image", "src": "./logo.svg", "height": "10mm" },
      { "type": "text", "content": "Acme Corp", "font_weight": "bold" }
    ],
    "right": { "type": "date", "format": "MMMM d, yyyy" }
  }
}
```

Elements within a zone are displayed inline with a small gap between them.

## Empty Zones

Zones are optional. You can use any combination:

```json
{
  "footer": {
    "center": { "type": "text", "content": "Page {page} of {pages}" }
  }
}
```

This creates a footer with only centered content — left and right zones are empty.

## Zone Alignment

Each zone has default alignment:

| Zone | Alignment |
|------|-----------|
| `left` | `flex-start` (left) |
| `center` | `center` |
| `right` | `flex-end` (right) |

## Container Properties

Set properties on the container to apply to all zones:

```json
{
  "header": {
    "height": "18mm",
    "padding": "0 15mm",
    "font_size": "9px",
    "font_family": "Georgia, serif",
    "color": "#333",
    "border_bottom": "1px solid #ddd",
    "background": "#f9f9f9",
    "left": { "type": "text", "content": "Left" },
    "center": { "type": "text", "content": "Center" },
    "right": { "type": "text", "content": "Right" }
  }
}
```

### Container Property Reference

| Property | Description | Example |
|----------|-------------|---------|
| `height` | Total height of header/footer | `"15mm"`, `"0.5in"` |
| `padding` | CSS padding | `"0 10mm"`, `"5mm 15mm"` |
| `font_family` | Default font for all text | `"Arial, sans-serif"` |
| `font_size` | Default font size | `"9px"`, `"10pt"` |
| `color` | Default text color | `"#333"`, `"gray"` |
| `border_bottom` | Header bottom border | `"1px solid #ccc"` |
| `border_top` | Footer top border | `"1px solid #ccc"` |
| `background` | Background color | `"#f5f5f5"`, `"white"` |

## Element-Level Overrides

Individual elements can override container styles:

```json
{
  "header": {
    "font_size": "9px",
    "color": "#666",
    "left": {
      "type": "text",
      "content": "Important",
      "font_size": "11px",
      "font_weight": "bold",
      "color": "#000"
    },
    "right": { "type": "date" }
  }
}
```

The left text will be 11px, bold, and black, while the date uses the container defaults (9px, gray).

## Spacer Element

Use `spacer` to add flexible or fixed space between elements:

```json
{
  "header": {
    "left": [
      { "type": "image", "src": "./logo.svg", "height": "12mm" },
      { "type": "spacer" },
      { "type": "text", "content": "Division Name" }
    ]
  }
}
```

### Fixed-Width Spacer

```json
{ "type": "spacer", "width": "10mm" }
```

### Flexible Spacer (default)

```json
{ "type": "spacer" }
```

Flexible spacers expand to fill available space.

## Shorthand Properties

For simple configurations, use shorthand properties instead of full element definitions:

```json
{
  "header": {
    "left_image": "./logo.svg",
    "left_image_height": "12mm",
    "center_text": "{title}",
    "right_text": "{date:MMMM d, yyyy}"
  }
}
```

### Available Shorthands

| Property | Creates |
|----------|---------|
| `left_text` | Text element in left zone |
| `left_image` | Image element in left zone |
| `left_image_height` | Height for left image |
| `center_text` | Text element in center zone |
| `center_image` | Image element in center zone |
| `center_image_height` | Height for center image |
| `right_text` | Text element in right zone |
| `right_image` | Image element in right zone |
| `right_image_height` | Height for right image |

::: warning
Shorthands and full zone definitions can't be mixed for the same zone. If you define `left: { ... }`, don't also use `left_text`.
:::

## Common Patterns

### Logo + Title + Page Numbers

```json
{
  "header": {
    "height": "15mm",
    "left": { "type": "image", "src": "./logo.svg", "height": "12mm" },
    "center": { "type": "title" }
  },
  "footer": {
    "height": "10mm",
    "center": { "type": "text", "content": "Page {page} of {pages}" }
  }
}
```

### Two Logos (Left and Right)

```json
{
  "header": {
    "height": "18mm",
    "padding": "0 10mm",
    "left": { "type": "image", "src": "./logo-left.svg", "height": "14mm" },
    "right": { "type": "image", "src": "./logo-right.svg", "height": "14mm" }
  }
}
```

### Minimal Footer

```json
{
  "footer": {
    "height": "8mm",
    "font_size": "8px",
    "color": "#999",
    "right": { "type": "text", "content": "{page}" }
  }
}
```

## Next Steps

- [Elements](/guide/elements) — Learn about all element types
- [Placeholders](/guide/placeholders) — Dynamic content in text elements
- [Images & Assets](/guide/images) — Working with images in headers/footers