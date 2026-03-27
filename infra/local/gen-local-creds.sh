#!/usr/bin/env bash
set -euo pipefail

# ====== Defaults (can be overridden via env) ======
POSTGRES_USER="${POSTGRES_USER:-appuser}"
POSTGRES_DB="${POSTGRES_DB:-iepapp}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_CLIENT_CN="${REDIS_CLIENT_CN:-redis-client}"   # can be any name

DAYS="${DAYS:-3650}"
FORCE="${FORCE:-0}" # set FORCE=1 to overwrite existing certs

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${CERT_DIR:-$HOME/.iepconfig/certs}"
PG_DIR="$CERT_DIR/postgres"
RD_DIR="$CERT_DIR/redis"

# PostgreSQL certificate paths (can be overridden via env)
PG_CA_CERT_PATH="${PG_CA_CERT_PATH:-$PG_DIR/ca.crt}"
PG_CLIENT_CERT_PATH="${PG_CLIENT_CERT_PATH:-$PG_DIR/client.crt}"
PG_KEY_CERT_PATH="${PG_KEY_CERT_PATH:-$PG_DIR/client.key}"

mkdir -p "$PG_DIR" "$RD_DIR"

# Expand leading '~' in environment-provided paths (so users can set e.g. PG_CA_CERT_PATH=~/certs)
expand_leading_tilde() {
  local name="$1"
  local val="${!name:-}"
  if [[ -n "$val" && "${val:0:1}" == "~" ]]; then
    if [[ "$val" == "~" || "$val" == "~/"* ]]; then
      val="${val/#\~/$HOME}"
    else
      # handle ~user/... by letting the shell expand it
      val="$(eval echo "$val")"
    fi
    printf -v "$name" '%s' "$val"
  fi
}

expand_leading_tilde PG_CA_CERT_PATH
expand_leading_tilde PG_CLIENT_CERT_PATH
expand_leading_tilde PG_KEY_CERT_PATH

subj() {
  local cn="$1"
  echo "/C=IN/ST=TN/L=Chennai/O=iepapp/OU=dev/CN=${cn}"
}

warn_exists() {
  local path="$1"
  echo "⚠️  Exists: $path (skipping; use FORCE=1 to regenerate)"
}

# ---------- Files we consider "already generated" ----------
CA_KEY="$CERT_DIR/ca.key"
CA_CRT="$CERT_DIR/ca.crt"

PG_SERVER_KEY="$PG_DIR/server.key"
PG_SERVER_CRT="$PG_DIR/server.crt"
PG_CLIENT_KEY="$PG_DIR/client.key"
PG_CLIENT_CRT="$PG_DIR/client.crt"

RD_SERVER_KEY="$RD_DIR/server.key"
RD_SERVER_CRT="$RD_DIR/server.crt"
RD_CLIENT_KEY="$RD_DIR/client.key"
RD_CLIENT_CRT="$RD_DIR/client.crt"

PG_HBA="$PG_DIR/pg_hba.conf"

# ---------- Generation helpers ----------
gen_ca() {
  echo "==> Generating CA..."
  openssl genrsa -out "$CA_KEY" 4096
  openssl req -x509 -new -nodes \
    -key "$CA_KEY" \
    -sha256 -days "$DAYS" \
    -subj "$(subj "iepapp-local-ca")" \
    -out "$CA_CRT"
}

copy_ca_into_service_dirs() {
  cp -f "$CA_CRT" "$PG_DIR/ca.crt"
  cp -f "$CA_CRT" "$RD_DIR/ca.crt"
}

gen_server_cert() {
  local name="$1" outdir="$2" cn="$3"
  local key="$outdir/server.key"
  local crt="$outdir/server.crt"

  if [[ "$FORCE" != "1" && -f "$key" && -f "$crt" ]]; then
    warn_exists "$key / $crt"
    return 0
  fi

  echo "==> Generating ${name} server cert..."
  openssl genrsa -out "$key" 2048
  openssl req -new \
    -key "$key" \
    -subj "$(subj "$cn")" \
    -out "$outdir/server.csr"

  cat > "$outdir/server.ext" <<EOF
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:${cn},DNS:${name},DNS:localhost,IP:127.0.0.1
EOF

  openssl x509 -req \
    -in "$outdir/server.csr" \
    -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$crt" \
    -days "$DAYS" -sha256 \
    -extfile "$outdir/server.ext"

  rm -f "$outdir/server.csr" "$outdir/server.ext"
}

gen_client_cert() {
  local outdir="$1" cn="$2"
  local key="$outdir/client.key"
  local crt="$outdir/client.crt"

  if [[ "$FORCE" != "1" && -f "$key" && -f "$crt" ]]; then
    warn_exists "$key / $crt"
    return 0
  fi

  echo "==> Generating client cert CN=${cn} ..."
  openssl genrsa -out "$key" 2048
  openssl req -new \
    -key "$key" \
    -subj "$(subj "$cn")" \
    -out "$outdir/client.csr"

  cat > "$outdir/client.ext" <<EOF
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=clientAuth
EOF

  openssl x509 -req \
    -in "$outdir/client.csr" \
    -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$crt" \
    -days "$DAYS" -sha256 \
    -extfile "$outdir/client.ext"

  rm -f "$outdir/client.csr" "$outdir/client.ext"
}

ensure_pg_hba() {
  if [[ -f "$PG_HBA" && "$FORCE" != "1" ]]; then
    warn_exists "$PG_HBA"
    return 0
  fi

  echo "==> Writing Postgres pg_hba.conf into $PG_HBA"
  cat > "$PG_HBA" <<'EOF'
local   all             all                                     trust
hostssl all             all             0.0.0.0/0               cert clientcert=verify-full
hostssl all             all             ::/0                    cert clientcert=verify-full
EOF
}

# ---------- Main ----------
echo "=============================================="
echo "🔧 gen-creds.sh (idempotent)"
echo "   POSTGRES_USER=${POSTGRES_USER}"
echo "   POSTGRES_DB=${POSTGRES_DB}"
echo "   FORCE=${FORCE}"
echo "=============================================="
echo

# CA
if [[ "$FORCE" == "1" || ! -f "$CA_KEY" || ! -f "$CA_CRT" ]]; then
  gen_ca
else
  warn_exists "$CA_KEY / $CA_CRT"
fi

# Ensure CA is present inside service dirs even when skipping regen
copy_ca_into_service_dirs

# Server certs
gen_server_cert "postgres" "$PG_DIR" "postgres"
gen_server_cert "redis"    "$RD_DIR" "redis"

# Client certs
gen_client_cert "$PG_DIR" "$POSTGRES_USER"
gen_client_cert "$RD_DIR" "$REDIS_CLIENT_CN"

# Permissions (safe even if already correct)
# PostgreSQL requires server.key to be owned by postgres user or root
# with strict permissions. For Docker, we need to make it readable.
if [[ -f "$PG_SERVER_KEY" ]]; then
  chmod 644 "$PG_SERVER_KEY" || true
fi
if [[ -f "$PG_CLIENT_KEY" ]]; then
  chmod 600 "$PG_CLIENT_KEY" || true
fi
if [[ -f "$RD_SERVER_KEY" ]]; then
  chmod 644 "$RD_SERVER_KEY" || true
fi
if [[ -f "$RD_CLIENT_KEY" ]]; then
  chmod 600 "$RD_CLIENT_KEY" || true
fi

# pg_hba.conf
ensure_pg_hba

echo
echo "=============================================="
echo "📚 Application Connection Examples (mTLS)"
echo "=============================================="
echo

echo "📌 psql (from host):"
echo "psql \"host=localhost port=${POSTGRES_PORT} dbname=${POSTGRES_DB} user=${POSTGRES_USER} sslmode=verify-full sslrootcert=${PG_CA_CERT_PATH} sslcert=${PG_CLIENT_CERT_PATH} sslkey=${PG_KEY_CERT_PATH}\""
echo

echo "📌 redis-cli (from host):"
echo "redis-cli --tls --cacert ${RD_DIR}/ca.crt --cert ${RD_DIR}/client.crt --key ${RD_DIR}/client.key -h localhost -p ${REDIS_PORT}"
echo

echo "☕ JDBC (Postgres):"
echo "jdbc:postgresql://localhost:${POSTGRES_PORT}/${POSTGRES_DB}?ssl=true&sslmode=verify-full&sslrootcert=${PG_CA_CERT_PATH}&sslcert=${PG_CLIENT_CERT_PATH}&sslkey=${PG_KEY_CERT_PATH}"
echo

echo "🟢 Node.js (Sequelize – Postgres):"
echo "Sequelize({ host:'postgres', port:5432, database:'${POSTGRES_DB}', username:'${POSTGRES_USER}', password:null, dialectOptions:{ ssl:{ require:true, rejectUnauthorized:true, ca:fs.readFileSync('/certs/ca.crt'), cert:fs.readFileSync('/certs/client.crt'), key:fs.readFileSync('/certs/client.key') }}})"
echo

echo "🐹 Go (pgx / database/sql):"
echo "connStr := \"host=postgres port=5432 dbname=${POSTGRES_DB} user=${POSTGRES_USER} sslmode=verify-full sslrootcert=/certs/ca.crt sslcert=/certs/client.crt sslkey=/certs/client.key\""
echo

echo "🟥 Redis (Node.js):"
echo "Redis({ host:'redis', port:6379, tls:{ ca:fs.readFileSync('/certs/ca.crt'), cert:fs.readFileSync('/certs/client.crt'), key:fs.readFileSync('/certs/client.key'), rejectUnauthorized:true }})"
echo

echo "🟥 Redis (Go):"
echo "redis.Options{ Addr:\"redis:6379\", TLSConfig:&tls.Config{ RootCAs:caPool, Certificates:[]tls.Certificate{clientCert} } }"
echo

echo "=============================================="
echo "✅ Done."
echo "Notes:"
echo " - Postgres client cert CN MUST equal POSTGRES_USER (${POSTGRES_USER})."
echo " - Existing certs are not overwritten unless FORCE=1."
echo "=============================================="
echo
