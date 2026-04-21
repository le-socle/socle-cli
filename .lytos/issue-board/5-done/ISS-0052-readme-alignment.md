---
id: ISS-0052
title: Align lytos-cli README and npm metadata with the website's hook + audience pattern
type: chore
priority: P2-normal
effort: S
complexity: light
domain: [docs, npm]
skill: 
skills_aux: []
status: 5-done
branch: chore/ISS-0052-readme-alignment
depends: []
created: 2026-04-21
updated: 2026-04-21
---
# ISS-0052 — Align CLI README and npm metadata with the website pattern

## Context

The website home (`lytos.org/{en,fr}/`) was recently restructured around a strong qualifying hook ("Do you develop with AI?" / "Vous développez avec l'IA ?") followed by a "Who it's for" audience table, then install + commands. The pattern works as a cold-reader funnel.

The CLI README (served identically on GitHub and on npmjs.com) currently opens with a generic "What this tool does" section. No qualifying hook, no audience table. A developer landing on npm from a search result has nothing to anchor on.

The CLI README also has no French version, even though the website ships both languages and the lytos-method README has `docs/fr/README.md`.

`package.json` has a generic description and is missing several discoverable keywords (the AI-tool names that devs search for on npm).

## Proposed solution

### 1. Rewrite `README.md` (EN)

Mirror the website home structure:

1. Title + badges + tagline + cross-language link
2. Hook: "Do you develop with AI?" (full website text, not shortened)
3. "Who it's for" table (vibe-coder / developer / team — same rows as the site)
4. Install (`npm install -g lytos-cli && lyt init`) + outcome line
5. Commands cheat-sheet (existing table — kept)
6. Bridge table for `--tool` adapters (existing — kept)
7. Link to the website for the rest

### 2. Create `docs/fr/README.md`

Mirror the EN structure 1:1 with French copy aligned to the website's FR home (same tone, same wording where possible).

### 3. Update `package.json`

- `description`: switch from "CLI tool for Lytos — a human-first method for working with AI agents" to a value-led one-liner that fits npm's preview width.
- `keywords`: add tool-name discovery hooks (`claude-code`, `cursor`, `codex`, `copilot`, `gemini`, `windsurf`) and concept hooks (`issue-board`, `kanban`, `context-engineering`, `ai-coding`).

## Definition of done

- [x] `README.md` opens with the website's "Do you develop with AI?" hook and the audience table
- [x] `docs/fr/README.md` exists with the same structure in French
- [x] EN README links to the FR README and vice versa
- [x] `package.json` description and keywords updated
- [x] `npm pack --dry-run` confirms README.md is in the published tarball
- [x] No code or test change required

## Relevant files

- `README.md` (EN, root)
- `docs/fr/README.md` (FR, new)
- `package.json` (description, keywords)

## Notes

- This is the first of three parallel README alignments (cli, method, org-profile). Track method and org as separate issues in their respective repos.
- The website FR home wording (`src/content/docs/fr/index.mdx`) is the source of truth for the French translations; reuse verbatim where it fits to keep voice consistent.

## Audit de review — 2026-04-21

**Verdict: GO**

L'audit de review donne un GO.

Points revérifiés :

- `README.md` suit bien la structure hook + audience + install + commandes
- `docs/fr/README.md` existe et renvoie vers la version anglaise
- `package.json` a une description et des keywords alignés avec la discoverability visée
- `npm pack --dry-run --cache /tmp/lytos-npm-cache` confirme que `README.md` part bien dans le package publié
