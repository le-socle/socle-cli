# Issue Board — socle-cli

> Each issue = a `ISS-XXXX-title.md` file in the folder matching its status.
>
> **Last updated**: 2026-04-13
> **Next number**: ISS-0011

---

## Issue index

### 0-icebox (ideas)

_No issues._

### 1-backlog (prioritized)

| # | Title | Priority | Effort | Depends |
|---|-------|----------|--------|---------|
| [ISS-0008](1-backlog/ISS-0008-socle-lint.md) | Implement `socle lint` | P1-high | M | ISS-0001 |
| [ISS-0009](1-backlog/ISS-0009-socle-doctor.md) | Implement `socle doctor` | P1-high | M | ISS-0008 |
| [ISS-0010](1-backlog/ISS-0010-socle-status.md) | Implement `socle status` | P2-normal | M | ISS-0003 |

### 2-sprint (Sprint #01 — CLI MVP)

| # | Title | Priority | Effort | Depends |
|---|-------|----------|--------|---------|
| [ISS-0003](2-sprint/ISS-0003-socle-board.md) | Implement `socle board` | P1-high | M | ISS-0001 |
| [ISS-0004](2-sprint/ISS-0004-tests-init.md) | Integration tests for `socle init` | P1-high | M | ISS-0002 |
| [ISS-0005](2-sprint/ISS-0005-tests-board.md) | Integration tests for `socle board` | P1-high | S | ISS-0003 |
| [ISS-0006](2-sprint/ISS-0006-ci-pipeline.md) | CI pipeline (GitHub Actions) | P1-high | S | ISS-0004, ISS-0005 |
| [ISS-0007](2-sprint/ISS-0007-npm-publish.md) | npm publish and first release | P1-high | S | ISS-0006 |

### 3-in-progress (in dev)

_No issues._

### 4-review (review/test)

_No issues._

### 5-done (completed)

| # | Title | Completed |
|---|-------|-----------|
| [ISS-0001](5-done/ISS-0001-setup-project.md) | Setup Node.js project | 2026-04-13 |
| [ISS-0002](5-done/ISS-0002-socle-init.md) | Implement `socle init` | 2026-04-13 |

---

*The YAML frontmatter is the source of truth. The folder is the visual status. The BOARD.md is the map.*
