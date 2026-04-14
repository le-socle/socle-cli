---
id: ISS-0004
title: "Integration tests for socle init"
type: test
priority: P1-high
effort: M
complexity: standard
skill: testing
status: 5-done
branch: "test/ISS-0004-tests-init"
depends: [ISS-0002]
created: 2026-04-13
---

# ISS-0004 — Integration tests for `socle init`

## What to do

Write integration tests that run the actual CLI binary and verify the output. Use temporary directories with real file structures.

## Definition of done

- [ ] Test: interactive mode creates correct `.socle/` structure
- [ ] Test: `--name` and `--tool` flags work in non-interactive mode
- [ ] Test: `--dry-run` shows output without creating files
- [ ] Test: errors when `.socle/` already exists
- [ ] Test: `--force` overrides existing `.socle/`
- [ ] Test: stack detection from package.json, requirements.txt, go.mod
- [ ] All tests run in isolated temp directories (no pollution)
