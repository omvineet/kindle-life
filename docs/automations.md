# Cursor Automations for this repo

These automations keep the repo self-healing. Create them in Cursor's Automations editor (Agents Window) using the drafts below. They complement — never replace — the deterministic gates in GitHub Actions.

## 1. Fix failing CI on pull requests

- **Trigger**: Git → Checks completed (repo `omvineet/kindle-life`)
- **Tools**: Comment on PRs
- **Prompt draft**:

> A CI check failed on this pull request. Read the failing job logs with `gh run view <run-id> --log-failed`, then follow `docs/runbooks/ci-failure.md`: reproduce the failure locally, fix the root cause, and push the fix to the PR branch. Never weaken or skip CI checks, never mark tests as skipped, and never rewrite applied Prisma migrations. Verify with `pnpm lint && pnpm typecheck && pnpm test` before pushing. If the failure is unrelated infrastructure flake, re-run the failed job once instead. Leave a short PR comment summarizing what was fixed.

## 2. Babysit open pull requests

- **Trigger**: Git → Pull request opened (repo `omvineet/kindle-life`)
- **Tools**: Comment on PRs
- **Prompt draft**:

> Keep this PR merge-ready. Triage unresolved review comments (including Bugbot), resolve clear merge conflicts while preserving intent on both sides, and fix CI failures within this PR's scope per `docs/runbooks/ci-failure.md`. Follow the Definition of Done in `AGENTS.md`. Do not merge the PR yourself; report status when it is green and conflict-free.

## 3. Verify production health after merge to main

- **Trigger**: Git → New push to branch (`main`, repo `omvineet/kindle-life`)
- **Tools**: none (read-only check)
- **Prompt draft**:

> Wait for the Vercel production deployment of this commit to finish, then request `https://<production-domain>/api/health` and confirm it returns `{"ok":true,"db":true}`. If unhealthy, investigate using `docs/runbooks/deploy.md` (check Vercel build logs and the `DATABASE_URL` env var) and open an issue describing the failure and suspected cause.

Replace `<production-domain>` after the first Vercel deploy.
