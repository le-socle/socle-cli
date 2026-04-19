---
id: ISS-0042
title: "lyt claim: atomic claim via branch + push + draft PR (full race-proof design)"
type: feature
priority: P1-high
effort: L
complexity: heavy
skill: code-structure
skills_aux: [testing, git-workflow, documentation]
status: 1-backlog
branch: "feat/ISS-0042-claim-atomic-pr"
depends: [ISS-0041]
created: 2026-04-19
---

# ISS-0042 — Atomic claim via branch + push + draft PR

## Context

Once ISS-0041 lands, local-only claims are blocked by a freshness check. But the race still exists in the narrow window between "fetch returned green" and "I finished moving the file locally". Two devs whose clocks are close enough can both pass the freshness check, both move the file, and only find out at push time.

To close the race for good, the claim itself needs to be a **single atomic git push** against origin. Git's ref-update is atomic — two concurrent pushes, only one wins, the second gets rejected as non-fast-forward. If our claim is that push, the loser's `lyt claim` can detect the rejection and roll back cleanly.

Draft PRs additionally give the lead dev a visible feed of every claim without any extra infrastructure.

## Proposed flow

`lyt claim ISS-XXXX` does, in order:

1. Run `lyt claim`'s freshness check from ISS-0041 (fetch + compare).
2. Create a new branch `chore/claim-ISS-XXXX` from `origin/main`.
3. Move the issue file from `2-sprint/` to `3-in-progress/`, update frontmatter:
   - `status: 3-in-progress`
   - `assignee: <git user.name>`
   - `claimed_at: <ISO timestamp>`
4. Regenerate `BOARD.md` on the claim branch.
5. Commit: `chore: @<user> claims ISS-XXXX`.
6. Push the branch.
   - **If push fails** (non-fast-forward because someone else claimed first): abort, reset to pre-claim state, tell the user who got there first, suggest retry after `lyt claim --refresh`.
7. If `gh` CLI is installed: `gh pr create --draft --title "chore: claim ISS-XXXX" --body <summary> --base main --head chore/claim-ISS-XXXX`.
   - PR serves as the visible record of the claim. Can be merged immediately (the claim branch is tiny) or kept open until the work branch is ready.
8. Create the work branch `feat/ISS-XXXX-<slug>` from the claim branch (so the work branch already contains the claim commit).
9. Switch to the work branch. Dev starts coding.

## Degraded modes

- **No `gh` installed**: everything above works minus the PR step. CLI prints the branch name and suggests `gh pr create --draft` or the web URL manually.
- **No push access to main**: expected; the flow never pushes to main directly, only to `chore/claim-*` branches.
- **Offline**: aborts with clear instruction to reconnect. Claims require origin by design.
- **Branch already exists on origin** (someone else claimed): rejected push detected, clean rollback, retry prompt.

## `lyt unclaim`

Mirrors the same flow: branch `chore/unclaim-ISS-XXXX`, revert frontmatter, push, close any open claim PR. Document clearly that unclaim only works before the work branch has commits of its own — otherwise use a normal PR with a rename.

## What to verify with users

- Does `chore/claim-*` branch proliferation become noisy? If yes, add `lyt board --cleanup` to delete merged claim branches.
- Does auto-merging the claim PR (via `gh pr merge --auto`) feel right, or do teams want explicit review?
- Do teams on GitLab / Bitbucket need adapter equivalents (`glab`, `bb`)?

## Checklist

- [ ] Implement the 9-step flow in `commands/claim.ts`
- [ ] Detect push rejection and roll back atomically (no half-applied state)
- [ ] Integrate `gh` with graceful fallback when absent
- [ ] Mirror the flow for `unclaim`
- [ ] Update `start` to chain `claim` internally
- [ ] Tests: happy path, push-rejected path, no-gh fallback, offline abort, --force override
- [ ] Document the new behaviour in `/method/issue-board` (EN + FR) and in the CLI README

## Definition of done

- Two concurrent `lyt claim` on the same issue: exactly one wins, the other rolls back cleanly with a clear message
- `gh` draft PR appears for every successful claim when `gh` is installed
- Lead dev can watch incoming claims via GitHub PR list (or `gh pr list --draft`)
- No commits on `main` made directly by the claim flow
- All tests pass
