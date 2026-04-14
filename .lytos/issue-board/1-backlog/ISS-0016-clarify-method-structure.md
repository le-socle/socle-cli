---
id: ISS-0016
title: "Clarify the 5 pillars and reorganize repo structure"
type: docs
priority: P1-high
effort: M
complexity: standard
skill: documentation
status: 1-backlog
branch: "docs/ISS-0016-clarify-method-structure"
depends: []
created: 2026-04-14
updated: 2026-04-14
---

# ISS-0016 — Clarify the 5 pillars and reorganize repo structure

## Context

The lytos-method repo mixes two things at the same level:
- The **method itself** (the 5 pillars: what gets installed in `.lytos/`)
- **Documentation about the method** (`agents/`, `adapters/`, `docs/`)

This creates confusion: a user (or an AI agent) reading the repo cannot tell what is part of the method vs what is explanatory documentation. The `agents/` folder looks like a 6th pillar, but it's not — it's documentation about how agents consume the method.

Additionally, the 5 pillars are not explicitly named and defined anywhere in the repo. A user, a trainer, or an AI agent should be able to find a clear reference that says: "Lytos has 5 pillars, here they are, here's what each one does."

## The 5 pillars

| Pillar | Name | Purpose | Directory |
|--------|------|---------|-----------|
| 1 | **Intent** | The project's constitution — why it exists | `manifest.md` |
| 2 | **Design** | Procedures for recurring tasks | `skills/` |
| 3 | **Standards** | Non-negotiable quality criteria | `rules/` |
| 4 | **Progress** | What's moving, what's blocked | `issue-board/` |
| 5 | **Memory** | Accumulated knowledge, sovereign and portable | `memory/` |

These 5 pillars are the method. Everything else is documentation, tooling, or adapters.

## Checklist

### Reorganize repo structure
- [ ] Move `agents/` → `docs/en/agents/` (it's documentation, not a pillar)
- [ ] Move `adapters/` → `docs/en/adapters/` (guides per tool, not a pillar)
- [ ] Update all internal links referencing `agents/` and `adapters/`

### Document the 5 pillars explicitly
- [ ] Add a "The 5 Pillars" section in `README.md` (EN) with table + directory mapping
- [ ] Add the same section in `docs/fr/README.md` (FR)
- [ ] Add the same section in `LYTOS.md` (the method file installed in every project)
- [ ] Ensure `MANIFESTO.md` / `MANIFESTE.md` reference the 5 pillars by name

### Ensure the starter reflects the 5 pillars only
- [ ] Verify `starter/.lytos/` contains only the 5 pillar directories (no agents/, no adapters/)
- [ ] Update `starter/README.md` to reference the 5 pillars

## Why this matters

- **For users**: they need to understand what they're installing and why each piece exists
- **For trainers/educators**: they need consistent vocabulary to teach the method (Intent, Design, Standards, Progress, Memory)
- **For AI agents**: they need to know what to read (the 5 pillars) vs what is reference documentation
- **For contributors**: they need to know where to put new content

## Definition of done

- The 5 pillars are explicitly named and described in README.md, docs/fr/README.md, and LYTOS.md
- `agents/` and `adapters/` are in `docs/`, not at the root
- `starter/.lytos/` contains only the 5 pillar directories
- No broken internal links
