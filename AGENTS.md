# Agents Guide (Global)

Use these rules (from `_bmad-output/project-context.md`) when working anywhere in this monorepo.

## Technology Stack
- API: Node/TypeScript 5.9 (NodeNext ESM), Express 5.2, Sequelize 6.x on Postgres, Zod, JWT, Winston, Swagger, LangChain + @google/genai, tsx, Vitest + testcontainers, OpenTelemetry SDK.
- Web: Vite 7 + React 19, React Router 7, React Query 5, Radix UI, Tailwind CSS 4 (@tailwindcss/vite), CVA, tw-animate-css, Babel React Compiler.
- Home: Vite 7 + React 19.1, Tailwind 3, MDX 3, Motion/Framer Motion, Cloudflare Wrangler.
- Mobile: React Native 0.72 + React 18.2, TypeScript 4.8, Jest 29.
- Tooling/ops: ESLint 9 flat configs, Prettier 3.7 (API), Taskfile tasks, Postgres with optional SSL/Cloud SQL, OpenTelemetry tracing.

## Cross-Cutting Rules
- Imports: API uses NodeNext ESM with explicit `.js` suffix on local imports; UI uses `@/*` alias (tsconfig + Vite). Keep stdlib → third-party → local ordering.
- Validation and errors: Use Zod + `validateBody/query/params` middleware; it overwrites `req` with parsed data. Raise `AppError` with `statusCode`/`code`/`details`; `errorHandler` returns JSON with `traceId`.
- Routing/middleware: Apply `requestContext` and rate limiting globally; keep `errorHandler` last. Enforce `authenticate` and `requireResourceOwnership` or `requireRole` on protected routes; honor the approval check in auth middleware.
- DB: Call `initDb()` once before Sequelize usage; models are underscored + paranoid, so `softDelete` uses destroy without hard deletes. Keep snake_case columns consistent.
- HTTP client: In UI, prefer `apiRequest`/`apiLongRequest` for auth headers, timeouts, and stream parsing; avoid raw fetch without tokens.
- Dates: Controllers normalize dates to ISO strings; avoid mixing Date objects and strings.
- Lint/style: 2-space indent, single quotes, trailing commas. Run `npm run lint` in apps/ui; follow ESLint flat configs and Prettier (API).
- Secrets/config: Do not commit secrets. Use `task decrypt` for git-crypt; SSL cert paths must exist (`appenv.getAsFilePath` throws if missing). Use env/config for URLs, not hardcoded values.

## Workflow Notes
- Dev servers: `task start:postgres` / `task stop:postgres`; API dev via `task dev:api` or `npm run dev`; Web dev via `task dev:ui` or `npm run dev`.
- DB maintenance: `npm run db:migrate` and `npm run db:seed` (tsx CLI) in apps/api; ensure `.env` has DB creds and cert paths when needed.
- Commits/PRs: Short imperative commits; PRs need behavior summary, linked issues, manual test notes, and UI screenshots when relevant.

