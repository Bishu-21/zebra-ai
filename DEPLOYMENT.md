# Zebra AI deployment procedure

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
