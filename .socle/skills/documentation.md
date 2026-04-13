# Skill — Documentation

*This skill defines how to document code, modules, and learnings on a project using Le Socle. An agent loaded with this skill knows what to document, in what format, and when to update the project memory.*

---

## When to invoke this skill

- After writing or modifying a public function
- After a sprint, to consolidate learnings into the memory
- When creating a new module or component
- To write or update an issue

---

## Code documentation

### Universal principle

Every public function and method must be documented. The format depends on the language, the content is the same:

1. **First line**: what the function does (infinitive verb)
2. **Parameters**: type + name + one-sentence description
3. **Return**: type + description, including edge cases (empty list, null, error)
4. **Errors**: each possible exception or error with its condition

### Examples by language

```python
def calculer_ttc(prix_ht: float, taux_tva: float) -> float:
    """Calcule le prix TTC à partir du prix HT et du taux de TVA.

    Args:
        prix_ht: Le prix hors taxes en euros.
        taux_tva: Le taux de TVA (ex: 0.20 pour 20%).

    Returns:
        Le prix TTC arrondi à 2 décimales.

    Raises:
        ValueError: Si le prix HT est négatif.
    """
```

```javascript
/**
 * Filtre les produits selon les critères donnés.
 *
 * @param {Product[]} produits - La liste complète des produits.
 * @param {FilterCriteria} criteres - Les critères de filtrage à appliquer.
 * @returns {Product[]} Les produits correspondant aux critères. Tableau vide si aucun résultat.
 */
function filtrerProduits(produits, criteres) {
```

```go
// CalculerTTC calcule le prix TTC à partir du prix HT et du taux de TVA.
// Retourne une erreur si le prix HT est négatif.
func CalculerTTC(prixHT, tauxTVA float64) (float64, error) {
```

```php
/**
 * Calcule le prix TTC à partir du prix HT et du taux de TVA.
 *
 * @param float $prixHT    Le prix hors taxes en euros.
 * @param float $tauxTVA   Le taux de TVA (ex: 0.20 pour 20%).
 * @return float Le prix TTC arrondi à 2 décimales.
 * @throws InvalidArgumentException Si le prix HT est négatif.
 */
public function calculerTTC(float $prixHT, float $tauxTVA): float
```

### Do not document

- Trivial getters/setters with no logic
- Private functions whose name is explicit enough
- Obvious one-line wrappers

### Inline comments

Inline comments are **not** for repeating what the code does — they explain **why**.

```python
# ✅ Good — explains the why
# We round up because the payment API doesn't accept cents
amount = math.ceil(total)

# ❌ Bad — repeats the code
# We round the total
amount = math.ceil(total)
```

#### When to comment

- A non-obvious technical decision
- A workaround or external constraint
- An intentionally counter-intuitive behavior
- A TODO with issue reference: `// TODO(ISS-0042): refactor when API v2 is stable`

#### When NOT to comment

- The code is readable and naming is sufficient
- To explain overly complex code -> simplify the code rather than commenting

---

## Module documentation

Each major module or component has a README in its folder.

```markdown
# [Module name]

*One sentence describing what this module does.*

## Responsibility

This module handles [X]. It does not handle [Y] (see `path/to/other-module`).

## Usage

\`\`\`php
$result = MyModule::do($input);
\`\`\`

## Dependencies

- `other-module` — for [reason]
- `external-lib` v2.x — for [reason]

## Gotchas

- [Known constraint or pitfall]
```

---

## Architecture Decision Records (ADR)

When a significant technical decision is made (choice of framework, database, API strategy, authentication approach), document it as an ADR.

### Format

```markdown
# ADR-XXXX — [Short title]

**Date**: YYYY-MM-DD
**Status**: Accepted | Superseded by ADR-YYYY | Deprecated

## Context

What is the situation that requires a decision?

## Decision

What did we decide, and why?

## Consequences

What changes as a result? What are the trade-offs?
```

### Where to store

- In `memory/cortex/architecture.md` for lightweight ADRs (1-3 paragraphs)
- In a dedicated `docs/adr/` folder for formal ADRs (if the project needs full traceability)

### When to write an ADR

- Choosing a framework, database, or major dependency
- Changing API strategy (REST → GraphQL, monolith → microservices)
- Security architecture decisions (auth flow, encryption)
- Any decision you would have to re-explain to a new team member

The memory entries in Le Socle (context/decision/consequence format) are lightweight ADRs. For most projects, they are sufficient. Use formal ADRs only when external traceability is required.

---

## API documentation

If the project exposes an API, it must be documented with a machine-readable specification:

| Standard | When to use |
|----------|------------|
| **OpenAPI / Swagger** | REST APIs (the industry default) |
| **GraphQL Schema** | GraphQL APIs (self-documenting by nature) |
| **AsyncAPI** | Event-driven APIs (WebSocket, message queues) |

### OpenAPI best practices

- Keep the spec in sync with the code — generate from annotations or validate against the spec in CI
- Every endpoint has: summary, description, request body schema, response schemas (success + errors), authentication requirements
- Include realistic examples in the spec
- Serve interactive docs (Swagger UI, Redoc) at `/docs` or `/api/docs`

---

## Changelog

Every project that ships releases maintains a CHANGELOG.md at the root.

### Format (Keep a Changelog)

```markdown
# Changelog

## [1.2.0] — 2026-04-12

### Added
- New endpoint for bulk user import (#ISS-0045)

### Fixed
- Cart total calculation rounding error (#ISS-0038)

### Changed
- Migrated authentication from session to JWT (#ISS-0041)
```

### Rules

- Group changes by: Added, Changed, Fixed, Removed, Security
- Link to issues or PRs
- Write for humans, not machines
- If using conventional commits, the changelog can be auto-generated (release-please, standard-version)
- The changelog is updated in the same PR as the change — not retroactively

---

## Updating the Memory

The memory is the project's persistent brain. It must be updated in these situations:

### Where to write

The memory is structured in specialized files in `memory/cortex/`. Write in the correct file:

| Situation | Cortex file |
|-----------|-------------|
| Architectural decision made | `cortex/architecture.md` |
| Code pattern that works well | `cortex/patterns.md` |
| Recurring bug resolved | `cortex/bugs.md` |
| Backend learning (API, DB) | `cortex/backend.md` |
| Frontend learning (UI, JS, CSS) | `cortex/frontend.md` |
| Business learning | `cortex/business.md` |
| End of sprint | `cortex/sprints.md` |

After adding, update the entry counter and living summary in `MEMORY.md`.

### Memory entry format

Each entry is concise and actionable:

```markdown
### [Date] — [Short title]

**Context**: Why this entry exists.
**Decision**: What was decided or discovered.
**Consequence**: What this implies going forward.
```

### Memory rules

- Keep each entry under 5 lines — if it's longer, it's documentation, not memory
- Always date entries
- Write in the cortex file corresponding to the domain, not in MEMORY.md

### Memory consolidation — end-of-sprint procedure

The memory grows each sprint. Without maintenance, it becomes noise. At each end of sprint, perform this consolidation:

#### 1. Clean up

For each file in `cortex/`:

- **Delete** entries that are no longer true (reversed decision, deleted code, permanently fixed bug)
- **Merge** redundant entries (two entries saying the same thing -> one, more precise)
- **Archive** entries that are no longer useful day-to-day but worth keeping (move them to an `## Archive` section at the bottom of the file)

#### 2. Check size

Each cortex file should stay under **50 entries**. Beyond that, it's a sign that:
- Entries have become documentation (-> move them to the code or a README)
- Entries are obsolete (-> delete or archive them)
- The file covers too many domains (-> split it into two cortex files)

#### 3. Update the summary

After consolidation:
- Update the counter in `MEMORY.md`
- Update the **living summary** (3-5 lines describing the current project state)
- Add the sprint to `cortex/sprints.md`

#### 4. Validate with the human

Consolidation is proposed by the agent, validated by the human. Memory is never deleted without approval.

---

## Writing issues

### Feature issue (issue-feature.md)

For complex, multi-file features:

- **Context**: why the issue exists — not just "we need to do X", but "because Y"
- **Proposed solution**: concrete description, not vague
- **Checklist**: precise tasks with affected files, grouped by domain
- **Affected files**: all impacted files, listed explicitly

### Task issue (issue-task.md)

For micro-tasks (XS/S):

- **What to do**: one or two sentences max
- **Affected files**: the file(s) to touch
- **Done criterion**: how we know it's finished

### Common rules

- The issue title starts with an action verb: "Add", "Fix", "Refactor"
- The ID follows the format ISS-XXXX (sequential numbering)
- The `Depends` field is filled if the issue depends on another
- The skill to invoke is always specified

---

## Checklist before considering documentation complete

- [ ] All new or modified public functions have PHPDoc/JSDoc
- [ ] Non-obvious decisions are commented (the why, not the what)
- [ ] The memory is updated if a learning occurred
- [ ] Issues are written with context, solution, and checklist
- [ ] New modules have a minimal README

---

*This skill is immediately operational. An agent that loads it can document code, write issues, and update the memory without further interpretation.*
