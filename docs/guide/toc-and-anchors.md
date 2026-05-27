# Table of Contents & Heading Anchors

For long-form documents — reports, manuals, theses — Markdown PDF can generate
a navigable table of contents and add `id` slugs to every heading so internal
links work in the resulting PDF.

## Enable

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "toc": true
      }
    }
  }
}
```

> Turning on `toc` automatically enables heading anchors. If you only want
> anchors (e.g. for use with a custom theme), set `heading_anchors: true`
> on its own.

## Usage

Place the literal marker `[[toc]]` anywhere in your markdown:

```markdown
# My Report

[[toc]]

## Introduction
...

## Methods
...

### Data collection
...

## Conclusion
...
```

A nested list of links will be inserted in place of the marker. The default
stylesheet places it on its own page (`page-break-after: always`).

If `toc` is enabled but no `[[toc]]` marker is present, nothing is injected —
the feature is harmless to leave on by default.

## Configuration

### Heading levels

By default, headings `H1`–`H3` appear in the TOC. Customize:

```json
{
  "toc_options": {
    "level": [2, 3]
  }
}
```

### Ordered list

```json
{
  "toc_options": {
    "list_type": "ol"
  }
}
```

## Heading anchors only

If you only want `id` attributes on headings (for example, to use in a
custom-styled sidebar via your own stylesheet) without rendering a TOC:

```json
{ "heading_anchors": true }
```

Slugs follow GitHub-style rules: lowercase, spaces become hyphens,
punctuation stripped.

## Per-document override

```markdown
---
title: Annual Report 2026
pdf:
  toc: true
  toc_options:
    level: [1, 2]
---

[[toc]]

# Section 1
...
```
