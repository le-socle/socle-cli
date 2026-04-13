# CLAUDE.md

This project uses **Le Socle** — a human-first method for working with AI agents.

This is the CLI tool for Le Socle. It is built using Le Socle itself.

## First session

Read these files to understand the project:
1. .socle/manifest.md — what this CLI is, why it exists, stack, principles
2. .socle/SOCLE.md — the method itself (how manifest, memory, skills, rules, issues work together)

## Every session

Read in order:
1. .socle/manifest.md — project constitution
2. .socle/memory/MEMORY.md — accumulated knowledge (then load relevant cortex/ sections)
3. .socle/rules/default-rules.md — quality criteria
4. .socle/rules/cli-rules.md — CLI-specific rules

## To work on a task

5. .socle/issue-board/BOARD.md — current board state
6. .socle/sprint.md — current sprint
7. .socle/skills/session-start.md — full start and end-of-task procedure

## Key info

- Source code is in `src/` (TypeScript)
- Tests are in `tests/`
- The CLI entry point is `src/cli.ts`
- Each command is a separate file in `src/commands/`
- Published on npm as `socle-cli`

## Rules

- The YAML frontmatter of issues is the source of truth
- Don't interpret silently — ask if an instruction is ambiguous
- At end of task: update frontmatter, move the issue file, update BOARD.md
- Every commit references its issue: `Refs: ISS-XXXX`
