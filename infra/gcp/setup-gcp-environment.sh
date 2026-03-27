#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# ASKIEP - Full GCP Environment Setup
# ============================================================
# Orchestrates the complete setup of a GCP environment for ASKIEP:
#   1. Validates prerequisites
#   2. Creates CI/CD service account
#   3. Sets up infrastructure (Artifact Registry, APIs)
#   4. Creates Cloud Run runtime service account
#   5. Creates GCS storage buckets
#   6. Configures Cloud SQL database (if instance exists)
#   7. Deploys SSL certificates to Secret Manager
#
# Usage:
#   ./setup-gcp-environment.sh [dev|production]
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - .env.dev or .env.production configured
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Logging helpers
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()      { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()     { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()     { err "$*"; exit 1; }
step()    { echo -e "\n${CYAN}${BOLD}━━━ Step $1: $2 ━━━${NC}\n"; }
banner()  { echo -e "\n${GREEN}${BOLD}$*${NC}\n"; }

# ============================================================
# Parse arguments
# ============================================================
ENVIRONMENT="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

case "$ENVIRONMENT" in
  dev)        ENV_FILE="$PROJECT_ROOT/.env.dev" ;;
  production) ENV_FILE="$PROJECT_ROOT/.env.production" ;;
  *) die "Invalid environment: $ENVIRONMENT (use 'dev' or 'production')" ;;
esac

banner "ASKIEP GCP Environment Setup - ${ENVIRONMENT^^}"

# ============================================================
# Step 0: Validate prerequisites
# ============================================================
step "0" "Validating prerequisites"

# Check required commands
for cmd in gcloud openssl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    die "Missing required command: $cmd"
  fi
  ok "$cmd installed"
done

# Check env file
if [[ ! -f "$ENV_FILE" ]]; then
  die "Environment file not found: $ENV_FILE\n   Copy .env.dev.template to $ENV_FILE and fill in your values."
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a
ok "Loaded environment from $ENV_FILE"

# Validate critical variables
REQUIRED_VARS=(GCP_PROJECT_ID GCP_REGION POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD)
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    die "Required variable $var is not set in $ENV_FILE"
  fi
done
ok "All required variables are set"

# Check gcloud auth
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
  die "No active gcloud auth. Run: gcloud auth login"
fi
ok "gcloud authenticated"

# Set project
gcloud config set project "$GCP_PROJECT_ID" --quiet
ok "GCP project set to: $GCP_PROJECT_ID"

# ============================================================
# Step 1: Create CI/CD Service Account
# ============================================================
step "1" "Creating CI/CD Service Account"

if [[ -n "${GCP_SA_NAME:-}" ]]; then
  info "Running gen-gcp-sa.sh..."
  chmod +x "$SCRIPT_DIR/gen-gcp-sa.sh"
  "$SCRIPT_DIR/gen-gcp-sa.sh"
else
  warn "GCP_SA_NAME not set, skipping CI/CD service account creation"
fi

# ============================================================
# Step 2: Set up GCP Infrastructure (Artifact Registry + APIs)
# ============================================================
step "2" "Setting up GCP Infrastructure"

info "Running gen-gcp-infra.sh..."
chmod +x "$SCRIPT_DIR/gen-gcp-infra.sh"
"$SCRIPT_DIR/gen-gcp-infra.sh"

# ============================================================
# Step 3: Create Cloud Run Runtime Service Account
# ============================================================
step "3" "Creating Cloud Run Runtime Service Account"

if [[ -n "${CLOUD_RUN_SERVICE_NAME:-}" ]]; then
  info "Running setup-cloudrun-sa.sh..."
  chmod +x "$SCRIPT_DIR/setup-cloudrun-sa.sh"
  "$SCRIPT_DIR/setup-cloudrun-sa.sh"
else
  warn "CLOUD_RUN_SERVICE_NAME not set, skipping Cloud Run SA creation"
fi

# ============================================================
# Step 4: Create GCS Storage Buckets
# ============================================================
step "4" "Creating GCS Storage Buckets"

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

create_bucket "${GCS_BUCKET:-}" "IEP document storage"
create_bucket "${GCS_CONFIG_BUCKET:-}" "Application config storage"

# ============================================================
# Step 5: Configure Cloud SQL Database
# ============================================================
step "5" "Configuring Cloud SQL Database"

INSTANCEID="${INSTANCEID:-}"
if [[ -z "$INSTANCEID" ]]; then
  warn "INSTANCEID not set, skipping database configuration"
  warn "Create a Cloud SQL instance manually in GCP Console, then re-run this script"
else
  # Check if instance exists
  ENGINE="$(gcloud sql instances describe "$INSTANCEID" --project "$GCP_PROJECT_ID" --format="value(databaseVersion)" 2>/dev/null || true)"

  if [[ -z "$ENGINE" ]]; then
    warn "Cloud SQL instance '$INSTANCEID' not found"
    echo ""
    echo -e "${YELLOW}To create a Cloud SQL instance:${NC}"
    echo "  1. Go to https://console.cloud.google.com/sql?project=$GCP_PROJECT_ID"
    echo "  2. Create Instance > PostgreSQL"
    echo "  3. Instance ID: $INSTANCEID"
    if [[ "$ENVIRONMENT" == "dev" ]]; then
      echo "  4. Machine: db-f1-micro (shared, 614MB RAM)"
      echo "  5. Storage: 10GB SSD"
    else
      echo "  4. Machine: db-custom-2-7680 (2 vCPU, 7.5GB RAM)"
      echo "  5. Storage: 100GB SSD, enable backups + HA"
    fi
    echo "  6. Enable Public IP or configure Private IP"
    echo ""
    echo -e "${YELLOW}After creating the instance, re-run this script.${NC}"
  else
    ok "Cloud SQL instance found: $INSTANCEID (engine: $ENGINE)"
    info "Running configure-db.sh..."
    chmod +x "$SCRIPT_DIR/configure-db.sh"
    "$SCRIPT_DIR/configure-db.sh"
  fi
fi

# ============================================================
# Step 6: Deploy SSL Certificates to Secret Manager
# ============================================================
step "6" "Deploying Secrets to Secret Manager"

# Check if certificates exist locally
PG_CA_CERT_PATH="${PG_CA_CERT_PATH:-~/.iepconfig/certs/gcp/postgres/ca.crt}"
PG_CA_CERT_PATH="${PG_CA_CERT_PATH/#\~/$HOME}"

if [[ -f "$PG_CA_CERT_PATH" ]]; then
  info "SSL certificates found, deploying to Secret Manager..."
  chmod +x "$SCRIPT_DIR/deploy-secrets.sh"
  "$SCRIPT_DIR/deploy-secrets.sh"
else
  warn "SSL certificates not found at $PG_CA_CERT_PATH"
  warn "Secrets will be deployed after database is configured"
fi

# ============================================================
# Summary
# ============================================================
banner "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
banner "  Setup Complete for: ${ENVIRONMENT^^}"
banner "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}What was configured:${NC}"
echo "  - GCP APIs enabled"
echo "  - Artifact Registry: ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPOSITORY:-iep-apps}"
[[ -n "${GCP_SA_NAME:-}" ]] && echo "  - CI/CD Service Account: ${GCP_SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
[[ -n "${CLOUD_RUN_SERVICE_NAME:-}" ]] && echo "  - Cloud Run SA: ${CLOUD_RUN_SERVICE_NAME}-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
[[ -n "${GCS_BUCKET:-}" ]] && echo "  - GCS Bucket: gs://${GCS_BUCKET}"
[[ -n "${GCS_CONFIG_BUCKET:-}" ]] && echo "  - GCS Config Bucket: gs://${GCS_CONFIG_BUCKET}"

echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. If Cloud SQL instance doesn't exist, create it in GCP Console"
echo "  2. Re-run this script to configure database + deploy certs"
echo "  3. Deploy API: task dev:deploy:api (or via GitHub Actions)"
echo "  4. Deploy UI: task dev:deploy-ui (or via GitHub Actions)"
echo "  5. Map custom domains: https://console.cloud.google.com/run/domains?project=$GCP_PROJECT_ID"
echo ""
echo -e "${CYAN}GitHub Actions secrets needed:${NC}"
echo "  - GCP_SA_KEY: contents of ${GCP_SA_KEY_FILE_PATH:-~/.iepconfig/gcpcerts/dev/gcpservice-account-key.json}"
echo "  - All variables from $ENV_FILE"
echo ""
echo -e "${CYAN}Sync secrets to GitHub:${NC}"
echo "  task sync:dev"
echo ""
