# Deployment Guide — AskIEP

_Generated: 2026-02-21_

---

## Infrastructure Overview

AskIEP is deployed on **Google Cloud Platform**:

| Component | GCP Service | Name Pattern |
|---|---|---|
| API | Cloud Run | `iep-api-{env}` |
| UI | Cloud Run | `iep-web-{env}` |
| Database | Cloud SQL (PostgreSQL 16 + pgvector) | Cloud SQL instance |
| File Storage | Google Cloud Storage | GCS bucket |
| Config Storage | Google Cloud Storage | GCS config bucket |
| Container Registry | Artifact Registry | `{region}-docker.pkg.dev/{project}/iep-apps/` |
| Secrets | Environment Variables on Cloud Run | — |

**Environments**: `dev`, `production`

---

## CI/CD Pipeline

Deployment is triggered via **GitHub Actions** (manual dispatch only):

### API Deployment (`.github/workflows/deploy-api.yml`)

```
Trigger: workflow_dispatch or workflow_call
  ↓
Select environment (dev/production) + branch (main/dev/custom)
  ↓
Checkout selected ref
  ↓
Remove all .env files (prevent config drift)
  ↓
Google Auth (GCP Service Account Key from GitHub secret)
  ↓
Setup gcloud SDK
  ↓
Configure Docker for GCP Artifact Registry
  ↓
docker build apps/api/ → push {region}-docker.pkg.dev/{project}/iep-apps/api:{sha}
  ↓
google-github-actions/deploy-cloudrun@v2
  Service: iep-api-{env}
  Flags: --allow-unauthenticated --memory=1Gi --cpu=1 --min-instances=0 --max-instances=2 --timeout=900
  Cloud SQL: --add-cloudsql-instances={CLOUDSQL_CONNECTION_NAME}
  ↓
Output: Service URL
```

### UI Deployment (`.github/workflows/deploy-ui.yml`)

```
Trigger: workflow_dispatch or workflow_call
  ↓
Select environment + branch
  ↓
Checkout + remove .env files
  ↓
Google Auth + gcloud setup
  ↓
docker buildx build apps/ui/
  Build args: VITE_* environment variables (baked into build)
  Cache: registry cache from previous builds
  Push: {region}-docker.pkg.dev/{project}/iep-apps/web:{sha}
  ↓
deploy-cloudrun@v2
  Service: iep-web-{env}
  Flags: --allow-unauthenticated
  ↓
Output: Service URL
```

---

## Manual Deployment

### API (manual)

```sh
# Deploy to dev environment
task dev:deploy:api

# This runs:
# chmod +x deploy/deploy-api.sh
# ./deploy/deploy-api.sh
```

The `deploy/deploy-api.sh` script handles:
1. Building the Docker image
2. Pushing to Artifact Registry
3. Deploying to Cloud Run

### UI (manual)

```sh
task dev:deploy-ui

# Or:
./deploy/deploy-ui.sh
```

---

## Infrastructure Provisioning

New environment provisioning uses scripts in `infra/gcp/`:

```sh
# 1. Create GCP infrastructure (Cloud Run services, Cloud SQL, etc.)
./infra/gcp/gen-gcp-infra.sh

# 2. Create service accounts
./infra/gcp/gen-gcp-sa.sh

# 3. Configure Cloud SQL database
./infra/gcp/configure-db.sh

# 4. Setup Cloud Run service account permissions
./infra/gcp/setup-cloudrun-sa.sh

# 5. Grant Cloud Run signed URL permissions (for GCS)
./infra/gcp/grant-cloudrun-signurl-permission.sh

# 6. Deploy secrets to GCP Secret Manager
./infra/gcp/deploy-secrets.sh
```

---

## Environment Configuration

### API Secrets (GitHub → Cloud Run env vars)

These GitHub Actions secrets are injected as Cloud Run environment variables:

| Secret | Description |
|---|---|
| `GCP_SA_KEY` | GCP Service Account JSON (GitHub Auth) |
| `GCP_PROJECT_ID` | GCP Project ID |
| `GCP_REGION` | GCP region (default: `us-central1`) |
| `GCP_ARTIFACT_REPOSITORY` | Artifact Registry repo (default: `iep-apps`) |
| `POSTGRES_HOST/PORT/DB/USER/PASSWORD` | Cloud SQL connection |
| `POSTGRES_SSL_MODE` | `verify-ca` for production |
| `CLOUDSQL_CONNECTION_NAME` | e.g., `project:region:instance` |
| `JWT_EXPIRATION_TIME_IN_MINUTES` | Token lifetime |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GCS_BUCKET` | GCS bucket for IEP files |
| `GCS_CONFIG_BUCKET` | GCS config bucket |
| `CONFIG_ENCRYPTION_KEY` | Config encryption key |
| `RECAPTCHA_SECRET` / `RECAPTCHA_MIN_SCORE` | reCAPTCHA |
| `SES_SMTP_HOST/USER/PASS` | Email (SES) |
| `FROM_EMAIL_ADDRESS` / `NOTIFY_EMAILS` | Email config |
| `TELEGRAM_API_KEY` / `TELEGRAM_CHAT_ID` | Notifications |
| `APPFILE_GCP_SERVICE_ACCOUNT_FILE` | GCP SA file path in container |
| `APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE` | Firebase SA file path |

### UI Build Args (baked at build time)

| Secret | Description |
|---|---|
| `VITE_BASE_API_URL` | API URL for this environment |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA site key |
| `VITE_FIREBASE_*` | Firebase config (7 variables) |

---

## Syncing Secrets to GitHub

```sh
# Sync .env.dev → GitHub Actions "dev" environment secrets
task sync:dev

# Manual (internal task):
# task secrets:set GITHUB_ENVIRONMENT=dev ENV_FILE=.env.dev
```

Uses `secrets.go` (Go utility) to read the env file and push each key/value as a GitHub Actions environment secret via the GitHub CLI (`gh`).

---

## Cloud Run Configuration

### API Service

| Setting | Value |
|---|---|
| Memory | 1Gi |
| CPU | 1 |
| Min instances | 0 (scales to zero) |
| Max instances | 2 |
| Timeout | 900s |
| Authentication | Allow unauthenticated (API handles auth via JWT) |
| Cloud SQL | Connected via Unix socket (`/cloudsql/{connection-name}`) |

### UI Service

| Setting | Value |
|---|---|
| Authentication | Allow unauthenticated |
| Image | Nginx serving static Vite build |

---

## Database Migrations in Production

**Important**: Migrations must be run manually after deploying new API versions that include schema changes.

```sh
# Connect to production database via Cloud SQL Proxy
task start:cloudsqlproxy-dev  # (adjust for production)

# Run migrations against production DB
cd apps/api
POSTGRES_HOST=localhost POSTGRES_PORT=5499 ... npm run db:migrate
```

---

## Logs Monitoring

```sh
# Dev environment
task logs:api    # Cloud Run API logs (dev)
task logs:web    # Cloud Run UI logs (dev)

# Production
task prod:logs:api   # Cloud Run API logs (production)
task prod:logs:web   # Cloud Run UI logs (production)
```

Logs are fetched from **Google Cloud Logging** via `gcloud logging read` (historical) + `gcloud beta logging tail` (real-time).

---

## Docker Setup

### API Dockerfile

Located at `apps/api/Dockerfile`. Multi-stage build:
1. **Build stage**: `node:18-alpine` → `npm install && npm run build`
2. **Runtime stage**: `node:18-alpine` → copy `dist/` + production deps → `node dist/server.js`

### UI Dockerfile

Located at `apps/ui/Dockerfile`. Multi-stage build:
1. **Build stage**: `node:18-alpine` → inject `VITE_*` build args → `npm run build`
2. **Runtime stage**: `nginx:alpine` → serve `dist/` as static files

---

## Rollback

To roll back to a previous deployment:
1. Go to GitHub Actions → Run `deploy-api` or `deploy-ui`
2. Select `branch_choice=custom` and provide the previous commit SHA
3. The pipeline will build and deploy that specific commit

Or via GCP Console:
- Cloud Run → Service → Revisions → Traffic → redirect to previous revision
