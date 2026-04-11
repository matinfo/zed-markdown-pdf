# Global Settings

Configure default options for all PDF exports in your Zed `settings.json`.

## Configuration Location

Add settings under `context_servers.markdown-pdf.settings`:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        // Your settings here
      }
    }
  }
}
```

## Complete Example

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
          "height": "15mm",
          "left_image": "./logo.svg",
          "left_image_height": "12mm",
          "center_text": "{title}",
          "right_text": "{date:MMMM d, yyyy}"
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

## Page Settings

### page_format

Paper size for the PDF.

| Value | Description |
|-------|-------------|
| `"A4"` | 210 × 297 mm (default) |
| `"Letter"` | 8.5 × 11 inches |
| `"Legal"` | 8.5 × 14 inches |
| `"Tabloid"` | 11 × 17 inches |
| `"A3"` | 297 × 420 mm |
| `"A5"` | 148 × 210 mm |

```json
{ "page_format": "Letter" }
```

### orientation

Page orientation.

| Value | Description |
|-------|-------------|
| `"portrait"` | Vertical (default) |
| `"landscape"` | Horizontal |

```json
{ "orientation": "landscape" }
```

### scale

Zoom factor for page rendering.

- **Type**: `number`
- **Range**: `0.1` to `2`
- **Default**: `1`

```json
{ "scale": 0.9 }
```

### margin

Page margins as CSS length values.

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

- **Type**: `string`
- **Default**: `""` (all pages)

```json
{ "page_ranges": "1-5, 8, 10-12" }
```

### print_background

Include background colors and images.

- **Type**: `boolean`
- **Default**: `true`

```json
{ "print_background": true }
```

## Content Settings

### font_family

CSS font-family for the document body and header/footer.

- **Type**: `string | null`
- **Default**: `null` (system fonts)

```json
{ "font_family": "Georgia, 'Times New Roman', serif" }
```

### include_default_styles

Include the built-in neutral stylesheet.

- **Type**: `boolean`
- **Default**: `true`

```json
{ "include_default_styles": false }
```

Set to `false` to use only your custom stylesheet.

### stylesheet_path

Path to a custom CSS file.

- **Type**: `string | null`
- **Default**: `null`

```json
{ "stylesheet_path": "./styles/custom.css" }
```

Relative paths are resolved from the Markdown file's directory.

### breaks

Convert single newlines to `<br>` elements.

- **Type**: `boolean`
- **Default**: `false`

```json
{ "breaks": true }
```

### emoji

Render emoji shortcodes (`:smile:` → 😄).

- **Type**: `boolean`
- **Default**: `true`

```json
{ "emoji": true }
```

## Syntax Highlighting

### highlight

Enable syntax highlighting for code blocks.

- **Type**: `boolean`
- **Default**: `true`

```json
{ "highlight": true }
```

### highlight_style

Highlight.js theme filename.

- **Type**: `string`
- **Default**: `"github.css"`

```json
{ "highlight_style": "atom-one-dark.css" }
```

Popular themes:

| Theme | Style |
|-------|-------|
| `github.css` | Light GitHub (default) |
| `github-dark.css` | Dark GitHub |
| `monokai.css` | Classic Monokai |
| `atom-one-dark.css` | Atom One Dark |
| `nord.css` | Nord |
| `vs.css` | VS Light |
| `vs2015.css` | VS Dark |

Browse all themes at [highlightjs.org/demo](https://highlightjs.org/demo).

## Header & Footer

### header

Structured header configuration.

- **Type**: `object | null`
- **Default**: `null`

```json
{
  "header": {
    "height": "15mm",
    "padding": "0 10mm",
    "font_size": "9px",
    "left": { "type": "image", "src": "./logo.svg", "height": "12mm" },
    "center": { "type": "title" },
    "right": { "type": "date", "format": "MMMM d, yyyy" }
  }
}
```

See [Header & Footer](/guide/header-footer) for complete documentation.

### footer

Structured footer configuration.

- **Type**: `object | null`
- **Default**: `null`

```json
{
  "footer": {
    "height": "10mm",
    "center": { "type": "text", "content": "Page {page} of {pages}" }
  }
}
```

### Shorthand Syntax

For simple headers/footers:

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

## Output Settings

### output_directory

Default directory for output PDFs.

- **Type**: `string | null`
- **Default**: `null` (same directory as source)

```json
{ "output_directory": "./build" }
```

### open_after_export

Open the PDF in the default viewer after export.

- **Type**: `boolean`
- **Default**: `false`

```json
{ "open_after_export": true }
```

## Priority Order

Settings are applied in this order (later overrides earlier):

1. **Extension defaults** — Built-in sensible defaults
2. **Global settings** — Your `settings.json` configuration
3. **Front matter** — Per-document `markdown-pdf:` block
4. **Tool arguments** — Options passed in the prompt

## Minimal Configuration

A minimal setup with header and footer:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
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

## Organization-Wide Settings

For consistent branding across all documents:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "font_family": "Helvetica, Arial, sans-serif",
        "header": {
          "height": "20mm",
          "padding": "0 15mm",
          "border_bottom": "2px solid #0066cc",
          "left_image": "./brand/logo.svg",
          "left_image_height": "15mm",
          "right_text": "{date:MMMM d, yyyy}"
        },
        "footer": {
          "height": "12mm",
          "padding": "0 15mm",
          "font_size": "8px",
          "color": "#666",
          "left_text": "© 2025 Company Name",
          "center_text": "Page {page} of {pages}",
          "right_text": "Confidential"
        }
      }
    }
  }
}
```

## Next Steps

- [Front Matter](/guide/front-matter) — Per-document overrides
- [Header & Footer](/guide/header-footer) — Complete header/footer guide
- [Custom Styling](/guide/custom-styling) — CSS customization