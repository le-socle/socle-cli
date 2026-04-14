---
id: ISS-0013
title: "Replace all socle references in website repo"
type: refactor
priority: P0-critical
effort: M
complexity: standard
skill: ~
status: 2-sprint
branch: "refactor/ISS-0013-rename-website"
depends: []
created: 2026-04-14
updated: 2026-04-14
---

# ISS-0013 — Replace all socle references in website repo

## Context

The website repo (Astro/Starlight) contains ~61 occurrences across 13 files. Config, docs EN/FR, and GitHub links.

## Checklist

### Config
- [ ] `astro.config.mjs` — site URL (`le-socle.github.io` → `lytos.org`), title ("Le Socle" → "Lytos"), GitHub social link → `github.com/getlytos/lytos-method`, sidebar labels (`socle init` → `lytos init`, `socle board` → `lytos board`)

Note: the website repo has been renamed from `website` to `lytos-website` at `github.com/getlytos/lytos-website`.

### Documentation EN
- [ ] `en/getting-started/installation.md` — npm (`le-socle` → `lytos`), CLI (`socle init` → `lytos init`), GitHub URLs → `getlytos/lytos-method`, `.socle/` → `.lytos/`, `SOCLE.md` → `LYTOS.md`
- [ ] `en/getting-started/quickstart.md` — same
- [ ] `en/getting-started/introduction.mdx` — brand name "Le Socle" → "Lytos"
- [ ] `en/philosophy/index.md` — GitHub URLs → `getlytos/lytos-method`
- [ ] `en/method/index.md` — GitHub URLs → `getlytos/lytos-method`
- [ ] `en/cli/index.md` — GitHub URLs → `getlytos/lytos-cli`

### Documentation FR
- [ ] `fr/getting-started/installation.md` — mirror of EN changes
- [ ] `fr/getting-started/quickstart.md` — mirror of EN changes
- [ ] `fr/getting-started/introduction.mdx` — brand name
- [ ] `fr/philosophy/index.md` — GitHub URLs
- [ ] `fr/method/index.md` — GitHub URLs
- [ ] `fr/cli/index.md` — GitHub URLs

## Definition of done

- `grep -ri "socle" . --exclude-dir=node_modules --exclude-dir=.git` returns zero matches
- Site builds without errors (`npm run build`)
- All links point to `lytos.org` or `github.com/getlytos/`
