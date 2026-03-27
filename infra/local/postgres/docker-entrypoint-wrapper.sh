#!/bin/bash
set -e

# Copy certificates from mounted volume to a location owned by postgres user
CERT_SOURCE="/certs-ro"
CERT_DEST="/certs"

mkdir -p "$CERT_DEST"

# Copy certificates and set proper ownership and permissions
cp "$CERT_SOURCE/ca.crt" "$CERT_DEST/"
cp "$CERT_SOURCE/server.crt" "$CERT_DEST/"
cp "$CERT_SOURCE/server.key" "$CERT_DEST/"
cp "$CERT_SOURCE/client.crt" "$CERT_DEST/"
cp "$CERT_SOURCE/client.key" "$CERT_DEST/"
cp "$CERT_SOURCE/pg_hba.conf" "$CERT_DEST/"

# Set ownership to postgres user
chown -R postgres:postgres "$CERT_DEST"

# Set strict permissions for private keys
chmod 600 "$CERT_DEST/server.key"
chmod 600 "$CERT_DEST/client.key"
chmod 644 "$CERT_DEST"/*.crt
chmod 644 "$CERT_DEST/ca.crt"
chmod 644 "$CERT_DEST/pg_hba.conf"

echo "✅ Certificates copied and permissions set"

# Execute the original PostgreSQL entrypoint
exec docker-entrypoint.sh "$@"
