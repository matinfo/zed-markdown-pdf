# Custom Styling

Customize the appearance of your PDFs with CSS stylesheets. You can append styles to the built-in stylesheet or replace it entirely.

## Adding a Custom Stylesheet

Create a CSS file and reference it in your settings:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "stylesheet_path": "./styles/custom.css"
      }
    }
  }
}
```

Or in front matter:

```yaml
---
pdf:
  stylesheet_path: "./custom.css"
---
```

The path is resolved relative to the Markdown file.

## How Styles Are Applied

By default, styles are layered in this order:

1. **Built-in stylesheet** — Neutral, GitHub-like base styles
2. **Highlight.js theme** — Syntax highlighting for code blocks
3. **Custom stylesheet** — Your CSS file

Later styles override earlier ones.

## The Built-in Stylesheet

The extension includes a neutral, print-friendly stylesheet with:

- Clean typography and spacing
- Responsive tables
- Code block styling
- List formatting
- Blockquote styling
- Print-optimized defaults

### Keeping Built-in Styles

By default, `include_default_styles` is `true`, so your custom CSS is **appended**:

```json
{
  "include_default_styles": true,
  "stylesheet_path": "./custom.css"
}
```

### Replacing Built-in Styles

To use **only** your stylesheet:

```json
{
  "include_default_styles": false,
  "stylesheet_path": "./custom.css"
}
```

::: warning
If you disable default styles, you're responsible for all formatting — including typography, tables, code blocks, and print styles.
:::

## Page Breaks

The built-in stylesheet provides a `.page` utility class:

```html
<div class="page"></div>
```

Place it in your Markdown wherever you want a page break:

```markdown
# Chapter 1

Content for chapter 1...

<div class="page"></div>

# Chapter 2

Content for chapter 2...
```

### Custom Page Break Classes

Add your own in custom CSS:

```css
.page-break {
  page-break-after: always;
}

.no-break {
  page-break-inside: avoid;
}

.chapter {
  page-break-before: always;
}
```

## Font Family

Set a document-wide font:

```json
{
  "font_family": "Georgia, 'Times New Roman', serif"
}
```

This applies to:
- The document body
- Header and footer content

## Common Customizations

### Headings

```css
h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.3em;
}

h2 {
  color: #34495e;
}
```

### Links

```css
a {
  color: #3498db;
  text-decoration: none;
}

/* Hide URLs in print */
@media print {
  a[href]::after {
    content: none !important;
  }
}
```

### Tables

```css
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.5em;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
}

tr:nth-child(even) {
  background-color: #fafafa;
}
```

### Code Blocks

```css
pre {
  background-color: #f6f8fa;
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
}

code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.9em;
}

/* Inline code */
p code, li code {
  background-color: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
```

### Blockquotes

```css
blockquote {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid #3498db;
  background-color: #f8f9fa;
  color: #555;
}

blockquote p {
  margin: 0;
}
```

### Images

```css
img {
  max-width: 100%;
  height: auto;
}

/* Center images */
p > img {
  display: block;
  margin: 1em auto;
}

/* Image captions */
img + em {
  display: block;
  text-align: center;
  color: #666;
  font-size: 0.9em;
}
```

## Print-Specific Styles

Use `@media print` for print-only styles:

```css
@media print {
  /* Hide elements from print */
  .no-print {
    display: none !important;
  }
  
  /* Avoid breaking inside elements */
  h1, h2, h3 {
    page-break-after: avoid;
  }
  
  pre, blockquote, table {
    page-break-inside: avoid;
  }
  
  /* Ensure headings stay with content */
  h1, h2, h3, h4 {
    page-break-after: avoid;
  }
}
```

## Corporate Template

A complete corporate stylesheet example:

```css
/* corporate.css */

:root {
  --primary-color: #0066cc;
  --secondary-color: #333;
  --border-color: #e0e0e0;
  --bg-light: #f9f9f9;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: var(--secondary-color);
}

h1 {
  color: var(--primary-color);
  font-size: 24pt;
  border-bottom: 3px solid var(--primary-color);
  padding-bottom: 0.3em;
  margin-top: 2em;
}

h2 {
  color: var(--primary-color);
  font-size: 18pt;
  margin-top: 1.5em;
}

h3 {
  font-size: 14pt;
  margin-top: 1.2em;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

th {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75em;
  text-align: left;
}

td {
  border: 1px solid var(--border-color);
  padding: 0.5em 0.75em;
}

tr:nth-child(even) {
  background-color: var(--bg-light);
}

blockquote {
  border-left: 4px solid var(--primary-color);
  margin: 1em 0;
  padding: 0.5em 1em;
  background-color: var(--bg-light);
}

@media print {
  h1, h2, h3 {
    page-break-after: avoid;
  }
  
  table, pre, blockquote {
    page-break-inside: avoid;
  }
}
```

## Debugging Styles

### Check Applied Styles

Export to PDF and inspect the result. If something looks wrong:

1. Check your CSS file path is correct
2. Verify CSS syntax is valid
3. Check for specificity conflicts
4. Check the debug log for errors

### CSS Not Applied

- Verify `stylesheet_path` is relative to the Markdown file
- Check the file exists and is readable
- Ensure valid CSS syntax

### Styles Overridden

Built-in styles may have higher specificity. Use more specific selectors or `!important`:

```css
/* More specific selector */
main h1 {
  color: red;
}

/* Or use !important */
h1 {
  color: red !important;
}
```

## Front Matter Example

```yaml
---
title: Corporate Report
pdf:
  include_default_styles: true
  stylesheet_path: "./styles/corporate.css"
  font_family: "Helvetica Neue, Arial, sans-serif"
---

# Corporate Report

Content with custom styling...
```

## Next Steps

- [Global Settings](/guide/global-settings) — Configure default options
- [Front Matter](/guide/front-matter) — Per-document configuration
- [Examples](/examples/corporate) — See complete examples