# Lytos — CLI

[![CI](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/lytos-cli)](https://www.npmjs.com/package/lytos-cli)

> The command-line tool for [Lytos](https://github.com/getlytos/lytos-method) — a human-first method for working with AI agents.

**Lytos** gives your AI agents a structured context: what the project is, how to work, what "done" means, what's in progress, and what's been learned. Everything in markdown. No vendor lock-in, no API, no account.

---

## The problem

AI agents (Claude, Cursor, GPT...) are powerful but stateless. Every session starts from zero. They don't know your project's conventions, your sprint priorities, or what was tried last week.

**Lytos** solves this by creating a `.lytos/` directory in your project — a structured context that any AI can read, and that you own.

---

## The 5 pillars

`lytos init` scaffolds a `.lytos/` directory built on 5 pillars:

| Pillar | Purpose | File / Directory |
|--------|---------|-----------------|
| **Intent** | Why the project exists — its constitution | `manifest.md` |
| **Design** | Procedures for recurring tasks (code review, testing, deployment...) | `skills/` |
| **Standards** | Non-negotiable quality criteria | `rules/` |
| **Progress** | Issues, sprint, what's moving and what's blocked | `issue-board/` |
| **Memory** | What's been learned — sovereign, portable, model-independent | `memory/` |

These 5 pillars are the method. The AI agent reads them at the start of each session and follows them.

---

## Install

```bash
npm install -g lytos-cli
```

Or use without installing:

```bash
npx lytos-cli init
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `lytos init` | Scaffold `.lytos/` in your project (interactive, detects your stack) |
| `lytos board` | Regenerate BOARD.md from issue YAML frontmatter |
| `lytos lint` | Validate `.lytos/` structure and content *(coming soon)* |
| `lytos doctor` | Full diagnostic — missing files, broken links, stale memory *(coming soon)* |
| `lytos status` | Display sprint DAG in terminal *(coming soon)* |

---

## What `lytos init` generates

```
your-project/
└── .lytos/
    ├── manifest.md              # Intent — project identity and constraints
    ├── LYTOS.md                 # Method reference
    ├── sprint.md                # Current sprint
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
    └── memory/                  # Memory — accumulated knowledge
        ├── MEMORY.md
        └── cortex/
            ├── architecture.md
            ├── patterns.md
            ├── bugs.md
            └── ...
```

---

## Design principles

- **Offline-first** — no network needed (except `lytos init` to download templates)
- **Zero lock-in** — plain markdown files, works with any AI tool
- **No telemetry** — no tracking, no analytics, ever
- **Human-first** — the human defines the method, the AI follows it

---

## Built with Lytos

This project uses Lytos to develop itself. The `.lytos/` directory contains the real manifest, sprint, issues, and memory for this project — not templates.

---

## Links

- [Lytos Method](https://github.com/getlytos/lytos-method) — the method itself
- [Documentation](https://github.com/getlytos/lytos-website) — full docs (EN/FR)

---

## Author

Created by **Frederic Galline** — [ubeez.com](https://ubeez.com)

---

## License

MIT — see [LICENSE](./LICENSE)
