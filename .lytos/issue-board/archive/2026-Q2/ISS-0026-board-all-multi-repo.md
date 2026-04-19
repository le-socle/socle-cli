---
id: ISS-0026
title: Add lyt board --all for multi-repo overview
type: feature
priority: P2-normal
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: feat/ISS-0026-board-all
depends: []
created: 2026-04-15
updated: 2026-04-19
---
# ISS-0026 — Add lyt board --all for multi-repo overview

## Context

A developer or lead working across multiple repos (lytos-cli, lytos-method, lytos-website, etc.) has to `cd` into each repo and run `lyt board` separately. There's no consolidated view.

This is the terminal equivalent of what the SaaS will provide as a web dashboard. Building it in the CLI first validates the UX.

## Proposed solution

`lyt board --all` scans sibling directories for `.lytos/issue-board/` and displays a consolidated overview:

```
  ╔════════════════════════════════════════════════════╗
  ║  LYTOS OVERVIEW                                   ║
  ╚════════════════════════════════════════════════════╝

  lytos-cli        ██████████░░  8 backlog · 17 done
  lytos-method     ████████░░░░  4 backlog · 1 wip · 4 done
  lytos-website    ████████████  0 backlog · all done
  lytos-saas       ░░░░░░░░░░░░  not started

  ────────────────────────────────────────────────────
  4 projects · 12 backlog · 1 wip · 21+ done
```

### Discovery logic

1. Look at parent directory of cwd
2. Scan all sibling directories for `.lytos/issue-board/`
3. For each found, run collectIssues and count per status
4. Display progress bar + summary per repo

### Options

- `--all` — scan sibling directories
- `--dirs <path1,path2>` — explicit list of directories to include

## Checklist

- [ ] Add `--all` flag to board command
- [ ] Implement sibling directory scanning
- [ ] Create overview display with progress bars
- [ ] Add `--dirs` flag for explicit paths
- [ ] Tests for multi-repo scanning
- [ ] Tests for overview display

## Definition of done

- `lyt board --all` shows consolidated view of all sibling Lytos projects
- Progress bars show ratio of done vs total
- Summary line shows totals across all projects
- Works with 0 to N sibling projects
- All tests pass
