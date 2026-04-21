---
id: ISS-0056
title: "Reduce friction from mandatory `lyt board` regeneration on every issue move"
type: refactor
priority: P2-normal
effort: S
complexity: standard
domain: [cli, workflow, board]
skill: ""
skills_aux: [code-structure]
status: 1-backlog
branch: "refactor/ISS-0056-reduce-board-regeneration-friction"
depends: []
created: 2026-04-21
updated: 2026-04-21
---

# ISS-0056 — Reduce friction from mandatory `lyt board` regeneration on every issue move

## Context

The current workflow asks for `lyt board` regeneration after every issue move. This keeps the board accurate, which is good. But on small projects or frequent status changes, it also introduces repetitive command overhead.

External feedback does not frame this as a blocker, but as a meaningful friction point. If left unaddressed, it can push users toward bypassing the intended workflow on small tasks.

We should keep board accuracy, but investigate whether the same guarantee can be delivered with less user-visible friction.

## Proposed solution

1. Review every place where the workflow requires manual `lyt board`.
2. Identify which transitions are already automated by CLI commands and which still depend on manual board regeneration.
3. Design a lower-friction path, for example:
   - more transitions handled by CLI commands
   - stronger `--check` / stale-board detection
   - clearer guidance on when regeneration is required vs already implicit
4. Preserve board correctness as the non-negotiable constraint.

## Definition of done

- [ ] The current regeneration friction is mapped clearly
- [ ] A concrete improvement path is chosen and implemented, or a deliberate product decision is documented
- [ ] Board correctness remains guaranteed
- [ ] Tests cover the chosen behavior
- [ ] Documentation reflects the resulting workflow

## Checklist

### Investigation
- [ ] Inventory all workflow steps that currently depend on `lyt board`
- [ ] Separate real correctness constraints from habit or historical convention

### Implementation
- [ ] Implement the chosen friction-reduction path
- [ ] Add or update regression tests

### Documentation
- [ ] Update workflow docs and command help if behavior changes

## Relevant files

- `src/commands/board.ts`
- `src/commands/start.ts`
- `src/commands/close.ts`
- `src/commands/claim.ts`
- `method/skills/session-start.md`

## Notes

- This issue is about workflow ergonomics, not performance micro-optimization.
- It should stay aligned with ISS-0051 if board/archive responsibilities change further.
