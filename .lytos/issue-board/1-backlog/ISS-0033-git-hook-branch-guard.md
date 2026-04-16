---
id: ISS-0033
title: "Install git pre-commit hook to enforce branch naming convention"
type: feat
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing, security]
status: 1-backlog
branch: "feat/ISS-0033-git-hook-branch-guard"
depends: []
created: 2026-04-16
---

# ISS-0033 — Install git pre-commit hook to enforce branch naming convention

## Context

Rules written in markdown are advisory — an agent or human can ignore them. The "no reactive coding" and "mandatory start phase" rules were violated within minutes of being written because nothing enforced them at the tool level.

The only model-agnostic enforcement mechanism is the CLI itself. A git hook installed by `lyt init` is the universal guard rail — it works with Claude, GPT, Gemini, Cursor, a local LLM, or a human typing git commands.

## What to do

`lyt init` installs a `pre-commit` hook in `.git/hooks/` that checks:

1. **Branch name format** — must match `type/ISS-XXXX-*` pattern
2. **Main/dev protection** — block direct commits on `main` or `dev` with a clear message
3. **Merge commits** — allowed on any branch (git merge produces commits on target branch)
4. **Message on block** — explain why and how to fix: "Run `lyt start ISS-XXXX` to create a branch"

## Edge cases

- No `.git/` directory → skip hook installation (not a git repo)
- Hook already exists → append or warn, don't overwrite user's custom hook
- `--no-verify` → still works (git native escape hatch, we don't fight git)
- CI environment → skip check (CI may commit on main for releases)
- Initial commit (no branch yet) → allow
- `lyt init --force` re-run → update the hook

## Design decisions

- The hook is a shell script, not Node.js — it must be fast and zero-dependency
- The hook checks the branch name, not the issue existence (no file I/O = instant)
- The message is helpful, not hostile: explain the fix, not just the error
- `--no-verify` is documented as the escape hatch, not hidden

## Definition of done

- [ ] `lyt init` creates `.git/hooks/pre-commit` with branch name check
- [ ] Commits on `main`/`dev` are blocked with a helpful message
- [ ] Commits on `type/ISS-XXXX-*` branches pass
- [ ] Merge commits are allowed
- [ ] CI environment (`CI=true`) bypasses the check
- [ ] Existing hooks are preserved (append, not overwrite)
- [ ] `--no-verify` works as escape hatch
- [ ] Integration tests covering: blocked commit on main, allowed on feature branch, merge commit, CI bypass
