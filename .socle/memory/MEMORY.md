# Memory — [Project Name]

*This file is the project memory's table of contents. It is read by agents at the start of each session to know which sections to load. Do not read everything — load only what is relevant to the current task.*

> **Last updated**: YYYY-MM-DD
> **Number of entries**: 0

---

## How to Use This Memory

1. The agent reads this table of contents at session startup
2. It identifies the sections relevant to its task (via the issue domain)
3. It loads only the necessary files
4. After the task, it updates the relevant file and this table of contents if needed

**Rule**: an agent working on the front end does not need to read `backend.md`. An agent doing a code review reads `architecture.md` and `patterns.md`, not `business.md`.

---

## Section Index

| File | Content | Load when... |
|------|---------|--------------|
| [architecture.md](./cortex/architecture.md) | Architectural decisions, structural technical choices | Any task that affects the project structure |
| [backend.md](./cortex/backend.md) | Patterns, pitfalls, and solutions on the server side | Backend task (API, DB, services, auth) |
| [frontend.md](./cortex/frontend.md) | Patterns, pitfalls, and solutions on the client side | Frontend task (UI, components, styles, JS) |
| [patterns.md](./cortex/patterns.md) | Recurring code patterns that work well | Code review, refactoring, writing new code |
| [bugs.md](./cortex/bugs.md) | Recurring problems and their solutions | Debug, fix, and before exploring a path already tried |
| [business.md](./cortex/business.md) | Business context, vocabulary, implicit rules | Task that involves business logic or UX |
| [sprints.md](./cortex/sprints.md) | History of past sprints and key learnings | Sprint start, retrospective, planning |

---

## Living Summary

*3-5 lines max. The current state of the project at a glance. Updated at the end of each sprint.*

---

*The folder is the structure. The file is the content. This table of contents is the map.*
