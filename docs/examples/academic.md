# Academic Paper

A header/footer configuration suitable for academic papers, theses, and dissertations.

## Preview

```
┌────────────────────────────────────────────────────────────┐
│                        Paper Title                         │
│                Department of Computer Science              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                       Paper Content                        │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  University Name          - 3 -                  June 2025 │
└────────────────────────────────────────────────────────────┘
```

## Global Settings

Configure in your Zed `settings.json`:

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "page_format": "Letter",
        "margin": {
          "top": "25mm",
          "right": "25mm",
          "bottom": "25mm",
          "left": "25mm"
        },
        "font_family": "Georgia, 'Times New Roman', serif",
        "header": {
          "height": "20mm",
          "padding": "0 25mm",
          "font_size": "10px",
          "border_bottom": "1px solid #333",
          "center": [
            {
              "type": "title",
              "font_weight": "bold",
              "font_size": "12px"
            },
            {
              "type": "text",
              "content": "{department}",
              "font_size": "9px",
              "font_style": "italic",
              "color": "#555"
            }
          ]
        },
        "footer": {
          "height": "15mm",
          "padding": "0 25mm",
          "font_size": "9px",
          "color": "#333",
          "border_top": "1px solid #ccc",
          "left": {
            "type": "text",
            "content": "{university}"
          },
          "center": {
            "type": "text",
            "content": "- {page} -"
          },
          "right": {
            "type": "date",
            "format": "MMMM yyyy"
          }
        }
      }
    }
  }
}
```

## Front Matter Example

```yaml
---
title: "Machine Learning Approaches to Natural Language Processing"
author: Dr. Jane Smith
university: Stanford University
department: Department of Computer Science
course: CS229 - Machine Learning
semester: Spring 2025
advisor: Prof. John Doe
markdown-pdf:
  page_format: Letter
  margin:
    top: 30mm
    bottom: 30mm
  header:
    height: 22mm
    padding: 0 25mm
    border_bottom: 1px solid #333
    center:
      - type: title
        font_weight: bold
        font_size: 14px
      - type: text
        content: "{department}"
        font_size: 10px
        font_style: italic
  footer:
    height: 15mm
    padding: 0 25mm
    font_size: 9px
    border_top: 1px solid #ccc
    left:
      type: text
      content: "{university}"
    center:
      type: text
      content: "- {page} -"
    right:
      type: text
      content: "{semester}"
---

# Abstract

This paper presents a comprehensive analysis of machine learning
approaches to natural language processing...
```

## Thesis Style

A more formal thesis configuration:

```yaml
---
title: "A Novel Approach to Distributed Systems"
author: Jane Smith, Ph.D. Candidate
university: Massachusetts Institute of Technology
department: Department of Electrical Engineering and Computer Science
year: 2025
markdown-pdf:
  page_format: Letter
  orientation: portrait
  margin:
    top: 30mm
    right: 30mm
    bottom: 30mm
    left: 40mm
  header:
    height: 15mm
    padding: 0 20mm
    font_size: 9px
    color: "#444"
    right:
      type: text
      content: "{author}"
      font_style: italic
  footer:
    height: 15mm
    padding: 0 20mm
    font_size: 9px
    center:
      type: text
      content: "{page}"
---
```

## Conference Paper Style

For conference submissions with specific formatting:

```yaml
---
title: "Efficient Algorithms for Graph Processing"
authors: "J. Smith, A. Johnson, M. Williams"
conference: "International Conference on Machine Learning (ICML 2025)"
paper_id: "ICML-2025-1234"
markdown-pdf:
  page_format: Letter
  margin:
    top: 25mm
    right: 20mm
    bottom: 25mm
    left: 20mm
  header:
    height: 12mm
    padding: 0 15mm
    font_size: 8px
    color: "#666"
    left:
      type: text
      content: "{conference}"
    right:
      type: text
      content: "Paper #{paper_id}"
  footer:
    height: 10mm
    padding: 0 15mm
    font_size: 8px
    center:
      type: text
      content: "Page {page} of {pages}"
---
```

## Journal Article Style

Clean, minimal style for journal submissions:

```yaml
---
title: "Quantum Computing: A Survey"
author: Smith et al.
journal: "Journal of Computing"
volume: 42
issue: 3
year: 2025
markdown-pdf:
  page_format: A4
  margin:
    top: 25mm
    right: 20mm
    bottom: 25mm
    left: 20mm
  header:
    height: 10mm
    padding: 0 15mm
    font_size: 8px
    color: "#888"
    border_bottom: 0.5px solid #ddd
    left:
      type: text
      content: "{journal}, Vol. {volume}, No. {issue}"
    right:
      type: text
      content: "{author}"
      font_style: italic
  footer:
    height: 8mm
    padding: 0 15mm
    font_size: 8px
    color: "#888"
    center:
      type: text
      content: "{page}"
---
```

## Running Header with Chapter

For longer documents with chapters:

```yaml
---
title: "Introduction to Computer Science"
chapter: "Chapter 3: Data Structures"
author: Prof. Jane Smith
markdown-pdf:
  header:
    height: 12mm
    padding: 0 20mm
    font_size: 9px
    border_bottom: 0.5px solid #999
    left:
      type: text
      content: "{chapter}"
      font_style: italic
    right:
      type: text
      content: "{title}"
  footer:
    height: 10mm
    padding: 0 20mm
    font_size: 9px
    center:
      type: text
      content: "{page}"
---
```

## Custom Styling

Add a custom stylesheet for academic formatting:

```css
/* academic.css */
body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.8;
  text-align: justify;
}

h1 {
  font-size: 16pt;
  text-align: center;
  margin-top: 2em;
}

h2 {
  font-size: 14pt;
  margin-top: 1.5em;
}

p {
  text-indent: 2em;
  margin: 0;
}

p:first-of-type,
h1 + p,
h2 + p,
h3 + p {
  text-indent: 0;
}

blockquote {
  margin: 1em 3em;
  font-size: 11pt;
}

/* Figure captions */
figure {
  text-align: center;
  margin: 2em 0;
}

figcaption {
  font-size: 10pt;
  font-style: italic;
  margin-top: 0.5em;
}

/* Bibliography */
.references {
  font-size: 10pt;
}

.references li {
  margin-bottom: 0.5em;
  text-indent: -2em;
  padding-left: 2em;
}
```

Reference it in your front matter:

```yaml
---
title: My Academic Paper
markdown-pdf:
  stylesheet_path: "./academic.css"
  include_default_styles: true
---
```

## Tips for Academic Documents

1. **Use larger margins** — Academic documents typically have 25-30mm margins
2. **Choose serif fonts** — Georgia or Times New Roman are standard
3. **Keep headers minimal** — Focus on title or running head
4. **Center page numbers** — Common in thesis/dissertation format
5. **Use consistent formatting** — Apply the same style across all documents

## See Also

- [Custom Styling](/guide/custom-styling) — CSS customization
- [Front Matter](/guide/front-matter) — Per-document configuration
- [Corporate Example](/examples/corporate) — Business document style
