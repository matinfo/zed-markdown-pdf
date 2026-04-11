---
title: Structured Header Test Document
author: Test Author
version: 1.0.0
company: Acme Corp
markdown-pdf:
  display_header_footer: true
  header:
    height: 18mm
    padding: 0 15mm
    font_size: 9px
    border_bottom: 1px solid #ddd
    left:
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
    border_top: 1px solid #eee
    left:
      type: text
      content: "v{version}"
      color: "#666"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "{author}"
      color: "#666"
---

# Structured Header/Footer Test

This document tests the new structured header/footer system.

## Features Being Tested

1. **Front Matter Configuration** - PDF settings in YAML front matter
2. **Custom Variables** - Using `{company}`, `{version}`, `{author}` placeholders
3. **Date Formatting** - Using date-fns format string `MMMM d, yyyy`
4. **Multiple Zones** - Left, center, and right content areas
5. **Styling** - Font sizes, colors, borders, padding

## Expected Results

When exported to PDF, this document should have:

- A header with:
  - "Acme Corp" (bold) on the left
  - Document title (italic) in the center
  - Current date (formatted as "June 30, 2025") on the right
  - A subtle border below the header

- A footer with:
  - Version number on the left
  - Page numbers in the center
  - Author name on the right
  - A subtle border above the footer

## Sample Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
nostrud exercitation ullamco laboris.

### Code Example

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
```

### Table

| Feature | Status |
|---------|--------|
| Header  | ✓ Working |
| Footer  | ✓ Working |
| Date    | ✓ Working |

## Conclusion

If the headers and footers render correctly with all the custom variables
and styling, the structured header/footer integration is working as expected.