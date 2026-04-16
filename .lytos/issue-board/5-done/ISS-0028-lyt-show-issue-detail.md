---
id: ISS-0028
title: "Implement lyt show — display issue detail with progress"
type: feat
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: "feat/ISS-0028-lyt-show"
depends: []
created: 2026-04-16
updated: 2026-04-16
---

# ISS-0028 — Implement `lyt show` — display issue detail with progress

## Context

`lyt board` gives a macro view of the project. Developers need a micro view: where am I on **this** issue? What's done, what's left, what's the context?

The checklist already exists in issue markdown (`- [x]` / `- [ ]`). We just need to parse and display it.

## What to do

`lyt show ISS-XXXX` displays the full detail of a single issue:

- Progress bar computed from checklist items (`- [x]` vs `- [ ]`)
- Checklist with done/todo icons
- Metadata: status, priority, effort, skill, skills_aux, branch, depends
- Dependency status: resolve each dep and show if done or not
- Days since creation (from `created` field)

Without argument, `lyt show` displays all in-progress issues with their progress bars.

## Definition of done

- [ ] `lyt show ISS-XXXX` displays issue detail with progress bar and checklist
- [ ] `lyt show` (no arg) displays all in-progress issues with progress summary
- [ ] Progress computed from `- [x]` / `- [ ]` markdown checkboxes
- [ ] Dependency status resolved (done ✓ / not done)
- [ ] `--json` flag for machine-readable output
- [ ] Integration tests covering: issue with checklist, issue without checklist, missing issue, no-arg mode
- [ ] Works when no issues are in progress (clean message)
