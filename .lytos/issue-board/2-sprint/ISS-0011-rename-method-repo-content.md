---
id: ISS-0011
title: "Replace all socle references in method repo (lytos-method)"
type: refactor
priority: P0-critical
effort: L
complexity: standard
skill: ~
status: 2-sprint
branch: "refactor/ISS-0011-rename-method-repo"
depends: []
created: 2026-04-14
updated: 2026-04-14
---

# ISS-0011 — Replace all socle references in method repo (lytos-method)

## Context

The method repo contains ~398 occurrences of "socle" across ~57 files. Every reference must be updated to reflect the new naming: org `getlytos`, repo `lytos-method`, domain `lytos.org`, brand "Lytos", config dir `.lytos/`, briefing file `LYTOS.md`.

## Proposed solution

Systematic search-and-replace across the entire repo, in order:

1. URLs first (most fragile, exact matches)
2. Directory/file names
3. Brand name in prose
4. Concept noun in prose

## Checklist

### URLs & technical references
- [ ] `github.com/le-socle/socle` → `github.com/getlytos/lytos-method`
- [ ] `github.com/le-socle/socle-cli` → `github.com/getlytos/lytos-cli`
- [ ] `github.com/le-socle/starter` → `github.com/getlytos/starter`
- [ ] `raw.githubusercontent.com/le-socle/socle` → `raw.githubusercontent.com/getlytos/lytos-method`
- [ ] `le-socle.org` → `lytos.org`
- [ ] `noreply@le-socle.dev` → `noreply@lytos.dev`

### Directory & file names
- [ ] `starter/.socle/` → `starter/.lytos/`
- [ ] `SOCLE.md` references → `LYTOS.md`

### Install script (`install.sh`)
- [ ] All GitHub URLs (~6 occurrences)
- [ ] `SOCLE_DIR` variable and `.socle` directory references
- [ ] Brand name in output messages

### GitHub Actions workflows
- [ ] `.github/workflows/init-socle.yml` → rename file + update content
- [ ] `starter/.github/workflows/socle-init.yml` → rename file + update content

### Documentation (EN + FR)
- [ ] `README.md` — brand, URLs, concept noun
- [ ] `MANIFESTO.md` — brand, URLs, domain, concept noun
- [ ] `docs/fr/README.md` — same
- [ ] `docs/fr/MANIFESTE.md` — same
- [ ] `docs/en/QUICKSTART.md` — URLs, directory refs
- [ ] `docs/fr/DEMARRER.md` — URLs, directory refs
- [ ] `org-profile-README.md` — all references
- [ ] `CONTRIBUTING.md` — brand references

### Other files
- [ ] `adapters/*/README.md` (claude-code, cursor, openai) — concept references
- [ ] `skills/session-start.md` — method references
- [ ] `issue-board/` files — update references in existing issues

## Relevant files

~57 files — full list from audit. Key files:
- `install.sh` (67 occurrences)
- `README.md`, `MANIFESTO.md` (~25 each)
- `adapters/*/README.md` (~25-33 each)
- `docs/en/`, `docs/fr/` documentation
- `.github/workflows/`
- `starter/`

## Definition of done

- `grep -ri "socle" .` returns zero matches (excluding `.git/` and `issue-board/`)
- All links point to `github.com/getlytos/`
- Install script works with new URLs
- No broken internal references
