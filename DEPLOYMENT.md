# Zebra AI deployment procedure

## Automated release path

The repository now defines four workflows:

- `CI`: every pull request, pushes to `main` and `staging`, and release runs. Installs the lockfile, audits runtime dependencies, lints, typechecks, tests, and builds without production secrets.
- `Release`: manually run from `main` in Actions. It checks the selected commit, deploys that same commit to staging, then requests production environment approval. Releases are serialized and never cancelled mid-migration.
- `Validate staging`: runs on pushes to `codex/release-candidate` before merging. It runs CI, then deploys that exact commit to the staging Preview target when the repository variable `STAGING_READY` is `true`. The staging GitHub environment must permit that branch. Manual runs become available after the workflow reaches the default branch.
- `Deploy environment`: reusable deployment job; verifies the existing `zebra-ai` Vercel project, pulls Preview for staging or Production for release, validates the target, builds, applies forward migrations, verifies the schema, deploys, and probes `/` and `/api/auth/ok` for HTTP 200.

**Activation is required:** workflow files alone do not create hosting resources, secrets, or branch protections. Keep `STAGING_READY` unset until the separate staging database, Preview variables, hostname, and GitHub secrets are configured. Then set it to `true` and push the release branch to run `Validate staging`; complete the manual smoke tests before merging to `main`. `vercel.json` disables Vercel's automatic Git deployments so pushes cannot bypass CI; configure the release workflow before merging this file. Manual Vercel deployments and deploy hooks must also be restricted operationally.

### One-time environment setup

1. Keep the existing `zebra-ai` Vercel project. Use its **Preview** target for staging and **Production** target for the live app. Add a stable staging hostname beginning with `staging.` to this project, such as `staging.zebra-ai.app`. The release workflow aliases each verified Preview deployment to that hostname. The project's Node.js version is 24.x; CI uses Node.js 24 too.
2. Create a separate Neon staging database with synthetic data. Do not clone production customer data or use either existing Neon branch that contains real resumes. Apply the committed migrations to initialize staging. The existing `ep-empty-bird-amupvzd6-pooler` endpoint belongs to production and must not be used for staging.
3. Set variables from `.env.example` separately in the existing project's Preview and Production targets. Preview needs its own `DATABASE_URL`, `BETTER_AUTH_SECRET`, matching `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`, test-mode Razorpay keys and webhook secret, and separate OAuth callback registration. Register its test webhook at `https://STAGING_HOST/api/payments/webhook`. Keep any AI test usage budgeted. Move shared production credentials to Production scope only after Preview alternatives are ready; never replace a Production value while configuring Preview.
4. Create GitHub environments `staging` and `production` (GitHub environment names are case insensitive; the existing `Production` environment may be reused). Permit `main` and the reviewed `codex/*` release branch in staging; restrict production to `main`. Require an owner approval for production; allow self-review for a single-maintainer repository. Review staging before approving. Disable administrator bypass where the account supports it.
5. In **each GitHub environment**, set secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` for the same existing `zebra-ai` Vercel project. Keep them environment-scoped rather than repository-wide. If deployment protection is enabled, also set `VERCEL_AUTOMATION_BYPASS_SECRET`.
6. In each GitHub environment, set variables `APP_URL` (the stable HTTPS origin), `EXPECTED_DATABASE_HOST` (the exact corresponding Neon hostname, with no credentials), and `VERCEL_CLI_VERSION` (an explicitly tested numeric version; do not use `latest`). In staging, also set `PRODUCTION_APP_URL` and `PRODUCTION_DATABASE_HOST` to the corresponding production origin and Neon hostname. The workflow refuses to deploy to a project other than `zebra-ai`; the validator rejects mismatched URLs, shared database hosts, production origins, and live Razorpay keys in staging. Confirm both environments have the same Vercel project ID but different database hosts and app URLs.
7. Protect `main`: require a pull request, require the `Quality checks` status after its first run, require the branch to be up to date, disallow force pushes and deletions, and apply protections to administrators. A solo-maintainer repository need not require another PR reviewer; production still has its explicit environment approval.
8. Set repository variable `STAGING_READY=true` only after the staging resources and secrets are ready, then push the release branch to run `Validate staging`. Complete the manual smoke tests below and merge only after its checks succeed. Then run `Release` from `main`. Review the repeated staging result before approving production. Keep the previous production deployment available for rollback. Confirm that a deliberately failing PR cannot merge and cannot deploy.

Public HTTP probes prove reachability, not complete payment/AI correctness. The existing integration suite uses a test store; the staging payment, OAuth, PDF and database journeys below remain required acceptance checks. Schema health is checked against the target database before deployment. A post-deploy probe failure marks the release failed but does not automatically roll back code or schema.

Workflow behavior follows the [Vercel GitHub Actions guide](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel), [Git deployment controls](https://vercel.com/docs/project-configuration/git-configuration), and [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments).

Use this checklist for staging first, then repeat it for production. Never use
`drizzle-kit push --force` against either environment.

## 1. Verify the release

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm run check
```

The Azure smoke test makes a billable external request, so run it explicitly
with the target environment loaded:

```bash
npm run azure:smoke
```

## 2. Configure secrets

Set every required variable from `.env.example` in the hosting platform. At a
minimum, configure the database, Better Auth URL/secret/origins, application
URL, and all three `AZURE_FOUNDRY_*` values. Keep API keys server-only. Set
`GEMINI_API_KEY` in production when provider failover is required. Configure
`CHROMIUM_PACK_URL` or `CHROME_EXECUTABLE_PATH` when the host has no browser.
`DATABASE_POOL_MAX` defaults to 5 and is clamped to 1–10; start at 5 for a
serverless deployment and lower it if Neon reports connection saturation.

Use the API key belonging to the same Foundry resource or project host used by
`AZURE_FOUNDRY_OPENAI_BASE_URL`. Do not use the `/api/projects/...` URL as the
OpenAI base URL; the configured value must end with `/openai/v1/`.

When credit purchases are enabled, create a separate Razorpay webhook secret,
set `RAZORPAY_WEBHOOK_SECRET`, and register this public HTTPS endpoint in both
Razorpay Test Mode and Live Mode:

```text
https://YOUR_APP_HOST/api/payments/webhook
```

Subscribe to `payment.captured` and `order.paid`. The endpoint validates the
raw-body signature and credits each order idempotently; do not reuse the API key
secret as the webhook secret.
Enable automatic capture in Razorpay before selling credit packs. Checkout
verification grants credits only after Razorpay reports a captured payment.
Use test-mode API keys and a separate test webhook secret in staging; replace
both with live credentials for production. Keep all secrets in deployment
environment variables, not in the repository.

## 3. Back up and migrate

Create a provider snapshot or logical backup. Then run the reviewed, forward-
only migrations with the target `DATABASE_URL`:

```bash
npm run db:prepare
```

The current migration creates new evidence/compiler tables and does not delete
or rewrite existing resumes. Do not deploy application code if migration or
health verification fails.

`db:health` checks connectivity plus the authentication, resume, analysis, and
distributed-rate-limit tables. A successful ping by itself is not sufficient.
During a code/schema rollout race, only a missing `rate_limit_buckets` table
temporarily degrades to per-instance limiting; this is an availability guard,
not a substitute for running migrations.

## 4. Deploy and smoke-test

Deploy one staging instance, then verify sign-in, resume upload and structure
review, role-match upload, chat, cover-letter generation, project analysis,
job import, PDF export, and payment test mode. Confirm that a failed resume
parse saves nothing and refunds the reserved credit. Send a signed Razorpay test
webhook twice and confirm credits are granted exactly once.

Promote the exact verified commit to production. Monitor 4xx/5xx rates, Azure
latency and token usage, database errors, and payment reconciliation.

Azure failures are sent to Gemini when `GEMINI_API_KEY` is configured and Azure
has not emitted response text. Treat fallback log messages as an incident signal:
fix the Azure key, endpoint, deployment name, quota, or networking rather than
operating permanently on fallback.

## 5. Roll back safely

Roll back application code to the previous release if runtime checks fail. The
new database objects are additive, so leave them in place during an application
rollback. Restore a database backup only for confirmed data corruption; do not
attempt a destructive schema rollback during an incident.
