---
id: ISS-0061
title: "Codify tick-as-you-go: tick DoD checkboxes immediately, never in batch"
type: docs
priority: P1-high
effort: XS
complexity: light
domain: [method, skills]
skill: "documentation"
skills_aux: []
status: 4-review
branch: "feat/ISS-0061-tick-as-you-go"
depends: []
created: 2026-04-22
updated: 2026-04-22
---

# ISS-0061 — Codify tick-as-you-go as a Lytos practice

## Context

On ISS-0059 (`lyt review`) the implementer ticked the Definition-of-Done checkboxes in a single batch at end-of-task and missed several items — the issue landed in `4-review` with 7 unchecked boxes that actually *were* done. The correction required a second pass.

This is a recurring failure mode. The DoD is a live contract, not a summary. Batching the ticks at the end is:

- **Unsafe.** Easy to miss items under review pressure.
- **Opaque.** An unchecked box reads as "not done yet" to the next session, the auditor, or the human — whether the code actually exists or not.
- **Un-auditable.** The implementer's confidence replaces explicit state.

The fix is a procedure rule: **when an item is done, tick it immediately — before moving to the next one**. This is not a style preference; it's the only reliable discipline when multiple items land across commits, branches, and sessions.

## Proposed solution

Codify the rule in two places:

1. **`skills/session-start.md`** — add a dedicated section "During execution — tick as you go" between the startup protocol and task completion. Covers: when to tick, why batching fails, what to do when an item turns out to be out of scope (annotate, don't silently drop).
2. **`LYTOS.md`** (method briefing) — add a bullet to the "Expected behavior" list so it's part of the onboarding contract, not buried in a skill.

Apply to all three canonical locations:
- `lytos-cli/.lytos/skills/session-start.md` (canonical for this project)
- `lytos-cli/method/skills/session-start.md` (bundled with the CLI for scaffolding)
- `lytos-method/skills/session-start.md` (method repo source of truth)

Same for `LYTOS.md`:
- `lytos-cli/.lytos/LYTOS.md`
- `lytos-cli/method/LYTOS.md`
- `lytos-method/LYTOS.md`

No CLI code change. No test change. Pure method codification.

## Definition of done

### Skill update

- [x] `skills/session-start.md` gains a section "During execution — tick as you go" covering: timing (immediately, not at end), why batching fails, handling out-of-scope items (annotate + keep unchecked, never silently drop)
- [x] Same section present in lytos-cli `.lytos/`, lytos-cli `method/`, and lytos-method `skills/`

### LYTOS.md update

- [x] "Expected behavior" list in LYTOS.md gains a "Tick the DoD as you go" bullet
- [x] Same update in lytos-cli `.lytos/`, lytos-cli `method/`, and lytos-method root

### Meta

- [x] The implementer of this issue ticks these DoD items **as they complete each one** — the rule applies to itself. If a batch happens at the end, the rule failed even on its own PR

## Relevant files

- `.lytos/skills/session-start.md`
- `method/skills/session-start.md`
- `.lytos/LYTOS.md`
- `method/LYTOS.md`
- `../lytos-method/skills/session-start.md`
- `../lytos-method/LYTOS.md`

## Notes

- **Out of scope:** automating checkbox validation in `lyt doctor` (would require parsing intent — defer).
- **Out of scope:** website documentation of this rule — skills aren't exposed as individual pages today; the /workflow page already covers the high-level flow.
- **Why P1-high:** the failure mode it prevents is silent drift between "what the issue says is done" and "what's actually done". On a cross-model audit workflow this is load-bearing.

## Audit de review — 2026-04-22

**Verdict: GO**

La règle est bien codifiée aux endroits attendus dans ce repo : section "During execution — tick as you go" dans `session-start.md`, et nouveau bullet "Tick the DoD as you go" dans `LYTOS.md`, à la fois dans `.lytos/` et dans `method/`. Le miroir `../lytos-method` est également aligné localement.

Points vérifiés :

- ajout dans `.lytos/skills/session-start.md`
- ajout dans `method/skills/session-start.md`
- ajout dans `.lytos/LYTOS.md`
- ajout dans `method/LYTOS.md`
- alignement constaté aussi dans `../lytos-method`

Pas de finding bloquant sur ce diff.
