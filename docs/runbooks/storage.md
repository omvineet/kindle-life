# Runbook: Static storage (Vercel Blob)

## Model

- **Git** — content data + light media (`content/<packId>/`).
- **Vercel Blob** — public store `seeker` (`store_1WMHNyCevIL0npDx`) for heavy pack media and all runtime uploads.
- **Neon** — metadata / keys / URLs only; never file bytes.

Details and asset classes: `docs/ARCHITECTURE.md` → **Static storage**.

## Provisioned store

Already created and linked to the `kindle-life` Vercel project for Development, Preview, and Production:

| Field | Value |
|-------|--------|
| Name | `seeker` |
| Store ID | `store_1WMHNyCevIL0npDx` |
| Access | public |
| Region | `iad1` |
| Public base | `https://1wmhnycevil0npdx.public.blob.vercel-storage.com` |

When publishing heavy pack media, set `CONTENT_ASSET_BASE` to that public base (no trailing slash). Leave it unset while Chapter 0 media lives only in git.

```bash
# Recreate only if the store was deleted (do not run casually)
pnpm dlx vercel@latest blob create-store seeker --access public --yes
```

List stores:

```bash
pnpm dlx vercel@latest blob list-stores
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `BLOB_READ_WRITE_TOKEN` | SDK + CLI auth outside Vercel (local scripts, CI). Injected when the store is connected to the project. |
| `CONTENT_ASSET_BASE` | Optional CDN origin for heavy pack media (no trailing slash). When unset, `resolveAssetUrl` uses git-shipped `/content/...` paths. |
| `BLOB_STORE_ID` / `VERCEL_OIDC_TOKEN` | Set automatically on Vercel deploys; preferred over the long-lived token on-platform. |

Local pull (overwrites `.env.local`):

```bash
pnpm dlx vercel@latest env pull .env.local --yes
```

Add placeholders to a local `.env` from `.env.example` for Docker `DATABASE_URL`. Keep Blob token in `.env.local` (both are gitignored via `.env*`).

**Never commit tokens.**

## Code entry points

| Module | Role |
|--------|------|
| `lib/assets.ts` | `resolveAssetUrl`, key helpers — **only** way the engine should build media URLs |
| `lib/blob.ts` | `putBlob` / `listBlobs` / `deleteBlobs` / `copyBlob` / `isBlobConfigured` |

Content JSON example (relative keys only):

```json
{
  "background": "scenes/chapter-0/grove.webp",
  "music": "audio/chapter-0/theme.mp3"
}
```

Blob key layout:

- Packs: `packs/<packId>/<version>/<key>`
- Users: `users/<userId>/<key>`
- Teachers: `teachers/<teacherId>/<key>`
- Generated / UGC (later): `generated/...`, `ugc/<packId>/...`

## Agent playbook

1. Light art / JSON → edit under `content/` (Phase 2) and commit.
2. Heavy media → place files per pack conventions, upload with CLI or a future `pnpm content:publish` script, set/keep `CONTENT_ASSET_BASE` to the store’s public base URL.
3. Runtime uploads → use `lib/blob.ts` from server routes only; persist keys in Prisma, delete Blob objects when rows go away.
4. Prefer WebP / compressed audio — **transfer** cost dominates in classrooms, not storage GB.
5. Do not use Git LFS. Do not put binaries in Neon.

CLI upload example:

```bash
pnpm dlx vercel@latest blob put ./path/to/theme.mp3 --pathname packs/kindle-life/latest/audio/theme.mp3
```

## Preview vs production

One Neon DB and one public Blob store for the whole project (no per-env stores, no Neon preview branches). Official pack media uses immutable versioned keys — safe to share. Runtime uploads later can use path prefixes if needed; do not create extra Blob stores for “dev/qa/prod”.

Migrations run only on **production** builds (`scripts/vercel-build.sh`). See `docs/runbooks/deploy.md`.

## Cost notes

- Hobby: free within Blob caps; hard stop when exceeded (no overage). Fine for demos.
- Classroom / production streaming: plan on **Pro**.
- If Blob Data Transfer becomes expensive at scale, change only `CONTENT_ASSET_BASE` (e.g. to R2) — do not rewrite content JSON.

## Troubleshooting

- `No token found` / SDK auth errors → `vercel env pull .env.local --yes`, confirm `BLOB_READ_WRITE_TOKEN` is present, restart `pnpm dev`.
- 404 on resolved Blob URLs → key missing or wrong `CONTENT_ASSET_BASE`; `vercel blob list --prefix packs/`.
- Accidentally private access for public game assets → re-upload with public store / `access: "public"` (this project’s store is public).
