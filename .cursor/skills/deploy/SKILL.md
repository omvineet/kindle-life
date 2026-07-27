---
name: deploy
description: >-
  Owns Seeker deployment end-to-end: stage and commit local changes, push to
  GitHub, trigger a Vercel build, ensure Prisma migrations run during that build,
  verify deploy success, and report. Use when asked to deploy, ship, release,
  push for deploy, trigger a Vercel build, verify production/preview health, or
  roll back. Main agents must hand off these tasks to a deployment-expert Task
  subagent that follows this skill.
disable-model-invocation: true
---

# Seeker Deploy Subagent

You own **all deployment work** for this repo. Do not write product features; only ship, verify, diagnose, or roll back deploys.

**A deploy request means you must actually ship:** commit local work → push to GitHub → wait for a **new** Vercel deployment for that commit → confirm migrations ran in that build → health-check → report. Do not stop early because origin already matched an older SHA.

Read `docs/runbooks/deploy.md` if something fails or architecture context is needed.

## Project facts

| Item | Value |
|------|--------|
| GitHub | `omvineet/kindle-life` |
| Vercel project | `kindle-life` (`prj_Hf9rhgqnWGoOdZvAEj38rAHgovQm`) |
| Vercel team | `seva2` (`team_xiWuV5i8f1pnvdEhxOPYB9FP`) |
| Production URL | `https://kindle-life.vercel.app` |
| Health | `GET /api/health` → expect `{"ok":true,"db":true}` |
| Build command | `pnpm db:deploy && pnpm build` (in `vercel.json`) |

Neon injects `DATABASE_URL` via the Vercel Marketplace integration. Migrations run **on Vercel during build** (`prisma migrate deploy`), not by the agent against production.

## When to run

Triggers: deploy, ship, release, push to trigger Vercel, verify deploy/health, inspect failed deploy, rollback.

Out of scope: inventing migrations, editing applied migration history, manually setting Preview `DATABASE_URL`, committing secrets.

## Checklist

```
Deploy progress:
- [ ] 1. Preflight
- [ ] 2. Migrations ready
- [ ] 3. Commit local changes
- [ ] 4. Push to GitHub (sync origin)
- [ ] 5. Confirm new Vercel build + migrations
- [ ] 6. Verify health
- [ ] 7. Report
```

### 1. Preflight

- Confirm target: current branch → preview; `main` → production (default when on `main`).
- Run in parallel: `git status -sb`, `git diff` / `git diff --stat`, `git log -5 --oneline`, check tracking vs `origin`.
- If shipping app/API changes and gates were not run recently, run `pnpm lint && pnpm typecheck && pnpm test` (and `pnpm test:e2e` if pages/APIs changed). Do not weaken CI.
- Never update git config. Never force-push `main`. Never `--no-verify` unless the user explicitly requests it.

### 2. Migrations ready

Schema changes must already exist as Prisma migration files under `prisma/migrations/` (created via `pnpm db:migrate` during feature work).

Before commit/push:

- If `prisma/schema.prisma` changed but no new migration folder exists → **stop**. Ask the parent/user to create a migration first. Never invent SQL by hand against Neon.
- Never edit or delete an already-applied migration.
- Do **not** run `pnpm db:deploy` against production/Neon from the agent. Vercel’s build runs it.

### 3. Commit local changes

When the user asked to **deploy / ship / release**, you **are** authorized to commit. Stage and commit all shippable local changes on the current branch so push can trigger a real Vercel build.

1. `git status` / `git diff` / `git log` (follow the repo’s commit-message style).
2. Stage relevant files. **Never** stage secrets: `.env`, `.env.*`, credentials, private keys. Warn and exclude them if present.
3. Exclude junk: `.next/`, `node_modules/`, local-only noise. Prefer intentional paths over `git add -A` when status is messy.
4. Commit with a HEREDOC message focused on why:

```bash
git commit -m "$(cat <<'EOF'
Short why-focused message.

EOF
)"
```

5. If there is truly nothing to commit and the branch is already synced, still proceed to verify whether origin tip already has a **READY** Vercel deploy for that SHA; if yes, report that and re-verify health. If local is ahead or you just committed, you **must** push (step 4).
6. If commit fails due to a hook, fix the issue and create a **new** commit (do not amend unless amend rules in user git protocol are fully met).

### 4. Push to GitHub (sync origin)

Git push is the deploy trigger — prefer it over `vercel deploy`.

```bash
git push -u origin HEAD
```

- This syncs local branch with `origin` (e.g. local `main` → `origin/main`).
- Feature branch → preview deployment.
- `main` → production.
- After push, confirm `git status -sb` shows in sync with origin (not “ahead”).
- Open/update a PR with `gh` only when the user asked for a PR path or you are not on `main`.

If git push does not create a deployment within a few minutes, diagnose (GitHub↔Vercel connection). Only use `vercel deploy` / `vercel --prod` if git deploy is broken and you document why.

### 5. Confirm new Vercel build + migrations

Wait for a deployment whose metadata matches the **commit you just pushed** (not an older READY deploy).

- Prefer Vercel MCP: `list_deployments` / `get_deployment` / `get_deployment_build_logs` with project + team IDs above.
- Or poll GitHub deployment / check status for that SHA.

Confirm build logs show:

1. `pnpm db:deploy` / `prisma migrate deploy` succeeded — either applied pending migrations or reported none pending / already applied.
2. `pnpm build` / Next.js build succeeded.
3. Deployment state `READY` for the intended target (preview or production).

If build fails on `DATABASE_URL` / Prisma P1012 → Neon integration / env is broken; follow `docs/runbooks/deploy.md`. Do not paste connection strings into chat.

If the deployment errors, fix forward if it’s a deploy-config issue you own; otherwise report failure clearly — do not claim success.

### 6. Verify health

```bash
# Production
curl -sS https://kindle-life.vercel.app/api/health
# Preview: use the deployment URL from Vercel/PR
curl -sS https://<deployment-url>/api/health
```

Expect HTTP 200 and `{"ok":true,"db":true}`.

If `db: false` or 503: check build logs for migrate failures, then Neon/`DATABASE_URL` per runbook. For auth-gated preview URLs, use Vercel MCP `web_fetch_vercel_url` / `get_access_to_vercel_url`.

### 7. Report

Return a short status to the parent agent / user:

- What was committed (summary) and commit SHA
- Branch pushed and that origin is synced
- Vercel deployment URL + id + state (`READY` / failed) for **this** commit
- Migration outcome from build logs (applied X / none pending)
- Health check body
- Next action if anything failed

## Rollback

Only when the user asks:

- App: promote previous production deployment (Vercel dashboard / CLI `vercel rollback`).
- DB: forward-only — new migration that reverses the change; never delete applied migrations.

## Anti-patterns

- Skipping commit/push because “production already looks healthy” while local changes remain uncommitted.
- Reporting an older deployment as the result of this deploy request.
- Deploying via ad-hoc `vercel --prod` when a git push would suffice.
- Applying migrations to Neon from the laptop for “prod”.
- Manually adding Preview `DATABASE_URL` (overrides branch DB; data-safety risk).
- Committing `.env` / secrets.
- Shipping without confirming health when the task was “deploy”.
