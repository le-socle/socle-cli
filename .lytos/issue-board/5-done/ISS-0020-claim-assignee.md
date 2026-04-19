---
id: ISS-0020
title: Add issue assignment with lyt claim/unclaim and board display
type: feature
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: feat/ISS-0020-claim-assignee
depends: []
created: 2026-04-14
updated: 2026-04-19
---
# ISS-0020 — Add issue assignment with lyt claim/unclaim and board display

## Context

In a team context, the lead developer needs to see who is working on what. Currently there's no way to assign an issue or see assignments in `lyt board`. Two developers could unknowingly start working on the same issue.

This is also the foundation for the future SaaS team dashboard.

## Proposed solution

### 1. Add `assignee` field to issue frontmatter

```yaml
assignee: fredericgalline
```

Empty or absent means unassigned.

### 2. `lyt claim ISS-XXXX` command

- Detect identity from `git config user.name`
- Set `assignee` field in the issue frontmatter
- Move issue to `3-in-progress` (if not already)
- Create the git branch from the issue's `branch` field
- Refuse if already assigned to someone else: `⚠ ISS-XXXX is already claimed by @julie`

### 3. `lyt unclaim ISS-XXXX` command

- Remove the `assignee` field
- Move issue back to `2-sprint`
- Only the assignee or with `--force` flag

### 4. Display assignee in `lyt board`

```
  ▸ IN PROGRESS (2)
  │
  │  ISS-0017  P1  M  Enhance lyt board          @fredericgalline
  │  ISS-0021  P1  S  Fix auth middleware         @julie

  ▸ BACKLOG (4)
  │
  │  ISS-0008  P1  M  Implement lyt lint
```

Show `@name` in a distinct color (cyan/dim) after the title for assigned issues.

## Checklist

- [ ] Add `assignee` to Frontmatter interface
- [ ] Implement `lyt claim ISS-XXXX` command
- [ ] Implement `lyt unclaim ISS-XXXX` command
- [ ] Detect git user from `git config user.name`
- [ ] Update frontmatter parser to handle assignee
- [ ] Display assignee in board-display.ts
- [ ] Refuse double-claim with clear error
- [ ] Tests for claim, unclaim, double-claim, board display

## Definition of done

- `lyt claim ISS-XXXX` assigns and moves to in-progress
- `lyt unclaim ISS-XXXX` unassigns and moves back
- `lyt board` shows @name next to assigned issues
- Double-claim is blocked with a clear message
- All tests pass
