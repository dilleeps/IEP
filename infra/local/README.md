# Local Infrastructure - Certificate Generation & mTLS Setup

## Overview

This directory contains scripts and configuration for generating local TLS certificates and setting up mutual TLS (mTLS) authentication for PostgreSQL and Redis in development environments.

## What Does `gen-local-creds.sh` Do?

The script generates a complete PKI (Public Key Infrastructure) for local development with mutual TLS authentication:

### Generated Artifacts

#### 1. **Certificate Authority (CA)**
- Location: `certs/ca.key`, `certs/ca.crt`
- Purpose: Root CA to sign all server and client certificates
- Valid for: 10 years (configurable via `DAYS` env var)

#### 2. **PostgreSQL Certificates**
- **Server Certificate**: `certs/postgres/server.{crt,key}`
  - CN: `postgres`
  - SANs: postgres, localhost, 127.0.0.1
- **Client Certificate**: `certs/postgres/client.{crt,key}`
  - CN: Must match `POSTGRES_USER` (required by PostgreSQL)
- **CA Certificate**: `certs/postgres/ca.crt` (copied from root CA)
- **Access Control**: `certs/postgres/pg_hba.conf`
  - Requires client certificate verification (`clientcert=verify-full`)

#### 3. **Redis Certificates**
- **Server Certificate**: `certs/redis/server.{crt,key}`
  - CN: `redis`
  - SANs: redis, localhost, 127.0.0.1
- **Client Certificate**: `certs/redis/client.{crt,key}`
  - CN: `redis-client` (configurable via `REDIS_CLIENT_CN`)
- **CA Certificate**: `certs/redis/ca.crt` (copied from root CA)

### Key Features

- **Idempotent**: Won't overwrite existing certificates unless `FORCE=1`
- **Production-Ready**: Uses proper certificate extensions (serverAuth, clientAuth)
- **Secure**: 4096-bit RSA for CA, 2048-bit for service certs
- **Flexible**: Configurable via environment variables

## Configuration

### Environment Variables

Configure via `infra/local/.env`:

```bash
# PostgreSQL Configuration
POSTGRES_PORT=5464          # Host port mapping
POSTGRES_DB=iep_database    # Database name
POSTGRES_USER=iep_user      # Username (MUST match client cert CN)

# Redis Configuration
REDIS_PORT=6389            # Host port mapping

# Certificate Paths (for application use)
PG_CA_CERT_PATH=./certs/postgres/ca.crt
PG_CLIENT_CERT_PATH=./certs/postgres/client.crt
PG_KEY_CERT_PATH=./certs/postgres/client.key
```

### Additional Script Variables

Set these when running the script:

```bash
# Optional overrides
REDIS_CLIENT_CN=redis-client  # Client certificate CN for Redis
DAYS=3650                      # Certificate validity (default: 10 years)
FORCE=1                        # Regenerate all certificates
```

## Usage

### 1. Generate Certificates

```bash
cd infra/local
./gen-local-creds.sh
```

Or with custom configuration:

```bash
POSTGRES_USER=myuser POSTGRES_DB=mydb FORCE=1 ./gen-local-creds.sh
```

### 2. Start Services

From the project root:

```bash
docker-compose -f docker-compose-db.yaml up -d
```

### 3. Connect to Services

#### PostgreSQL (from host)

```bash
psql "host=localhost port=5464 dbname=iep_database user=iep_user \
  sslmode=verify-full \
  sslrootcert=./infra/local/certs/postgres/ca.crt \
  sslcert=./infra/local/certs/postgres/client.crt \
  sslkey=./infra/local/certs/postgres/client.key"
```

#### Redis (from host)

```bash
redis-cli --tls \
  --cacert ./infra/local/certs/redis/ca.crt \
  --cert ./infra/local/certs/redis/client.crt \
  --key ./infra/local/certs/redis/client.key \
  -h localhost -p 6389
```

### 4. Application Connection Examples

#### Node.js - PostgreSQL (Sequelize)

```javascript
const sequelize = new Sequelize({
  host: 'localhost',
  port: 5464,
  database: 'iep_database',
  username: 'iep_user',
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true,
      ca: fs.readFileSync('./infra/local/certs/postgres/ca.crt'),
      cert: fs.readFileSync('./infra/local/certs/postgres/client.crt'),
      key: fs.readFileSync('./infra/local/certs/postgres/client.key')
    }
  }
});
```

#### Node.js - Redis (ioredis)

```javascript
const Redis = require('ioredis');
const redis = new Redis({
  host: 'localhost',
  port: 6389,
  tls: {
    ca: fs.readFileSync('./infra/local/certs/redis/ca.crt'),
    cert: fs.readFileSync('./infra/local/certs/redis/client.crt'),
    key: fs.readFileSync('./infra/local/certs/redis/client.key'),
    rejectUnauthorized: true
  }
});
```

## Directory Structure

```
infra/local/
├── gen-local-creds.sh          # Certificate generation script
├── .env                        # Environment configuration
├── README.md                   # This file
├── certs/
│   ├── ca.key                  # Root CA private key
│   ├── ca.crt                  # Root CA certificate
│   ├── postgres/
│   │   ├── ca.crt              # CA cert (for PostgreSQL)
│   │   ├── server.crt          # PostgreSQL server certificate
│   │   ├── server.key          # PostgreSQL server key
│   │   ├── client.crt          # Client certificate (CN=POSTGRES_USER)
│   │   ├── client.key          # Client private key
│   │   └── pg_hba.conf         # PostgreSQL host-based auth config
│   └── redis/
│       ├── ca.crt              # CA cert (for Redis)
│       ├── server.crt          # Redis server certificate
│       ├── server.key          # Redis server key
│       ├── client.crt          # Client certificate
│       └── client.key          # Client private key
├── postgres/
│   ├── pg_hba.conf             # Alternative pg_hba (if not using generated)
│   └── initdb/                 # PostgreSQL init scripts
└── redis/
    └── redis.conf              # Redis configuration
```

## Security Notes

### PostgreSQL Client Certificate Requirement

PostgreSQL requires that the client certificate CN (Common Name) **exactly matches** the database username. This is why the script uses `POSTGRES_USER` as the CN for the client certificate.

### Certificate Verification

Both PostgreSQL and Redis are configured for **full client certificate verification**:
- `pg_hba.conf`: `clientcert=verify-full`
- `redis.conf`: `tls-auth-clients yes`

### File Permissions

The script automatically sets secure permissions on private keys:
- Server keys: `chmod 600` (read/write by owner only)

### Certificate Validity

Default validity is 10 years (3650 days). For production, use shorter validity periods and implement certificate rotation.

## Troubleshooting

### Connection Refused
- Ensure Docker services are running: `docker-compose -f docker-compose-db.yaml ps`
- Check port mappings in `.env` file

### SSL/TLS Errors
- Verify certificates exist: `ls -la certs/postgres/ certs/redis/`
- Check certificate CN matches username for PostgreSQL
- Ensure certificate validity: `openssl x509 -in certs/postgres/client.crt -noout -dates`

### Permission Denied
- Check file permissions on private keys
- Ensure Docker can read certificate files

### Certificate Already Exists
- To regenerate: `FORCE=1 ./gen-local-creds.sh`
- Or manually delete: `rm -rf certs/`

## Integration with Docker Compose

The generated certificates are mounted into containers via Docker volumes:

```yaml
# PostgreSQL
volumes:
  - ./infra/local/certs/postgres:/certs:ro

# Redis
volumes:
  - ./infra/local/certs/redis:/certs:ro
```

Services reference certificates at `/certs/` inside containers.

## Development Workflow

1. **Initial Setup**
   ```bash
   cd infra/local
   ./gen-local-creds.sh
   cd ../..
   docker-compose -f docker-compose-db.yaml up -d
   ```

2. **Regenerate Certificates**
   ```bash
   cd infra/local
   FORCE=1 ./gen-local-creds.sh
   cd ../..
   docker-compose -f docker-compose-db.yaml restart
   ```

3. **Clean Start**
   ```bash
   docker-compose -f docker-compose-db.yaml down -v
   cd infra/local
   rm -rf certs/
   ./gen-local-creds.sh
   cd ../..
   docker-compose -f docker-compose-db.yaml up -d
   ```

## References

- [PostgreSQL SSL Documentation](https://www.postgresql.org/docs/current/ssl-tcp.html)
- [Redis TLS Documentation](https://redis.io/docs/management/security/encryption/)
- [OpenSSL Certificate Generation](https://www.openssl.org/docs/man1.1.1/man1/openssl-req.html)
