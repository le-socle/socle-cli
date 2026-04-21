---
name: deployment
description: Prepare, execute, and validate a deployment — pre-flight checks, release procedure, post-deploy verification. Use before production releases, when setting up CI/CD, after a critical fix that must ship quickly, or to document the deployment procedure for a new project.
---

# Skill — Deployment

*This skill defines how to prepare, execute, and validate a deployment. An agent loaded with this skill knows what to check before deploying, how to do it, and how to confirm everything works.*

---

## When to invoke this skill

- Before each production release
- When setting up a CI/CD pipeline
- After a critical fix that needs to ship quickly
- To document the deployment procedure for a new project

---

## Procedure

### 1. Pre-deployment — Checklist

Before any deployment, verify each point:

#### Code

- [ ] All tests pass (unit + E2E)
- [ ] The branch is up to date with the main branch
- [ ] No merge conflicts
- [ ] No forgotten `TODO` or temporary code
- [ ] No hardcoded secrets (API keys, passwords, tokens)

#### Dependencies

- [ ] Dependencies are locked (lock file up to date)
- [ ] No dependency added without justification in the issue
- [ ] Production versions are consistent with development

#### Configuration

- [ ] Production environment variables are set
- [ ] URLs, ports, and paths point to production (not dev)
- [ ] Database migrations are ready and reversible

#### Review

- [ ] The PR has been reviewed (code-review skill)
- [ ] The issue's done criteria are met
- [ ] The human has approved the deployment

### 2. Deployment — Execution

The deployment follows the pipeline defined by the project. Common formats:

#### Via CI/CD (recommended)

```bash
# Merging to the production branch triggers the pipeline
git checkout main
git merge --no-ff feat/ISS-XXXX-slug
git push origin main
# -> CI/CD takes over (build, test, deploy)
```

#### Via manual command

```bash
# 1. Build
npm run build          # or python -m build, cargo build --release, etc.

# 2. Production test
npm run test:prod      # tests on the production build

# 3. Deploy
npm run deploy         # or rsync, scp, docker push, kubectl apply, etc.
```

#### Rollback — always plan for it

Before deploying, make sure a rollback is possible:

```bash
# Identify the current version in production
git log --oneline -1 origin/production

# In case of a problem
git revert HEAD
git push origin main
# or: redeploy the previous tag
```

### 3. Post-deployment — Validation

After deployment, verify everything works:

- [ ] The application responds (health check, home page)
- [ ] Critical features work (manual test or automated smoke test)
- [ ] Logs show no errors
- [ ] Metrics are normal (response time, error rate)
- [ ] Database migrations were applied correctly

### 3.5. Observability — monitor what you deployed

Checking logs once is not monitoring. Set up observability before deploying to production:

#### What to monitor

| Signal | What to watch | Tools |
|--------|--------------|-------|
| **Errors** | Error rate, new error types, error spikes | Sentry, Datadog, CloudWatch |
| **Latency** | P50, P95, P99 response times | Grafana, Datadog, New Relic |
| **Traffic** | Request rate, unusual patterns | Any APM tool |
| **Saturation** | CPU, memory, disk, DB connections | Infrastructure monitoring |

#### Alerting rules

- Alert on **symptoms** (high error rate, slow responses), not causes (high CPU)
- Every alert must be actionable — if no one needs to act, it is noise
- Set thresholds based on baselines, not arbitrary numbers
- Critical alerts go to on-call. Warnings go to a channel. Info goes to a dashboard.

#### SLOs (Service Level Objectives)

Define what "healthy" means for your service:

- **Availability**: 99.9% uptime = ~8.7 hours of downtime per year
- **Latency**: 95% of requests under 200ms
- **Error rate**: < 0.1% of requests return 5xx

SLOs are not aspirational — they are promises. Measure them. When you burn through your error budget, stop shipping features and fix reliability.

### 4. Documentation

After a successful deployment:

- Update the issue for the post-deploy state:
  - move to `4-review` if validation still has to happen
  - or run `lyt close ISS-XXXX` if deployment is the explicit validation step and the issue can now go to `5-done`
- Update the BOARD.md
- If a problem was encountered and resolved -> add it to `cortex/bugs.md`
- If a deployment procedure changed -> update this skill or the project notes

---

## Deployment strategies

| Strategy | When to use | Risk |
|----------|------------|------|
| **Direct** (push to prod) | Small projects, solo team | High — no safety net |
| **Blue-green** | Critical applications | Low — instant rollback |
| **Canary** | Many users | Low — progressive exposure |
| **Feature flags** | Risky features | Low — enable/disable without redeploying |

For most projects using Lytos, the **CI/CD with merge to main** strategy is sufficient.

---

## Database migrations

Migrations are the riskiest part of most deployments. Rules:

### Every migration must be backward-compatible

The new code and the old code must both work with the new schema. This enables zero-downtime deployment and safe rollback.

**The expand/contract pattern:**

1. **Expand** — add the new column/table (nullable or with default). Deploy new code that writes to both old and new.
2. **Migrate** — backfill data from old to new.
3. **Contract** — remove the old column/table. Deploy code that only uses new.

Each step is a separate deployment. Never do all three at once.

### Migration checklist

- [ ] Migration is backward-compatible (old code still works)
- [ ] Migration has a rollback (down migration)
- [ ] Large tables: migration does not lock the table (use online DDL tools)
- [ ] Migration is tested on a copy of production data (not just empty dev DB)
- [ ] Data backfill runs in batches, not one giant query

---

## Secrets management

- **Never** hardcode secrets in code or config files committed to git
- Use environment variables for simple projects
- Use a secret manager for production (Vault, AWS Secrets Manager, GCP Secret Manager, Doppler)
- `.env` files are for local development only — always in `.gitignore`
- Rotate secrets on a schedule and after any suspected compromise
- Different secrets per environment (dev ≠ staging ≠ production)
- Audit who has access to production secrets — principle of least privilege

---

## Environments

| Environment | Usage | Who deploys |
|-------------|-------|-------------|
| `local` | Development | The agent or developer |
| `staging` | Pre-production testing | CI/CD automatic on merge to `dev` or `staging` |
| `production` | End users | CI/CD automatic on merge to `main` (after human validation) |

---

## Incident response

When a deployment goes wrong and rollback is not enough:

### Immediate actions (first 15 minutes)

1. **Assess impact** — how many users affected? Is data being corrupted?
2. **Communicate** — notify the team. If user-facing, update the status page.
3. **Mitigate** — rollback, feature flag off, redirect traffic, scale down
4. **Do not debug in production** — reproduce locally with production logs

### After resolution

1. **Write a post-mortem** (blameless) — what happened, timeline, root cause, what we'll fix
2. **Add the root cause to memory** — `cortex/bugs.md`
3. **Create issues** for follow-up actions
4. **Update the deployment checklist** if a check would have caught it

---

## Final checklist

- [ ] Pre-deployment verified (code, dependencies, config, review)
- [ ] Rollback prepared
- [ ] Deployment executed
- [ ] Post-deployment validated (health check, features, logs)
- [ ] Issue and BOARD.md updated
- [ ] Memory enriched if learning occurred

---

*This skill is immediately operational. An agent that loads it can prepare and validate a deployment without further interpretation.*
