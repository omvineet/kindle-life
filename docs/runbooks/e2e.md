# Runbook: E2E tests (Playwright)

## Run locally

```bash
docker compose up -d      # Postgres must be running for /api/health
pnpm db:deploy            # ensure migrations are applied
pnpm test:e2e             # starts the dev server automatically
```

First run only: `pnpm exec playwright install chromium`.

## Run against a deployed URL

```bash
E2E_BASE_URL=https://<url> pnpm test:e2e
```

When `E2E_BASE_URL` is set, Playwright skips starting a local server.

## In CI

`.github/workflows/ci.yml` spins up a Postgres service container, applies migrations, builds the app, and runs the suite against `pnpm start` (production build). Failure uploads the HTML report as the `playwright-report` artifact.

## Adding tests

- Tests live in `e2e/*.spec.ts`. Keep them fast, deterministic, and independent.
- Prefer role-based locators (`getByRole`) over CSS selectors.
- Every new page or API route needs at least one smoke assertion here (see Definition of Done in `AGENTS.md`).
- Debug locally with `pnpm exec playwright test --ui` or `--debug`.
