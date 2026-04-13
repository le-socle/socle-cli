# Manifest — socle-cli

*This file is the project's constitution. It is read by agents at the start of each work session.*

---

## Identity

| Field | Value |
|-------|-------|
| Name | socle-cli |
| Description | Command-line tool for Le Socle method |
| Owner | Frederic Galliné (@FredericGalline) |
| Repo | github.com/le-socle/socle-cli |
| Le Socle version | 1.0 |

---

## Why this project exists

Le Socle is a method — markdown files that any AI can read. But setting it up manually is friction. Validating that the structure is correct requires checking dozens of files by hand. Seeing the sprint status means opening BOARD.md and reading a table.

socle-cli removes that friction. One command to install, one command to validate, one command to visualize. It makes Le Socle as easy to adopt as `eslint --init` or `prettier --init`.

It is also the bridge between the free open-source method and the future team dashboard. Every `socle init` is a user who might need supervision tooling later.

---

## What this project is

- A CLI that scaffolds, validates, and visualizes Le Socle projects
- The reference implementation of how Le Socle files should be structured
- A tool that works offline, with no account, no API, no telemetry
- Published on npm as `socle-cli`, usable via `npx socle`

## What this project is not

- Not a framework — it generates and reads markdown files, nothing else
- Not an AI tool — it doesn't call any AI API, it structures the context for AI tools
- Not a SaaS — there is no server, no account, no cloud dependency
- Not the method itself — the method is in the `le-socle/socle` repo

---

## Tech stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
| Runtime | Node.js 20+ |
| CLI framework | Commander.js |
| Bundler | tsup |
| Tests | Vitest |
| Linter | ESLint + Prettier |
| CI/CD | GitHub Actions |
| Package registry | npm |

---

## Project vocabulary

| Term | Definition |
|------|-----------|
| scaffold | Generate the `.socle/` directory structure with pre-filled files |
| lint | Validate that the `.socle/` structure is correct and complete |
| doctor | Run a comprehensive diagnostic on the `.socle/` setup |
| board | Regenerate BOARD.md from issue YAML frontmatter |
| gate | A quality check that must pass before a status transition |

---

## Fundamental constraints

- Zero runtime dependencies beyond Commander.js — the CLI must be fast and lightweight
- No network calls — everything works offline (except `socle init` which downloads from GitHub)
- No telemetry, no analytics, no tracking — ever
- The output of every command must be useful in a non-interactive context (CI, piped to file)
- The CLI never modifies files without explicit user action (no auto-fix without --fix flag)

---

## Development principles

*When an agent hesitates between two approaches, it consults these principles to decide.*

- **Explicit over magic** — every action the CLI takes is visible and explained. No silent file modifications, no hidden behavior.
- **Offline-first** — the CLI works without network. `socle init` can download files, but `socle lint`, `socle doctor`, `socle board`, `socle status` never need network.
- **Output for humans AND machines** — every command has a human-readable default output and a `--json` flag for machine consumption.
- **Fail with context** — when something is wrong, say what's wrong, where, and how to fix it. Never just "Error."
- **Single responsibility per command** — `socle lint` validates. `socle doctor` diagnoses. They don't overlap.

---

## AI models by complexity

| Complexity | Usage | Model |
|------------|-------|-------|
| `light` | Documentation, README updates, simple refactoring | Claude Haiku |
| `standard` | Command implementation, tests, code review | Claude Sonnet |
| `heavy` | Architecture decisions, CLI framework design, error handling strategy | Claude Opus |

---

## Important links

| Resource | URL |
|----------|-----|
| CLI repo | github.com/le-socle/socle-cli |
| Method repo | github.com/le-socle/socle |
| npm package | npmjs.com/package/socle-cli |

---

*Last updated: 2026-04-13*
