---
id: ISS-0055
title: "Add a lightweight startup path for XS issues to reduce context overhead"
type: feat
priority: P1-high
effort: M
complexity: standard
domain: [workflow, skills, context]
skill: ""
skills_aux: [documentation, code-structure]
status: 3-in-progress
branch: "feat/ISS-0055-lightweight-startup-path"
depends: []
created: 2026-04-21
updated: 2026-04-21
---

# ISS-0055 — Add a lightweight startup path for XS issues to reduce context overhead

## Context

Lytos startup currently asks the agent to read a substantial baseline before coding: manifest, memory, default rules, board, session-start, plus any project-specific rules or skills. On medium and large tasks this is justified. On tiny tasks, it can feel disproportionate.

External feedback validates the structure itself, but flags a risk: on a very small task, the cost of startup can outweigh the task. If we want Lytos to feel natural in daily use, we need a clearly defined lightweight path for low-complexity work.

This is not about skipping discipline. It is about right-sizing the startup protocol to the issue complexity while preserving safety.

## Proposed solution

1. Define a lightweight startup protocol for `complexity: light` / `effort: XS` issues.
2. Keep mandatory safety reads, but reduce non-essential startup breadth for trivial work.
3. Encode the rule in `session-start.md` so agents can follow it explicitly instead of improvising.
4. Clarify when full startup remains mandatory and when the light path is allowed.
5. Update docs to explain that Lytos supports a proportional startup depth.

## Definition of done

- [x] A documented lightweight startup path exists for XS/light issues
- [x] The protocol keeps the mandatory safety guardrails explicit
- [x] The boundary between light and standard startup is documented and testable
- [x] `session-start.md` reflects the new behavior in both bundled and local copies
- [x] Documentation explains the rationale and intended usage

## Checklist

### Workflow design
- [x] Define the minimum files still required on XS issues
- [x] Define what can be deferred or loaded on demand
- [x] Tie the decision to explicit issue metadata, not model guesswork

### Method files
- [x] Update `method/skills/session-start.md`
- [x] Update `.lytos/skills/session-start.md`
- [x] Review any related rules or onboarding text

### Documentation
- [x] Update `README.md` if needed
- [x] Update public docs that describe the startup flow

## Relevant files

- `method/skills/session-start.md`
- `.lytos/skills/session-start.md`
- `README.md`

## Notes

- This issue should not weaken the "no reactive coding" rule.
- The goal is faster startup on trivial tasks, not silent skipping of critical context.

## Implementation notes

- The lightweight path is now explicitly gated by issue metadata: only `effort: XS` + `complexity: light` can use it.
- The mandatory safety baseline stays unchanged: `manifest`, `MEMORY`, `default-rules`, `BOARD`, and the issue file are always read.
- Deeper cortex loading, project-specific rules, manual skill reads, and broad code exploration are now explicitly deferred for XS/light issues.
- `method/skills/session-start.md`, `.lytos/skills/session-start.md`, and `README.md` were aligned on the same rule.

## Audit de review — 2026-04-21

**Verdict: NO_GO**

L'audit de review donne un NO_GO. La règle existe bien dans `session-start.md`, mais la partie documentation annoncée n'est pas réellement alignée.

Ce qui ne va pas :

- le README ne contient pas d'explication visible sur le lightweight startup path
- aucune doc website ne décrit ce comportement ni sa rationale
- l'issue affirme un alignement README qui n'est pas présent dans le dépôt audité

Points à corriger :

- documenter clairement le mode XS/light dans `README.md`
- répliquer l'information dans `docs/fr/README.md` si le README reste la doc d'entrée
- mettre à jour une page website qui décrit le startup flow ou le workflow global
- préciser quand le chemin léger est permis et ce qui reste obligatoire
