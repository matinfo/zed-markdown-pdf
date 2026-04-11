/**
 * @fileoverview HTML generator for structured header/footer configuration.
 *
 * This module converts declarative header/footer configurations into
 * HTML templates suitable for Playwright's PDF generation.
 *
 * Key responsibilities:
 * - Convert element definitions to HTML
 * - Handle shorthand property expansion
 * - Generate flexbox-based layout for zones (left, center, right)
 * - Integrate with asset resolver for images
 * - Integrate with placeholder resolver for dynamic content
 *
 * @module html-generator
 */

import { SHORTHAND_MAPPINGS } from "./types.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default styles for header/footer container.
 * @type {Readonly<Object.<string, string>>}
 */
const DEFAULT_CONTAINER_STYLES = Object.freeze({
  display: "flex",
  "justify-content": "space-between",
  "align-items": "center",
  width: "100%",
  "box-sizing": "border-box",
  padding: "0 10mm",
  "font-size": "10px",
  "font-family": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
});

/**
 * Default styles for zone containers.
 * @type {Readonly<Object.<string, string>>}
 */
const DEFAULT_ZONE_STYLES = Object.freeze({
  display: "flex",
  "align-items": "center",
  "flex-shrink": "0",
  gap: "4px",
});

/**
 * Zone alignment mapping.
 * @type {Readonly<Object.<string, string>>}
 */
const ZONE_ALIGNMENT = Object.freeze({
  left: "flex-start",
  center: "center",
  right: "flex-end",
});

// ─────────────────────────────────────────────────────────────────────────────
// Style Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a style object to inline CSS string.
 *
 * @param {Object.<string, string|number>} styles - Style object
 * @returns {string} Inline CSS string
 */
function stylesToString(styles) {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

/**
 * Merge multiple style objects, later objects override earlier.
 *
 * @param {...Object.<string, string|number>} styleObjects - Style objects to merge
 * @returns {Object.<string, string|number>} Merged styles
 */
function mergeStyles(...styleObjects) {
  const result = {};
  for (const styles of styleObjects) {
    if (styles && typeof styles === "object") {
      Object.assign(result, styles);
    }
  }
  return result;
}

/**
 * Parse a custom style string into a style object.
 *
 * @param {string} styleStr - CSS style string, e.g., "color: red; font-size: 12px"
 * @returns {Object.<string, string>} Style object
 */
function parseStyleString(styleStr) {
  if (!styleStr || typeof styleStr !== "string") {
    return {};
  }

  const result = {};
  const declarations = styleStr.split(";").map((s) => s.trim()).filter(Boolean);

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex > 0) {
      const property = declaration.slice(0, colonIndex).trim();
      const value = declaration.slice(colonIndex + 1).trim();
      if (property && value) {
        result[property] = value;
      }
    }
  }

  return result;
}

/**
 * Build element styles from element properties.
 *
 * @param {Object} element - Element with style properties
 * @returns {Object.<string, string>} Style object
 */
function buildElementStyles(element) {
  const styles = {};

  if (element.font_size) {
    styles["font-size"] = element.font_size;
  }

  if (element.font_weight) {
    styles["font-weight"] = String(element.font_weight);
  }

  if (element.font_style) {
    styles["font-style"] = element.font_style;
  }

  if (element.color) {
    styles.color = element.color;
  }

  // Parse and merge custom style string
  if (element.style) {
    Object.assign(styles, parseStyleString(element.style));
  }

  return styles;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Escaping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escape HTML special characters.
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Element Generators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} GeneratorContext
 * @property {(imagePath: string) => Promise<string>} resolveAsset - Resolve image to data URI
 * @property {(text: string) => string} resolvePlaceholders - Resolve placeholders in text
 * @property {string} [fontFamily] - Default font family
 */

/**
 * Generate HTML for a text element.
 *
 * @param {import('./types.mjs').TextElement} element - Text element
 * @param {GeneratorContext} context - Generator context
 * @returns {string} HTML string
 */
function generateTextElement(element, context) {
  const styles = buildElementStyles(element);
  const styleStr = stylesToString(styles);

  // Resolve placeholders in content
  let content = context.resolvePlaceholders(element.content || "");

  const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";
  return `<span${styleAttr}>${content}</span>`;
}

/**
 * Generate HTML for an image element.
 *
 * @param {import('./types.mjs').ImageElement} element - Image element
 * @param {GeneratorContext} context - Generator context
 * @param {string} dataUri - Resolved data URI for the image
 * @returns {string} HTML string
 */
function generateImageElement(element, context, dataUri) {
  const styles = {};

  if (element.height) {
    styles.height = element.height;
  }

  if (element.width) {
    styles.width = element.width;
  }

  // Parse and merge custom style string
  if (element.style) {
    Object.assign(styles, parseStyleString(element.style));
  }

  const styleStr = stylesToString(styles);
  const alt = element.alt ? ` alt="${escapeHtml(element.alt)}"` : ' alt=""';
  const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";

  // Use height attribute for legacy compatibility, style for CSS
  const heightAttr = element.height ? ` height="${escapeHtml(element.height.replace(/[^0-9]/g, ''))}"` : "";

  return `<img src="${dataUri}"${alt}${heightAttr}${styleAttr}>`;
}

/**
 * Generate HTML for a page_number element.
 *
 * @param {import('./types.mjs').PageNumberElement} element - Page number element
 * @param {GeneratorContext} context - Generator context
 * @returns {string} HTML string
 */
function generatePageNumberElement(element, context) {
  const styles = buildElementStyles(element);
  const styleStr = stylesToString(styles);
  const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";

  if (element.format) {
    // Format string with {page} placeholder
    const content = context.resolvePlaceholders(element.format);
    return `<span${styleAttr}>${content}</span>`;
  }

  // Just the page number
  return `<span class="pageNumber"${styleAttr}></span>`;
}

/**
 * Generate HTML for a total_pages element.
 *
 * @param {import('./types.mjs').TotalPagesElement} element - Total pages element
 * @param {GeneratorContext} context - Generator context
 * @returns {string} HTML string
 */
function generateTotalPagesElement(element, context) {
  const styles = buildElementStyles(element);
  const styleStr = stylesToString(styles);
  const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";

  if (element.format) {
    // Format string with {pages} placeholder
    const content = context.resolvePlaceholders(element.format);
    return `<span${styleAttr}>${content}</span>`;
  }

  // Just the total pages
  return `<span class="totalPages"${styleAttr}></span>`;
}

/**
 * Generate HTML for a date element.
 *
 * @param {import('./types.mjs').DateElement} element - Date element
 * @param {GeneratorContext} context - Generator context
 * @returns {string} HTML string
 */
function generateDateElement(element, context) {
  const styles = buildElementStyles(element);
  const styleStr = stylesToString(styles);
  const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";

  // Build placeholder with format if specified
  const placeholder = element.format ? `{date:${element.format}}` : "{date}";
  const content = context.resolvePlaceholders(placeholder);

  return `<span${styleAttr}>${escapeHtml(content)}</span>`;
}

/**
 * Generate HTML for a title element.
 *
 * @param {import('./types.mjs').TitleElement} element - Title element
 * @param {GeneratorContext} context - Generator context
 * @returns {string} HTML string
 */
function generateTitleElement(element, context) {
  const styles = buildElementStyles(element);
  const styleStr = stylesToString(styles);
  const styleAttr = styleStr ? ` style="${escapeHtml(styleStr)}"` : "";

  // Resolve {title} placeholder
  let content = context.resolvePlaceholders("{title}");

  // Use fallback if title is empty
  if (!content && element.fallback) {
    content = escapeHtml(element.fallback);
  }

  return `<span${styleAttr}>${content}</span>`;
}

/**
 * Generate HTML for a spacer element.
 *
 * @param {import('./types.mjs').SpacerElement} element - Spacer element
 * @returns {string} HTML string
 */
function generateSpacerElement(element) {
  const styles = {};

  if (element.width) {
    styles.width = element.width;
    styles["flex-shrink"] = "0";
  } else {
    // Flexible spacer
    styles.flex = "1";
  }

  const styleStr = stylesToString(styles);
  return `<span style="${escapeHtml(styleStr)}"></span>`;
}

/**
 * Generate HTML for a single element.
 *
 * @param {import('./types.mjs').Element} element - Element definition
 * @param {GeneratorContext} context - Generator context
 * @param {Map<string, string>} resolvedAssets - Pre-resolved asset map
 * @returns {string} HTML string
 */
function generateElement(element, context, resolvedAssets) {
  switch (element.type) {
    case "text":
      return generateTextElement(element, context);

    case "image": {
      const dataUri = resolvedAssets.get(element.src) || element.src;
      return generateImageElement(element, context, dataUri);
    }

    case "page_number":
      return generatePageNumberElement(element, context);

    case "total_pages":
      return generateTotalPagesElement(element, context);

    case "date":
      return generateDateElement(element, context);

    case "title":
      return generateTitleElement(element, context);

    case "spacer":
      return generateSpacerElement(element);

    default:
      // Unknown element type - return empty
      console.warn(`Unknown element type: ${element.type}`);
      return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shorthand Expansion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expand shorthand properties into full element definitions.
 *
 * @param {import('./types.mjs').HeaderFooterConfig} config - Config with possible shorthands
 * @returns {import('./types.mjs').HeaderFooterConfig} Config with shorthands expanded
 */
export function expandShorthands(config) {
  if (!config || typeof config !== "object") {
    return config;
  }

  const result = { ...config };

  // Group shorthands by zone
  const zoneElements = {
    left: null,
    center: null,
    right: null,
  };

  // Process each shorthand
  for (const [shorthand, mapping] of Object.entries(SHORTHAND_MAPPINGS)) {
    if (config[shorthand] !== undefined) {
      const { zone, type, property } = mapping;

      // Skip if zone is already explicitly defined
      if (config[zone] !== undefined) {
        continue;
      }

      // Initialize or get existing element for this zone
      if (!zoneElements[zone]) {
        zoneElements[zone] = { type };
      }

      // Set the property
      if (property === "content") {
        zoneElements[zone].content = config[shorthand];
      } else if (property === "src") {
        zoneElements[zone].src = config[shorthand];
      } else if (property === "height") {
        zoneElements[zone].height = config[shorthand];
      }

      // Remove shorthand from result
      delete result[shorthand];
    }
  }

  // Apply expanded zones
  for (const [zone, element] of Object.entries(zoneElements)) {
    if (element && !result[zone]) {
      result[zone] = element;
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize zone content to an array of elements.
 *
 * @param {import('./types.mjs').Zone} zone - Zone content
 * @returns {import('./types.mjs').Element[]} Array of elements
 */
function normalizeZone(zone) {
  if (!zone) {
    return [];
  }

  if (Array.isArray(zone)) {
    return zone;
  }

  // Single element
  return [zone];
}

/**
 * Generate HTML for a zone (left, center, or right).
 *
 * @param {import('./types.mjs').Zone} zone - Zone content
 * @param {string} zoneName - Zone name ('left', 'center', 'right')
 * @param {GeneratorContext} context - Generator context
 * @param {Map<string, string>} resolvedAssets - Pre-resolved assets
 * @returns {string} HTML string
 */
function generateZone(zone, zoneName, context, resolvedAssets) {
  const elements = normalizeZone(zone);

  if (elements.length === 0) {
    // Empty zone - still render container for layout
    return "";
  }

  const styles = {
    ...DEFAULT_ZONE_STYLES,
    "justify-content": ZONE_ALIGNMENT[zoneName] || "flex-start",
  };

  // Center zone should be centered in available space
  if (zoneName === "center") {
    styles.flex = "1";
    styles["justify-content"] = "center";
  }

  const styleStr = stylesToString(styles);
  const elementsHtml = elements
    .map((el) => generateElement(el, context, resolvedAssets))
    .join("");

  return `<div style="${escapeHtml(styleStr)}">${elementsHtml}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Asset Collection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collect all image paths from a configuration.
 *
 * @param {import('./types.mjs').HeaderFooterConfig} config - Header/footer config
 * @returns {string[]} Array of image paths
 */
export function collectImagePaths(config) {
  if (!config || typeof config !== "object") {
    return [];
  }

  const expanded = expandShorthands(config);
  const paths = [];

  for (const zoneName of ["left", "center", "right"]) {
    const zone = expanded[zoneName];
    if (!zone) continue;

    const elements = normalizeZone(zone);
    for (const element of elements) {
      if (element.type === "image" && element.src) {
        paths.push(element.src);
      }
    }
  }

  return paths;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main HTML Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} GenerateHtmlOptions
 * @property {import('./types.mjs').HeaderFooterConfig} config - Header/footer configuration
 * @property {'header'|'footer'} type - Whether this is header or footer
 * @property {(text: string) => string} resolvePlaceholders - Placeholder resolver function
 * @property {Map<string, string>} [resolvedAssets] - Pre-resolved image assets (path -> dataUri)
 * @property {string} [fontFamily] - Global font family override
 */

/**
 * Generate HTML template from structured configuration.
 *
 * @param {GenerateHtmlOptions} options - Generation options
 * @returns {string} HTML template string
 */
export function generateHtml(options) {
  const {
    config,
    type = "header",
    resolvePlaceholders,
    resolvedAssets = new Map(),
    fontFamily,
  } = options;

  if (!config || typeof config !== "object") {
    return "";
  }

  // Expand shorthands
  const expanded = expandShorthands(config);

  // Build context
  const context = {
    resolvePlaceholders: resolvePlaceholders || ((text) => text),
    fontFamily,
  };

  // Build container styles
  const containerStyles = { ...DEFAULT_CONTAINER_STYLES };

  // Apply config-level styles
  if (expanded.height) {
    containerStyles.height = expanded.height;
  }

  if (expanded.padding) {
    containerStyles.padding = expanded.padding;
  }

  if (expanded.font_family || fontFamily) {
    containerStyles["font-family"] = expanded.font_family || fontFamily;
  }

  if (expanded.font_size) {
    containerStyles["font-size"] = expanded.font_size;
  }

  if (expanded.color) {
    containerStyles.color = expanded.color;
  }

  if (expanded.background) {
    containerStyles.background = expanded.background;
  }

  // Type-specific borders
  if (type === "header" && expanded.border_bottom) {
    containerStyles["border-bottom"] = expanded.border_bottom;
  }

  if (type === "footer" && expanded.border_top) {
    containerStyles["border-top"] = expanded.border_top;
  }

  // Parse and merge custom style string
  if (expanded.style) {
    Object.assign(containerStyles, parseStyleString(expanded.style));
  }

  // Generate zones
  const leftHtml = generateZone(expanded.left, "left", context, resolvedAssets);
  const centerHtml = generateZone(expanded.center, "center", context, resolvedAssets);
  const rightHtml = generateZone(expanded.right, "right", context, resolvedAssets);

  // Build the final HTML
  const containerStyleStr = stylesToString(containerStyles);

  // If center exists, we need a different layout strategy
  // Left takes natural width, center is flexible and centered, right takes natural width
  if (centerHtml) {
    // Three-column layout with center taking remaining space
    const leftWrapperStyle = "flex-shrink:0;min-width:0;";
    const centerWrapperStyle = "flex:1;display:flex;justify-content:center;min-width:0;";
    const rightWrapperStyle = "flex-shrink:0;min-width:0;";

    let html = `<div style="${escapeHtml(containerStyleStr)}">`;

    if (leftHtml) {
      html += `<div style="${leftWrapperStyle}">${leftHtml}</div>`;
    } else {
      html += `<div style="${leftWrapperStyle}"></div>`;
    }

    html += `<div style="${centerWrapperStyle}">${centerHtml}</div>`;

    if (rightHtml) {
      html += `<div style="${rightWrapperStyle}">${rightHtml}</div>`;
    } else {
      html += `<div style="${rightWrapperStyle}"></div>`;
    }

    html += "</div>";
    return html;
  }

  // Simple two-column layout (left and right only)
  let html = `<div style="${escapeHtml(containerStyleStr)}">`;

  if (leftHtml) {
    html += leftHtml;
  }

  // Add spacer if both left and right exist
  if (leftHtml && rightHtml) {
    html += '<div style="flex:1;"></div>';
  }

  if (rightHtml) {
    html += rightHtml;
  }

  html += "</div>";
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Generation with Asset Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} GenerateWithAssetsOptions
 * @property {import('./types.mjs').HeaderFooterConfig} config - Header/footer configuration
 * @property {'header'|'footer'} type - Whether this is header or footer
 * @property {(text: string) => string} resolvePlaceholders - Placeholder resolver function
 * @property {(imagePath: string) => Promise<string>} resolveAsset - Asset resolver function
 * @property {string} [fontFamily] - Global font family override
 */

/**
 * Generate HTML template with automatic asset resolution.
 *
 * @param {GenerateWithAssetsOptions} options - Generation options
 * @returns {Promise<string>} HTML template string
 */
export async function generateHtmlWithAssets(options) {
  const {
    config,
    type = "header",
    resolvePlaceholders,
    resolveAsset,
    fontFamily,
  } = options;

  if (!config || typeof config !== "object") {
    return "";
  }

  // Collect all image paths
  const imagePaths = collectImagePaths(config);

  // Resolve all assets in parallel
  const resolvedAssets = new Map();

  if (resolveAsset && imagePaths.length > 0) {
    const resolutions = await Promise.all(
      imagePaths.map(async (path) => {
        try {
          const dataUri = await resolveAsset(path);
          return { path, dataUri };
        } catch (error) {
          console.warn(`Failed to resolve asset "${path}": ${error.message}`);
          return { path, dataUri: path }; // Keep original path on failure
        }
      })
    );

    for (const { path, dataUri } of resolutions) {
      resolvedAssets.set(path, dataUri);
    }
  }

  // Generate HTML with resolved assets
  return generateHtml({
    config,
    type,
    resolvePlaceholders,
    resolvedAssets,
    fontFamily,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Generator Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} HtmlGeneratorOptions
 * @property {import('./lib/placeholder-resolver.mjs').PlaceholderResolver} placeholderResolver - Placeholder resolver
 * @property {import('./lib/asset-resolver.mjs').AssetResolver} [assetResolver] - Asset resolver (optional)
 * @property {string} [fontFamily] - Default font family
 */

/**
 * @typedef {Object} HtmlGenerator
 * @property {(config: import('./types.mjs').HeaderFooterConfig) => Promise<string>} generateHeader - Generate header HTML
 * @property {(config: import('./types.mjs').HeaderFooterConfig) => Promise<string>} generateFooter - Generate footer HTML
 * @property {(config: import('./types.mjs').HeaderFooterConfig) => string[]} getImagePaths - Get image paths from config
 */

/**
 * Create an HTML generator with bound resolvers.
 *
 * @param {HtmlGeneratorOptions} options - Generator options
 * @returns {HtmlGenerator}
 *
 * @example
 * const generator = createHtmlGenerator({
 *   placeholderResolver: createPlaceholderResolver(context),
 *   assetResolver: createAssetResolver({ basePath: '/path/to/doc.md' }),
 *   fontFamily: 'Arial, sans-serif',
 * });
 *
 * const headerHtml = await generator.generateHeader(headerConfig);
 * const footerHtml = await generator.generateFooter(footerConfig);
 */
export function createHtmlGenerator(options) {
  const { placeholderResolver, assetResolver, fontFamily } = options;

  const resolvePlaceholders = placeholderResolver?.resolve || ((text) => text);
  const resolveAsset = assetResolver?.resolve;

  return {
    /**
     * Generate header HTML from configuration.
     *
     * @param {import('./types.mjs').HeaderFooterConfig} config - Header configuration
     * @returns {Promise<string>} Header HTML
     */
    async generateHeader(config) {
      return generateHtmlWithAssets({
        config,
        type: "header",
        resolvePlaceholders,
        resolveAsset,
        fontFamily,
      });
    },

    /**
     * Generate footer HTML from configuration.
     *
     * @param {import('./types.mjs').HeaderFooterConfig} config - Footer configuration
     * @returns {Promise<string>} Footer HTML
     */
    async generateFooter(config) {
      return generateHtmlWithAssets({
        config,
        type: "footer",
        resolvePlaceholders,
        resolveAsset,
        fontFamily,
      });
    },

    /**
     * Get all image paths from a configuration (useful for pre-warming cache).
     *
     * @param {import('./types.mjs').HeaderFooterConfig} config - Configuration
     * @returns {string[]} Array of image paths
     */
    getImagePaths(config) {
      return collectImagePaths(config);
    },
  };
}
