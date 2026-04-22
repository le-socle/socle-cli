---
id: ISS-0064
title: "Archive completed housekeeping issues and restore a clean main worktree"
type: chore
priority: P1-high
effort: XS
complexity: light
domain: [workflow, board, archive, git]
skill: documentation
skills_aux: [git-workflow]
status: 4-review
branch: "chore/ISS-0064-archive-cleanup"
depends: []
created: 2026-04-22
updated: 2026-04-22
---

# ISS-0064 — Archive completed housekeeping issues and restore a clean main worktree

## Context

The local `main` worktree carried an uncommitted archive pass:

- five completed issues had already been moved from `5-done/` to `archive/2026-Q2/`
- `BOARD.md` and `archive/INDEX.md` had been updated
- Git still showed the result as 12 pending file changes because the moves were not staged or committed

That state was correct functionally, but not acceptable operationally: `main` looked dirty, and the archive work had no issue/branch wrapper.

## Proposed solution

Formalize the pending archive move as a dedicated housekeeping issue, keep it on its own branch, and leave `main` clean again.

## Definition of done

- [x] The archive move lives on a dedicated branch, not on `main`
- [x] The five completed issues are stored under `.lytos/issue-board/archive/2026-Q2/`
- [x] `.lytos/issue-board/5-done/` no longer contains those archived issues
- [x] `BOARD.md` reflects the archive count and live columns correctly
- [x] `archive/INDEX.md` includes the archived issues
- [x] The local `main` worktree can be returned to a clean state by switching away from this branch

## Relevant files

- `.lytos/issue-board/BOARD.md`
- `.lytos/issue-board/archive/INDEX.md`
- `.lytos/issue-board/archive/2026-Q2/ISS-0050-cursor-rules-modern-convention.md`
- `.lytos/issue-board/archive/2026-Q2/ISS-0051-manual-archive-command.md`
- `.lytos/issue-board/archive/2026-Q2/ISS-0053-multi-tool-init.md`
- `.lytos/issue-board/archive/2026-Q2/ISS-0055-lightweight-startup-path-xs-issues.md`
- `.lytos/issue-board/archive/2026-Q2/ISS-0062-board-housekeeping-public-readiness.md`

## Finalization — 2026-04-22

- Archived the five completed housekeeping issues
- Regenerated the board and archive index
- Isolated the cleanup on `chore/ISS-0064-archive-cleanup` so `main` no longer carries this pending work
