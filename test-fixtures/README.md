
# Test Fixtures

This directory contains the sample files used by the standalone MCP test and by
manual testing in Zed.

## Contents

- **`sample.md`** - Reference Markdown input covering common formatting,
  tables, code fences, links, and inline HTML.
- **`custom.css`** - Example stylesheet override for testing custom PDF styling.
- **`test-export.mjs`** - End-to-end script that starts the MCP server, runs
  `doctor_markdown_pdf`, exports `sample.md`, and checks that `sample.pdf` was
  created.
- **`sample.pdf`** - Generated output from the latest local test run.

## Run the fixture test

From the repository root:

```sh
cd server
npm install
npm run build
npm run test

# Optional: run with the fixture stylesheet
node ../test-fixtures/test-export.mjs --custom-css custom.css
```

The script writes the output PDF to `test-fixtures/sample.pdf`.

## Manual use in Zed

Use `sample.md` as a quick file for interactive export tests after installing
the extension locally.

## More testing docs

For full setup, Zed installation, troubleshooting, and expected output, see
`../TESTING.md`.
