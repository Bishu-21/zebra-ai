# CI and staging implementation plan

**Goal:** Check every proposed change and deploy the same checked revision to isolated staging before production.

**Architecture:** A reusable CI workflow runs without account secrets. A manually dispatched release on main calls CI, then a reusable deployment workflow for staging and production in sequence. Separate Vercel projects and GitHub environments isolate credentials. Production environment approval records the staging smoke-test review.

**Constraints:** Preserve existing workspace edits. Never use production data in CI. Never run destructive schema synchronization. Do not claim hosted configuration is active until verified remotely.

- [x] Add reusable CI: npm ci, audit, lint, typecheck, tests, build on Node 22.
- [x] Add release and reusable deployment workflows with fixed-revision checkout, serialized releases, environment-scoped secrets, migration and health gates, Vercel prebuilt deployment, and HTTP probes.
- [x] Add staging environment validation and test rejection of live payment keys or mismatched origins.
- [x] Document environment setup, branch protection, disabling bypass deployments, activation, smoke tests, and rollback.
- [x] Run local checks and review workflow syntax. Record account or pre-existing verification blockers explicitly.

## Activation status

Work is on `codex/ci-staging`; no commit, push, merge or deployment has occurred. Existing user edits are preserved. GitHub environments `staging` and `Production` exist with main-only deployment branch policies; Production requires approval from Bishu-21. Branch protection remains unconfigured until CI is published. Vercel browser is at sign-in, no Vercel project credentials or staging Neon database are configured. The user confirmed `ep-empty-bird-amupvzd6-pooler` is production.

Local lint, build and workflow YAML parsing passed. Runtime dependency audit reports zero vulnerabilities after updating sharp to 0.35.4 and the XML parser to 0.8.15. Resume diagnosis took priority at the user's request; see `docs/resume-analysis-diagnostics-2026-09-19.md`.

Final local suite: 236 tests passed. Independent review returned a deployment-probe limitation before stopping at its usage limit; probes now check both the new immutable deployment URL and configured application origin. Live Actions execution and hosting acceptance checks remain pending activation.
