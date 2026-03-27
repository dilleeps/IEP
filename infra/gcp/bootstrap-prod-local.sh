#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# ASKIEP Production Bootstrap - Run on your local machine
# ============================================================
# Prerequisites:
#   - gcloud CLI installed
#   - You are an Owner of askiep-production project
#   - Billing enabled on askiep-production
# ============================================================

PROJECT_ID="askiep-production"
REGION="us-central1"
SA_NAME="iep-ci-deployer-prod"
SA_DISPLAY_NAME="IEP CI Deployer Production"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="$HOME/.iepconfig/gcpcerts/production/gcpservice-account-key.json"

AR_REPO="iep-apps"
GCS_BUCKET="iep-documents-prod"
GCS_CONFIG_BUCKET="iep-config-prod"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=============================================="
echo "  ASKIEP Production Bootstrap"
echo "  Project: ${PROJECT_ID}"
echo -e "==============================================${NC}"
echo ""

# ── Step 0: Auth ────────────────────────────────────────────
echo -e "${YELLOW}[Step 0] Authenticating...${NC}"
gcloud auth login --quiet 2>/dev/null || gcloud auth login
gcloud config set project "$PROJECT_ID" --quiet
echo -e "${GREEN}✅ Authenticated & project set${NC}"
echo ""

# ── Step 1: Enable APIs ────────────────────────────────────
echo -e "${YELLOW}[Step 1] Enabling GCP APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  sql-component.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  firebase.googleapis.com \
  identitytoolkit.googleapis.com \
  iamcredentials.googleapis.com \
  aiplatform.googleapis.com \
  generativelanguage.googleapis.com \
  firestore.googleapis.com \
  cloudresourcemanager.googleapis.com \
  cloudbuild.googleapis.com \
  --project="$PROJECT_ID" --quiet
echo -e "${GREEN}✅ All APIs enabled${NC}"
echo ""

# ── Step 2: Artifact Registry ──────────────────────────────
echo -e "${YELLOW}[Step 2] Creating Artifact Registry...${NC}"
if gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Artifact Registry exists: $AR_REPO${NC}"
else
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --quiet
  echo -e "${GREEN}✅ Created Artifact Registry: $AR_REPO${NC}"
fi
echo ""

# ── Step 3: CI/CD Service Account ──────────────────────────
echo -e "${YELLOW}[Step 3] Creating CI/CD service account...${NC}"
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" >/dev/null 2>&1; then
  echo -e "${GREEN}✅ SA exists: $SA_EMAIL${NC}"
else
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="$SA_DISPLAY_NAME" \
    --quiet
  echo -e "${GREEN}✅ Created: $SA_EMAIL${NC}"
fi

ROLES=(
  "roles/editor"
  "roles/iam.serviceAccountUser"
  "roles/run.admin"
  "roles/artifactregistry.admin"
  "roles/storage.admin"
  "roles/storage.objectAdmin"
  "roles/cloudsql.admin"
  "roles/secretmanager.admin"
  "roles/firebase.admin"
  "roles/serviceusage.serviceUsageAdmin"
  "roles/cloudbuild.builds.editor"
)

echo "  Granting IAM roles..."
for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" \
    --quiet >/dev/null 2>&1
  echo "    ✓ $role"
done

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="$PROJECT_ID" \
  --quiet >/dev/null 2>&1
echo "    ✓ roles/iam.serviceAccountTokenCreator (self-signing)"
echo -e "${GREEN}✅ CI/CD SA roles granted${NC}"
echo ""

# ── Step 4: Cloud Run Service Accounts ─────────────────────
echo -e "${YELLOW}[Step 4] Creating Cloud Run runtime service accounts...${NC}"

create_cloudrun_sa() {
  local sa_name="$1"
  local display="$2"
  local sa_email="${sa_name}@${PROJECT_ID}.iam.gserviceaccount.com"

  if gcloud iam service-accounts describe "$sa_email" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Exists: $sa_email${NC}"
  else
    gcloud iam service-accounts create "$sa_name" \
      --project="$PROJECT_ID" \
      --display-name="$display" \
      --quiet
    echo -e "  ${GREEN}✅ Created: $sa_email${NC}"
  fi

  # Grant runtime roles
  for role in roles/storage.objectViewer roles/secretmanager.secretAccessor roles/cloudsql.client; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:${sa_email}" \
      --role="$role" \
      --quiet >/dev/null 2>&1
  done

  # Self-signing for presigned URLs
  gcloud iam service-accounts add-iam-policy-binding "$sa_email" \
    --member="serviceAccount:${sa_email}" \
    --role="roles/iam.serviceAccountTokenCreator" \
    --project="$PROJECT_ID" \
    --quiet >/dev/null 2>&1

  echo "    Roles: objectViewer, secretAccessor, cloudsql.client, tokenCreator"
}

create_cloudrun_sa "iep-api-production-sa" "IEP API Production Runtime"
create_cloudrun_sa "iep-web-production-sa" "IEP Web Production Runtime"
echo -e "${GREEN}✅ Cloud Run SAs ready${NC}"
echo ""

# ── Step 5: GCS Buckets ────────────────────────────────────
echo -e "${YELLOW}[Step 5] Creating GCS buckets...${NC}"

create_bucket() {
  local bucket="$1"
  local desc="$2"
  if gcloud storage buckets describe "gs://$bucket" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Exists: gs://$bucket ($desc)${NC}"
  else
    gcloud storage buckets create "gs://$bucket" \
      --project="$PROJECT_ID" \
      --location="$REGION" \
      --uniform-bucket-level-access \
      --quiet
    echo -e "  ${GREEN}✅ Created: gs://$bucket ($desc)${NC}"
  fi
}

create_bucket "$GCS_BUCKET" "IEP document storage"
create_bucket "$GCS_CONFIG_BUCKET" "App config storage"
echo ""

# ── Step 6: Generate SA Key ───────────────────────────────
echo -e "${YELLOW}[Step 6] Generating CI/CD service account key...${NC}"
mkdir -p "$(dirname "$KEY_FILE")"

if [[ -f "$KEY_FILE" ]]; then
  echo -e "  ${YELLOW}⚠️  Key file exists: $KEY_FILE${NC}"
  read -p "  Overwrite? (y/N): " overwrite
  if [[ "$overwrite" =~ ^[Yy]$ ]]; then
    rm -f "$KEY_FILE"
  else
    echo "  Keeping existing key."
  fi
fi

if [[ ! -f "$KEY_FILE" ]]; then
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL" \
    --project="$PROJECT_ID" \
    --quiet
  chmod 600 "$KEY_FILE"
  echo -e "${GREEN}✅ Key saved: $KEY_FILE${NC}"
fi
echo ""

# ── Summary ────────────────────────────────────────────────
echo -e "${GREEN}=============================================="
echo "  ✅ Production Bootstrap Complete!"
echo "==============================================${NC}"
echo ""
echo "Created:"
echo "  ├── APIs: all enabled"
echo "  ├── Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"
echo "  ├── CI/CD SA: ${SA_EMAIL}"
echo "  ├── API Runtime SA: iep-api-production-sa@${PROJECT_ID}.iam.gserviceaccount.com"
echo "  ├── Web Runtime SA: iep-web-production-sa@${PROJECT_ID}.iam.gserviceaccount.com"
echo "  ├── GCS: gs://${GCS_BUCKET}"
echo "  ├── GCS: gs://${GCS_CONFIG_BUCKET}"
echo "  └── SA Key: ${KEY_FILE}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Copy the SA key to your CI environment:"
echo "     cat \"$KEY_FILE\""
echo ""
echo "  2. Create Cloud SQL (if not done):"
echo "     https://console.cloud.google.com/sql?project=${PROJECT_ID}"
echo ""
echo "  3. Deploy:"
echo "     cd /path/to/iepapp && task prod:deploy:api"
echo ""
