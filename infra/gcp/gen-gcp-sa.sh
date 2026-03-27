#!/usr/bin/env bash
set -euo pipefail

# =========================
# Inputs (env-based)
# =========================
: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID first (e.g., export GCP_PROJECT_ID=xxx)}"

: "${GCP_SA_KEY_FILE_PATH:?Set GCP_SA_KEY_FILE_PATH first (e.g., export GCP_SA_KEY_FILE_PATH=./infra/gcp/key.json)}"

SA_NAME="${GCP_SA_NAME:-ci-deployer}"
SA_DISPLAY_NAME="${GCP_SA_DISPLAY_NAME:-CI Deployer}"

# Expand tilde in path
KEY_FILE="${GCP_SA_KEY_FILE_PATH/#\~/$HOME}"
KEY_DIR="$(dirname "$KEY_FILE")"

# If FORCE=1, we will rotate/create a new key even if KEY_FILE already exists.
FORCE="${FORCE:-1}"

SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Essential roles for: Cloud Run, Artifact Registry, Storage, SQL, Redis, AI/Gemini, API management, Firebase, Signed URLs
ROLES=(
  "roles/editor"                                   # Edit all resources (covers most needs)
  "roles/iam.serviceAccountUser"                   # Use service accounts for Cloud Run
  "roles/run.admin"                                # Deploy Cloud Run
  "roles/artifactregistry.admin"                   # Create/manage Artifact Registry
  "roles/storage.admin"                            # Create/manage storage buckets
  "roles/storage.objectAdmin"                      # Manage storage objects
  "roles/cloudsql.admin"                           # Create/manage Cloud SQL instances
  "roles/redis.admin"                              # Create/manage Redis instances
  "roles/aiplatform.admin"                         # AI Platform & Gemini access
  "roles/serviceusage.apiKeysAdmin"                # Create/manage API keys (Gemini)
  "roles/serviceusage.serviceUsageAdmin"           # Enable/disable APIs
  "roles/secretmanager.admin"                      # Manage secrets
  "roles/firebase.admin"                           # Firebase Admin SDK access
)

# =========================
# Helpers
# =========================
exists_sa() {
  gcloud iam service-accounts describe "$SA_EMAIL" --project "$GCP_PROJECT_ID" >/dev/null 2>&1
}

ensure_dir() {
  mkdir -p "$KEY_DIR"
}

grant_role() {
  local role="$1"
  echo "[*] Ensuring IAM binding: $role"
  gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" \
    --quiet >/dev/null
}

# =========================
# Main
# =========================
echo "=============================================="
echo "GCP Service Account Key Generator"
echo "  Project : ${GCP_PROJECT_ID}"
echo "  SA      : ${SA_EMAIL}"
echo "  KeyFile : ${KEY_FILE}"
echo "  FORCE   : ${FORCE}"
echo "=============================================="
echo

ensure_dir

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

echo
echo "[*] Granting roles (idempotent-ish; duplicates are fine)"
for role in "${ROLES[@]}"; do
  grant_role "$role"
done

echo
echo "[*] Granting service account self-signing permission for presigned URLs"
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountTokenCreator" \
  --project="$GCP_PROJECT_ID" \
  --quiet
echo "✅ Service account can now sign its own URLs"

echo
echo "[*] Enabling essential APIs"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  redis.googleapis.com \
  aiplatform.googleapis.com \
  generativelanguage.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  firebase.googleapis.com \
  firebasedatabase.googleapis.com \
  firestore.googleapis.com \
  --project="$GCP_PROJECT_ID" \
  --quiet

echo
if [[ -f "$KEY_FILE" && "$FORCE" != "1" ]]; then
  echo "⚠️  Key file already exists: $KEY_FILE"
  echo "    Not overwriting. If you want a fresh key: FORCE=1 $0"
else
  if [[ -f "$KEY_FILE" && "$FORCE" == "1" ]]; then
    echo "🔥 FORCE=1 set. Existing key file will be replaced: $KEY_FILE"
    rm -f "$KEY_FILE"
  fi

  echo "[*] Creating JSON key at: $KEY_FILE"
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL" \
    --project="$GCP_PROJECT_ID" \
    --quiet

  chmod 600 "$KEY_FILE" || true
  echo "✅ Key created: $KEY_FILE"
fi

echo
echo "=============================================="
echo "✅ Output"
echo "=============================================="
echo "Export this for local use:"
echo "  export GCP_SA_KEY_FILE_PATH=\"${KEY_FILE}\""
echo
echo "GitHub Secret value (if you store raw JSON):"
echo "  cat \"${KEY_FILE}\""
echo
echo "⚠️ Treat that file like a password with feelings."
echo "   Don’t commit it. Don’t paste it in Slack. Don’t ship it to Mars."
echo
