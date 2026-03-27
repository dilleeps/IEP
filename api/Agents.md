# Agents Guide (API)

Key rules for `apps/api` (derived from `_bmad-output/project-context.md`):

## Technology & Structure
- Stack: Node/TypeScript 5.9 (NodeNext ESM), Express 5.2, Sequelize 6.x (Postgres), Zod, JWT, Winston, Swagger, LangChain + @google/genai, tsx, Vitest + testcontainers.
- Layering: Router → controller → service → repo → model. Models are underscored + paranoid. Call `initDb()` once before Sequelize access; keep associations intact.
- Imports: Use ESM with explicit `.js` suffix on local imports. Maintain stdlib → third-party → local ordering.

## Routing, Validation, Security
- Middleware order: global `requestContext`, CORS, JSON body limit (25mb), rate limiter, then routers; `errorHandler` must stay last.
- AuthZ: Enforce `authenticate`; apply `requireRole` and `requireResourceOwnership` (admin bypass only when explicitly allowed). Auth middleware blocks unapproved non-PARENT users.
- Validation: Use Zod schemas with `validateBody/query/params`; middleware overwrites `req` with parsed data. Provide defaults in schemas instead of mutating later.
- Errors: Throw `AppError` with `statusCode`/`code`/`details`; avoid leaking raw errors. `errorHandler` responds with JSON including `traceId`.

## Database
- Initialize via `initDb()`; avoid DB usage before initialization. Keep snake_case column mapping consistent; `softDelete` uses paranoid destroy (no hard delete).
- DB migrations/seeds via `npm run db:migrate` / `npm run db:seed` (tsx CLI). Ensure `.env` DB credentials and SSL cert paths exist when using secure mode.

## Testing
- Vitest + supertest + testcontainers; `NODE_ENV=test` and `DATABASE_URL` come from PostgreSqlContainer. Use `tsx` when importing app in tests.
- Prefer deterministic unit tests; gate slow/container tests behind explicit flags if needed. Place fixtures in `tests/__fixtures__` if added.

## Docs & Swagger
- Keep swagger schemas aligned with DTOs/Zod; bearerAuth security must remain. API docs served at `/api-docs` and `/api-docs.json`.

## Style
- 2-space indent, single quotes, trailing commas. Follow ESLint flat config and Prettier settings. Minimal comments; rely on types/Zod for clarity.

