# Rules — Default Rules

*These rules are the universal quality criteria applicable to any project using Lytos. They are read by agents before each task. They define what "well done" means.*

---

## Code Structure

| Rule | Threshold | Rationale |
|------|-----------|-----------|
| Maximum file size | 300 lines | Beyond that, the file has too many responsibilities |
| Maximum function size | 30 lines (50 max) | A long function does too many things |
| Maximum nesting | 3 levels | Beyond that, the code is unreadable — use early return |
| Parameters per function | 4 max | Beyond that, group them into an object |

---

## Documentation

| Rule | Detail |
|------|--------|
| Mandatory documentation (docstring, JSDoc, PHPDoc, GoDoc...) | On every public function and method |
| Inline comments | Only to explain the **why**, never the **what** |
| README per module | Each major module has a minimal README |

---

## Hardcoded Values — Forbidden

No magic values in production code.

| Forbidden | Replacement |
|-----------|-------------|
| Magic numbers (`1.20`, `86400`, `3`) | Named constant (`TVA_FRANCE`, `SECONDS_PER_DAY`, `MAX_RETRIES`) |
| Hardcoded colors (`#FF6B35`, `red`) | CSS variable (`var(--color-accent)`) or theme constant |
| Hardcoded URLs | Environment variable or configuration file |
| Configuration strings | Constant or `.env` file |

---

## Error Handling

| Rule | Detail |
|------|--------|
| No silent failures | Every error must be handled explicitly |
| No empty `catch` | A catch must at minimum log the error |
| Clear error messages | The error must state **what** failed and **why** |
| Input validation | All external data (user, API) is validated before processing |

---

## Production Code — Forbidden

| Forbidden | Why |
|-----------|-----|
| `console.log()`, `print()`, `var_dump()`, `fmt.Println()` | Use a structured logger — no debug in production |
| `// TODO` without reference | A TODO must point to an issue: `// TODO(ISS-XXXX)` |
| Commented-out code | If it's commented out, it's dead — delete it. Git is the history |
| `@ts-ignore` / `@phpstan-ignore` without justification | If ignoring a warning, explain why |

---

## Tests

| Rule | Threshold |
|------|-----------|
| Unit test coverage | 80% of public functions minimum |
| Tests for every new feature | Mandatory before merge |
| Tests for every fix | The test must prove the bug doesn't come back |
| E2E tests on critical paths | Mandatory (auth, payment, registration) |

---

## Security

| Rule | Detail |
|------|--------|
| No secrets in code | API keys, tokens, passwords → `.env` file only |
| User inputs escaped | Protection against SQL injection, XSS, command injection |
| Permissions verified | Before any sensitive action |
| Dependencies up to date | No known vulnerabilities in deps |

---

## Git

| Rule | Detail |
|------|--------|
| Commit format | `type(scope): message` |
| Branch per issue | `type/ISS-XXXX-slug` |
| No push to main/dev | Everything goes through PR |
| Mandatory review | At least one review before merge |

---

## Agent Behavior

| Rule | Detail |
|------|--------|
| No silent interpretation | If an instruction (skill, rule, issue) is ambiguous, the agent **flags the ambiguity to the human** instead of guessing. Filling a gap without saying so is worse than asking a question |
| No "if appropriate" | An agent does not decide on its own what is "appropriate". If a step in a skill is not applicable in the context, it flags it — it does not skip it |
| Decision traceability | When an agent makes a technical choice (between two approaches, one lib over another), it mentions it explicitly with the reason, so the human can validate or correct |
| No work without issue | Any work lasting more than 10 minutes or modifying more than 3 files **must** have an issue. The agent proposes creating one before starting untracked work |
| Mandatory start phase | Before writing any code, the agent **must**: (1) move the issue file to `3-in-progress/` and update its frontmatter to `status: 3-in-progress`, (2) run `lyt board` to regenerate BOARD.md, (3) create a git branch `type/ISS-XXXX-slug` from main. **Never code on main.** If the agent starts coding without a branch, the human must stop it |
| Mandatory close phase | After completing a task, the agent **must**: (1) update the issue frontmatter to `5-done`, (2) move the issue file to `5-done/`, (3) run `lyt board` to regenerate BOARD.md, (4) write to memory if learning occurred. No issue stays in `3-in-progress` when its work is complete |
| Incomplete items generate follow-ups | Before closing an issue, review all checklist items. Any unchecked item must either be completed now or generate a new follow-up issue. Never close an issue with silent gaps |

---

## How to Apply These Rules

1. Agents load this file **before each task**
2. Each point is a verifiable criterion — not a vague recommendation
3. A rule violation is flagged as **WARNING** or **CRITICAL** according to the code-review skill
4. Project-specific rules (in a separate file) **complement** these rules, they do not replace them

---

*These rules are the minimum standard. A project can add its own specific rules by creating additional files in this folder.*
