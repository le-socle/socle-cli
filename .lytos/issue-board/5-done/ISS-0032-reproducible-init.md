---
id: ISS-0032
title: Make lyt init reproducible — bundle method files in npm package
type: feat
priority: P1-high
effort: L
complexity: heavy
skill: code-structure
skills_aux: [testing, security]
status: 5-done
branch: feat/ISS-0032-reproducible-init
depends: [ISS-0031]
created: 2026-04-16
updated: 2026-04-19
---
# ISS-0032 — Make `lyt init` reproducible — bundle method files in npm package

## Context

Currently `lyt init` downloads files from `lytos-method/main` at runtime. This means:
- Two `lyt init` runs a week apart can produce different results
- Network failure degrades silently (warning only)
- The CLI version doesn't pin the method version
- Contradicts the "offline-first" promise

## What to do

Bundle all method files (skills, rules, LYTOS.md, templates) inside the npm package at build time. Each CLI version = a reproducible snapshot of the method.

`lyt upgrade` (ISS-0019) will handle updating method files from remote when the user explicitly asks.

## Definition of done

- [x] Method files are copied into the npm package at build time (e.g. `dist/method/`)
- [x] `lyt init` reads from bundled files, no network call
- [x] `lyt init` works 100% offline
- [x] Existing tests still pass
- [x] `npm pack` includes the bundled files
- [x] README updated to reflect offline-first init
