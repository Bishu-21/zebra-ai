<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Zebra AI workflow

- This is a Next.js 16, React 19, TypeScript application managed with npm. Use `npm ci` for a clean install.
- Run `npm run check` before proposing a merge. It runs lint, type checking, tests, and a production build. For a focused test, use `node --import tsx --test tests/<name>.test.ts`.
- Keep route handlers in `src/app/api`, shared server logic in `src/lib`, and database changes in reviewed `drizzle` migrations. Preserve authorization checks and user ownership filters when changing queries or API routes.
- Never commit `.env` files or credentials. Follow `DEPLOYMENT.md` for staging, migration, and release checks; a successful build alone does not establish production readiness.
- Keep `main` releaseable. Develop changes on a focused branch and merge through a pull request after CI passes.
