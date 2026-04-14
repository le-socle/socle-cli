---
id: ISS-0008
title: "Implement socle lint command"
type: feat
priority: P1-high
effort: M
complexity: standard
skill: code-structure
status: 1-backlog
depends: [ISS-0001]
created: 2026-04-13
---

# ISS-0008 — Implement `socle lint`

## What to do

Validate that the `.socle/` directory structure is correct and complete. Check that required files exist, manifest is filled, frontmatter is valid, and no YYYY-MM-DD placeholders remain.

## Definition of done

- [ ] Checks for required files (manifest.md, MEMORY.md, default-rules.md, BOARD.md)
- [ ] Validates manifest has key sections filled
- [ ] Validates issue frontmatter schema (required fields, valid values)
- [ ] Detects placeholder text (YYYY-MM-DD, [Project Name], etc.)
- [ ] Reports errors with file path, line number, and fix suggestion
- [ ] Exit code 0 = all good, 1 = issues found
