#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# ASKIEP Production Project Bootstrap
# ============================================================
# Sets up the askiep-production GCP project with all required
# resources for deploying askiep.com (production).
#
# GCP Project: askiep-production (687499838077)
#
# This script provisions:
#   1. Enables required GCP APIs
#   2. Creates Artifact Registry for Docker images
#   3. Creates CI/CD service account (for GitHub Actions)
#   4. Creates Cloud Run service accounts (API + Web)
#   5. Creates GCS storage buckets
#   6. Outputs instructions for Cloud SQL + domain mapping
#
# Usage:
#   ./setup-production-project.sh
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - .env.production configured (copy from .env.production.template)
#   - Billing enabled on askiep-production project
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()      { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()     { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()     { err "$*"; exit 1; }
step()    { echo -e "\n${CYAN}${BOLD}━━━ Step $1: $2 ━━━${NC}\n"; }
banner()  { echo -e "\n${GREEN}${BOLD}$*${NC}\n"; }

# ============================================================
# Configuration
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.production"

banner "ASKIEP Production Project Bootstrap"
banner "Project: askiep-production (687499838077)"

# ============================================================
# Step 0: Validate prerequisites
# ============================================================
step "0" "Validating prerequisites"

for cmd in gcloud openssl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    die "Missing required command: $cmd"
  fi
  ok "$cmd installed"
done

if [[ ! -f "$ENV_FILE" ]]; then
  die "Production env file not found: $ENV_FILE\n   Copy .env.production.template to .env.production and fill in your values."
fi

set -a
source "$ENV_FILE"
set +a
ok "Loaded environment from $ENV_FILE"

# Validate it's the production project
if [[ "$GCP_PROJECT_ID" != "askiep-production" ]]; then
  die "GCP_PROJECT_ID must be 'askiep-production' but got '$GCP_PROJECT_ID'"
fi

# Check gcloud auth
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
  die "No active gcloud auth. Run: gcloud auth login"
fi

gcloud config set project "$GCP_PROJECT_ID" --quiet
ok "GCP project set to: $GCP_PROJECT_ID"

# ============================================================
# Step 1: Enable Required APIs
# ============================================================
step "1" "Enabling GCP APIs"

APIS=(
  "run.googleapis.com"
  "artifactregistry.googleapis.com"
  "sqladmin.googleapis.com"
  "sql-component.googleapis.com"
  "storage.googleapis.com"
  "secretmanager.googleapis.com"
  "firebase.googleapis.com"
  "identitytoolkit.googleapis.com"
  "iamcredentials.googleapis.com"
  "aiplatform.googleapis.com"
  "generativelanguage.googleapis.com"
  "firestore.googleapis.com"
  "cloudresourcemanager.googleapis.com"
)

for api in "${APIS[@]}"; do
  info "Enabling: $api"
  gcloud services enable "$api" --project="$GCP_PROJECT_ID" --quiet
done
ok "All APIs enabled"

# ============================================================
# Step 2: Create Artifact Registry
# ============================================================
step "2" "Creating Artifact Registry"

AR_REPO="${GCP_ARTIFACT_REPOSITORY:-iep-apps}"
if gcloud artifacts repositories describe "$AR_REPO" --location="$GCP_REGION" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
  ok "Artifact Registry exists: $AR_REPO"
else
  info "Creating Artifact Registry: $AR_REPO"
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$GCP_REGION" \
    --project="$GCP_PROJECT_ID" \
    --quiet
  ok "Created: $AR_REPO"
fi

# ============================================================
# Step 3: Create CI/CD Service Account
# ============================================================
step "3" "Creating CI/CD Service Account"

if [[ -n "${GCP_SA_NAME:-}" ]]; then
  info "Running gen-gcp-sa.sh for production..."
  chmod +x "$SCRIPT_DIR/gen-gcp-sa.sh"
  "$SCRIPT_DIR/gen-gcp-sa.sh"
  ok "CI/CD service account ready"
else
  warn "GCP_SA_NAME not set, skipping"
fi

# ============================================================
# Step 4: Create Cloud Run Service Accounts
# ============================================================
step "4" "Creating Cloud Run Service Accounts"

# API service account
if [[ -n "${CLOUD_RUN_SERVICE_NAME:-}" ]]; then
  info "Creating service account for: $CLOUD_RUN_SERVICE_NAME"
  chmod +x "$SCRIPT_DIR/setup-cloudrun-sa.sh"
  "$SCRIPT_DIR/setup-cloudrun-sa.sh"
  ok "API Cloud Run SA ready"
fi

# Web service account
export CLOUD_RUN_SERVICE_NAME="iep-web-production"
info "Creating service account for: $CLOUD_RUN_SERVICE_NAME"
"$SCRIPT_DIR/setup-cloudrun-sa.sh"
ok "Web Cloud Run SA ready"

# Restore
export CLOUD_RUN_SERVICE_NAME="${CLOUD_RUN_SERVICE_NAME:-iep-api-production}"

# ============================================================
# Step 5: Create GCS Storage Buckets
# ============================================================
step "5" "Creating GCS Storage Buckets"

create_bucket() {
  local bucket_name="$1"
  local description="$2"

  if [[ -z "$bucket_name" ]]; then
    warn "Bucket name empty for $description, skipping"
    return
  fi

  if gcloud storage buckets describe "gs://$bucket_name" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
    ok "Bucket exists: gs://$bucket_name ($description)"
  else
    info "Creating bucket: gs://$bucket_name ($description)"
    gcloud storage buckets create "gs://$bucket_name" \
      --project="$GCP_PROJECT_ID" \
      --location="$GCP_REGION" \
      --uniform-bucket-level-access \
      --quiet
    ok "Created: gs://$bucket_name"
  fi
}

create_bucket "${GCS_BUCKET:-iep-documents-prod}" "IEP document storage (production)"
create_bucket "${GCS_CONFIG_BUCKET:-iep-config-prod}" "Application config storage (production)"

# ============================================================
# Summary & Next Steps
# ============================================================
banner "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
banner "  Production Project Bootstrap Complete!"
banner "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}What was configured:${NC}"
echo "  - GCP APIs enabled"
echo "  - Artifact Registry: ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}"
echo "  - CI/CD SA: ${GCP_SA_NAME:-iep-ci-deployer-prod}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
echo "  - Cloud Run API SA: iep-api-production-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
echo "  - Cloud Run Web SA: iep-web-production-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
echo "  - GCS Bucket: gs://${GCS_BUCKET:-iep-documents-prod}"
echo "  - GCS Config: gs://${GCS_CONFIG_BUCKET:-iep-config-prod}"

echo ""
echo -e "${CYAN}Manual steps remaining:${NC}"
echo ""
echo -e "  ${BOLD}1. Create Cloud SQL Instance${NC}"
echo "     Go to: https://console.cloud.google.com/sql?project=askiep-production"
echo "     - Instance ID: iepdatabaseprod"
echo "     - Machine: db-custom-2-7680 (2 vCPU, 7.5GB RAM)"
echo "     - Storage: 100GB SSD"
echo "     - Enable automated backups + High Availability"
echo "     - Enable Public IP or configure Private IP"
echo ""
echo -e "  ${BOLD}2. Configure Database${NC}"
echo "     After Cloud SQL instance is created:"
echo "     cd infra/gcp && task prod:db:configure"
echo ""
echo -e "  ${BOLD}3. Set up Firebase${NC}"
echo "     Go to: https://console.firebase.google.com/"
echo "     - Add Firebase to askiep-production project"
echo "     - Enable Firebase Authentication (Google, Email/Password)"
echo "     - Copy Firebase config to .env.production"
echo "     - Generate Firebase Admin SDK service account key"
echo ""
echo -e "  ${BOLD}4. Configure GitHub Actions Secrets${NC}"
echo "     Go to: GitHub repo > Settings > Environments > production"
echo "     Set all secrets from .env.production + GCP_SA_KEY"
echo "     (GCP_SA_KEY = contents of ${GCP_SA_KEY_FILE_PATH:-~/.iepconfig/gcpcerts/production/gcpservice-account-key.json})"
echo ""
echo -e "  ${BOLD}5. Deploy Services${NC}"
echo "     Deploy API:  GitHub Actions > deploy-api > production"
echo "     Deploy Web:  GitHub Actions > deploy-ui > production"
echo "     Deploy Home: GitHub Actions > deploy-home > production"
echo ""
echo -e "  ${BOLD}6. Map Custom Domains${NC}"
echo "     Go to: https://console.cloud.google.com/run/domains?project=askiep-production"
echo "     - Map api.askiep.com    → iep-api-production"
echo "     - Map app.askiep.com    → iep-web-production"
echo "     (askiep.com → Cloudflare Workers proxy to Cloud Run web app)"
echo "     (www.askiep.com → Cloudflare Workers landing page)"
echo ""
echo -e "  ${BOLD}7. Deploy SSL Certificates${NC}"
echo "     cd infra/gcp && task deploy:secrets:api-prod"
echo ""
echo -e "${CYAN}Domain Architecture:${NC}"
echo "  askiep.com                   → Cloudflare Workers (proxies to Cloud Run web app)"
echo "  www.askiep.com               → Cloudflare Workers (home/landing page)"
echo "  app.askiep.com               → Cloud Run (web app UI, direct)"
echo "  api.askiep.com               → Cloud Run (API backend)"
echo ""
