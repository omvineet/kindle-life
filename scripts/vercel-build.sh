#!/usr/bin/env sh
# Vercel build entrypoint: migrate only on production (one shared Neon DB).
# Preview deploys skip migrate so PR builds cannot alter production schema.
set -eu

if [ "${VERCEL_ENV:-}" = "production" ]; then
  pnpm db:deploy
fi

pnpm build
