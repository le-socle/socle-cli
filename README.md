# Lytos CLI

[![npm](https://img.shields.io/npm/v/lytos-cli)](https://www.npmjs.com/package/lytos-cli)
[![CI](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml)

> The command-line tool for [Lytos](https://lytos.org) — a human-first method for working with AI agents.

**[Documentation — lytos.org](https://lytos.org)** · **[The method](https://github.com/getlytos/lytos-method)**

---

### What this tool does

Lytos is a method. The CLI makes it effortless to adopt.

One command scaffolds the full `.lytos/` structure in any project — manifest, skills, rules, issue board, memory. From that point on, any AI agent reads the project's context at the start of each session. No re-explaining. No generic output.

The CLI also manages the workflow: starting and closing issues, regenerating the board, validating the structure, diagnosing problems.

```bash
npm install -g lytos-cli
lyt init
```

Or without installing:

```bash
npx lytos-cli init
```

![Lytos demo](docs/screenshots/lytos.gif)

![lyt board](docs/screenshots/lyt-board.png)

---

## Commands

| Command | What it does |
|---------|-------------|
| `lyt init` | Scaffold `.lytos/` in a project (interactive, detects the stack) |
| `lyt board` | Regenerate BOARD.md from issue YAML frontmatter |
| `lyt lint` | Validate `.lytos/` structure and content |
| `lyt doctor` | Full diagnostic — broken links, stale memory, missing skills, health score |
| `lyt show [ISS-XXXX]` | Display issue detail with progress bar, or all in-progress issues |
| `lyt start ISS-XXXX` | Start an issue — move to in-progress, create branch, update board |
| `lyt close ISS-XXXX` | Close an issue — move to done, update board (warns about unchecked items) |
| `lyt update` | Update lytos-cli to the latest version |

![lyt show](docs/screenshots/lyt-show.png)

---

## What `lyt init` generates

```
project/
└── .lytos/
    ├── manifest.md              # Intent — project identity and constraints
    ├── LYTOS.md                 # Method reference
    ├── config.yml               # Language and profile preferences
    ├── skills/                  # Design — 9 reusable procedures
    │   ├── session-start.md
    │   ├── code-structure.md
    │   ├── code-review.md
    │   ├── testing.md
    │   ├── documentation.md
    │   ├── git-workflow.md
    │   ├── deployment.md
    │   ├── security.md
    │   └── api-design.md
    ├── rules/                   # Standards — quality criteria
    │   └── default-rules.md
    ├── issue-board/             # Progress — kanban board
    │   ├── BOARD.md
    │   ├── 0-icebox/
    │   ├── 1-backlog/
    │   ├── 2-sprint/
    │   ├── 3-in-progress/
    │   ├── 4-review/
    │   └── 5-done/
    ├── memory/                  # Memory — accumulated knowledge
    │   ├── MEMORY.md
    │   └── cortex/
    └── templates/               # Issue and sprint templates
```

`lyt init` also detects the project's stack (language, framework, test runner, package manager) and pre-fills the manifest. It generates the appropriate adapter file for the chosen AI tool — `CLAUDE.md`, `.cursorrules`, or `agents.md`.

A pre-commit hook is installed to enforce branch naming conventions (`type/ISS-XXXX-slug`). This prevents untracked work on `main` — regardless of which AI tool or model is used.

---

## Works with any AI tool

| Tool | What `lyt init` generates |
|------|--------------------------|
| **Claude Code** | `CLAUDE.md` at project root |
| **Cursor** | `.cursorrules` at project root |
| **Codex (OpenAI)** | `agents.md` at project root |
| **Others** | The `.lytos/` directory is plain Markdown — any LLM can read it |

> *"Choose your AI. Don't belong to it."*

---

## Design principles

- **Offline-first** — `lyt lint`, `lyt doctor`, `lyt board`, `lyt show`, `lyt start`, `lyt close` never need network
- **Zero lock-in** — plain Markdown files, portable across any AI tool
- **No telemetry** — no tracking, no analytics, ever. Opt-out for update check: `LYT_NO_UPDATE_CHECK=1`
- **Human-first** — the human defines the method, the AI follows it
- **Fail with context** — when something is wrong, the CLI says what, where, and how to fix it

![lyt lint](docs/screenshots/lyt-lint.png)
![lyt doctor](docs/screenshots/lyt-doctor.png)

---

## Built with Lytos

This CLI is developed using Lytos itself. The `.lytos/` directory in this repository contains the real manifest, sprint, issues, and memory — not templates. Every feature was tracked as an issue, started with `lyt start`, and closed with `lyt close`.

[Browse the issue board →](.lytos/issue-board/BOARD.md)

---

## Links

- **Documentation** — [lytos.org](https://lytos.org)
- **Tutorial** — [lytos-learn](https://github.com/getlytos/lytos-learn) — learn by doing in 7 steps
- **The method** — [github.com/getlytos/lytos-method](https://github.com/getlytos/lytos-method)
- **npm** — [npmjs.com/package/lytos-cli](https://www.npmjs.com/package/lytos-cli)

---

## Author

Created by **Frederic Galliné**

- GitHub: [@FredericGalline](https://github.com/FredericGalline)
- X: [@fred](https://x.com/fred)

---

## License

MIT — see [LICENSE](./LICENSE)
