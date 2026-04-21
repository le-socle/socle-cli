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
.lytos/manifest.md              <- the project constitution (who, what, why)
.lytos/memory/MEMORY.md         <- the memory summary (not the sub-files)
.lytos/rules/default-rules.md   <- the baseline quality criteria
.lytos/issue-board/BOARD.md     <- the current board state
```

Estimated time: a few seconds. This context foundation does not change based on the task.

### 2. Identify the current task

Determine which issue needs to be worked on. Possible sources:

- The human gives it explicitly ("work on ISS-0012")
- The board: look at `3-in-progress/` for issues in progress
- The sprint: look at `sprint.md` for committed tasks

**Expected result**: an identified issue file, e.g. `issue-board/3-in-progress/ISS-0012-title.md`.

### 3. Choose the startup depth from issue metadata

Startup depth is not a guess. It comes from the issue frontmatter:

- **Lightweight startup** is allowed only when the issue is explicitly `effort: XS` **and** `complexity: light`
- **Standard startup** remains mandatory for every other combination

If one field is missing, default to standard startup. If the task grows during the session, immediately upgrade from lightweight to standard.

#### Lightweight startup (`effort: XS` + `complexity: light`)

Still load the mandatory safety baseline:

- `.lytos/manifest.md`
- `.lytos/memory/MEMORY.md`
- `.lytos/rules/default-rules.md`
- `.lytos/issue-board/BOARD.md`
- the issue file itself

Then keep the rest proportional:

- recommend the right model from the manifest, as usual
- load task skills only through native progressive disclosure, or manually only if the issue explicitly points to a skill or the tool lacks discovery
- defer cortex files until the issue clearly needs past architectural or domain knowledge
- defer project-specific rule files until the touched area actually matches them
- defer broad codebase exploration; start with the files directly named by the issue or the smallest obvious surface

#### Standard startup (everything else)

Follow the normal protocol below: load the issue, then the relevant skills, memory sections, specific rules, and technical context before coding.

### 4. Load task-specific context

Once the issue is identified, load **only** what is relevant:

#### The appropriate model

Read the `complexity` field in the issue frontmatter and check the **AI Models by complexity** table in the manifest.

**Important**: most tools today don't let the agent switch models on its own. The agent's role is to **flag the recommendation to the human**, not to switch silently.

```
Issue says "complexity: heavy" -> manifest says "heavy = Claude Opus"
-> Tell the human: "This task is heavy — the manifest recommends Opus. Switch with /model if needed."

Issue says "complexity: light" -> manifest says "light = Claude Haiku"
-> Tell the human: "This task is light — Haiku would be sufficient and cheaper."
```

If complexity is not specified, assume `standard`. If the table is not filled in the manifest, flag it to the human.

When orchestration tools support automatic model switching, this step will become automatic. Until then, the agent recommends and the human decides.

#### Task skills (agentskills.io format)

Lytos task skills (`testing`, `code-review`, `code-structure`, `documentation`, `git-workflow`, `deployment`, `security`, `api-design`) are stored as folders following the [agentskills.io](https://agentskills.io) open standard:

```
.lytos/skills/<name>/SKILL.md
```

Each `SKILL.md` declares its own `name` and `description` in YAML frontmatter. **Modern AI tools (Claude Code, Cursor, Codex, Gemini CLI, Copilot, Goose, etc.) discover these skills natively** via progressive disclosure — they read only the metadata at startup and load the full body when a task matches.

The `skill` field in the issue frontmatter is **optional**:

- If present, it is a hint: "for this issue, prefer the `<name>` skill". Useful for borderline tasks.
- If absent, the tool decides via progressive disclosure based on the issue's title, description, and the skill descriptions.

```
Issue says "skill: testing" -> the tool loads .lytos/skills/testing/SKILL.md
Issue has no skill field   -> the tool picks based on the task at hand
```

If the tool you use does not yet support agentskills.io discovery, fall back to reading the relevant `.lytos/skills/<name>/SKILL.md` manually based on the task or the optional `skill` field.

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

### 5. Check work status

Before starting to code:

- [ ] Is the issue up to date? (status, checkboxes)
- [ ] Is there an existing git branch for this issue?
- [ ] Are there recent commits on this branch?
- [ ] Are there any blockers flagged in the sprint?

If a branch already exists, switch to it. Otherwise, create it following the convention: `type/ISS-XXXX-title-kebab`.

### 6. Context summary

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

## Mid-session ideas — the reactive trap

During a session, the human will have new ideas, spot problems, think of improvements. This is normal and healthy. But it's also the moment where process breaks down.

**When an unplanned idea arrives:**

1. **Stop.** Do not start coding.
2. **Reformulate.** Tell the human: "Here's what I understood — [restate the idea]. Is this what you want?"
3. **Assess priority.** Is this P0 (blocks current work)? P1 (important but can wait)? P2 (nice to have)?
4. **Create an issue.** Always. Even if it takes 30 seconds.
5. **Decide together.** Start it now (P0/P1) or put it in backlog (P2+)?
6. **If starting now:** follow the normal start phase — `lyt start ISS-XXXX`, branch, board.

**Why this matters:**
- An idea that skips the process becomes invisible work
- Invisible work creates drift, broken assumptions, undocumented changes
- The process exists to protect the project from impulse — including good impulse

> The best ideas deserve the same discipline as planned work. Urgency is not a reason to bypass the process.

---

## What NOT to do at startup

- **Do not read all memory files** — only the relevant sections
- **Do not re-read all skills** — only the one assigned to the task
- **Do not browse the entire source code** — limit yourself to the files related to the issue
- **Do not start coding before having context** — an agent without context produces generic code
- **Do not use the lightweight path by intuition** — it is allowed only for `effort: XS` + `complexity: light`

---

## Variant — Planning session

If the session is not development but planning (sprint, issues, retrospective):

```
Load:
.lytos/manifest.md
.lytos/memory/MEMORY.md
.lytos/memory/cortex/sprints.md
.lytos/sprint.md
.lytos/issue-board/BOARD.md
.lytos/skills/documentation.md
```

No need for technical memory (backend, frontend, bugs).

---

## Variant — Code review session

```
Load:
.lytos/manifest.md
.lytos/memory/MEMORY.md
.lytos/memory/cortex/architecture.md
.lytos/memory/cortex/patterns.md
.lytos/skills/code-review.md
.lytos/rules/*.md (all rules)
```

The review needs the full quality framework, not detailed technical context.

---

## Task completion — 3 mandatory actions

When the task is done coding (all done criteria met), the agent performs these 3 actions in this order. **Finishing coding does not mean the issue is "done" — it means the issue is ready for review**. The human (or CI, or a peer) then validates and runs `lyt close` to promote the issue to `5-done`.

**Exception — bootstrap/multi-task sessions**: When working on multiple issues in one session (e.g., project setup, creating the sprint, initial scaffolding), it is acceptable to batch the issue updates at the end of the session rather than after each individual task. The key rule remains: by the time you commit, every completed issue must have its frontmatter and folder updated.

### 1. Update the issue frontmatter

The YAML frontmatter is the **source of truth**. Update the `status` field:

```yaml
status: 4-review    # was 3-in-progress
updated: 2026-04-20
```

### 2. Move the issue file

The folder represents the status visually. Move the file:

```bash
git mv .lytos/issue-board/3-in-progress/ISS-XXXX-title.md .lytos/issue-board/4-review/
```

### 3. Update the BOARD.md

Move the issue line to the corresponding section in BOARD.md.

### The close step (human or CI)

Once validation is green, either:

- `lyt close ISS-XXXX` — promote one issue from `4-review/` to `5-done/`, or
- `lyt close` — batch-promote every issue in `4-review/` at once (prompts for confirmation; `--yes` skips it).

The agent normally stops at step 3 and lets the human decide when reviews are complete. A trivial fix can still go directly to `5-done/` via `lyt close ISS-XXXX` while the issue is in `3-in-progress/` — it's an explicit skip-review shortcut, not the default path.

### If learning occurred

If significant learning happened during the task, add an entry in the corresponding cortex file and update the counter in `MEMORY.md`.

---

## Source of truth

The issue's YAML frontmatter is the source of truth for status, dependencies, and assigned skill.

The BOARD.md is an **overview maintained by the agent** — not an independent source of truth. In case of conflict between the frontmatter and the BOARD.md, the frontmatter takes precedence.

---

*This skill is immediately operational. An agent that loads it knows exactly what to read, how to work, and how to close out cleanly.*
