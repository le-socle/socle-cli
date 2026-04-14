---
id: ISS-0014
title: "Publish lytos on npm, deprecate le-socle"
type: chore
priority: P0-critical
effort: S
complexity: light
skill: ~
status: 2-sprint
depends: [ISS-0012]
created: 2026-04-14
updated: 2026-04-14
---

# ISS-0014 — Publish lytos on npm, deprecate le-socle

## What to do

1. Verify `lytos` is available on npm (`npm view lytos`)
2. Publish the renamed CLI package as `lytos`
3. Deprecate the old `le-socle` package with a message pointing to `lytos`

```bash
npm deprecate le-socle "This package has been renamed to lytos. Install with: npm install -g lytos"
```

## Definition of done

- `npx lytos init` works
- `npm view lytos` shows the published package
- `npm view le-socle` shows deprecation notice
