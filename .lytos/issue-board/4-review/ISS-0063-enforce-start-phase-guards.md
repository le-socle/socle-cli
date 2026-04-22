---
id: ISS-0063
title: "Enforce start-phase guards on issue branches and resumed work"
type: fix
priority: P1-high
effort: S
complexity: standard
domain: [cli, git, workflow]
skill: code-structure
skills_aux: [testing, documentation]
status: 4-review
branch: "fix/ISS-0063-start-phase-guards"
depends: []
created: 2026-04-22
updated: 2026-04-22
---

# ISS-0063 — Enforce start-phase guards on issue branches and resumed work

## Context

Two workflow leaks were observed while resuming ISS-0059:

1. work resumed from an issue that was still in `1-backlog/` instead of being explicitly moved to `3-in-progress/` first
2. the session started from `main` before the dedicated issue branch was properly re-established

The written method already says "run the mandatory start phase" and "never code on main", but the tooling does not enforce enough of that contract when an existing PR or branch is resumed.

## Proposed solution

Strengthen the system at three levels:

1. **Pre-commit hook** — on a branch named `type/ISS-XXXX-*`, block commits unless the matching issue is currently in `3-in-progress/` or `4-review/`
2. **Doctor diagnostic** — if the checked-out issue branch points to an issue still in backlog/sprint/icebox/done, flag it explicitly as a workflow error
3. **Method wording** — make the resume rule impossible to misread: an existing branch is not an exception to `lyt start`, and being on `main` means stop before editing

## Definition of done

- [x] The pre-commit hook blocks a commit on `type/ISS-XXXX-*` when the matching issue is still in `0-icebox/`, `1-backlog/`, `2-sprint/`, or `5-done/`
- [x] The pre-commit hook still allows commits on valid issue branches when the issue is in `3-in-progress/` or `4-review/`
- [x] `lyt doctor` reports a clear workflow error when the current issue branch points to an issue not in `3-in-progress/` or `4-review/`
- [x] `.lytos/skills/session-start.md` explicitly says that resuming an existing branch is not a substitute for `lyt start`
- [x] `.lytos/LYTOS.md` and `method/LYTOS.md` explicitly say to stop immediately when still on `main` / `dev` / `master`
- [x] Tests cover the new hook and doctor cases

## Relevant files

- `src/lib/hooks.ts`
- `src/lib/doctor.ts`
- `src/commands/doctor.ts`
- `tests/commands/hooks.test.ts`
- `tests/commands/doctor.test.ts`
- `.lytos/skills/session-start.md`
- `.lytos/LYTOS.md`
- `method/LYTOS.md`

## Notes

- This issue hardens the workflow; it does not change the issue lifecycle itself.
- The goal is to make the wrong path visible and blockable before it gets normalized.

## Finalization — 2026-04-22

- The pre-commit hook now rejects commits on `type/ISS-XXXX-*` when the matching issue is not in `3-in-progress` or `4-review`
- `lyt doctor` now surfaces the same branch/status drift as an explicit `Git Workflow` error
- The startup method now says plainly that an existing branch is not a substitute for `lyt start`, and that staying on `main` / `dev` / `master` means stop before editing
- Validation run:
  - `npm run build`
  - `npx vitest run tests/commands/hooks.test.ts tests/commands/doctor.test.ts`
