# Custom Variables Example

Use front matter fields as placeholders in your headers and footers.

## Overview

Any field you add to your YAML front matter becomes a `{placeholder}` you can use in headers and footers. This is perfect for:

- Company branding
- Document versioning
- Project information
- Client details
- Department names

## Basic Example

```yaml
---
title: Project Proposal
author: Jane Smith
company: Acme Corporation
department: Engineering
version: 1.0.0
client: BigCorp Inc.
markdown-pdf:
  header:
    height: 15mm
    left_text: "{company}"
    center_text: "{title}"
    right_text: "v{version}"
  footer:
    height: 10mm
    left_text: "{department}"
    center_text: "Page {page} of {pages}"
    right_text: "{author}"
---

# Project Proposal

Content goes here...
```

**Result:**
- Header: `Acme Corporation | Project Proposal | v1.0.0`
- Footer: `Engineering | Page 1 of 5 | Jane Smith`

## Multiple Variables in One Element

Combine multiple placeholders in a single text element:

```yaml
---
company: Acme Corp
department: Engineering
project_code: PRJ-2025-001
markdown-pdf:
  header:
    left_text: "{company} — {department}"
    right_text: "{project_code}"
---
```

## Styled Variables

Apply different styles to different variables:

```yaml
---
title: Quarterly Report
company: Acme Corporation
confidential: true
markdown-pdf:
  header:
    height: 18mm
    padding: 0 15mm
    left:
      - type: text
        content: "{company}"
        font_weight: bold
        color: "#0066cc"
      - type: text
        content: "{title}"
        font_style: italic
        color: "#666"
    right:
      type: text
      content: "CONFIDENTIAL"
      font_weight: bold
      color: "#cc0000"
      font_size: 8px
---
```

## Document Versioning

Track document versions and revision dates:

```yaml
---
title: Technical Specification
version: 2.3.1
revision_date: 2025-06-14
status: Draft
change_id: CHG-2025-0142
markdown-pdf:
  header:
    height: 16mm
    left_text: "{title}"
    right_text: "v{version} ({status})"
  footer:
    height: 12mm
    left_text: "Change: {change_id}"
    center_text: "Page {page} of {pages}"
    right_text: "Rev: {revision_date}"
---
```

## Project Documentation

For project-specific documents:

```yaml
---
title: Sprint 12 Report
project_name: Phoenix Rebuild
project_code: PHX-2025
team: Platform Team
sprint: 12
sprint_dates: "Jun 1-14, 2025"
markdown-pdf:
  header:
    height: 18mm
    padding: 0 15mm
    border_bottom: 2px solid #3498db
    left:
      - type: text
        content: "{project_name}"
        font_weight: bold
      - type: text
        content: "{project_code}"
        font_size: 8px
        color: "#666"
    center:
      type: title
    right:
      type: text
      content: "Sprint {sprint}"
      font_weight: bold
  footer:
    height: 12mm
    font_size: 8px
    color: "#666"
    left_text: "{team}"
    center_text: "{sprint_dates}"
    right_text: "Page {page}"
---
```

## Client-Facing Documents

Include client information in professional documents:

```yaml
---
title: Project Proposal
author: Jane Smith
author_title: Senior Consultant
company: Acme Consulting
client_name: BigCorp Industries
client_contact: John Doe
proposal_id: PROP-2025-0089
valid_until: 2025-07-31
markdown-pdf:
  page_format: Letter
  header:
    height: 20mm
    padding: 0 15mm
    border_bottom: 1px solid #ddd
    left:
      type: image
      src: ./logo.svg
      height: 16mm
    center:
      - type: text
        content: "Proposal for {client_name}"
        font_weight: bold
      - type: text
        content: "{proposal_id}"
        font_size: 8px
        color: "#666"
    right:
      type: date
      format: MMMM d, yyyy
  footer:
    height: 14mm
    padding: 0 15mm
    font_size: 8px
    border_top: 1px solid #eee
    left:
      - type: text
        content: "{author}"
      - type: text
        content: "{author_title}"
        color: "#666"
    center:
      type: text
      content: "Page {page} of {pages}"
    right:
      type: text
      content: "Valid until: {valid_until}"
      color: "#666"
---
```

## Fiscal/Financial Documents

For finance and reporting:

```yaml
---
title: Q2 Financial Summary
company: Acme Corporation
fiscal_year: 2025
quarter: Q2
period: "Apr 1 - Jun 30, 2025"
prepared_by: Finance Team
classification: Internal
markdown-pdf:
  header:
    height: 16mm
    left_text: "{company}"
    center_text: "FY{fiscal_year} {quarter} Report"
    right_text: "{classification}"
  footer:
    height: 12mm
    font_size: 8px
    color: "#666"
    left_text: "{period}"
    center_text: "Page {page} of {pages}"
    right_text: "Prepared by: {prepared_by}"
---
```

## Available Placeholder Names

### Reserved Placeholders

These have special handling:

| Placeholder | Source |
|-------------|--------|
| `{page}` | Current page (Chromium) |
| `{pages}` | Total pages (Chromium) |
| `{date}` | Current date |
| `{date:FORMAT}` | Formatted date |
| `{title}` | Document title |
| `{author}` | Front matter author |
| `{filename}` | Source filename |

### Custom Placeholders

Any other front matter field works as a placeholder:

```yaml
---
my_field: My Value
another_field: Another Value
---
```

Use as `{my_field}` and `{another_field}`.

## Tips

### Naming Conventions

Use clear, descriptive names:

```yaml
# Good
company_name: Acme Corp
project_code: PRJ-2025
document_version: 1.0.0

# Less clear
cn: Acme Corp
pc: PRJ-2025
v: 1.0.0
```

### Case Insensitivity

Placeholder names are case-insensitive:

```yaml
---
Company: Acme Corp
DEPARTMENT: Engineering
---
```

Both work as `{company}` and `{department}`.

### Avoid Special Characters

Stick to alphanumeric characters and underscores:

```yaml
# Good
project_name: Phoenix
project_code: PRJ_2025_001

# May cause issues
project-name: Phoenix  # Hyphen
project.code: PRJ      # Dot
```

## See Also

- [Placeholders Reference](/reference/placeholders)
- [Front Matter Guide](/guide/front-matter)
- [Corporate Example](/examples/corporate)