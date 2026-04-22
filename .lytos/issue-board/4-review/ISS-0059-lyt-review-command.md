---
id: ISS-0059
title: "Add lyt review command for cross-model code audit"
type: feat
priority: P1-high
effort: M
complexity: standard
domain: [cli, review, workflow]
skill: "code-review"
skills_aux: [documentation, testing]
status: 4-review
branch: "feat/ISS-0059-lyt-review-command"
depends: []
created: 2026-04-21
updated: 2026-04-21
---

# ISS-0059 — Add `lyt review` command for cross-model code audit

## Context

`4-review/` is currently a passive state. When an issue lands in that column it means *"the implementer says coding is done"* — but there is no artifact on the issue itself that records an independent audit verdict. `lyt close` promotes to `5-done` without any check that the review actually happened.

We also have no tooling separation between the implementer and the reviewer. Today, if an audit is produced, it's by the same AI session that wrote the code — which is the worst arrangement: shared cognitive biases, no fresh reading.

This issue introduces `lyt review`, designed around two principles:

1. **Separation of concerns.** The auditor is expected to be a *different* AI session — ideally a different vendor or model — than the one that implemented the issue. The implementer then reads the audit and fixes, but never audits itself.
2. **Self-contained audit prompt.** The auditor agent starts from zero repo context. Everything it needs (issue, diff, rules, skills, manifest excerpts, output format, constraints) is packaged into a single exported prompt. This is also what makes the feature showcase Lytos's model-independence promise: any capable AI can audit the same project because the context lives in the repo.

## Proposed solution

### 1. Command surface

```
lyt review                         # list all 4-review issues + audited/pending status
lyt review ISS-XXXX                # print the portable audit prompt for one issue
lyt review ISS-XXXX --export       # same, alias
lyt review ISS-XXXX --accept [-]   # ingest a returned audit from a file or stdin
lyt review --all --export          # export prompts for every pending audit (one per file)
```

### 2. Two supported flows

**Flow A — agentic auditor (has filesystem + shell tools):**

The auditor AI (e.g. a fresh Claude Code / Codex / Cursor session) runs `lyt review ISS-XXXX`. The output instructs the agent directly:

- read the referenced files
- run the audit
- write the audit block into the issue file
- if verdict is `NO_GO`, move the file from `4-review/` to `3-in-progress/` (and update frontmatter)

No `--accept` step needed. The auditor has the tools to act.

**Flow B — chat / web auditor (no filesystem access, e.g. ChatGPT web, Gemini web):**

1. Human runs `lyt review ISS-XXXX --export > prompt.md`
2. Human pastes the prompt into the web UI of the auditor model
3. The model produces its audit response
4. Human runs `lyt review ISS-XXXX --accept audit.txt` (or pipes via stdin)
5. CLI parses the `## Audit — <date>` block, writes it to the issue file, moves to `3-in-progress/` if verdict is `NO_GO`

### 3. Exported prompt — structure

Ordered, self-contained, written as plain markdown so it copy-pastes into any chat:

1. **Role** — *"You are auditing a Lytos-managed project. You did NOT implement this issue. Do not correct code. Only audit."*
2. **Method brief** — 2 short paragraphs on what Lytos is and how `4-review` works.
3. **Project manifest excerpt** — stack, non-negotiables, constraints from `.lytos/manifest.md`.
4. **Quality rules** — full content of `.lytos/rules/default-rules.md` (+ `cli-rules.md` if present).
5. **Review skill** — full content of `.lytos/skills/code-review/SKILL.md`.
6. **Issue body** — verbatim content of the issue file at `4-review/ISS-XXXX-*.md` (frontmatter + all sections).
7. **Implementation diff** — output of `git diff <issue.branch>...main` trimmed to code-relevant hunks. Large binaries and lock files truncated with a `[omitted, N bytes]` marker.
8. **Expected output format** — the exact audit block template (see §4).
9. **Exit instructions** — for Flow A: "write the audit block to the issue file; move the file to 3-in-progress/ if NO_GO". For Flow B: "reply with the audit block only, nothing else".

### 4. Audit block format (fixed, parseable)

```markdown
## Audit — YYYY-MM-DD

**Verdict:** GO | NO_GO

### Checks
- [x] Tests pass (N/N)
- [x] Issue checklist complete
- [x] Rules respected (file size, fn size, params, coverage)
- [x] Documentation aligned

### Notes
<free prose, references to specific files and line numbers>

### To fix before next review (only if NO_GO)
- [ ] Concrete actionable point 1
- [ ] Concrete actionable point 2
```

The CLI parses `**Verdict:** GO` vs `**Verdict:** NO_GO` to decide transitions.

### 5. NO_GO transition

When an audit verdicts NO_GO, the CLI:

- updates the issue frontmatter `status: 3-in-progress`
- `git mv .lytos/issue-board/4-review/ISS-XXXX-*.md .lytos/issue-board/3-in-progress/`
- leaves the audit block at the bottom of the issue file — the implementer reads it and fixes.

The implementer doesn't need to re-create the branch (it still exists). They pick up where they left off, fix the listed points, commit, push, move the issue back to `4-review/`, and re-request review.

## Definition of done

### Command surface

- [ ] `lyt review` without args lists all 4-review issues with an "audited ✓ / pending" marker
- [ ] `lyt review ISS-XXXX` prints a self-contained prompt with all 9 sections from §3
- [ ] The prompt is usable cold by a fresh AI session — manual verification with at least 2 distinct vendors
- [ ] `lyt review ISS-XXXX --accept <file>` parses a returned audit, writes the block into the issue file
- [ ] NO_GO triggers the file move + frontmatter update; GO leaves the file where it is
- [ ] `lyt review --all --export` writes one prompt file per pending issue under `.lytos/review/<iss-id>.prompt.md`
- [ ] If the issue already has an `## Audit — <date>` block, emit a warning and offer `--overwrite` to re-audit

### Tests

- [ ] Tests cover: prompt generation, verdict parsing (GO and NO_GO), file move on NO_GO, idempotent re-audit with `--overwrite`, invalid audit response handling
- [ ] Coverage ≥ 80% on `src/commands/review.ts`

### Help & motivation to use a fresh auditor

The cross-model split is the whole point of the feature. The CLI help and the docs must push this clearly — otherwise users default to asking the implementing session to audit itself.

- [ ] `lyt --help` top-level examples block mentions `lyt review` as a dedicated workflow step
- [ ] `lyt review --help` includes an explicit motivation block:
  > *Use a fresh AI session for the audit — ideally a different vendor or model than the one that implemented the issue. At minimum, a blank chat with no prior context. A model auditing its own code shares the cognitive biases that caused any mistake in the first place.*
- [ ] The exported prompt's role header restates the same rule in the first paragraph: "you are auditing, not the implementer"

### Documentation

- [ ] New page `/cli/review` (EN + FR) on the website. Must cover:
  - What the command does
  - The two flows (agentic / chat)
  - **Why the auditor must not be the implementer** — with 4 arguments: cognitive-bias independence, review-practice parity (nobody validates their own PR), compliance / audit trail, and live proof of Lytos's model-independence thesis
  - Concrete examples (e.g. "implemented by Claude Code, audited by GPT-5")
  - What a good audit block looks like — with a filled example
- [ ] README (EN + FR) command table updated with `lyt review` row
- [ ] Website `/workflow/` page team workflow — insert a `Reviewer (different AI)` step between `Dev + AI — Implementation` and `Dev — Opens a PR`
- [ ] LYTOS.md (method + bundled) describes the implementer / auditor split as a first-class Lytos pattern, not a CLI curiosity

## Relevant files

- `src/commands/review.ts` — new
- `src/lib/review.ts` — helpers: prompt assembly, audit parsing, transition
- `src/cli.ts` — command registration
- `tests/commands/review.test.ts` — new
- `src/content/docs/{en,fr}/cli/review.md` on the website — new
- `README.md`, `docs/fr/README.md` — updates

## Notes

- **Marketing angle:** this command is a live proof of Lytos's model-independence thesis. Same repo, same context, implemented by Claude, audited by GPT (or vice versa), without anyone rewiring anything. Worth a blog post once shipped.
- **Motivation arguments to land in the docs** (used by both `/cli/review` page and the CLI help):
  1. *Cognitive biases are model-specific.* A model that audits its own code reads its own reasoning as obviously correct — it can't spot the blind spot that caused the bug.
  2. *Nobody validates their own PR.* Code review exists because distance matters. A fresh auditor restores that distance, even when the two reviewers are AI.
  3. *Compliance & traceability.* Many regulated contexts (finance, health, public sector) require review independence. An auditor model distinct from the implementer gives an artifact a compliance officer can point at.
  4. *Proves Lytos's promise.* The whole point of putting the context in the repo is that any model can pick it up. Alternating vendors per review is the cleanest demonstration that you're not locked in.
- **Cross-model expectations:** the prompt must be written in plain markdown with no model-specific idioms (no XML tags, no JSON-only contracts). Any capable LLM (Claude 4.x+, GPT-4.x+, Gemini 2.x+, Codex, Mistral Large, Windsurf Cascade) should be able to follow it.
- **Trust boundary:** the CLI parses whatever verdict the auditor returned. It does not second-guess. If the auditor says GO, it's GO — the human still decides via `lyt close`.
- **Out of scope (follow-ups):**
  - Direct API integration (`--provider openai`, `--provider anthropic`) — requires keys, billing, model config. Not needed for MVP.
  - Multi-round audits with discussion threads — keep the block-based format; iterations happen by moving the issue back and forth.
  - Auditor identity recorded in the block (e.g. `**Auditor model:** <name>`) — maybe add later as a convention.
