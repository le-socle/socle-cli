---
id: ISS-0022
title: "Add Codex (OpenAI) as AI tool option in lyt init"
type: feature
priority: P1-high
effort: S
complexity: light
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: "feat/ISS-0022-codex-tool"
depends: []
created: 2026-04-15
updated: 2026-04-15
---

# ISS-0022 — Add Codex (OpenAI) as AI tool option in lyt init

## Context

`lyt init` currently offers 3 AI tool choices: Claude Code, Cursor, Other/None. OpenAI Codex is missing and should be added as a first-class option.

Codex uses an `agents.md` file at the project root for agent configuration.

## Checklist

- [ ] Add "Codex (OpenAI)" as option 3 in the tool selection prompt
- [ ] Generate `agents.md` when Codex is selected
- [ ] Update tests
- [ ] Update help/docs

## Definition of done

- `lyt init --tool codex` generates `agents.md`
- Interactive menu shows 4 options
- Tests pass
