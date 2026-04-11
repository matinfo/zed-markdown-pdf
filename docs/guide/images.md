# Images & Assets

Embed images (logos, icons, graphics) directly in your PDF headers and footers. Images are automatically converted to base64 data URIs for reliable embedding.

## Supported Formats

| Format | Extension | Best For |
|--------|-----------|----------|
| **SVG** | `.svg` | Logos, icons (recommended) |
| **PNG** | `.png` | Images with transparency |
| **JPEG** | `.jpg`, `.jpeg` | Photos, complex images |

::: tip
**Use SVG whenever possible.** SVG files are typically smaller, scale perfectly at any size, and produce the sharpest results in PDFs.
:::

## Basic Usage

### Image Element

```json
{
  "header": {
    "left": {
      "type": "image",
      "src": "./logo.svg",
      "height": "12mm"
    }
  }
}
```

### Shorthand Syntax

```json
{
  "header": {
    "left_image": "./logo.svg",
    "left_image_height": "12mm"
  }
}
```

## Path Resolution

Image paths can be resolved in several ways:

### Relative Paths (Default)

Paths are resolved relative to the Markdown file:

```
project/
├── docs/
│   ├── report.md      ← Markdown file
│   └── images/
│       └── logo.svg   ← Image file
```

In `report.md`:

```yaml
markdown-pdf:
  header:
    left_image: "./images/logo.svg"
```

### Home Directory (~)

Use `~` to reference your home directory. Works on **macOS, Linux, and Windows**:

```json
{
  "header": {
    "left_image": "~/Documents/brand-assets/logo.svg"
  }
}
```

On each platform, `~` expands to:
- **macOS/Linux**: `$HOME` (e.g., `/Users/john` or `/home/john`)
- **Windows**: `%USERPROFILE%` (e.g., `C:\Users\john`)

### Global Assets Directory (@/)

For organization-wide branding, configure a global assets directory and reference files with the `@/` prefix:

**Step 1: Configure the assets directory in Zed settings:**

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "assets_directory": "~/.config/zed-markdown-pdf/assets"
      }
    }
  }
}
```

**Step 2: Place your shared assets there:**

```
~/.config/zed-markdown-pdf/assets/
├── company-logo.svg
├── partner-logo.png
└── watermark.svg
```

**Step 3: Reference with @/ prefix:**

```yaml
markdown-pdf:
  header:
    left_image: "@/company-logo.svg"
    right_image: "@/partner-logo.png"
```

::: tip
The `@/` prefix is ideal for logos and branding assets used across multiple projects. Configure once, use everywhere!
:::

### Absolute Paths

You can also use absolute paths (less portable):

```json
{
  "header": {
    "left_image": "/Users/me/logos/company-logo.svg"
  }
}
```

## Image Properties

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string` | Path to image file (required) |
| `height` | `string` | CSS height (`"12mm"`, `"20px"`) |
| `width` | `string` | CSS width (usually omit for aspect ratio) |
| `alt` | `string` | Alt text for accessibility |
| `style` | `string` | Additional inline CSS |

### Setting Dimensions

**Height only (recommended):**

```json
{
  "type": "image",
  "src": "./logo.svg",
  "height": "15mm"
}
```

Width auto-scales to preserve aspect ratio.

**Width only:**

```json
{
  "type": "image",
  "src": "./logo.svg",
  "width": "30mm"
}
```

Height auto-scales to preserve aspect ratio.

**Both (may distort):**

```json
{
  "type": "image",
  "src": "./logo.svg",
  "height": "15mm",
  "width": "30mm"
}
```

::: warning
Setting both width and height may distort the image if the aspect ratio doesn't match.
:::

## Common Patterns

### Single Logo Header

```json
{
  "header": {
    "height": "18mm",
    "padding": "0 15mm",
    "left": {
      "type": "image",
      "src": "./logo.svg",
      "height": "14mm"
    },
    "right": {
      "type": "date",
      "format": "MMMM d, yyyy"
    }
  }
}
```

### Two-Logo Header

```json
{
  "header": {
    "height": "20mm",
    "padding": "0 10mm",
    "left": {
      "type": "image",
      "src": "./company-logo.svg",
      "height": "16mm"
    },
    "right": {
      "type": "image",
      "src": "./partner-logo.svg",
      "height": "16mm"
    }
  }
}
```

### Logo with Company Name

```json
{
  "header": {
    "left": [
      {
        "type": "image",
        "src": "./logo-icon.svg",
        "height": "10mm"
      },
      {
        "type": "text",
        "content": "Acme Corporation",
        "font_weight": "bold"
      }
    ]
  }
}
```

### Center Logo

```json
{
  "header": {
    "height": "20mm",
    "center": {
      "type": "image",
      "src": "./logo-wide.svg",
      "height": "16mm"
    }
  }
}
```

## Image Embedding Process

When you export a PDF:

1. The extension finds all image paths in your header/footer configuration
2. Each image file is read from disk
3. The image content is encoded as base64
4. A data URI is generated: `data:image/svg+xml;base64,...`
5. The data URI is embedded directly in the HTML template

This ensures images work reliably without external dependencies.

## File Size Considerations

Large images increase PDF generation time and file size. The extension warns when an image exceeds 500KB.

### Optimization Tips

1. **Use SVG for logos and icons** — Much smaller than raster formats
2. **Optimize PNG files** — Use tools like ImageOptim or TinyPNG
3. **Reduce JPEG quality** — 80% quality is usually sufficient
4. **Avoid unnecessary detail** — Headers/footers are small; fine details won't be visible

### Size Warning

If you see a warning like:

```
Large image (650KB): ./logo.png. Consider optimizing for better performance.
```

Consider:
- Converting to SVG if possible
- Reducing image dimensions
- Compressing the file
- Using a simpler version for headers/footers

## SVG Considerations

### Embedded Fonts

SVGs with custom fonts should have fonts converted to paths, or the fonts may not render correctly.

### Viewport and ViewBox

Ensure your SVG has proper `viewBox` attribute for correct scaling:

```xml
<svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
  <!-- content -->
</svg>
```

### Colors

SVG colors work as expected. You can use:
- Named colors: `fill="red"`
- Hex colors: `fill="#FF0000"`
- RGB: `fill="rgb(255,0,0)"`

## Troubleshooting

### Image Not Found

```
Error: Image file not found: ./logo.svg
```

- Check the path is correct and relative to your Markdown file
- Ensure the file exists and is readable
- Verify the file extension matches the actual format

### Unsupported Format

```
Error: Unsupported image format: .webp
```

Only SVG, PNG, and JPEG are supported. Convert to a supported format.

### Image Appears Distorted

- Remove `width` or `height` and let aspect ratio be preserved
- Check the SVG has a proper `viewBox` attribute

### Image Too Large/Small

Adjust the `height` property:

```json
{
  "type": "image",
  "src": "./logo.svg",
  "height": "15mm"  // Adjust this value
}
```

## Front Matter Example

```yaml
---
title: Annual Report 2025
markdown-pdf:
  header:
    height: 20mm
    padding: 0 15mm
    border_bottom: 1px solid #e0e0e0
    left:
      type: image
      src: ./assets/logo.svg
      height: 16mm
      alt: Company Logo
    center:
      type: title
      font_weight: bold
    right:
      type: date
      format: MMMM d, yyyy
  footer:
    height: 12mm
    padding: 0 15mm
    center:
      type: text
      content: "Page {page} of {pages}"
---

# Annual Report 2025

Content goes here...
```

## Global Assets Setup

For teams and organizations, set up a shared assets directory:

### Recommended Structure

```
~/.config/zed-markdown-pdf/
└── assets/
    ├── logos/
    │   ├── company-logo.svg
    │   └── company-logo-dark.svg
    ├── icons/
    │   └── document-icon.svg
    └── branding/
        └── watermark.svg
```

### Team Configuration

Share this snippet with your team for consistent branding:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "assets_directory": "~/.config/zed-markdown-pdf/assets",
        "header": {
          "height": "18mm",
          "padding": "0 15mm",
          "left_image": "@/logos/company-logo.svg",
          "left_image_height": "14mm",
          "right_text": "{date:MMMM d, yyyy}"
        },
        "footer": {
          "center_text": "Page {page} of {pages}"
        }
      }
    }
  }
}
```

Each team member places their copy of the logos in `~/.config/zed-markdown-pdf/assets/logos/`.

## Next Steps

- [Zones & Layout](/guide/zones) — Position images in zones
- [Elements](/guide/elements) — All element types
- [Global Settings](/guide/global-settings) — Configure defaults
- [Examples](/examples/two-logo) — Two-logo header example