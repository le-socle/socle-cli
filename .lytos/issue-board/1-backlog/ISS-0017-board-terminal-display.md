---
id: ISS-0017
title: "Enhance lyt board with rich terminal display"
type: feature
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 3-in-progress
branch: "feat/ISS-0017-board-terminal-display"
depends: []
created: 2026-04-14
updated: 2026-04-14
---

# ISS-0017 — Enhance lyt board with rich terminal display

## Context

Currently `lyt board` only regenerates BOARD.md silently. The developer has to open the file to see the state. The command should display a rich, colorful terminal overview that answers "where are we?" at a glance.

## Proposed solution

Display a formatted board directly in the terminal with:
- Header with project name
- Sections per status (backlog, sprint, in-progress, review)
- Dependency tree (indented with └── when an issue depends on another)
- Color-coded priorities (P0 red, P1 yellow, P2 blue, P3 dim)
- Done section compacted to just the count
- Summary line at the bottom with totals per status
- Still regenerate BOARD.md as before

## Checklist

- [ ] Add color utilities (ANSI codes, no dependency)
- [ ] Build dependency tree from `depends` field
- [ ] Format each section with tree rendering
- [ ] Compact done section (count only)
- [ ] Summary line at bottom
- [ ] Update existing tests
- [ ] Add tests for terminal display

## Definition of done

- `lyt board` displays a colorful, structured overview in the terminal
- Dependencies are shown as tree branches
- Done shows only count
- BOARD.md still regenerated
- All tests pass
- Zero new dependencies
