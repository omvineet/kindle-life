# Seeker — Architecture

The project is divided into three major layers.

```
Content (data)  -->  Game Engine (generic code)  -->  Platform (accounts, ops)
```

## 1. Game Engine

Responsible for all reusable gameplay systems. The engine **never contains Kindle Life–specific logic**.

Planned modules:

- Dialogue Engine
- Quest Engine
- Choice Engine
- Reflection Journal
- Achievement System
- Save System
- Inventory
- Scene Navigation
- Animation Manager
- Audio Manager

## 2. Content

Content is completely data-driven. Every chapter exists as structured data (dialogue, NPCs, quests, reflection questions, images, audio, choices). The engine reads the content; the content never contains business logic.

## 3. Platform

Responsible for authentication, progress tracking, teacher dashboard, student profiles, administration, settings, analytics, deployment, and monitoring.

## Design Principles

- Strong typing.
- Small reusable components.
- Server Components by default; Client Components only when necessary.
- Prefer composition over inheritance.
- No duplicated business logic.
- Every module independently testable.

## Future Expansion

The engine should eventually support: multiple books, multiple languages, AI-generated content, community-created adventures, teacher lesson plans, and classroom mode.

## Phase Status

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Agent-managed environment: Next.js scaffold, Neon Postgres + Prisma, Vercel deploys, GitHub Actions CI, Playwright e2e, agent runbooks and automations. **No game code.** | Current |
| Phase 2 | Generic game engine + data-driven Kindle Life content (Chapter 0 demo first) | Not started |
| Later | Platform features: auth, teacher dashboard, profiles, analytics | Not started |

## Phase 1 Tech Stack (locked)

| Piece | Choice |
|-------|--------|
| App | Next.js App Router + TypeScript + Tailwind |
| DB | Neon Postgres + Prisma (preview branching enabled — real user data, prod/preview must stay isolated; see `docs/runbooks/deploy.md`) |
| Hosting | Vercel (preview per PR, production on `main`) |
| Object storage | Vercel Blob (public store `seeker`) — heavy pack media + runtime uploads; see **Static storage** below |
| Unit tests | Vitest |
| E2E | Playwright |
| Package manager | pnpm |
| CI | GitHub Actions |

## Static storage

Full-game media uses **git + Vercel Blob**. Do not add R2, S3, Supabase Storage, or Git LFS. Never store file bytes in Postgres.

| Class | Examples | Where |
|-------|----------|--------|
| Content data | Dialogue, quests, choices | Git `content/<packId>/` |
| Light media | Icons, portraits, tiny SFX | Git under pack `assets/` (served as `/content/...`) |
| Heavy pack media | Music, narration, large scene art | Vercel Blob keys `packs/<packId>/<version>/...` |
| Runtime / platform | Avatars, teacher files, later AI/UGC | Vercel Blob keys `users/`, `teachers/`, `generated/`, `ugc/` |

Content JSON stores **relative keys only** (never Blob hostnames). `lib/assets.ts` resolves them:

- No `CONTENT_ASSET_BASE` → `/content/{packId}/assets/{key}` (Phase 2 Chapter 0 default).
- With `CONTENT_ASSET_BASE` → `{base}/packs/{packId}/{version}/{key}` (published heavy media).

Server helpers live in `lib/blob.ts`. Agent/ops details: `docs/runbooks/storage.md`.

**Rollout:** Chapter 0 keeps all media in git. When audio / large art lands, publish heavy globs to Blob and set `CONTENT_ASSET_BASE`. Platform uploads use the same store with auth-gated routes. Classroom launch expects Pro (Hobby Blob transfer is hard-capped). Escape hatch later: point `CONTENT_ASSET_BASE` at another CDN origin without changing content JSON.
