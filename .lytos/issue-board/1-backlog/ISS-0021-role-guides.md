---
id: ISS-0021
title: "Create role-based guides: developer and lead developer"
type: docs
priority: P1-high
effort: M
complexity: standard
skill: documentation
status: 1-backlog
branch: "docs/ISS-0021-role-guides"
depends: []
created: 2026-04-14
updated: 2026-04-14
---

# ISS-0021 — Create role-based guides: developer and lead developer

## Context

Working with AI is a paradigm shift. Developers and lead developers have no structured guidance on how to collaborate with AI using Lytos. Each person improvises. The method defines the *what* (5 pillars) but not the *how* for each role.

These guides should be practical, opinionated, and specific to Lytos workflows.

## Proposed solution

Create two guides on the website (`lytos.org`) and in the method repo (`docs/`).

### Guide 1 — Developer

Target: a developer who uses `lyt` daily with an AI agent.

Content:
- How to write an issue the AI can execute well (context, checklist, definition of done)
- The `lyt claim` → work → close workflow
- When to let the AI finish vs when to intervene
- How to enrich the memory after each task (what to save, what not to)
- How to read and use the skills during a session
- Common mistakes (too vague issues, skipping close phase, not updating memory)

### Guide 2 — Lead Developer

Target: a lead who defines the method and supervises the team.

Content:
- How to write a good manifest (the highest-leverage activity)
- How to define rules that work (verifiable, not aspirational)
- How to review AI-produced work (validate intent, not read code)
- How to plan a sprint with dependency graphs
- How to use `lyt board` for supervision
- How to maintain the memory (consolidation, cleanup, relevance)
- When to add custom skills vs rely on defaults
- How to onboard a new dev onto a Lytos project

### Location

- Website: `lytos.org/en/guides/developer/` and `/guides/lead/`
- Website FR: `lytos.org/fr/guides/developer/` and `/guides/lead/`
- Method repo: `docs/en/guides/` and `docs/fr/guides/`

## Checklist

- [ ] Write developer guide EN
- [ ] Write lead developer guide EN
- [ ] Translate developer guide FR
- [ ] Translate lead developer guide FR
- [ ] Add guides section to website sidebar (astro.config.mjs)
- [ ] Link from README and homepage

## Definition of done

- Both guides published on lytos.org (EN + FR)
- Guides are practical with concrete examples, not theoretical
- Sidebar has a "Guides" section with both roles
- Homepage links to the guides
