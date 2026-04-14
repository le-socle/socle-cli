---
id: ISS-0003
title: "Implement socle board command"
type: feat
priority: P1-high
effort: M
complexity: standard
domain: [cli, board]
skill: code-structure
status: 5-done
branch: "feat/ISS-0003-socle-board"
depends: [ISS-0001]
created: 2026-04-13
updated: 2026-04-13
---

# ISS-0003 — Implement `socle board` command

## Context

Replaces `scripts/generate-board.py` with a proper CLI command. Reads YAML frontmatter from all issues and regenerates BOARD.md.

## Proposed solution

```bash
socle board                    # regenerate BOARD.md
socle board --check            # check if BOARD.md is up to date (for CI)
socle board --json             # output board data as JSON
```

Uses the frontmatter `status` field as source of truth. Warns if a file is in a folder that doesn't match its frontmatter status.

## Definition of done

- [ ] Reads all ISS-*.md files from issue-board subdirectories
- [ ] Parses YAML frontmatter correctly
- [ ] Generates BOARD.md with correct index tables
- [ ] `--check` returns exit code 1 if BOARD.md is outdated
- [ ] `--json` outputs structured data
- [ ] Warns on frontmatter/folder status mismatch
- [ ] Integration tests with fixture directories

## Relevant files

- `src/commands/board.ts`
- `src/lib/frontmatter.ts` (YAML frontmatter parser)
- `src/lib/board-generator.ts` (BOARD.md generation)
- `tests/commands/board.test.ts`
