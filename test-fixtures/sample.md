---
title: Markdown PDF — Feature Test Document
---

# Markdown PDF — Feature Test Document

A comprehensive fixture that exercises every rendering feature of the extension:
syntax highlighting across multiple languages, emoji shortcodes, hard line breaks,
custom page breaks, all heading levels, tables, blockquotes, and inline HTML.

---

## Text Formatting

You can use *italic*, **bold**, and ***bold italic*** text.
Inline `code` is highlighted with a subtle background.

Here is ~~strikethrough~~ text, a [link to Zed](https://zed.dev), and a
**[bold link](https://playwright.dev)**.

### All heading levels

#### H4 — sub-section heading
##### H5 — minor heading
###### H6 — smallest heading (muted in the neutral theme)

---

## Emoji

When `emoji` is enabled, shortcodes are replaced with Unicode characters at
render time — no images, no external requests.

| Shortcode | Output |
|-----------|--------|
| `:wave:` | :wave: |
| `:rocket:` | :rocket: |
| `:tada:` | :tada: |
| `:fire:` | :fire: |
| `:zap:` | :zap: |
| `:white_check_mark:` | :white_check_mark: |
| `:warning:` | :warning: |
| `:bulb:` | :bulb: |
| `:books:` | :books: |
| `:hammer_and_wrench:` | :hammer_and_wrench: |

Inline example: build passed :white_check_mark:, deployment done :rocket:, enjoy! :tada:

---

## Syntax Highlighting

Each block below uses a different language tag so highlight.js can apply
per-language token colouring. The active theme is controlled by `highlight_style`.

### TypeScript

```typescript
interface ExportOptions {
  inputPath: string;
  outputPath?: string;
  pageFormat?: "A4" | "Letter" | "Legal";
  orientation?: "portrait" | "landscape";
  scale?: number;
  highlight?: boolean;
  highlightStyle?: string;
}

async function exportToPdf(options: ExportOptions): Promise<string> {
  const { inputPath, pageFormat = "A4", scale = 1 } = options;
  const html = await renderMarkdown(inputPath);
  const outputPath = await chromium.pdf(html, { pageFormat, scale });
  return outputPath;
}
```

### Rust

```rust
use std::path::{Path, PathBuf};

#[derive(Debug)]
struct PdfOptions {
    input_path: PathBuf,
    page_format: String,
    orientation: Orientation,
    scale: f32,
}

#[derive(Debug)]
enum Orientation {
    Portrait,
    Landscape,
}

impl Default for PdfOptions {
    fn default() -> Self {
        Self {
            input_path: PathBuf::new(),
            page_format: String::from("A4"),
            orientation: Orientation::Portrait,
            scale: 1.0,
        }
    }
}

fn export_pdf(opts: &PdfOptions) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let output = opts.input_path.with_extension("pdf");
    println!("Exporting {:?} → {:?}", opts.input_path, output);
    Ok(output)
}
```

### JavaScript

```javascript
async function renderMarkdownToHtml(inputPath, options = {}) {
  const source = await fs.readFile(inputPath, "utf8");
  const { body, title } = splitFrontmatter(source);

  const md = new MarkdownIt({ html: true, typographer: true });
  if (options.emoji) md.use(emojiPlugin);

  const rendered = md.render(body);
  return { html: wrapHtml(rendered, title), title };
}

// Resolve {placeholder} tokens against a context object
function resolvePlaceholders(text, context = {}) {
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(context, key)
      ? escapeHtml(String(context[key]))
      : `{${key}}`
  );
}
```

### Bash

```bash
#!/usr/bin/env bash
# Install Chromium for Playwright

set -euo pipefail

SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/server"

echo "Installing npm dependencies…"
cd "$SERVER_DIR"
npm install --no-audit --no-fund

echo "Installing Chromium…"
node node_modules/playwright-core/cli.js install chromium

echo "Done! Chromium is ready."
```

### SQL

```sql
-- Report: PDF export history
SELECT
    e.id,
    e.input_file                          AS source,
    e.output_file                         AS pdf,
    e.page_format,
    e.orientation,
    e.highlight_style,
    e.created_at::date                    AS export_date,
    ROUND(e.file_size_bytes / 1024.0, 1) AS size_kb
FROM pdf_exports e
WHERE e.created_at >= NOW() - INTERVAL '30 days'
  AND e.status = 'success'
ORDER BY e.created_at DESC
LIMIT 50;
```

### JSON

```json
{
  "context_servers": {
    "markdown-pdf": {
      "settings": {
        "page_format": "A4",
        "orientation": "portrait",
        "scale": 1,
        "highlight": true,
        "highlight_style": "github.css",
        "emoji": true,
        "breaks": false,
        "print_background": true,
        "display_header_footer": false,
        "margin": {
          "top": "15mm",
          "right": "15mm",
          "bottom": "15mm",
          "left": "15mm"
        }
      }
    }
  }
}
```

### YAML

```yaml
# zed-markdown-pdf default configuration
server:
  name: markdown-pdf
  version: "0.1.0"

defaults:
  page_format: A4
  orientation: portrait
  scale: 1
  print_background: true

highlight:
  enabled: true
  style: github.css

header_footer:
  enabled: false
  header: "<div style='font-size:9px;margin-left:1cm'><span class='title'></span></div>"
  footer: "<div style='font-size:9px;margin:0 auto'><span class='pageNumber'></span> / <span class='totalPages'></span></div>"

margin:
  top: 15mm
  right: 15mm
  bottom: 15mm
  left: 15mm
```

---

## Hard Line Breaks

The `breaks` setting controls whether single newlines inside a paragraph are
rendered as hard `<br>` line breaks or collapsed into a space (the default).

**With `breaks: false` (default)** — the two lines below merge into one sentence:
First line of a paragraph.
Second line continues the same paragraph without a break.

**With `breaks: true`** — each line starts on its own line in the output:
First line.
Second line.
Third line.
Each newline becomes a `<br>` in the rendered HTML.

This is useful for poetry, addresses, or any content where the author controls
line endings explicitly.

---

## Lists

### Unordered — nested

- Rendering pipeline
  - Parse YAML front matter
  - Render Markdown with markdown-it
  - Apply syntax highlighting (highlight.js)
  - Resolve emoji shortcodes (markdown-it-emoji)
  - Inject stylesheets
  - Convert HTML → PDF with Playwright
- Output options
  - Custom output directory
  - Per-call path override
  - Auto-open after export

### Ordered — nested

1. Install the extension
2. Enable the context server
   1. Open **Agent → Context Servers**
   2. Toggle **markdown-pdf** on
3. Open a Markdown file
4. Ask the assistant: *"Export this file to PDF"*

### Task list

- [x] Basic PDF export
- [x] Syntax highlighting via highlight.js
- [x] Emoji shortcodes
- [x] Header and footer templates
- [x] Landscape orientation
- [x] Page scale
- [x] Page ranges
- [x] Hard line breaks
- [ ] Table of contents generation
- [ ] Multi-file export

---

## Blockquotes

> **Single-level blockquote.** Blockquotes are rendered with a left border and
> muted text colour. They are useful for callouts, warnings, and citations.

> :bulb: **Tip:** Set `display_header_footer: true` and increase your top/bottom
> margins to at least `20mm` so the header and footer don't overlap the content.

> Outer blockquote.
> > Nested blockquote — indented one level deeper.
> > > Triple-nested blockquote.

---

## Tables

### Feature matrix

| Feature | Default | Overridable per call | Notes |
|---------|---------|----------------------|-------|
| `page_format` | `A4` | :white_check_mark: | 11 formats supported |
| `orientation` | `portrait` | :white_check_mark: | portrait or landscape |
| `scale` | `1` | :white_check_mark: | 0.1 – 2 |
| `highlight` | `true` | :white_check_mark: | via highlight.js |
| `highlight_style` | `github.css` | :white_check_mark: | 80+ themes |
| `emoji` | `true` | :white_check_mark: | via markdown-it-emoji |
| `breaks` | `false` | :white_check_mark: | hard `<br>` on newline |
| `display_header_footer` | `false` | :white_check_mark: | Chromium native |
| `include_default_styles` | `true` | :white_check_mark: | disable for full custom CSS |
| `print_background` | `true` | :white_check_mark: | backgrounds and images |

### Highlight.js theme sampler

| Theme file | Style |
|---|---|
| `github.css` | Light GitHub (default) |
| `github-dark.css` | Dark GitHub |
| `monokai.css` | Classic Monokai dark |
| `atom-one-dark.css` | Atom One Dark |
| `nord.css` | Nord |
| `tokyo-night-dark.css` | Tokyo Night |
| `rose-pine.css` | Rosé Pine |
| `vs.css` | Visual Studio light |
| `vs2015.css` | Visual Studio dark |

---

## Inline HTML

Since `html: true` is set in the markdown-it options, raw HTML passes through
unchanged.

<div style="background:#f0f4ff;border-left:4px solid #4a90e2;padding:0.8em 1em;border-radius:4px;margin:1em 0">
  <strong>:information_source: Info box</strong> — built with inline HTML and
  inline styles. Works well for callouts that need custom colour or layout.
</div>

<details>
  <summary><strong>Collapsible section (HTML <code>&lt;details&gt;</code>)</strong></summary>
  <p style="margin-top:0.5em">
    This content is hidden by default in a browser, but Chromium expands it
    during PDF rendering so all content appears in the PDF output.
  </p>
</details>

---

## Page Break

The built-in stylesheet provides a `.page` utility class. Place the div below
anywhere in your Markdown to force a hard page break at that point.

<div class="page"></div>

## Content After Page Break

This section starts on a new page because of the `<div class="page"></div>`
above. Use it to separate major chapters, appendices, or sections in long
documents.

### More code — inline examples

Inline code references: `exportMarkdownPdf()`, `renderMarkdownToHtml()`,
`buildEffectiveOptions()`, `normalizeSettings()`.

A mixed paragraph with `code`, **bold**, *italic*, and a
[link](https://github.com/highlightjs/highlight.js) all together.

### Long paragraph for reflow testing

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam
voluptatem quia voluptas sit aspernatur aut odit aut fugit.

---

## Horizontal Rules and Separators

Horizontal rules are rendered as a thin `#d0d7de` border in the neutral theme.

---

The line above is a standard `---` horizontal rule.

---

## Conclusion

This document covers every rendering feature currently supported by the
**Markdown PDF** extension. When all features work correctly, the exported PDF
should show:

- :white_check_mark: Emoji shortcodes rendered as Unicode glyphs
- :white_check_mark: Syntax-highlighted code blocks for TS, Rust, JS, Bash, SQL, JSON, YAML
- :white_check_mark: All six heading levels styled correctly
- :white_check_mark: Tables, task lists, nested lists, and blockquotes
- :white_check_mark: A hard page break between major sections
- :white_check_mark: Inline HTML callouts and collapsible elements
- :white_check_mark: Long paragraphs reflowing within the page margins

---

*Generated by the **Zed Markdown PDF** extension — [github.com/matinfo/zed-markdown-pdf](https://github.com/matinfo/zed-markdown-pdf)*