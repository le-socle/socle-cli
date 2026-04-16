---
id: ISS-0009
title: "Implement lyt doctor command"
type: feat
priority: P1-high
effort: M
complexity: standard
skill: code-structure
status: 5-done
depends: [ISS-0008]
created: 2026-04-13
updated: 2026-04-16
---

# ISS-0009 — Implement `lyt doctor`

## What to do

Full diagnostic beyond lint. Check broken links, stale memory, frontmatter/folder mismatches, missing skills referenced in issues, and overall health score.

## Definition of done

- [x] Broken internal links (file references that don't exist)
- [x] Stale memory (entries older than 90 days without update)
- [x] Frontmatter status vs folder mismatch
- [x] Issues referencing non-existent skills
- [x] Orphan dependencies (depends on issues that don't exist)
- [x] Summary with health score (0-100%) with color-coded bar
- [x] --json flag for CI integration
- [x] Template files excluded from link checking (placeholders are intentional)
- [x] Integration tests (8 test cases)
