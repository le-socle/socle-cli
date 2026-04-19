---
id: ISS-0039
title: "Add --tool adapters for Copilot, Gemini and Windsurf"
type: feature
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [testing, documentation]
status: 1-backlog
branch: "feat/ISS-0039-more-tool-adapters"
depends: [ISS-0038]
created: 2026-04-19
---

# ISS-0039 — Add --tool adapters for Copilot, Gemini and Windsurf

## Context

`lyt init --tool` today supports `claude | cursor | codex | none`. Three major AI coding tools are missing and each has a well-established project-instruction convention:

- **GitHub Copilot Agents** → `.github/copilot-instructions.md` ([GitHub docs](https://docs.github.com/en/copilot/how-tos/custom-instructions/adding-repository-custom-instructions-for-github-copilot))
- **Gemini CLI / Jules** → `GEMINI.md` at repo root
- **Windsurf / Codeium** → `.windsurfrules` at repo root

Without these adapters, users on those tools have to hand-write a bridge file that points at `.lytos/`. Our promise — "drop `lyt init` in any repo and any agent works" — only holds on 4 of the major tools today.

## Proposed solution

1. Add new options to the `--tool` flag: `copilot`, `gemini`, `windsurf`, keeping `claude`, `cursor`, `codex`, `none` as-is.
2. For each new tool, add a template in `src/lib/templates.ts`:
   - `copilotTemplate(ctx)` — writes a GitHub-flavored instructions file pointing at `.lytos/manifest.md`, `.lytos/skills/session-start.md`, `.lytos/rules/default-rules.md`.
   - `geminiTemplate(ctx)` — same bridge, wording adapted to Gemini.
   - `windsurfTemplate(ctx)` — same bridge.
3. Wire the tools into `scaffold.ts` alongside the existing branches.
4. Update the interactive prompt in `commands/init.ts` to list the new tools.
5. Add tests per tool, verifying both the exact filename and presence of a pointer to `.lytos/`.
6. Update both README files (EN/FR) and the website `/cli/init` pages to list the new options.

## Adapter file targets

| Tool | File path | Casing |
|---|---|---|
| Copilot | `.github/copilot-instructions.md` | lowercase |
| Gemini | `GEMINI.md` | uppercase |
| Windsurf | `.windsurfrules` | lowercase, no extension |

## Checklist

- [ ] Add `copilot | gemini | windsurf` to the `tool` type and CLI flag
- [ ] Create three new templates in `src/lib/templates.ts`
- [ ] Wire into `scaffold.ts` with case-correct filenames
- [ ] Update the interactive prompt list in `commands/init.ts`
- [ ] Tests for each tool (filename + content sanity)
- [ ] Update lytos-cli README (EN + FR)
- [ ] Update lytos-website `/cli/overview` and a new `/compatibility` page listing every supported tool and its bridge file

## Definition of done

- All 7 tool values (claude, cursor, codex, copilot, gemini, windsurf, none) scaffold the right bridge
- Every bridge file points at `.lytos/` and survives `lyt upgrade`
- Docs list the supported tools with exact file-path convention
- 7 tests pass (one per tool filename assertion)
