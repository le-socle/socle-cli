---
id: ISS-0057
title: "Validate Lytos on a real feature workflow with human controls"
type: chore
priority: P1-high
effort: M
complexity: standard
domain: [validation, workflow, product]
skill: ""
skills_aux: [documentation]
status: 1-backlog
branch: "chore/ISS-0057-validate-lytos-real-feature"
depends: []
created: 2026-04-21
updated: 2026-04-21
---

# ISS-0057 — Validate Lytos on a real feature workflow with human controls

## Context

The strongest external feedback ends with the right product test: not cleanup, not scaffolding, but a real feature with code, tests, and human-only checks. That is where we can verify whether the full Lytos workflow holds under realistic conditions.

The current method is persuasive in theory and on CLI-level changes. The next confidence milestone is a feature workflow where:

- the AI must implement non-trivial code
- project-specific rules matter
- tests matter
- some validations must remain human-only
- the issue stops in `4-review` until those validations are complete

This is the right way to validate both the method and the ergonomics.

## Proposed solution

1. Select one real feature task in a real project using Lytos.
2. Run it end-to-end with the full workflow:
   - issue framing
   - startup
   - implementation
   - tests
   - human controls
   - review stop
   - explicit close
3. Capture what held, what created friction, and what required human clarification.
4. Convert findings into concrete backlog issues, not a vague retro.

## Definition of done

- [ ] A real feature workflow is executed end-to-end with Lytos
- [ ] Human-only controls are explicitly identified and exercised
- [ ] The review stop is validated in practice, not only in theory
- [ ] Findings are documented in a reusable way
- [ ] Actionable follow-up issues are created for the gaps discovered

## Checklist

### Validation setup
- [ ] Pick the target project and feature
- [ ] Define the human checks that the AI cannot validate alone

### Execution
- [ ] Run the feature through the normal Lytos workflow
- [ ] Capture friction points during startup, implementation, review, and close

### Output
- [ ] Write a concise validation report
- [ ] Open follow-up issues for product or workflow gaps

## Relevant files

- `method/skills/session-start.md`
- `README.md`
- `.lytos/issue-board/`

## Notes

- This is a product validation issue, not a pure engineering task.
- Success here should directly inform roadmap prioritization for workflow ergonomics.
