# Skill — Session Start

*This skill defines what an agent does at the very beginning of a work session. It ensures the agent has the right context before starting, without loading more than necessary.*

---

## When to invoke this skill

- At the beginning of each work session with an agent
- When an agent is invoked on a new task
- When resuming work after an interruption

---

## Procedure

### 1. Load global context (always)

These files are read at **every** session, without exception:

```
.socle/manifest.md              <- the project constitution (who, what, why)
.socle/memory/MEMORY.md         <- the memory summary (not the sub-files)
.socle/rules/default-rules.md   <- the baseline quality criteria
.socle/issue-board/BOARD.md     <- the current board state
```

Estimated time: a few seconds. This context foundation does not change based on the task.

### 2. Identify the current task

Determine which issue needs to be worked on. Possible sources:

- The human gives it explicitly ("work on ISS-0012")
- The board: look at `3-in-progress/` for issues in progress
- The sprint: look at `sprint.md` for committed tasks

**Expected result**: an identified issue file, e.g. `issue-board/3-in-progress/ISS-0012-title.md`.

### 3. Load task-specific context

Once the issue is identified, load **only** what is relevant:

#### The appropriate model

Read the `complexity` field in the issue frontmatter and check the **AI Models by complexity** table in the manifest to determine which model to use.

```
Issue says "complexity: heavy" -> manifest says "heavy = Claude Opus" -> use Opus
Issue says "complexity: light" -> manifest says "light = Claude Haiku" -> use Haiku
```

If complexity is not specified, use the `standard` model by default. If the table is not filled in the manifest, flag it to the human.

#### The assigned skill

Read the `skill` field in the issue -> load the corresponding skill file.

```
Issue says "skill: testing" -> load .socle/skills/testing.md
```

#### The relevant memory sections

Check the `MEMORY.md` summary -> load files based on the task domain.

| Task domain | Memory files to load (in `cortex/`) |
|-------------|-------------------------------------|
| Backend (API, DB, services) | `architecture.md` + `backend.md` |
| Frontend (UI, components, styles) | `architecture.md` + `frontend.md` |
| Full-stack | `architecture.md` + `backend.md` + `frontend.md` |
| Bug fix | `bugs.md` + the relevant domain |
| Code review | `architecture.md` + `patterns.md` |
| New sprint | `sprints.md` |
| Business logic / UX | `business.md` |

#### Specific rules

If project-specific rule files exist (e.g. `rules/bookshelf-rules.md`), load them too.

#### Manifest principles for decision-making

When a technical choice arises (two possible approaches, a trade-off to make), check the **Development principles** section of the manifest. These principles are formulated as trade-offs ("we prefer X over Y") — they serve exactly to settle this kind of decision.

```
Example:
The manifest says "Simplicity over flexibility"
-> I choose the straightforward approach, not the generic abstraction.
```

If the principles don't cover the situation, flag the trade-off to the human rather than guessing.

### 4. Check work status

Before starting to code:

- [ ] Is the issue up to date? (status, checkboxes)
- [ ] Is there an existing git branch for this issue?
- [ ] Are there recent commits on this branch?
- [ ] Are there any blockers flagged in the sprint?

If a branch already exists, switch to it. Otherwise, create it following the convention: `type/ISS-XXXX-title-kebab`.

### 5. Context summary

Before starting work, formulate (mentally or explicitly):

```
Project : [manifest name]
Issue   : ISS-XXXX — [title]
Skill   : [loaded skill]
Memory  : [loaded sections]
Branch  : [git branch]
Status  : [what's already done / what remains]
```

The agent is now ready to work.

---

## What NOT to do at startup

- **Do not read all memory files** — only the relevant sections
- **Do not re-read all skills** — only the one assigned to the task
- **Do not browse the entire source code** — limit yourself to the files related to the issue
- **Do not start coding before having context** — an agent without context produces generic code

---

## Variant — Planning session

If the session is not development but planning (sprint, issues, retrospective):

```
Load:
.socle/manifest.md
.socle/memory/MEMORY.md
.socle/memory/cortex/sprints.md
.socle/sprint.md
.socle/issue-board/BOARD.md
.socle/skills/documentation.md
```

No need for technical memory (backend, frontend, bugs).

---

## Variant — Code review session

```
Load:
.socle/manifest.md
.socle/memory/MEMORY.md
.socle/memory/cortex/architecture.md
.socle/memory/cortex/patterns.md
.socle/skills/code-review.md
.socle/rules/*.md (all rules)
```

The review needs the full quality framework, not detailed technical context.

---

## Task completion — 3 mandatory actions

When the task is done (all done criteria met), the agent performs these 3 actions in this order:

### 1. Update the issue frontmatter

The YAML frontmatter is the **source of truth**. Update the `status` field:

```yaml
status: 5-done    # was 3-in-progress
updated: 2026-04-12
```

### 2. Move the issue file

The folder represents the status visually. Move the file:

```bash
git mv .socle/issue-board/3-in-progress/ISS-XXXX-title.md .socle/issue-board/5-done/
```

### 3. Update the BOARD.md

Move the issue line to the corresponding section in BOARD.md. If the issue moves to `5-done`, add the completion date.

### If learning occurred

If significant learning happened during the task, add an entry in the corresponding cortex file and update the counter in `MEMORY.md`.

---

## Source of truth

The issue's YAML frontmatter is the source of truth for status, dependencies, and assigned skill.

The BOARD.md is an **overview maintained by the agent** — not an independent source of truth. In case of conflict between the frontmatter and the BOARD.md, the frontmatter takes precedence.

---

*This skill is immediately operational. An agent that loads it knows exactly what to read, how to work, and how to close out cleanly.*
