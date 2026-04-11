/**
 * @fileoverview JSDoc type definitions for structured header/footer configuration.
 *
 * This module defines the types for the declarative header/footer system that
 * replaces raw HTML templates with a structured configuration.
 *
 * @module types
 */

// ─────────────────────────────────────────────────────────────────────────────
// Element Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Text element - displays static or dynamic text with placeholders.
 *
 * @typedef {Object} TextElement
 * @property {'text'} type - Element type identifier
 * @property {string} content - Text content, supports placeholders like {page}, {date}, {title}
 * @property {string} [font_size] - CSS font-size, e.g., "10px", "9pt"
 * @property {string|number} [font_weight] - CSS font-weight, e.g., "bold", "normal", 600
 * @property {'normal'|'italic'|'oblique'} [font_style] - CSS font-style
 * @property {string} [color] - CSS color, e.g., "#333", "gray", "rgb(100,100,100)"
 * @property {string} [style] - Additional inline CSS styles
 */

/**
 * Image element - displays an image from a file path.
 *
 * @typedef {Object} ImageElement
 * @property {'image'} type - Element type identifier
 * @property {string} src - Path to image file (relative to Markdown file), supports SVG, PNG, JPG
 * @property {string} [height] - CSS height, e.g., "20px", "5mm"
 * @property {string} [width] - CSS width (usually omit to preserve aspect ratio)
 * @property {string} [alt] - Alt text for accessibility
 * @property {string} [style] - Additional inline CSS styles
 */

/**
 * Page number element - displays the current page number.
 *
 * @typedef {Object} PageNumberElement
 * @property {'page_number'} type - Element type identifier
 * @property {string} [format] - Format string, e.g., "Page {page}" (default is just the number)
 * @property {string} [font_size] - CSS font-size
 * @property {string} [color] - CSS color
 * @property {string} [style] - Additional inline CSS styles
 */

/**
 * Total pages element - displays the total number of pages.
 *
 * @typedef {Object} TotalPagesElement
 * @property {'total_pages'} type - Element type identifier
 * @property {string} [format] - Format string, e.g., "{pages} pages"
 * @property {string} [font_size] - CSS font-size
 * @property {string} [color] - CSS color
 * @property {string} [style] - Additional inline CSS styles
 */

/**
 * Date element - displays a formatted date/time.
 *
 * @typedef {Object} DateElement
 * @property {'date'} type - Element type identifier
 * @property {string} [format] - date-fns format string, e.g., "yyyy-MM-dd", "MMMM d, yyyy", "MM/dd/yyyy"
 * @property {string} [font_size] - CSS font-size
 * @property {string} [color] - CSS color
 * @property {string} [style] - Additional inline CSS styles
 */

/**
 * Title element - displays the document title.
 *
 * @typedef {Object} TitleElement
 * @property {'title'} type - Element type identifier
 * @property {string} [font_size] - CSS font-size
 * @property {string|number} [font_weight] - CSS font-weight
 * @property {string} [color] - CSS color
 * @property {string} [fallback] - Fallback text if no title is found
 * @property {string} [style] - Additional inline CSS styles
 */

/**
 * Spacer element - adds flexible or fixed space between elements.
 *
 * @typedef {Object} SpacerElement
 * @property {'spacer'} type - Element type identifier
 * @property {string} [width] - Fixed width, e.g., "10mm", "20px". If omitted, uses flex: 1
 */

/**
 * Any element that can appear in a header/footer zone.
 *
 * @typedef {TextElement|ImageElement|PageNumberElement|TotalPagesElement|DateElement|TitleElement|SpacerElement} Element
 */

/**
 * A zone can contain a single element or an array of elements.
 *
 * @typedef {Element|Element[]} Zone
 */

// ─────────────────────────────────────────────────────────────────────────────
// Header/Footer Structure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Structured configuration for a header or footer.
 *
 * @typedef {Object} HeaderFooterConfig
 * @property {string} [height] - Height of the header/footer area, e.g., "15mm", "0.5in"
 * @property {string} [padding] - CSS padding, e.g., "0 10mm"
 * @property {string} [font_family] - CSS font-family for all text in this section
 * @property {string} [font_size] - Default font-size for all elements
 * @property {string} [color] - Default text color
 * @property {string} [border_bottom] - For header: bottom border, e.g., "1px solid #ccc"
 * @property {string} [border_top] - For footer: top border, e.g., "1px solid #ccc"
 * @property {string} [background] - Background color or CSS background value
 * @property {string} [style] - Additional inline CSS styles for the container
 *
 * @property {Zone} [left] - Left zone content (single element or array)
 * @property {Zone} [center] - Center zone content (single element or array)
 * @property {Zone} [right] - Right zone content (single element or array)
 *
 * // Shorthand properties (alternative to full element definitions)
 * @property {string} [left_text] - Shorthand: text content for left zone
 * @property {string} [left_image] - Shorthand: image path for left zone
 * @property {string} [left_image_height] - Shorthand: height for left_image
 * @property {string} [center_text] - Shorthand: text content for center zone
 * @property {string} [center_image] - Shorthand: image path for center zone
 * @property {string} [center_image_height] - Shorthand: height for center_image
 * @property {string} [right_text] - Shorthand: text content for right zone
 * @property {string} [right_image] - Shorthand: image path for right zone
 * @property {string} [right_image_height] - Shorthand: height for right_image
 */

// ─────────────────────────────────────────────────────────────────────────────
// Front Matter Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PDF configuration block that can appear in front matter under `pdf:`.
 *
 * @typedef {Object} FrontMatterPdfConfig
 * @property {HeaderFooterConfig} [header] - Header configuration
 * @property {HeaderFooterConfig} [footer] - Footer configuration
 * @property {boolean} [display_header_footer] - Enable/disable header and footer
 *
 * // Additional overridable settings from front matter
 * @property {string} [page_format] - Paper size (A4, Letter, etc.)
 * @property {'portrait'|'landscape'} [orientation] - Page orientation
 * @property {number} [scale] - Zoom factor (0.1 - 2)
 * @property {string} [page_ranges] - Pages to print, e.g., "1-5, 8"
 * @property {boolean} [print_background] - Print background colors/images
 * @property {MarginConfig} [margin] - Page margins
 * @property {string} [font_family] - CSS font-family
 * @property {string} [stylesheet_path] - Custom CSS file path
 * @property {boolean} [include_default_styles] - Include built-in styles
 * @property {boolean} [highlight] - Enable syntax highlighting
 * @property {string} [highlight_style] - Highlight.js theme
 * @property {boolean} [breaks] - Convert newlines to <br>
 * @property {boolean} [emoji] - Render emoji shortcodes
 */

/**
 * Page margin configuration.
 *
 * @typedef {Object} MarginConfig
 * @property {string} [top] - Top margin, e.g., "15mm", "0.5in"
 * @property {string} [right] - Right margin
 * @property {string} [bottom] - Bottom margin
 * @property {string} [left] - Left margin
 */

/**
 * Front matter extracted from a Markdown document.
 *
 * @typedef {Object} ParsedFrontMatter
 * @property {string} [title] - Document title
 * @property {string} [author] - Document author
 * @property {string} [date] - Document date
 * @property {FrontMatterPdfConfig} [markdown-pdf] - PDF export configuration
 * @property {Object.<string, any>} [custom] - Any other custom variables (accessible as {varname} placeholders)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Context
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Context passed to the HTML generator for placeholder resolution.
 *
 * @typedef {Object} RenderContext
 * @property {string} title - Document title (from front matter, H1, or filename)
 * @property {string} [author] - Document author from front matter
 * @property {string} filename - Source filename without path
 * @property {string} inputPath - Full path to the input Markdown file
 * @property {Date} now - Current date/time for date placeholders
 * @property {Object.<string, string>} [customVariables] - Custom front matter variables
 */

/**
 * Result from asset resolution (image path to data URI).
 *
 * @typedef {Object} ResolvedAsset
 * @property {string} dataUri - Base64 data URI
 * @property {string} mimeType - MIME type (image/svg+xml, image/png, image/jpeg)
 * @property {number} size - Original file size in bytes
 * @property {boolean} oversized - True if size exceeds warning threshold
 */

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validation error for structured configuration.
 *
 * @typedef {Object} ValidationError
 * @property {string} path - JSON path to the invalid property, e.g., "header.left[0].type"
 * @property {string} message - Human-readable error message
 * @property {any} [value] - The invalid value (if applicable)
 */

/**
 * Result of validating a structured configuration.
 *
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - True if configuration is valid
 * @property {ValidationError[]} errors - Array of validation errors (empty if valid)
 * @property {ValidationError[]} warnings - Array of validation warnings (non-fatal issues)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valid element types.
 * @type {readonly string[]}
 */
export const ELEMENT_TYPES = Object.freeze([
  "text",
  "image",
  "page_number",
  "total_pages",
  "date",
  "title",
  "spacer",
]);

/**
 * Supported image formats with their MIME types.
 * @type {Readonly<Object.<string, string>>}
 */
export const IMAGE_FORMATS = Object.freeze({
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
});

/**
 * Default image size warning threshold (500KB).
 * @type {number}
 */
export const IMAGE_SIZE_WARNING_THRESHOLD = 500 * 1024;

/**
 * Placeholder pattern for matching {name} and {name:format} syntax.
 * @type {RegExp}
 */
export const PLACEHOLDER_PATTERN = /\{(\w+)(?::([^}]+))?\}/g;

/**
 * Built-in placeholders that have special handling.
 * @type {readonly string[]}
 */
export const BUILTIN_PLACEHOLDERS = Object.freeze([
  "page",
  "pages",
  "date",
  "time",
  "datetime",
  "title",
  "filename",
  "author",
]);

/**
 * Shorthand property mappings to full element definitions.
 * Maps shorthand keys to their zone and element type.
 *
 * @type {Readonly<Object.<string, {zone: string, type: string, property: string}>>}
 */
export const SHORTHAND_MAPPINGS = Object.freeze({
  left_text: { zone: "left", type: "text", property: "content" },
  left_image: { zone: "left", type: "image", property: "src" },
  left_image_height: { zone: "left", type: "image", property: "height" },
  center_text: { zone: "center", type: "text", property: "content" },
  center_image: { zone: "center", type: "image", property: "src" },
  center_image_height: { zone: "center", type: "image", property: "height" },
  right_text: { zone: "right", type: "text", property: "content" },
  right_image: { zone: "right", type: "image", property: "src" },
  right_image_height: { zone: "right", type: "image", property: "height" },
});

/**
 * Default header configuration when using structured config but no explicit header.
 * @type {null}
 */
export const DEFAULT_HEADER = null;

/**
 * Default footer configuration when using structured config.
 * Shows centered page number.
 *
 * @type {HeaderFooterConfig}
 */
export const DEFAULT_FOOTER = Object.freeze({
  height: "10mm",
  center: {
    type: "text",
    content: "{page} / {pages}",
    font_size: "9px",
  },
});

/**
 * VitePress documentation URL.
 * @type {string}
 */
export const DOCS_URL = "https://matinfo.github.io/zed-markdown-pdf/";
