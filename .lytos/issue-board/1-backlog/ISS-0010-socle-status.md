---
id: ISS-0010
title: "Implement socle status command"
type: feat
priority: P2-normal
effort: M
complexity: standard
skill: code-structure
status: 1-backlog
depends: [ISS-0003]
created: 2026-04-13
---

# ISS-0010 — Implement `socle status`

## What to do

Display the sprint DAG in terminal with ASCII art. Show which issues are done, in progress, blocked, and ready to start.

## Definition of done

- [ ] Reads sprint.md and issue frontmatter
- [ ] Displays dependency graph in ASCII
- [ ] Color-coded by status (done=green, in-progress=yellow, blocked=red, ready=white)
- [ ] Shows which issues are unblocked and ready to start
- [ ] `--json` outputs structured data
