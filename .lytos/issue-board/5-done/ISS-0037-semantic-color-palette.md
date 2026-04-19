---
id: ISS-0037
title: Semantic color palette — readable on dark backgrounds, red reserved for errors
type: refactor
priority: P1-high
effort: S
complexity: standard
skill: code-structure
status: 5-done
branch: refactor/ISS-0037-semantic-color-palette
depends: []
created: 2026-04-18
updated: 2026-04-19
---
# ISS-0037 — Semantic color palette — readable on dark backgrounds, red reserved for errors

## Context

The current CLI output relies on `bold()` (titles, IDs) and `dim()` (field labels) for visual hierarchy. On some terminal themes, these ANSI attributes render as dark red / orange, which (a) kills readability on dark backgrounds and (b) conflicts with the "red = error" convention users expect.

This blocks ISS-0027 (launch readiness): screenshots and demo videos will expose this to every first-time user. The fix is a small refactor that enforces an explicit, semantic palette across all commands.

## Target palette

- **Red** — errors only (`error()`, icon ✗, failure counts)
- **Yellow/orange** — warnings, `in-progress` state, pending dependencies
- **Green** — success, `done` state, completed items
- **Blue/cyan** — chrome: issue IDs, titles, field labels (`Skill:`, `Branch:`, etc.), `sprint`/`review` states
- **Dim** — de-emphasised secondary text only (strikethrough-style on done checklist items, separators `·`)
- **Bold** — emphasis, never relied on for color

## Checklist

- [x] Add `cyan` helper to `src/lib/output.ts` and document the palette convention inline
- [x] Fix `warn()` in `src/lib/output.ts` — icon was red, now yellow (consistent with palette)
- [x] Refactor `src/commands/show.ts` — title/ID in cyan, field labels (`Skill:`, `Aux:`, `Branch:`, `Complexity:`, `Dependencies:`) in explicit colour (not dim alone)
- [x] Update `src/commands/start.ts` and `src/commands/close.ts` — issue ID success line uses cyan instead of bold alone
- [x] Update `src/commands/lint.ts` and `src/commands/doctor.ts` — wrap bold-only headers and labels in cyan/green
- [x] Refactor `src/commands/init.ts` — all section headings, step labels, inline commands, AI quotes in cyan; `Dry run` in yellow
- [x] Update `src/lib/update-check.ts` and `src/cli.ts` — wrap bold-only version/command names in cyan
- [x] Verify `src/lib/board-display.ts` — already uses explicit semantic colors, no regression
- [x] Run full test suite — 71/71 passing
- [x] Take fresh `lyt show ISS-XXXX` screenshot on dark terminal — readable + no red outside error context

## Done criteria

- All field labels and issue titles are readable on dark backgrounds regardless of terminal theme
- Red appears only in error contexts
- Visual hierarchy does not depend on `bold`/`dim` rendering
- ISS-0027 can proceed with clean screenshots
