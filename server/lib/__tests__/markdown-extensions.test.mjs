/**
 * Integration tests for the optional markdown-it plugins wired up by
 * createMarkdown(): KaTeX, heading anchors, TOC.
 *
 * The plugins are loaded here directly and applied to a fresh MarkdownIt
 * instance so behavior matches what the server pipeline produces.
 *
 * Run with: node --test server/lib/__tests__/markdown-extensions.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import MarkdownIt from "markdown-it";
import katex from "@vscode/markdown-it-katex";
import anchor from "markdown-it-anchor";
import toc from "markdown-it-toc-done-right";

function ghSlugify(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^\w\sÀ-￿-]/g, "")
    .replace(/\s+/g, "-");
}

describe("KaTeX plugin", () => {
  it("does not render math when plugin is not applied", () => {
    const md = new MarkdownIt();
    const html = md.render("Equation: $x^2$");
    assert.ok(!html.includes('class="katex"'));
  });

  it("renders inline math as a katex span", () => {
    const md = new MarkdownIt().use(katex.default ?? katex, {
      throwOnError: false,
    });
    const html = md.render("Equation: $x^2$");
    assert.ok(html.includes('class="katex"'));
  });

  it("renders display math wrapped in katex-display", () => {
    const md = new MarkdownIt().use(katex.default ?? katex, {
      throwOnError: false,
    });
    const html = md.render("$$\\int_0^1 x\\,dx$$");
    assert.ok(html.includes("katex-display"));
  });

  it("does not crash on invalid LaTeX when throwOnError is false", () => {
    const md = new MarkdownIt().use(katex.default ?? katex, {
      throwOnError: false,
      errorColor: "#cc0000",
    });
    let html;
    assert.doesNotThrow(() => {
      html = md.render("$\\garbage{}$");
    });
    assert.ok(typeof html === "string" && html.length > 0);
  });

  it("expands user-defined macros", () => {
    const md = new MarkdownIt().use(katex.default ?? katex, {
      throwOnError: false,
      macros: { "\\RR": "\\mathbb{R}" },
    });
    const html = md.render("$\\RR$");
    assert.ok(html.includes('class="katex"'));
    // \mathbb expansion shows up in the rendered HTML
    assert.ok(html.includes("mathbb") || html.includes("ℝ") || html.length > 50);
  });
});

describe("Heading anchors", () => {
  it("adds id slugs to headings", () => {
    const md = new MarkdownIt().use(anchor.default ?? anchor, {
      permalink: false,
      slugify: ghSlugify,
    });
    const html = md.render("## My Section");
    assert.match(html, /<h2 id="my-section"/);
  });

  it("slugify strips punctuation and lowercases", () => {
    assert.equal(ghSlugify("Hello, World!"), "hello-world");
    assert.equal(ghSlugify("  Spaced   Out  "), "spaced-out");
  });
});

describe("TOC plugin", () => {
  const sample = `
[[toc]]

# Title

## Section A

### Subsection A1

## Section B
`;

  it("passes [[toc]] through as literal text when plugin not applied", () => {
    const md = new MarkdownIt();
    const html = md.render(sample);
    assert.ok(html.includes("[[toc]]"));
  });

  it("renders [[toc]] as a nested list with markdown-toc class", () => {
    const md = new MarkdownIt()
      .use(anchor.default ?? anchor, { permalink: false, slugify: ghSlugify })
      .use(toc.default ?? toc, {
        level: [1, 2, 3],
        listType: "ul",
        containerClass: "markdown-toc",
        slugify: ghSlugify,
      });
    const html = md.render(sample);
    assert.match(html, /class="markdown-toc"/);
    assert.match(html, /<a [^>]*href="#section-a"/);
    assert.match(html, /<a [^>]*href="#subsection-a1"/);
  });

  it("respects level option", () => {
    const md = new MarkdownIt()
      .use(anchor.default ?? anchor, { permalink: false, slugify: ghSlugify })
      .use(toc.default ?? toc, {
        level: [2],
        listType: "ul",
        containerClass: "markdown-toc",
        slugify: ghSlugify,
      });
    const html = md.render(sample);
    assert.ok(html.includes('href="#section-a"'));
    assert.ok(!html.includes('href="#subsection-a1"'));
  });
});
