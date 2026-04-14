# Lytos — CLI

[![CI](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/lytos)](https://www.npmjs.com/package/lytos-cli)

> The command-line tool for [Lytos](https://github.com/getlytos/lytos-method) — a human-first method for working with AI agents.

---

## Install

```bash
npm install -g lytos-cli
```

Then use:

```bash
lytos init          # Install Lytos in your project
lytos board         # Regenerate BOARD.md from issue frontmatter
```

Or use without installing:

```bash
npx lytos init
```

---

## What it does

One command to install the method, one command to validate your setup, one command to see your sprint.

| Command | What it does |
|---------|-------------|
| `lytos init` | Scaffold `.lytos/` in your project (interactive, detects your stack) |
| `lytos board` | Regenerate BOARD.md from issue YAML frontmatter |
| `lytos lint` | Validate `.lytos/` structure and content *(coming soon)* |
| `lytos doctor` | Full diagnostic — missing files, broken links, stale memory *(coming soon)* |
| `lytos status` | Display sprint DAG in terminal *(coming soon)* |

---

## Built with Lytos

This project uses Lytos to develop itself. The `.lytos/` directory contains the real manifest, sprint, issues, and memory for this project — not templates.

If you want to contribute, open this repo in Claude Code and say: **"Help me understand this project."**

---

## Author

Created by **Frederic Galliné** — [ubeez.com](https://ubeez.com)

- GitHub: [@FredericGalline](https://github.com/FredericGalline)
- X: [@fred](https://x.com/fred)

Part of the [Lytos](https://github.com/getlytos/lytos-method) project.

---

## License

MIT — see [LICENSE](./LICENSE)
