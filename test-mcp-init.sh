#!/bin/bash

# Test script to verify MCP server responds to initialize request
# Uses newline-delimited JSON (NDJSON) framing as defined by the MCP spec.

SERVER_PATH="$HOME/Library/Application Support/Zed/extensions/installed/markdown-pdf/server/markdown_pdf_server.mjs"

if [ ! -f "$SERVER_PATH" ]; then
    echo "Error: Server not found at: $SERVER_PATH"
    echo "Falling back to local dev server…"
    SERVER_PATH="$(dirname "$0")/server/markdown_pdf_server.mjs"
    if [ ! -f "$SERVER_PATH" ]; then
        echo "Error: Server not found at: $SERVER_PATH"
        exit 1
    fi
fi

echo "Testing MCP server at: $SERVER_PATH"
echo ""

# ── NDJSON framing (MCP spec 2024-11-05) ──────────────────────────────────────
# The MCP stdio transport defines messages as newline-delimited JSON:
#   one JSON object per line, separated by '\n'.

REQUEST='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'

echo "Sending initialize request (NDJSON framing)…"
echo ""

RESPONSE=$(printf '%s\n' "$REQUEST" | timeout 5 node "$SERVER_PATH" 2>/dev/null)
EXIT_CODE=$?

if [ -n "$RESPONSE" ]; then
    echo "Response:"
    echo "$RESPONSE"
fi

echo ""
if [ $EXIT_CODE -eq 124 ]; then
    echo "TIMEOUT: Server did not respond within 5 seconds"
    exit 1
elif [ $EXIT_CODE -eq 0 ]; then
    echo "SUCCESS: Server responded"
    exit 0
else
    echo "ERROR: Server failed with exit code $EXIT_CODE"
    exit 1
fi
