---
id: ISS-0018
title: "Add rule: no work without issue, mandatory close phase"
type: feature
priority: P1-high
effort: S
complexity: light
skill: documentation
status: 5-done
branch: "feat/ISS-0018-rule-close-phase"
depends: []
created: 2026-04-14
updated: 2026-04-14
---

# ISS-0018 — Add rule: no work without issue, mandatory close phase

## Context

During the rename sprint, multiple tasks were done without issues (homepage rewrites, 22 doc pages, badge fixes, lyt alias, lyt update). The close phase (move issue, update frontmatter, regenerate board) was also skipped repeatedly.

The method's orchestrator documents a 4-phase lifecycle but nothing enforces the close phase. And there's no rule about working without an issue.

## What to do

Add a new rule in both:
- `.lytos/rules/default-rules.md` (our project)
- `rules/default-rules.md` (the method repo — shipped to new users)
- `starter/.lytos/rules/default-rules.md` (the starter template)

### Rule content

**Work tracking:**
- Any work lasting more than 10 minutes or modifying more than 3 files must have an issue
- The agent must propose creating an issue before starting untracked work

**Mandatory close phase:**
- No issue can stay in `3-in-progress` when its work is complete
- After completing a task, the agent must: update frontmatter, move issue file, regenerate board
- The agent must verify and propose closure before starting the next task

## Definition of done

- Rule added to default-rules.md in all 3 locations
- Rule is clear, verifiable, and actionable
