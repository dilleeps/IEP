# Architecture — AskIEP API

_Part: `api` | Type: `backend` | Generated: 2026-02-21_

---

## Executive Summary

The AskIEP API is a **REST API backend** built with Express 5 and TypeScript, following a layered module architecture (router → controller → service → repository → model). It serves the React SPA, handles IEP document ingestion and AI analysis, manages authentication with JWT/Firebase, and exposes a Swagger UI for interactive API documentation.

---

## Technology Stack

| Category | Technology | Version | Notes |
|---|---|---|---|
| Language | TypeScript | 5.9.3 | NodeNext ESM; non-strict mode; `.js` import suffixes |
| Runtime | Node.js | 18+ | ESM modules |
| Framework | Express | 5.2.1 | Async error propagation built-in |
| ORM | Sequelize | 6.37.7 | `underscored: true`, `paranoid: true` on all domain models |
| Database | PostgreSQL | 16 | Via Cloud SQL; pgvector extension for embeddings |
| Auth | JWT + Firebase Admin | — | JWT for session tokens; Firebase for OAuth sign-in |
| AI/LLM | LangChain + @google/genai | 1.2.6 / 1.34.0 | Gemini Flash for document analysis and chat |
| Validation | Zod | 4.3.5 | All request bodies/params validated via middleware |
| Logging | Winston + express-winston | 3.19.0 | Structured JSON logs |
| Observability | OpenTelemetry | 0.208.0 | OTLP trace/metric export via gRPC |
| API Docs | swagger-jsdoc + swagger-ui-express | — | Available at `/api-docs` |
| File Storage | @google-cloud/storage | 7.18.0 | GCS bucket for IEP PDFs |
| Email | Nodemailer | 7.0.12 | Via Amazon SES SMTP |
| Rate Limiting | express-rate-limit | 7.5.0 | Global + auth-specific limits |
| Testing | Vitest + testcontainers + supertest | 3.2.4 | Integration tests with real Postgres containers |

---

## Architecture Pattern

**Layered Module Architecture** (Domain-Driven)

```
src/
├── server.ts            # Entry point — starts HTTP server
├── app.ts               # Express app factory — middleware + route mounting
├── config/              # Environment config, Firebase, Sequelize, Swagger, Logger, OTel
├── middleware/          # Cross-cutting: auth, RBAC, rate limit, validate, audit, error
├── shared/              # Shared utilities: AI services, base repo, email, GCS, streaming
├── health/              # GET /health — liveness check
├── modules/             # Domain modules (one folder per domain)
│   ├── auth/            # Registration, login, token exchange, password change
│   ├── admin/           # Admin user management, approval workflow
│   ├── child/           # Child profile CRUD
│   ├── document/        # IEP document upload, storage, AI analysis
│   ├── goal/            # Goal progress tracking + progress entries
│   ├── behavior/        # Behavior ABC logging
│   ├── compliance/      # Compliance log tracking
│   ├── communication/   # Contact/communication log
│   ├── letter/          # AI letter generation
│   ├── advocacy/        # AI advocacy sessions (Advocacy Lab)
│   ├── agent/           # AI agent modules (legal support)
│   ├── ai/              # AI conversations, Gemini service
│   ├── smart-prompts/   # Role-aware contextual prompts
│   ├── config/          # System configuration (public + admin)
│   ├── consent/         # Consent management
│   ├── resource/        # Educational resource library
│   ├── preference/      # User preference settings
│   ├── dashboard/       # Dashboard aggregation views
│   ├── lead/            # Lead capture (public landing page)
│   └── storage/         # GCS download proxy
└── db/                  # Sequelize migrations, seeds, CLI
```

Each module follows the pattern:
```
module/
├── module.routes.ts      # Express Router, applies middleware
├── module.controller.ts  # HTTP handler, delegates to service
├── module.service.ts     # Business logic
├── module.repo.ts        # Database access (extends BaseRepo)
├── module.model.ts       # Sequelize model definition
├── module.types.ts       # TypeScript interfaces / DTOs
└── module.validation.ts  # Zod schemas for request validation
```

---

## API Route Structure

All API routes are mounted under `/api/v1`.

| Route Prefix | Auth Required | Role | Description |
|---|---|---|---|
| `GET /health` | No | — | Liveness check |
| `GET /api-docs` | No | — | Swagger UI |
| `/api/v1/auth/*` | No (public) | — | Registration, login, token exchange |
| `/api/v1/leads/*` | No / Admin | — | Lead capture (public + admin) |
| `/api/v1/config` | No | — | Public system config |
| `/api/v1/children/*` | JWT | Any | Child profile CRUD |
| `/api/v1/iep/*` | JWT | Any | IEP document upload + analysis |
| `/api/v1/goals/*` | JWT | Any | Goal progress |
| `/api/v1/progress-entries/*` | JWT | Any | Goal progress entries |
| `/api/v1/services/*` | JWT | Any | IEP services |
| `/api/v1/compliance/*` | JWT | Any | Compliance logs |
| `/api/v1/communications/*` | JWT | Any | Communication logs |
| `/api/v1/behaviors/*` | JWT | Any | Behavior ABC logs |
| `/api/v1/letters/*` | JWT | Any | AI letter generation |
| `/api/v1/advocacy/*` | JWT | Any | Advocacy Lab sessions |
| `/api/v1/agent/legal-support/*` | JWT | Any | Legal support AI agent |
| `/api/v1/resources/*` | JWT | Any | Resource library |
| `/api/v1/settings/preferences/*` | JWT (inside) | Any | User preferences |
| `/api/v1/dashboard/*` | JWT (inside) | Any | Dashboard aggregates |
| `/api/v1/ai/conversations/*` | JWT (inside) | Any | AI conversations |
| `/api/v1/smart-prompts/*` | JWT (inside) | Any | Smart prompts |
| `/api/v1/storage/*` | JWT (inside) | Any | GCS download proxy |
| `/api/v1/consents/*` | — | — | Consent management |
| `/api/v1/admin/config/*` | JWT | ADMIN | System configuration |
| `/api/v1/admin/users/*` | JWT | ADMIN | User management |
| `/api/v1/admin/user-management/*` | JWT | ADMIN | Approval workflow |

---

## Authentication & Security

### JWT Flow
1. User calls `POST /api/v1/auth/login` → receives `accessToken` (JWT) + `refreshToken`
2. UI sends `Authorization: Bearer <token>` on every protected request
3. `authenticate` middleware verifies the JWT using `JWT_SECRET` env var
4. Non-PARENT users must have `isApproved: true` in the JWT payload
5. `requireRole` middleware enforces RBAC (e.g., ADMIN-only routes)
6. `requireResourceOwnership` middleware enforces per-user data isolation

### Firebase Integration
- Used for Google/Social OAuth sign-in on the frontend
- Backend has `POST /api/v1/auth/exchange-token` to exchange Firebase ID tokens for app JWTs
- Firebase Admin SDK initialized from a service account file (env path)

### Security Middleware Stack
```
apiRateLimit          → global rate limiting
requestContext        → trace IDs injected
authenticate          → JWT verification (on protected routes)
requireRole           → RBAC enforcement
requireResourceOwnership → owner-only data access
validateBody/query    → Zod schema validation
auditLog              → action logging
errorHandler          → unified JSON error responses (with traceId)
```

---

## Data Architecture

See [Data Models](./data-models-api.md) for full schema documentation.

**Core entities:**
- `users` — accounts with roles and approval state
- `child_profiles` — children linked to users (paranoid, soft-delete)
- `iep_documents` — uploaded IEP PDFs with AI analysis results
- `iep_analyses` — AI-extracted goals, accommodations, risk scores
- `goal_progress` — individual goal tracking records
- `progress_entries` — time-series progress measurements per goal
- `behavior_logs` — ABC behavior event records
- `compliance_logs` — service delivery compliance tracking
- `communication_logs` — school contact history
- `vector_embeddings` — pgvector embeddings (768-dim, IVFFlat index)
- `letters` — AI-generated letters
- `advocacy_sessions` — Advocacy Lab AI conversation history
- `resources` — educational resource library

---

## AI/LLM Architecture

```
Document Upload → GCS Storage
      ↓
AI Extraction (Gemini Flash)
      ↓
IEP Analysis → iep_analyses table
  • summary, goals[], accommodations[], red_flags[]
  • risk_score, risk_level
  • ai_model, ai_tokens_used
      ↓
Vector Embedding (gemini-embedding-001 → 768-dim)
      ↓
pgvector store (IVFFlat cosine similarity index)
      ↓
Semantic search in Advocacy Lab / Legal Support
```

**LangChain** is used for:
- Structured document extraction pipelines
- Conversation chains in Advocacy Lab
- Legal support agent with tool use

**@google/genai** (Gemini) is used for:
- Raw document analysis and generation
- Embedding generation

---

## Entry Points

| File | Purpose |
|---|---|
| `src/server.ts` | HTTP server startup, `initDb()` call, port binding |
| `src/app.ts` | Express app factory — middleware registration, route mounting |
| `src/db/cli.ts` | Migration CLI entry point (`npm run db:migrate`) |
| `src/db/seed-cli.ts` | Seed CLI entry point (`npm run db:seed`) |
| `src/cmd/upload-cli.ts` | Utility CLI for uploading config to GCS |

---

## Testing Strategy

| Layer | Tool | Location |
|---|---|---|
| Unit | Vitest | `apps/api/tests/unit/` |
| Integration | Vitest + testcontainers | `apps/api/tests/integration/` |
| E2E | Vitest + supertest | `apps/api/tests/e2e/` |

- `testcontainers` spins up a real PostgreSQL container for integration tests
- `DATABASE_URL` injected by container; `NODE_ENV=test` disables some middleware
- Fixtures in `tests/__fixtures__/` (if added)

---

## Shared Services

| Service | Path | Description |
|---|---|---|
| `ai.service.ts` | `shared/ai/` | Wrapper around Gemini API |
| `langchainAi.service.ts` | `shared/ai/` | LangChain chain orchestration |
| `vectorDb.service.ts` | `shared/ai/` | pgvector CRUD + similarity search |
| `base.repo.ts` | `shared/db/` | Generic CRUD repo base class |
| `base.service.ts` | `shared/service/` | Base service pattern |
| `email.ts` | `shared/notification/` | Nodemailer/SES email sending |
| `telegram.ts` | `shared/notification/` | Telegram bot notifications |
| `gcs.ts` | `shared/storage/` | Google Cloud Storage client |
| `userStorageService.ts` | `shared/storage/` | Per-user GCS folder management |
| `ndjson-stream.ts` | `shared/streaming/` | NDJSON streaming for AI responses |
| `appError.ts` | `shared/errors/` | `AppError` class (statusCode, code, details) |
