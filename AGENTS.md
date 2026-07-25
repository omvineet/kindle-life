<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — How to work on this repo

Seeker: an interactive adventure game teaching spiritual principles (based on "Kindle Life" by Swami Chinmayananda) for ages 12–15. Read `docs/VISION.md` and `docs/ARCHITECTURE.md` before making product decisions.

## Current phase

**Phase 1: environment only.** Do NOT build game engine modules, content packs, auth, or dashboards unless explicitly asked. Phase 2 (game engine + content) has not started.

## Stack

Next.js (App Router, TypeScript, Tailwind) at repo root · Neon Postgres via Prisma · Vercel hosting · Vitest unit tests · Playwright e2e · GitHub Actions CI · pnpm.

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
- Never commit secrets. `.env*` files are gitignored; keep it that way.

## Definition of Done (every change)

1. `pnpm lint && pnpm typecheck && pnpm test` pass locally.
2. If the change affects pages/APIs, `pnpm test:e2e` passes locally.
3. Schema changes ship with a Prisma migration (`pnpm db:migrate`), never by editing the DB directly.
4. CI must be green before merge. Never weaken or skip CI checks to make a failure pass.

## Deploy flow (no manual steps after setup)

- Push branch → open PR → GitHub Actions runs lint/typecheck/unit/Prisma validate/e2e → Vercel builds a preview.
- Merge to `main` → Vercel deploys production; migrations applied via `pnpm db:deploy` during build.
- Verify production health: `GET /api/health` should return `{"ok":true,"db":true}`.

## Runbooks

- `docs/runbooks/ci-failure.md` — diagnosing and fixing CI failures.
- `docs/runbooks/deploy.md` — deploys, env vars, migrations, rollback.
- `docs/runbooks/e2e.md` — running and extending Playwright tests.

## Rules of the road

- Keep the three-layer boundary (engine/content/platform) once Phase 2 begins; engine code must stay generic.
- Server Components by default; Client Components only when interactivity requires it.
- Small, composable modules; strong typing; no duplicated business logic.
- Prefer the simplest thing that works. This codebase is maintained primarily by AI agents — optimize for readability.
