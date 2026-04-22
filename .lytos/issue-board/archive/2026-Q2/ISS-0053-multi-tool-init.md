---
id: ISS-0053
title: "lyt init: scaffold multiple tool bridges in one run (team-mixed case)"
type: feat
priority: P2-normal
effort: S
complexity: standard
domain: [cli, init]
skill: 
skills_aux: []
status: 5-done
branch: fix/ISS-0053-docs-multi-tool
depends: []
created: 2026-04-21
updated: 2026-04-22
---
# ISS-0053 — `lyt init`: scaffold multiple tool bridges in one run

## Context

`lyt init` today takes a single `--tool <name>` value (`claude | cursor | codex | copilot | gemini | windsurf | none`) and generates one bridge file at project root. Each tool has its own well-established convention (`CLAUDE.md`, `.cursor/rules/lytos.mdc`, `AGENTS.md`, `.github/copilot-instructions.md`, `GEMINI.md`, `.windsurfrules`).

That matches the common case: a solo dev picks their primary tool, `lyt init` generates the matching bridge, and `.lytos/` is wired up.

It breaks on a real team case: a repo where some devs use Claude Code and others use GPT/Codex — or any mix. Today each member would have to open a PR to add their bridge by hand, or the lead has to `lyt init --force` with a different tool. Neither flow is good, and the bridges ARE mostly redundant (each points at `.lytos/manifest.md`, `.lytos/skills/session-start.md`, `.lytos/rules/default-rules.md`), so generating them together is safe.

## Proposed solution

### 1. Accept multiple values in `--tool`

Two acceptable flag shapes, both resolving to an internal `tools: LytosTool[]`:

- **CSV** — `lyt init --tool claude,cursor,copilot`
- **Repeated flag** — `lyt init --tool claude --tool cursor` (Commander's `.option('--tool <t>', ..., collect, [])`).

Either is fine. Pick one that keeps the `--tool <tool>` single-value usage intact (for backwards compat).

### 2. New `--all-tools` shortcut

`lyt init --all-tools` expands to every adapter (`claude`, `cursor`, `codex`, `copilot`, `gemini`, `windsurf`), useful for the "I want to support whoever joins the team tomorrow" case.

### 3. Interactive multi-select

In the interactive prompt, add a new choice `7. Multiple (comma-separated)` — when selected, re-prompt for a CSV. (Full checkbox-style multi-select would require a richer prompt lib; keep it minimal.)

### 4. Scaffold loop

In `src/lib/scaffold.ts`, replace the single `if/else if` chain that writes the tool bridge with a loop over the resolved tools. Each iteration writes its bridge file. Existing per-tool template functions (`claudeTemplate`, `cursorRulesTemplate`, …) stay as-is.

### 5. Handle `none`

If `none` is in the list with other tools, treat it as a no-op for that slot (generate the others). If the list is only `[none]`, skip bridge generation as today.

## Definition of done

- [x] `lyt init --tool claude,cursor,copilot` generates all three bridges
- [x] `lyt init --tool claude --tool cursor` generates both (if we go repeated-flag)
- [x] `lyt init --all-tools` generates the six shipping adapters
- [x] Interactive mode offers a "multiple" choice that accepts CSV
- [x] Unknown tool names error out with a clear message (exit 2)
- [x] `--force` re-runs still regenerate all requested bridges
- [x] Tests cover: single-tool (backwards compat), CSV, repeated flag, `--all-tools`, invalid tool, `none` mixed with others
- [x] Coverage ≥ 80% on the updated paths
- [x] README (en + fr) shows the multi-tool example
- [x] Website `/cli/init` page mentions the multi-tool option

## Relevant files

- `src/commands/init.ts` — flag definition, interactive prompt, argv → tools resolution
- `src/lib/scaffold.ts` — `LytosTool` type (single → `LytosTool[]`), loop over tools when writing bridges
- `tests/commands/init.test.ts` — extend cases
- `README.md` / `docs/fr/README.md` — update `--tool` examples
- Website `src/content/docs/{en,fr}/cli/init.md` — document multi-tool

## Notes

- **Why it matters**: surfaced by a user running `lyt init` on a team repo where devs use different AI tools. Expectation: "if I install Lytos, every bridge is there so anyone can pick up the repo with their tool of choice."
- **Non-goal**: we don't generate a `.claude/` directory or anything inside tool-owned dotfolders. Each tool's own settings stay untouched. Lytos only writes the **instruction file** each tool expects at the documented path.
- **Follow-up candidate**: `lyt upgrade --add-tool <name>` to add a bridge to an existing install without re-running `lyt init`.

## Audit de review — 2026-04-21

**Verdict: NO_GO**

L'audit de review donne un NO_GO. La mécanique CLI multi-tool fonctionne, mais la documentation promise n'est pas au niveau attendu.

Ce qui ne va pas :

- `README.md` et `docs/fr/README.md` ne montrent pas d'exemple multi-tool ni `--all-tools`
- les pages website `cli/init` EN/FR ne documentent pas le mode multi-tool
- les pages website `cli/init` décrivent encore des options obsolètes, ce qui contredit le comportement réel

Points à corriger :

- ajouter des exemples `--tool claude,cursor,copilot` et `--all-tools` dans les README EN/FR
- mettre à jour `../lytos-website/src/content/docs/en/cli/init.md`
- mettre à jour `../lytos-website/src/content/docs/fr/cli/init.md`
- vérifier que la doc explique bien le comportement de `none` dans une liste mixte

## Audit de review — 2026-04-22

**Verdict: NO_GO**

Les README EN/FR sont maintenant correctement réalignés : exemples multi-tool, `--all-tools`, comportement de `none` et erreur sur valeur inconnue y sont bien expliqués. En revanche, le DoD demande aussi une mise à jour de la doc website `/cli/init`, et cette partie n'est pas présente dans la branche auditée.

Ce qui bloque :

- la page website `cli/init` EN n'est pas mise à jour
- la page website `cli/init` FR n'est pas mise à jour

Points à corriger :

- mettre à jour la doc website `cli/init` en EN
- mettre à jour la doc website `cli/init` en FR
- vérifier que le comportement `none` y est documenté comme dans les README

## Verification — 2026-04-22 (post-NO_GO)

Re-checked the website pages and found the previous audit was incorrect — both `cli/init` pages already cover the multi-tool surface. No new website work needed.

**`lytos-website/src/content/docs/en/cli/init.md`** (shipped in commit `550b8d3` "docs(cli/init): document multi-tool init and refresh --tool options (ISS-0053)"):

- Usage block lines 13-14: `lyt init --tool claude,cursor,copilot` and `lyt init --all-tools` examples
- Section `### Mixed-team repos` lines 22-31: motivates the multi-tool case, two CSV / `--all-tools` invocations, and explicitly documents that `none` can appear in the CSV as a no-op and that unknown values exit before any file is written
- Options table lines 70-71: `--tool <tools>` documented as "Single value or CSV", and `--all-tools` documented as a separate row

**`lytos-website/src/content/docs/fr/cli/init.md`** — same structure in French, sections `### Repos avec équipe mixte` and identical options table.

**`lytos-cli` local code/tests verified by**:

- `src/commands/init.ts:251-256` — `--tool <tools>` and `--all-tools` Commander options
- `src/commands/init.ts:380-386` — interactive CSV path
- `src/commands/init.ts:44` — Unknown tool emits `Unknown --tool "..."` and exits
- `tests/commands/init.test.ts:247` "scaffolds multiple bridges when --tool is a CSV (ISS-0053)"
- `tests/commands/init.test.ts:264` "scaffolds every bridge when --all-tools (ISS-0053)"

All DoD items ticked. The issue moves to `4-review`; promotion to `5-done` is for `lyt close`.

## Audit de review — 2026-04-22

**Verdict: GO**

Points vérifiés :

- `--tool <tools>` accepte bien un CSV validé/dédupliqué, avec erreur claire sur valeur inconnue (`src/commands/init.ts`)
- `--all-tools` génère bien les six bridges, et `none` reste un no-op en liste mixte (`src/commands/init.ts`, `src/lib/scaffold.ts`, `tests/commands/init.test.ts`)
- le prompt interactif expose bien l'entrée "Multiple (CSV)" / "Plusieurs (CSV)" (`src/commands/init.ts`)
- README EN/FR et doc website EN/FR `cli/init` documentent le cas équipe mixte, `--all-tools` et le comportement de `none`

Validation locale :

- `npm run build`
- `npx vitest run tests/commands/upgrade.test.ts tests/commands/archive.test.ts tests/commands/init.test.ts`

Pas de finding bloquant sur le diff audité.
