---
id: ISS-0041
title: "lyt claim/start: fetch + check origin before moving an issue"
type: fix
priority: P1-high
effort: S
complexity: standard
skill: code-structure
skills_aux: [testing, git-workflow]
status: 4-review
branch: "fix/ISS-0041-claim-fetch-check"
depends: []
created: 2026-04-19
updated: 2026-04-20
---

# ISS-0041 — lyt claim/start: fetch + check origin before moving an issue

## Context

Concurrency gap reported by Fred: two developers on the same team can claim the same issue at the same time because `lyt claim` / `lyt start` works purely from local state. Dev A claims at T0 but doesn't push. Dev B pulls at T+1, sees the issue still in sprint, claims it too. The lead dev can't tell who has what until both push.

This is the minimum-viable fix: make the CLI refuse to claim without a fresh view of origin.

## What to do

Before any file move or branch creation in `lyt claim` and `lyt start`:

1. Run `git fetch origin main` (silent, fast).
2. Compare local `main` to `origin/main`:
   - If local is behind → abort with: `"Your local main is behind origin. Run \`git pull\` on main, then retry."`
   - If local has diverged → abort with: `"Your main has diverged from origin. Resolve before claiming."`
3. Read the issue's frontmatter from `origin/main` (via `git show origin/main:<path>`), not from local:
   - If the issue is already in `3-in-progress/` on origin and the assignee is not the current git user, abort: `"ISS-XXXX was claimed by @<name> on <date>. Use --force to override."`
4. Only then proceed with the existing local move + branch creation.

## Relevant files

- `src/commands/claim.ts` — `claim` and `unclaim` actions
- `src/commands/start.ts` — `start` action (same concern)
- `src/lib/issue-ops.ts` — probably the right place for a shared `checkOriginFresh()` helper
- `tests/commands/claim.test.ts` — add race-condition scenarios

## Definition of done

- `lyt claim` refuses to run when local main is behind / diverged, with a clear message
- Existing-assignee check reads from `origin/main` (via `git show`), not from local FS
- `--force` still works but logs a warning
- Tests cover: fresh main (claim succeeds), behind main (claim aborts), already-claimed-on-origin (claim aborts), `--force` override
- Works offline with a clear degraded mode (if `git fetch` fails, show warning and proceed with local state only)
