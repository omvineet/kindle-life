<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — How to work on this repo

Seeker: an interactive adventure game teaching spiritual principles (based on "Kindle Life" by Swami Chinmayananda) for ages 12–15. Read `docs/VISION.md` and `docs/ARCHITECTURE.md` before making product decisions.

## Current phase

**Phase 1: environment only.** Do NOT build game engine modules, content packs, auth, or dashboards unless explicitly asked. Phase 2 (game engine + content) has not started.

## Stack

Next.js (App Router, TypeScript, Tailwind) at repo root · Neon Postgres via Prisma · Vercel Blob (static/object storage) · Vercel hosting · Vitest unit tests · Playwright e2e · GitHub Actions CI · pnpm.

## Commands

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev server | `pnpm dev` (http://localhost:3000) |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| E2E tests (local) | `pnpm test:e2e` (starts dev server automatically) |
| E2E against a deployed URL | `E2E_BASE_URL=https://... pnpm test:e2e` |
| Prisma generate | `pnpm db:generate` |
| Create/apply dev migration | `pnpm db:migrate` |
| Apply migrations (CI/deploy) | `pnpm db:deploy` |
| Prisma Studio | `pnpm db:studio` |

## Environment variables

- `DATABASE_URL` — Neon Postgres connection string. Local: put in `.env` (gitignored). CI: GitHub secret. Deploys: Vercel env var.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob read/write token (store `seeker`). Local: `pnpm dlx vercel@latest env pull .env.local --yes`. Deploys: injected when the store is linked.
- `CONTENT_ASSET_BASE` — optional public Blob/CDN base for heavy pack media; see `docs/runbooks/storage.md`.
- Never commit secrets. `.env*` files are gitignored; keep it that way.

## Definition of Done (every change)

1. `pnpm lint && pnpm typecheck && pnpm test` pass locally.
2. If the change affects pages/APIs, `pnpm test:e2e` passes locally.
3. Schema changes ship with a Prisma migration (`pnpm db:migrate`), never by editing the DB directly.
4. CI must be green before merge. Never weaken or skip CI checks to make a failure pass.
5. **Ship by default:** after a finished feature/fix, commit + auto-deploy to production (`main`) via the deploy subagent. User checks the live site. Pause and ask only for risky/hard-to-rollback migrations. See `.cursor/rules/ship-after-feature.mdc`.
6. **Simple revert:** say “revert this” / “rollback” → previous production deployment (app). DB is forward-only.

## Deploy flow (no manual steps after setup)

- Default: push to `main` → Vercel production runs `pnpm db:deploy` then build.
- Verify production health: `GET /api/health` should return `{"ok":true,"db":true}`.
- App rollback: Vercel promote previous production deploy / `vercel rollback`.

One Neon database and one Blob store. Test schema changes locally (Docker) before pushing to `main`.

### Deploy subagent (required handoff)

All deploy/ship/push-for-Vercel/post-deploy health/rollback work is owned by the **deploy subagent**, not the main coding agent:

1. Main agent launches Task with `subagent_type: "deployment-expert"`.
2. Subagent follows `.cursor/skills/deploy/SKILL.md` as a **state machine**: detect dirty/ahead/Vercel status → commit only if dirty → push if unpushed commits exist → ensure/force Vercel deploy for tip SHA → confirm migrate-on-build → publish static assets (git/`content` and/or Vercel Blob) if needed → `/api/health` → report.
3. Clean tree / already-committed code is fine — do not fail; continue from the next missing step. Handoff: `.cursor/rules/deploy-handoff.mdc`. Triggers include explicit deploy asks **and** post-feature auto-ship.

## Runbooks

- `docs/runbooks/ci-failure.md` — diagnosing and fixing CI failures.
- `docs/runbooks/deploy.md` — deploys, env vars, migrations, rollback.
- `docs/runbooks/storage.md` — Vercel Blob, asset URL resolver, agent upload playbook.
- `docs/runbooks/e2e.md` — running and extending Playwright tests.
- `.cursor/skills/deploy/SKILL.md` — deploy subagent playbook.

## Rules of the road

- Keep the three-layer boundary (engine/content/platform) once Phase 2 begins; engine code must stay generic.
- Server Components by default; Client Components only when interactivity requires it.
- Small, composable modules; strong typing; no duplicated business logic.
- Prefer the simplest thing that works. This codebase is maintained primarily by AI agents — optimize for readability.
