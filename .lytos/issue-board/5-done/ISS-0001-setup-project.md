---
id: ISS-0001
title: "Setup Node.js project"
type: chore
priority: P0-critical
effort: M
complexity: standard
skill: code-structure
status: 5-done
depends: []
created: 2026-04-13
updated: 2026-04-13
---

# ISS-0001 — Setup Node.js project

## Context

Before any command can be implemented, the project needs a proper TypeScript setup with build tooling, test framework, and linter configuration.

## Proposed solution

Initialize the project with:
- `package.json` with name `socle-cli`, bin entry pointing to `dist/cli.js`
- TypeScript config targeting Node.js 20+
- Commander.js as the only runtime dependency
- tsup for building (fast, zero-config TypeScript bundler)
- Vitest for testing
- ESLint + Prettier for code quality
- `src/cli.ts` as entry point that registers commands
- `src/commands/` directory for command implementations

## Definition of done

- [ ] `npm run build` produces a working `dist/cli.js`
- [ ] `node dist/cli.js --help` shows the CLI help
- [ ] `npm test` runs Vitest (even if no tests yet)
- [ ] `npm run lint` runs ESLint without errors
- [ ] Project structure matches the convention in cli-rules.md

## Relevant files

- `package.json`
- `tsconfig.json`
- `tsup.config.ts`
- `src/cli.ts`
- `src/commands/` (empty, ready for commands)
