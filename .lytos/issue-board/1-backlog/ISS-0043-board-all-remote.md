---
id: ISS-0043
title: "lyt board --all --remote: lead-view from origin, not local"
type: feature
priority: P2-normal
effort: S
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 1-backlog
branch: "feat/ISS-0043-board-remote"
depends: []
created: 2026-04-19
---

# ISS-0043 — lyt board --all --remote: lead-view from origin, not local

## Context

A lead developer watching a team's progress runs `lyt board --all` today. The output reflects whatever state each local repo happens to be in — which may be hours behind origin. Without an extra `git pull` per repo, the lead sees stale claims and misses issues that teammates have moved since the last fetch.

A small flag that runs `git fetch origin main` per repo and reads the board from `origin/main` (not local FS) gives near-real-time visibility without any new infrastructure.

## Proposed behaviour

`lyt board --all --remote`:

1. For each sibling repo that has `.lytos/issue-board/`:
   - Run `git fetch origin main --quiet` in the background
   - Read every issue frontmatter from `origin/main` (via `git show origin/main:<path>`), not from the working tree
2. Render the same consolidated overview as `--all`, but with a freshness indicator: `synced 4s ago`.
3. Degraded mode: if a repo can't fetch (offline, no origin, non-git), fall back to local state and mark that repo with a `(local)` tag.

Optional flag: `lyt board --all --remote --watch` polls every 30s and refreshes the terminal view (live dashboard for a lead who's actively watching).

## Relevant files

- `src/lib/board-overview.ts` — the current multi-repo aggregator
- `src/lib/board-generator.ts` — add a `collectFromRef(repo, ref)` helper that reads issue frontmatter from a git ref instead of the working tree
- `src/commands/board.ts` — add the `--remote` flag (and later `--watch`)

## Checklist

- [ ] Add `collectFromRef()` in board-generator
- [ ] Wire `--remote` flag in the board command
- [ ] Per-repo fetch with a short timeout
- [ ] Freshness indicator in the render
- [ ] Degraded-mode fallback per repo (offline, no origin)
- [ ] Tests: mixed offline/online repos, remote with stale local, fetch failure
- [ ] Consider `--watch` as a follow-up iteration

## Definition of done

- `lyt board --all --remote` shows the state of each repo as of the last push to origin, not the local working tree
- Works even if one of the repos is offline — that repo is shown as `(local)` without blocking the others
- Fetch uses a timeout so a slow repo doesn't hang the command
- Tests cover the happy path and the degraded modes
