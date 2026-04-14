# Memory — Architecture & Technical Decisions

*Load this file for any task that affects the project structure.*

---

### 2026-04-13 — TypeScript + Commander.js + tsup

**Context**: Choosing the stack for the CLI. Options: plain Node.js, oclif, Commander.js, yargs.
**Decision**: TypeScript for type safety, Commander.js for CLI parsing (lightweight, well-maintained), tsup for bundling (fast, zero-config for TypeScript).
**Consequence**: Single dependency for CLI parsing. The bundle is a single JS file. No runtime TypeScript compilation needed.

### 2026-04-13 — No YAML parser dependency

**Context**: Issues have YAML frontmatter that needs to be parsed. Full YAML parsers (js-yaml) are heavy and overkill for simple key-value frontmatter.
**Decision**: Hand-written regex parser for the subset of YAML we use (strings, lists, dates).
**Consequence**: Smaller bundle, no dep. But if we ever need nested YAML or complex types, we'll need to reconsider.

### 2026-04-13 — One file per command in src/commands/

**Context**: How to organize command implementations.
**Decision**: Each command is a self-contained file in `src/commands/`. The main CLI file (`src/cli.ts`) only registers commands.
**Consequence**: Easy to add new commands. Each command can be tested independently. The main file stays small.
