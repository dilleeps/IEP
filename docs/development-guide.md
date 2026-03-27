# Development Guide — AskIEP

_Generated: 2026-02-21_

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ | API + UI runtime |
| npm | 9+ | Package management |
| Docker + Docker Compose | Latest | Local Postgres + Redis |
| Task (Taskfile) | Latest | Task runner |
| git-crypt | Latest | Secret decryption (optional for local dev) |
| Go | 1.21+ | GitHub project management utilities (optional) |
| gh (GitHub CLI) | Latest | GitHub operations (optional) |

Install Task: [https://taskfile.dev/installation/](https://taskfile.dev/installation/)

---

## Initial Setup

### 1. Clone and Decrypt Secrets

```sh
git clone <repo-url>
cd iepapp

# If you have the git-crypt key (obtain from team member):
task install:crypt
task decrypt
```

### 2. Create Environment File

Create `.env` in the project root:

```env
# Database (local Docker)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=iepapp
POSTGRES_USER=appuser
POSTGRES_PASSWORD=changeme

# Redis (local Docker)
REDIS_PORT=6379
REDIS_PASSWORD=changeme

# Auth
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRATION_TIME_IN_MINUTES=1440

# AI (Google Gemini)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest
AI_MODEL=gemini-flash-latest
AI_TEMPERATURE=0.3

# Firebase (for Firebase OAuth)
# Get from Firebase Console → Project Settings → Service Account
APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE=./infra/certs/firebase-service-account.json

# Google Cloud Storage (optional for local dev)
ENABLE_S3=false
GCS_BUCKET=your-bucket-name

# Email (optional for local dev)
SES_SMTP_HOST=smtp.example.com
SES_SMTP_USER=your-smtp-user
SES_SMTP_PASS=your-smtp-password
FROM_EMAIL_ADDRESS=noreply@askiep.com
```

### 3. Install Dependencies

```sh
# API
cd apps/api && npm install && cd ../..

# UI
cd apps/ui && npm install && cd ../..
```

### 4. Start Local Database

```sh
task start:postgres
```

This starts:
- PostgreSQL 16 (pgvector) on port 5432
- Redis 7 on port 6379
- Runs `initDb()` / setup-db automatically

### 5. Run Migrations and Seeds

```sh
cd apps/api

# Run all migrations
npm run db:migrate

# Run seed data (creates demo users)
npm run db:seed
```

**Demo Users (after seeding):**

| Role | Email | Password |
|---|---|---|
| Parent | parent@askiep.com | Demo123 |
| Advocate | advocate@askiep.com | Demo123 |
| Teacher | teacher@askiep.com | Demo123 |
| Admin | admin@askiep.com | Demo123 |

> Note: Advocate and Teacher accounts require admin approval before login.

---

## Running Development Servers

### API

```sh
# From project root:
task dev:api

# Or from apps/api/:
npm run dev
```

API runs on `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api-docs`
- Health check: `http://localhost:3000/health`

### UI

```sh
# From project root (separate terminal):
task dev:ui

# Or from apps/ui/:
npm run dev
```

UI runs on `http://localhost:5173` (Vite default)

---

## Database Management

All DB commands run from `apps/api/`:

```sh
# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:down

# Show migration status
npm run db:migrate:status

# Run all seeds
npm run db:seed

# Rollback last seed
npm run db:seed:down

# Show seed status
npm run db:seed:status
```

Or via Taskfile from root:
```sh
task -t apps/api/Taskfile.yml db:migrate
task -t apps/api/Taskfile.yml db:seed
```

---

## Testing

### API Tests (Vitest + testcontainers)

```sh
cd apps/api

# Run all tests (one-shot)
npm run test

# Watch mode
npm run test:watch
```

Tests use `testcontainers` to spin up a real PostgreSQL 16 container. Ensure Docker is running before executing tests.

Test structure:
```
apps/api/tests/
├── unit/           # Pure unit tests (no DB)
├── integration/    # Vitest + testcontainers (real DB)
└── e2e/            # Supertest HTTP tests
```

### UI Tests

Currently no automated UI tests are configured. Manual testing via browser recommended.

---

## Building for Production

### API

```sh
cd apps/api
npm run build
# Output: dist/
```

The compiled JS is placed in `dist/`. The Docker build in `apps/api/Dockerfile` handles this automatically.

### UI

```sh
cd apps/ui
npm run build
# Output: dist/
```

Vite bundles to `dist/`. The Dockerfile handles this in CI.

---

## Code Quality

### Linting

```sh
# API (ESLint flat config)
cd apps/api && npm run lint

# UI
cd apps/ui && npm run lint
```

### Formatting (API only — Prettier)

```sh
cd apps/api && npx prettier --write src/
```

### Style Conventions

- 2-space indent, single quotes, trailing commas
- API: `snake_case` for DB column names, `camelCase` for TypeScript
- API: NodeNext ESM — all local imports must use `.js` extension
- UI: `@/*` path alias for `src/` imports
- Avoid raw `fetch` in UI — always use `apiRequest`/`apiLongRequest`

---

## Environment Configuration

### API Configuration Sources

The API uses a layered config approach:

1. `.env` file (loaded via `tsx --env-file=../../.env` in dev)
2. Environment variables (Cloud Run in production)
3. File-based config via `appenv.getAsFilePath()` for cert/key paths

Key environment variables:

| Variable | Description |
|---|---|
| `JWT_SECRET` | JWT signing secret (required) |
| `JWT_EXPIRATION_TIME_IN_MINUTES` | Token lifetime |
| `POSTGRES_HOST/PORT/DB/USER/PASSWORD` | Database connection |
| `POSTGRES_SSL_MODE` | `disable` (local) or `verify-ca` (production) |
| `CLOUDSQL_CONNECTION_NAME` | Cloud SQL connection string (production) |
| `DB_SOCKET_PATH` | Cloud SQL Unix socket (production) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GCS_BUCKET` | GCS bucket for IEP file storage |
| `ENABLE_S3` | `true`/`false` — enable GCS storage |
| `APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE` | Path to Firebase SA JSON |
| `APPFILE_GCP_SERVICE_ACCOUNT_FILE` | Path to GCP SA JSON |
| `ENABLE_HTTP_LOGGING` | `true`/`false` — HTTP request logging |
| `SES_SMTP_*` / `FROM_EMAIL_ADDRESS` | Email configuration |
| `TELEGRAM_API_KEY` / `TELEGRAM_CHAT_ID` | Telegram notifications |

### UI Environment Variables (Vite `VITE_*`)

| Variable | Description |
|---|---|
| `VITE_BASE_API_URL` | API base URL (e.g., `https://api.askiep.com`) |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key |
| `VITE_FIREBASE_API_KEY` | Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics |

---

## Secret Management

Secrets are managed with **git-crypt** (encrypted in the repository):

```sh
# Decrypt secrets (need git-crypt-key)
task decrypt

# Sync .env.dev → GitHub Actions secrets (dev environment)
task sync:dev

# Check tool installation status
task status
```

**Never commit unencrypted `.env` files or service account JSON files.**

---

## Local Cloud SQL Proxy (for dev with Cloud SQL)

If you need to connect to the dev Cloud SQL instance locally:

```sh
# Set up .env.dev with GCP_PROJECT_ID and CLOUDSQL_CONNECTION_NAME
task start:cloudsqlproxy-dev
# Connects on port 5499
```

---

## Taskfile Reference

Run `task --list` to see all available tasks. Key tasks:

| Task | Description |
|---|---|
| `task start:postgres` | Start local Postgres + Redis + run migrations |
| `task stop:postgres` | Stop local containers |
| `task clean:postgres` | Stop + remove volumes |
| `task dev:api` | Start API dev server (hot-reload) |
| `task dev:ui` | Start UI dev server (HMR) |
| `task dev:deploy:api` | Deploy API to Cloud Run dev |
| `task dev:deploy-ui` | Deploy UI to Cloud Run dev |
| `task logs:api` | Tail Cloud Run API logs (dev) |
| `task logs:web` | Tail Cloud Run UI logs (dev) |
| `task decrypt` | Decrypt git-crypt secrets |
| `task sync:dev` | Sync secrets to GitHub dev environment |
| `task status` | Check tool installation status |
