# Settings Reference

Complete reference for all Markdown PDF settings.

## Configuration

Settings are placed in your Zed `settings.json`:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        // Settings here
      }
    }
  }
}
```

## Page Layout

### page_format

Paper size for the PDF.

| Type | Default | Options |
|------|---------|---------|
| `string` | `"A4"` | `A4`, `Letter`, `Legal`, `Tabloid`, `Ledger`, `A0`, `A1`, `A2`, `A3`, `A5`, `A6` |

```json
{ "page_format": "Letter" }
```

### orientation

Page orientation.

| Type | Default | Options |
|------|---------|---------|
| `string` | `"portrait"` | `portrait`, `landscape` |

```json
{ "orientation": "landscape" }
```

### scale

Zoom factor for page rendering.

| Type | Default | Range |
|------|---------|-------|
| `number` | `1` | `0.1` – `2` |

```json
{ "scale": 0.9 }
```

### margin

Page margins as CSS length values.

| Type | Default |
|------|---------|
| `object` | `{ top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" }` |

```json
{
  "margin": {
    "top": "20mm",
    "right": "15mm",
    "bottom": "20mm",
    "left": "15mm"
  }
}
```

Supported units: `mm`, `cm`, `in`, `px`, `pt`

### page_ranges

Print only specific pages.

| Type | Default |
|------|---------|
| `string` | `""` (all pages) |

```json
{ "page_ranges": "1-5, 8, 10-12" }
```

### print_background

Include background colors and images.

| Type | Default |
|------|---------|
| `boolean` | `true` |

```json
{ "print_background": true }
```

## Content & Rendering

### font_family

CSS font-family for document body and header/footer.

| Type | Default |
|------|---------|
| `string \| null` | `null` (system fonts) |

```json
{ "font_family": "Georgia, 'Times New Roman', serif" }
```

### include_default_styles

Include the built-in neutral stylesheet.

| Type | Default |
|------|---------|
| `boolean` | `true` |

```json
{ "include_default_styles": false }
```

### stylesheet_path

Path to a custom CSS file (relative to Markdown file).

| Type | Default |
|------|---------|
| `string \| null` | `null` |

```json
{ "stylesheet_path": "./styles/custom.css" }
```

### breaks

Convert single newlines to `<br>` elements.

| Type | Default |
|------|---------|
| `boolean` | `false` |

```json
{ "breaks": true }
```

### emoji

Render emoji shortcodes (`:smile:` → 😄).

| Type | Default |
|------|---------|
| `boolean` | `true` |

```json
{ "emoji": true }
```

## Syntax Highlighting

### highlight

Enable syntax highlighting for code blocks.

| Type | Default |
|------|---------|
| `boolean` | `true` |

```json
{ "highlight": true }
```

### highlight_style

Highlight.js theme filename.

| Type | Default |
|------|---------|
| `string` | `"github.css"` |

```json
{ "highlight_style": "atom-one-dark.css" }
```

**Popular themes:**

| Theme | Description |
|-------|-------------|
| `github.css` | Light GitHub (default) |
| `github-dark.css` | Dark GitHub |
| `monokai.css` | Classic Monokai |
| `atom-one-dark.css` | Atom One Dark |
| `atom-one-light.css` | Atom One Light |
| `nord.css` | Nord |
| `vs.css` | Visual Studio Light |
| `vs2015.css` | Visual Studio Dark |
| `tokyo-night-dark.css` | Tokyo Night |
| `rose-pine.css` | Rosé Pine |

See [highlightjs.org/demo](https://highlightjs.org/demo) for all 80+ themes.

## Header & Footer

### header

Structured header configuration.

| Type | Default |
|------|---------|
| `object \| null` | `null` |

```json
{
  "header": {
    "height": "15mm",
    "padding": "0 10mm",
    "font_size": "9px",
    "border_bottom": "1px solid #ddd",
    "left": { "type": "image", "src": "./logo.svg", "height": "12mm" },
    "center": { "type": "title" },
    "right": { "type": "date", "format": "MMMM d, yyyy" }
  }
}
```

See [Header/Footer Schema](/reference/header-footer-schema) for complete documentation.

### footer

Structured footer configuration.

| Type | Default |
|------|---------|
| `object \| null` | `null` |

```json
{
  "footer": {
    "height": "10mm",
    "center": { "type": "text", "content": "Page {page} of {pages}" }
  }
}
```

### Shorthand Properties

For simple configurations:

```json
{
  "header": {
    "height": "15mm",
    "left_image": "./logo.svg",
    "left_image_height": "12mm",
    "center_text": "{title}",
    "right_text": "{date:yyyy-MM-dd}"
  }
}
```

| Property | Description |
|----------|-------------|
| `left_text` | Text in left zone |
| `left_image` | Image path in left zone |
| `left_image_height` | Height for left image |
| `center_text` | Text in center zone |
| `center_image` | Image path in center zone |
| `center_image_height` | Height for center image |
| `right_text` | Text in right zone |
| `right_image` | Image path in right zone |
| `right_image_height` | Height for right image |

## Output

### output_directory

Default directory for output PDFs.

| Type | Default |
|------|---------|
| `string \| null` | `null` (same as source) |

```json
{ "output_directory": "./build" }
```

### open_after_export

Open PDF in default viewer after export.

| Type | Default |
|------|---------|
| `boolean` | `false` |

```json
{ "open_after_export": true }
```

## Priority Order

Settings are applied in this order (later overrides earlier):

1. **Extension defaults**
2. **Global settings** (`settings.json`)
3. **Front matter** (`pdf:` block)
4. **Tool arguments** (from prompt)

## Minimal Example

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "page_format": "A4",
        "header": {
          "center_text": "{title}",
          "right_text": "{date:yyyy-MM-dd}"
        },
        "footer": {
          "center_text": "Page {page} of {pages}"
        }
      }
    }
  }
}
```

## Full Example

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "page_format": "A4",
        "orientation": "portrait",
        "scale": 1,
        "print_background": true,
        "margin": {
          "top": "20mm",
          "right": "15mm",
          "bottom": "20mm",
          "left": "15mm"
        },
        "font_family": "Georgia, serif",
        "include_default_styles": true,
        "highlight": true,
        "highlight_style": "github.css",
        "emoji": true,
        "open_after_export": false,
        "header": {
          "height": "18mm",
          "padding": "0 15mm",
          "font_size": "9px",
          "border_bottom": "1px solid #ddd",
          "left": {
            "type": "image",
            "src": "./logo.svg",
            "height": "14mm"
          },
          "center": {
            "type": "title",
            "font_weight": "bold"
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
          "center": {
            "type": "text",
            "content": "Page {page} of {pages}"
          }
        }
      }
    }
  }
}
```
