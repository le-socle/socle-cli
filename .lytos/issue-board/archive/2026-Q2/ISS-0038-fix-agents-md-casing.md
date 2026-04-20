---
id: ISS-0038
title: "Fix AGENTS.md casing for Codex tool — breaks on Linux/CI"
type: fix
priority: P1-high
effort: XS
complexity: light
skill: code-structure
skills_aux: [testing]
status: 5-done
branch: "fix/ISS-0038-agents-md-casing"
depends: []
created: 2026-04-19
updated: 2026-04-20
---

# ISS-0038 — Fix AGENTS.md casing for Codex tool

## Context

`lyt init --tool codex` currently writes `agents.md` (lowercase) at the repo root. OpenAI Codex CLI reads `AGENTS.md` with uppercase letters as the canonical convention ([official doc](https://developers.openai.com/codex/guides/agents-md)).

On macOS the filesystem is case-insensitive by default, so `agents.md` is picked up. On Linux and in CI (ext4, case-sensitive), Codex CLI cannot find the file — the user thinks Lytos isn't working, when really it's a filename mismatch.

## What to do

1. In `src/lib/scaffold.ts:229`, change `join(options.cwd, "agents.md")` to `join(options.cwd, "AGENTS.md")`.
2. Verify the template content itself still references the right file paths (`.lytos/` is OS-agnostic, no case issue there).
3. Add a test covering the exact casing of the generated file for each `--tool` value.
4. Document the file-name convention in the CLI README / website compatibility page.

## Relevant files

- `src/lib/scaffold.ts:229` — the offending line
- `src/lib/templates.ts` — `codexTemplate()` definition
- `tests/commands/init.test.ts` — to add a casing regression test

## Definition of done

- `AGENTS.md` is written in uppercase on init with `--tool codex`
- Test verifies the exact filename on a case-sensitive filesystem
- Works on Linux CI (the existing tests run on Linux, so the assertion is automatic)
- All tests pass
