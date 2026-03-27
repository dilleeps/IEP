#!/usr/bin/env bash
set -euo pipefail

die() { echo "❌ $*" >&2; exit 1; }
info() { echo "ℹ️  $*" >&2; }
ok() { echo "✅ $*" >&2; }

need_cmd() {
  local missing=0
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || { echo "❌ Missing command: $c" >&2; missing=1; }
  done
  (( missing == 0 )) || exit 1
}

# Expand ~ and make absolute-ish paths safe
expand_path() {
  local p="$1"
  # expand leading ~
  if [[ "$p" == "~" ]]; then
    printf '%s\n' "$HOME"
  elif [[ "$p" == "~/"* ]]; then
    printf '%s\n' "$HOME/${p#~/}"
  else
    printf '%s\n' "$p"
  fi
}

ensure_dir_for_file() {
  local f="$1"
  local d
  d="$(dirname "$f")"
  mkdir -p "$d"
}

require_gcloud_auth() {
  gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q . \
    || die "No active gcloud auth. Run: gcloud auth login"
  gcloud config set project "$GCP_PROJECT_ID" >/dev/null
}

instance_conn_name() {
  # Prefer API derived region if not provided; but you already require GCP_REGION
  printf '%s:%s:%s\n' "$GCP_PROJECT_ID" "$GCP_REGION" "$INSTANCEID"
}

# =========================
# Validate tooling
# =========================
need_cmd gcloud openssl sed awk grep mkdir chmod

require_gcloud_auth

# Expand optional paths (because env vars won’t expand ~)
PG_CA_CERT_PATH="$(expand_path "$PG_CA_CERT_PATH")"
PG_CLIENT_CERT_PATH="$(expand_path "$PG_CLIENT_CERT_PATH")"
PG_KEY_CERT_PATH="$(expand_path "$PG_KEY_CERT_PATH")"

ensure_dir_for_file "$PG_CA_CERT_PATH"
ensure_dir_for_file "$PG_CLIENT_CERT_PATH"
ensure_dir_for_file "$PG_KEY_CERT_PATH"

CONN_NAME="$(instance_conn_name)"
ok "Using instance connection name: $CONN_NAME"

# =========================
# Check instance exists + engine
# =========================
ENGINE="$(gcloud sql instances describe "$INSTANCEID" --project "$GCP_PROJECT_ID" --format="value(databaseVersion)" 2>/dev/null || true)"
[[ -n "$ENGINE" ]] || die "Cloud SQL instance '$INSTANCEID' not found in project '$GCP_PROJECT_ID'."
[[ "$ENGINE" == POSTGRES* ]] || die "Instance '$INSTANCEID' is not Postgres (databaseVersion=$ENGINE)."

# Detect public IP if present
PUBLIC_IP="$(gcloud sql instances describe "$INSTANCEID" --project "$GCP_PROJECT_ID" \
  --format="value(ipAddresses[?type='PRIMARY'].ipAddress)" || true)"

if [[ -n "$PUBLIC_IP" ]]; then
  ok "Public IP detected: $PUBLIC_IP"
else
  info "No public IP detected. Direct SSL TCP connection from laptop won't work; use Cloud SQL Auth Proxy."
fi

# =========================
# Ensure DB exists
# =========================
if ! gcloud sql databases list --instance "$INSTANCEID" --project "$GCP_PROJECT_ID" \
  --format="value(name)" | grep -qx "$POSTGRES_DB"; then
  info "Creating database: $POSTGRES_DB"
  gcloud sql databases create "$POSTGRES_DB" --instance "$INSTANCEID" --project "$GCP_PROJECT_ID"
  ok "Database created: $POSTGRES_DB"
else
  ok "Database exists: $POSTGRES_DB"
fi

# =========================
# Ensure user exists (and password set)
# =========================
if ! gcloud sql users list --instance "$INSTANCEID" --project "$GCP_PROJECT_ID" \
  --format="value(name)" | grep -qx "$POSTGRES_USER"; then
  info "Creating user: $POSTGRES_USER"
  gcloud sql users create "$POSTGRES_USER" --instance "$INSTANCEID" --project "$GCP_PROJECT_ID" \
    --password "$POSTGRES_PASSWORD"
  ok "User created: $POSTGRES_USER"
else
  info "User exists: $POSTGRES_USER (updating password to provided value)"
  gcloud sql users set-password "$POSTGRES_USER" --instance "$INSTANCEID" --project "$GCP_PROJECT_ID" \
    --password "$POSTGRES_PASSWORD"
  ok "Password updated for: $POSTGRES_USER"
fi

# =========================
# Download SSL certs (for direct SSL mode)
# Note: This is for direct IP connections, not needed with Auth Proxy.
# =========================
download_certs() {
  # Server CA cert
  if [[ "$FORCE_CERTS" == "1" || ! -f "$PG_CA_CERT_PATH" ]]; then
    info "Downloading server CA cert -> $PG_CA_CERT_PATH"
    gcloud sql ssl server-ca-certs list --instance "$INSTANCEID" --project "$GCP_PROJECT_ID" \
      --format="value(cert)" > "$PG_CA_CERT_PATH"
    ok "Server CA cert saved"
  else
    ok "Server CA cert exists (set FORCE_CERTS=1 to refresh)"
  fi

  # Client cert + key
  if [[ "$FORCE_CERTS" == "1" || ! -f "$PG_CLIENT_CERT_PATH" || ! -f "$PG_KEY_CERT_PATH" ]]; then
    info "Creating/refreshing client cert '$CLOUDSQL_CLIENT_CERT_NAME'"

    # Delete existing client cert with same name to avoid conflicts
    gcloud sql ssl client-certs delete "$CLOUDSQL_CLIENT_CERT_NAME" \
      --instance "$INSTANCEID" --project "$GCP_PROJECT_ID" -q >/dev/null 2>&1 || true

    # Create writes cert to stdout; key written to file with flag
    tmp_cert="$(mktemp)"
    gcloud sql ssl client-certs create "$CLOUDSQL_CLIENT_CERT_NAME" \
      --instance "$INSTANCEID" --project "$GCP_PROJECT_ID" \
      --common-name "$CLOUDSQL_CLIENT_CERT_NAME" \
      --cert-file "$tmp_cert" \
      --private-key-file "$PG_KEY_CERT_PATH"

    mv "$tmp_cert" "$PG_CLIENT_CERT_PATH"
    chmod 600 "$PG_KEY_CERT_PATH"
    chmod 644 "$PG_CLIENT_CERT_PATH" "$PG_CA_CERT_PATH"
    ok "Client cert/key saved"
  else
    ok "Client cert/key exist (set FORCE_CERTS=1 to refresh)"
  fi
}

# Only bother downloading certs if we have a public IP (direct SSL possibility)
if [[ -n "$PUBLIC_IP" ]]; then
  download_certs
fi

# =========================
# Output connection strings
# =========================
echo ""
echo "======== Connection Strings ========"
echo "Instance connection name: $CONN_NAME"
echo ""

echo "1) Recommended (works everywhere): Cloud SQL Auth Proxy"
echo "   Run proxy:"
echo "     cloud-sql-proxy \"$CONN_NAME\" --port 5432"
echo "   Then connect:"
echo "     psql \"host=127.0.0.1 port=5432 dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD\""
echo ""

if [[ -n "$PUBLIC_IP" ]]; then
  echo "2) Direct TCP + SSL (ONLY if public IP allowed + authorized networks configured)"
  echo "   psql \"host=$PUBLIC_IP port=5432 dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD sslmode=verify-ca sslrootcert=$PG_CA_CERT_PATH sslcert=$PG_CLIENT_CERT_PATH sslkey=$PG_KEY_CERT_PATH\""
  echo ""
else
  echo "2) Direct TCP + SSL: Not available (no public IP). Use Auth Proxy."
  echo ""
fi

echo "3) Cloud Run: use Cloud SQL integration (unix socket)"
echo "   Attach instance to service and connect via /cloudsql/$CONN_NAME"
echo "===================================="
