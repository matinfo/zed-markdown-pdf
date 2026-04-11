/**
 * @fileoverview Unit tests for html-generator.mjs
 *
 * Run with: node --test server/lib/__tests__/html-generator.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  expandShorthands,
  collectImagePaths,
  generateHtml,
  generateHtmlWithAssets,
  createHtmlGenerator,
} from "../html-generator.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a mock placeholder resolver.
 */
function createMockPlaceholderResolver() {
  return (text) => {
    return text
      .replace(/\{page\}/g, '<span class="pageNumber"></span>')
      .replace(/\{pages\}/g, '<span class="totalPages"></span>')
      .replace(/\{title\}/g, "Test Document")
      .replace(/\{date\}/g, "2025-01-15")
      .replace(/\{date:([^}]+)\}/g, "01/15/2025")
      .replace(/\{author\}/g, "Jane Doe")
      .replace(/\{filename\}/g, "document.md");
  };
}

/**
 * Create a mock asset resolver.
 */
function createMockAssetResolver() {
  return async (path) => {
    return `data:image/svg+xml;base64,mock-${path.replace(/[^a-z0-9]/gi, "")}`;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// expandShorthands
// ─────────────────────────────────────────────────────────────────────────────

describe("expandShorthands", () => {
  it("should return null/undefined unchanged", () => {
    assert.equal(expandShorthands(null), null);
    assert.equal(expandShorthands(undefined), undefined);
  });

  it("should return empty object unchanged", () => {
    assert.deepEqual(expandShorthands({}), {});
  });

  it("should expand left_text to left zone", () => {
    const result = expandShorthands({
      left_text: "Hello World",
    });

    assert.deepEqual(result.left, {
      type: "text",
      content: "Hello World",
    });
    assert.equal(result.left_text, undefined);
  });

  it("should expand left_image to left zone", () => {
    const result = expandShorthands({
      left_image: "./logo.svg",
    });

    assert.deepEqual(result.left, {
      type: "image",
      src: "./logo.svg",
    });
  });

  it("should expand left_image with height", () => {
    const result = expandShorthands({
      left_image: "./logo.svg",
      left_image_height: "20px",
    });

    assert.deepEqual(result.left, {
      type: "image",
      src: "./logo.svg",
      height: "20px",
    });
  });

  it("should expand center_text", () => {
    const result = expandShorthands({
      center_text: "{title}",
    });

    assert.deepEqual(result.center, {
      type: "text",
      content: "{title}",
    });
  });

  it("should expand right_text", () => {
    const result = expandShorthands({
      right_text: "Page {page}",
    });

    assert.deepEqual(result.right, {
      type: "text",
      content: "Page {page}",
    });
  });

  it("should expand multiple zones", () => {
    const result = expandShorthands({
      left_image: "./logo.svg",
      center_text: "{title}",
      right_text: "{date}",
    });

    assert.equal(result.left.type, "image");
    assert.equal(result.center.type, "text");
    assert.equal(result.right.type, "text");
  });

  it("should not override explicit zone definitions", () => {
    const result = expandShorthands({
      left: { type: "text", content: "Explicit" },
      left_text: "Shorthand",
    });

    assert.equal(result.left.content, "Explicit");
  });

  it("should preserve other config properties", () => {
    const result = expandShorthands({
      height: "15mm",
      font_size: "10px",
      left_text: "Test",
    });

    assert.equal(result.height, "15mm");
    assert.equal(result.font_size, "10px");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// collectImagePaths
// ─────────────────────────────────────────────────────────────────────────────

describe("collectImagePaths", () => {
  it("should return empty array for null/undefined", () => {
    assert.deepEqual(collectImagePaths(null), []);
    assert.deepEqual(collectImagePaths(undefined), []);
  });

  it("should return empty array for config without images", () => {
    const result = collectImagePaths({
      left: { type: "text", content: "Test" },
    });

    assert.deepEqual(result, []);
  });

  it("should collect image path from zone", () => {
    const result = collectImagePaths({
      left: { type: "image", src: "./logo.svg" },
    });

    assert.deepEqual(result, ["./logo.svg"]);
  });

  it("should collect multiple image paths", () => {
    const result = collectImagePaths({
      left: { type: "image", src: "./left.svg" },
      right: { type: "image", src: "./right.svg" },
    });

    assert.deepEqual(result, ["./left.svg", "./right.svg"]);
  });

  it("should collect from array zones", () => {
    const result = collectImagePaths({
      left: [
        { type: "image", src: "./logo1.svg" },
        { type: "text", content: "Text" },
        { type: "image", src: "./logo2.svg" },
      ],
    });

    assert.deepEqual(result, ["./logo1.svg", "./logo2.svg"]);
  });

  it("should collect from shorthand properties", () => {
    const result = collectImagePaths({
      left_image: "./left.svg",
      right_image: "./right.png",
    });

    assert.deepEqual(result, ["./left.svg", "./right.png"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Basic
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - basic", () => {
  const resolve = createMockPlaceholderResolver();

  it("should return empty string for null/undefined config", () => {
    assert.equal(generateHtml({ config: null, resolvePlaceholders: resolve }), "");
    assert.equal(generateHtml({ config: undefined, resolvePlaceholders: resolve }), "");
  });

  it("should generate container div with styles", () => {
    const result = generateHtml({
      config: { left: { type: "text", content: "Test" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("<div"));
    assert.ok(result.includes("display:flex"));
    assert.ok(result.includes("justify-content:space-between"));
  });

  it("should use default font-family", () => {
    const result = generateHtml({
      config: { left: { type: "text", content: "Test" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("font-family:system-ui"));
  });

  it("should override font-family from config", () => {
    const result = generateHtml({
      config: {
        font_family: "Arial, sans-serif",
        left: { type: "text", content: "Test" },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Arial, sans-serif"));
  });

  it("should apply height from config", () => {
    const result = generateHtml({
      config: {
        height: "15mm",
        left: { type: "text", content: "Test" },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("height:15mm"));
  });

  it("should apply border_bottom for header", () => {
    const result = generateHtml({
      config: {
        border_bottom: "1px solid #ccc",
        left: { type: "text", content: "Test" },
      },
      type: "header",
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("border-bottom:1px solid #ccc"));
  });

  it("should apply border_top for footer", () => {
    const result = generateHtml({
      config: {
        border_top: "1px solid #ccc",
        left: { type: "text", content: "Test" },
      },
      type: "footer",
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("border-top:1px solid #ccc"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Text Element
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - text element", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate text span", () => {
    const result = generateHtml({
      config: { left: { type: "text", content: "Hello World" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("<span"));
    assert.ok(result.includes("Hello World"));
  });

  it("should resolve placeholders in text", () => {
    const result = generateHtml({
      config: { left: { type: "text", content: "Page {page}" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("pageNumber"));
  });

  it("should apply text styles", () => {
    const result = generateHtml({
      config: {
        left: {
          type: "text",
          content: "Styled",
          font_size: "12px",
          font_weight: "bold",
          color: "#333",
        },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("font-size:12px"));
    assert.ok(result.includes("font-weight:bold"));
    assert.ok(result.includes("color:#333"));
  });

  it("should apply custom style string", () => {
    const result = generateHtml({
      config: {
        left: {
          type: "text",
          content: "Custom",
          style: "text-transform: uppercase; letter-spacing: 1px",
        },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("text-transform:uppercase"));
    assert.ok(result.includes("letter-spacing:1px"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Image Element
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - image element", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate img tag", () => {
    const result = generateHtml({
      config: { left: { type: "image", src: "./logo.svg" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("<img"));
    assert.ok(result.includes("src="));
  });

  it("should use resolved asset data URI", () => {
    const resolvedAssets = new Map();
    resolvedAssets.set("./logo.svg", "data:image/svg+xml;base64,TEST");

    const result = generateHtml({
      config: { left: { type: "image", src: "./logo.svg" } },
      resolvePlaceholders: resolve,
      resolvedAssets,
    });

    assert.ok(result.includes("data:image/svg+xml;base64,TEST"));
  });

  it("should apply height attribute", () => {
    const result = generateHtml({
      config: { left: { type: "image", src: "./logo.svg", height: "20px" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("height:20px"));
  });

  it("should include alt attribute", () => {
    const result = generateHtml({
      config: { left: { type: "image", src: "./logo.svg", alt: "Company Logo" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes('alt="Company Logo"'));
  });

  it("should include empty alt for accessibility", () => {
    const result = generateHtml({
      config: { left: { type: "image", src: "./logo.svg" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes('alt=""'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Page Number Elements
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - page number elements", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate page_number span with class", () => {
    const result = generateHtml({
      config: { center: { type: "page_number" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes('class="pageNumber"'));
  });

  it("should generate page_number with format", () => {
    const result = generateHtml({
      config: { center: { type: "page_number", format: "Page {page}" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("pageNumber"));
  });

  it("should generate total_pages span with class", () => {
    const result = generateHtml({
      config: { center: { type: "total_pages" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes('class="totalPages"'));
  });

  it("should apply styles to page number", () => {
    const result = generateHtml({
      config: { center: { type: "page_number", font_size: "9px", color: "#666" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("font-size:9px"));
    assert.ok(result.includes("color:#666"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Date Element
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - date element", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate date span", () => {
    const result = generateHtml({
      config: { right: { type: "date" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("<span"));
    assert.ok(result.includes("2025-01-15"));
  });

  it("should apply date format", () => {
    const result = generateHtml({
      config: { right: { type: "date", format: "MM/dd/yyyy" } },
      resolvePlaceholders: resolve,
    });

    // The mock resolver returns "01/15/2025" for any format
    assert.ok(result.includes("01/15/2025"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Title Element
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - title element", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate title span", () => {
    const result = generateHtml({
      config: { center: { type: "title" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Test Document"));
  });

  it("should apply title styles", () => {
    const result = generateHtml({
      config: { center: { type: "title", font_weight: "bold", font_size: "12px" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("font-weight:bold"));
    assert.ok(result.includes("font-size:12px"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Spacer Element
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - spacer element", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate flexible spacer", () => {
    const result = generateHtml({
      config: {
        left: [
          { type: "image", src: "./logo.svg" },
          { type: "spacer" },
          { type: "text", content: "Company" },
        ],
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("flex:1"));
  });

  it("should generate fixed-width spacer", () => {
    const result = generateHtml({
      config: {
        left: [
          { type: "image", src: "./logo.svg" },
          { type: "spacer", width: "10mm" },
          { type: "text", content: "Company" },
        ],
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("width:10mm"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Layout
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - layout", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate left zone only", () => {
    const result = generateHtml({
      config: { left: { type: "text", content: "Left" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Left"));
    const divCount = (result.match(/<div/g) || []).length;
    assert.ok(divCount >= 1);
  });

  it("should generate left and right zones", () => {
    const result = generateHtml({
      config: {
        left: { type: "text", content: "Left" },
        right: { type: "text", content: "Right" },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Left"));
    assert.ok(result.includes("Right"));
  });

  it("should generate center zone with proper centering", () => {
    const result = generateHtml({
      config: {
        left: { type: "image", src: "./logo.svg" },
        center: { type: "title" },
        right: { type: "date" },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("justify-content:center"));
  });

  it("should generate all three zones", () => {
    const result = generateHtml({
      config: {
        left: { type: "text", content: "Left" },
        center: { type: "text", content: "Center" },
        right: { type: "text", content: "Right" },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Left"));
    assert.ok(result.includes("Center"));
    assert.ok(result.includes("Right"));
  });

  it("should handle array of elements in zone", () => {
    const result = generateHtml({
      config: {
        left: [
          { type: "image", src: "./logo.svg", height: "18px" },
          { type: "text", content: "Company Name" },
        ],
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("<img"));
    assert.ok(result.includes("Company Name"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtml - Shorthand Integration
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtml - shorthand integration", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate from shorthand text properties", () => {
    const result = generateHtml({
      config: {
        left_text: "Left",
        right_text: "Right",
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Left"));
    assert.ok(result.includes("Right"));
  });

  it("should generate from shorthand image properties", () => {
    const result = generateHtml({
      config: {
        left_image: "./logo.svg",
        left_image_height: "20px",
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("<img"));
    assert.ok(result.includes("height:20px"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateHtmlWithAssets
// ─────────────────────────────────────────────────────────────────────────────

describe("generateHtmlWithAssets", () => {
  const resolve = createMockPlaceholderResolver();
  const resolveAsset = createMockAssetResolver();

  it("should resolve assets before generating HTML", async () => {
    const result = await generateHtmlWithAssets({
      config: { left: { type: "image", src: "./logo.svg" } },
      resolvePlaceholders: resolve,
      resolveAsset,
    });

    assert.ok(result.includes("data:image/svg+xml;base64,mock-logosvg"));
  });

  it("should resolve multiple assets", async () => {
    const result = await generateHtmlWithAssets({
      config: {
        left: { type: "image", src: "./left.svg" },
        right: { type: "image", src: "./right.svg" },
      },
      resolvePlaceholders: resolve,
      resolveAsset,
    });

    assert.ok(result.includes("mock-leftsvg"));
    assert.ok(result.includes("mock-rightsvg"));
  });

  it("should handle asset resolution failure gracefully", async () => {
    const failingResolver = async (path) => {
      throw new Error("Failed to resolve");
    };

    const result = await generateHtmlWithAssets({
      config: { left: { type: "image", src: "./logo.svg" } },
      resolvePlaceholders: resolve,
      resolveAsset: failingResolver,
    });

    // Should use original path on failure
    assert.ok(result.includes("./logo.svg"));
  });

  it("should work without asset resolver", async () => {
    const result = await generateHtmlWithAssets({
      config: { left: { type: "text", content: "Test" } },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Test"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createHtmlGenerator
// ─────────────────────────────────────────────────────────────────────────────

describe("createHtmlGenerator", () => {
  it("should create generator with required methods", () => {
    const generator = createHtmlGenerator({
      placeholderResolver: { resolve: createMockPlaceholderResolver() },
    });

    assert.equal(typeof generator.generateHeader, "function");
    assert.equal(typeof generator.generateFooter, "function");
    assert.equal(typeof generator.getImagePaths, "function");
  });

  it("should generate header HTML", async () => {
    const generator = createHtmlGenerator({
      placeholderResolver: { resolve: createMockPlaceholderResolver() },
    });

    const result = await generator.generateHeader({
      left: { type: "text", content: "Header" },
    });

    assert.ok(result.includes("Header"));
  });

  it("should generate footer HTML", async () => {
    const generator = createHtmlGenerator({
      placeholderResolver: { resolve: createMockPlaceholderResolver() },
    });

    const result = await generator.generateFooter({
      center: { type: "page_number" },
    });

    assert.ok(result.includes("pageNumber"));
  });

  it("should get image paths", () => {
    const generator = createHtmlGenerator({
      placeholderResolver: { resolve: createMockPlaceholderResolver() },
    });

    const paths = generator.getImagePaths({
      left: { type: "image", src: "./logo.svg" },
      right: { type: "image", src: "./badge.png" },
    });

    assert.deepEqual(paths, ["./logo.svg", "./badge.png"]);
  });

  it("should use asset resolver when provided", async () => {
    const generator = createHtmlGenerator({
      placeholderResolver: { resolve: createMockPlaceholderResolver() },
      assetResolver: { resolve: createMockAssetResolver() },
    });

    const result = await generator.generateHeader({
      left: { type: "image", src: "./logo.svg" },
    });

    assert.ok(result.includes("data:image/svg+xml;base64"));
  });

  it("should apply font family", async () => {
    const generator = createHtmlGenerator({
      placeholderResolver: { resolve: createMockPlaceholderResolver() },
      fontFamily: "Georgia, serif",
    });

    const result = await generator.generateHeader({
      left: { type: "text", content: "Test" },
    });

    assert.ok(result.includes("Georgia, serif"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("integration", () => {
  const resolve = createMockPlaceholderResolver();

  it("should generate typical two-logo header", async () => {
    const result = await generateHtmlWithAssets({
      config: {
        height: "20mm",
        left: {
          type: "image",
          src: "./left-logo.svg",
          height: "18px",
        },
        right: {
          type: "image",
          src: "./right-logo.svg",
          height: "18px",
        },
      },
      resolvePlaceholders: resolve,
      resolveAsset: createMockAssetResolver(),
    });

    assert.ok(result.includes("height:20mm"));
    assert.ok(result.includes("mock-leftlogosvg"));
    assert.ok(result.includes("mock-rightlogosvg"));
  });

  it("should generate academic paper header", () => {
    const result = generateHtml({
      config: {
        left: {
          type: "text",
          content: "{author}",
          font_style: "italic",
        },
        center: {
          type: "title",
          font_weight: "bold",
        },
        right: {
          type: "date",
          format: "MMMM yyyy",
        },
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Jane Doe"));
    assert.ok(result.includes("Test Document"));
    assert.ok(result.includes("font-style:italic"));
    assert.ok(result.includes("font-weight:bold"));
  });

  it("should generate simple footer with page numbers", () => {
    const result = generateHtml({
      config: {
        center: {
          type: "text",
          content: "Page {page} of {pages}",
          font_size: "9px",
        },
      },
      type: "footer",
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("pageNumber"));
    assert.ok(result.includes("totalPages"));
    assert.ok(result.includes("font-size:9px"));
  });

  it("should generate multi-element zone", () => {
    const result = generateHtml({
      config: {
        right: [
          { type: "text", content: "Page " },
          { type: "page_number" },
          { type: "text", content: " of " },
          { type: "total_pages" },
        ],
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("Page "));
    assert.ok(result.includes("pageNumber"));
    assert.ok(result.includes(" of "));
    assert.ok(result.includes("totalPages"));
  });

  it("should generate shorthand-only configuration", () => {
    const result = generateHtml({
      config: {
        left_image: "./logo.svg",
        left_image_height: "20px",
        center_text: "{title}",
        right_text: "{date}",
      },
      resolvePlaceholders: resolve,
    });

    assert.ok(result.includes("<img"));
    assert.ok(result.includes("Test Document"));
    assert.ok(result.includes("2025-01-15"));
  });
});
