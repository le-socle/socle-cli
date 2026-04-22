---
id: ISS-0062
title: "Restore issue-board and Git hygiene for public repository readiness"
type: chore
priority: P2-normal
effort: XS
complexity: light
domain: [workflow, git, board]
skill: git-workflow
skills_aux: [documentation]
status: 5-done
branch: "chore/ISS-0062-board-housekeeping"
depends: []
created: 2026-04-22
updated: 2026-04-22
---

# ISS-0062 — Restore issue-board and Git hygiene for public repository readiness

## Context

After closing the four reviewed issues and archiving older completed work, the repository state was correct functionally but not yet presentation-clean for a public audience:

- the board/archive snapshot had to be regenerated coherently from the local CLI
- the cleanup lived on a generic branch name without an issue id
- the housekeeping commit also lacked an explicit `ISS-XXXX` reference

For a public repository that demonstrates the Lytos workflow itself, the meta-work must follow the same issue/branch/PR discipline as product work.

## Definition of done

- [x] The board snapshot reflects the real current issue state
- [x] The cleanup work is tracked by an explicit issue
- [x] The branch name follows `type/ISS-XXXX-slug`
- [x] The commit message references the issue
- [x] A replacement PR is opened with the compliant branch

## Notes

- Administrative issue created to realign the repository with its own published workflow before public exposure.
