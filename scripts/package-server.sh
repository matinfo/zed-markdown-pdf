#!/usr/bin/env bash
# scripts/package-server.sh
#
# Builds the server release asset expected by the Zed extension.
#
# The extension's Rust code downloads `markdown-pdf-server.tar.gz` from a
# GitHub release and extracts it into its working directory.  The archive must
# contain the following files at the **root level** (no subdirectory wrapper):
#
#   markdown_pdf_server.mjs
#   default.css
#   package.json
#
# Usage:
#   ./scripts/package-server.sh [output-dir]
#
# Examples:
#   ./scripts/package-server.sh              # writes to dist/
#   ./scripts/package-server.sh /tmp/release # writes to /tmp/release/
#
# After running this script, attach the resulting .tar.gz to the GitHub release
# tagged `server-v<VERSION>` (matching SERVER_RELEASE_TAG in src/lib.rs).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"
OUTPUT_DIR="${1:-$REPO_ROOT/dist}"
ARCHIVE_NAME="markdown-pdf-server.tar.gz"

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
for f in markdown_pdf_server.mjs default.css package.json; do
  if [[ ! -f "$SERVER_DIR/$f" ]]; then
    echo "ERROR: $SERVER_DIR/$f not found" >&2
    exit 1
  fi
done

# Bundle KaTeX CSS with inlined fonts (writes server/vendor/katex-inline.css).
if [[ -d "$SERVER_DIR/node_modules/katex" ]]; then
  echo "Bundling KaTeX CSS…"
  node "$SERVER_DIR/scripts/bundle-katex-css.mjs"
else
  echo "WARN: katex not installed; skipping vendor/katex-inline.css build" >&2
fi

mkdir -p "$OUTPUT_DIR"

# ---------------------------------------------------------------------------
# Build archive
# Explicitly list the files so that node_modules and other dev artifacts are
# excluded, and so that the files land at the archive root (no directory
# wrapper).
# ---------------------------------------------------------------------------
ARCHIVE_PATH="$OUTPUT_DIR/$ARCHIVE_NAME"

TAR_ARGS=(
  -C "$SERVER_DIR"
  markdown_pdf_server.mjs
  default.css
  package.json
)

[[ -f "$SERVER_DIR/package-lock.json" ]] && TAR_ARGS+=(package-lock.json)
[[ -d "$SERVER_DIR/lib" ]] && TAR_ARGS+=(lib)
[[ -d "$SERVER_DIR/scripts" ]] && TAR_ARGS+=(scripts)
[[ -d "$SERVER_DIR/vendor" ]] && TAR_ARGS+=(vendor)

tar -czf "$ARCHIVE_PATH" "${TAR_ARGS[@]}"

echo "Created $ARCHIVE_PATH"

# Print a quick sanity-check of the archive contents.
echo ""
echo "Archive contents:"
tar -tzf "$ARCHIVE_PATH"
