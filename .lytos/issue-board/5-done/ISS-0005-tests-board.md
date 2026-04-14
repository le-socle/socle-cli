---
id: ISS-0005
title: "Integration tests for socle board"
type: test
priority: P1-high
effort: S
complexity: standard
skill: testing
status: 5-done
branch: "test/ISS-0005-tests-board"
depends: [ISS-0003]
created: 2026-04-13
---

# ISS-0005 — Integration tests for `socle board`

## What to do

Write integration tests using fixture directories with pre-made issue files.

## Definition of done

- [ ] Test: generates correct BOARD.md from fixture issues
- [ ] Test: `--check` returns 0 when up to date, 1 when outdated
- [ ] Test: `--json` outputs valid JSON
- [ ] Test: warns on frontmatter/folder status mismatch
- [ ] Test: handles empty board (no issues)
