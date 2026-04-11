/**
 * @fileoverview Asset resolver for converting image paths to base64 data URIs.
 *
 * This module handles:
 * - Resolving relative paths from the Markdown file location
 * - Resolving paths from a global assets directory (@/ prefix)
 * - Expanding tilde (~) to user home directory (cross-platform)
 * - Reading image files (SVG, PNG, JPG)
 * - Converting to base64 data URIs
 * - Warning on large images (configurable threshold)
 * - Caching resolved assets during a single export
 *
 * @module asset-resolver
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { IMAGE_FORMATS, IMAGE_SIZE_WARNING_THRESHOLD } from "./types.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Asset Cache
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple in-memory cache for resolved assets.
 * Cleared between exports via createAssetResolver().
 */
class AssetCache {
  constructor() {
    /** @type {Map<string, import('./types.mjs').ResolvedAsset>} */
    this.cache = new Map();
  }

  /**
   * Get a cached asset.
   * @param {string} key - Cache key (absolute path)
   * @returns {import('./types.mjs').ResolvedAsset | undefined}
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Store an asset in cache.
   * @param {string} key - Cache key (absolute path)
   * @param {import('./types.mjs').ResolvedAsset} asset - Resolved asset
   */
  set(key, asset) {
    this.cache.set(key, asset);
  }

  /**
   * Check if an asset is cached.
   * @param {string} key - Cache key (absolute path)
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear the cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics.
   * @returns {{hits: number, misses: number, size: number}}
   */
  get stats() {
    return {
      size: this.cache.size,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Path Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expand tilde (~) to the user's home directory.
 * Works cross-platform (Unix/macOS and Windows).
 *
 * @param {string} filePath - Path that may start with ~
 * @returns {string} Path with ~ expanded to home directory
 *
 * @example
 * // On Unix/macOS with HOME=/Users/john
 * expandTilde("~/docs/logo.svg") // => "/Users/john/docs/logo.svg"
 *
 * // On Windows with USERPROFILE=C:\Users\john
 * expandTilde("~/docs/logo.svg") // => "C:\Users\john\docs\logo.svg"
 */
export function expandTilde(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return filePath;
  }

  // Check for tilde at start (~ or ~/ or ~\)
  if (
    filePath === "~" ||
    filePath.startsWith("~/") ||
    filePath.startsWith("~\\")
  ) {
    const homeDir = os.homedir();
    if (filePath === "~") {
      return homeDir;
    }
    // Replace ~ with home directory, preserving the path separator
    return path.join(homeDir, filePath.slice(2));
  }

  return filePath;
}

/**
 * Resolve an image path relative to a base path, with support for:
 * - Tilde expansion (~) for home directory
 * - Global assets directory (@/ prefix)
 * - Relative paths from base file
 * - Absolute paths
 *
 * @param {string} imagePath - Image path (relative, absolute, ~, or @/)
 * @param {string} basePath - Base path (typically the Markdown file path)
 * @param {string} [assetsDirectory] - Optional global assets directory for @/ paths
 * @returns {string} Absolute path to the image
 *
 * @example
 * // Relative path
 * resolveImagePath("./logo.svg", "/home/user/doc.md")
 * // => "/home/user/logo.svg"
 *
 * // Tilde expansion
 * resolveImagePath("~/assets/logo.svg", "/home/user/doc.md")
 * // => "/home/user/assets/logo.svg" (if home is /home/user)
 *
 * // Global assets with @/ prefix
 * resolveImagePath("@/logo.svg", "/home/user/doc.md", "~/.config/markdown-pdf/assets")
 * // => "/home/user/.config/markdown-pdf/assets/logo.svg"
 */
export function resolveImagePath(imagePath, basePath, assetsDirectory = null) {
  // Handle @/ prefix for global assets directory
  if (imagePath.startsWith("@/") || imagePath.startsWith("@\\")) {
    if (!assetsDirectory) {
      throw new Error(
        `Cannot resolve "${imagePath}": No assets_directory configured. ` +
          `Set "assets_directory" in your settings to use @/ paths.`,
      );
    }
    // Expand tilde in assets directory if present
    const expandedAssetsDir = expandTilde(assetsDirectory);
    const relativePath = imagePath.slice(2); // Remove @/ or @\
    return path.resolve(expandedAssetsDir, relativePath);
  }

  // Expand tilde if present
  const expandedPath = expandTilde(imagePath);

  // If already absolute (or was made absolute by tilde expansion), return as-is
  if (path.isAbsolute(expandedPath)) {
    return expandedPath;
  }

  // Get the directory of the base file
  const baseDir = path.dirname(basePath);

  // Resolve relative to base directory
  return path.resolve(baseDir, expandedPath);
}

/**
 * Get the MIME type for an image file based on extension.
 *
 * @param {string} filePath - Path to the image file
 * @returns {string | null} MIME type or null if unsupported
 */
export function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_FORMATS[ext] || null;
}

/**
 * Check if a file path has a supported image extension.
 *
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
export function isSupportedImage(filePath) {
  return getMimeType(filePath) !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read and encode an image file as a base64 data URI.
 *
 * @param {string} absolutePath - Absolute path to the image file
 * @param {number} [warningThreshold=IMAGE_SIZE_WARNING_THRESHOLD] - Size threshold for warnings
 * @returns {Promise<import('./types.mjs').ResolvedAsset>}
 * @throws {Error} If file cannot be read or format is unsupported
 */
export async function resolveAsset(
  absolutePath,
  warningThreshold = IMAGE_SIZE_WARNING_THRESHOLD,
) {
  // Check if file exists
  try {
    await fs.access(absolutePath);
  } catch {
    throw new Error(`Image file not found: ${absolutePath}`);
  }

  // Get MIME type
  const mimeType = getMimeType(absolutePath);
  if (!mimeType) {
    const ext = path.extname(absolutePath) || "(no extension)";
    throw new Error(
      `Unsupported image format: ${ext}. Supported formats: ${Object.keys(IMAGE_FORMATS).join(", ")}`,
    );
  }

  // Read file
  const buffer = await fs.readFile(absolutePath);
  const size = buffer.length;
  const oversized = size > warningThreshold;

  // For SVG files, we can use the raw content with proper encoding
  // For binary formats (PNG, JPG), we use base64
  let dataUri;

  if (mimeType === "image/svg+xml") {
    // SVG: Use UTF-8 encoding with URL-safe base64 or direct embedding
    // Base64 is safer for complex SVGs with special characters
    const base64 = buffer.toString("base64");
    dataUri = `data:${mimeType};base64,${base64}`;
  } else {
    // Binary formats: Use base64
    const base64 = buffer.toString("base64");
    dataUri = `data:${mimeType};base64,${base64}`;
  }

  return {
    dataUri,
    mimeType,
    size,
    oversized,
  };
}

/**
 * Resolve an image path to a data URI, with caching.
 *
 * @param {string} imagePath - Image path (relative or absolute)
 * @param {string} basePath - Base path for resolving relative paths
 * @param {AssetCache} cache - Asset cache instance
 * @param {number} [warningThreshold] - Size threshold for warnings
 * @param {string} [assetsDirectory] - Optional global assets directory for @/ paths
 * @returns {Promise<{asset: import('./types.mjs').ResolvedAsset, absolutePath: string}>}
 */
async function resolveWithCache(
  imagePath,
  basePath,
  cache,
  warningThreshold,
  assetsDirectory,
) {
  const absolutePath = resolveImagePath(imagePath, basePath, assetsDirectory);

  // Check cache
  if (cache.has(absolutePath)) {
    return {
      asset: cache.get(absolutePath),
      absolutePath,
    };
  }

  // Resolve and cache
  const asset = await resolveAsset(absolutePath, warningThreshold);
  cache.set(absolutePath, asset);

  return { asset, absolutePath };
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Resolver Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} AssetResolverOptions
 * @property {string} basePath - Base path for resolving relative paths (typically the Markdown file)
 * @property {string} [assetsDirectory] - Global assets directory for @/ paths (supports ~ expansion)
 * @property {number} [warningThreshold=IMAGE_SIZE_WARNING_THRESHOLD] - Size threshold for warnings (bytes)
 * @property {(message: string, path: string, size: number) => void} [onWarning] - Warning callback
 */

/**
 * @typedef {Object} AssetResolver
 * @property {(imagePath: string) => Promise<string>} resolve - Resolve image path to data URI
 * @property {(imagePath: string) => Promise<import('./types.mjs').ResolvedAsset>} resolveWithMeta - Resolve with metadata
 * @property {() => string[]} getWarnings - Get all warnings generated during resolution
 * @property {() => void} clearCache - Clear the asset cache
 * @property {() => {resolved: number, warnings: string[]}} getStats - Get resolution statistics
 */

/**
 * Create an asset resolver instance for a single export operation.
 *
 * The resolver caches resolved assets and collects warnings for large files.
 * Create a new resolver for each export to ensure a clean cache.
 *
 * @param {AssetResolverOptions} options - Resolver options
 * @returns {AssetResolver}
 *
 * @example
 * const resolver = createAssetResolver({
 *   basePath: '/path/to/document.md',
 *   warningThreshold: 500 * 1024, // 500KB
 * });
 *
 * const dataUri = await resolver.resolve('./images/logo.svg');
 */
export function createAssetResolver(options) {
  const {
    basePath,
    assetsDirectory = null,
    warningThreshold = IMAGE_SIZE_WARNING_THRESHOLD,
    onWarning,
  } = options;

  const cache = new AssetCache();
  const warnings = [];
  let resolvedCount = 0;

  // Expand tilde in assetsDirectory once at creation time
  const expandedAssetsDirectory = assetsDirectory
    ? expandTilde(assetsDirectory)
    : null;

  /**
   * Format file size for display.
   * @param {number} bytes
   * @returns {string}
   */
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Resolve an image path to a data URI string.
   *
   * @param {string} imagePath - Image path (relative or absolute)
   * @returns {Promise<string>} Base64 data URI
   */
  async function resolve(imagePath) {
    const result = await resolveWithMeta(imagePath);
    return result.dataUri;
  }

  /**
   * Resolve an image path with full metadata.
   *
   * @param {string} imagePath - Image path (relative or absolute)
   * @returns {Promise<import('./types.mjs').ResolvedAsset>}
   */
  async function resolveWithMeta(imagePath) {
    const { asset, absolutePath } = await resolveWithCache(
      imagePath,
      basePath,
      cache,
      warningThreshold,
      expandedAssetsDirectory,
    );

    resolvedCount++;

    // Generate warning for oversized assets
    if (asset.oversized) {
      const warningMessage = `Large image (${formatSize(asset.size)}): ${imagePath}. Consider optimizing for better performance.`;
      warnings.push(warningMessage);

      if (onWarning) {
        onWarning(warningMessage, absolutePath, asset.size);
      }
    }

    return asset;
  }

  /**
   * Get all warnings generated during resolution.
   * @returns {string[]}
   */
  function getWarnings() {
    return [...warnings];
  }

  /**
   * Clear the asset cache.
   */
  function clearCache() {
    cache.clear();
  }

  /**
   * Get resolution statistics.
   * @returns {{resolved: number, cached: number, warnings: string[]}}
   */
  function getStats() {
    return {
      resolved: resolvedCount,
      cached: cache.stats.size,
      warnings: [...warnings],
    };
  }

  return {
    resolve,
    resolveWithMeta,
    getWarnings,
    clearCache,
    getStats,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a string is already a data URI.
 *
 * @param {string} value - String to check
 * @returns {boolean}
 */
export function isDataUri(value) {
  return typeof value === "string" && value.startsWith("data:");
}

/**
 * Extract the MIME type from a data URI.
 *
 * @param {string} dataUri - Data URI string
 * @returns {string | null} MIME type or null if invalid
 */
export function getMimeTypeFromDataUri(dataUri) {
  if (!isDataUri(dataUri)) return null;

  const match = dataUri.match(/^data:([^;,]+)/);
  return match ? match[1] : null;
}

/**
 * Validate that a data URI is a supported image format.
 *
 * @param {string} dataUri - Data URI to validate
 * @returns {boolean}
 */
export function isValidImageDataUri(dataUri) {
  const mimeType = getMimeTypeFromDataUri(dataUri);
  if (!mimeType) return false;

  return Object.values(IMAGE_FORMATS).includes(mimeType);
}

/**
 * Estimate the decoded size of a base64 data URI.
 *
 * @param {string} dataUri - Data URI string
 * @returns {number} Estimated size in bytes
 */
export function estimateDataUriSize(dataUri) {
  if (!isDataUri(dataUri)) return 0;

  // Find the base64 content after the comma
  const commaIndex = dataUri.indexOf(",");
  if (commaIndex === -1) return 0;

  const base64Content = dataUri.slice(commaIndex + 1);

  // Base64 encoding increases size by ~33%, so decoded size is ~75% of encoded
  // Also account for padding characters
  const padding = (base64Content.match(/=+$/) || [""])[0].length;
  return Math.floor((base64Content.length * 3) / 4) - padding;
}
