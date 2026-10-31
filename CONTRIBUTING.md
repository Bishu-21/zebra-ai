# Contributing to Zebra AI

Thank you for helping improve Zebra AI. Contributions may include bug fixes,
tests, documentation, accessibility improvements, and focused product changes.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
For vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of opening a
public issue.

## Before you start

- Search existing issues and pull requests to avoid duplicate work.
- Open an issue before a large feature or architectural change so its scope
  and direction can be agreed upon.
- Keep changes focused. Separate unrelated refactors from functional changes.
- Never commit credentials, customer data, resumes, job applications, or other
  personal information. Use synthetic data in tests and screenshots.

## Local setup

Requirements and environment variables are documented in the
[README](README.md#getting-started). Copy `.env.example` to `.env.local`,
configure a separate development database and the services needed for your
change, and keep `.env.local` untracked. Use Node.js **24.x** and npm, matching
CI and hosting. Then run:

```bash
npm ci
npm run db:migrate # Separate development database only
npm run dev
```

This project uses Next.js 16. Before changing framework behavior, read the
relevant guide in `node_modules/next/dist/docs/`; APIs and conventions may
differ from earlier Next.js versions.

## Making a change

1. Create a branch from `main` with a descriptive name such as
   `fix/resume-upload-validation`.
2. Follow the existing TypeScript, React, and repository conventions.
3. Add or update tests for behavior changes. Regression fixes should include a
   test that fails without the fix whenever practical.
4. Keep database changes forward-only and add a reviewed migration under
   `drizzle/`. Applying a production migration needs separate review and
   approval; the hosting build runs read-only schema health checks. Do not run
   `db:prepare`, migrations, or `drizzle-kit push --force` on production as part
   of development or a documentation change.
5. Preserve user evidence in AI-assisted features. Do not fabricate resume
   claims, qualifications, metrics, or application history.
6. Update documentation and `.env.example` when configuration or user-facing
   behavior changes.

## Quality checks

Run the checks relevant to your change. Before requesting review, the complete
verification chain should pass:

```bash
npm run check
```

You can run its parts independently while developing:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If a check cannot run because an external service is unavailable, explain that
clearly in the pull request and list the checks you did run.

## Commits and pull requests

- Write concise, imperative commit subjects (for example,
  `fix: validate resume ownership before export`).
- Complete the pull request template and link related issues.
- Explain user-visible behavior, risk, migrations, and configuration changes.
- Include screenshots or recordings for visual changes.
- Use synthetic data and label fixtures or simulations as such. The README
  dashboard image and its capture notes live in [docs/images](docs/images/README.md).
- Document current behavior separately from proposals. Do not claim ATS
  acceptance, employment outcomes, coverage percentages, performance targets,
  or production readiness without supporting evidence.
- Keep the branch current and respond to review feedback with follow-up commits.

Do not merge while required CI checks fail. Application releases follow
[DEPLOYMENT.md](DEPLOYMENT.md): validate staging, verify the relevant user
journeys, then obtain production environment approval. Do not enable checkout,
start shared-stream workers, change secrets, or apply database migrations as
an incidental part of a contribution.

For product/account support, email
[accounts@zebra-ai.app](mailto:accounts@zebra-ai.app). Conduct reports follow
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md); vulnerabilities follow
[SECURITY.md](SECURITY.md). Keep both kinds of report private.

Maintainers may ask for changes, close inactive proposals, or decline work that
does not fit the product direction. All accepted contributions are licensed
under the repository's [MIT License](LICENSE).
