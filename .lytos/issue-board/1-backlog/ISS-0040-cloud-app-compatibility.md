---
id: ISS-0040
title: "Verify Lytos compatibility with Claude Code Desktop and Codex web app"
type: task
priority: P2-normal
effort: S
complexity: light
skill: documentation
skills_aux: [testing]
status: 1-backlog
branch: "docs/ISS-0040-cloud-app-compatibility"
depends: []
created: 2026-04-19
---

# ISS-0040 — Verify Lytos compatibility with Claude Code Desktop and Codex web app

## Context

Fred asked a legitimate question that we can't fully answer from the docs alone:
when a user connects a Git repo to **Claude Code Desktop** or to the **Codex web/cloud app**, does the `.lytos/` content get picked up automatically via the bridge file (`CLAUDE.md`, `AGENTS.md`)?

Research from the official docs:

- **Claude Code Desktop** — shares the engine with the CLI, so `CLAUDE.md` at the repo root is read at session start. Should work transparently when Lytos generates `CLAUDE.md`.
- **Codex CLI** — reads `AGENTS.md` natively. Works once ISS-0038 fixes the casing.
- **Codex web/cloud app** ([developers.openai.com/codex/app](https://developers.openai.com/codex/app)) — **no explicit mention of auto-reading AGENTS.md.** The docs point at a "Rules" interface and "Config", suggesting instructions may need to be pasted into the web UI rather than picked up from the repo.

This is a user-facing question ("can I adopt Lytos without committing to a single tool?") and we need a definitive answer, not an inferred one.

## What to do

1. **Claude Code Desktop** — install the app, connect a repo where `lyt init --tool claude` was run, open a fresh session, and verify the agent references the manifest/skills/rules automatically (without being asked). Screenshot.
2. **Codex CLI** — same protocol with `--tool codex` after ISS-0038 lands. Should be the positive control.
3. **Codex web app** — connect the same repo via the web UI, ask a generic question, and check whether the agent references the `.lytos/` content on its own. If it doesn't, note what workaround exists (paste AGENTS.md content into the "Rules" or "Config" field).
4. Repeat for any other repo-connected cloud AI app the user identifies (Claude.ai Projects, ChatGPT Projects, Cursor cloud agents, Jules by Google).

## Deliverable

A page at `/method/compatibility` on the website (EN + FR) listing each tool with:

| Tool | Reads `.lytos/` automatically? | Bridge file | Workaround if no |
|---|---|---|---|
| Claude Code (CLI + Desktop) | ✅ | `CLAUDE.md` | — |
| Cursor | ✅ | `.cursor/rules/*.mdc` | — |
| Codex CLI | ✅ | `AGENTS.md` | — |
| Codex web app | ⚠️ to verify | — | paste manifest into "Rules" field |
| Claude.ai Projects | ❌ | — | paste manifest into project instructions |
| ChatGPT Projects | ❌ | — | same |

## Definition of done

- Empirical verification, not inferred — each row backed by a screenshot or explicit doc quote
- Website page `/method/compatibility` exists in both languages with the matrix
- Linked from the home page "Works with your current setup" section
- `/method/compatibility` ends on an honest statement: Lytos is tool-agnostic because the content is markdown in git — auto-loading is the variable that depends on each vendor
