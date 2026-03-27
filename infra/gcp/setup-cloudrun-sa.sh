#!/usr/bin/env bash
set -euo pipefail

# =========================
# Setup Cloud Run Runtime Service Account
# =========================
# Creates service account (if needed) and grants all necessary permissions
# for Cloud Run to access Storage, SQL, etc. including signed URL generation

# =========================
# Required environment variables
# =========================
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${CLOUD_RUN_SERVICE_NAME:?Set CLOUD_RUN_SERVICE_NAME (e.g., iep-api-dev)}"

GCP_REGION="${GCP_REGION:-us-central1}"
SA_NAME="${CLOUD_RUN_SERVICE_NAME}-sa"
SA_DISPLAY_NAME="${CLOUD_RUN_SERVICE_NAME} Runtime Service Account"
SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo "=============================================="
echo "Setup Cloud Run Service Account"
echo "  Project        : ${GCP_PROJECT_ID}"
echo "  Service        : ${CLOUD_RUN_SERVICE_NAME}"
echo "  SA Name        : ${SA_NAME}"
echo "  SA Email       : ${SA_EMAIL}"
echo "=============================================="
echo

# =========================
# Helper functions
# =========================
exists_sa() {
  gcloud iam service-accounts describe "$SA_EMAIL" \
    --project="$GCP_PROJECT_ID" >/dev/null 2>&1
}

grant_project_role() {
  local role="$1"
  echo "[*] Granting project role: $role"
  gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" \
    --quiet >/dev/null
}

# =========================
# Create service account if needed
# =========================
if exists_sa; then
  echo "✅ Service account already exists: ${SA_EMAIL}"
else
  echo "[*] Creating service account: ${SA_EMAIL}"
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$GCP_PROJECT_ID" \
    --display-name="$SA_DISPLAY_NAME" \
    --quiet
  echo "✅ Created: ${SA_EMAIL}"
fi

# =========================
# Grant project-level roles
# =========================
echo
echo "[*] Granting project-level permissions..."

# Storage permissions
grant_project_role "roles/storage.objectViewer"    # Read from GCS
grant_project_role "roles/storage.objectCreator"   # Write to GCS

# Cloud SQL permissions
grant_project_role "roles/cloudsql.client"         # Connect to Cloud SQL

# Secret Manager permissions (if using secrets)
grant_project_role "roles/secretmanager.secretAccessor"  # Read secrets

# Logging/Monitoring
grant_project_role "roles/logging.logWriter"       # Write logs
grant_project_role "roles/cloudtrace.agent"        # Trace agent

echo "✅ Project roles granted"

# =========================
# Grant self-signing permission for signed URLs
# =========================
echo
echo "[*] Granting self-signing permission for signed URL generation..."
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="$GCP_PROJECT_ID" \
  --quiet

echo "✅ Signed URL permission granted"

# =========================
# Verify permissions
# =========================
echo
echo "[*] Verifying signed URL permission..."
gcloud iam service-accounts get-iam-policy "$SA_EMAIL" \
  --project="$GCP_PROJECT_ID" \
  --format=json | grep -q "serviceAccountTokenCreator" && {
  echo "✅ Verification successful"
} || {
  echo "⚠️  Verification pending (may take a few seconds to propagate)"
}

# =========================
# Output next steps
# =========================
echo
echo "=============================================="
echo "✅ Cloud Run Service Account Ready!"
echo "=============================================="
echo
echo "Service Account: $SA_EMAIL"
echo
echo "Next steps:"
echo
echo "1. Deploy/update Cloud Run service with this account:"
echo "   gcloud run deploy $CLOUD_RUN_SERVICE_NAME \\"
echo "     --region=$GCP_REGION \\"
echo "     --service-account=$SA_EMAIL \\"
echo "     --image=<your-image>"
echo
echo "2. Or add to your GitHub Actions deploy workflow:"
echo "   --service-account=$SA_EMAIL"
echo
echo "Permissions granted:"
echo "  ✅ Storage read/write"
echo "  ✅ Cloud SQL access"
echo "  ✅ Secret Manager access"
echo "  ✅ Signed URL generation"
echo "  ✅ Logging/Tracing"
echo
