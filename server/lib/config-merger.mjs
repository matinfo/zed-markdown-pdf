/**
 * @fileoverview Configuration merger for PDF export settings.
 *
 * This module handles merging configuration from multiple sources:
 * 1. Extension defaults (lowest priority)
 * 2. Global settings (from settings.json)
 * 3. Front matter (highest priority)
 *
 * Key features:
 * - Deep merge with zone-level override for header/footer
 * - Support for explicit null to remove zones
 * - Backward compatibility with raw HTML templates
 * - Detection of structured vs. raw template mode
 *
 * @module config-merger
 */

import { isStructuredConfig } from "./schema-validator.mjs";
import { DEFAULT_FOOTER } from "./types.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extension default configuration.
 * Used when no settings or front matter is provided.
 *
 * @type {Readonly<Object>}
 */
export const EXTENSION_DEFAULTS = Object.freeze({
  // Page settings
  page_format: "A4",
  orientation: "portrait",
  scale: 1,
  page_ranges: "",
  print_background: true,
  margin: Object.freeze({
    top: "15mm",
    right: "15mm",
    bottom: "15mm",
    left: "15mm",
  }),

  // Rendering settings
  font_family: null,
  include_default_styles: true,
  stylesheet_path: null,
  highlight: true,
  highlight_style: "github.css",
  breaks: false,
  emoji: true,

  // Header/footer settings
  display_header_footer: false,
  header: null,
  footer: null,

  // Legacy raw template defaults (used when display_header_footer is true but no structured config)
  header_template:
    '<div style="font-size:9px;margin-left:1cm;flex:1"><span class="title"></span></div><div style="font-size:9px;margin-right:1cm">%%ISO-DATE%%</div>',
  footer_template:
    '<div style="font-size:9px;margin:0 auto"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',

  // Output settings
  output_directory: null,
  open_after_export: false,
});

/**
 * Keys that should be deep-merged (objects).
 * @type {Set<string>}
 */
const DEEP_MERGE_KEYS = new Set(["margin", "header", "footer"]);

/**
 * Keys that are header/footer zone names.
 * @type {Set<string>}
 */
const ZONE_KEYS = new Set(["left", "center", "right"]);

// ─────────────────────────────────────────────────────────────────────────────
// Merge Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a value is a plain object (not array, not null).
 *
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deep merge two objects.
 * Later values override earlier values.
 * Arrays are replaced, not merged.
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source;
  }

  const result = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    // Explicit null means "remove this"
    if (sourceValue === null) {
      result[key] = null;
      continue;
    }

    // Undefined means "no override"
    if (sourceValue === undefined) {
      continue;
    }

    const targetValue = result[key];

    // Deep merge for nested objects (except arrays)
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Merge header/footer configurations with zone-level override.
 *
 * When a zone is defined in the source, it completely replaces the target zone.
 * Container-level properties (height, padding, etc.) are merged.
 *
 * @param {Object|null} target - Target header/footer config
 * @param {Object|null} source - Source header/footer config
 * @returns {Object|null} Merged config
 */
function mergeHeaderFooter(target, source) {
  // Explicit null removes the header/footer
  if (source === null) {
    return null;
  }

  // No override
  if (source === undefined || !isPlainObject(source)) {
    return target;
  }

  // No target to merge with
  if (!isPlainObject(target)) {
    return source;
  }

  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (ZONE_KEYS.has(key)) {
      // Zones are replaced entirely (not merged)
      // null explicitly removes the zone
      result[key] = value;
    } else {
      // Other properties are merged normally
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {'structured'|'legacy'|'none'} HeaderFooterMode
 */

/**
 * Detect the header/footer mode from configuration.
 *
 * @param {Object} config - Configuration object
 * @returns {HeaderFooterMode}
 */
export function detectMode(config) {
  if (!config || typeof config !== "object") {
    return "none";
  }

  // Check for structured config (header/footer as objects)
  if (isStructuredConfig(config)) {
    return "structured";
  }

  // Check if display_header_footer is explicitly enabled
  // Legacy mode requires display_header_footer to be true
  if (config.display_header_footer === true) {
    return "legacy"; // Will use templates (custom or default)
  }

  return "none";
}

/**
 * Check if configuration uses structured header/footer format.
 *
 * @param {Object} settings - Settings object
 * @param {Object|null} frontMatterConfig - Front matter PDF config
 * @returns {boolean}
 */
export function usesStructuredConfig(settings, frontMatterConfig) {
  // Front matter takes priority
  if (frontMatterConfig && isStructuredConfig(frontMatterConfig)) {
    return true;
  }

  // Check settings
  if (settings && isStructuredConfig(settings)) {
    return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Merge Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} MergeOptions
 * @property {boolean} [applyDefaults=true] - Whether to apply extension defaults
 * @property {boolean} [preserveLegacy=true] - Whether to preserve legacy template fields
 */

/**
 * @typedef {Object} MergedConfig
 * @property {Object} config - Merged configuration
 * @property {HeaderFooterMode} mode - Detected header/footer mode
 * @property {boolean} hasHeaderFooter - Whether header/footer is enabled
 * @property {string[]} sources - List of sources that contributed to the config
 */

/**
 * Merge configuration from multiple sources.
 *
 * Priority (lowest to highest):
 * 1. Extension defaults
 * 2. Global settings
 * 3. Front matter
 *
 * @param {Object} [settings={}] - Global settings from settings.json
 * @param {Object|null} [frontMatterConfig=null] - PDF config from front matter
 * @param {MergeOptions} [options={}] - Merge options
 * @returns {MergedConfig}
 *
 * @example
 * const { config, mode } = mergeConfig(
 *   { page_format: 'Letter', header: { left_text: 'Company' } },
 *   { header: { left_image: './logo.svg' } }
 * );
 * // config.header will have left_image (front matter overrides)
 * // config.page_format will be 'Letter' (from settings)
 */
export function mergeConfig(
  settings = {},
  frontMatterConfig = null,
  options = {},
) {
  const { applyDefaults = true, preserveLegacy = true } = options;

  const sources = [];

  // Start with defaults if requested
  let result = applyDefaults ? { ...EXTENSION_DEFAULTS } : {};
  if (applyDefaults) {
    sources.push("defaults");
  }

  // Merge global settings
  if (
    settings &&
    typeof settings === "object" &&
    Object.keys(settings).length > 0
  ) {
    sources.push("settings");

    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined) {
        continue;
      }

      if (key === "header" || key === "footer") {
        result[key] = mergeHeaderFooter(result[key], value);
      } else if (key === "margin" && isPlainObject(value)) {
        result[key] = { ...result[key], ...value };
      } else {
        result[key] = value;
      }
    }
  }

  // Merge front matter config (highest priority)
  if (frontMatterConfig && typeof frontMatterConfig === "object") {
    sources.push("frontmatter");

    for (const [key, value] of Object.entries(frontMatterConfig)) {
      if (value === undefined) {
        continue;
      }

      if (key === "header" || key === "footer") {
        result[key] = mergeHeaderFooter(result[key], value);
      } else if (key === "margin" && isPlainObject(value)) {
        result[key] = { ...result[key], ...value };
      } else {
        result[key] = value;
      }
    }
  }

  // Detect mode
  const mode = detectMode(result);

  // Determine if header/footer is enabled
  let hasHeaderFooter = false;

  if (mode === "structured") {
    // In structured mode, having header or footer config enables display
    hasHeaderFooter = result.header !== null || result.footer !== null;

    // Auto-enable display_header_footer if we have structured config
    if (hasHeaderFooter && result.display_header_footer !== true) {
      result.display_header_footer = true;
    }

    // Apply default footer if header is set but footer is not
    if (result.header && !result.footer && result.footer !== null) {
      result.footer = { ...DEFAULT_FOOTER };
    }
  } else if (mode === "legacy") {
    hasHeaderFooter = result.display_header_footer === true;
  }

  // Clean up legacy fields if using structured mode and not preserving
  if (mode === "structured" && !preserveLegacy) {
    delete result.header_template;
    delete result.footer_template;
  }

  return {
    config: result,
    mode,
    hasHeaderFooter,
    sources,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract just the header configuration from merged config.
 *
 * @param {Object} mergedConfig - Result from mergeConfig
 * @returns {Object|null}
 */
export function getHeaderConfig(mergedConfig) {
  return mergedConfig?.config?.header || null;
}

/**
 * Extract just the footer configuration from merged config.
 *
 * @param {Object} mergedConfig - Result from mergeConfig
 * @returns {Object|null}
 */
export function getFooterConfig(mergedConfig) {
  return mergedConfig?.config?.footer || null;
}

/**
 * Check if the merged config has a structured header.
 *
 * @param {Object} mergedConfig - Result from mergeConfig
 * @returns {boolean}
 */
export function hasStructuredHeader(mergedConfig) {
  const header = getHeaderConfig(mergedConfig);
  return header !== null && typeof header === "object";
}

/**
 * Check if the merged config has a structured footer.
 *
 * @param {Object} mergedConfig - Result from mergeConfig
 * @returns {boolean}
 */
export function hasStructuredFooter(mergedConfig) {
  const footer = getFooterConfig(mergedConfig);
  return footer !== null && typeof footer === "object";
}

/**
 * Get page settings from merged config.
 *
 * @param {Object} mergedConfig - Result from mergeConfig
 * @returns {Object}
 */
export function getPageSettings(mergedConfig) {
  const config = mergedConfig?.config || {};

  return {
    page_format: config.page_format || EXTENSION_DEFAULTS.page_format,
    orientation: config.orientation || EXTENSION_DEFAULTS.orientation,
    scale: config.scale ?? EXTENSION_DEFAULTS.scale,
    page_ranges: config.page_ranges || "",
    print_background:
      config.print_background ?? EXTENSION_DEFAULTS.print_background,
    margin: config.margin || { ...EXTENSION_DEFAULTS.margin },
  };
}

/**
 * Get rendering settings from merged config.
 *
 * @param {Object} mergedConfig - Result from mergeConfig
 * @returns {Object}
 */
export function getRenderSettings(mergedConfig) {
  const config = mergedConfig?.config || {};

  return {
    font_family: config.font_family || null,
    include_default_styles:
      config.include_default_styles ??
      EXTENSION_DEFAULTS.include_default_styles,
    stylesheet_path: config.stylesheet_path || null,
    highlight: config.highlight ?? EXTENSION_DEFAULTS.highlight,
    highlight_style:
      config.highlight_style || EXTENSION_DEFAULTS.highlight_style,
    breaks: config.breaks ?? EXTENSION_DEFAULTS.breaks,
    emoji: config.emoji ?? EXTENSION_DEFAULTS.emoji,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Merger Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ConfigMerger
 * @property {(frontMatterConfig?: Object|null) => MergedConfig} merge - Merge with front matter
 * @property {() => Object} getSettings - Get current settings
 * @property {(newSettings: Object) => void} updateSettings - Update settings
 */

/**
 * Create a config merger bound to specific settings.
 *
 * Useful when you have global settings that stay constant
 * and only the front matter changes per document.
 *
 * @param {Object} [settings={}] - Global settings
 * @param {MergeOptions} [options={}] - Merge options
 * @returns {ConfigMerger}
 *
 * @example
 * const merger = createConfigMerger(globalSettings);
 *
 * // For each document
 * const { config, mode } = merger.merge(documentFrontMatter.pdfConfig);
 */
export function createConfigMerger(settings = {}, options = {}) {
  let currentSettings = { ...settings };

  return {
    /**
     * Merge current settings with front matter config.
     *
     * @param {Object|null} [frontMatterConfig=null] - PDF config from front matter
     * @returns {MergedConfig}
     */
    merge(frontMatterConfig = null) {
      return mergeConfig(currentSettings, frontMatterConfig, options);
    },

    /**
     * Get current settings.
     *
     * @returns {Object}
     */
    getSettings() {
      return { ...currentSettings };
    },

    /**
     * Update settings.
     *
     * @param {Object} newSettings - New settings to merge
     */
    updateSettings(newSettings) {
      currentSettings = deepMerge(currentSettings, newSettings);
    },
  };
}
