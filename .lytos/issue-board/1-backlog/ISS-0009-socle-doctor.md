---
id: ISS-0009
title: "Implement socle doctor command"
type: feat
priority: P1-high
effort: M
complexity: standard
skill: code-structure
status: 1-backlog
depends: [ISS-0008]
created: 2026-04-13
---

# ISS-0009 — Implement `socle doctor`

## What to do

Full diagnostic beyond lint. Check broken links, stale memory, frontmatter/folder mismatches, missing skills referenced in issues, and overall health score.

## Definition of done

- [ ] Everything `socle lint` checks, plus:
- [ ] Broken internal links (file references that don't exist)
- [ ] Stale memory (entries older than N sprints without update)
- [ ] Frontmatter status vs folder mismatch
- [ ] Issues referencing non-existent skills
- [ ] Summary with health score (0-100%)
