/**
 * @fileoverview Front matter parser for Markdown documents.
 *
 * This module handles:
 * - Extracting YAML front matter from Markdown content
 * - Parsing the `markdown-pdf:` configuration block
 * - Extracting document metadata (title, author, date)
 * - Collecting custom variables for placeholder resolution
 * - Validating the extracted configuration
 *
 * @module frontmatter-parser
 */

import { parse as parseYaml } from "yaml";

import { validateFrontMatterConfig } from "./schema-validator.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Front matter delimiter.
 * @type {string}
 */
const FRONTMATTER_DELIMITER = "---";

/**
 * Key for PDF configuration in front matter.
 * @type {string}
 */
const PDF_CONFIG_KEY = "markdown-pdf";

/**
 * Known front matter fields that have special handling.
 * @type {Set<string>}
 */
const KNOWN_FIELDS = new Set([
  "title",
  "author",
  "date",
  PDF_CONFIG_KEY,
]);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ParsedFrontMatter
 * @property {string|null} title - Document title from front matter
 * @property {string|null} author - Document author
 * @property {string|null} date - Document date
 * @property {import('./types.mjs').FrontMatterPdfConfig|null} pdfConfig - PDF configuration
 * @property {Object.<string, any>} customVariables - Custom variables for placeholders
 * @property {Object.<string, any>} raw - Raw parsed YAML object
 */

/**
 * @typedef {Object} SplitResult
 * @property {string} frontMatter - Raw YAML front matter string (without delimiters)
 * @property {string} body - Markdown body (after front matter)
 * @property {boolean} hasFrontMatter - Whether front matter was found
 */

/**
 * @typedef {Object} ParseResult
 * @property {ParsedFrontMatter} data - Parsed front matter data
 * @property {string} body - Markdown body (after front matter)
 * @property {import('./types.mjs').ValidationResult} validation - Validation result
 * @property {Error|null} parseError - YAML parse error, if any
 */

// ─────────────────────────────────────────────────────────────────────────────
// Front Matter Extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if content starts with front matter delimiter.
 *
 * @param {string} content - Markdown content
 * @returns {boolean}
 */
export function hasFrontMatter(content) {
  if (typeof content !== "string") {
    return false;
  }

  return content.startsWith(`${FRONTMATTER_DELIMITER}\n`) ||
         content.startsWith(`${FRONTMATTER_DELIMITER}\r\n`);
}

/**
 * Split content into front matter and body.
 *
 * @param {string} content - Full Markdown content
 * @returns {SplitResult}
 */
export function splitFrontMatter(content) {
  if (typeof content !== "string" || !hasFrontMatter(content)) {
    return {
      frontMatter: "",
      body: content || "",
      hasFrontMatter: false,
    };
  }

  // Find the closing delimiter
  // Look for \n---\n or \r\n---\r\n
  const startIndex = content.indexOf("\n") + 1; // After first ---\n

  // Find the closing delimiter
  let endIndex = content.indexOf(`\n${FRONTMATTER_DELIMITER}\n`, startIndex);
  let delimiterLength = 5; // \n---\n

  if (endIndex === -1) {
    // Try Windows line endings
    endIndex = content.indexOf(`\r\n${FRONTMATTER_DELIMITER}\r\n`, startIndex);
    delimiterLength = 7; // \r\n---\r\n
  }

  if (endIndex === -1) {
    // Try end of file (no newline after closing ---)
    endIndex = content.indexOf(`\n${FRONTMATTER_DELIMITER}`, startIndex);
    if (endIndex !== -1) {
      const afterDelim = content.substring(endIndex + 4);
      if (afterDelim === "" || afterDelim === "\n" || afterDelim === "\r\n") {
        delimiterLength = 4 + afterDelim.length;
      } else {
        endIndex = -1; // Not a valid closing delimiter
      }
    }
  }

  if (endIndex === -1) {
    // No closing delimiter found - treat as no front matter
    return {
      frontMatter: "",
      body: content,
      hasFrontMatter: false,
    };
  }

  const frontMatter = content.substring(startIndex, endIndex);
  const body = content.substring(endIndex + delimiterLength);

  return {
    frontMatter,
    body,
    hasFrontMatter: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// YAML Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse YAML front matter string.
 *
 * @param {string} yamlString - YAML content
 * @returns {{data: Object|null, error: Error|null}}
 */
export function parseYamlFrontMatter(yamlString) {
  if (!yamlString || typeof yamlString !== "string" || !yamlString.trim()) {
    return { data: null, error: null };
  }

  try {
    const data = parseYaml(yamlString);

    // YAML can parse to non-objects (e.g., just a string)
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return { data: null, error: null };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Extraction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract title from front matter or find first H1 in body.
 *
 * @param {Object|null} frontMatter - Parsed front matter
 * @param {string} body - Markdown body
 * @param {string} [filename] - Filename as fallback
 * @returns {string|null}
 */
export function extractTitle(frontMatter, body, filename = null) {
  // Priority 1: Front matter title
  if (frontMatter?.title) {
    const title = String(frontMatter.title).trim();
    // Remove quotes if present
    return title.replace(/^['"]|['"]$/g, "");
  }

  // Priority 2: First H1 in body
  if (body) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }
  }

  // Priority 3: Filename stem
  if (filename) {
    const stem = filename.replace(/\.[^.]+$/, "");
    return stem;
  }

  return null;
}

/**
 * Extract author from front matter.
 *
 * @param {Object|null} frontMatter - Parsed front matter
 * @returns {string|null}
 */
export function extractAuthor(frontMatter) {
  if (!frontMatter?.author) {
    return null;
  }

  // Handle array of authors
  if (Array.isArray(frontMatter.author)) {
    return frontMatter.author.map(String).join(", ");
  }

  return String(frontMatter.author).trim();
}

/**
 * Extract date from front matter.
 *
 * @param {Object|null} frontMatter - Parsed front matter
 * @returns {string|null}
 */
export function extractDate(frontMatter) {
  if (!frontMatter?.date) {
    return null;
  }

  // Handle Date object
  if (frontMatter.date instanceof Date) {
    return frontMatter.date.toISOString().slice(0, 10);
  }

  return String(frontMatter.date).trim();
}

/**
 * Extract PDF configuration from front matter.
 *
 * @param {Object|null} frontMatter - Parsed front matter
 * @returns {import('./types.mjs').FrontMatterPdfConfig|null}
 */
export function extractPdfConfig(frontMatter) {
  if (!frontMatter || !frontMatter[PDF_CONFIG_KEY]) {
    return null;
  }

  const config = frontMatter[PDF_CONFIG_KEY];

  // Must be an object
  if (typeof config !== "object" || Array.isArray(config) || config === null) {
    return null;
  }

  return config;
}

/**
 * Extract custom variables from front matter.
 * These are any fields not in the known fields list.
 *
 * @param {Object|null} frontMatter - Parsed front matter
 * @returns {Object.<string, any>}
 */
export function extractCustomVariables(frontMatter) {
  if (!frontMatter || typeof frontMatter !== "object") {
    return {};
  }

  const variables = {};

  for (const [key, value] of Object.entries(frontMatter)) {
    if (!KNOWN_FIELDS.has(key) && value !== null && value !== undefined) {
      // Convert to string for simple values, keep objects/arrays as-is
      if (typeof value === "object") {
        variables[key.toLowerCase()] = value;
      } else {
        variables[key.toLowerCase()] = String(value);
      }
    }
  }

  return variables;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse front matter from Markdown content.
 *
 * @param {string} content - Full Markdown content
 * @param {Object} [options] - Parse options
 * @param {string} [options.filename] - Filename for title fallback
 * @param {boolean} [options.validate=true] - Whether to validate PDF config
 * @returns {ParseResult}
 *
 * @example
 * const content = `---
 * title: My Document
 * author: Jane Doe
 * markdown-pdf:
 *   header:
 *     left_image: ./logo.svg
 * ---
 *
 * # Content here
 * `;
 *
 * const result = parseFrontMatter(content, { filename: 'doc.md' });
 * console.log(result.data.title); // "My Document"
 * console.log(result.data.pdfConfig); // { header: { left_image: './logo.svg' } }
 */
export function parseFrontMatter(content, options = {}) {
  const { filename, validate = true } = options;

  // Default result
  const emptyResult = {
    data: {
      title: filename ? filename.replace(/\.[^.]+$/, "") : null,
      author: null,
      date: null,
      pdfConfig: null,
      customVariables: {},
      raw: {},
    },
    body: content || "",
    validation: { valid: true, errors: [], warnings: [] },
    parseError: null,
  };

  // Handle non-string input
  if (typeof content !== "string") {
    return emptyResult;
  }

  // Split front matter from body
  const { frontMatter, body, hasFrontMatter: found } = splitFrontMatter(content);

  if (!found) {
    // Try to extract title from H1
    emptyResult.data.title = extractTitle(null, content, filename);
    return emptyResult;
  }

  // Parse YAML
  const { data: raw, error: parseError } = parseYamlFrontMatter(frontMatter);

  if (parseError) {
    return {
      data: {
        title: filename ? filename.replace(/\.[^.]+$/, "") : null,
        author: null,
        date: null,
        pdfConfig: null,
        customVariables: {},
        raw: {},
      },
      body,
      validation: { valid: true, errors: [], warnings: [] },
      parseError,
    };
  }

  if (!raw) {
    return {
      ...emptyResult,
      body,
      data: {
        ...emptyResult.data,
        title: extractTitle(null, body, filename),
      },
    };
  }

  // Extract data
  const pdfConfig = extractPdfConfig(raw);

  // Validate PDF config if requested
  let validation = { valid: true, errors: [], warnings: [] };
  if (validate && pdfConfig) {
    validation = validateFrontMatterConfig(pdfConfig);
  }

  return {
    data: {
      title: extractTitle(raw, body, filename),
      author: extractAuthor(raw),
      date: extractDate(raw),
      pdfConfig,
      customVariables: extractCustomVariables(raw),
      raw,
    },
    body,
    validation,
    parseError: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract only the PDF configuration from content.
 * Useful when you only need the config and don't need other metadata.
 *
 * @param {string} content - Markdown content
 * @returns {import('./types.mjs').FrontMatterPdfConfig|null}
 */
export function extractPdfConfigFromContent(content) {
  const { data } = parseFrontMatter(content, { validate: false });
  return data.pdfConfig;
}

/**
 * Check if content has PDF configuration in front matter.
 *
 * @param {string} content - Markdown content
 * @returns {boolean}
 */
export function hasPdfConfig(content) {
  return extractPdfConfigFromContent(content) !== null;
}

/**
 * Get just the body content without front matter.
 *
 * @param {string} content - Full Markdown content
 * @returns {string}
 */
export function getBody(content) {
  const { body } = splitFrontMatter(content);
  return body;
}

/**
 * Create front matter YAML string from an object.
 * Useful for generating or modifying front matter.
 *
 * @param {Object} data - Data to convert to YAML
 * @returns {string} YAML string with delimiters
 */
export function createFrontMatter(data) {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    return "";
  }

  // Import stringify from yaml - we'll construct manually for simplicity
  const lines = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "string") {
      // Quote strings that might be ambiguous
      if (value.includes(":") || value.includes("#") || value.startsWith("'") || value.startsWith('"')) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === "number" || typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === "object") {
      // For objects, we'd need proper YAML serialization
      // For now, just note that this is a simplified implementation
      lines.push(`${key}:`);
      lines.push(`  # Complex object - use yaml.stringify for full support`);
    }
  }

  lines.push("---");
  return lines.join("\n") + "\n";
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} FrontMatterParserOptions
 * @property {boolean} [validate=true] - Whether to validate PDF config
 * @property {boolean} [extractH1=true] - Whether to extract title from H1
 */

/**
 * @typedef {Object} FrontMatterParser
 * @property {(content: string, filename?: string) => ParseResult} parse - Parse content
 * @property {(content: string) => boolean} hasFrontMatter - Check for front matter
 * @property {(content: string) => boolean} hasPdfConfig - Check for PDF config
 * @property {(content: string) => string} getBody - Get body without front matter
 */

/**
 * Create a front matter parser with preset options.
 *
 * @param {FrontMatterParserOptions} [options={}] - Parser options
 * @returns {FrontMatterParser}
 *
 * @example
 * const parser = createFrontMatterParser({ validate: true });
 *
 * const result = parser.parse(markdownContent, 'document.md');
 * if (result.validation.valid) {
 *   console.log('Config is valid:', result.data.pdfConfig);
 * }
 */
export function createFrontMatterParser(options = {}) {
  const { validate = true } = options;

  return {
    /**
     * Parse front matter from content.
     *
     * @param {string} content - Markdown content
     * @param {string} [filename] - Filename for title fallback
     * @returns {ParseResult}
     */
    parse(content, filename) {
      return parseFrontMatter(content, { filename, validate });
    },

    /**
     * Check if content has front matter.
     *
     * @param {string} content - Markdown content
     * @returns {boolean}
     */
    hasFrontMatter(content) {
      return hasFrontMatter(content);
    },

    /**
     * Check if content has PDF configuration.
     *
     * @param {string} content - Markdown content
     * @returns {boolean}
     */
    hasPdfConfig(content) {
      return hasPdfConfig(content);
    },

    /**
     * Get body without front matter.
     *
     * @param {string} content - Markdown content
     * @returns {string}
     */
    getBody(content) {
      return getBody(content);
    },
  };
}
