---
id: ISS-0065
title: "Release 1.0.0"
type: chore
priority: P0-critical
effort: XS
complexity: light
domain: [release, npm]
skill: documentation
skills_aux: [testing]
status: 4-review
branch: "chore/ISS-0065-release-1-0-0"
depends: []
created: 2026-04-22
updated: 2026-04-22
---

# ISS-0065 — Release `1.0.0`

## Context

The recent feature and workflow work is now merged on `main`, including `lyt review` and the board/archive cleanup. The CLI is publicly usable and the remaining backlog items are product extensions, not blockers to a stable public contract.

The release branch was initially opened with a `0.11.0` placeholder, but the decision is now to declare `1.0.0`.

## Proposed solution

Bump the package version from `0.10.0` to `1.0.0`, validate the build and packaging flow, and leave the release change isolated on its own branch for final review before publish.

## Definition of done

- [x] `package.json` version is `1.0.0`
- [x] `package-lock.json` root version is `1.0.0`
- [x] Build passes on the release branch
- [x] Targeted tests still pass
- [x] `npm pack --dry-run` is clean for the release artifact
- [x] The issue is moved to `4-review` once the bump is ready

## Relevant files

- `package.json`
- `package-lock.json`

## Notes

- This issue is the release bump only, not the actual `npm publish` step.

## Finalization — 2026-04-22

- Bumped `lytos-cli` from `0.10.0` to `1.0.0`
- Validation run:
  - `npm run build`
  - `npx vitest run tests/commands/review.test.ts tests/commands/archive.test.ts tests/commands/upgrade.test.ts`
  - `npm_config_cache=/tmp/lytos-npm-cache npm pack --dry-run`
- `npm pack --dry-run` succeeded with a temporary cache because the default local npm cache contains root-owned files unrelated to the package itself
