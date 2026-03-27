# Source Tree Analysis — AskIEP

_Generated: 2026-02-21 | Repository Type: Monorepo_

---

## Top-Level Structure

```
iepapp/                              # Monorepo root
├── apps/
│   ├── api/                         # [PART: api] Express 5 TypeScript REST API
│   └── ui/                          # [PART: ui] React 19 Vite SPA
├── infra/
│   ├── gcp/                         # GCP provisioning scripts (Cloud Run, Cloud SQL, SA)
│   ├── gcp-bucket/                  # GCS bucket provisioning
│   ├── gh-actions/                  # GitHub Actions helper scripts
│   ├── gh-projectmanage/            # GitHub project management Go utilities
│   ├── local/                       # Local Docker dev (postgres, redis init scripts)
│   └── telegram/                    # Telegram bot notification scripts
├── deploy/
│   ├── config/                      # Deployment configuration files
│   ├── deploy-api.sh                # Cloud Run API deployment script
│   └── deploy-ui.sh                 # Cloud Run UI deployment script
├── docs/                            # [THIS FOLDER] Project documentation (generated)
│   ├── adr/                         # Architecture Decision Records
│   ├── projectmanage/               # Project management docs (user stories, issues)
│   └── testdata/                    # Test IEP documents
├── .github/
│   └── workflows/
│       ├── deploy-api.yml           # CI/CD: API → Cloud Run
│       ├── deploy-ui.yml            # CI/CD: UI → Cloud Run
│       └── deploy-home.yml          # CI/CD: Home site → Cloudflare
├── _bmad/                           # BMAD AI-assisted dev workflow engine
├── _bmad-output/                    # BMAD generated artifacts (planning, implementation)
├── docker-compose-db.yaml           # Local: PostgreSQL 16 (pgvector) + Redis 7
├── Taskfile.yml                     # Root task runner (start, deploy, secrets, logs)
├── secrets.go                       # Go utility: sync .env → GitHub Secrets
└── git-crypt-key                    # git-crypt key for encrypted secrets
```

---

## API Part (`apps/api/`) — Backend

```
apps/api/
├── src/
│   ├── server.ts                    # [ENTRY] HTTP server startup, initDb(), port binding
│   ├── app.ts                       # [ENTRY] Express app factory, middleware, route mounting
│   │
│   ├── config/                      # Configuration modules
│   │   ├── appenv.ts                # AppEnv: typed env access, file path resolution
│   │   ├── env.ts                   # Zod-validated environment schema
│   │   ├── fileconfig.ts            # File-based config loader
│   │   ├── firebase.ts              # Firebase Admin SDK initialization
│   │   ├── logger.ts                # Winston logger instance
│   │   ├── otel.ts                  # OpenTelemetry SDK setup
│   │   ├── sequelize.ts             # Sequelize instance + initDb()
│   │   └── swagger.ts               # swagger-jsdoc spec builder
│   │
│   ├── middleware/                  # Cross-cutting middleware
│   │   ├── authenticate.ts          # JWT verification, user attachment
│   │   ├── authorize.ts             # requireRole() RBAC guard
│   │   ├── auditLog.ts              # Audit event logging
│   │   ├── errorHandler.ts          # Unified JSON error responses (with traceId)
│   │   ├── rateLimit.ts             # Global + auth-specific rate limits
│   │   ├── requestContext.ts        # Trace ID injection
│   │   ├── resourceOwnership.ts     # requireResourceOwnership() guard
│   │   └── validate.ts              # validateBody/query/params Zod middleware
│   │
│   ├── shared/                      # Shared utilities (no domain logic)
│   │   ├── ai/
│   │   │   ├── ai.service.ts        # Gemini API wrapper
│   │   │   ├── langchainAi.service.ts # LangChain chain orchestration
│   │   │   └── vectorDb.service.ts  # pgvector CRUD + similarity search
│   │   ├── db/
│   │   │   └── base.repo.ts         # Generic CRUD repo (extended by all module repos)
│   │   ├── errors/
│   │   │   └── appError.ts          # AppError class (statusCode, code, details)
│   │   ├── notification/
│   │   │   ├── email.ts             # Nodemailer/SES email sending
│   │   │   └── telegram.ts          # Telegram bot notifications
│   │   ├── service/
│   │   │   └── base.service.ts      # Base service pattern
│   │   ├── storage/
│   │   │   ├── gcs.ts               # Google Cloud Storage client
│   │   │   ├── secrets.ts           # Secret manager access
│   │   │   └── userStorageService.ts # Per-user GCS folder management
│   │   ├── streaming/
│   │   │   └── ndjson-stream.ts     # NDJSON streaming for AI responses
│   │   ├── services.ts              # Shared service registry
│   │   └── utils.ts                 # General utilities
│   │
│   ├── health/
│   │   └── health.routes.ts         # GET /health → { status: "ok" }
│   │
│   ├── modules/                     # Domain modules (20 domains)
│   │   ├── auth/                    # [ENTRY POINT] Authentication
│   │   │   ├── auth.routes.ts       # POST /auth/login, /register, /exchange-token, etc.
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.validation.ts   # Zod schemas for all auth endpoints
│   │   │   └── user.model.ts        # Sequelize User model
│   │   │
│   │   ├── admin/                   # Admin user management
│   │   │   ├── userManagement.{routes,controller,service,types}.ts
│   │   │   ├── userRegistrationRequest.model.ts
│   │   │   └── users/               # Admin user CRUD + approval
│   │   │
│   │   ├── child/                   # Child profile CRUD
│   │   │   └── child.{routes,controller,service,repo,model,types,validation}.ts
│   │   │
│   │   ├── document/                # IEP document upload + AI analysis
│   │   │   ├── document.{routes,controller,service,repo,model,types,validation}.ts
│   │   │   ├── analysis.model.ts    # IEP analysis Sequelize model
│   │   │   ├── extraction.service.ts # AI text extraction pipeline
│   │   │   ├── normalization.service.ts
│   │   │   ├── correction.service.ts # Correction handling
│   │   │   ├── extraction-corrections.model.ts
│   │   │   ├── upload/              # File upload handling (multer)
│   │   │   ├── analysis/            # Analysis sub-workflows
│   │   │   └── types/promptschema.ts # AI prompt output schema (Zod)
│   │   │
│   │   ├── goal/                    # Goal tracking + progress entries
│   │   │   ├── goal.{routes,controller,service,repo,model,types,validation}.ts
│   │   │   ├── progress-entries.model.ts
│   │   │   ├── progress-entry.{controller,routes,service}.ts
│   │   │
│   │   ├── behavior/                # Behavior ABC logging
│   │   ├── compliance/              # Compliance log tracking
│   │   ├── communication/           # Contact/communication log
│   │   ├── letter/                  # AI letter generation (+ templates)
│   │   ├── advocacy/                # Advocacy Lab (sessions, insights, smart prompts)
│   │   ├── agent/
│   │   │   └── legal-support/       # Legal support AI agent
│   │   ├── ai/
│   │   │   ├── conversation/        # AI conversations
│   │   │   ├── analysis/            # AI analysis sub-pipelines
│   │   │   ├── gemini.service.ts    # Gemini-specific service
│   │   │   ├── conversation.model.ts
│   │   │   └── vectorEmbedding.model.ts
│   │   ├── smart-prompts/           # Role-aware contextual prompts
│   │   ├── config/
│   │   │   ├── admin/               # Admin config CRUD
│   │   │   └── public/              # Public config read
│   │   ├── consent/                 # Consent management
│   │   ├── resource/                # Educational resource library
│   │   ├── preference/              # User preferences
│   │   ├── dashboard/               # Dashboard aggregation
│   │   ├── lead/                    # Lead capture
│   │   ├── audit/                   # Audit log model + service
│   │   ├── service/                 # IEP services + service logs
│   │   └── storage/                 # GCS download proxy route
│   │
│   ├── db/                          # Database management
│   │   ├── cli.ts                   # Migration CLI entry (npm run db:migrate)
│   │   ├── seed-cli.ts              # Seed CLI entry (npm run db:seed)
│   │   ├── migrate.ts               # Migration runner
│   │   ├── seed.ts                  # Seed runner
│   │   ├── umzug.ts                 # Umzug + Sequelize connection setup
│   │   ├── migrations/              # 23 timestamped migrations (Jan–Feb 2026)
│   │   └── seeds/                   # Demo data seed (20260105-0001)
│   │
│   ├── cmd/                         # CLI utilities (not HTTP server)
│   │   ├── upload-cli.ts            # Upload config to GCS
│   │   ├── configuploader.ts
│   │   ├── storage.service.ts
│   │   └── user-storage.service.ts
│   │
│   └── generated/                   # Auto-generated files (do not edit)
│
├── dist/                            # Compiled output (tsc → dist/)
├── Dockerfile                       # Multi-stage Docker build for Cloud Run
├── Taskfile.yml                     # API-specific tasks
├── package.json                     # Dependencies + scripts
└── tsconfig.json                    # NodeNext ESM TypeScript config
```

---

## UI Part (`apps/ui/`) — Frontend

```
apps/ui/
├── src/
│   ├── main.tsx                     # [ENTRY] React root mount
│   ├── App.tsx                      # Provider stack assembly
│   ├── APITester.tsx                # Dev utility for API testing
│   │
│   ├── app/                         # Application-level code
│   │   ├── components/
│   │   │   └── ConsentOverlay.tsx   # First-visit consent UI
│   │   ├── pages/                   # Route-bound page components
│   │   │   ├── DashboardPage.tsx    # Main dashboard
│   │   │   ├── ChildProfilePage.tsx / ChildEditPage.tsx
│   │   │   ├── GoalProgressPage.tsx / GoalEditPage.tsx
│   │   │   ├── BehaviorABCPage.tsx / BehaviorEditPage.tsx
│   │   │   ├── ContactLogPage.tsx / ContactLogEditPage.tsx
│   │   │   ├── LetterWriterPage.tsx / LetterWriterEditPage.tsx
│   │   │   ├── AdvocacyLabEditPage.tsx
│   │   │   ├── CompliancePage.tsx / ComplianceEditPage.tsx
│   │   │   ├── ResourcesPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── ConsentPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── LoginPage.tsx / RegisterPage.tsx
│   │   │   └── admin/               # Admin-only pages
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx     # Firebase auth + JWT state
│   │   │   └── ThemeProvider.tsx    # Dark/light mode
│   │   ├── routing/
│   │   │   ├── AppRoutes.tsx        # Full route tree with title management
│   │   │   ├── RequireAuth.tsx      # Auth guard
│   │   │   └── RequireRole.tsx      # RBAC guard
│   │   ├── shell/
│   │   │   ├── AppShell.tsx         # Layout: Sidebar + Topbar + Outlet
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── Topbar.tsx           # Top bar (user menu, theme toggle)
│   │   │   ├── RoleSwitcher.tsx     # Dev role switcher
│   │   │   └── navConfig.ts         # Nav link config
│   │   └── ui/
│   │       ├── EmptyState.tsx
│   │       ├── LoadingState.tsx
│   │       └── PageHeader.tsx
│   │
│   ├── components/                  # Shared components
│   │   ├── auth/
│   │   │   └── ChangePasswordDialog.tsx
│   │   ├── ui/                      # Design system primitives (18 components)
│   │   ├── Login.tsx
│   │   └── NotificationContainer.tsx
│   │
│   ├── domain/                      # Domain-aligned feature code
│   │   ├── auth/                    # Auth service, roles, types
│   │   ├── child/                   # Child service + types
│   │   ├── iep/                     # IEP pages + service + API
│   │   ├── advocacy/                # Advocacy Lab page + service + API + components
│   │   ├── behavior/                # Behavior service + types
│   │   ├── legal/                   # Legal support page
│   │   └── admin/                   # Admin service + types
│   │
│   └── lib/                         # Utilities
│       ├── config.ts                # App config (API base URL, routes)
│       └── api.ts                   # apiRequest / apiLongRequest helpers
│
├── public/                          # Static assets (favicon, etc.)
├── Dockerfile                       # Multi-stage Docker build
├── Taskfile.yml
├── vite.config.ts                   # Vite + React + Tailwind plugin config
├── tailwind.config.ts               # Tailwind CSS 4 config
├── tsconfig.json                    # TypeScript config with @/* alias
└── package.json
```

---

## Infrastructure (`infra/`)

```
infra/
├── gcp/                             # GCP infrastructure management
│   ├── gen-gcp-infra.sh             # Provision Cloud Run + Cloud SQL
│   ├── gen-gcp-sa.sh                # Create GCP service accounts
│   ├── configure-db.sh              # Configure Cloud SQL database
│   ├── deploy-api-manual.sh         # Manual API deploy script
│   ├── deploy-secrets.sh            # Sync secrets to GCP Secret Manager
│   ├── run-db-proxy.sh              # Start Cloud SQL Auth Proxy locally
│   ├── setup-cloudrun-sa.sh         # Setup Cloud Run service account permissions
│   ├── grant-cloudrun-signurl-permission.sh
│   ├── upload-to-bucket.sh          # Upload files to GCS bucket
│   └── Taskfile.yml / Readme.md
│
├── local/                           # Local development infrastructure
│   ├── README.md                    # Local setup instructions
│   ├── gen-local-creds.sh           # Generate local SSL certificates
│   ├── postgres/
│   │   ├── initdb/                  # Postgres initialization SQL
│   │   ├── docker-entrypoint-wrapper.sh
│   │   └── pg_hba.conf              # Postgres auth config
│   └── redis/
│       └── redis.conf               # Redis config (password, persistence)
│
├── gh-actions/
│   └── deploy-api-current.sh        # Helper for GitHub Actions API deploy
│
├── telegram/                        # Telegram notification scripts
│   ├── get-chat-id.sh               # Get Telegram chat ID
│   └── send-test-message.sh         # Send test notification
│
└── gh-projectmanage/                # GitHub project management Go utilities
    ├── bulkinsert.go / bulkdelete.go / listissues.go
    └── new-user-stories.json / project_issues.csv
```

---

## Critical Integration Points

```
UI (apps/ui/)
    ↕ REST (HTTPS)
API (apps/api/)
    ├── PostgreSQL 16 + pgvector (Cloud SQL)
    ├── Google Cloud Storage (IEP PDFs)
    ├── Google Gemini AI (analysis + embeddings)
    └── Firebase Admin (token verification)

API deployed → GCP Cloud Run (iep-api-{env})
UI deployed  → GCP Cloud Run (iep-web-{env})
```

---

## Entry Points Summary

| Entry Point | File | Purpose |
|---|---|---|
| API Server | `apps/api/src/server.ts` | Start HTTP server |
| API App | `apps/api/src/app.ts` | Express app factory |
| Migration CLI | `apps/api/src/db/cli.ts` | Database migrations |
| Seed CLI | `apps/api/src/db/seed-cli.ts` | Database seeding |
| UI Root | `apps/ui/src/main.tsx` | React app mount |
| UI Routes | `apps/ui/src/app/routing/AppRoutes.tsx` | Route tree |
