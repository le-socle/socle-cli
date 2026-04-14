---
id: ISS-0002
title: "Implement socle init command"
type: feat
priority: P0-critical
effort: L
complexity: heavy
domain: [cli, scaffold]
skill: code-structure
skills_aux: [documentation]
status: 5-done
branch: "feat/ISS-0002-socle-init"
depends: [ISS-0001]
created: 2026-04-13
updated: 2026-04-13
---

# ISS-0002 — Implement `socle init` command

## Context

`socle init` is the most important command. It replaces `install.sh` with a proper CLI experience. It must work interactively (prompts) and non-interactively (flags for CI).

## Proposed solution

Interactive mode:
1. Ask project name (default: current directory name)
2. Detect stack from existing files (package.json, requirements.txt, go.mod, etc.)
3. Ask which AI tool (Claude Code, Cursor, Other)
4. Ask complexity model preferences (optional, can be filled later)
5. Scaffold the `.socle/` directory with all files
6. Create CLAUDE.md or .cursorrules at project root
7. Show summary and next steps

Non-interactive mode:
```bash
socle init --name "My API" --tool claude --yes
```

## Definition of done

- [ ] Interactive mode works: prompts for name, tool, confirms
- [ ] Non-interactive mode works: `--name`, `--tool`, `--yes` flags
- [ ] Stack detection works for: package.json, requirements.txt, go.mod, composer.json, Cargo.toml
- [ ] `.socle/` directory created with all essential files
- [ ] CLAUDE.md or .cursorrules created based on tool choice
- [ ] Manifest pre-filled with detected info
- [ ] `--dry-run` flag shows what would be created without creating
- [ ] Error if `.socle/` already exists (with `--force` to override)
- [ ] Integration tests cover interactive and non-interactive paths

## Relevant files

- `src/commands/init.ts`
- `src/lib/scaffold.ts` (file generation logic)
- `src/lib/detect-stack.ts` (stack detection)
- `tests/commands/init.test.ts`
