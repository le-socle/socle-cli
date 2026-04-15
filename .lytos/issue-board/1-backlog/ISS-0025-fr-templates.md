---
id: ISS-0025
title: "Generate French templates when language is fr"
type: fix
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing]
status: 1-backlog
branch: "feat/ISS-0025-fr-templates"
depends: [ISS-0024]
created: 2026-04-15
updated: 2026-04-15
---

# ISS-0025 — Generate French templates when language is fr

## Context

ISS-0024 added language selection to `lyt init` but only translated the CLI messages and briefings. The generated templates (manifest.md, memory/MEMORY.md, board/BOARD.md, cortex files) are still in English even when the user selects French.

A vibe coder who chooses "Français" and opens manifest.md sees "Why this project exists" — that breaks the promise.

## Checklist

- [ ] Translate `manifestTemplate()` — section headers, placeholder text
- [ ] Translate `memoryTemplate()` — section headers, instructions
- [ ] Translate `boardTemplate()` — section headers
- [ ] Translate `cortexTemplate()` — titles, descriptions, examples
- [ ] Pass `lang` parameter to all template functions
- [ ] Tests: verify FR templates when `--lang fr`
- [ ] Tests: verify EN templates unchanged when `--lang en`

## Definition of done

- `lyt init --lang fr` generates manifest.md with French section headers
- `lyt init --lang en` generates English (unchanged from current)
- All template content adapted, not just headers
- All tests pass
