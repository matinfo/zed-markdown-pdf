/**
 * @fileoverview Unit tests for schema-validator.mjs
 *
 * Run with: node --test server/lib/__tests__/schema-validator.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  validateStructuredConfig,
  validateFrontMatterConfig,
  formatValidationResult,
  isStructuredConfig,
} from "../schema-validator.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// validateStructuredConfig
// ─────────────────────────────────────────────────────────────────────────────

describe("validateStructuredConfig", () => {
  describe("basic validation", () => {
    it("should accept null/undefined config", () => {
      assert.deepEqual(validateStructuredConfig(null), {
        valid: true,
        errors: [],
        warnings: [],
      });
      assert.deepEqual(validateStructuredConfig(undefined), {
        valid: true,
        errors: [],
        warnings: [],
      });
    });

    it("should reject non-object config", () => {
      const result = validateStructuredConfig("invalid");
      assert.equal(result.valid, false);
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0].message, /must be an object/);
    });

    it("should reject array config", () => {
      const result = validateStructuredConfig([]);
      assert.equal(result.valid, false);
      assert.match(result.errors[0].message, /must be an object/);
    });

    it("should accept empty object", () => {
      const result = validateStructuredConfig({});
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });
  });

  describe("text element validation", () => {
    it("should accept valid text element", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "text",
            content: "Hello World",
          },
        },
      });
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it("should accept text element with all properties", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "text",
            content: "Page {page}",
            font_size: "10px",
            font_weight: "bold",
            font_style: "italic",
            color: "#333",
            style: "text-transform: uppercase",
          },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should error on missing content", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "text",
          },
        },
      });
      assert.equal(result.valid, false);
      assert.equal(result.errors.length, 1);
      assert.match(result.errors[0].message, /content/);
    });

    it("should error on empty content", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "text",
            content: "   ",
          },
        },
      });
      assert.equal(result.valid, false);
    });

    it("should warn on invalid font_size", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "text",
            content: "Test",
            font_size: "invalid",
          },
        },
      });
      assert.equal(result.valid, true); // Warnings don't fail validation
      assert.equal(result.warnings.length, 1);
      assert.match(result.warnings[0].message, /Invalid CSS length/i);
    });

    it("should accept various CSS length formats", () => {
      const lengths = [
        "10px",
        "12pt",
        "1.5em",
        "2rem",
        "15mm",
        "1.5cm",
        "0.5in",
        "100%",
        "0",
      ];
      for (const len of lengths) {
        const result = validateStructuredConfig({
          header: {
            left: { type: "text", content: "Test", font_size: len },
          },
        });
        assert.equal(result.warnings.length, 0, `"${len}" should be valid`);
      }
    });

    it("should accept various font weights", () => {
      const weights = [
        "normal",
        "bold",
        "bolder",
        "lighter",
        100,
        400,
        700,
        "600",
      ];
      for (const weight of weights) {
        const result = validateStructuredConfig({
          header: {
            left: { type: "text", content: "Test", font_weight: weight },
          },
        });
        assert.equal(
          result.warnings.length,
          0,
          `Font weight "${weight}" should be valid`,
        );
      }
    });

    it("should accept various color formats", () => {
      const colors = [
        "#fff",
        "#ffffff",
        "#ffffffff",
        "red",
        "rgb(255,0,0)",
        "rgba(255,0,0,0.5)",
        "hsl(0,100%,50%)",
      ];
      for (const color of colors) {
        const result = validateStructuredConfig({
          header: {
            left: { type: "text", content: "Test", color },
          },
        });
        assert.equal(
          result.warnings.length,
          0,
          `Color "${color}" should be valid`,
        );
      }
    });
  });

  describe("image element validation", () => {
    it("should accept valid image element", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "image",
            src: "./logo.svg",
          },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept image with all properties", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "image",
            src: "./assets/logo.png",
            height: "20px",
            width: "100px",
            alt: "Company Logo",
            style: "opacity: 0.9",
          },
        },
      });
      assert.equal(result.valid, true);
      assert.equal(result.warnings.length, 0);
    });

    it("should error on missing src", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "image",
          },
        },
      });
      assert.equal(result.valid, false);
      assert.match(result.errors[0].message, /src/);
    });

    it("should accept supported image formats", () => {
      const formats = [".svg", ".png", ".jpg", ".jpeg"];
      for (const ext of formats) {
        const result = validateStructuredConfig({
          header: {
            left: { type: "image", src: `./logo${ext}` },
          },
        });
        assert.equal(result.valid, true);
        assert.equal(
          result.warnings.length,
          0,
          `Format "${ext}" should not warn`,
        );
      }
    });

    it("should warn on unsupported image format", () => {
      const result = validateStructuredConfig({
        header: {
          left: {
            type: "image",
            src: "./logo.gif",
          },
        },
      });
      assert.equal(result.valid, true);
      assert.equal(result.warnings.length, 1);
      assert.match(result.warnings[0].message, /Unsupported image format/);
    });
  });

  describe("page_number element validation", () => {
    it("should accept valid page_number element", () => {
      const result = validateStructuredConfig({
        footer: {
          center: {
            type: "page_number",
          },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept page_number with format", () => {
      const result = validateStructuredConfig({
        footer: {
          center: {
            type: "page_number",
            format: "Page {page}",
            font_size: "9px",
            color: "#666",
          },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should error on non-string format", () => {
      const result = validateStructuredConfig({
        footer: {
          center: {
            type: "page_number",
            format: 123,
          },
        },
      });
      assert.equal(result.valid, false);
    });
  });

  describe("total_pages element validation", () => {
    it("should accept valid total_pages element", () => {
      const result = validateStructuredConfig({
        footer: {
          right: {
            type: "total_pages",
            format: "{pages} pages",
          },
        },
      });
      assert.equal(result.valid, true);
    });
  });

  describe("date element validation", () => {
    it("should accept valid date element", () => {
      const result = validateStructuredConfig({
        header: {
          right: {
            type: "date",
          },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept date with format", () => {
      const result = validateStructuredConfig({
        header: {
          right: {
            type: "date",
            format: "yyyy-MM-dd",
            font_size: "8px",
          },
        },
      });
      assert.equal(result.valid, true);
    });
  });

  describe("title element validation", () => {
    it("should accept valid title element", () => {
      const result = validateStructuredConfig({
        header: {
          center: {
            type: "title",
          },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept title with fallback", () => {
      const result = validateStructuredConfig({
        header: {
          center: {
            type: "title",
            font_weight: "bold",
            fallback: "Untitled Document",
          },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should error on non-string fallback", () => {
      const result = validateStructuredConfig({
        header: {
          center: {
            type: "title",
            fallback: 123,
          },
        },
      });
      assert.equal(result.valid, false);
    });
  });

  describe("spacer element validation", () => {
    it("should accept spacer without width", () => {
      const result = validateStructuredConfig({
        header: {
          left: [
            { type: "image", src: "./logo.svg" },
            { type: "spacer" },
            { type: "text", content: "Company Name" },
          ],
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept spacer with width", () => {
      const result = validateStructuredConfig({
        header: {
          left: [
            { type: "image", src: "./logo.svg" },
            { type: "spacer", width: "10mm" },
            { type: "text", content: "Company Name" },
          ],
        },
      });
      assert.equal(result.valid, true);
    });
  });

  describe("zone validation", () => {
    it("should accept single element in zone", () => {
      const result = validateStructuredConfig({
        header: {
          left: { type: "text", content: "Test" },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept array of elements in zone", () => {
      const result = validateStructuredConfig({
        header: {
          left: [
            { type: "image", src: "./logo.svg", height: "18px" },
            { type: "text", content: "Company Name" },
          ],
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept null zone (explicit removal)", () => {
      const result = validateStructuredConfig({
        header: {
          left: null,
          center: { type: "title" },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should warn on empty array zone", () => {
      const result = validateStructuredConfig({
        header: {
          left: [],
        },
      });
      assert.equal(result.valid, true);
      assert.equal(result.warnings.length, 1);
      assert.match(result.warnings[0].message, /empty/i);
    });

    it("should validate all three zones", () => {
      const result = validateStructuredConfig({
        header: {
          left: { type: "image", src: "./logo.svg" },
          center: { type: "title" },
          right: { type: "text", content: "{date}" },
        },
      });
      assert.equal(result.valid, true);
    });
  });

  describe("element type validation", () => {
    it("should error on missing type", () => {
      const result = validateStructuredConfig({
        header: {
          left: { content: "Test" },
        },
      });
      assert.equal(result.valid, false);
      assert.match(result.errors[0].message, /type/);
    });

    it("should error on invalid type", () => {
      const result = validateStructuredConfig({
        header: {
          left: { type: "invalid_type", content: "Test" },
        },
      });
      assert.equal(result.valid, false);
      assert.match(result.errors[0].message, /Invalid element type/);
    });

    it("should list valid types in error message", () => {
      const result = validateStructuredConfig({
        header: {
          left: { type: "unknown" },
        },
      });
      assert.match(result.errors[0].message, /text/);
      assert.match(result.errors[0].message, /image/);
    });
  });

  describe("container properties validation", () => {
    it("should accept valid container properties", () => {
      const result = validateStructuredConfig({
        header: {
          height: "15mm",
          padding: "0 10mm",
          font_family: "Arial, sans-serif",
          font_size: "10px",
          color: "#333",
          border_bottom: "1px solid #ccc",
          background: "#f5f5f5",
          left: { type: "text", content: "Test" },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should warn on invalid height", () => {
      const result = validateStructuredConfig({
        header: {
          height: "tall",
          left: { type: "text", content: "Test" },
        },
      });
      assert.equal(result.valid, true);
      assert.ok(result.warnings.some((w) => w.path.includes("height")));
    });
  });

  describe("shorthand properties validation", () => {
    it("should accept shorthand text properties", () => {
      const result = validateStructuredConfig({
        header: {
          left_text: "Company Name",
          right_text: "Page {page}",
        },
      });
      assert.equal(result.valid, true);
    });

    it("should accept shorthand image properties", () => {
      const result = validateStructuredConfig({
        header: {
          left_image: "./logo.svg",
          left_image_height: "20px",
        },
      });
      assert.equal(result.valid, true);
    });

    it("should error on non-string shorthand text", () => {
      const result = validateStructuredConfig({
        header: {
          left_text: 123,
        },
      });
      assert.equal(result.valid, false);
    });

    it("should warn when shorthand conflicts with zone definition", () => {
      const result = validateStructuredConfig({
        header: {
          left: { type: "text", content: "Primary" },
          left_text: "Ignored", // This will be ignored
        },
      });
      assert.equal(result.valid, true);
      assert.ok(result.warnings.some((w) => w.message.includes("ignored")));
    });

    it("should warn on unsupported image format in shorthand", () => {
      const result = validateStructuredConfig({
        header: {
          left_image: "./logo.webp",
        },
      });
      assert.equal(result.valid, true);
      assert.ok(result.warnings.some((w) => w.message.includes("Unsupported")));
    });
  });

  describe("header and footer validation", () => {
    it("should validate both header and footer", () => {
      const result = validateStructuredConfig({
        header: {
          left: { type: "image", src: "./logo.svg" },
          right: { type: "date" },
        },
        footer: {
          center: { type: "text", content: "Page {page} of {pages}" },
        },
      });
      assert.equal(result.valid, true);
    });

    it("should collect errors from both header and footer", () => {
      const result = validateStructuredConfig({
        header: {
          left: { type: "text" }, // Missing content
        },
        footer: {
          center: { type: "image" }, // Missing src
        },
      });
      assert.equal(result.valid, false);
      assert.equal(result.errors.length, 2);
    });

    it("should accept null header or footer", () => {
      const result = validateStructuredConfig({
        header: null,
        footer: {
          center: { type: "page_number" },
        },
      });
      assert.equal(result.valid, true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateFrontMatterConfig
// ─────────────────────────────────────────────────────────────────────────────

describe("validateFrontMatterConfig", () => {
  it("should accept null/undefined", () => {
    assert.equal(validateFrontMatterConfig(null).valid, true);
    assert.equal(validateFrontMatterConfig(undefined).valid, true);
  });

  it("should validate header and footer", () => {
    const result = validateFrontMatterConfig({
      header: {
        left_image: "./logo.svg",
      },
      footer: {
        center_text: "Page {page}",
      },
    });
    assert.equal(result.valid, true);
  });

  it("should validate display_header_footer", () => {
    const result = validateFrontMatterConfig({
      display_header_footer: true,
    });
    assert.equal(result.valid, true);
  });

  it("should error on non-boolean display_header_footer", () => {
    const result = validateFrontMatterConfig({
      display_header_footer: "yes",
    });
    assert.equal(result.valid, false);
  });

  it("should validate page_format", () => {
    const result = validateFrontMatterConfig({
      page_format: "A4",
    });
    assert.equal(result.valid, true);
  });

  it("should error on invalid page_format", () => {
    const result = validateFrontMatterConfig({
      page_format: "A10",
    });
    assert.equal(result.valid, false);
    assert.match(result.errors[0].message, /page format/i);
  });

  it("should validate orientation", () => {
    assert.equal(
      validateFrontMatterConfig({ orientation: "portrait" }).valid,
      true,
    );
    assert.equal(
      validateFrontMatterConfig({ orientation: "landscape" }).valid,
      true,
    );
    assert.equal(
      validateFrontMatterConfig({ orientation: "diagonal" }).valid,
      false,
    );
  });

  it("should validate scale", () => {
    assert.equal(validateFrontMatterConfig({ scale: 1 }).valid, true);
    assert.equal(validateFrontMatterConfig({ scale: 0.5 }).valid, true);
    assert.equal(validateFrontMatterConfig({ scale: 2 }).valid, true);
    assert.equal(validateFrontMatterConfig({ scale: 0.05 }).valid, false);
    assert.equal(validateFrontMatterConfig({ scale: 3 }).valid, false);
    assert.equal(validateFrontMatterConfig({ scale: "1" }).valid, false);
  });

  it("should validate margin", () => {
    const result = validateFrontMatterConfig({
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });
    assert.equal(result.valid, true);
  });

  it("should error on non-object margin", () => {
    const result = validateFrontMatterConfig({
      margin: "20mm",
    });
    assert.equal(result.valid, false);
  });

  it("should warn on invalid margin values", () => {
    const result = validateFrontMatterConfig({
      margin: {
        top: "big",
      },
    });
    assert.equal(result.valid, true);
    assert.ok(result.warnings.some((w) => w.path.includes("margin.top")));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatValidationResult
// ─────────────────────────────────────────────────────────────────────────────

describe("formatValidationResult", () => {
  it("should format valid result", () => {
    const output = formatValidationResult({
      valid: true,
      errors: [],
      warnings: [],
    });
    assert.match(output, /valid/i);
    assert.match(output, /✅/);
  });

  it("should format errors", () => {
    const output = formatValidationResult({
      valid: false,
      errors: [{ path: "header.left.type", message: "Missing type" }],
      warnings: [],
    });
    assert.match(output, /❌/);
    assert.match(output, /Error/);
    assert.match(output, /header\.left\.type/);
    assert.match(output, /Missing type/);
  });

  it("should format warnings", () => {
    const output = formatValidationResult({
      valid: true,
      errors: [],
      warnings: [{ path: "header.height", message: "Invalid CSS length" }],
    });
    assert.match(output, /⚠️/);
    assert.match(output, /Warning/);
  });

  it("should format both errors and warnings", () => {
    const output = formatValidationResult({
      valid: false,
      errors: [{ path: "a", message: "Error 1" }],
      warnings: [{ path: "b", message: "Warning 1" }],
    });
    assert.match(output, /❌/);
    assert.match(output, /⚠️/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isStructuredConfig
// ─────────────────────────────────────────────────────────────────────────────

describe("isStructuredConfig", () => {
  it("should return false for null/undefined", () => {
    assert.equal(isStructuredConfig(null), false);
    assert.equal(isStructuredConfig(undefined), false);
  });

  it("should return false for non-object", () => {
    assert.equal(isStructuredConfig("string"), false);
    assert.equal(isStructuredConfig(123), false);
  });

  it("should return false for empty object", () => {
    assert.equal(isStructuredConfig({}), false);
  });

  it("should return true when header is an object", () => {
    assert.equal(
      isStructuredConfig({
        header: { left: { type: "text", content: "Test" } },
      }),
      true,
    );
  });

  it("should return true when footer is an object", () => {
    assert.equal(
      isStructuredConfig({
        footer: { center: { type: "page_number" } },
      }),
      true,
    );
  });

  it("should return false when header/footer are strings (raw HTML)", () => {
    assert.equal(
      isStructuredConfig({
        header_template: "<div>Raw HTML</div>",
      }),
      false,
    );
  });

  it("should return false when header is null", () => {
    assert.equal(
      isStructuredConfig({
        header: null,
      }),
      false,
    );
  });

  it("should return true when shorthand properties are used", () => {
    assert.equal(
      isStructuredConfig({
        left_text: "Test",
      }),
      true,
    );

    assert.equal(
      isStructuredConfig({
        left_image: "./logo.svg",
      }),
      true,
    );

    assert.equal(
      isStructuredConfig({
        center_text: "Title",
      }),
      true,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Complex/Integration scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe("complex scenarios", () => {
  it("should validate a typical two-logo header", () => {
    const result = validateStructuredConfig({
      header: {
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
    });
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.warnings.length, 0);
  });

  it("should validate an academic paper style", () => {
    const result = validateStructuredConfig({
      header: {
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
      footer: {
        center: {
          type: "text",
          content: "— {page} —",
          font_size: "9px",
        },
      },
    });
    assert.equal(result.valid, true);
  });

  it("should validate multi-element zones", () => {
    const result = validateStructuredConfig({
      header: {
        left: [
          { type: "image", src: "./logo.svg", height: "20px" },
          { type: "spacer", width: "5mm" },
          { type: "text", content: "Company Name", font_weight: "bold" },
        ],
        right: [
          { type: "text", content: "Page " },
          { type: "page_number" },
          { type: "text", content: " of " },
          { type: "total_pages" },
        ],
      },
    });
    assert.equal(result.valid, true);
  });

  it("should validate shorthand-only configuration", () => {
    const result = validateStructuredConfig({
      header: {
        left_image: "./logo.svg",
        left_image_height: "20px",
        center_text: "{title}",
        right_text: "{date}",
      },
      footer: {
        center_text: "Page {page} of {pages}",
      },
    });
    assert.equal(result.valid, true);
  });

  it("should collect multiple errors", () => {
    const result = validateStructuredConfig({
      header: {
        left: { type: "text" }, // Missing content
        center: { type: "image" }, // Missing src
        right: { type: "unknown" }, // Invalid type
      },
    });
    assert.equal(result.valid, false);
    assert.equal(result.errors.length, 3);
  });
});
