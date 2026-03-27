---
project_name: 'iepapp'
user_name: 'Muthuishere'
date: '2026-02-07T09:55:35+05:30'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality_rules', 'workflow_rules', 'critical_rules']
existing_patterns_found: 6
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- API: Node/TypeScript 5.9.3 (NodeNext ESM), Express 5.2.1, Sequelize 6.37.7 on Postgres, Zod 4.3.5, JWT, Winston, Swagger, LangChain + @google/genai 1.34.0, tsx 4.21.0, Vitest 3.2.4 with testcontainers, OpenTelemetry SDK 0.208.0.
- Web app: Vite 7.2.4 + React 19.2.0, React Router 7.11.0, React Query 5.90.19, Radix UI suite, Tailwind CSS 4.1.18 via @tailwindcss/vite, CVA 0.7.1, tw-animate-css, Babel React Compiler, TypeScript ~5.9.3.
- Home site: Vite 7.1.2 + React 19.1.1, Tailwind CSS 3.4.17, MDX 3.1.0, Framer Motion/Motion 12.0.0, Cloudflare Wrangler 4.58.0.
- Mobile stub: React Native 0.72.17 + React 18.2.0, TypeScript 4.8.4, Jest 29.2.1.
- Tooling/ops: ESLint 9.x (flat configs), Prettier 3.7.4 (API), Taskfile-based tasks, Postgres with optional SSL/Cloud SQL, OpenTelemetry tracing hooks.

## Critical Implementation Rules

### Language-Specific Rules
- TypeScript: TS config is non-strict in API and web app; NodeNext ESM requires `.js` import suffixes for local files. API excludes `src/db` from tsc, so db CLI uses tsx.
- Imports/exports: Use ESM imports with explicit `.js` extensions in API; UI uses path alias `@/*` (configured in tsconfig and Vite).
- Error handling: Use `AppError` (statusCode, code, details) for expected failures; rely on `errorHandler` middleware to format JSON responses and include `traceId`.
- Validation: Use Zod schemas with middleware (`validateBody/query/params`) that overwrites `req` with parsed data; supply Zod defaults instead of mutating later.
- Dates/serialization: Controllers convert dates to ISO strings before responding; prefer consistent ISO outputs for API responses.

### Framework-Specific Rules
- Express API: Route modules follow router → controller → service → repo → model layering; always mount auth (`authenticate`), role (`requireRole`), and ownership (`requireResourceOwnership`) middlewares at the router level as seen in `child.routes.ts`. Apply requestContext and rate limiting globally; keep `errorHandler` last.
- Validation: Attach Zod validators per route (`validateBody/query/params`); avoid duplicating validation in controllers.
- Sequelize: Models use underscored + paranoid tables; call `initDb()` before DB access to register models/associations. Use repo methods (`BaseRepo`) for CRUD; `softDelete` relies on paranoid models.
- Swagger: Keep routes documented via shared swagger spec; versions are 3.0.0; surface bearerAuth security.
- React (app): Use provider stack (ThemeProvider, NotificationProvider, QueryClientProvider, AuthProvider); route guards `RequireAuth`/`RequireRole`; `AppRoutes` controls document titles; prefer functional components, hooks, and Radix/CVA UI primitives.
- HTTP client: Use `apiRequest`/`apiLongRequest` to add Bearer tokens, JSON headers, timeouts, and stream parsing; avoid raw fetch to keep logging/error handling consistent.
- Theming: ThemeProvider syncs with localStorage (`askiep.theme`) and system prefers-color-scheme; toggles `.dark` on documentElement; index.css defines OKLCH tokens for light/dark—reuse tokens instead of custom colors.

### Testing Rules
- API tests: Vitest with supertest and testcontainers; `NODE_ENV=test` + `DATABASE_URL` supplied by PostgreSqlContainer. Use `tsx` to import app with NodeNext ESM.
- Test org: API tests live in `apps/api/tests` with unit/integration/e2e folders; prefer `*.test.ts` (Vitest) and keep fixtures under `tests/__fixtures__` if added.
- Setup: Ensure `initDb` isn’t called implicitly in tests unless DB is available; use container-provided Postgres URLs for DB-dependent tests.
- Expectations: Prefer deterministic unit tests; gate integration/container tests behind explicit flags if they become slow.
- Frontend: No current automated UI tests; if adding, colocate Vitest/RTL specs next to components and reuse `apiRequest` mocks rather than raw fetch.

### Code Quality & Style Rules
- ESLint: API uses eslint 9 + flat config defaults; UI/home use flat configs with react-hooks/react-refresh; respect TypeScript settings (non-strict in app, strict in node config). Run `npm run lint` in apps/ui.
- Formatting: Prettier 3.7.4 in API; UI uses Tailwind v4 (utility-first). Maintain 2-space indent, single quotes, trailing commas to match repo style.
- Imports: Keep stdlib → third-party → local ordering; API uses `.js` suffix; UI respects `@` alias.
- Naming/structure: Maintain router/controller/service/repo/model folders in API; place UI components under `components/ui` using Radix/CVA patterns; colocate domain pages under `app/pages`.
- Documentation/comments: Use inline comments sparingly; rely on types/Zod schemas for validation rules; keep swagger schemas in sync with DTOs.

### Development Workflow Rules
- Tasks: Use `task start:postgres` to bring up Postgres/Redis with TLS; `task stop:postgres` to tear down. API dev via `task dev:api` / `npm run dev` (tsx watch + .env); Web dev via `task dev:ui` / `npm run dev`.
- DB setup: API migrations/seeds use `npm run db:migrate` / `db:seed` (tsx CLI). Ensure `.env` has DB credentials; SSL cert paths required when using secure mode; `initDb` decides between Cloud SQL socket, SSL, or plain.
- Commits/PRs: Short imperative commits; PRs need behavior description, linked issues, manual test notes, screenshots for UI.
- Secrets: Never commit raw secrets; use git-crypt (`task decrypt`), keep TLS certs under `infra/certs` out of VCS unless encrypted.
- Deployment: Cloud Run/Kamal/Task deploy scripts present; don’t hardcode URLs—use config/env for API base URLs; preserve bearerAuth in swagger.

### Critical Don't-Miss Rules
- Ownership/security: Always enforce `authenticate` + `requireResourceOwnership` (or allowed roles) on protected routes; don’t bypass for ADMIN unless explicitly allowed. JWT secret must come from env; reject unapproved users (non-PARENT) per middleware.
- Validation errors: Middleware rewrites `req` with parsed data; validation failures should surface as `AppError` with `VALIDATION_ERROR` codes—don’t send raw Zod errors.
- DB ops: Call `initDb()` exactly once before Sequelize access; paranoid models mean `softDelete` uses destroy (no hard deletes). Keep snake_case columns consistent with `underscored: true`.
- HTTP client: In UI, prefer `apiRequest`/`apiLongRequest` to ensure auth header, timeout, and structured errors; avoid direct fetch without tokens.
- Dates/time: Serialize dates to ISO strings in controllers; avoid mixing JS Date and string without normalization.
- Config: NodeNext ESM requires `.js` extension on relative imports in API; missing suffix will break runtime. UI path alias `@` requires Vite/tsconfig alignment.
- Rate limiting/logging: Global `apiRateLimit` and requestContext must stay before routers; errorHandler must remain last to capture errors with traceId.
- Secrets/certs: For SSL DB connections, env paths must exist; `appenv.getAsFilePath` throws if missing—avoid deploying without certs or wrong paths.
