---
layout: home

hero:
  name: Markdown PDF
  text: for Zed Editor
  tagline: Export Markdown to polished PDFs with structured headers, footers, and custom styling
  image:
    src: /logo.png
    alt: Markdown PDF for Zed
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Quick Start Templates
      link: /examples/quick-templates
    - theme: alt
      text: View on GitHub
      link: https://github.com/matinfo/zed-markdown-pdf

features:
  - icon: 📄
    title: Structured Headers & Footers
    details: Declarative configuration with zones (left, center, right) and typed elements — no raw HTML required.
  - icon: 🎨
    title: Custom Variables
    details: Use front matter fields as placeholders in headers and footers. Add company name, version, author, and more.
  - icon: 📅
    title: Date Formatting
    details: Format dates with date-fns patterns. Support for ISO, US, EU, and custom formats.
  - icon: 🖼️
    title: Image Embedding
    details: Embed logos and images (SVG, PNG, JPG) directly in headers and footers as base64 data URIs.
  - icon: ⚡
    title: Zero Configuration
    details: Works out of the box with sensible defaults. Chromium installs automatically on first use.
  - icon: 🔧
    title: Per-Document Overrides
    details: Override any setting via YAML front matter. Perfect for different document types in the same project.
---

## Quick Example

Add a structured header and footer to your Markdown document:

```yaml
---
title: Project Report
author: Jane Smith
company: Acme Corp
markdown-pdf:
  header:
    height: 15mm
    left_text: "{company}"
    center_text: "{title}"
    right_text: "{date:MMMM d, yyyy}"
  footer:
    height: 10mm
    center_text: "Page {page} of {pages}"
---
```

Then ask Zed's AI assistant:

> Export this file to PDF

That's it! The PDF will have a professional header with your company name, document title, and formatted date.

## Next Steps

- [Getting Started](/guide/getting-started) — Install and configure the extension
- [Quick Start Templates](/examples/quick-templates) — Copy-paste ready configurations
- [Header & Footer Guide](/guide/header-footer) — Learn the structured configuration
- [Reference](/reference/settings) — Complete settings documentation