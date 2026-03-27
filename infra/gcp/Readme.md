# GCP Infrastructure Setup

This directory contains scripts and tasks for managing GCP infrastructure for the IEP application across dev and production environments.

## 📁 Files Overview

### Scripts

| Script | Purpose |
|--------|---------|
| `gen-gcp-sa.sh` | Creates GCP service accounts with necessary permissions for CI/CD deployment |
| `gen-gcp-infra.sh` | Sets up GCP infrastructure (Artifact Registry, enables required APIs) |
| `configure-db.sh` | Connects to existing CloudSQL instance, creates DB/user, downloads SSL certificates |
| `deploy-secrets.sh` | Uploads PostgreSQL SSL certificates to GCP Secret Manager |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Local infrastructure settings (used by base scripts) |
| `../../.env.dev` | Dev environment configuration |
| `../../.env.production` | Production environment configuration |

---

## 🚀 Quick Start

### Prerequisites

1. Install required tools:
   ```bash
   gcloud auth login
   gcloud config set project gen-lang-client-0350197188
   ```

2. Ensure environment files are configured:
   - Copy `.env.dev.template` to `.env.dev` and fill in your values
   - Copy `.env.dev.template` to `.env.production` and use production values

### One-Command Setup

Run the full environment setup with a single command:

```bash
# Development environment
cd infra/gcp
task dev:setup

# Or from project root
task gcp:setup:dev

# Production environment
task gcp:setup:prod
```

This orchestrates all steps: service accounts, APIs, Artifact Registry, GCS buckets, Cloud SQL configuration, and Secret Manager deployment.

---

## 📋 Tasks Reference

### Service Account Management

Create service accounts for automated deployment:

```bash
# Development service account
task dev:generate-sa
# Creates: iep-ci-deployer-dev
# Key saved to: ~/.iepconfig/gcpcerts/dev/gcpservice-account-key.json

# Production service account
task prod:generate-sa
# Creates: iep-ci-deployer-prod
# Key saved to: ~/.iepconfig/gcpcerts/production/gcpservice-account-key.json
```

**What it does:**
- Creates service account with necessary roles (Cloud Run, Artifact Registry, Storage, SQL, etc.)
- Generates JSON key file for GitHub Actions
- Grants required IAM permissions

---

### Infrastructure Setup

Set up Artifact Registry and enable required GCP APIs:

```bash
# Development infrastructure
task dev:generate:infra

# Production infrastructure
task prod:generate:infra
```

**What it does:**
- Creates Artifact Registry repository for Docker images
- Enables necessary GCP APIs (Cloud Run, SQL Admin, Firebase, etc.)
- No CloudSQL provisioning (done manually)

---

### Database Setup

#### Step 1: Create CloudSQL Instance (Manual)

**Create manually via GCP Console:**
1. Go to [GCP Console → SQL](https://console.cloud.google.com/sql)
2. Click "Create Instance" → PostgreSQL
3. Configure based on environment:
   
   **Development:**
   - Instance ID: `iepdatabasedev`
   - Machine: `db-f1-micro` (shared core, 614MB RAM)
   - Storage: 10GB SSD
   - Backups: Optional
   
   **Production:**
   - Instance ID: `iepdatabaseprod`
   - Machine: `db-custom-2-7680` (2 vCPU, 7.5GB RAM)
   - Storage: 100GB SSD
   - Backups: Enabled with retention
   - High availability: Recommended

4. Enable Public IP access or configure private IP
5. Note the instance ID and update your `.env` files

**Why manual?** CloudSQL instances are expensive and require careful configuration for:
- Backup schedules and retention
- Maintenance windows
- High availability settings
- Cost optimization
- Regional placement

#### Step 2: Configure Database/User/Certificates

After creating the CloudSQL instance:

```bash
# Development database setup
task dev:db-configure
# Connects to: iepdatabasedev
# Creates: iep_database, iep_user
# Downloads SSL certs to: ~/.iepconfig/certs/gcp/postgres/

# Production database setup
task prod:db-configure
# Connects to: iepdatabaseprod
# Creates: iep_database_prod, iep_user_prod
# Downloads SSL certs to: ~/.iepconfig/certs/gcp/postgres/
```

**What it does:**
- Verifies CloudSQL instance exists
- Creates database if it doesn't exist
- Creates/updates user with password from `.env`
- Downloads SSL certificates (CA, client cert, client key)
- Outputs connection strings for `psql`

**Output includes:**
```bash
# PostgreSQL connection with SSL
psql "host=35.239.60.86 port=5432 dbname=iep_database user=iep_user password=xxx sslmode=verify-ca sslrootcert=~/.iepconfig/certs/gcp/postgres/ca.crt sslcert=~/.iepconfig/certs/gcp/postgres/client.crt sslkey=~/.iepconfig/certs/gcp/postgres/client.key"

# Connection URL
postgresql://iep_user:password@35.239.60.86:5432/iep_database?sslmode=require

# Cloud SQL Proxy connection
cloud-sql-proxy gen-lang-client-0350197188:us-central1:iepdatabasedev --port 5432
```

---

### Deploy Database Certificates to Secret Manager

After obtaining certificates, deploy them to Secret Manager for Cloud Run:

```bash
# Development secrets
task deploy:secrets:api-dev
# Uploads certs to Secret Manager
# Grants access to: iep-api-dev service account

# Production secrets
task deploy:secrets:api-prod
# Uploads certs to Secret Manager
# Grants access to: iep-api-production service account
```

**What it does:**
- Creates/updates secrets in GCP Secret Manager:
  - `postgres-ca-cert`
  - `postgres-client-cert`
  - `postgres-client-key`
- Grants Cloud Run service account access to secrets
- Secrets are mounted in Cloud Run at `/etc/secrets/postgres/`

**Note:** Run this after deploying your Cloud Run service for the first time, or manually grant permissions.

---

## 🔐 Environment Variables

### Required in `.env.dev`

```bash
# GCP Project
GCP_PROJECT_ID=gen-lang-client-0350197188
GCP_REGION=us-central1
GCP_ARTIFACT_REPOSITORY=iep-apps

# Service Account
GCP_SA_NAME=iep-ci-deployer-dev
GCP_SA_DISPLAY_NAME="IEP CI Deployer Dev"
GCP_SA_KEY_FILE_PATH=~/.iepappconfig/dev/upload/gcpservice-account-key.json

# Database Connection
POSTGRES_HOST=35.239.60.86
POSTGRES_PORT=5432
POSTGRES_DB=iep_database
POSTGRES_USER=iep_user
POSTGRES_PASSWORD=your-secure-password
POSTGRES_SSL_MODE=verify-ca
INSTANCEID=iepdatabasedev

# Cloud Run
CLOUD_RUN_SERVICE_NAME=iep-api-dev

# Certificate Paths
PG_CA_CERT_PATH=~/.iepconfig/certs/gcp/postgres/ca.crt
PG_CLIENT_CERT_PATH=~/.iepconfig/certs/gcp/postgres/client.crt
PG_KEY_CERT_PATH=~/.iepconfig/certs/gcp/postgres/client.key
```

### Required in `.env.production`

```bash
# Same structure as .env.dev but with production values
GCP_SA_NAME=iep-ci-deployer-prod
POSTGRES_DB=iep_database_prod
POSTGRES_USER=iep_user_prod
INSTANCEID=iepdatabaseprod
CLOUD_RUN_SERVICE_NAME=iep-api-production
```

---

## 📝 Workflow: Setting Up New Environment

### For Development:

```bash
cd infra/gcp

# 1. Create service account
task dev:generate-sa

# 2. Setup infrastructure (Artifact Registry)
task dev:generate:infra

# 3. Manually create CloudSQL instance in GCP Console
#    Instance ID: iepdatabasedev
#    Tier: db-f1-micro
#    Storage: 10GB

# 4. Update .env.dev with instance INSTANCEID

# 5. Configure database/user/certificates
task dev:db-configure

# 6. Test connection with output psql command

# 7. Deploy your app to Cloud Run first

# 8. Deploy certificates to Secret Manager
task deploy:secrets:api-dev
```

### For Production:

```bash
cd infra/gcp

# 1. Create service account
task prod:generate-sa

# 2. Setup infrastructure
task prod:generate:infra

# 3. Manually create CloudSQL instance in GCP Console
#    Instance ID: iepdatabaseprod
#    Tier: db-custom-2-7680
#    Storage: 100GB
#    Enable backups and HA

# 4. Update .env.production with instance details

# 5. Configure database/user/certificates
task prod:db-configure

# 6. Test connection

# 7. Deploy your app to Cloud Run

# 8. Deploy certificates to Secret Manager
task deploy:secrets:api-prod
```

---

## 🔧 Troubleshooting

### Certificates already exist

If certificates exist locally and you want to skip recreation:
```bash
# Certificates won't be recreated if they exist
task dev:db-configure
```

To force recreation:
```bash
FORCE_CERTS=1 task dev:db-configure
```

### Service account access denied

Ensure the Cloud Run service is deployed first, then run:
```bash
task deploy:secrets:api-dev
```

The script will automatically grant the service account access to secrets. If the service doesn't exist yet, you'll see a warning.

### Connection test

After setup, test the connection using the output psql command:
```bash
psql "host=35.239.60.86 port=5432 dbname=iep_database user=iep_user password=xxx sslmode=verify-ca sslrootcert=~/.iepconfig/certs/gcp/postgres/ca.crt sslcert=~/.iepconfig/certs/gcp/postgres/client.crt sslkey=~/.iepconfig/certs/gcp/postgres/client.key"
```

### Instance not found

If `task dev:db-configure` fails with "instance not found":
1. Verify the CloudSQL instance is created in GCP Console
2. Check that `INSTANCEID` in `.env.dev` matches the instance name
3. Ensure you're using the correct GCP project

---

## 📚 Additional Resources

- [GCP CloudSQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)

---

## 🔑 Summary of Manual vs Automated Steps

**Automated (via tasks):**
- ✅ Service account creation
- ✅ Artifact Registry setup
- ✅ API enablement
- ✅ Database/user creation in existing CloudSQL
- ✅ SSL certificate download
- ✅ Secret Manager deployment

**Manual (via GCP Console):**
- 🔧 CloudSQL instance creation (one-time per environment)
- 🔧 Domain verification and mapping (optional)
- 🔧 Firewall rules (if needed)
- 🔧 VPC configuration (if using private IP)

---

## 🆘 Support

For issues or questions, refer to:
1. This README
2. Individual script comments
3. `.env.dev` and `.env.production` configuration
4. Task definitions in `Taskfile.yml`
