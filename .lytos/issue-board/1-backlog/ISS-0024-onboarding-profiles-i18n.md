---
id: ISS-0024
title: "Onboarding: user profiles, language selection, and guided briefing"
type: feature
priority: P0-critical
effort: L
complexity: standard
skill: code-structure
skills_aux: [documentation]
status: 1-backlog
branch: "feat/ISS-0024-onboarding"
depends: []
created: 2026-04-15
updated: 2026-04-15
---

# ISS-0024 — Onboarding: user profiles, language selection, and guided briefing

## Context

Lytos promises to help vibe coders structure their work. But after `lyt init`, a newcomer sees 30 files and a message saying "ask your AI to help". A vibe coder doesn't know what an issue is, what a kanban board is, or why it matters. The onboarding must bridge this gap.

The core message for ALL profiles: **the quality of your work depends on the quality of your issues.** Well-written issues = good AI output. Vague issues = generic code. `lyt board` is the tool to track and organize this.

## Proposed solution

### 1. Add profile selection to `lyt init`

```
What's your experience level?
  1) I'm new to coding with AI (vibe coder)
  2) I'm a developer
  3) I'm a lead developer
```

### 2. Add language selection

```
Preferred language?
  1) English
  2) Français
```

Language affects:
- CLI messages and post-install briefing
- Generated templates (manifest, memory, board) — user-facing content
- Does NOT affect skills and rules (method stays in English)

Store language preference in `.lytos/config.yml`:
```yaml
language: fr
profile: vibe-coder
```

### 3. Post-install briefing adapted to profile

All profiles share the same core message but with different levels of explanation.

#### Vibe coder briefing

```
Lytos is installed! Here's how it works:

THE KEY IDEA
  Everything starts with issues — small, clear tasks.
  A good issue = your AI knows exactly what to build.
  A vague issue = your AI guesses and produces generic code.

  The better your issues, the better the result.

HOW IT WORKS

  Step 1 — BRAINSTORM
    Open your AI tool and describe your project idea.
    The AI will help you write a manifest (your project's identity)
    and create issues (tasks to accomplish).

  Step 2 — ORGANIZE
    The AI sorts tasks by priority in a kanban board.
    You validate what to do first.
    Run: lyt board — to see your board at any time.

  Step 3 — BUILD
    Work on one issue at a time with your AI.
    Each issue has a checklist — follow it step by step.
    When it's done, the AI moves it to "done".

  Step 4 — LEARN
    The AI saves what it learned in memory/.
    Next session, it remembers your project.
    No more re-explaining everything.

NEXT STEP
  Open your AI tool and say:
  "Help me configure Lytos and plan my project."
```

#### Developer briefing

```
Lytos is installed.

THE KEY IDEA
  The quality of your AI output depends on your issues.
  A well-structured issue with context, checklist, and definition
  of done = precise, testable code on the first try.
  Run: lyt board — your project cockpit.

STRUCTURE
  .lytos/manifest.md      ← your project constitution
  .lytos/skills/           ← 9 operational procedures
  .lytos/rules/            ← quality criteria (enforced)
  .lytos/issue-board/      ← kanban board (source of truth)
  .lytos/memory/           ← persistent knowledge

NEXT STEP
  Open your AI tool and say:
  "Help me configure Lytos for this project."
```

#### Lead developer briefing

```
Lytos is installed.

YOUR ROLE
  You are the system architect. You define:
  - The manifest (project identity and constraints)
  - The rules (quality criteria your AI enforces)
  - The sprint (what to build and in what order)

  Your team works with lyt board to track progress.
  The quality of their output depends on the quality
  of the issues you define.

  Run: lyt board — to see the project state.

KEY FILES
  .lytos/manifest.md      ← highest-leverage file (write it well)
  .lytos/rules/            ← what "done" means (add project-specific rules)
  .lytos/issue-board/      ← your kanban (YAML frontmatter = source of truth)
  .lytos/memory/           ← grows with each sprint

NEXT STEP
  Open your AI tool and say:
  "Help me configure Lytos and plan the first sprint."

GUIDE
  Read the lead developer guide: lytos.org/en/guides/lead/
```

## Checklist

- [ ] Add profile prompt to `lyt init` (vibe-coder, developer, lead)
- [ ] Add language prompt to `lyt init` (en, fr)
- [ ] Store preferences in `.lytos/config.yml`
- [ ] Write vibe coder briefing (EN + FR)
- [ ] Write developer briefing (EN + FR)
- [ ] Write lead developer briefing (EN + FR)
- [ ] Translate generated templates (manifest, memory, board) for FR
- [ ] Pass `--profile` and `--lang` flags for non-interactive mode
- [ ] Update tests
- [ ] Emphasize issue quality and `lyt board` in all 3 profiles

## Definition of done

- `lyt init` asks for profile and language
- Post-install briefing is adapted to the profile
- All 3 briefings emphasize that issue quality drives AI output quality
- All 3 briefings mention `lyt board` as the project cockpit
- FR translations available for briefings and templates
- Preferences stored in `.lytos/config.yml`
- All tests pass
