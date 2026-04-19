---
id: ISS-0027
title: Launch readiness — fix CI badge, screenshots, demo, discussions
type: chore
priority: P0-critical
effort: M
complexity: standard
skill: documentation
status: 5-done
branch: chore/ISS-0027-launch-readiness
depends: [ISS-0037]
created: 2026-04-15
updated: 2026-04-19
---
# ISS-0027 — Launch readiness — fix CI badge, screenshots, demo, discussions

## Context

Before pushing Lytos to Hacker News, Product Hunt, Reddit, and dev communities, several quick wins are needed to make the first impression credible. A "failing" CI badge and a text-only README will hurt adoption.

## Audit note — 2026-04-19

Reopened after lead-dev audit.

- README screenshots and demo assets are now present, so the issue moved forward materially.
- The issue was archived too early relative to its own checklist and done criteria.
- Direct repo evidence still missing: star-history badge, Show HN draft, X/Twitter thread draft.
- External deliverables such as GitHub Discussions are not traceable from the repository state, so the issue should stay open until launch evidence is centralized.

## Checklist (sequential)

1. [ ] Fix CI pipeline — the badge on npm shows "failing". Investigate and fix
2. [ ] Add `lyt board` screenshot to README.md (the colorful terminal output is the wow factor)
3. [ ] Add `lyt lint` screenshot to README.md (shows the validation in action)
4. [ ] Enable GitHub Discussions on lytos-method and lytos-cli repos
5. [ ] Add star history badge to README.md (social proof)
6. [ ] Create a 30-second demo GIF: `lyt init` → `lyt board` → `lyt lint` (for HN/PH/Reddit)
7. [ ] Prepare a real example project (a small app built with Lytos, showing .lytos/ with real issues and memory)
8. [ ] Update lytos.org homepage — add screenshot/GIF above the fold
9. [ ] Write the Show HN post draft
10. [ ] Write the X/Twitter thread draft

## Diffusion strategy (for reference)

### Phase 1 — Launch (week 1-2)
- Show HN: "Lytos — a method to give AI agents persistent context instead of personas"
- Product Hunt launch with demo GIF
- X/Twitter thread from @fred

### Phase 2 — Organic (month 1-2)
- Reddit: r/LocalLLaMA (sovereignty), r/ChatGPTCoding (productivity), r/ClaudeAI (adoption)
- Dev.to / Hashnode articles
- YouTube Shorts / 2-min demo

### Phase 3 — Community (month 2-4)
- Claude Code Discord, Cursor community
- Dev newsletters (Console.dev, TLDR Tech, Pointer)
- GitHub Trending push (coordinated HN + Reddit same day)

## Key angles for messaging

- **Anti-persona**: "Stop dressing your AI in a costume"
- **Sovereignty**: "Your context belongs to you, not a vendor"
- **Pain point**: "Your AI forgets everything. Lytos fixes that."
- **Analogy**: "Kubernetes for AI agents"

## Definition of done

- CI badge shows "passing" on npm and GitHub
- README has visual screenshots of lyt board and lyt lint
- GitHub Discussions enabled
- Demo GIF created and embedded in homepage
- Show HN and X thread drafts ready to publish
