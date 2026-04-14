---
id: ISS-0006
title: "CI pipeline (GitHub Actions)"
type: chore
priority: P1-high
effort: S
complexity: light
skill: deployment
status: 5-done
branch: "chore/ISS-0006-ci-pipeline"
depends: [ISS-0004, ISS-0005]
created: 2026-04-13
---

# ISS-0006 — CI pipeline

## What to do

Set up GitHub Actions to run lint, test, and build on every push and PR.

## Definition of done

- [ ] Workflow runs on push to main and on PRs
- [ ] Steps: install deps → lint → test → build
- [ ] Build artifact is verified (can run `--help`)
- [ ] Badge in README
