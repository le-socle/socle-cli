# Sprint #02 — Rename socle → lytos

> **Objective**: Rename all references from "socle" / "Le Socle" to "lytos" / "Lytos" across all repos, publish new npm package, configure domains.
> **Start**: 2026-04-14
> **Target end**: 2026-04-20

---

## Tasks

| Issue | Title | Effort | Depends | Status |
|-------|-------|--------|---------|--------|
| ISS-0011 | Replace all socle references in method repo (lytos-method) | L | — | sprint |
| ISS-0012 | Replace all socle references in CLI repo (lytos-cli) | L | — | sprint |
| ISS-0013 | Replace all socle references in website repo | M | — | sprint |
| ISS-0014 | Publish lytos on npm, deprecate le-socle | S | ISS-0012 | sprint |
| ISS-0015 | Configure lytos.org and lytos.dev domains | S | — | sprint |

---

## Dependency graph

```
ISS-0011 (method repo)  ──┐
ISS-0012 (CLI repo)    ───┼── ISS-0014 (npm publish)
ISS-0013 (website)     ──┘
ISS-0015 (domains)     ── independent
```

---

## Previous sprints

### Sprint #01 — CLI MVP (2026-04-13 → 2026-04-13) ✅
ISS-0001 → ISS-0007: Setup, init, board, tests, CI, npm publish.
