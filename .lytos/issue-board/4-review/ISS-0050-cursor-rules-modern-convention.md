---
id: ISS-0050
title: "lyt init --tool cursor: use modern .cursor/rules/*.mdc convention"
type: refactor
priority: P2-normal
effort: XS
complexity: light
skill: code-structure
skills_aux: [testing, documentation]
scope: lytos-cli
status: 4-review
branch: "refactor/ISS-0050-cursor-rules-mdc"
depends: []
created: 2026-04-20
updated: 2026-04-21
---

# ISS-0050 — `lyt init --tool cursor` should use `.cursor/rules/*.mdc`

## Context

Today `lyt init --tool cursor` writes `.cursorrules` at the repo root. This is the legacy Cursor convention. Since 2024 Cursor recommends the newer format: per-rule `.mdc` files under `.cursor/rules/`, which supports scoping, front-matter, and per-rule activation — things `.cursorrules` does not.

Our own documentation on lytos-website already reflects the newer convention. The compatibility table says the Cursor bridge is `.cursor/rules/lytos.mdc`, and so does the [agents-md-vs-claude-md-vs-cursor-rules](https://lytos.org/en/method/manifest/agents-md-vs-claude-md-vs-cursor-rules/) long-tail page. Only the CLI still writes the old flat file.

The discrepancy was spotted during ISS-0039 (addition of Copilot / Gemini / Windsurf adapters) and explicitly deferred to this issue.

## Proposed solution

1. **Change the scaffold target**: `src/lib/scaffold.ts` writes to `.cursor/rules/lytos.mdc` instead of `.cursorrules` when `--tool cursor`.
2. **Add the `.mdc` front-matter** at the top of the generated file so Cursor activates the rule on every request:
   ```
   ---
   description: Lytos project instructions — read .lytos/ at session start
   globs: ["**/*"]
   alwaysApply: true
   ---
   ```
   (Followed by the existing prose.)
3. **Update `src/lib/templates.ts`**: rename `cursorrTemplate` → `cursorRulesTemplate`, prepend the front-matter, keep the body.
4. **Update `src/commands/upgrade.ts`** so `lyt upgrade` knows to refresh `.cursor/rules/lytos.mdc`, not `.cursorrules`.
5. **Migration for existing users**: `lyt init --force` overwrites the new path cleanly. `lyt upgrade` detects a stale `.cursorrules` at root and offers to replace it with the new layout (warning message, `--migrate-cursor` flag to confirm).
6. **Test updates**: `tests/commands/init.test.ts` — the `--tool cursor` test expects `.cursor/rules/lytos.mdc` at the right path. Add one test for the front-matter being present.
7. **README**: update the bridge table (Cursor row now says `.cursor/rules/lytos.mdc`).
8. **Website**: already correct — no change needed.

## Definition of done

- [ ] `lyt init --tool cursor` generates `.cursor/rules/lytos.mdc` (not `.cursorrules`)
- [ ] Generated `.mdc` starts with valid YAML front-matter (`description`, `globs`, `alwaysApply`)
- [ ] `lyt upgrade` refreshes the new path
- [ ] `lyt upgrade --migrate-cursor` (or similar) removes a stale `.cursorrules` and writes the new file
- [ ] Test: exact path + presence of front-matter
- [ ] README bridge table updated
- [ ] Manual verification: `--tool cursor` produces a file Cursor picks up immediately (open the repo in Cursor, start a chat, confirm the rule is applied)

## Relevant files

- `src/lib/scaffold.ts` — write target
- `src/lib/templates.ts` — rename function + add front-matter
- `src/commands/upgrade.ts` — update upgradeable-files list + add migration detection
- `tests/commands/init.test.ts` — update `--tool cursor` test
- `tests/commands/upgrade.test.ts` — add migration test
- `README.md` — bridge table
- `.lytos/` own dogfooding copy: we use `--tool claude` ourselves, so no local change needed

## Notes

- Low-risk refactor: the user-visible surface (`--tool cursor` flag) is unchanged.
- Backwards compatibility: we can leave the old `.cursorrules` in place for users who created it before this lands — Cursor ignores it if the new `.mdc` takes precedence. The `--migrate-cursor` flag is an opt-in cleanup, not forced.
- Reference: Cursor docs on [Project Rules](https://docs.cursor.com/context/rules). The `.cursorrules` format is still documented but marked as legacy.

## Audit de review — 2026-04-21

**Verdict: NO_GO**

L'audit de review donne un NO_GO. Le nouveau chemin `.cursor/rules/lytos.mdc` est bien généré par `lyt init`, mais la migration promise pour les installations existantes n'est pas livrée.

Ce qui ne va pas :

- `src/commands/upgrade.ts` ne propose aucun `--migrate-cursor`
- `lyt upgrade` ne gère pas la présence d'un ancien `.cursorrules`
- aucun test de migration n'existe pour le passage de `.cursorrules` vers `.cursor/rules/lytos.mdc`

Points à corriger :

- ajouter une vraie stratégie de migration pour les repos qui ont encore `.cursorrules`
- exposer l'option CLI prévue pour confirmer cette migration
- couvrir le scénario legacy dans `tests/commands/upgrade.test.ts`
- réaligner la doc publique qui décrit encore l'ancien fichier dans certaines pages `cli/init`
