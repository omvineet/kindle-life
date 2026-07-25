# Runbook: CI failure

Goal: get the failing check green without weakening CI.

## 1. Identify the failure

```bash
gh run list --branch <branch> --limit 5
gh run view <run-id> --log-failed
```

Failing jobs map to these local commands:

| CI step | Reproduce locally |
|---------|-------------------|
| Prisma validate | `pnpm db:validate` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| Apply migrations | `docker compose up -d && pnpm db:deploy` |
| Build | `pnpm build` |
| E2E | `pnpm test:e2e` (needs Postgres running) |

## 2. Fix

- Reproduce locally first; never push blind fixes.
- Fix the root cause in code. Do not disable rules, skip tests, or mark tests `.skip` to pass.
- If a dependency broke CI (e.g. lockfile drift), run `pnpm install` and commit the lockfile.
- If migrations fail, check `prisma/migrations/` history is intact — never rewrite an applied migration; add a new one.

## 3. Verify and push

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
git push
gh run watch
```

Repeat until green. If the failure is infrastructure-only (runner outage, registry flake), re-run the job once before changing code:

```bash
gh run rerun <run-id> --failed
```
