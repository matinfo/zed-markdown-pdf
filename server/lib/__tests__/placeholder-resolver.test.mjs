/**
 * @fileoverview Unit tests for placeholder-resolver.mjs
 *
 * Run with: node --test server/lib/__tests__/placeholder-resolver.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parsePlaceholders,
  isBuiltinPlaceholder,
  isPlaywrightPlaceholder,
  formatDateTime,
  getDateFormatPresets,
  resolvePlaceholder,
  resolvePlaceholders,
  createRenderContext,
  createPlaceholderResolver,
  escapeHtml,
  listPlaceholders,
  validatePlaceholders,
} from "../placeholder-resolver.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const TEST_DATE = new Date(2025, 0, 15, 14, 30, 45); // Jan 15, 2025, 14:30:45

function createTestContext(overrides = {}) {
  return {
    title: "Test Document",
    author: "Jane Doe",
    filename: "document.md",
    inputPath: "/path/to/document.md",
    now: TEST_DATE,
    customVariables: {
      version: "1.0.0",
      client: "Acme Corp",
    },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// parsePlaceholders
// ─────────────────────────────────────────────────────────────────────────────

describe("parsePlaceholders", () => {
  it("should parse simple placeholder", () => {
    const result = parsePlaceholders("Hello {name}");

    assert.equal(result.length, 1);
    assert.equal(result[0].full, "{name}");
    assert.equal(result[0].name, "name");
    assert.equal(result[0].format, null);
    assert.equal(result[0].start, 6);
    assert.equal(result[0].end, 12);
  });

  it("should parse placeholder with format", () => {
    const result = parsePlaceholders("Date: {date:yyyy-MM-dd}");

    assert.equal(result.length, 1);
    assert.equal(result[0].full, "{date:yyyy-MM-dd}");
    assert.equal(result[0].name, "date");
    assert.equal(result[0].format, "yyyy-MM-dd");
  });

  it("should parse multiple placeholders", () => {
    const result = parsePlaceholders("Page {page} of {pages}");

    assert.equal(result.length, 2);
    assert.equal(result[0].name, "page");
    assert.equal(result[1].name, "pages");
  });

  it("should parse mixed placeholders", () => {
    const result = parsePlaceholders(
      "{title} - {date:MM/dd/yyyy} - Page {page}",
    );

    assert.equal(result.length, 3);
    assert.equal(result[0].name, "title");
    assert.equal(result[0].format, null);
    assert.equal(result[1].name, "date");
    assert.equal(result[1].format, "MM/dd/yyyy");
    assert.equal(result[2].name, "page");
  });

  it("should return empty array for no placeholders", () => {
    const result = parsePlaceholders("No placeholders here");
    assert.deepEqual(result, []);
  });

  it("should return empty array for non-string input", () => {
    assert.deepEqual(parsePlaceholders(null), []);
    assert.deepEqual(parsePlaceholders(undefined), []);
    assert.deepEqual(parsePlaceholders(123), []);
    assert.deepEqual(parsePlaceholders({}), []);
  });

  it("should handle adjacent placeholders", () => {
    const result = parsePlaceholders("{page}{pages}");

    assert.equal(result.length, 2);
    assert.equal(result[0].end, 6);
    assert.equal(result[1].start, 6);
  });

  it("should be case-insensitive for names", () => {
    const result = parsePlaceholders("{PAGE} {Date:yyyy}");

    assert.equal(result[0].name, "page");
    assert.equal(result[1].name, "date");
  });

  it("should preserve format case", () => {
    const result = parsePlaceholders("{date:MMMM}");

    assert.equal(result[0].format, "MMMM");
  });

  it("should handle complex format strings", () => {
    const result = parsePlaceholders("{date:EEEE, MMMM d, yyyy}");

    assert.equal(result[0].format, "EEEE, MMMM d, yyyy");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isBuiltinPlaceholder / isPlaywrightPlaceholder
// ─────────────────────────────────────────────────────────────────────────────

describe("isBuiltinPlaceholder", () => {
  it("should return true for built-in placeholders", () => {
    assert.equal(isBuiltinPlaceholder("page"), true);
    assert.equal(isBuiltinPlaceholder("pages"), true);
    assert.equal(isBuiltinPlaceholder("date"), true);
    assert.equal(isBuiltinPlaceholder("time"), true);
    assert.equal(isBuiltinPlaceholder("datetime"), true);
    assert.equal(isBuiltinPlaceholder("title"), true);
    assert.equal(isBuiltinPlaceholder("filename"), true);
    assert.equal(isBuiltinPlaceholder("author"), true);
  });

  it("should be case-insensitive", () => {
    assert.equal(isBuiltinPlaceholder("PAGE"), true);
    assert.equal(isBuiltinPlaceholder("Date"), true);
  });

  it("should return false for custom placeholders", () => {
    assert.equal(isBuiltinPlaceholder("version"), false);
    assert.equal(isBuiltinPlaceholder("client"), false);
    assert.equal(isBuiltinPlaceholder("custom"), false);
  });
});

describe("isPlaywrightPlaceholder", () => {
  it("should return true for Playwright placeholders", () => {
    assert.equal(isPlaywrightPlaceholder("page"), true);
    assert.equal(isPlaywrightPlaceholder("pages"), true);
  });

  it("should return false for other placeholders", () => {
    assert.equal(isPlaywrightPlaceholder("date"), false);
    assert.equal(isPlaywrightPlaceholder("title"), false);
    assert.equal(isPlaywrightPlaceholder("custom"), false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// formatDateTime
// ─────────────────────────────────────────────────────────────────────────────

describe("formatDateTime", () => {
  it("should format date with default format (ISO)", () => {
    const result = formatDateTime(TEST_DATE);
    assert.equal(result, "2025-01-15");
  });

  it("should format date with custom format", () => {
    assert.equal(formatDateTime(TEST_DATE, "MM/dd/yyyy"), "01/15/2025");
    assert.equal(formatDateTime(TEST_DATE, "dd/MM/yyyy"), "15/01/2025");
    assert.equal(formatDateTime(TEST_DATE, "dd.MM.yyyy"), "15.01.2025");
  });

  it("should format with long month names", () => {
    const result = formatDateTime(TEST_DATE, "MMMM d, yyyy");
    assert.equal(result, "January 15, 2025");
  });

  it("should format with short month names", () => {
    const result = formatDateTime(TEST_DATE, "MMM d, yyyy");
    assert.equal(result, "Jan 15, 2025");
  });

  it("should format time", () => {
    assert.equal(formatDateTime(TEST_DATE, "HH:mm:ss"), "14:30:45");
    assert.equal(formatDateTime(TEST_DATE, "h:mm a"), "2:30 PM");
  });

  it("should format date and time", () => {
    const result = formatDateTime(TEST_DATE, "yyyy-MM-dd HH:mm");
    assert.equal(result, "2025-01-15 14:30");
  });

  it("should format with day of week", () => {
    const result = formatDateTime(TEST_DATE, "EEEE");
    assert.equal(result, "Wednesday");
  });

  it("should handle invalid format gracefully", () => {
    // Invalid format should fallback to default
    const result = formatDateTime(TEST_DATE, "invalid{{{");
    // Should return something (either the invalid format attempt or fallback)
    assert.ok(typeof result === "string");
    assert.ok(result.length > 0);
  });
});

describe("getDateFormatPresets", () => {
  it("should return preset formats", () => {
    const presets = getDateFormatPresets();

    assert.ok("iso" in presets);
    assert.ok("us" in presets);
    assert.ok("eu" in presets);
    assert.ok("us-long" in presets);
    assert.ok("eu-dot" in presets);
  });

  it("should have valid format strings", () => {
    const presets = getDateFormatPresets();

    for (const [name, format] of Object.entries(presets)) {
      const result = formatDateTime(TEST_DATE, format);
      assert.ok(
        typeof result === "string",
        `Preset "${name}" should produce string`,
      );
      assert.ok(
        result.length > 0,
        `Preset "${name}" should produce non-empty string`,
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolvePlaceholder
// ─────────────────────────────────────────────────────────────────────────────

describe("resolvePlaceholder", () => {
  it("should resolve {page} to Playwright span", () => {
    const placeholder = { full: "{page}", name: "page", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, '<span class="pageNumber"></span>');
  });

  it("should resolve {pages} to Playwright span", () => {
    const placeholder = { full: "{pages}", name: "pages", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, '<span class="totalPages"></span>');
  });

  it("should resolve {date} with default format", () => {
    const placeholder = { full: "{date}", name: "date", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "2025-01-15");
  });

  it("should resolve {date:format} with custom format", () => {
    const placeholder = {
      full: "{date:MM/dd/yyyy}",
      name: "date",
      format: "MM/dd/yyyy",
    };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "01/15/2025");
  });

  it("should resolve {time}", () => {
    const placeholder = { full: "{time}", name: "time", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "14:30:45");
  });

  it("should resolve {datetime}", () => {
    const placeholder = { full: "{datetime}", name: "datetime", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "2025-01-15 14:30:45");
  });

  it("should resolve {title}", () => {
    const placeholder = { full: "{title}", name: "title", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "Test Document");
  });

  it("should resolve {filename}", () => {
    const placeholder = { full: "{filename}", name: "filename", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "document.md");
  });

  it("should resolve {author}", () => {
    const placeholder = { full: "{author}", name: "author", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "Jane Doe");
  });

  it("should resolve custom variables", () => {
    const placeholder = { full: "{version}", name: "version", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "1.0.0");
  });

  it("should return original for unknown placeholders", () => {
    const placeholder = { full: "{unknown}", name: "unknown", format: null };
    const result = resolvePlaceholder(placeholder, createTestContext());

    assert.equal(result, "{unknown}");
  });

  it("should escape HTML in resolved values", () => {
    const context = createTestContext({
      title: "<script>alert('xss')</script>",
    });
    const placeholder = { full: "{title}", name: "title", format: null };
    const result = resolvePlaceholder(placeholder, context);

    assert.ok(!result.includes("<script>"));
    assert.ok(result.includes("&lt;script&gt;"));
  });

  it("should handle empty values", () => {
    const context = createTestContext({ title: "", author: undefined });

    assert.equal(
      resolvePlaceholder(
        { full: "{title}", name: "title", format: null },
        context,
      ),
      "",
    );
    assert.equal(
      resolvePlaceholder(
        { full: "{author}", name: "author", format: null },
        context,
      ),
      "",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolvePlaceholders
// ─────────────────────────────────────────────────────────────────────────────

describe("resolvePlaceholders", () => {
  it("should resolve all placeholders in text", () => {
    const context = createTestContext();
    const result = resolvePlaceholders("Page {page} of {pages}", context);

    assert.equal(
      result,
      'Page <span class="pageNumber"></span> of <span class="totalPages"></span>',
    );
  });

  it("should resolve mixed placeholder types", () => {
    const context = createTestContext();
    const result = resolvePlaceholders(
      "{title} - {date} - Page {page}",
      context,
    );

    assert.ok(result.includes("Test Document"));
    assert.ok(result.includes("2025-01-15"));
    assert.ok(result.includes("pageNumber"));
  });

  it("should return original text if no placeholders", () => {
    const result = resolvePlaceholders("No placeholders", createTestContext());
    assert.equal(result, "No placeholders");
  });

  it("should return empty string for non-string input", () => {
    assert.equal(resolvePlaceholders(null, createTestContext()), "");
    assert.equal(resolvePlaceholders(undefined, createTestContext()), "");
    assert.equal(resolvePlaceholders(123, createTestContext()), "");
  });

  it("should handle multiple occurrences of same placeholder", () => {
    const result = resolvePlaceholders(
      "{page}/{pages} - {page}/{pages}",
      createTestContext(),
    );

    const pageSpanCount = (result.match(/pageNumber/g) || []).length;
    const pagesSpanCount = (result.match(/totalPages/g) || []).length;

    assert.equal(pageSpanCount, 2);
    assert.equal(pagesSpanCount, 2);
  });

  it("should preserve text between placeholders", () => {
    const result = resolvePlaceholders(
      "Start {page} middle {pages} end",
      createTestContext(),
    );

    assert.ok(result.startsWith("Start "));
    assert.ok(result.includes(" middle "));
    assert.ok(result.endsWith(" end"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createRenderContext
// ─────────────────────────────────────────────────────────────────────────────

describe("createRenderContext", () => {
  it("should create context with basic properties", () => {
    const context = createRenderContext({
      inputPath: "/path/to/doc.md",
      title: "My Doc",
      author: "Author",
    });

    assert.equal(context.title, "My Doc");
    assert.equal(context.author, "Author");
    assert.equal(context.filename, "doc.md");
    assert.equal(context.inputPath, "/path/to/doc.md");
    assert.ok(context.now instanceof Date);
  });

  it("should extract filename from input path", () => {
    const context = createRenderContext({
      inputPath: "/some/long/path/to/document.md",
    });

    assert.equal(context.filename, "document.md");
  });

  it("should handle Windows-style paths", () => {
    const context = createRenderContext({
      inputPath: "C:\\Users\\name\\docs\\file.md",
    });

    assert.equal(context.filename, "file.md");
  });

  it("should use provided date", () => {
    const now = new Date(2024, 5, 15);
    const context = createRenderContext({
      inputPath: "/path/doc.md",
      now,
    });

    assert.equal(context.now, now);
  });

  it("should extract custom variables from front matter", () => {
    const context = createRenderContext({
      inputPath: "/path/doc.md",
      frontMatter: {
        title: "Title",
        author: "Author",
        version: "2.0.0",
        client: "Client Name",
        status: "Draft",
      },
    });

    assert.equal(context.customVariables.version, "2.0.0");
    assert.equal(context.customVariables.client, "Client Name");
    assert.equal(context.customVariables.status, "Draft");
  });

  it("should not include known fields in custom variables", () => {
    const context = createRenderContext({
      inputPath: "/path/doc.md",
      frontMatter: {
        title: "Title",
        author: "Author",
        date: "2025-01-15",
        pdf: { header: {} },
        custom: "value",
      },
    });

    assert.ok(!("title" in context.customVariables));
    assert.ok(!("author" in context.customVariables));
    assert.ok(!("date" in context.customVariables));
    assert.ok(!("pdf" in context.customVariables));
    assert.ok("custom" in context.customVariables);
  });

  it("should handle empty front matter", () => {
    const context = createRenderContext({
      inputPath: "/path/doc.md",
      frontMatter: {},
    });

    assert.deepEqual(context.customVariables, {});
  });

  it("should handle missing inputPath", () => {
    const context = createRenderContext({});

    assert.equal(context.filename, "");
    assert.equal(context.inputPath, undefined);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createPlaceholderResolver
// ─────────────────────────────────────────────────────────────────────────────

describe("createPlaceholderResolver", () => {
  it("should create resolver with resolve method", () => {
    const resolver = createPlaceholderResolver(createTestContext());

    assert.equal(typeof resolver.resolve, "function");
    assert.equal(typeof resolver.parse, "function");
    assert.equal(typeof resolver.getContext, "function");
    assert.equal(typeof resolver.updateContext, "function");
  });

  it("should resolve placeholders using bound context", () => {
    const resolver = createPlaceholderResolver(createTestContext());
    const result = resolver.resolve("Title: {title}");

    assert.equal(result, "Title: Test Document");
  });

  it("should parse without resolving", () => {
    const resolver = createPlaceholderResolver(createTestContext());
    const parsed = resolver.parse("{page} of {pages}");

    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].name, "page");
    assert.equal(parsed[1].name, "pages");
  });

  it("should return a copy of context", () => {
    const originalContext = createTestContext();
    const resolver = createPlaceholderResolver(originalContext);
    const context = resolver.getContext();

    // Modifying returned context shouldn't affect resolver
    context.title = "Modified";

    assert.equal(resolver.getContext().title, "Test Document");
  });

  it("should update context", () => {
    const resolver = createPlaceholderResolver(createTestContext());

    resolver.updateContext({ title: "New Title" });

    const result = resolver.resolve("{title}");
    assert.equal(result, "New Title");
  });

  it("should preserve other context values when updating", () => {
    const resolver = createPlaceholderResolver(createTestContext());

    resolver.updateContext({ title: "New Title" });

    // Author should still be from original context
    assert.equal(resolver.resolve("{author}"), "Jane Doe");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// escapeHtml
// ─────────────────────────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("should escape < and >", () => {
    assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
  });

  it("should escape &", () => {
    assert.equal(escapeHtml("a & b"), "a &amp; b");
  });

  it("should escape quotes", () => {
    assert.equal(escapeHtml('"quoted"'), "&quot;quoted&quot;");
    assert.equal(escapeHtml("'single'"), "&#39;single&#39;");
  });

  it("should handle empty string", () => {
    assert.equal(escapeHtml(""), "");
  });

  it("should handle non-string input", () => {
    assert.equal(escapeHtml(null), "");
    assert.equal(escapeHtml(undefined), "");
    assert.equal(escapeHtml(123), "");
  });

  it("should not double-escape", () => {
    assert.equal(escapeHtml("&amp;"), "&amp;amp;");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// listPlaceholders
// ─────────────────────────────────────────────────────────────────────────────

describe("listPlaceholders", () => {
  it("should categorize placeholders", () => {
    const result = listPlaceholders("{page} {date} {custom}");

    assert.deepEqual(result.playwright, ["page"]);
    assert.deepEqual(result.builtin, ["date"]);
    assert.deepEqual(result.custom, ["custom"]);
  });

  it("should deduplicate placeholder names", () => {
    const result = listPlaceholders("{page} {page} {date} {date}");

    assert.equal(result.playwright.length, 1);
    assert.equal(result.builtin.length, 1);
  });

  it("should handle text with no placeholders", () => {
    const result = listPlaceholders("No placeholders");

    assert.deepEqual(result.builtin, []);
    assert.deepEqual(result.custom, []);
    assert.deepEqual(result.playwright, []);
  });

  it("should identify all playwright placeholders", () => {
    const result = listPlaceholders("{page} {pages}");

    assert.deepEqual(result.playwright.sort(), ["page", "pages"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validatePlaceholders
// ─────────────────────────────────────────────────────────────────────────────

describe("validatePlaceholders", () => {
  it("should return valid for text with no custom placeholders", () => {
    const result = validatePlaceholders("{page} {date}", createTestContext());

    assert.equal(result.valid, true);
    assert.deepEqual(result.missing, []);
  });

  it("should return valid when all custom placeholders have values", () => {
    const result = validatePlaceholders(
      "{version} {client}",
      createTestContext(),
    );

    assert.equal(result.valid, true);
    assert.deepEqual(result.missing, []);
  });

  it("should return invalid when custom placeholders are missing", () => {
    const result = validatePlaceholders(
      "{unknown} {missing}",
      createTestContext(),
    );

    assert.equal(result.valid, false);
    assert.ok(result.missing.includes("unknown"));
    assert.ok(result.missing.includes("missing"));
  });

  it("should identify specific missing placeholders", () => {
    const result = validatePlaceholders(
      "{version} {notdefined}",
      createTestContext(),
    );

    assert.equal(result.valid, false);
    assert.deepEqual(result.missing, ["notdefined"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests
// ─────────────────────────────────────────────────────────────────────────────

describe("integration", () => {
  it("should handle a typical header template", () => {
    const context = createTestContext();
    const template = "{title} — Page {page} of {pages} — {date:MMMM yyyy}";

    const result = resolvePlaceholders(template, context);

    assert.ok(result.includes("Test Document"));
    assert.ok(result.includes("pageNumber"));
    assert.ok(result.includes("totalPages"));
    assert.ok(result.includes("January 2025"));
  });

  it("should handle a typical footer template", () => {
    const context = createTestContext();
    const template = "© 2025 {author} | {filename} | Page {page}";

    const result = resolvePlaceholders(template, context);

    assert.ok(result.includes("Jane Doe"));
    assert.ok(result.includes("document.md"));
    assert.ok(result.includes("pageNumber"));
  });

  it("should handle front matter custom variables", () => {
    const context = createRenderContext({
      inputPath: "/path/to/proposal.md",
      title: "Project Proposal",
      frontMatter: {
        title: "Project Proposal",
        client: "Acme Corporation",
        project: "Website Redesign",
        status: "DRAFT",
      },
    });

    const template = "{title} — {client} — {project} — {status}";
    const result = resolvePlaceholders(template, context);

    assert.ok(result.includes("Project Proposal"));
    assert.ok(result.includes("Acme Corporation"));
    assert.ok(result.includes("Website Redesign"));
    assert.ok(result.includes("DRAFT"));
  });

  it("should handle EU date format", () => {
    const context = createTestContext();
    const result = resolvePlaceholders("{date:dd.MM.yyyy}", context);

    assert.equal(result, "15.01.2025");
  });

  it("should handle US date format", () => {
    const context = createTestContext();
    const result = resolvePlaceholders("{date:MM/dd/yyyy}", context);

    assert.equal(result, "01/15/2025");
  });

  it("should handle complex date formats", () => {
    const context = createTestContext();

    assert.equal(
      resolvePlaceholders("{date:EEEE, MMMM d, yyyy}", context),
      "Wednesday, January 15, 2025",
    );
  });
});
