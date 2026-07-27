# Runbook: Deploy

## Architecture

- **Vercel** hosts the app. Preview deploy per PR; production deploy on merge to `main`.
- **Neon** hosts Postgres, with **preview branching enabled**: every PR preview gets its own copy-on-write database branch, isolated from production. `vercel.json` runs `pnpm db:deploy` (Prisma `migrate deploy`) before `pnpm build` on every deploy — this is safe precisely because each preview migrates its own branch, never the production database.
- **GitHub Actions** is the quality gate (lint/typecheck/unit/e2e). Its e2e job runs against a throwaway Postgres container, not Neon — never touches real data.
- Vercel deploys independently of CI; branch protection on `main` should require the CI checks so nothing unverified merges.

This project stores real user data, so production and preview must be **fully isolated at the database level**, not just at the app level. A schema change or a bad test run in a PR must never be able to touch production rows.

## One-time setup (human, ~10 minutes)

1. **Vercel**: https://vercel.com/new → import the `omvineet/kindle-life` GitHub repo. Framework auto-detects Next.js; `vercel.json` supplies build/install commands.
2. **Neon via Vercel Marketplace** (not manual paste): Vercel project → **Storage** → add **Neon** → connect it to this project for Development, Preview, and Production.
   - In the integration's settings, enable **"Automatically create a branch for each preview deployment"** (preview branching). This is the step that makes real user data safe — without it, Preview and Production share one database.
   - The integration injects `DATABASE_URL` per environment automatically. **Do not** manually add a `DATABASE_URL` env var for Preview — a manually-set value overrides the per-branch one the integration injects and silently reintroduces the shared-database risk.
3. **Vercel Blob** (object storage): public store `seeker` is provisioned and linked (injects `BLOB_READ_WRITE_TOKEN`). Full model and agent ops: `docs/runbooks/storage.md`. Recreate only if missing: `pnpm dlx vercel@latest blob create-store seeker --access public --yes`.
4. **GitHub branch protection**: Settings → Branches → protect `main`, require the `Lint, typecheck, unit tests` and `E2E (Playwright)` checks.
5. **Neon branch cleanup** (see below): create a Neon API key (Neon Console → Account Settings → API Keys) and add it to the repo as secret `NEON_API_KEY`; add the Neon project ID (Neon Console → Project Settings) as repo variable `NEON_PROJECT_ID`. GitHub → Settings → Secrets and variables → Actions.
6. Optional: enable Cursor Cloud Agents / Automations for this repo (see `docs/automations.md`).

After this, no manual deploy steps exist.

## Preview branch cleanup

The Vercel↔Neon integration's built-in cleanup is **not** immediate — it only deletes a branch when Vercel deletes the underlying deployment, and Vercel keeps preview deployments for 180 days by default (some deployments are exempt from retention limits entirely and never get cleaned up that way). Relying on that alone means stale branches — and their storage cost — accumulate indefinitely.

`.github/workflows/neon-branch-cleanup.yml` fixes this: it runs on every `pull_request: closed` event (covers both merged and closed-without-merging) and deletes the corresponding Neon branch immediately via the Neon API, regardless of what Vercel does with the deployment. This is the actual cleanup mechanism — treat the integration's own retention-based cleanup as a no-op backstop, not the plan.

One consequence: once a PR closes, its preview URL's database calls will start failing (branch is gone). That's expected and fine — the PR is closed.

## Data safety notes

- **Preview branches are disposable and are deleted on PR close** by the cleanup workflow above, not left to accumulate. Migrations, seed scripts, and e2e writes in a preview can never leak into production data.
- **No point-in-time restore / branch versioning is configured, by design.** We stay on Neon Free's default (6-hour history window, no Instant Restore). This project doesn't need it — don't upgrade plans or enable extra retention for this.
- **Migrations are forward-only in production.** Never edit an applied migration or the database by hand (see `AGENTS.md`); fix forward with a new migration.

## Everyday flow

1. Push a branch, open a PR.
2. CI runs; Vercel builds a preview (URL appears on the PR).
3. Merge when green → Vercel deploys production and applies migrations.
4. Verify: `curl https://<production-domain>/api/health` → expect `{"ok":true,"db":true}`.

## Running e2e against a deployment

```bash
E2E_BASE_URL=https://<preview-or-prod-url> pnpm test:e2e
```

## Rollback

- App: Vercel dashboard → Deployments → promote the previous production deployment (or `vercel rollback` with the CLI).
- Database: migrations are forward-only. To undo a schema change, create a new migration that reverses it (`pnpm db:migrate`); never delete applied migrations.

## Local database

```bash
docker compose up -d     # starts Postgres 16 on localhost:5432
cp .env.example .env     # DATABASE_URL for local dev
pnpm db:deploy           # apply migrations
```
