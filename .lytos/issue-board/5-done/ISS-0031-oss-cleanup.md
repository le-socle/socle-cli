---
id: ISS-0031
title: OSS cleanup — lint errors, README drift, detectStack bug, update check
type: fix
priority: P0-critical
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing, documentation]
status: 5-done
branch: fix/ISS-0031-oss-cleanup
depends: []
created: 2026-04-16
updated: 2026-04-16
---
# ISS-0031 — OSS cleanup — lint errors, README drift, detectStack bug, update check

## Context

External review (Codex GPT) identified quality issues that would hurt credibility with senior OSS reviewers. These are all quick fixes that don't change architecture.

## Checklist

- [ ] Fix all 11 ESLint errors (unused imports/variables)
- [ ] Fix `detectStack(cwd)` — package manager detection must use the `cwd` argument, not implicit `process.cwd()`
- [ ] Update README: remove "coming soon" for lint/doctor, add show/start/close, reflect actual command list
- [ ] Add `LYT_NO_UPDATE_CHECK=1` env var to disable update check
- [ ] Only run update check on commands that already need network (`init`, `update`), not on offline commands
- [ ] Verify `npm run lint` passes with zero errors
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm test` passes
