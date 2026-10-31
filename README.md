<p align="center"><img src="public/zebra_star.svg" width="72" height="72" alt="Zebra AI zebra icon" /></p>
<h1 align="center">Zebra AI</h1>
<p align="center">A resume review and job-application workspace. Bring your evidence, review suggested changes, and export a PDF.</p>
<p align="center"><a href="https://zebra-ai.app">Website</a> · <a href="#getting-started">Local setup</a> · <a href="CONTRIBUTING.md">Contributing</a> · <a href="SECURITY.md">Security</a> · <a href="LICENSE">MIT license</a></p>

![Current Zebra AI dashboard with navigation, review counts and application shortcuts](docs/images/dashboard.png)

*Rendered from the current dashboard components with synthetic demo data. This UI preview contains no customer account data and is not evidence of hiring outcomes.*

## What it does

- Import PDF, DOCX, or TXT resumes; review and edit the extracted content.
- Review resume quality or compare a resume against a supplied job description.
- Review proposed changes, save versions, and export PDFs.
- Track applications, work evidence, and certifications.
- Generate cover letters, review LinkedIn content, and publish a portfolio when configured.
- Navigate the workspace with Zebu through voice or text. Voice requires browser permissions and provider configuration.

AI output needs human review. Scores describe the implemented rubric or job comparison; they do not predict ATS acceptance, interviews, or employment. The app does not submit applications on your behalf. PDF export is supported; DOCX export is not advertised.

## Availability and limits

| Area | Current behavior |
| --- | --- |
| Resume audit | Returns a job ID; an awaited Next.js `after()` callback runs the audit within the route's 300-second budget. The UI polls for results. |
| Kafka | Optional integration and worker code exist. The release workflow disables analysis-event publication; a worker is not required for the default audit path. |
| Credits | AI operations can consume credits. Saving/importing a resume is separate from AI review. Auto-Structure is labeled as a 1-credit operation. |
| Payments | Razorpay integration exists. `CHECKOUT_DISABLED=true` closes checkout even if keys are stored. Sales require valid credentials, captured payments, and verified signed webhook delivery. |
| PDF export | Needs local Chrome or a compatible serverless Chromium pack. A successful build does not verify PDF output. |
| Storage | Postgres stores resume content and application records. Uploaded originals and generated PDFs should not be assumed to have durable object-storage backups. |

No unlimited AI usage, guaranteed correctness, independent security certification, or production readiness from tests alone is claimed.

## Stack and architecture

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 24.x, npm |
| App | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS 4, Framer Motion |
| Auth | Better Auth |
| Database | Neon Postgres, Drizzle ORM |
| AI | Azure Foundry (primary text), Gemini (fallback and Live voice) |
| Documents | unpdf, Mammoth, Puppeteer, Chromium |
| Payments | Razorpay |
| Jobs | Optional Kafka / Azure Event Hubs |
| Hosting | Vercel |
| Observability | Optional Azure Application Insights |

```mermaid
flowchart LR
    Browser[Dashboard and public pages] --> App[Next.js pages and Route Handlers]
    App --> Policy[Session, ownership, validation, rate and credit policies]
    Policy --> DB[(Neon Postgres)]
    Policy --> AI[Azure Foundry / Gemini]
    Policy --> PDF[Document parsing / Chromium PDF export]
    Policy --> Billing[Razorpay orders and signed webhooks]
    App -. optional telemetry .-> Insights[Application Insights]
```

The application is a modular monolith. Production rate-limit buckets use Postgres; local/test limits use memory. AI usage recording exists in the provider gateway. Resume-job failure/refund and result/completion use transactions. These controls do not replace monitoring, backups, or end-to-end testing.

## Getting started

Use **Node.js 24.x** and npm, matching CI and hosting. Create a separate development Postgres/Neon database; do not use the production endpoint for setup.

```bash
git clone https://github.com/Bishu-21/zebra-ai.git
cd zebra-ai
npm ci
```

Copy [`.env.example`](.env.example) to `.env.local` using your shell or editor. At minimum, configure:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@DEVELOPMENT_HOST/DATABASE
BETTER_AUTH_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORT_EMAIL=accounts@zebra-ai.app
CHECKOUT_DISABLED=true
```

For primary AI features, set `AZURE_FOUNDRY_API_KEY`, `AZURE_FOUNDRY_OPENAI_BASE_URL`, and `AZURE_FOUNDRY_DEPLOYMENT` together. Use the key for the matching Azure resource; the OpenAI-compatible base URL ends in `/openai/v1/`. Gemini, voice, OAuth, email, and telemetry have additional settings in `.env.example`. Never commit credentials or customer data.

After reviewing migrations, initialize **only your separate development database**:

```bash
npm run db:migrate
npm run dev
```

Open [localhost:3000](http://localhost:3000). Do not run `db:migrate`, `db:prepare`, or `drizzle-kit push --force` against production as part of local setup.

### Optional integrations

- **Google OAuth:** configure both client credentials and register the callback for the exact app origin.
- **Email:** configure `RESEND_API_KEY` and a verified `EMAIL_FROM` together. See [email setup](docs/email-setup.md).
- **PDF:** configure `CHROME_EXECUTABLE_PATH` locally, or a matching `CHROMIUM_PACK_URL` for serverless hosting.
- **Payments:** keep checkout disabled until Razorpay keys, webhook secret, capture, and webhook recovery are verified. Use test mode in staging; never invent a webhook secret.
- **Kafka:** Docker Compose provides local Kafka, Redis, and Kafka UI. These are optional development services, not proof of deployed cloud workers. Do not attach a worker to a shared staging/production stream.

## Development and verification

```bash
npm run check
```

This runs lint, TypeScript, tests, and a production build. For a focused test:

```bash
node --import tsx --test tests/<name>.test.ts
```

`npm run db:health` checks connectivity and required schema without applying migrations. `npm run azure:smoke` makes an external AI request and may incur charges; run it deliberately with the intended environment loaded.

Tests include unit, route, policy, and source-level regression checks. A green suite does not replace real sign-in, upload/review, AI completion, PDF inspection, or payment/webhook acceptance tests. No coverage percentage or performance benchmark is claimed.

## Repository layout

```text
src/app/          Pages and API Route Handlers
src/components/   Dashboard, landing, editor, and shared UI
src/lib/          Auth, data, AI, billing, document, and policy logic
src/hooks/        Client interaction hooks
src/context/      Client providers
drizzle/          Reviewed SQL migrations and journal
scripts/          Health, validation, smoke-test, and worker scripts
tests/            Automated checks
docs/             Setup notes and documentation assets
```

## Deployment

Follow [DEPLOYMENT.md](DEPLOYMENT.md). Changes go through a focused branch, pull request, CI, and staging before production approval. Vercel validates configuration, builds the app, and runs read-only schema health checks; it does **not** apply migrations automatically. Database changes need separate review and approval.

Keep staging and production databases, origins, and payment modes separate. Verify actual user journeys before promotion and retain a known-good deployment for rollback. HTTP probes establish reachability, not payment or AI correctness.

## Community and support

- **Bugs and ideas:** use the [issue templates](https://github.com/Bishu-21/zebra-ai/issues/new/choose). Include reproduction steps and expected behavior; redact credentials and personal data.
- **Contributions:** read [CONTRIBUTING.md](CONTRIBUTING.md) and use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md). Discuss substantial changes first.
- **Conduct:** follow the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
- **Security:** follow [SECURITY.md](SECURITY.md) and report vulnerabilities privately, not in a public issue.
- **Product/account support:** [accounts@zebra-ai.app](mailto:accounts@zebra-ai.app). Never post passwords, API keys, or complete resumes in public reports.

## License

Code is distributed under the [MIT License](LICENSE). Third-party libraries and services retain their own licenses, terms, and usage charges.
