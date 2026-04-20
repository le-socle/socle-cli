---
id: ISS-0045
title: "[website] Replace stub index pages + add Open Graph / Twitter Card meta"
type: feature
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [documentation]
scope: lytos-website
status: 4-review
branch: "feat/ISS-0045-website-seo-stubs-og"
depends: []
created: 2026-04-20
updated: 2026-04-20
---

# ISS-0045 — Fix stub section-index pages + add Open Graph / Twitter Card meta

## Context

An SEO audit of the historic pages on lytos.org (everything that pre-dates the 14 long-tail sub-pages from ISS-0043 and the breadcrumbs from ISS-0044) surfaced two real gaps. The rest of the site is clean — titles, descriptions, internal linking, breadcrumb JSON-LD, sitemap.xml, bilingual EN/FR are all fine.

### Gap 1 — three stub section-index pages (6 files EN + FR)

`/method/index.md`, `/cli/index.md` and `/philosophy/index.md` (EN + FR) are placeholders with:

```yaml
title: umethod   # note the parasite "u" prefix — visibly broken title
description: Coming soon.
```

and a one-line body pointing to the GitHub repo. They're indexed by Google but give no signal about what the section covers, and the title reads "umethod" in the browser tab. Any user landing there from search gets a dead page; any crawler gets a weak signal for the whole section.

### Gap 2 — no Open Graph / Twitter Card meta

No page currently emits `og:title`, `og:description`, `og:image`, `og:type`, `og:url`, or `twitter:card`. Every share on LinkedIn / X / Slack / iMessage falls back to a generic preview (URL only, no image, no dedicated title). This is a first-impression problem more than a ranking problem, but it also affects Google's page understanding.

## Proposed solution

### Part 1 — turn the 3 stubs into real landing pages

For each of `/method/`, `/cli/`, `/philosophy/` (EN + FR):

- Rewrite the page as a ~200-word section landing: what this section covers, why it exists, a short bulleted TOC linking to each child page with a 1-line description.
- Use a keyword-rich but honest `title` + `description` in the frontmatter (the "u" prefix goes away — it was probably a typo on an earlier pass).
- Keep the tone consistent with the rest of the site (benevolent, concrete, FR in vouvoiement).

### Part 2 — Open Graph / Twitter Card via a custom Head component

Starlight lets you override the `<Head>` component. Plan:

1. Create `src/components/LytosHead.astro` that extends Starlight's default Head and adds:
   - `og:title` from the page `title` frontmatter
   - `og:description` from the page `description` frontmatter
   - `og:url` from `Astro.url.href`
   - `og:type` = `website` for home + section indexes, `article` elsewhere
   - `og:image` = a single default site image for now (can be per-page later)
   - `og:locale` = `en_US` or `fr_FR` depending on route
   - `twitter:card` = `summary_large_image`
   - `twitter:title`, `twitter:description`, `twitter:image` mirroring OG
2. Register the override in `astro.config.mjs` under `components.Head`.
3. Create `public/og-default.png` (1200×630) — can be a simple card with the Lytos wordmark + tagline on the olive palette. If design work is out of scope, ship a minimal placeholder and flag it.
4. Verify on a built page that the tags render in `<head>` and that the social preview renders on at least one debugger (LinkedIn Post Inspector / X Card Validator / opengraph.dev).

## Definition of done

- [ ] `/method/index.md`, `/cli/index.md`, `/philosophy/index.md` (EN + FR) are real landing pages with a proper title (no "u" prefix) and a description ≥ 120 chars
- [ ] Each landing links to every child page in its section with a 1-line description
- [ ] `LytosHead.astro` emits og:* and twitter:* tags on every page, driven by the frontmatter
- [ ] `og:image` default (1200×630 PNG) is present at `public/og-default.png` and referenced as an absolute URL (`https://lytos.org/og-default.png`)
- [ ] `og:locale` is `en_US` or `fr_FR` depending on the route prefix
- [ ] One built page verified in a social preview debugger

## Checklist

### Landing pages
- [ ] `src/content/docs/en/method/index.md` — rewrite
- [ ] `src/content/docs/fr/method/index.md` — rewrite
- [ ] `src/content/docs/en/cli/index.md` — rewrite
- [ ] `src/content/docs/fr/cli/index.md` — rewrite
- [ ] `src/content/docs/en/philosophy/index.md` — rewrite
- [ ] `src/content/docs/fr/philosophy/index.md` — rewrite

### Head component
- [ ] `src/components/LytosHead.astro` — create
- [ ] `astro.config.mjs` — register under `components.Head`
- [ ] `public/og-default.png` — add (or placeholder with a TODO)

## Relevant files

- `src/content/docs/{en,fr}/{method,cli,philosophy}/index.md` — the 6 stubs
- `astro.config.mjs` — component override
- `src/components/LytosHead.astro` — new file

## Notes

- P2 follow-ups (not in this issue): site-wide Organization/WebSite JSON-LD on the home, and a `public/robots.txt` pointing to the sitemap. Track separately if needed.
- The 14 SEO sub-pages and the 6 pillar pages already have good titles/descriptions — this issue only touches section indexes and cross-cutting `<head>` meta.
