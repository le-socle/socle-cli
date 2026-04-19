---
id: ISS-0023
title: Archive system — separate done issues from active board for token efficiency
type: feature
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: feat/ISS-0023-archive-system
depends: []
created: 2026-04-15
updated: 2026-04-19
---
# ISS-0023 — Archive system — separate done issues from active board for token efficiency

## Context

BOARD.md currently contains all issues including done. On a project with 1000+ issues, this means the AI loads hundreds of irrelevant lines at every session. This wastes tokens and context window space.

The method should always optimize for token economy — load only what's needed.

## Audit note — 2026-04-19

Reopened after lead-dev audit.

- The archive mechanism exists and `archive/INDEX.md` is generated.
- The board generator still computes `Next number` from active issues only.
- Current visible symptom: `BOARD.md` advertises `ISS-0027` / `ISS-0028` even though the archive already contains issues up to `ISS-0037`.
- This reintroduces issue-ID collision risk, so the archive system is not done yet.

## Proposed solution

### New structure

```
issue-board/
├── BOARD.md                    # Active issues only (icebox → review)
├── 0-icebox/
├── 1-backlog/
├── 2-sprint/
├── 3-in-progress/
├── 4-review/
└── archive/
    ├── INDEX.md                # Compact summary — 1 line per done issue
    ├── 2026-Q1/
    │   ├── ISS-0001.md
    │   ├── ISS-0002.md
    │   └── ...
    └── 2026-Q2/
        ├── ISS-0011.md
        └── ...
```

### INDEX.md — the search key

One line per archived issue with tags for efficient search:

```markdown
# Archive

| # | Title | Tags | Sprint | Completed |
|---|-------|------|--------|-----------|
| ISS-0001 | Setup Node.js project | setup, infra | Sprint #01 | 2026-04-13 |
| ISS-0007 | npm publish | deploy, npm | Sprint #01 | 2026-04-13 |
| ISS-0011 | Rename method repo | refactor, rename | Sprint #02 | 2026-04-14 |
```

### How AI searches efficiently

1. Read INDEX.md (compact, 1 line per issue)
2. Find relevant issue by tag/title
3. Read only that specific archive file

Result: 2 files read instead of scanning all done issues.

### Tags

Tags are added to the issue frontmatter as a new field:

```yaml
tags: [deploy, npm, ci]
```

One issue can have multiple tags. Tags enable cross-cutting search (an issue can be both "feature" + "api" + "security").

### Quarterly folders

`archive/YYYY-QN/` folders prevent a single directory with 500+ files. This is physical organization, not semantic — the tags handle semantic search.

The quarter is determined by the issue's completion date.

## Changes to `lyt board`

- BOARD.md no longer includes `5-done` section
- BOARD.md shows: `## Done: 142 issues archived → see archive/INDEX.md`
- `lyt board` terminal display unchanged (already shows just the count)
- New: `lyt board` moves newly completed issues from `5-done/` to `archive/YYYY-QN/` and updates INDEX.md

## Changes to issue frontmatter

Add optional `tags` field:

```yaml
tags: [feature, api, security]
```

## Checklist

- [ ] Add `tags` field support to frontmatter parser
- [ ] Create `archive/` directory structure in `lyt init`
- [ ] Modify `lyt board` to move `5-done/` issues to `archive/YYYY-QN/`
- [ ] Generate `archive/INDEX.md` from archived issues
- [ ] Remove `5-done` section from BOARD.md, replace with summary line
- [ ] Update terminal display to show archive count
- [ ] Update method documentation
- [ ] Tests for archiving, INDEX generation, tag parsing

## Definition of done

- BOARD.md contains only active issues
- Done issues live in `archive/YYYY-QN/` with individual files
- INDEX.md provides compact searchable index
- `lyt board` handles the migration automatically
- Tags field supported in frontmatter
- All tests pass
- Token usage for a 1000-issue project is ~20 lines (INDEX) instead of ~1000 lines (BOARD.md)
