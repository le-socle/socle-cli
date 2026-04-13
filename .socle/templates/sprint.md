# Sprint — [Sprint Name]

*This file is the desired state of the current sprint. The orchestrator reads it to allocate agents. The human updates it.*

---

## Meta

**Sprint**: #XX
**Objective**: *One sentence describing what this sprint must accomplish*
**Start**: YYYY-MM-DD
**Expected end**: YYYY-MM-DD
**Status**: `in-progress` | `completed` | `blocked`

---

## Sprint objective

*What must be deliverable at the end of this sprint? Not a task list — a result.*

---

## Sprint backlog

### 🔴 P0 — Critical

| ID | Title | Effort | Skill | Depends | Status |
|----|-------|--------|-------|---------|--------|
| [ISS-XXXX](./issue-board/ISS-XXXX.md) | | XS/S/M/L/XL | | | open |

### 🟠 P1 — High

| ID | Title | Effort | Skill | Depends | Status |
|----|-------|--------|-------|---------|--------|
| [ISS-XXXX](./issue-board/ISS-XXXX.md) | | | | | open |

### 🟡 P2 — Normal

| ID | Title | Effort | Skill | Depends | Status |
|----|-------|--------|-------|---------|--------|
| [ISS-XXXX](./issue-board/ISS-XXXX.md) | | | | | open |

### 🔵 P3 — Low

| ID | Title | Effort | Skill | Depends | Status |
|----|-------|--------|-------|---------|--------|
| [ISS-XXXX](./issue-board/ISS-XXXX.md) | | | | | open |

---

## Dependency graph

*Tasks without dependencies can start in parallel. Others must wait.*

```
ISS-XXXX ──────────────────────────► ISS-XXXX
                                          │
ISS-XXXX ──────────────────────────►     ▼
                                     ISS-XXXX (gate)
ISS-XXXX ──► ISS-XXXX ──────────►       │
                                         ▼
                                     ISS-XXXX (deliverable)
```

---

## Quality gates

*Mandatory checks before considering the sprint complete.*

- [ ] Unit tests pass
- [ ] Playwright tests pass
- [ ] Code review done
- [ ] Documentation updated
- [ ] Memory updated

---

## Blockers

*What's preventing progress. Resolve as a priority.*

| Blocker | Impact | Action |
|---------|--------|--------|
| | | |

---

## Sprint notes

*Decisions made, important context, changes of direction.*

---

## Retrospective

*To be filled at the end of the sprint.*

**What went well:**

**What went wrong:**

**What we change for the next sprint:**

---

*Last updated: YYYY-MM-DD*
