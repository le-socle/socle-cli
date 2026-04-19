---
id: ISS-0019
title: Implement lyt upgrade — update method files without overwriting user work
type: feature
priority: P1-high
effort: L
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: feat/ISS-0019-lyt-upgrade
depends: []
created: 2026-04-14
updated: 2026-04-19
---
# ISS-0019 — Implement lyt upgrade — update method files without overwriting user work

## Context

Currently `lyt init` only creates the `.lytos/` directory. Users who installed Lytos never receive updates to skills, rules, or templates. If we add a new rule or fix a skill, existing users miss it.

We need a `lyt upgrade` command that safely brings in new method files without destroying user customizations.

## Audit note — 2026-04-19

Reopened after lead-dev audit.

- A first `lyt upgrade` command exists and upgrades bundled method files.
- The issue contract is not fulfilled yet:
- no automated tests cover the upgrade scenarios promised by the issue;
- the command does not track a method version or categorize files as proposed;
- it currently overwrites any differing upgradeable file after a yes/no prompt, which is weaker than the planned "safe update vs conflict" behavior;
- the repo quality gate is still red on `src/commands/upgrade.ts` because of an unused import, so this feature is not integrated cleanly.

## Proposed solution

`lyt upgrade` should:

1. Fetch the latest method version from GitHub (or compare with bundled version)
2. Compare local files with the template
3. Apply these rules:

### Safe to update automatically
- New files that don't exist locally → add them
- Files that the user hasn't modified (identical to previous template version) → update them

### Never touch
- `manifest.md` — user content, never overwrite
- `memory/` — user content, never overwrite
- `issue-board/` — user content, never overwrite
- `sprint.md` — user content, never overwrite

### Requires user confirmation
- Files that exist locally AND have been modified by the user AND have upstream changes → show diff, ask to merge or skip

## Checklist

- [ ] Detect current method version (store in `.lytos/.version` or similar)
- [ ] Fetch latest template files
- [ ] Diff local vs template for each file
- [ ] Categorize: new / unchanged / user-modified / upstream-modified / both-modified
- [ ] Apply safe updates, prompt for conflicts
- [ ] Show summary of what was updated
- [ ] Tests for each scenario

## Definition of done

- `lyt upgrade` updates skills and rules without touching manifest, memory, or issues
- User-modified files are not overwritten without confirmation
- New files are added automatically
- Summary shows what changed
- All tests pass
