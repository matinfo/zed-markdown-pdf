/**
 * @fileoverview Placeholder resolver for header/footer templates.
 *
 * This module handles:
 * - Parsing placeholder syntax: {name} and {name:format}
 * - Mapping page placeholders to Playwright span classes
 * - Resolving date/time with date-fns formatting
 * - Resolving document metadata (title, filename, author)
 * - Supporting custom front matter variables
 *
 * @module placeholder-resolver
 */

// ── Lazy-loaded npm dependency ────────────────────────────────────────────────
// Loaded dynamically so the MCP handshake can succeed before `npm install` runs.
let formatDate = null;

/**
 * Ensure the `date-fns` package is loaded. Must be called (and awaited)
 * before any function in this module that depends on date formatting.
 */
export async function ensureDateFnsLoaded() {
  if (!formatDate) {
    formatDate = (await import("date-fns")).format;
  }
}

import { PLACEHOLDER_PATTERN, BUILTIN_PLACEHOLDERS } from "./types.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default date format (ISO date).
 * @type {string}
 */
const DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

/**
 * Default time format (ISO time).
 * @type {string}
 */
const DEFAULT_TIME_FORMAT = "HH:mm:ss";

/**
 * Default datetime format.
 * @type {string}
 */
const DEFAULT_DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

/**
 * Mapping of placeholder names to Playwright span classes.
 * These are rendered by Chromium at print time.
 *
 * @type {Readonly<Object.<string, string>>}
 */
const PLAYWRIGHT_SPANS = Object.freeze({
  page: "pageNumber",
  pages: "totalPages",
});

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ParsedPlaceholder
 * @property {string} full - Full match including braces, e.g., "{date:yyyy-MM-dd}"
 * @property {string} name - Placeholder name, e.g., "date"
 * @property {string|null} format - Optional format string, e.g., "yyyy-MM-dd"
 * @property {number} start - Start index in the original string
 * @property {number} end - End index in the original string
 */

/**
 * Parse all placeholders in a string.
 *
 * @param {string} text - Text containing placeholders
 * @returns {ParsedPlaceholder[]} Array of parsed placeholders
 *
 * @example
 * parsePlaceholders("Page {page} of {pages}")
 * // Returns: [
 * //   { full: "{page}", name: "page", format: null, start: 5, end: 11 },
 * //   { full: "{pages}", name: "pages", format: null, start: 15, end: 22 }
 * // ]
 *
 * @example
 * parsePlaceholders("Date: {date:MM/dd/yyyy}")
 * // Returns: [
 * //   { full: "{date:MM/dd/yyyy}", name: "date", format: "MM/dd/yyyy", start: 6, end: 23 }
 * // ]
 */
export function parsePlaceholders(text) {
  if (typeof text !== "string") {
    return [];
  }

  const placeholders = [];
  // Create a new regex instance to avoid state issues with lastIndex
  const regex = new RegExp(PLACEHOLDER_PATTERN.source, "g");
  let match;

  while ((match = regex.exec(text)) !== null) {
    placeholders.push({
      full: match[0],
      name: match[1].toLowerCase(),
      format: match[2] || null,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return placeholders;
}

/**
 * Check if a placeholder name is a built-in placeholder.
 *
 * @param {string} name - Placeholder name
 * @returns {boolean}
 */
export function isBuiltinPlaceholder(name) {
  return BUILTIN_PLACEHOLDERS.includes(name.toLowerCase());
}

/**
 * Check if a placeholder should be rendered as a Playwright span.
 *
 * @param {string} name - Placeholder name
 * @returns {boolean}
 */
export function isPlaywrightPlaceholder(name) {
  return name.toLowerCase() in PLAYWRIGHT_SPANS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Date/Time Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a date using date-fns.
 *
 * @param {Date} date - Date to format
 * @param {string} [formatStr] - date-fns format string
 * @returns {string} Formatted date string
 *
 * @example
 * formatDateTime(new Date(2025, 0, 15), "MM/dd/yyyy") // "01/15/2025"
 * formatDateTime(new Date(2025, 0, 15), "MMMM d, yyyy") // "January 15, 2025"
 * formatDateTime(new Date(2025, 0, 15), "dd.MM.yyyy") // "15.01.2025" (EU format)
 */
export function formatDateTime(date, formatStr = DEFAULT_DATE_FORMAT) {
  try {
    return formatDate(date, formatStr);
  } catch (error) {
    // If format string is invalid, return ISO date
    console.warn(`Invalid date format "${formatStr}": ${error.message}`);
    return formatDate(date, DEFAULT_DATE_FORMAT);
  }
}

/**
 * Get common date format presets.
 *
 * @returns {Object.<string, string>} Map of preset names to format strings
 */
export function getDateFormatPresets() {
  return {
    // ISO formats
    iso: "yyyy-MM-dd",
    "iso-time": "HH:mm:ss",
    "iso-datetime": "yyyy-MM-dd HH:mm:ss",

    // US formats
    us: "MM/dd/yyyy",
    "us-long": "MMMM d, yyyy",
    "us-short": "M/d/yy",

    // EU formats
    eu: "dd/MM/yyyy",
    "eu-long": "d MMMM yyyy",
    "eu-short": "d/M/yy",
    "eu-dot": "dd.MM.yyyy",

    // Other common formats
    full: "EEEE, MMMM d, yyyy",
    medium: "MMM d, yyyy",
    short: "M/d/yy",
    year: "yyyy",
    month: "MMMM",
    day: "d",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a single placeholder to its value or HTML.
 *
 * @param {ParsedPlaceholder} placeholder - Parsed placeholder
 * @param {import('./types.mjs').RenderContext} context - Render context
 * @returns {string} Resolved value or HTML
 */
export function resolvePlaceholder(placeholder, context) {
  const { name, format } = placeholder;
  const { title, author, filename, now, customVariables = {} } = context;

  switch (name) {
    // Playwright-rendered placeholders (rendered at print time by Chromium)
    case "page":
      return `<span class="${PLAYWRIGHT_SPANS.page}"></span>`;

    case "pages":
      return `<span class="${PLAYWRIGHT_SPANS.pages}"></span>`;

    // Date/time placeholders (resolved at export time)
    case "date":
      return formatDateTime(now, format || DEFAULT_DATE_FORMAT);

    case "time":
      return formatDateTime(now, format || DEFAULT_TIME_FORMAT);

    case "datetime":
      return formatDateTime(now, format || DEFAULT_DATETIME_FORMAT);

    // Document metadata
    case "title":
      return escapeHtml(title || "");

    case "filename":
      return escapeHtml(filename || "");

    case "author":
      return escapeHtml(author || "");

    // Custom variables from front matter
    default:
      if (name in customVariables) {
        return escapeHtml(String(customVariables[name]));
      }
      // Unknown placeholder - return as-is (might be intentional)
      return placeholder.full;
  }
}

/**
 * Resolve all placeholders in a text string.
 *
 * @param {string} text - Text containing placeholders
 * @param {import('./types.mjs').RenderContext} context - Render context
 * @returns {string} Text with all placeholders resolved
 *
 * @example
 * resolvePlaceholders("Page {page} of {pages}", context)
 * // Returns: "Page <span class="pageNumber"></span> of <span class="totalPages"></span>"
 *
 * @example
 * resolvePlaceholders("Date: {date:MM/dd/yyyy}", { now: new Date(2025, 0, 15), ... })
 * // Returns: "Date: 01/15/2025"
 */
export function resolvePlaceholders(text, context) {
  if (typeof text !== "string") {
    return "";
  }

  const placeholders = parsePlaceholders(text);

  if (placeholders.length === 0) {
    return text;
  }

  // Process placeholders from end to start to preserve indices
  let result = text;
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const placeholder = placeholders[i];
    const resolved = resolvePlaceholder(placeholder, context);
    result =
      result.slice(0, placeholder.start) +
      resolved +
      result.slice(placeholder.end);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} CreateContextOptions
 * @property {string} inputPath - Path to the Markdown file
 * @property {string} [title] - Document title (from front matter or H1)
 * @property {string} [author] - Document author (from front matter)
 * @property {Object.<string, any>} [frontMatter] - All front matter fields
 * @property {Date} [now] - Current date/time (defaults to new Date())
 */

/**
 * Create a render context from document information.
 *
 * @param {CreateContextOptions} options - Context options
 * @returns {import('./types.mjs').RenderContext}
 */
export function createRenderContext(options) {
  const {
    inputPath,
    title = "",
    author = "",
    frontMatter = {},
    now = new Date(),
  } = options;

  // Extract filename from path
  const filename = inputPath ? inputPath.split(/[/\\]/).pop() || "" : "";

  // Build custom variables from front matter (excluding known fields)
  const knownFields = new Set(["title", "author", "date", "pdf"]);
  const customVariables = {};

  for (const [key, value] of Object.entries(frontMatter)) {
    if (!knownFields.has(key) && value !== null && value !== undefined) {
      customVariables[key.toLowerCase()] = value;
    }
  }

  return {
    title,
    author,
    filename,
    inputPath,
    now,
    customVariables,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder Resolver Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} PlaceholderResolver
 * @property {(text: string) => string} resolve - Resolve all placeholders in text
 * @property {(text: string) => ParsedPlaceholder[]} parse - Parse placeholders without resolving
 * @property {() => import('./types.mjs').RenderContext} getContext - Get the current context
 * @property {(updates: Partial<import('./types.mjs').RenderContext>) => void} updateContext - Update context
 */

/**
 * Create a placeholder resolver bound to a specific context.
 *
 * @param {import('./types.mjs').RenderContext} context - Initial render context
 * @returns {PlaceholderResolver}
 *
 * @example
 * const resolver = createPlaceholderResolver({
 *   title: "My Document",
 *   filename: "doc.md",
 *   inputPath: "/path/to/doc.md",
 *   now: new Date(),
 * });
 *
 * resolver.resolve("Page {page} - {title}")
 * // Returns: "Page <span class="pageNumber"></span> - My Document"
 */
export function createPlaceholderResolver(context) {
  let currentContext = { ...context };

  return {
    /**
     * Resolve all placeholders in text.
     * @param {string} text
     * @returns {string}
     */
    resolve(text) {
      return resolvePlaceholders(text, currentContext);
    },

    /**
     * Parse placeholders without resolving.
     * @param {string} text
     * @returns {ParsedPlaceholder[]}
     */
    parse(text) {
      return parsePlaceholders(text);
    },

    /**
     * Get the current context.
     * @returns {import('./types.mjs').RenderContext}
     */
    getContext() {
      return { ...currentContext };
    },

    /**
     * Update the context with new values.
     * @param {Partial<import('./types.mjs').RenderContext>} updates
     */
    updateContext(updates) {
      currentContext = { ...currentContext, ...updates };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape HTML special characters.
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * List all placeholders found in a text.
 * Useful for validation and debugging.
 *
 * @param {string} text - Text to analyze
 * @returns {{builtin: string[], custom: string[], playwright: string[]}}
 */
export function listPlaceholders(text) {
  const parsed = parsePlaceholders(text);
  const builtin = [];
  const custom = [];
  const playwright = [];

  for (const p of parsed) {
    if (isPlaywrightPlaceholder(p.name)) {
      playwright.push(p.name);
    } else if (isBuiltinPlaceholder(p.name)) {
      builtin.push(p.name);
    } else {
      custom.push(p.name);
    }
  }

  return {
    builtin: [...new Set(builtin)],
    custom: [...new Set(custom)],
    playwright: [...new Set(playwright)],
  };
}

/**
 * Validate that all custom placeholders in text have values in context.
 *
 * @param {string} text - Text to validate
 * @param {import('./types.mjs').RenderContext} context - Render context
 * @returns {{valid: boolean, missing: string[]}}
 */
export function validatePlaceholders(text, context) {
  const { custom } = listPlaceholders(text);
  const missing = [];

  for (const name of custom) {
    if (!(name in (context.customVariables || {}))) {
      missing.push(name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
