---
id: ISS-0044
title: "[website] Add breadcrumbs to sub-pages + cross-links between siblings"
type: feature
priority: P2-normal
effort: S
complexity: light
skill: code-structure
skills_aux: [documentation]
scope: lytos-website
status: 1-backlog
branch: "feat/ISS-0044-website-breadcrumbs"
depends: []
created: 2026-04-19
---

# ISS-0044 — Breadcrumbs on sub-pages + cross-links between siblings

## Context

The 14 SEO sub-pages under `/method/<pillar>/<slug>/` have "Learn more" sections that link back to their parent pillar. What they don't have is a **breadcrumb** at the top (Home › Method › Memory › This page) that both orients the reader and gives search engines the structured hierarchy they expect.

Starlight doesn't ship breadcrumbs natively. The community plugin [`starlight-breadcrumbs`](https://github.com/HiDeoo/starlight-breadcrumbs) adds them automatically, derived from the URL structure. It also emits BreadcrumbList JSON-LD for Google.

## What to do

1. Install `starlight-breadcrumbs`:
   ```bash
   npm install starlight-breadcrumbs
   ```
2. Register the plugin in `astro.config.mjs` under the Starlight plugins list.
3. Configure it to show breadcrumbs only on pages deeper than 1 level (so the home and top-level method pages don't get a redundant breadcrumb).
4. Verify the rendered output matches the site typography (probably needs a small CSS tweak in `custom.css` to match the Plex Mono / Newsreader palette).
5. Add a **"See also" section** on each SEO sub-page manually (4 lines max) that links to 1–2 sibling pages under the same pillar. Makes the internal graph tighter for both humans and crawlers.

## Relevant files

- `astro.config.mjs` — plugin registration
- `src/styles/custom.css` — breadcrumb styling override if needed
- `src/content/docs/{en,fr}/method/<pillar>/<slug>.md` — add a "See also" / "Voir aussi" block at the bottom of each sub-page

## Definition of done

- Breadcrumbs render on every sub-page from depth 2+
- BreadcrumbList JSON-LD is in the `<head>` (verify via view-source)
- Typography matches the Lytos palette (paper, ink, olive accent on hover)
- Each SEO sub-page has a "See also" block listing 1–2 siblings
- Home and direct-under-home pages are not cluttered with an empty/single-item breadcrumb
