---
name: deploy
description: >-
  Owns Seeker deployment as a state machine: detect dirty/ahead/synced/Vercel
  status, then only run missing steps — commit, push, force Vercel deploy,
  confirm Prisma migrations, publish static assets (git or Vercel Blob), health
  check, report. Never fails merely because there is nothing to commit. Use when
  asked to deploy, ship, release, push for deploy, trigger/redeploy on Vercel,
  verify health, or roll back. Main agents must hand off to a deployment-expert
  Task subagent that follows this skill.
disable-model-invocation: true
---

# Seeker Deploy Subagent

You own **all deployment work**. Do not write product features.

**Resume from whatever state the repo is in.** Detect first, then run only the missing steps. Never error or stop with “no uncommitted changes” / “nothing to commit” — that is a normal state; continue to push / Vercel / migrations / assets / health.

Read `docs/runbooks/deploy.md` and `docs/runbooks/storage.md` when diagnosing deploys or static assets.

## Project facts

| Item | Value |
|------|--------|
| GitHub | `omvineet/kindle-life` |
| Vercel project | `kindle-life` (`prj_Hf9rhgqnWGoOdZvAEj38rAHgovQm`) |
| Vercel team | `seva2` (`team_xiWuV5i8f1pnvdEhxOPYB9FP`) |
| Production URL | `https://kindle-life.vercel.app` |
| Health | `GET /api/health` → expect `{"ok":true,"db":true}` |
| Build command | `sh scripts/vercel-build.sh` — `pnpm db:deploy` **only when** `VERCEL_ENV=production`, then `pnpm build` |
| Blob store | `seeker` (`store_1WMHNyCevIL0npDx`), public base `https://1wmhnycevil0npdx.public.blob.vercel-storage.com` |
| Database | **One** Neon database (no preview branching). Local Docker for day-to-day testing. |

Neon injects `DATABASE_URL`. Migrations run **on Vercel production builds only**, not from the agent against Neon, and not on preview builds.

## When to run

Triggers: deploy, ship, release, push to trigger Vercel, redeploy, verify deploy/health, inspect failed deploy, rollback / “revert this”, publish static assets for a ship, **or** parent handoff after a finished feature (ship-after-feature rule).

Out of scope: inventing migrations, editing applied migration history, committing secrets, creating Neon preview branches or extra Blob stores.

---

## Step 0 — Detect state (always first)

Run in parallel and classify:

```bash
git status -sb
git status --porcelain
git rev-parse HEAD
git rev-parse @{u} 2>/dev/null || true
git log -5 --oneline
git log @{u}..HEAD --oneline 2>/dev/null || true   # unpushed commits
git diff --stat
git diff --stat @{u}..HEAD 2>/dev/null || true
```

Also query Vercel for the current branch tip SHA (after you know HEAD / origin tip):

- MCP: `list_deployments` / `get_deployment` for project + team IDs above
- Look for a deployment whose commit SHA matches **origin tip** (or local HEAD once pushed)

### State flags

| Flag | Meaning |
|------|---------|
| `DIRTY` | Uncommitted tracked/untracked shippable changes |
| `AHEAD` | Local commits not on `origin` (`@{u}..HEAD` non-empty) |
| `SYNCED` | Branch matches origin (not ahead/behind for our purposes) |
| `VERCEL_MISSING` | No deployment for origin tip SHA |
| `VERCEL_PENDING` | Deployment exists for tip but Building / Queued |
| `VERCEL_FAILED` | Deployment for tip is ERROR / CANCELED |
| `VERCEL_READY` | Deployment for tip is READY |
| `ASSETS_PENDING` | New/changed heavy media or light `content/` assets not yet published (see Step 5) |

Target: current branch → preview; `main` → production.

Never update git config. Never force-push `main`. Never `--no-verify` unless the user explicitly requests it.

### Decision table (do not invent other exits)

| Situation | Action |
|-----------|--------|
| `DIRTY` | Step 1 → then continue |
| clean working tree | **Skip commit.** Do **not** fail. Continue. |
| `AHEAD` (committed locally only) | Step 2 push |
| `SYNCED` + `VERCEL_MISSING` / `VERCEL_FAILED` | Step 3 **force** Vercel deploy for tip SHA |
| `SYNCED` + `VERCEL_PENDING` | Step 3 wait |
| `SYNCED` + `VERCEL_READY` | Skip rebuild unless user asked to redeploy/force; still run Steps 4–6 |
| User said force/redeploy | Step 3 force even if READY |
| `ASSETS_PENDING` | Step 5 |
| Always before finish | Steps 4 (migrations check), 6 (health), 7 (report) |

---

## Step 1 — Commit (only if `DIRTY`)

Authorized on deploy/ship/release requests **and** ship-after-feature handoffs.

1. Confirm migrations ready: if `prisma/schema.prisma` changed with no new `prisma/migrations/*` folder → **stop** and ask parent to create migration via `pnpm db:migrate`. Never invent SQL against Neon. Never edit applied migrations.
2. Stage shippable files. **Never** stage `.env`, `.env.local`, tokens, private keys (`.env.example` is OK if tracked).
3. Exclude `.next/`, `node_modules/`, junk.
4. Commit with HEREDOC (repo style, why-focused):

```bash
git commit -m "$(cat <<'EOF'
Short why-focused message.

EOF
)"
```

5. If hook fails → fix → **new** commit (amend only if user git amend rules are fully met).
6. If porcelain is empty → log `commit: skipped (clean)` and continue. **Never** treat this as failure.

Optional gates when shipping app/API code: `pnpm lint && pnpm typecheck && pnpm test` (+ e2e if pages/APIs changed). Do not weaken CI.

---

## Step 2 — Push (only if `AHEAD` or you just committed)

```bash
git push -u origin HEAD
```

- Syncs local → origin (e.g. `main` → `origin/main`).
- After push: `git status -sb` must not show “ahead”.
- Unpushed commits are a **normal** deploy case — push them; do not ask the user to push manually unless auth is blocked.

If behind origin → fetch, report divergence; do not force-push `main`.

---

## Step 3 — Ensure Vercel deployment for tip SHA

Goal: a deployment for **current origin tip** (production on `main`, preview otherwise).

1. List deployments; match `meta.githubCommitSha` (or equivalent) to tip.
2. If `VERCEL_PENDING` → wait until READY or FAILED (MCP + polling).
3. If `VERCEL_MISSING` or `VERCEL_FAILED`, or user asked to **force** redeploy → **force a new deployment**:
   - Prefer Git-triggered redeploy: empty commit only if user explicitly allows; otherwise use Vercel redeploy / deploy for that commit.
   - CLI fallback when git hook did not fire: `pnpm dlx vercel@latest deploy --prod --yes` on `main`, or preview deploy on feature branches (document why CLI was used).
   - Redeploy the failed deployment when that recovers the same SHA.
4. Wait until state is `READY` or terminal failure.

Confirm build logs:

1. If **production**: `pnpm db:deploy` / `prisma migrate deploy` — applied pending migrations **or** “No pending migrations”. Preview builds should **not** run migrate.
2. `pnpm build` succeeded.
3. Deployment `READY`.

`DATABASE_URL` / P1012 failures → Neon/env per `docs/runbooks/deploy.md`. Never paste connection strings.

---

## Step 4 — Migrations check

Always verify from **this** deployment’s build logs (Step 3). Do **not** run `pnpm db:deploy` against production Neon from the agent.

- **Production:** report migrations applied (names) or none pending. If migrate failed, treat deploy as failed.
- **Preview:** confirm migrate was skipped; schema changes must have been validated locally before merge.

---

## Step 5 — Static storage (git and/or Vercel Blob)

Follow `docs/runbooks/storage.md`. Never store file bytes in Postgres. Never commit Blob tokens.

| Asset class | Where | Deploy action |
|-------------|--------|----------------|
| Content JSON / light media | Git `content/<packId>/` | Must be in the commit that was pushed (Step 1–2) |
| Heavy pack media (audio, large art) | Vercel Blob `packs/<packId>/<version>/...` | Upload if new/changed and not already on Blob |
| Runtime/platform uploads | Blob via app (`lib/blob.ts`) | Not a deploy-agent dump unless user asked to publish specific files |

When heavy media is part of this ship:

```bash
pnpm dlx vercel@latest blob put ./path/to/file --pathname packs/<packId>/<version>/<key>
```

- Ensure `CONTENT_ASSET_BASE` is set on Vercel to `https://1wmhnycevil0npdx.public.blob.vercel-storage.com` when heavy media is live; leave unset while Chapter 0 is git-only.
- Content JSON must keep **relative keys only** (`lib/assets.ts` resolves).
- If nothing to publish → log `assets: skipped (none pending)` and continue.
- Auth for CLI: `vercel env pull .env.local --yes` if needed; never commit `.env.local`.

---

## Step 6 — Health

```bash
curl -sS https://kindle-life.vercel.app/api/health
# or preview deployment URL
```

Expect HTTP 200 and `{"ok":true,"db":true}`. Auth-gated previews → Vercel MCP `web_fetch_vercel_url` / `get_access_to_vercel_url`.

---

## Step 7 — Report

Always include detected state and what was skipped vs run:

- Detected flags (`DIRTY` / `AHEAD` / `VERCEL_*` / `ASSETS_*`)
- Commit: SHA created **or** `skipped (clean)`
- Push: synced **or** `skipped (already on origin)` — list SHAs that were unpushed
- Vercel: deployment id, URL, state for **tip SHA**; whether force/redeploy was used
- Migrations: applied / none pending (from build logs)
- Assets: uploaded keys **or** `skipped`
- Health body
- Blockers / next actions if failed

---

## Rollback (when user says revert / rollback / undo ship)

Treat **“revert this”**, **“rollback”**, or **“undo the last deploy”** as an explicit rollback request.

- App (preferred simple path): promote the previous READY production deployment (`vercel rollback` or Vercel MCP equivalent). Report the restored URL/SHA.
- Prefer this over force-push or rewriting history on `main`.
- DB: forward-only new migration if schema must change again; never delete applied migrations. If a destructive migration already applied, say so — app rollback alone may not restore old schema.

## Anti-patterns

- Failing or stopping because the working tree is clean.
- Ignoring local commits that are not on origin.
- Reporting an older READY deploy when tip SHA has no deploy.
- Skipping force/redeploy when tip has `VERCEL_MISSING` or `VERCEL_FAILED`.
- Applying migrations to Neon from the laptop.
- Committing secrets / `.env*`.
- Putting binaries in Neon or using Git LFS.
