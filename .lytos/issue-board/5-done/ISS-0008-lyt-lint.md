---
id: ISS-0008
title: "Implement lyt lint command"
type: feat
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: "feat/ISS-0008-lyt-lint"
depends: []
created: 2026-04-13
updated: 2026-04-15
---

# ISS-0008 — Implement `lyt lint`

## Context

There's no way to verify that a `.lytos/` directory is correctly structured. A missing file, an empty manifest, or invalid issue frontmatter won't be caught until the AI reads it and fails silently.

`lyt lint` validates the structure and content of `.lytos/`, reports errors with clear messages, and exits with code 1 if problems are found (usable in CI).

## Checklist

1. [ ] Create `src/commands/lint.ts` command
2. [ ] Create `src/lib/linter.ts` with validation rules
3. [ ] Check required files exist (manifest.md, LYTOS.md, MEMORY.md, default-rules.md, BOARD.md)
4. [ ] Check required directories exist (skills/, rules/, memory/cortex/, issue-board/)
5. [ ] Validate manifest has key sections filled (Identity, Why, Tech stack)
6. [ ] Validate issue frontmatter schema (required fields: id, title, status, priority)
7. [ ] Detect placeholder text (YYYY-MM-DD, empty table cells, template instructions)
8. [ ] Report errors with file path and fix suggestion
9. [ ] `--json` flag for machine-readable output
10. [ ] Exit code 0 = all good, 1 = issues found
11. [ ] Replace "coming soon" stub in cli.ts with real command
12. [ ] Write tests

## Definition of done

- `lyt lint` validates .lytos/ structure and content
- Clear error messages with file path and fix suggestion
- Exit code 0 (clean) or 1 (problems found)
- `--json` flag works
- Usable in CI
- All tests pass
