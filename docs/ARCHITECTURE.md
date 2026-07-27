# Seeker — Architecture

The project is divided into three major layers.

```
Content (data)  -->  Game Engine (generic code)  -->  Platform (accounts, ops)
```

## 1. Game Engine

Responsible for all reusable gameplay systems, implemented under `engine/`. The engine **never contains Kindle Life–specific logic** — no book, chapter, or "Seeker" references anywhere in `engine/`. It only knows about generic `ContentPack`s and a generic `PlayerState`. See [Game Engine details](#game-engine-details) below.

Modules (`engine/<module>/`):

- Dialogue Engine (`dialogue/`)
- Choice Engine (`choice/`)
- Quest Engine (`quest/`)
- Reflection Journal (`journal/`)
- Progression System (`progression/`) — virtue points, levels, titles; individual growth, never competitive
- Achievement System (`achievements/`)
- Inventory (`inventory/`)
- Scene Navigation (`scene/`)
- Effect Engine (`effects/`) — the single place that turns a content-authored `Effect` into state changes, shared by choices/scene-enter/reflections
- Save System (`save/`) — create/serialize/deserialize `PlayerState`
- Animation Manager (`animation/`) and Audio Manager (`audio/`) — thin, framework-agnostic timing/state helpers
- Content Loader (`content/`) — reads + zod-validates a pack from `content/<packId>/`

All composed behind one orchestrator, `engine/engine.ts`'s `GameEngine` class — the only thing platform code talks to.

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
- Progression (points, levels, titles) is individual and private — reflects one Seeker's own growth, never compared, ranked, or displayed against other players.

## Game Engine details

### Folder layout

```
engine/
  types.ts                     # ContentPack, Scene, Choice, Quest, PlayerState, GameEvent, zod schemas
  engine.ts, index.ts          # GameEngine orchestrator + public exports
  content/content-loader.ts    # loads + validates a pack from content/<packId>/
  dialogue/  choice/  quest/  journal/  progression/  achievements/  inventory/
  scene/  effects/  save/  animation/  audio/
content/
  demo/                        # non-canonical fixture pack — proves the engine end to end
  <future chapter packs>/      # one folder per Kindle Life chapter, added chapter by chapter
lib/game/
  session.ts                   # anonymous guest session (signed httpOnly cookie -> Player row)
  save-repository.ts           # the only module that knows both Prisma's SaveState and PlayerState
app/play/
  page.tsx, actions.ts         # Server Component + Server Actions calling GameEngine
  components/                  # client components: dialogue, choice, reflection, exits, growth, journal
```

### Content pack schema

A pack lives at `content/<packId>/`: a `pack.json` manifest (id, title, version, `entryChapterId`, `chapterIds`, virtue tracks, quests, achievements, items) plus `chapters/<chapterId>/chapter.json` and `chapters/<chapterId>/scenes/<sceneId>.json` files. `loadContentPack(packId)` validates every file with zod and cross-checks every reference (exits, effect targets, quest/achievement/item/virtue-track ids) so a broken pack fails loudly with a precise error at load time rather than crashing mid-scene. See `content/demo/` for a complete worked example.

A `Scene` can carry dialogue lines, an `onEnter` effect, a `choice` (branching, no "wrong" option), a `reflection` prompt (+ effect), and `exits`. An `Effect` is the single shape used everywhere (choice outcomes, scene entry, post-reflection): it can set flags, grant items, award virtue points, unlock achievements, start/advance quests, add a journal note, and/or transition to another scene. `engine/effects/effect-engine.ts` is the one place that applies it.

### Save / session model

No accounts yet (that's the "Later" platform phase). A visitor gets an anonymous `Player` row identified by a signed httpOnly cookie (`lib/game/session.ts`); a `SaveState` row per `(player, pack)` mirrors the engine's `PlayerState` as JSON columns (`lib/game/save-repository.ts`), including `progression` (virtue points) and `resolvedChoices` (so a choice's effect — and a reflection's — only ever applies once, even if replayed). Real accounts can attach to the same `Player` row later without a data migration.

## Future Expansion

The engine should eventually support: multiple books, multiple languages, AI-generated content, community-created adventures, teacher lesson plans, and classroom mode.

## Phase Status

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Agent-managed environment: Next.js scaffold, Neon Postgres + Prisma, Vercel deploys, GitHub Actions CI, Playwright e2e, agent runbooks and automations. **No game code.** | Done |
| Phase 2 | Generic game engine (done, validated by a non-canonical `content/demo/` pack) + data-driven Kindle Life content, chapter by chapter (not started) | In progress |
| Later | Platform features: auth, teacher dashboard, profiles, analytics | Not started |

## Phase 1 Tech Stack (locked)

| Piece | Choice |
|-------|--------|
| App | Next.js App Router + TypeScript + Tailwind |
| DB | Neon Postgres + Prisma — **one** database (no preview branching). Local Docker for day-to-day testing. See `docs/runbooks/deploy.md` |
| Hosting | Vercel — one project; PR preview + production on `main` |
| Object storage | Vercel Blob — **one** public store `seeker` (see **Static storage**) |
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

**Environments:** one Blob store for local scripts, preview, and production (no Blob-per-env). Same simplification as the database — see `docs/runbooks/deploy.md`.
