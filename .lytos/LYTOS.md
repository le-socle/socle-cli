# Lytos — AI Briefing

*This file explains the Lytos method to the AI working on this project. It is read once at the start of the first session to understand the framework. Afterwards, only the manifest and memory are needed.*

---

## What Lytos is

Lytos is a human-AI working method. It replaces agent "personas" (LeadDev, UX Expert...) with operational procedures (skills), quality criteria (rules), and persistent memory (memory). The human is the architect, the AI executes within the defined framework.

## Files and their roles

| File | Role | When to read it |
|------|------|-----------------|
| `manifest.md` | The project's constitution — identity, stack, decision principles, AI models | At each session |
| `memory/MEMORY.md` | Memory summary — points to specialized files in `cortex/` | At each session |
| `memory/cortex/*.md` | Specialized zones (architecture, backend, frontend, patterns, bugs, business, sprints) | Load only what's relevant to the task |
| `rules/default-rules.md` | Universal quality criteria | At each session |
| `rules/*-rules.md` | Project-specific rules (if they exist) | At each session |
| `skills/*.md` | Operational procedures (code-review, testing, documentation, etc.) | Load the skill assigned to the task |
| `issue-board/BOARD.md` | Kanban view — task progress status | When working on a task |
| `issue-board/[status]/ISS-*.md` | Issues with YAML frontmatter (source of truth) | Read the assigned issue |
| `scripts/generate-board.py` | Regenerates BOARD.md from the frontmatter | Use at the end of a task if needed |

## How the pieces fit together

```
manifest.md          → Provides context and decision principles
    ↓
memory/MEMORY.md     → Provides history and past learnings
    ↓
rules/               → Defines quality criteria to follow
    ↓
skills/              → Defines the procedure to follow for the task
    ↓
issue-board/         → Defines the exact scope of the task (frontmatter = source of truth)
```

## First session — two paths

### Path A: Manifest is already filled

If the manifest has real content (not placeholders), skip the setup flow. Go directly to `skills/session-start.md` — load the context, identify the current task, and start working. The briefing below is not needed.

### Path B: Manifest is empty or incomplete

Help the human fill it in by asking questions:

### Identity
- "What is the project called and what does it do in one sentence?"

### Why this project exists
- "What problem does this project solve? For whom?"

### Tech stack
- Look at the project files (package.json, requirements.txt, go.mod, composer.json) to automatically detect the stack.

### Vocabulary
- "What terms are specific to this project? What is a [business term] in this context?"

### Development principles
Principles are **trade-offs**, not wishful thinking. Each principle says "we prefer X over Y, because Z." Examples:
- "Simplicity over flexibility — we don't code for a hypothetical need"
- "Convention over configuration — we follow the framework, we don't invent"

If the human says "write clean code", reformulate it as a verifiable trade-off.

### AI models by complexity
- Ask which models are available (budget, tools)
- Suggest a distribution: the cheapest model for docs and formatting, the standard model for day-to-day development, the most powerful for architecture and security

## Helping the human create issues

Issues have YAML frontmatter. The important fields:
- `complexity: light | standard | heavy` — determines which model to use (see table in the manifest)
- `skill` — the main skill to load
- `depends` — issues that must be completed before this one
- `status` — the canonical status (source of truth). The file should also be in the matching folder, but if there's a conflict, the frontmatter takes precedence

## Expected behavior

1. **Don't interpret silently** — if an instruction is ambiguous, ask rather than guess
2. **Trace decisions** — when a technical choice is made, mention it with the reason
3. **At the end of a task** — update the issue's frontmatter, move the file, update the BOARD.md
4. **Enrich the memory** — if a significant learning occurs, add it to the corresponding cortex file

---

*This briefing is operational. The AI reading it understands the method and can guide the human in setting up Lytos.*
