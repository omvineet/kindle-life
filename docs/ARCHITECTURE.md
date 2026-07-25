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
| Unit tests | Vitest |
| E2E | Playwright |
| Package manager | pnpm |
| CI | GitHub Actions |
