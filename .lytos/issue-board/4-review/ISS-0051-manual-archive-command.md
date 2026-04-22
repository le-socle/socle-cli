---
id: ISS-0051
title: "Replace auto-archive in lyt board with a manual lyt archive command"
type: feat
priority: P2-normal
effort: M
complexity: standard
domain: [cli, board]
skill: ""
skills_aux: []
status: 4-review
branch: "feat/ISS-0051-manual-archive"
depends: []
created: 2026-04-21
updated: 2026-04-21
---

# ISS-0051 — Replace auto-archive in `lyt board` with a manual `lyt archive` command

## Context

Today, every invocation of `lyt board` calls `archiveIssues(boardDir)` at [src/commands/board.ts:88-89](src/commands/board.ts#L88-L89), which immediately moves every file from `5-done/` to `archive/<quarter>/`. There is no buffer time, no preview, and no opt-out.

Two problems:

1. **No retrospective window.** Once an issue is closed, the next `lyt board` makes it disappear from the live board into the archive. Reviewers, leads, or the dev themselves often want to see recently closed work for a few days — to write a sprint retro, link from a PR, double-check a checklist, or roll back if something turns out broken.
2. **Implicit destructive side-effect.** `lyt board` reads as "regenerate the kanban markdown" — but it also moves files. That violates the Lytos principle of *explicit, no-magic* operations.

The target behavior:

- `lyt board` should be **read-only on the file system**, only regenerating `BOARD.md` and `archive/INDEX.md` counters.
- A new explicit `lyt archive` command should drive the archival, with a time threshold so that fresh closures stay visible.

## Proposed solution

### 1. Strip auto-archive from `lyt board`

Remove the `archiveIssues(boardDir)` call from [src/commands/board.ts](src/commands/board.ts). Keep `countArchived(boardDir)` for the BOARD.md "archived" counter.

### 2. New command `lyt archive`

New file `src/commands/archive.ts`. Behavior:

| Invocation | Effect |
|---|---|
| `lyt archive` | Archive every issue in `5-done/` whose `updated` date is **≥ 7 days** old (default threshold). |
| `lyt archive --older-than <N>d` | Override the threshold (e.g. `--older-than 0d` to archive everything immediately, `--older-than 30d` for a monthly cadence). Accepts `d` (days) suffix; reject other units in v1. |
| `lyt archive --dry-run` | Print which issues would be moved and which would stay (with their age in days), without touching the filesystem. |
| `lyt archive --all` | Equivalent shortcut for `--older-than 0d`. |

After moving files, the command must:
- Update `archive/<quarter>/` (compute current quarter from the `updated` date of each issue, *not* today's date — so an issue closed in March 2026 archives to `2026-Q1` even if archived in April).
- Update `archive/INDEX.md` (existing helper `readArchiveIndex` / write logic in `archiveIssues`).
- Re-run the `BOARD.md` regeneration so counts stay consistent.

### 3. Git hook adjustment (lytos-method side)

The `branch-per-issue` pre-commit hook currently blocks any commit on `main` without an issue branch. Archive operations don't fit this model. Extend the hook to allow commits whose diff is **purely** a rename `5-done/ISS-*.md` → `archive/*/ISS-*.md` plus updates to `BOARD.md` and `archive/INDEX.md`.

This change lives in `lytos-method` (where the hook is installed), not in `lytos-cli` proper, but it's a hard prerequisite for the workflow to be usable end-to-end. Track as a sub-step here, or open a follow-up `chore` issue on `lytos-method`.

### 4. Documentation

- Update `/cli/overview` to add `lyt archive` to the command table.
- New page `/cli/archive` (en + fr) describing the threshold logic, defaults, and rationale (why 7 days).
- Update `/method/issue-board` to describe the lifecycle: `0-icebox → … → 5-done → archive` with the manual archive step.
- README (en + fr) — update commands section.

## Definition of done

- [x] `lyt board` no longer moves any files — verified by integration test that runs `lyt board` and confirms `5-done/` is unchanged.
- [x] `lyt archive` is registered in `src/cli.ts` and visible in `lyt --help`.
- [x] Default threshold of 7 days is enforced — issue closed today stays in `5-done/` after `lyt archive`, an issue with `updated: 2026-04-13` (8 days old) gets moved.
- [x] `--older-than 0d` and `--all` archive everything in `5-done/`.
- [x] `--dry-run` prints planned moves without touching the filesystem.
- [x] Quarter computation uses each issue's `updated` field, not the archive run date.
- [x] Tests cover: default threshold, custom `--older-than`, `--dry-run`, `--all`, empty `5-done/`, mixed (some old enough, some not).
- [x] Coverage ≥ 80% on `src/commands/archive.ts`.
- [x] Doc updated: `/cli/overview`, `/cli/archive` (en + fr), `/method/issue-board`, README en + fr.
- [ ] Git hook on `lytos-method` updated to allow archive-only commits (or follow-up issue opened). *(follow-up issue opened: lytos-method ISS-0021)*

## Checklist

### Source code
- [x] Strip `archiveIssues()` call from `src/commands/board.ts`
- [x] Create `src/commands/archive.ts`
- [x] Refactor `archiveIssues()` in `src/lib/board-generator.ts` to accept an `olderThanDays` parameter (default `Infinity` for backwards compat in unit tests, but default `7` from the CLI)
- [x] Use issue's `updated` field for quarter computation
- [x] Register the new command in `src/cli.ts`

### Tests
- [x] `tests/commands/archive.test.ts` — unit tests on the command surface *(9 tests including auto-regen)*
- [ ] `tests/lib/board-generator.test.ts` — extend existing tests for the new threshold logic *(coverage is reached through the command-level tests; no separate lib file yet)*
- [x] Update existing `lyt board` tests to assert no file movement

### Documentation
- [x] `src/content/docs/{en,fr}/cli/overview.md` — add row in commands table
- [x] `src/content/docs/{en,fr}/cli/archive.md` — new pages
- [x] `src/content/docs/{en,fr}/method/issue-board.md` — lifecycle update
- [x] `README.md` (en + fr) — commands section
- [x] `astro.config.mjs` (website) — add sidebar entry for `/cli/archive`

### Git hook (likely follow-up issue on lytos-method)
- [ ] Pre-commit hook accepts diffs that are purely archive renames + INDEX/BOARD updates *(tracked in lytos-method ISS-0021)*

## Relevant files

- `src/commands/board.ts` — strip auto-archive
- `src/commands/archive.ts` — new
- `src/lib/board-generator.ts` — `archiveIssues()` refactor
- `src/cli.ts` — command registration
- `tests/commands/archive.test.ts` — new
- `tests/commands/board.test.ts` — adjust assertions

## Notes

- **Why 7 days as default?** Sprint retros, async PR reviews, and end-of-week summaries are the typical contexts where someone wants to revisit recently closed work. A weekly cadence covers all three. The flag exists for teams who want different behavior.
- **Why not a config knob (`.lytos/config.yml`)?** Lytos avoids hidden config; the explicit flag in the command is sufficient. If multiple projects need different defaults, that's a follow-up.
- **Backwards compatibility.** Some users currently rely on `lyt board` archiving. Communicate the change in the release notes — and document the equivalent: `lyt board && lyt archive --all` reproduces the old behavior.
- **Trigger for this issue:** archival behavior surfaced as a friction during the 2026-04-21 conversation about home page restructuring. See the post-task feedback in MEMORY (when added) for the original framing.

## Audit de review — 2026-04-21

**Verdict: NO_GO**

L'audit de review donne un NO_GO. La base CLI existe, mais plusieurs critères explicites de la feature ne sont pas terminés.

Ce qui ne va pas :

- `lyt archive` ne régénère pas `BOARD.md` après archivage ; il demande encore de lancer `lyt board` manuellement
- `README.md` et `docs/fr/README.md` ne listent pas `lyt archive`
- la doc website n'a ni page `cli/archive`, ni entrée de sidebar, ni mise à jour de `cli/overview`
- `method/issue-board` ne documente pas encore le passage manuel vers l'archive
- le hook git n'autorise pas le cas "archive-only" et aucun follow-up dédié n'a été ouvert ici

Points à corriger :

- [x] faire régénérer `BOARD.md` automatiquement par `lyt archive` *(PR #13 — collectIssues + generateBoardMarkdown appelés après archive)*
- [x] ajouter `lyt archive` à la doc CLI locale et website *(README EN+FR + /cli/overview EN+FR)*
- [x] créer les pages `cli/archive` EN/FR et l'entrée `astro.config.mjs` *(fait)*
- [x] mettre à jour `method/issue-board` pour documenter `5-done -> archive` *(lifecycle étendue avec la ligne 5-done → archive)*
- [x] traiter le hook archive-only dans le bon repo, ou ouvrir l'issue de suivi explicitement *(follow-up issue lytos-method ISS-0021 créée)*
