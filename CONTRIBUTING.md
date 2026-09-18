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
[README](README.md#getting-started). In summary:

```bash
npm install
npm run db:migrate
npm run dev
```

Copy `.env.example` to `.env.local` and provide only the services needed for
the area you are testing. Keep `.env.local` untracked.

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
   `drizzle/`. Do not use `drizzle-kit push --force` against production.
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
- Keep the branch current and respond to review feedback with follow-up commits.

Maintainers may ask for changes, close inactive proposals, or decline work that
does not fit the product direction. All accepted contributions are licensed
under the repository's [MIT License](LICENSE).
