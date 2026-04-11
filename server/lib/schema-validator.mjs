/**
 * @fileoverview Schema validator for structured header/footer configuration.
 *
 * Validates the declarative header/footer configuration and provides
 * helpful error messages for invalid configurations.
 *
 * @module schema-validator
 */

import {
  ELEMENT_TYPES,
  IMAGE_FORMATS,
  SHORTHAND_MAPPINGS,
} from "./types.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a validation error object.
 *
 * @param {string} path - JSON path to the invalid property
 * @param {string} message - Human-readable error message
 * @param {any} [value] - The invalid value
 * @returns {import('./types.mjs').ValidationError}
 */
function createError(path, message, value = undefined) {
  const error = { path, message };
  if (value !== undefined) {
    error.value = value;
  }
  return error;
}

/**
 * Create a validation warning object.
 *
 * @param {string} path - JSON path to the property
 * @param {string} message - Human-readable warning message
 * @param {any} [value] - The value that triggered the warning
 * @returns {import('./types.mjs').ValidationError}
 */
function createWarning(path, message, value = undefined) {
  return createError(path, message, value);
}

/**
 * Check if a value is a non-empty string.
 *
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if a value is a valid CSS length (e.g., "10px", "15mm", "1in").
 *
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isCssLength(value) {
  if (typeof value !== "string") return false;
  // Match number followed by unit, or just "0"
  return /^-?\d*\.?\d+(px|pt|em|rem|mm|cm|in|%|vh|vw)?$/.test(value.trim()) || value.trim() === "0";
}

/**
 * Check if a value is a valid CSS color.
 * This is a permissive check - accepts hex, rgb, rgba, hsl, hsla, and named colors.
 *
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isCssColor(value) {
  if (typeof value !== "string") return false;
  const v = value.trim().toLowerCase();
  // Hex colors
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(v)) return true;
  // rgb/rgba/hsl/hsla
  if (/^(rgb|rgba|hsl|hsla)\([^)]+\)$/.test(v)) return true;
  // Named colors (permissive - just check it's alphabetic)
  if (/^[a-z]+$/.test(v)) return true;
  return false;
}

/**
 * Check if a value is a valid font-weight.
 *
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isFontWeight(value) {
  if (typeof value === "number") {
    return value >= 1 && value <= 1000;
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return ["normal", "bold", "bolder", "lighter"].includes(v) ||
           /^\d{1,4}$/.test(v);
  }
  return false;
}

/**
 * Check if a value is a valid font-style.
 *
 * @param {any} value - Value to check
 * @returns {boolean}
 */
function isFontStyle(value) {
  if (typeof value !== "string") return false;
  return ["normal", "italic", "oblique"].includes(value.trim().toLowerCase());
}

/**
 * Check if a file extension is a supported image format.
 *
 * @param {string} path - File path
 * @returns {boolean}
 */
function isSupportedImageFormat(path) {
  if (typeof path !== "string") return false;
  const ext = path.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? ext in IMAGE_FORMATS : false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Element Validators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a text element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateTextElement(element, path) {
  const errors = [];
  const warnings = [];

  if (!isNonEmptyString(element.content)) {
    errors.push(createError(`${path}.content`, "Text element requires a non-empty 'content' string", element.content));
  }

  if (element.font_size !== undefined && !isCssLength(element.font_size)) {
    warnings.push(createWarning(`${path}.font_size`, `Invalid CSS length: "${element.font_size}". Expected format like "10px", "9pt", "1em"`, element.font_size));
  }

  if (element.font_weight !== undefined && !isFontWeight(element.font_weight)) {
    warnings.push(createWarning(`${path}.font_weight`, `Invalid font-weight: "${element.font_weight}". Expected "normal", "bold", or a number 1-1000`, element.font_weight));
  }

  if (element.font_style !== undefined && !isFontStyle(element.font_style)) {
    warnings.push(createWarning(`${path}.font_style`, `Invalid font-style: "${element.font_style}". Expected "normal", "italic", or "oblique"`, element.font_style));
  }

  if (element.color !== undefined && !isCssColor(element.color)) {
    warnings.push(createWarning(`${path}.color`, `Possibly invalid CSS color: "${element.color}"`, element.color));
  }

  return { errors, warnings };
}

/**
 * Validate an image element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateImageElement(element, path) {
  const errors = [];
  const warnings = [];

  if (!isNonEmptyString(element.src)) {
    errors.push(createError(`${path}.src`, "Image element requires a non-empty 'src' path", element.src));
  } else if (!isSupportedImageFormat(element.src)) {
    const ext = element.src.match(/\.[^.]+$/)?.[0] || "(no extension)";
    warnings.push(createWarning(`${path}.src`, `Unsupported image format: "${ext}". Supported formats: SVG, PNG, JPG`, element.src));
  }

  if (element.height !== undefined && !isCssLength(element.height)) {
    warnings.push(createWarning(`${path}.height`, `Invalid CSS length for height: "${element.height}"`, element.height));
  }

  if (element.width !== undefined && !isCssLength(element.width)) {
    warnings.push(createWarning(`${path}.width`, `Invalid CSS length for width: "${element.width}"`, element.width));
  }

  return { errors, warnings };
}

/**
 * Validate a page_number element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validatePageNumberElement(element, path) {
  const errors = [];
  const warnings = [];

  if (element.format !== undefined && typeof element.format !== "string") {
    errors.push(createError(`${path}.format`, "Format must be a string", element.format));
  }

  if (element.font_size !== undefined && !isCssLength(element.font_size)) {
    warnings.push(createWarning(`${path}.font_size`, `Invalid CSS length: "${element.font_size}"`, element.font_size));
  }

  if (element.color !== undefined && !isCssColor(element.color)) {
    warnings.push(createWarning(`${path}.color`, `Possibly invalid CSS color: "${element.color}"`, element.color));
  }

  return { errors, warnings };
}

/**
 * Validate a total_pages element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateTotalPagesElement(element, path) {
  // Same validation as page_number
  return validatePageNumberElement(element, path);
}

/**
 * Validate a date element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateDateElement(element, path) {
  const errors = [];
  const warnings = [];

  if (element.format !== undefined && typeof element.format !== "string") {
    errors.push(createError(`${path}.format`, "Date format must be a string (date-fns format)", element.format));
  }

  if (element.font_size !== undefined && !isCssLength(element.font_size)) {
    warnings.push(createWarning(`${path}.font_size`, `Invalid CSS length: "${element.font_size}"`, element.font_size));
  }

  if (element.color !== undefined && !isCssColor(element.color)) {
    warnings.push(createWarning(`${path}.color`, `Possibly invalid CSS color: "${element.color}"`, element.color));
  }

  return { errors, warnings };
}

/**
 * Validate a title element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateTitleElement(element, path) {
  const errors = [];
  const warnings = [];

  if (element.font_size !== undefined && !isCssLength(element.font_size)) {
    warnings.push(createWarning(`${path}.font_size`, `Invalid CSS length: "${element.font_size}"`, element.font_size));
  }

  if (element.font_weight !== undefined && !isFontWeight(element.font_weight)) {
    warnings.push(createWarning(`${path}.font_weight`, `Invalid font-weight: "${element.font_weight}"`, element.font_weight));
  }

  if (element.color !== undefined && !isCssColor(element.color)) {
    warnings.push(createWarning(`${path}.color`, `Possibly invalid CSS color: "${element.color}"`, element.color));
  }

  if (element.fallback !== undefined && typeof element.fallback !== "string") {
    errors.push(createError(`${path}.fallback`, "Fallback must be a string", element.fallback));
  }

  return { errors, warnings };
}

/**
 * Validate a spacer element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateSpacerElement(element, path) {
  const errors = [];
  const warnings = [];

  if (element.width !== undefined && !isCssLength(element.width)) {
    warnings.push(createWarning(`${path}.width`, `Invalid CSS length for width: "${element.width}"`, element.width));
  }

  return { errors, warnings };
}

/**
 * Validate a single element.
 *
 * @param {any} element - Element to validate
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateElement(element, path) {
  const errors = [];
  const warnings = [];

  if (element === null || element === undefined) {
    errors.push(createError(path, "Element cannot be null or undefined"));
    return { errors, warnings };
  }

  if (typeof element !== "object" || Array.isArray(element)) {
    errors.push(createError(path, "Element must be an object", element));
    return { errors, warnings };
  }

  if (!element.type) {
    errors.push(createError(`${path}.type`, "Element requires a 'type' property"));
    return { errors, warnings };
  }

  if (!ELEMENT_TYPES.includes(element.type)) {
    errors.push(createError(
      `${path}.type`,
      `Invalid element type: "${element.type}". Valid types: ${ELEMENT_TYPES.join(", ")}`,
      element.type
    ));
    return { errors, warnings };
  }

  // Validate based on element type
  let result;
  switch (element.type) {
    case "text":
      result = validateTextElement(element, path);
      break;
    case "image":
      result = validateImageElement(element, path);
      break;
    case "page_number":
      result = validatePageNumberElement(element, path);
      break;
    case "total_pages":
      result = validateTotalPagesElement(element, path);
      break;
    case "date":
      result = validateDateElement(element, path);
      break;
    case "title":
      result = validateTitleElement(element, path);
      break;
    case "spacer":
      result = validateSpacerElement(element, path);
      break;
    default:
      // Already validated type above, shouldn't reach here
      break;
  }

  if (result) {
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { errors, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Validators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a zone (left, center, or right).
 *
 * @param {any} zone - Zone content (element or array of elements)
 * @param {string} path - JSON path for error reporting
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateZone(zone, path) {
  const errors = [];
  const warnings = [];

  // null means explicitly remove this zone - valid
  if (zone === null) {
    return { errors, warnings };
  }

  // Array of elements
  if (Array.isArray(zone)) {
    if (zone.length === 0) {
      warnings.push(createWarning(path, "Empty zone array - zone will be empty"));
    }
    zone.forEach((element, index) => {
      const result = validateElement(element, `${path}[${index}]`);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });
    return { errors, warnings };
  }

  // Single element (object)
  if (typeof zone === "object") {
    const result = validateElement(zone, path);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    return { errors, warnings };
  }

  errors.push(createError(path, "Zone must be an element object, array of elements, or null", zone));
  return { errors, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Header/Footer Validator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a header or footer configuration.
 *
 * @param {any} config - Header or footer configuration
 * @param {string} path - JSON path for error reporting (e.g., "header" or "footer")
 * @returns {{errors: import('./types.mjs').ValidationError[], warnings: import('./types.mjs').ValidationError[]}}
 */
function validateHeaderFooter(config, path) {
  const errors = [];
  const warnings = [];

  // null means no header/footer - valid
  if (config === null || config === undefined) {
    return { errors, warnings };
  }

  if (typeof config !== "object" || Array.isArray(config)) {
    errors.push(createError(path, "Header/footer configuration must be an object", config));
    return { errors, warnings };
  }

  // Validate container properties
  if (config.height !== undefined && !isCssLength(config.height)) {
    warnings.push(createWarning(`${path}.height`, `Invalid CSS length: "${config.height}"`, config.height));
  }

  if (config.font_size !== undefined && !isCssLength(config.font_size)) {
    warnings.push(createWarning(`${path}.font_size`, `Invalid CSS length: "${config.font_size}"`, config.font_size));
  }

  if (config.color !== undefined && !isCssColor(config.color)) {
    warnings.push(createWarning(`${path}.color`, `Possibly invalid CSS color: "${config.color}"`, config.color));
  }

  if (config.background !== undefined && typeof config.background !== "string") {
    warnings.push(createWarning(`${path}.background`, "Background should be a CSS value string", config.background));
  }

  // Validate zones
  const zones = ["left", "center", "right"];
  for (const zone of zones) {
    if (config[zone] !== undefined) {
      const result = validateZone(config[zone], `${path}.${zone}`);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }

  // Check for shorthand properties
  const shorthandKeys = Object.keys(SHORTHAND_MAPPINGS);
  const usedShorthands = shorthandKeys.filter((key) => config[key] !== undefined);
  const usedZones = zones.filter((zone) => config[zone] !== undefined);

  // Warn if mixing shorthand and full zone definitions for the same zone
  for (const shorthand of usedShorthands) {
    const mapping = SHORTHAND_MAPPINGS[shorthand];
    if (usedZones.includes(mapping.zone)) {
      warnings.push(createWarning(
        `${path}.${shorthand}`,
        `Shorthand "${shorthand}" is ignored because "${mapping.zone}" zone is also defined`,
        config[shorthand]
      ));
    }
  }

  // Validate shorthand values
  for (const shorthand of usedShorthands) {
    const value = config[shorthand];
    const mapping = SHORTHAND_MAPPINGS[shorthand];

    if (shorthand.endsWith("_text")) {
      if (typeof value !== "string") {
        errors.push(createError(`${path}.${shorthand}`, "Text shorthand must be a string", value));
      }
    } else if (shorthand.endsWith("_image") && !shorthand.endsWith("_image_height")) {
      if (typeof value !== "string") {
        errors.push(createError(`${path}.${shorthand}`, "Image shorthand must be a file path string", value));
      } else if (!isSupportedImageFormat(value)) {
        warnings.push(createWarning(`${path}.${shorthand}`, "Unsupported image format. Supported: SVG, PNG, JPG", value));
      }
    } else if (shorthand.endsWith("_image_height")) {
      if (!isCssLength(value)) {
        warnings.push(createWarning(`${path}.${shorthand}`, `Invalid CSS length: "${value}"`, value));
      }
    }
  }

  return { errors, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Validation Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a structured PDF configuration (header and footer).
 *
 * @param {any} config - Configuration object with optional header and footer
 * @returns {import('./types.mjs').ValidationResult}
 */
export function validateStructuredConfig(config) {
  const errors = [];
  const warnings = [];

  if (config === null || config === undefined) {
    return { valid: true, errors: [], warnings: [] };
  }

  if (typeof config !== "object" || Array.isArray(config)) {
    return {
      valid: false,
      errors: [createError("", "Configuration must be an object", config)],
      warnings: [],
    };
  }

  // Validate header
  if (config.header !== undefined) {
    const result = validateHeaderFooter(config.header, "header");
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Validate footer
  if (config.footer !== undefined) {
    const result = validateHeaderFooter(config.footer, "footer");
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate front matter PDF configuration.
 *
 * @param {any} frontMatterConfig - The markdown-pdf block from front matter
 * @returns {import('./types.mjs').ValidationResult}
 */
export function validateFrontMatterConfig(frontMatterConfig) {
  const errors = [];
  const warnings = [];

  if (frontMatterConfig === null || frontMatterConfig === undefined) {
    return { valid: true, errors: [], warnings: [] };
  }

  if (typeof frontMatterConfig !== "object" || Array.isArray(frontMatterConfig)) {
    return {
      valid: false,
      errors: [createError("markdown-pdf", "Front matter markdown-pdf must be an object", frontMatterConfig)],
      warnings: [],
    };
  }

  // Validate header and footer
  const structuredResult = validateStructuredConfig(frontMatterConfig);
  errors.push(...structuredResult.errors);
  warnings.push(...structuredResult.warnings);

  // Validate other settings that can appear in front matter
  if (frontMatterConfig.display_header_footer !== undefined) {
    if (typeof frontMatterConfig.display_header_footer !== "boolean") {
      errors.push(createError(
        "markdown-pdf.display_header_footer",
        "display_header_footer must be a boolean",
        frontMatterConfig.display_header_footer
      ));
    }
  }

  if (frontMatterConfig.page_format !== undefined) {
    const validFormats = ["A4", "Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3", "A5", "A6"];
    if (!validFormats.includes(frontMatterConfig.page_format)) {
      errors.push(createError(
        "markdown-pdf.page_format",
        `Invalid page format: "${frontMatterConfig.page_format}". Valid: ${validFormats.join(", ")}`,
        frontMatterConfig.page_format
      ));
    }
  }

  if (frontMatterConfig.orientation !== undefined) {
    if (!["portrait", "landscape"].includes(frontMatterConfig.orientation)) {
      errors.push(createError(
        "markdown-pdf.orientation",
        `Invalid orientation: "${frontMatterConfig.orientation}". Must be "portrait" or "landscape"`,
        frontMatterConfig.orientation
      ));
    }
  }

  if (frontMatterConfig.scale !== undefined) {
    if (typeof frontMatterConfig.scale !== "number" || frontMatterConfig.scale < 0.1 || frontMatterConfig.scale > 2) {
      errors.push(createError(
        "markdown-pdf.scale",
        "Scale must be a number between 0.1 and 2",
        frontMatterConfig.scale
      ));
    }
  }

  if (frontMatterConfig.margin !== undefined) {
    if (typeof frontMatterConfig.margin !== "object" || Array.isArray(frontMatterConfig.margin)) {
      errors.push(createError("markdown-pdf.margin", "Margin must be an object", frontMatterConfig.margin));
    } else {
      for (const side of ["top", "right", "bottom", "left"]) {
        if (frontMatterConfig.margin[side] !== undefined && !isCssLength(frontMatterConfig.margin[side])) {
          warnings.push(createWarning(
            `markdown-pdf.margin.${side}`,
            `Invalid CSS length: "${frontMatterConfig.margin[side]}"`,
            frontMatterConfig.margin[side]
          ));
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors and warnings as a human-readable string.
 *
 * @param {import('./types.mjs').ValidationResult} result - Validation result
 * @returns {string} Formatted message
 */
export function formatValidationResult(result) {
  const lines = [];

  if (result.errors.length > 0) {
    lines.push("❌ Validation Errors:");
    for (const error of result.errors) {
      const path = error.path ? `[${error.path}] ` : "";
      lines.push(`   ${path}${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("⚠️  Validation Warnings:");
    for (const warning of result.warnings) {
      const path = warning.path ? `[${warning.path}] ` : "";
      lines.push(`   ${path}${warning.message}`);
    }
  }

  if (result.valid && result.warnings.length === 0) {
    lines.push("✅ Configuration is valid");
  }

  return lines.join("\n");
}

/**
 * Check if a configuration object uses structured header/footer format
 * (vs. raw HTML template strings).
 *
 * @param {any} config - Configuration object
 * @returns {boolean} True if using structured format
 */
export function isStructuredConfig(config) {
  if (!config || typeof config !== "object") {
    return false;
  }

  // Check if header or footer is an object (structured) vs string (raw HTML)
  if (config.header !== undefined && config.header !== null) {
    if (typeof config.header === "object") {
      return true;
    }
  }

  if (config.footer !== undefined && config.footer !== null) {
    if (typeof config.footer === "object") {
      return true;
    }
  }

  // Check for shorthand properties
  const shorthandKeys = Object.keys(SHORTHAND_MAPPINGS);
  for (const key of shorthandKeys) {
    if (config[key] !== undefined) {
      return true;
    }
  }

  return false;
}
