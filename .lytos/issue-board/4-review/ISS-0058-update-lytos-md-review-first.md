---
id: ISS-0058
title: Update LYTOS.md to reflect review-first workflow and bridge preservation
type: task
priority: P2-normal
effort: XS
complexity: light
skill: documentation
status: 4-review
depends: []
created: 2026-04-21
---
# ISS-0058 — Update `LYTOS.md` to reflect review-first workflow and bridge preservation

## What to do

Apply a small documentation update to `method/LYTOS.md` and `.lytos/LYTOS.md` so the briefing stays aligned with the current workflow: issues stop in `4-review` before `5-done`, and existing AI bridge files are preserved by default unless overwrite is explicitly requested.

## Relevant files

- `method/LYTOS.md`
- `.lytos/LYTOS.md`

## Definition of done

- `LYTOS.md` mentions the `3-in-progress → 4-review → 5-done` flow clearly
- `LYTOS.md` mentions default preservation of existing AI bridge files on re-init
- Bundled and local copies are kept in sync

## Notes

- No code-path change in this issue; documentation-only alignment.
- Bundled and local copies updated together.
