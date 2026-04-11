/**
 * @fileoverview Unit tests for asset-resolver.mjs
 *
 * Run with: node --test server/lib/__tests__/asset-resolver.test.mjs
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  resolveImagePath,
  getMimeType,
  isSupportedImage,
  resolveAsset,
  createAssetResolver,
  isDataUri,
  getMimeTypeFromDataUri,
  isValidImageDataUri,
  estimateDataUriSize,
} from "../asset-resolver.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

let tempDir;
let testSvgPath;
let testPngPath;
let testJpgPath;
let largeSvgPath;

/**
 * Create a minimal valid SVG for testing.
 */
function createTestSvg(content = "Test") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="10" y="50">${content}</text></svg>`;
}

/**
 * Create a minimal valid PNG (1x1 transparent pixel).
 */
function createTestPng() {
  // Minimal 1x1 transparent PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
}

/**
 * Create a minimal valid JPEG (1x1 red pixel).
 */
function createTestJpg() {
  // Minimal 1x1 JPEG
  return Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEAwEPwAB//9k=",
    "base64"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup and Teardown
// ─────────────────────────────────────────────────────────────────────────────

async function setupTestFixtures() {
  // Create temp directory
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "asset-resolver-test-"));

  // Create test files
  testSvgPath = path.join(tempDir, "test.svg");
  await fs.writeFile(testSvgPath, createTestSvg());

  testPngPath = path.join(tempDir, "test.png");
  await fs.writeFile(testPngPath, createTestPng());

  testJpgPath = path.join(tempDir, "test.jpg");
  await fs.writeFile(testJpgPath, createTestJpg());

  // Create a large SVG for size warning tests
  largeSvgPath = path.join(tempDir, "large.svg");
  const largeSvg = createTestSvg("x".repeat(10000)); // ~10KB
  await fs.writeFile(largeSvgPath, largeSvg);
}

async function cleanupTestFixtures() {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveImagePath
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveImagePath", () => {
  it("should resolve relative path from base file", () => {
    const result = resolveImagePath("./images/logo.svg", "/home/user/docs/README.md");
    assert.equal(result, "/home/user/docs/images/logo.svg");
  });

  it("should resolve relative path without leading ./", () => {
    const result = resolveImagePath("images/logo.svg", "/home/user/docs/README.md");
    assert.equal(result, "/home/user/docs/images/logo.svg");
  });

  it("should resolve parent directory references", () => {
    const result = resolveImagePath("../assets/logo.svg", "/home/user/docs/README.md");
    assert.equal(result, "/home/user/assets/logo.svg");
  });

  it("should return absolute path unchanged", () => {
    const absolutePath = "/absolute/path/to/logo.svg";
    const result = resolveImagePath(absolutePath, "/home/user/docs/README.md");
    assert.equal(result, absolutePath);
  });

  it("should handle base path that is a directory", () => {
    const result = resolveImagePath("./logo.svg", "/home/user/docs/");
    // path.dirname of /home/user/docs/ is /home/user/docs
    assert.ok(result.endsWith("logo.svg"));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getMimeType
// ─────────────────────────────────────────────────────────────────────────────

describe("getMimeType", () => {
  it("should return correct MIME type for SVG", () => {
    assert.equal(getMimeType("logo.svg"), "image/svg+xml");
    assert.equal(getMimeType("LOGO.SVG"), "image/svg+xml");
    assert.equal(getMimeType("/path/to/logo.svg"), "image/svg+xml");
  });

  it("should return correct MIME type for PNG", () => {
    assert.equal(getMimeType("image.png"), "image/png");
    assert.equal(getMimeType("IMAGE.PNG"), "image/png");
  });

  it("should return correct MIME type for JPG/JPEG", () => {
    assert.equal(getMimeType("photo.jpg"), "image/jpeg");
    assert.equal(getMimeType("photo.jpeg"), "image/jpeg");
    assert.equal(getMimeType("PHOTO.JPG"), "image/jpeg");
  });

  it("should return null for unsupported formats", () => {
    assert.equal(getMimeType("image.gif"), null);
    assert.equal(getMimeType("image.webp"), null);
    assert.equal(getMimeType("image.bmp"), null);
    assert.equal(getMimeType("document.pdf"), null);
  });

  it("should return null for files without extension", () => {
    assert.equal(getMimeType("noextension"), null);
    assert.equal(getMimeType("/path/to/file"), null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isSupportedImage
// ─────────────────────────────────────────────────────────────────────────────

describe("isSupportedImage", () => {
  it("should return true for supported formats", () => {
    assert.equal(isSupportedImage("logo.svg"), true);
    assert.equal(isSupportedImage("image.png"), true);
    assert.equal(isSupportedImage("photo.jpg"), true);
    assert.equal(isSupportedImage("photo.jpeg"), true);
  });

  it("should return false for unsupported formats", () => {
    assert.equal(isSupportedImage("image.gif"), false);
    assert.equal(isSupportedImage("image.webp"), false);
    assert.equal(isSupportedImage("document.txt"), false);
  });

  it("should be case-insensitive", () => {
    assert.equal(isSupportedImage("LOGO.SVG"), true);
    assert.equal(isSupportedImage("Image.PNG"), true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveAsset
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveAsset", () => {
  beforeEach(async () => {
    await setupTestFixtures();
  });

  afterEach(async () => {
    await cleanupTestFixtures();
  });

  it("should resolve SVG file to data URI", async () => {
    const result = await resolveAsset(testSvgPath);

    assert.ok(result.dataUri.startsWith("data:image/svg+xml;base64,"));
    assert.equal(result.mimeType, "image/svg+xml");
    assert.ok(result.size > 0);
    assert.equal(result.oversized, false);
  });

  it("should resolve PNG file to data URI", async () => {
    const result = await resolveAsset(testPngPath);

    assert.ok(result.dataUri.startsWith("data:image/png;base64,"));
    assert.equal(result.mimeType, "image/png");
    assert.ok(result.size > 0);
  });

  it("should resolve JPG file to data URI", async () => {
    const result = await resolveAsset(testJpgPath);

    assert.ok(result.dataUri.startsWith("data:image/jpeg;base64,"));
    assert.equal(result.mimeType, "image/jpeg");
  });

  it("should throw error for non-existent file", async () => {
    await assert.rejects(
      async () => resolveAsset("/nonexistent/path/image.svg"),
      /not found/i
    );
  });

  it("should throw error for unsupported format", async () => {
    const unsupportedPath = path.join(tempDir, "test.gif");
    await fs.writeFile(unsupportedPath, "GIF89a");

    await assert.rejects(
      async () => resolveAsset(unsupportedPath),
      /Unsupported image format/
    );
  });

  it("should mark oversized files", async () => {
    // Use a very low threshold to trigger warning
    const result = await resolveAsset(largeSvgPath, 100);

    assert.equal(result.oversized, true);
  });

  it("should not mark small files as oversized", async () => {
    const result = await resolveAsset(testSvgPath, 1024 * 1024); // 1MB threshold

    assert.equal(result.oversized, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createAssetResolver
// ─────────────────────────────────────────────────────────────────────────────

describe("createAssetResolver", () => {
  beforeEach(async () => {
    await setupTestFixtures();
  });

  afterEach(async () => {
    await cleanupTestFixtures();
  });

  it("should create a resolver with resolve method", () => {
    const resolver = createAssetResolver({ basePath: tempDir });

    assert.equal(typeof resolver.resolve, "function");
    assert.equal(typeof resolver.resolveWithMeta, "function");
    assert.equal(typeof resolver.getWarnings, "function");
    assert.equal(typeof resolver.clearCache, "function");
    assert.equal(typeof resolver.getStats, "function");
  });

  it("should resolve relative paths from basePath", async () => {
    const mdPath = path.join(tempDir, "document.md");
    const resolver = createAssetResolver({ basePath: mdPath });

    const dataUri = await resolver.resolve("./test.svg");

    assert.ok(dataUri.startsWith("data:image/svg+xml;base64,"));
  });

  it("should cache resolved assets", async () => {
    const mdPath = path.join(tempDir, "document.md");
    const resolver = createAssetResolver({ basePath: mdPath });

    // Resolve the same asset twice
    await resolver.resolve("./test.svg");
    await resolver.resolve("./test.svg");

    const stats = resolver.getStats();
    assert.equal(stats.resolved, 2); // Called twice
    assert.equal(stats.cached, 1); // Only one unique asset
  });

  it("should collect warnings for large files", async () => {
    const mdPath = path.join(tempDir, "document.md");
    const resolver = createAssetResolver({
      basePath: mdPath,
      warningThreshold: 100, // Very low threshold
    });

    await resolver.resolve("./large.svg");

    const warnings = resolver.getWarnings();
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Large image/);
  });

  it("should call onWarning callback for large files", async () => {
    const mdPath = path.join(tempDir, "document.md");
    let warningCalled = false;
    let warningPath = "";

    const resolver = createAssetResolver({
      basePath: mdPath,
      warningThreshold: 100,
      onWarning: (message, filePath) => {
        warningCalled = true;
        warningPath = filePath;
      },
    });

    await resolver.resolve("./large.svg");

    assert.equal(warningCalled, true);
    assert.ok(warningPath.endsWith("large.svg"));
  });

  it("should clear cache", async () => {
    const mdPath = path.join(tempDir, "document.md");
    const resolver = createAssetResolver({ basePath: mdPath });

    await resolver.resolve("./test.svg");
    assert.equal(resolver.getStats().cached, 1);

    resolver.clearCache();
    assert.equal(resolver.getStats().cached, 0);
  });

  it("should return asset metadata with resolveWithMeta", async () => {
    const mdPath = path.join(tempDir, "document.md");
    const resolver = createAssetResolver({ basePath: mdPath });

    const asset = await resolver.resolveWithMeta("./test.png");

    assert.ok(asset.dataUri);
    assert.equal(asset.mimeType, "image/png");
    assert.ok(typeof asset.size === "number");
    assert.ok(typeof asset.oversized === "boolean");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isDataUri
// ─────────────────────────────────────────────────────────────────────────────

describe("isDataUri", () => {
  it("should return true for valid data URIs", () => {
    assert.equal(isDataUri("data:image/png;base64,iVBORw0KGgo="), true);
    assert.equal(isDataUri("data:image/svg+xml;base64,PHN2Zz4="), true);
    assert.equal(isDataUri("data:text/plain,hello"), true);
  });

  it("should return false for non-data URIs", () => {
    assert.equal(isDataUri("http://example.com/image.png"), false);
    assert.equal(isDataUri("./image.png"), false);
    assert.equal(isDataUri("/path/to/image.png"), false);
    assert.equal(isDataUri("image.png"), false);
  });

  it("should return false for non-strings", () => {
    assert.equal(isDataUri(null), false);
    assert.equal(isDataUri(undefined), false);
    assert.equal(isDataUri(123), false);
    assert.equal(isDataUri({}), false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getMimeTypeFromDataUri
// ─────────────────────────────────────────────────────────────────────────────

describe("getMimeTypeFromDataUri", () => {
  it("should extract MIME type from data URI", () => {
    assert.equal(
      getMimeTypeFromDataUri("data:image/png;base64,iVBORw0KGgo="),
      "image/png"
    );
    assert.equal(
      getMimeTypeFromDataUri("data:image/svg+xml;base64,PHN2Zz4="),
      "image/svg+xml"
    );
    assert.equal(
      getMimeTypeFromDataUri("data:image/jpeg;base64,/9j/4AAQ"),
      "image/jpeg"
    );
  });

  it("should return null for invalid data URIs", () => {
    assert.equal(getMimeTypeFromDataUri("not a data uri"), null);
    assert.equal(getMimeTypeFromDataUri("data:"), null);
  });

  it("should return null for non-strings", () => {
    assert.equal(getMimeTypeFromDataUri(null), null);
    assert.equal(getMimeTypeFromDataUri(123), null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isValidImageDataUri
// ─────────────────────────────────────────────────────────────────────────────

describe("isValidImageDataUri", () => {
  it("should return true for supported image data URIs", () => {
    assert.equal(
      isValidImageDataUri("data:image/png;base64,iVBORw0KGgo="),
      true
    );
    assert.equal(
      isValidImageDataUri("data:image/svg+xml;base64,PHN2Zz4="),
      true
    );
    assert.equal(
      isValidImageDataUri("data:image/jpeg;base64,/9j/4AAQ"),
      true
    );
  });

  it("should return false for unsupported image formats", () => {
    assert.equal(
      isValidImageDataUri("data:image/gif;base64,R0lGODlh"),
      false
    );
    assert.equal(
      isValidImageDataUri("data:image/webp;base64,UklGRg=="),
      false
    );
  });

  it("should return false for non-image data URIs", () => {
    assert.equal(
      isValidImageDataUri("data:text/plain,hello"),
      false
    );
    assert.equal(
      isValidImageDataUri("data:application/json,{}"),
      false
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// estimateDataUriSize
// ─────────────────────────────────────────────────────────────────────────────

describe("estimateDataUriSize", () => {
  it("should estimate size of base64 encoded data", () => {
    // "Hello" = 5 bytes, base64 encoded = "SGVsbG8="
    const dataUri = "data:text/plain;base64,SGVsbG8=";
    const estimated = estimateDataUriSize(dataUri);

    // Base64 of 5 bytes should decode back to ~5 bytes
    assert.ok(estimated >= 4 && estimated <= 6);
  });

  it("should return 0 for non-data URIs", () => {
    assert.equal(estimateDataUriSize("not a data uri"), 0);
    assert.equal(estimateDataUriSize("./image.png"), 0);
  });

  it("should return 0 for invalid data URIs", () => {
    assert.equal(estimateDataUriSize("data:no-comma"), 0);
  });

  it("should handle padding correctly", () => {
    // "Hi" = 2 bytes, base64 = "SGk=" (with padding)
    const withPadding = "data:text/plain;base64,SGk=";
    const estimated = estimateDataUriSize(withPadding);

    assert.ok(estimated >= 1 && estimated <= 3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests
// ─────────────────────────────────────────────────────────────────────────────

describe("integration", () => {
  beforeEach(async () => {
    await setupTestFixtures();
  });

  afterEach(async () => {
    await cleanupTestFixtures();
  });

  it("should handle a typical export workflow", async () => {
    // Simulate a document with multiple images
    const mdPath = path.join(tempDir, "document.md");
    const resolver = createAssetResolver({
      basePath: mdPath,
      warningThreshold: 100,
    });

    // Resolve multiple images
    const svg = await resolver.resolve("./test.svg");
    const png = await resolver.resolve("./test.png");
    const large = await resolver.resolve("./large.svg");

    // All should be valid data URIs
    assert.ok(isDataUri(svg));
    assert.ok(isDataUri(png));
    assert.ok(isDataUri(large));

    // Should have one warning for large file
    const warnings = resolver.getWarnings();
    assert.equal(warnings.length, 1);

    // Stats should reflect usage
    const stats = resolver.getStats();
    assert.equal(stats.resolved, 3);
    assert.equal(stats.cached, 3);
  });

  it("should produce valid base64 that can be decoded", async () => {
    const mdPath = path.join(tempDir, "document.md");
    const resolver = createAssetResolver({ basePath: mdPath });

    const dataUri = await resolver.resolve("./test.svg");

    // Extract base64 content
    const base64 = dataUri.split(",")[1];

    // Should be valid base64
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    assert.ok(decoded.includes("<svg"));
  });
});
