# CLAUDE.md

This project uses **Lytos** — a human-first method for working with AI agents.

This is the CLI tool for Lytos. It is built using Lytos itself.

## First session

Read these files to understand the project:
1. .lytos/manifest.md — what this CLI is, why it exists, stack, principles
2. .lytos/LYTOS.md — the method itself (how manifest, memory, skills, rules, issues work together)

## Every session

Read in order:
1. .lytos/manifest.md — project constitution
2. .lytos/memory/MEMORY.md — accumulated knowledge (then load relevant cortex/ sections)
3. .lytos/rules/default-rules.md — quality criteria
4. .lytos/rules/cli-rules.md — CLI-specific rules

## To work on a task

5. .lytos/issue-board/BOARD.md — current board state
6. .lytos/sprint.md — current sprint
7. .lytos/skills/session-start.md — full start and end-of-task procedure

## Key info

- Source code is in `src/` (TypeScript)
- Tests are in `tests/`
- The CLI entry point is `src/cli.ts`
- Each command is a separate file in `src/commands/`
- Published on npm as `lytos-cli`

## Rules

- The YAML frontmatter of issues is the source of truth
- Don't interpret silently — ask if an instruction is ambiguous
- At end of task: update frontmatter, move the issue file, update BOARD.md
- Every commit references its issue: `Refs: ISS-XXXX`
