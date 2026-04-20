---
id: ISS-0048
title: "Introduce review step before close — skill + batch `lyt close`"
type: feature
priority: P1-high
effort: S
complexity: standard
skill: ""
skills_aux: [code-structure, testing, documentation]
scope: lytos-cli
status: 3-in-progress
branch: "feat/ISS-0048-review-flow"
depends: []
created: 2026-04-20
updated: 2026-04-20
---

# ISS-0048 — Review step before close + batch `lyt close`

## Context

Today the end-of-task procedure in [session-start.md](../../../skills/session-start.md) tells the agent to move a finished issue straight to `5-done/`. The `4-review/` folder exists in the kanban structure but nothing uses it.

Fred wants finished issues to land in `4-review/` first — where they wait for human / CI / teammate review — and only move to `5-done/` once that review is green. Reviews typically accumulate: several issues finish coding across a day or a sprint, then get batch-validated.

This issue does two things:

1. **Updates the end-of-task skill** so agents move finished issues to `4-review/` (instead of `5-done/`).
2. **Extends `lyt close`** with a no-argument batch mode that promotes every issue in `4-review/` to `5-done/` after an explicit confirmation.

The single-issue form `lyt close ISS-XXXX` is preserved, and still works from either `3-in-progress/` (explicit skip-review shortcut) or `4-review/` (the normal path).

## Proposed solution

### Skill update

In both `method/skills/session-start.md` and `.lytos/skills/session-start.md`, the "Task completion — 3 mandatory actions" section changes:

- `status: 5-done` → `status: 4-review`
- `git mv … 3-in-progress/ISS-XXXX.md … 5-done/` → `git mv … 3-in-progress/ISS-XXXX.md … 4-review/`
- A new short paragraph explains: the issue is **finished coding**, not validated yet. Validation (human/CI/peer) happens next, then `lyt close` promotes it to `5-done/`.

No change to `lyt start` semantics, and no change to the "3 mandatory actions" count — same three steps, different target folder.

### `lyt close` — batch mode

```
lyt close                  # batch: every issue in 4-review/ → 5-done/ (confirm first)
lyt close ISS-XXXX         # single: existing behavior (3-in-progress or 4-review → 5-done)
lyt close --yes            # batch: skip the interactive confirmation
lyt close --dry-run        # batch: list what *would* be closed, change nothing
lyt close --force          # batch: also close issues with unchecked checklist items
```

Flags compose: `lyt close --yes --force` runs non-interactively on unchecked items too.

#### Batch flow (no argument)

1. List all files in `.lytos/issue-board/4-review/*.md`. If empty → `info("No issues in 4-review.")` and exit 0.
2. For each, read frontmatter + count checklist items.
3. Print a preview:
   ```
   Issues in 4-review (3):

     ISS-0038   Fix AGENTS.md casing — 4/4 items
     ISS-0041   lyt claim/start: fetch + check — 7/8 items ⚠
     ISS-0045   [website] Stubs + OG — 6/6 items

   (y to promote all · n to cancel · enter the issue ID to close one)
   ```
4. Prompt:
   - `y` → promote all. Issues with unchecked items are skipped with a warning unless `--force`.
   - `n` or empty → cancel, no change.
   - `--yes` bypasses this prompt.
5. For each issue that passes: `moveIssue(lytosDir, issue, "5-done", { updated: today() })`.
6. `regenerateBoard(lytosDir)` once at the end (not per issue).
7. Summary: `ok("3 closed · 0 skipped · 1 with warnings")`.

#### Unchecked items in a batch

The existing per-issue behavior for unchecked items is "block unless `--force`". In batch mode, that would cancel the whole batch on one bad apple. Better: **skip the unchecked issue with a warning, continue on the rest**. `--force` overrides the skip.

#### `--dry-run`

Prints the preview and exits 0 without changing anything. Useful for CI / "what's about to be closed?".

#### `--json`

The existing `--json` flag on `lyt close` should also cover the batch mode: emit an array summary.

### Single-issue flow (unchanged)

`lyt close ISS-XXXX` keeps its current semantics — move to `5-done/`, warn on unchecked without `--force`. The only thing is it's no longer the *required* path; the batch form is now the default when no argument is given.

## Definition of done

- [ ] `method/skills/session-start.md` and `.lytos/skills/session-start.md` updated — end-of-task moves to `4-review/`, short paragraph explains the intent
- [ ] `lyt close` without arg runs the batch flow
- [ ] Batch flow shows a preview + prompts `y/N` interactively
- [ ] `--yes` skips the prompt
- [ ] `--dry-run` shows the preview and changes nothing
- [ ] `--force` in batch mode promotes issues with unchecked items anyway
- [ ] Issues with unchecked items are skipped (not aborted) in normal batch mode; final summary counts them
- [ ] `lyt close ISS-XXXX` still works, still allows closing from `3-in-progress/` (skip-review shortcut)
- [ ] `--json` covers batch mode (emits an array)
- [ ] Tests: empty 4-review, batch with 2 issues (happy path), batch with one unchecked (skipped), `--yes`, `--dry-run`, `--force`
- [ ] README section updated on the review flow
- [ ] Website `/method/issue-board` page mentions the 4-review step

## Checklist

### Skill
- [ ] `method/skills/session-start.md` — change target folder + explain
- [ ] `.lytos/skills/session-start.md` — same
- [ ] `method/LYTOS.md` / `.lytos/LYTOS.md` — quick sanity check (likely no change)

### CLI
- [ ] `src/commands/close.ts` — add batch path, confirmation prompt, `--yes`, `--dry-run`, `--force`
- [ ] `src/lib/issue-ops.ts` — consider a `listIssuesInStatus(lytosDir, statusDir)` helper if it doesn't exist
- [ ] `tests/commands/close.test.ts` — add 5–6 scenarios

### Docs
- [ ] `README.md` — document the review step and the batch close
- [ ] Website `/method/issue-board` — update the state diagram / text (if it describes the flow)

## Relevant files

- `src/commands/close.ts`
- `src/lib/issue-ops.ts`
- `method/skills/session-start.md` + `.lytos/skills/session-start.md`
- `tests/commands/close.test.ts`
- `README.md`

## Notes

- The confirmation prompt reads from stdin. If stdout is not a TTY and `--yes` is absent, the batch form exits 2 with `"Batch close requires --yes in non-interactive mode"`. Mirrors the graceful-degradation policy used elsewhere in the CLI.
- Once this lands, the kanban flow reads: `1-backlog → 2-sprint → 3-in-progress → 4-review → 5-done`, fully exercised.
- Follow-up if usage demands it: `lyt review ISS-XXXX` as an explicit "I'm done coding, promote to 4-review" command. Not included here — for now, agents do the move via the skill procedure, same as they've always moved files by hand.
