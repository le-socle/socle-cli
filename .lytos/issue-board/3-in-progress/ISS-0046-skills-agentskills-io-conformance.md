---
id: ISS-0046
title: "Adopt agentskills.io format for Lytos task skills"
type: feature
priority: P1-high
effort: M
complexity: standard
skill: code-structure
skills_aux: [documentation]
scope: lytos-cli
status: 3-in-progress
branch: "feat/ISS-0046-skills-agentskills-io"
depends: []
created: 2026-04-20
updated: 2026-04-20
---

# ISS-0046 — Adopt agentskills.io format for Lytos task skills

## Context

Since Lytos was designed, an open standard for agent skills has emerged: [agentskills.io](https://agentskills.io). It was originated by Anthropic and is now adopted natively by virtually all the tools Lytos targets via `--tool` adapters: Claude Code, Claude, OpenAI Codex, Cursor, Gemini CLI, GitHub Copilot, VS Code, Goose, JetBrains Junie, OpenHands, and more.

Today, Lytos skills sit in `.lytos/skills/<name>.md` as flat markdown files, loaded explicitly via the `skill:` field of an issue's frontmatter, with the `session-start.md` skill orchestrating the load. This is functional but diverges from the rest of the ecosystem in two ways:

- The format is custom (no metadata frontmatter, no folder structure).
- The trigger is explicit (issue pins the skill) rather than discovered via progressive disclosure (the agent loads only the skill that matches the task at hand).

agentskills.io's design is deliberately minimal — a folder with a `SKILL.md` file containing two required frontmatter fields (`name`, `description`) and free-form markdown body. Optional subfolders for `scripts/`, `references/`, `assets/`. Progressive disclosure means only the metadata of all skills is loaded at startup (~100 tokens each), and the full body loads only when a task matches the description.

For Lytos this means: zero-cost migration of existing content (skills are already prose) + native discovery in every target tool + token efficiency + portability of Lytos skills outside Lytos projects.

## Proposed solution

### Scope: convert the 8 task skills

In `.lytos/skills/`, convert each task-specific skill from a flat file to a folder with a `SKILL.md` inside it:

```
.lytos/skills/
├── api-design.md           ──>  api-design/SKILL.md
├── code-review.md          ──>  code-review/SKILL.md
├── code-structure.md       ──>  code-structure/SKILL.md
├── deployment.md           ──>  deployment/SKILL.md
├── documentation.md        ──>  documentation/SKILL.md
├── git-workflow.md         ──>  git-workflow/SKILL.md
├── security.md             ──>  security/SKILL.md
├── testing.md              ──>  testing/SKILL.md
└── session-start.md        ──>  STAYS (it's a bootstrap protocol, not a task skill)
```

Each new `SKILL.md` gains a YAML frontmatter at the top:

```yaml
---
name: testing
description: Write and review tests on a Lytos project. Use when adding a feature, fixing a bug, refactoring, or auditing coverage. Covers unit, integration, and E2E with the Testing Trophy model.
---
```

Body content is preserved verbatim. Names follow the spec: lowercase, hyphens only, ≤64 chars, must equal the parent directory name.

### Rationale for keeping `session-start.md` as-is

agentskills.io skills are **task-specific** ("PDF processing", "code review"). `session-start.md` is a **session bootstrap protocol** — it defines what to read at the start of any session, regardless of task. That is the role of `CLAUDE.md` / `AGENTS.md` / project rules, not a skill. Converting it to a skill would either never be triggered (no task matches "starting a session") or be triggered always (defeats progressive disclosure). It stays in `.lytos/skills/session-start.md` and is referenced from the tool config files.

### Update the `skill:` field in issue frontmatter

The `skill:` field in issue frontmatter becomes **optional** rather than mandatory:

- If present, it is a hint to the agent: "for this issue, prefer the `<name>` skill". Useful for borderline tasks.
- If absent, the agent decides via progressive disclosure based on the issue's title and description.

This preserves human-first control (the human can still pin a skill explicitly) while aligning with the standard.

### Update tool config files

The `CLAUDE.md`, `AGENTS.md`, `.cursorrules` templates (and equivalents for the upcoming Copilot/Gemini/Windsurf adapters from ISS-0039) need a small update: stop instructing the agent to "read the skill named in the issue" and instead let the tool's native skill discovery handle it. Keep instructing it to read `session-start.md` at session start.

### Scaffolding

`lyt init` and the bundled templates need to ship the new folder structure. The `templates.ts` and `scaffold.ts` files are the entry points.

### Validation

Use the official `skills-ref` reference library to validate each converted skill:

```bash
npx -y @agentskills/skills-ref validate .lytos/skills/testing
```

## Definition of done

- [ ] 8 task skills converted to `<name>/SKILL.md` folder format with valid `name` + `description` frontmatter
- [ ] Each `SKILL.md` passes `skills-ref validate`
- [ ] `session-start.md` remains a flat file at `.lytos/skills/session-start.md`
- [ ] `skill:` field in issue frontmatter documented as optional in the manifest and in `templates/issue-feature.md`
- [ ] Tool config templates (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`) updated to reference the new structure and stop pinning skills via the issue
- [ ] `lyt init` scaffolds the new folder structure
- [ ] `lyt doctor` checks that each skill has a valid `SKILL.md` with required frontmatter
- [ ] Dogfooding: this CLI's own `.lytos/skills/` is migrated
- [ ] Manifest `.lytos/manifest.md` updated to describe the new skill model
- [ ] LYTOS.md updated (the method definition itself)
- [ ] Lytos-website docs updated (`/method/skills` and the long-tail SEO page on skills)
- [ ] Migration note in README / CHANGELOG for existing users

## Checklist

### Skill content migration
- [ ] `api-design/SKILL.md`
- [ ] `code-review/SKILL.md`
- [ ] `code-structure/SKILL.md`
- [ ] `deployment/SKILL.md`
- [ ] `documentation/SKILL.md`
- [ ] `git-workflow/SKILL.md`
- [ ] `security/SKILL.md`
- [ ] `testing/SKILL.md`

### CLI changes
- [ ] `src/lib/scaffold.ts` — bundled skills shipped as folders
- [ ] `src/lib/templates.ts` — CLAUDE.md / AGENTS.md / .cursorrules templates updated
- [ ] `src/lib/templates.ts` — `issue-feature.md` template marks `skill:` as optional
- [ ] `src/commands/doctor.ts` — validate `SKILL.md` frontmatter
- [ ] `src/commands/init.ts` — scaffold new structure
- [ ] Tests in `tests/` cover the new layout

### Doc / method
- [ ] `.lytos/manifest.md` — reflect the new skill model
- [ ] `.lytos/LYTOS.md` — same
- [ ] `.lytos/issue-board/templates/issue-feature.md` — `skill:` optional
- [ ] Lytos-website `/method/skills` page

## Relevant files

- `.lytos/skills/` — the 9 current skill files (8 to migrate, 1 to keep)
- `src/lib/scaffold.ts` — bundled-file copy logic
- `src/lib/templates.ts` — template bodies
- `src/commands/init.ts` — init pipeline
- `src/commands/doctor.ts` — validation
- `.lytos/manifest.md`, `.lytos/LYTOS.md` — method definition

## Notes

- This is **not** a backwards-compatibility break for existing user projects until they upgrade Lytos and re-run `lyt init` (or accept a one-shot migration command). To soften the transition, consider shipping a `lyt migrate skills` command alongside this issue.
- A natural follow-up issue (proposed as ISS-0047) is the symmetric capability: `lyt skill add <source>` to import third-party agentskills.io skills from a git repo or registry into a Lytos project. Out of scope here.
- We retain `session-start.md` as a Lytos-specific bootstrap protocol — it is not a task skill in the agentskills.io sense.
- Reference: [agentskills.io specification](https://agentskills.io/specification), [Anthropic example skills](https://github.com/anthropics/skills).
