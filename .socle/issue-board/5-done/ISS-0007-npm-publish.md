---
id: ISS-0007
title: "npm publish setup and first release"
type: chore
priority: P1-high
effort: S
complexity: light
skill: deployment
status: 5-done
branch: "chore/ISS-0007-npm-publish"
depends: [ISS-0006]
created: 2026-04-13
---

# ISS-0007 — npm publish and first release

## What to do

Configure npm publish via GitHub Actions on tag push. Publish v0.1.0.

## Definition of done

- [ ] `npm pack` produces a clean package
- [ ] `npx socle-cli --help` works from the published package
- [ ] GitHub Action publishes to npm on version tag (v*)
- [ ] v0.1.0 released with `socle init` and `socle board`
