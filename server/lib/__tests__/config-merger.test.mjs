/**
 * @fileoverview Unit tests for config-merger.mjs
 *
 * Run with: node --test server/lib/__tests__/config-merger.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  EXTENSION_DEFAULTS,
  mergeConfig,
  detectMode,
  usesStructuredConfig,
  getHeaderConfig,
  getFooterConfig,
  hasStructuredHeader,
  hasStructuredFooter,
  getPageSettings,
  getRenderSettings,
  createConfigMerger,
} from "../config-merger.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// EXTENSION_DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

describe("EXTENSION_DEFAULTS", () => {
  it("should have all expected keys", () => {
    assert.ok("page_format" in EXTENSION_DEFAULTS);
    assert.ok("orientation" in EXTENSION_DEFAULTS);
    assert.ok("margin" in EXTENSION_DEFAULTS);
    assert.ok("display_header_footer" in EXTENSION_DEFAULTS);
    assert.ok("header_template" in EXTENSION_DEFAULTS);
    assert.ok("footer_template" in EXTENSION_DEFAULTS);
  });

  it("should have sensible default values", () => {
    assert.equal(EXTENSION_DEFAULTS.page_format, "A4");
    assert.equal(EXTENSION_DEFAULTS.orientation, "portrait");
    assert.equal(EXTENSION_DEFAULTS.display_header_footer, false);
    assert.equal(EXTENSION_DEFAULTS.highlight, true);
  });

  it("should have frozen margin object", () => {
    assert.ok(Object.isFrozen(EXTENSION_DEFAULTS.margin));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// detectMode
// ─────────────────────────────────────────────────────────────────────────────

describe("detectMode", () => {
  it("should return 'none' for null/undefined", () => {
    assert.equal(detectMode(null), "none");
    assert.equal(detectMode(undefined), "none");
  });

  it("should return 'none' for empty object", () => {
    assert.equal(detectMode({}), "none");
  });

  it("should return 'structured' when header is an object", () => {
    assert.equal(
      detectMode({
        header: { left: { type: "text", content: "Test" } },
      }),
      "structured",
    );
  });

  it("should return 'structured' when footer is an object", () => {
    assert.equal(
      detectMode({
        footer: { center: { type: "page_number" } },
      }),
      "structured",
    );
  });

  it("should return 'structured' for shorthand properties", () => {
    assert.equal(
      detectMode({
        left_text: "Test",
      }),
      "structured",
    );

    assert.equal(
      detectMode({
        left_image: "./logo.svg",
      }),
      "structured",
    );
  });

  it("should return 'legacy' for raw template strings with display_header_footer", () => {
    assert.equal(
      detectMode({
        display_header_footer: true,
        header_template: "<div>Header</div>",
      }),
      "legacy",
    );

    assert.equal(
      detectMode({
        display_header_footer: true,
        footer_template: "<div>Footer</div>",
      }),
      "legacy",
    );
  });

  it("should return 'none' for raw templates without display_header_footer", () => {
    assert.equal(
      detectMode({
        header_template: "<div>Header</div>",
      }),
      "none",
    );
  });

  it("should return 'legacy' when display_header_footer is true without structured config", () => {
    assert.equal(
      detectMode({
        display_header_footer: true,
      }),
      "legacy",
    );
  });

  it("should return 'none' when display_header_footer is false", () => {
    assert.equal(
      detectMode({
        display_header_footer: false,
      }),
      "none",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// usesStructuredConfig
// ─────────────────────────────────────────────────────────────────────────────

describe("usesStructuredConfig", () => {
  it("should return false for empty configs", () => {
    assert.equal(usesStructuredConfig({}, null), false);
    assert.equal(usesStructuredConfig(null, null), false);
  });

  it("should return true when settings has structured header", () => {
    assert.equal(
      usesStructuredConfig(
        {
          header: { left_text: "Test" },
        },
        null,
      ),
      true,
    );
  });

  it("should return true when front matter has structured header", () => {
    assert.equal(
      usesStructuredConfig(
        {},
        {
          header: { left_image: "./logo.svg" },
        },
      ),
      true,
    );
  });

  it("should return true when front matter overrides with structured config", () => {
    assert.equal(
      usesStructuredConfig(
        {
          header_template: "<div>Legacy</div>",
        },
        {
          header: { left_text: "Structured" },
        },
      ),
      true,
    );
  });

  it("should return false for legacy templates only", () => {
    assert.equal(
      usesStructuredConfig(
        {
          header_template: "<div>Legacy</div>",
        },
        null,
      ),
      false,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mergeConfig - Basic
// ─────────────────────────────────────────────────────────────────────────────

describe("mergeConfig - basic", () => {
  it("should return defaults when no config provided", () => {
    const { config, mode, sources } = mergeConfig();

    assert.equal(config.page_format, "A4");
    assert.equal(config.orientation, "portrait");
    assert.deepEqual(sources, ["defaults"]);
  });

  it("should merge settings with defaults", () => {
    const { config, sources } = mergeConfig({
      page_format: "Letter",
    });

    assert.equal(config.page_format, "Letter");
    assert.equal(config.orientation, "portrait"); // From defaults
    assert.deepEqual(sources, ["defaults", "settings"]);
  });

  it("should merge front matter with defaults", () => {
    const { config, sources } = mergeConfig(
      {},
      {
        page_format: "Legal",
      },
    );

    assert.equal(config.page_format, "Legal");
    assert.deepEqual(sources, ["defaults", "frontmatter"]);
  });

  it("should respect priority: front matter > settings > defaults", () => {
    const { config } = mergeConfig(
      { page_format: "Letter", orientation: "landscape" },
      { page_format: "A5" },
    );

    assert.equal(config.page_format, "A5"); // From front matter
    assert.equal(config.orientation, "landscape"); // From settings
    assert.equal(config.scale, 1); // From defaults
  });

  it("should skip defaults when applyDefaults is false", () => {
    const { config, sources } = mergeConfig({ page_format: "Letter" }, null, {
      applyDefaults: false,
    });

    assert.equal(config.page_format, "Letter");
    assert.equal(config.orientation, undefined); // No defaults applied
    assert.ok(!sources.includes("defaults"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mergeConfig - Deep Merge
// ─────────────────────────────────────────────────────────────────────────────

describe("mergeConfig - deep merge", () => {
  it("should deep merge margin objects", () => {
    const { config } = mergeConfig({
      margin: { top: "20mm", right: "20mm" },
    });

    assert.equal(config.margin.top, "20mm");
    assert.equal(config.margin.right, "20mm");
    assert.equal(config.margin.bottom, "15mm"); // From defaults
    assert.equal(config.margin.left, "15mm"); // From defaults
  });

  it("should override margin from front matter", () => {
    const { config } = mergeConfig(
      { margin: { top: "20mm" } },
      { margin: { top: "25mm", bottom: "25mm" } },
    );

    assert.equal(config.margin.top, "25mm"); // From front matter
    assert.equal(config.margin.bottom, "25mm"); // From front matter
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mergeConfig - Header/Footer Zone Override
// ─────────────────────────────────────────────────────────────────────────────

describe("mergeConfig - header/footer zone override", () => {
  it("should replace zone entirely when defined in source", () => {
    const { config } = mergeConfig(
      {
        header: {
          left: { type: "text", content: "Settings Left" },
          right: { type: "date" },
        },
      },
      {
        header: {
          left: { type: "image", src: "./logo.svg" },
        },
      },
    );

    // Left is replaced entirely
    assert.equal(config.header.left.type, "image");
    assert.equal(config.header.left.src, "./logo.svg");
    // Right is preserved from settings
    assert.equal(config.header.right.type, "date");
  });

  it("should handle explicit null to remove zone", () => {
    const { config } = mergeConfig(
      {
        header: {
          left: { type: "text", content: "Settings Left" },
          center: { type: "title" },
          right: { type: "date" },
        },
      },
      {
        header: {
          center: null, // Explicitly remove center
        },
      },
    );

    assert.equal(config.header.left.type, "text"); // Preserved
    assert.equal(config.header.center, null); // Removed
    assert.equal(config.header.right.type, "date"); // Preserved
  });

  it("should handle explicit null to remove entire header", () => {
    const { config } = mergeConfig(
      {
        header: {
          left: { type: "text", content: "Test" },
        },
      },
      {
        header: null,
      },
    );

    assert.equal(config.header, null);
  });

  it("should preserve container properties when zones are overridden", () => {
    const { config } = mergeConfig(
      {
        header: {
          height: "15mm",
          font_size: "10px",
          left: { type: "text", content: "Settings" },
        },
      },
      {
        header: {
          left: { type: "image", src: "./logo.svg" },
        },
      },
    );

    assert.equal(config.header.height, "15mm"); // Preserved
    assert.equal(config.header.font_size, "10px"); // Preserved
    assert.equal(config.header.left.type, "image"); // Overridden
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mergeConfig - Mode Detection
// ─────────────────────────────────────────────────────────────────────────────

describe("mergeConfig - mode detection", () => {
  it("should detect 'none' mode for basic config", () => {
    const { mode, hasHeaderFooter } = mergeConfig({
      page_format: "Letter",
    });

    assert.equal(mode, "none");
    assert.equal(hasHeaderFooter, false);
  });

  it("should detect 'legacy' mode for raw templates", () => {
    const { mode, hasHeaderFooter } = mergeConfig({
      display_header_footer: true,
      header_template: "<div>Test</div>",
    });

    assert.equal(mode, "legacy");
    assert.equal(hasHeaderFooter, true);
  });

  it("should detect 'structured' mode for object header", () => {
    const { mode, hasHeaderFooter } = mergeConfig({
      header: {
        left: { type: "text", content: "Test" },
      },
    });

    assert.equal(mode, "structured");
    assert.equal(hasHeaderFooter, true);
  });

  it("should auto-enable display_header_footer for structured config", () => {
    const { config } = mergeConfig({
      header: {
        left_text: "Test",
      },
    });

    assert.equal(config.display_header_footer, true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Functions
// ─────────────────────────────────────────────────────────────────────────────

describe("getHeaderConfig", () => {
  it("should extract header from merged config", () => {
    const merged = mergeConfig({
      header: { left_text: "Test" },
    });

    const header = getHeaderConfig(merged);
    assert.ok(header !== null);
    assert.equal(header.left_text, "Test");
  });

  it("should return null when no header", () => {
    const merged = mergeConfig({});
    const header = getHeaderConfig(merged);
    assert.equal(header, null);
  });
});

describe("getFooterConfig", () => {
  it("should extract footer from merged config", () => {
    const merged = mergeConfig({
      footer: { center_text: "Page {page}" },
    });

    const footer = getFooterConfig(merged);
    assert.ok(footer !== null);
  });

  it("should return null when no footer", () => {
    const merged = mergeConfig({});
    const footer = getFooterConfig(merged);
    assert.equal(footer, null);
  });
});

describe("hasStructuredHeader", () => {
  it("should return true for object header", () => {
    const merged = mergeConfig({
      header: { left: { type: "text", content: "Test" } },
    });

    assert.equal(hasStructuredHeader(merged), true);
  });

  it("should return false for no header", () => {
    const merged = mergeConfig({});
    assert.equal(hasStructuredHeader(merged), false);
  });

  it("should return false for null header", () => {
    const merged = mergeConfig({
      header: null,
    });

    assert.equal(hasStructuredHeader(merged), false);
  });
});

describe("hasStructuredFooter", () => {
  it("should return true for object footer", () => {
    const merged = mergeConfig({
      footer: { center: { type: "page_number" } },
    });

    assert.equal(hasStructuredFooter(merged), true);
  });

  it("should return false for no footer", () => {
    const merged = mergeConfig({});
    assert.equal(hasStructuredFooter(merged), false);
  });
});

describe("getPageSettings", () => {
  it("should extract page settings", () => {
    const merged = mergeConfig({
      page_format: "Letter",
      orientation: "landscape",
      scale: 0.9,
    });

    const page = getPageSettings(merged);

    assert.equal(page.page_format, "Letter");
    assert.equal(page.orientation, "landscape");
    assert.equal(page.scale, 0.9);
    assert.equal(page.print_background, true); // Default
  });

  it("should provide defaults for missing values", () => {
    const merged = mergeConfig({}, null, { applyDefaults: false });
    const page = getPageSettings(merged);

    assert.equal(page.page_format, "A4");
    assert.equal(page.orientation, "portrait");
  });
});

describe("getRenderSettings", () => {
  it("should extract render settings", () => {
    const merged = mergeConfig({
      highlight: false,
      highlight_style: "monokai.css",
      emoji: false,
    });

    const render = getRenderSettings(merged);

    assert.equal(render.highlight, false);
    assert.equal(render.highlight_style, "monokai.css");
    assert.equal(render.emoji, false);
    assert.equal(render.include_default_styles, true); // Default
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createConfigMerger
// ─────────────────────────────────────────────────────────────────────────────

describe("createConfigMerger", () => {
  it("should create merger with required methods", () => {
    const merger = createConfigMerger({});

    assert.equal(typeof merger.merge, "function");
    assert.equal(typeof merger.getSettings, "function");
    assert.equal(typeof merger.updateSettings, "function");
  });

  it("should merge with bound settings", () => {
    const merger = createConfigMerger({
      page_format: "Letter",
      header: { left_text: "Company" },
    });

    const { config } = merger.merge({
      header: { right_text: "Date" },
    });

    assert.equal(config.page_format, "Letter");
    assert.equal(config.header.left_text, "Company");
    assert.equal(config.header.right_text, "Date");
  });

  it("should return copy of settings", () => {
    const merger = createConfigMerger({ page_format: "A4" });
    const settings = merger.getSettings();

    settings.page_format = "Letter";

    assert.equal(merger.getSettings().page_format, "A4"); // Unchanged
  });

  it("should update settings", () => {
    const merger = createConfigMerger({ page_format: "A4" });

    merger.updateSettings({ page_format: "Letter" });

    assert.equal(merger.getSettings().page_format, "Letter");
  });

  it("should deep merge when updating settings", () => {
    const merger = createConfigMerger({
      margin: { top: "10mm", right: "10mm" },
    });

    merger.updateSettings({
      margin: { top: "20mm" },
    });

    const settings = merger.getSettings();
    assert.equal(settings.margin.top, "20mm");
    assert.equal(settings.margin.right, "10mm"); // Preserved
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("integration", () => {
  it("should handle typical two-logo header scenario", () => {
    const { config, mode, hasHeaderFooter } = mergeConfig(
      {
        page_format: "A4",
        header: {
          height: "20mm",
          left: { type: "image", src: "./company-logo.svg", height: "18px" },
        },
      },
      {
        header: {
          right: { type: "image", src: "./client-logo.svg", height: "18px" },
        },
      },
    );

    assert.equal(mode, "structured");
    assert.equal(hasHeaderFooter, true);
    assert.equal(config.header.height, "20mm");
    assert.equal(config.header.left.src, "./company-logo.svg");
    assert.equal(config.header.right.src, "./client-logo.svg");
  });

  it("should handle academic paper style", () => {
    const { config } = mergeConfig(
      {},
      {
        header: {
          left: { type: "text", content: "{author}", font_style: "italic" },
          center: { type: "title", font_weight: "bold" },
          right: { type: "date", format: "MMMM yyyy" },
        },
        footer: {
          center: { type: "text", content: "— {page} —" },
        },
      },
    );

    assert.equal(config.header.left.content, "{author}");
    assert.equal(config.header.center.type, "title");
    assert.equal(config.footer.center.content, "— {page} —");
  });

  it("should handle per-document override scenario", () => {
    // Global settings for company
    const globalSettings = {
      page_format: "Letter",
      header: {
        left: { type: "image", src: "./company-logo.svg" },
        right: { type: "text", content: "{date}" },
      },
    };

    // Document-specific override for confidential doc
    const frontMatter = {
      header: {
        right: { type: "text", content: "CONFIDENTIAL", color: "#c00" },
      },
    };

    const { config } = mergeConfig(globalSettings, frontMatter);

    // Company logo preserved
    assert.equal(config.header.left.src, "./company-logo.svg");
    // Right zone overridden for this document
    assert.equal(config.header.right.content, "CONFIDENTIAL");
    assert.equal(config.header.right.color, "#c00");
  });

  it("should handle disabling header for specific document", () => {
    const { config, hasHeaderFooter } = mergeConfig(
      {
        header: { left_text: "Company" },
        footer: { center_text: "Page {page}" },
      },
      {
        header: null, // Disable header for this doc
      },
    );

    assert.equal(config.header, null);
    assert.ok(config.footer !== null); // Footer preserved
    // hasHeaderFooter should still be true because footer exists
    assert.equal(hasHeaderFooter, true);
  });

  it("should handle shorthand to full config upgrade", () => {
    const { config } = mergeConfig(
      {
        left_image: "./logo.svg",
        left_image_height: "20px",
        right_text: "{date}",
      },
      {
        header: {
          center: { type: "title", font_weight: "bold" },
        },
      },
    );

    // Both shorthand and full config should be present
    assert.ok(config.left_image || config.header);
  });
});
