# Seeker (kindle-life)

An interactive adventure game that teaches timeless spiritual principles through exploration, stories, puzzles, and reflection. Based on **"Kindle Life" by Swami Chinmayananda**, for ages 12–15.

**Status: Phase 1** — agent-managed environment (app scaffold, database, CI, e2e, deploys). The game itself arrives in Phase 2. See [docs/VISION.md](docs/VISION.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

Next.js (App Router, TypeScript, Tailwind) · Prisma 6 + Postgres (Neon in production, Docker locally) · Vercel Blob · Vitest · Playwright · GitHub Actions · Vercel · pnpm

## Getting started

```bash
pnpm install
docker compose up -d        # local Postgres 16
cp .env.example .env        # local DATABASE_URL
pnpm dlx vercel@latest env pull .env.local --yes   # Blob token (linked project)
pnpm db:deploy              # apply migrations
pnpm dev                    # http://localhost:3000
```

Static / object storage: [docs/runbooks/storage.md](docs/runbooks/storage.md).

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # fast gates
pnpm test:e2e                              # Playwright (needs Postgres)
```

## Deploy

Push a PR → GitHub Actions gates it → Vercel may build a preview. Merge to `main` → Vercel deploys production and applies Prisma migrations. One Neon DB + one Blob. Details: [docs/runbooks/deploy.md](docs/runbooks/deploy.md).

## For AI agents

Start with [AGENTS.md](AGENTS.md). Runbooks live in [docs/runbooks/](docs/runbooks/), automation drafts in [docs/automations.md](docs/automations.md).
