# Rules

*This folder contains the project's quality criteria. Rules define what "well done" means — they are read by agents before each task.*

---

## How It Works

Rules are markdown files in this folder. They are loaded by agents just like skills, but with a different role:

- **Skills** = how to do it (procedures)
- **Rules** = what to comply with (criteria)

An agent doing a code review loads the `code-review` skill **and** the project rules. The skill tells it how to proceed, the rules tell it what to check.

---

## Included Files

| File | Content |
|------|---------|
| `default-rules.md` | Universal rules applicable to any Lytos project |

---

## Creating Your Own Rules

To add rules specific to your project, create a new file in this folder.

### Format

```markdown
# Rules — [Domain Name]

*Short description of what these rules cover.*

---

## [Category]

| Rule | Detail |
|------|--------|
| Rule name | What is expected |

---
```

### Examples of Specific Rules

**`api-rules.md`** — for a REST API:
```markdown
| Rule | Detail |
|------|--------|
| Correct HTTP codes | 201 for creation, 204 for deletion, not 200 everywhere |
| Mandatory pagination | Every endpoint that lists resources is paginated |
| Versioning | All routes start with /api/v1/ |
```

**`frontend-rules.md`** — for a React/Next.js app:
```markdown
| Rule | Detail |
|------|--------|
| Components < 150 lines | Beyond that, split into sub-components |
| Server Components by default | `'use client'` only when necessary |
| Accessibility | Every interactive component navigable by keyboard + ARIA |
```

### Principles for Writing Good Rules

1. **Verifiable** — a rule must be checkable by an agent in a binary way (met / not met)
2. **Specific** — "write good code" is not a rule. "Files < 300 lines" is one
3. **Justified** — every rule has a reason for existing. If you can't explain it, it's useless
4. **Few in number** — better 10 rules that are applied than 50 rules that are ignored

---

## Hierarchy

Rules are cumulative:

1. `default-rules.md` — always active
2. Project-specific files — added on top, do not replace

In case of conflict, project-specific rules take precedence over default rules.

---

*Rules are one of the four pillars of Lytos. They guarantee a consistent quality level, regardless of which agent is working.*
