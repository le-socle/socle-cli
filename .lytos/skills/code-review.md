# Skill — Code Review

*This skill defines how to perform a code review on a project using Lytos. An agent loaded with this skill knows exactly what to check, in what order, and how to formulate feedback.*

---

## When to invoke this skill

- After each PR before merge
- At the human's explicit request on a file or module
- At the end of a sprint, for a global quality audit

---

## Procedure

### 0. Self-review (before requesting review)

Before requesting a review from others:

- Re-read your own diff as if you were the reviewer
- Check for forgotten debug code, TODOs, commented-out code
- Verify the PR description explains the "why"
- Confirm all tests pass locally

### 1. Gather context

Before starting the review:

- Read the project **manifest** — understand the fundamental constraints
- Read the **memory** — check for relevant architectural decisions
- Read the active **rules** — these are the quality criteria to apply
- Read the **linked issue** — understand the "why" behind the change

### 2. Review checklist

Apply each point of this checklist to the submitted code:

#### PR size
- [ ] The PR is under 400 lines of meaningful changes (excluding generated files, lock files)
- [ ] If larger, the PR is split into logical, reviewable chunks
- [ ] Each PR has a single focus — one feature, one fix, one refactoring

#### Readability
- [ ] The code reads top to bottom effortlessly
- [ ] Variable, function, and class names are explicit
- [ ] No obscure abbreviations (except established project conventions)
- [ ] Logical blocks are visually separated

#### Structure
- [ ] Each file is under 300 lines
- [ ] One function = one responsibility
- [ ] No excessive nesting (max 3 levels)
- [ ] Imports are organized and sorted

#### Naming
- [ ] Functions describe what they do (verb + noun)
- [ ] Variables describe what they contain
- [ ] Constants are in UPPER_SNAKE_CASE
- [ ] Naming is consistent with the rest of the project

#### Duplication
- [ ] No copy-paste — if a pattern repeats 3+ times, it must be factored out
- [ ] Existing utility functions are reused
- [ ] No reinventing what already exists in dependencies

#### Error handling
- [ ] Errors are handled explicitly (no silent failures)
- [ ] Error messages are understandable
- [ ] Edge cases are covered
- [ ] No empty `catch` or `try/catch` that swallows everything

#### Security
- [ ] No injection possible (SQL, XSS, command)
- [ ] User inputs are validated and escaped
- [ ] No hardcoded secrets in the code (API key, password, token)
- [ ] Permissions are checked before every sensitive action

#### Tests
- [ ] New functions have unit tests
- [ ] Edge cases are tested
- [ ] Existing tests still pass
- [ ] Coverage does not regress

#### Performance
- [ ] No database query in a loop (N+1)
- [ ] No expensive computation left uncached
- [ ] No unnecessary data loading
- [ ] Assets are optimized if modified

#### Documentation
- [ ] Public functions are documented (docstring, PHPDoc, JSDoc, GoDoc...)
- [ ] Non-obvious behaviors have a comment
- [ ] The README is updated if the public interface changes

### 3. Feedback classification

Each review comment must be classified:

| Level | Meaning | Expected action |
|-------|---------|-----------------|
| **CRITICAL** | Bug, security flaw, data loss | Blocks the merge — must be fixed |
| **WARNING** | Bad practice, technical debt, future risk | Must be fixed unless explicitly justified |
| **SUGGESTION** | Possible improvement, style, optimization | At the developer's discretion |

### 4. Output format

Each comment follows this format:

```
[CRITICAL | WARNING | SUGGESTION] file:line
Description of the problem.
Suggested fix (if applicable).
```

Example:

```
[CRITICAL] src/auth/login.py:42
The password is logged in plain text in the debug file.
-> Remove the print() or replace with a hash before logging.

[WARNING] src/components/ProductCard.tsx:128
Color #FF6B35 hardcoded in inline style.
-> Use a theme variable or a named constant.

[SUGGESTION] src/utils/format.go:15
The FormatDate function could use time.Format with a more standard layout.
```

### 5. Summary

At the end of the review, produce a summary:

```
## Review Summary

**Files reviewed**: X
**Critical**: X (blocking)
**Warnings**: X
**Suggestions**: X

**Verdict**: ✅ Ready to merge | ⛔ Corrections required | ⚠️ Minor corrections recommended

**Strengths**:
- ...

**Areas of concern**:
- ...
```

---

## Rules specific to this skill

- Never approve code with an unresolved CRITICAL comment
- Do not review your own code — another agent or the human must validate
- If a problematic pattern is recurring, flag it for addition to the **rules**
- If an architectural decision is discovered during the review, document it in the **memory**

---

## Review turnaround

- Aim to respond to a review request within 24 hours (or one working day)
- A fast review cycle is more valuable than a perfect review — unblock the author
- If a full review will take time, leave a quick comment: "Seen, will review by [time]"
- DORA research shows that review speed directly correlates with team performance

---

*This skill is immediately operational. An agent that loads it can perform a complete code review without further interpretation.*
