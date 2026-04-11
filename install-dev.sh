#!/usr/bin/env bash
# install-dev.sh — prepare the Markdown PDF extension for local Zed development
#
# What this script does:
#   1. Builds the WASM extension (requires Rust + wasm32-wasip1 target)
#   2. Installs npm dependencies in server/node_modules
#   3. Pre-installs the Chromium browser via the playwright-core CLI
#      (uses `node` directly — no npx / global tools needed)
#   4. Copies server files to Zed's work directory (so the WASM can find them
#      without needing a GitHub release download)
#   5. Prints the one-time Zed step to finish the installation
#
# After installation, the server files are also copied to Zed's work directory
# so the WASM can locate them without requiring a GitHub release download.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# ── Colour helpers ────────────────────────────────────────────────────────────
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red()    { printf '\033[31m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n'  "$*"; }

bold "Markdown PDF — Dev Extension Setup"
echo "======================================"
echo ""

# ── Platform detection ────────────────────────────────────────────────────────
case "$OSTYPE" in
    darwin*)
        ZED_EXTENSIONS_DIR="$HOME/Library/Application Support/Zed/extensions"
        ;;
    linux*)
        ZED_EXTENSIONS_DIR="$HOME/.local/share/zed/extensions"
        ;;
    *)
        red "Unsupported platform: $OSTYPE"
        exit 1
        ;;
esac

INSTALLED_DIR="$ZED_EXTENSIONS_DIR/installed/markdown-pdf"

echo "  Extension source : $SCRIPT_DIR"
echo "  Zed installed dir: $INSTALLED_DIR"
echo ""

# ── Step 1: Build WASM ────────────────────────────────────────────────────────
bold "[1/3] Building WASM extension…"

if ! command -v cargo &>/dev/null; then
    red "  Error: cargo not found."
    echo "  Install Rust from https://rustup.rs/ and re-run this script."
    exit 1
fi

if ! rustup target list --installed 2>/dev/null | grep -q "wasm32-wasip1"; then
    echo "  Installing wasm32-wasip1 target…"
    rustup target add wasm32-wasip1
fi

cargo build --target wasm32-wasip1 --release --quiet
cp target/wasm32-wasip1/release/markdown_pdf.wasm extension.wasm
green "  ✓ extension.wasm built"
echo ""

# ── Step 2: Refresh npm dependencies ────────────────────────────────────────
bold "[2/3] Installing npm dependencies…"

if ! command -v npm &>/dev/null; then
    red "  Error: npm not found."
    echo "  Install Node.js (>=18) from https://nodejs.org/ and re-run this script."
    exit 1
fi

cd server
npm install --no-audit --no-fund --silent
cd "$SCRIPT_DIR"
green "  ✓ server/node_modules ready"
echo ""

# ── Step 3: Pre-install Chromium ─────────────────────────────────────────────
bold "[3/3] Pre-installing Chromium browser…"
echo "  (Downloads ~150 MB on first run; subsequent runs are instant.)"
echo ""

NODE_BIN="$(command -v node)"
PLAYWRIGHT_CLI="$SCRIPT_DIR/server/node_modules/playwright-core/cli.js"

if [[ ! -f "$PLAYWRIGHT_CLI" ]]; then
    yellow "  Warning: playwright-core/cli.js not found at:"
    yellow "    $PLAYWRIGHT_CLI"
    yellow "  Chromium will be downloaded automatically on the first PDF export."
else
    # Run the CLI directly with node — no npx or global playwright needed.
    if "$NODE_BIN" "$PLAYWRIGHT_CLI" install chromium; then
        green "  ✓ Chromium ready"
    else
        yellow "  Warning: Chromium install returned a non-zero exit code."
        yellow "  You can retry manually:"
        yellow "    node \"$PLAYWRIGHT_CLI\" install chromium"
    fi
fi
echo ""

# ── Step 4: Populate Zed work directory ──────────────────────────────────────
bold "[4/4] Copying server files to Zed work directory…"
echo "  (Ensures the MCP server is found after a dev extension reinstall.)"
echo ""

case "$OSTYPE" in
    darwin*)
        ZED_WORK_DIR="$HOME/Library/Application Support/Zed/extensions/work/markdown-pdf"
        ;;
    linux*)
        ZED_WORK_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/zed/extensions/work/markdown-pdf"
        ;;
esac

mkdir -p "$ZED_WORK_DIR"
cp -r "$SCRIPT_DIR/server" "$ZED_WORK_DIR/"
green "  ✓ server files copied to $ZED_WORK_DIR/server"
echo ""

# ── Next steps ────────────────────────────────────────────────────────────────
bold "Setup complete!  Final step — install/reinstall the extension in Zed:"
echo ""
echo "  1. Open Zed"
echo "  2. Open the command palette"
echo "       macOS : ⌘ ⇧ P"
echo "       Linux : Ctrl+Shift+P"
echo "  3. Run:    zed: install dev extension"
echo "  4. Select: $SCRIPT_DIR"
echo ""
bold "Then enable the MCP server:"
echo ""
echo "  5. Open Zed Settings (⌘ , on macOS)"
echo "  6. Navigate to:  Agent → Context Servers"
echo "  7. Enable the 'markdown-pdf' server"
echo ""
echo "After enabling, open a Markdown file and ask the AI:"
echo "  \"Export this Markdown file to PDF\""
echo ""

# ── Post-install Chromium hint ────────────────────────────────────────────────
# After Zed installs the extension, the server lives in INSTALLED_DIR.
# If Chromium somehow still isn't available at that point, this is the command.
bold "If Chromium is still missing after Zed installs the extension, run:"
echo ""
echo "  node \"$INSTALLED_DIR/server/node_modules/playwright-core/cli.js\" install chromium"
echo ""
