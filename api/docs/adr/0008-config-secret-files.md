# ADR-0008: Encrypted Configuration File Management with GCS

**Date**: 2026-02-01  
**Status**: Accepted  
**Deciders**: Engineering Team

---

## Context

The IEP application requires secure storage and management of sensitive configuration files (cryptographic keys, certificates, credentials) that:

1. **Cannot be stored in code repositories** (security risk)
2. **Must be encrypted at rest** (compliance requirement)
3. **Need to be accessible across multiple environments** (dev, staging, production)
4. **Should support atomic downloads during application startup**
5. **Must maintain file permissions and directory structure**

Previously, we used Google Cloud Storage (GCS) for document storage with signed URLs (ADR-0007). This ADR extends that infrastructure to handle encrypted configuration files.

### Requirements

- **Security**: AES-256-GCM encryption for all config files
- **Isolation**: Separate GCS bucket (`GCS_CONFIG_BUCKET`) from document storage
- **Atomicity**: Download entire config folder on startup, cleanup on shutdown
- **Portability**: TypeScript implementation matching existing Go service patterns
- **Auditability**: Log all upload/download operations

---

## Decision

We will implement an encrypted configuration file management system using:

1. **Storage Backend**: Google Cloud Storage (GCS)
2. **Encryption**: AES-256-GCM with authenticated encryption
3. **Key Management**: Base64-encoded 32-byte key in `CONFIG_ENCRYPTION_KEY` environment variable
4. **Local Cache**: Downloaded to `LOCAL_BASE_FOLDER` with restrictive permissions (0700/0600)
5. **TypeScript Implementation**: Port of existing Go service (`secrets.go`, `s3configservice.go`)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Startup                      │
│                                                               │
│  1. Read CONFIG_ENCRYPTION_KEY (base64, 32 bytes)           │
│  2. Connect to GCS_CONFIG_BUCKET                             │
│  3. Download encrypted config files                          │
│  4. Decrypt with AES-256-GCM                                 │
│  5. Write to LOCAL_BASE_FOLDER (0700/0600 permissions)      │
│  6. Application uses getAsFile(keyname) to read configs      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google Cloud Storage                        │
│                                                               │
│  Bucket: GCS_CONFIG_BUCKET                                   │
│  Objects: [12-byte nonce][encrypted][16-byte auth tag]      │
│  Structure: ar.pub, keys/private.key, certs/ca.pem          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Local File System                           │
│                                                               │
│  Path: LOCAL_BASE_FOLDER (expanded ~ and $VARS)             │
│  Permissions: 0700 (directories), 0600 (files)              │
│  Cleanup: On shutdown or cleanupConfigFolder()               │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### 1. Core Module: `src/shared/storage/secrets.ts`

**Encryption Functions:**
```typescript
export function encryptFile(keyInfo: EncryptionKeyInfo, plaintext: Buffer): Buffer
export function decryptFile(keyInfo: EncryptionKeyInfo, ciphertext: Buffer): Buffer
```

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 32 bytes (256 bits)
- **Nonce**: 12 bytes (random, unique per encryption)
- **Auth Tag**: 16 bytes (appended to ciphertext)
- **Format**: `[nonce 12B][encrypted data][auth tag 16B]`

**GCSConfigService:**
```typescript
class GCSConfigService {
  static fromAppEnv(): GCSConfigService
  async uploadFolder(keyInfo: EncryptionKeyInfo, folderPath: string): Promise<number>
  async downloadFolder(keyInfo: EncryptionKeyInfo, localDownloadFolder: string): Promise<number>
}
```

**High-Level Operations:**
```typescript
export async function downloadConfigFolder(): Promise<void>
export async function uploadConfigFolderFrom(sourcePath: string): Promise<number>
export function cleanupConfigFolder(): void
export function checkSecretsHealth(): SecretsHealthStatus
```

### 2. Path Utilities

**`expandPath(p: string): string`**
- Expands `~/` to home directory
- Handles absolute paths (`/etc/secrets`)
- Resolves relative paths to home directory
- Matches Go implementation exactly

**`getAsFile(keyname: string): string`**
- Resolves `keyname` relative to `LOCAL_BASE_FOLDER`
- Validates against path traversal (`..` forbidden)
- Returns absolute path if file exists
- Throws error if file missing

### 3. Environment Variables

| Variable                          | Required | Default | Description                              |
|-----------------------------------|----------|---------|------------------------------------------|
| `GCS_CONFIG_BUCKET`               | ✅       | -       | GCS bucket for encrypted config files    |
| `CONFIG_ENCRYPTION_KEY`           | ✅       | -       | Base64-encoded 32-byte AES-256 key       |
| `LOCAL_BASE_FOLDER`               | ✅       | -       | Local cache directory (e.g., `~/.iep`)   |
| `GCP_PROJECT_ID`                  | ❌       | -       | GCP project ID (optional for ADC)        |
| `GCP_SERVICE_ACCOUNT_JSON_PATH`   | ❌       | -       | Service account for GCS access (ADR-0007)|

**Example Configuration:**
```bash
# Generate encryption key (one-time setup)
export CONFIG_ENCRYPTION_KEY=$(openssl rand -base64 32)

# GCS bucket for config files
export GCS_CONFIG_BUCKET="iep-config-prod"

# Local cache directory
export LOCAL_BASE_FOLDER="~/.iep/config"

# GCS authentication (ADR-0007)
export GCP_PROJECT_ID="iep-production"
export GCP_SERVICE_ACCOUNT_JSON_PATH="/etc/secrets/gcs-service-account.json"
```

---

## Encryption Details

### AES-256-GCM

**Why GCM (Galois/Counter Mode)?**
- **Authenticated Encryption**: Combines confidentiality + integrity
- **AEAD**: Authenticated Encryption with Associated Data
- **Tamper Detection**: 16-byte authentication tag detects modifications
- **Parallel Processing**: Faster than CBC mode
- **Industry Standard**: NIST SP 800-38D, TLS 1.3, QUIC

**Security Properties:**
- **Confidentiality**: Plaintext is unreadable without key
- **Integrity**: Auth tag prevents tampering
- **Authenticity**: Only holder of key can encrypt/decrypt
- **Nonce Uniqueness**: Random 12-byte nonce prevents replay attacks

**File Format:**
```
┌────────────┬──────────────────┬────────────┐
│  Nonce     │  Encrypted Data  │  Auth Tag  │
│  12 bytes  │  variable length │  16 bytes  │
└────────────┴──────────────────┴────────────┘
```

**Encryption Process:**
1. Generate random 12-byte nonce
2. Create AES-256-GCM cipher with key + nonce
3. Encrypt plaintext → ciphertext
4. Generate 16-byte authentication tag
5. Concatenate: `[nonce][ciphertext][tag]`

**Decryption Process:**
1. Extract nonce (first 12 bytes)
2. Extract auth tag (last 16 bytes)
3. Extract ciphertext (middle)
4. Create AES-256-GCM decipher with key + nonce
5. Set auth tag for verification
6. Decrypt and verify → plaintext or error

### Key Management

**Generation (One-Time Setup):**
```bash
# Generate 32-byte (256-bit) random key
openssl rand -base64 32 > /tmp/config-key.txt

# OR
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Storage:**
- **Development**: `.env` file (git-ignored)
- **Staging/Production**: GCP Secret Manager, Kubernetes Secrets, AWS SSM
- **Rotation**: Plan for quarterly key rotation (see Security Considerations)

**Validation:**
```typescript
const key = getEncryptionKey(); // Throws if invalid
// Checks: exists, base64-decodable, exactly 32 bytes
```

---

## Usage Examples

### Startup: Download Config Files

```typescript
import { downloadConfigFolder } from "@/shared/storage/secrets.js";

async function initializeApp() {
  try {
    // Download encrypted configs from GCS_CONFIG_BUCKET
    // Decrypts to LOCAL_BASE_FOLDER
    await downloadConfigFolder();
    
    console.log("Config files ready");
  } catch (error) {
    console.error("Failed to download config:", error);
    process.exit(1);
  }
}
```

### Read Config File

```typescript
import { getAsFile } from "@/shared/storage/secrets.js";
import { readFileSync } from "node:fs";

// Get absolute path to config file
const privateKeyPath = getAsFile("keys/private.key");

// Read file content
const privateKey = readFileSync(privateKeyPath, "utf-8");
```

### Upload Config Files (Admin CLI)

```typescript
import { uploadConfigFolderFrom } from "@/shared/storage/secrets.js";

async function uploadConfigs() {
  const localConfigDir = "/path/to/local/config";
  
  const count = await uploadConfigFolderFrom(localConfigDir);
  console.log(`Uploaded ${count} config files`);
}
```

### Cleanup on Shutdown

```typescript
import { cleanupConfigFolder } from "@/shared/storage/secrets.js";

process.on("SIGTERM", () => {
  cleanupConfigFolder(); // Remove LOCAL_BASE_FOLDER
  process.exit(0);
});

process.on("SIGINT", () => {
  cleanupConfigFolder();
  process.exit(0);
});
```

### Health Check Endpoint

```typescript
import { checkSecretsHealth } from "@/shared/storage/secrets.js";

app.get("/health/secrets", (req, res) => {
  const health = checkSecretsHealth();
  
  res.status(health.healthy ? 200 : 503).json(health);
  // {
  //   "healthy": true,
  //   "baseFolder": "/Users/user/.iep/config",
  //   "folderExists": true,
  //   "fileCount": 5
  // }
});
```

---

## Security Considerations

### 1. Key Security

**Storage:**
- ✅ **DO**: Store in GCP Secret Manager, Kubernetes Secrets, AWS SSM
- ✅ **DO**: Use environment variables (never commit to git)
- ❌ **DON'T**: Hard-code in source files
- ❌ **DON'T**: Store unencrypted in CI/CD logs

**Access Control:**
- Restrict access to production encryption key (least privilege)
- Use separate keys per environment (dev/staging/prod)
- Audit key access with Cloud Audit Logs

**Rotation:**
```bash
# Generate new key
NEW_KEY=$(openssl rand -base64 32)

# Download with old key, re-encrypt with new key
OLD_CONFIG_ENCRYPTION_KEY=$CONFIG_ENCRYPTION_KEY \
CONFIG_ENCRYPTION_KEY=$NEW_KEY \
npm run config:rotate-key
```

### 2. File Permissions

**Directories**: `0700` (rwx------)
- Only owner can read/write/execute
- Prevents other users from accessing config folder

**Files**: `0600` (rw-------)
- Only owner can read/write
- Prevents other users/processes from reading secrets

**Validation:**
```bash
# Check permissions
ls -la ~/.iep/config
# drwx------  5 user  staff   160 Feb  1 10:00 .
# -rw-------  1 user  staff  1234 Feb  1 10:00 private.key
```

### 3. Path Traversal Prevention

**Validation:**
```typescript
if (keyname.includes("..")) {
  throw new Error("keyname contains illegal path traversal");
}
```

**Safe Paths:**
- ✅ `ar.pub`
- ✅ `keys/private.key`
- ✅ `certs/ca.pem`

**Blocked Paths:**
- ❌ `../etc/passwd`
- ❌ `keys/../../secrets`

### 4. Encryption Best Practices

**Nonce Uniqueness:**
- Random 12-byte nonce generated per file
- Cryptographically secure random number generator
- Prevents nonce reuse (GCM requirement)

**Auth Tag Verification:**
- 16-byte tag ensures data integrity
- Detects tampering or corruption
- Fails decryption if tag mismatch

**Key Derivation (Future Enhancement):**
```typescript
// Derive per-file keys from master key + file path
const fileKey = deriveKey(masterKey, filePath);
```

### 5. Audit Logging

**Operations to Log:**
- Config folder download (count, bucket, timestamp)
- Config folder upload (count, bucket, user)
- Config file access (keyname, requester)
- Decryption failures (potential attacks)

**Implementation:**
```typescript
logger.info("Config folder downloaded", {
  bucket: "iep-config-prod",
  file_count: 5,
  duration_ms: 234,
  user: req.user?.id,
});

// TODO: Integrate with audit system
// audit.logConfigAccess(keyname, userId, success);
```

---

## Operational Procedures

### Initial Setup

**1. Create GCS Bucket:**
```bash
# Create config bucket
gcloud storage buckets create gs://iep-config-prod \
  --location=us-central1 \
  --uniform-bucket-level-access

# Set lifecycle (optional: delete old versions after 30 days)
gcloud storage buckets update gs://iep-config-prod \
  --lifecycle-file=lifecycle.json
```

**2. Generate Encryption Key:**
```bash
# Generate and save to Secret Manager
gcloud secrets create config-encryption-key \
  --data-file=<(openssl rand -base64 32)

# OR save to environment
export CONFIG_ENCRYPTION_KEY=$(openssl rand -base64 32)
echo $CONFIG_ENCRYPTION_KEY >> .env.production
```

**3. Upload Initial Config Files:**
```bash
# Prepare local config directory
mkdir -p /tmp/config-files
cp ar.pub /tmp/config-files/
cp keys/private.key /tmp/config-files/keys/
cp certs/ca.pem /tmp/config-files/certs/

# Upload via CLI
npm run config:upload -- /tmp/config-files
```

### Deployment Checklist

**Environment Variables:**
- [ ] `GCS_CONFIG_BUCKET` set
- [ ] `CONFIG_ENCRYPTION_KEY` set (from Secret Manager)
- [ ] `LOCAL_BASE_FOLDER` set (writable directory)
- [ ] `GCP_SERVICE_ACCOUNT_JSON_PATH` set (ADR-0007)

**Permissions:**
- [ ] Service account has `storage.objectViewer` on `GCS_CONFIG_BUCKET`
- [ ] Service account has `storage.objects.get` permission
- [ ] Application can write to `LOCAL_BASE_FOLDER`

**Testing:**
```bash
# Health check
curl http://localhost:3000/health/secrets

# Expected response:
# {
#   "healthy": true,
#   "baseFolder": "/app/.config",
#   "folderExists": true,
#   "fileCount": 5
# }
```

### Key Rotation

**Quarterly Rotation (Every 90 Days):**

```bash
# 1. Generate new key
NEW_KEY=$(openssl rand -base64 32)

# 2. Download with old key
CONFIG_ENCRYPTION_KEY=$OLD_KEY npm run config:download

# 3. Upload with new key
CONFIG_ENCRYPTION_KEY=$NEW_KEY npm run config:upload -- ~/.iep/config

# 4. Update Secret Manager
gcloud secrets versions add config-encryption-key \
  --data-file=<(echo $NEW_KEY)

# 5. Test decryption
CONFIG_ENCRYPTION_KEY=$NEW_KEY npm run config:download

# 6. Deploy with new key
kubectl set env deployment/iep-api CONFIG_ENCRYPTION_KEY=$NEW_KEY
```

### Disaster Recovery

**Backup:**
- Config files in GCS are durable (99.999999999% annual durability)
- Enable versioning for recovery from accidental overwrites
- Keep encryption key in multiple Secret Manager locations

**Recovery:**
```bash
# Download from GCS
CONFIG_ENCRYPTION_KEY=$BACKUP_KEY npm run config:download

# Verify integrity
npm run config:verify

# Restore to new bucket
CONFIG_ENCRYPTION_KEY=$BACKUP_KEY npm run config:upload -- ~/.iep/config
```

---

## Testing

### Unit Tests

```typescript
import { encryptFile, decryptFile, expandPath, getEncryptionKey } from "@/shared/storage/secrets";
import { randomBytes } from "crypto";

describe("secrets", () => {
  it("encrypts and decrypts file correctly", () => {
    const key = randomBytes(32);
    const plaintext = Buffer.from("secret config data");
    
    const keyInfo = { key, algorithm: "AES-256-GCM" };
    const ciphertext = encryptFile(keyInfo, plaintext);
    const decrypted = decryptFile(keyInfo, ciphertext);
    
    expect(decrypted).toEqual(plaintext);
  });
  
  it("rejects tampered ciphertext", () => {
    const key = randomBytes(32);
    const plaintext = Buffer.from("secret");
    
    const keyInfo = { key, algorithm: "AES-256-GCM" };
    const ciphertext = encryptFile(keyInfo, plaintext);
    
    // Tamper with ciphertext
    ciphertext[20] ^= 1;
    
    expect(() => decryptFile(keyInfo, ciphertext)).toThrow("decryption failed");
  });
  
  it("expands tilde paths", () => {
    const expanded = expandPath("~/.iep/config");
    expect(expanded).toContain("/Users/");
    expect(expanded).toMatch(/\.iep\/config$/);
  });
});
```

### Integration Tests

```typescript
describe("GCSConfigService", () => {
  it("uploads and downloads folder", async () => {
    const service = GCSConfigService.fromAppEnv();
    const keyInfo = { key: getEncryptionKey(), algorithm: "AES-256-GCM" };
    
    // Upload
    const uploadCount = await service.uploadFolder(keyInfo, "/tmp/test-config");
    expect(uploadCount).toBeGreaterThan(0);
    
    // Download
    const downloadCount = await service.downloadFolder(keyInfo, "/tmp/test-download");
    expect(downloadCount).toBe(uploadCount);
    
    // Verify content
    const original = readFileSync("/tmp/test-config/ar.pub");
    const downloaded = readFileSync("/tmp/test-download/ar.pub");
    expect(downloaded).toEqual(original);
  });
});
```

---

## Alternatives Considered

### 1. Store Secrets in Environment Variables

**Pros:**
- Simple deployment (no file management)
- Native Kubernetes/Docker support

**Cons:**
- ❌ Limited size (max ~32KB per variable)
- ❌ Not suitable for large files (certificates, keys)
- ❌ Visible in process listings (`ps aux`)
- ❌ Logged in container restart events

**Decision**: Rejected for large binary files and multi-file configs.

### 2. Use Kubernetes Secrets with Volume Mounts

**Pros:**
- Native Kubernetes integration
- Automatic rotation support
- RBAC access control

**Cons:**
- ❌ Kubernetes-only (not portable to other platforms)
- ❌ Size limit (1MB per secret)
- ❌ No encryption at rest by default (requires etcd encryption)

**Decision**: Rejected for portability and encryption requirements.

### 3. Client-Side Encryption in Application Code

**Pros:**
- Full control over encryption logic
- No external dependencies

**Cons:**
- ❌ Requires custom key management
- ❌ No atomic folder downloads
- ❌ Complex error handling

**Decision**: Accepted (implemented in secrets.ts).

### 4. GCP Secret Manager for All Config Files

**Pros:**
- Managed service (no bucket management)
- Built-in versioning and audit logs
- IAM-based access control

**Cons:**
- ❌ Cost (per secret + per access)
- ❌ API rate limits (6000 requests/minute)
- ❌ No folder structure (flat namespace)
- ❌ Requires separate API calls per secret

**Decision**: Rejected due to cost and performance for high-volume access.

### 5. Unencrypted GCS with Private Bucket

**Pros:**
- Simple implementation
- No key management

**Cons:**
- ❌ No encryption at rest (compliance violation)
- ❌ Vulnerable if bucket permissions misconfigured
- ❌ No tamper detection

**Decision**: Rejected for security requirements.

---

## Migration from Go Implementation

This TypeScript implementation is a direct port of the Go service:

| Go File                 | TypeScript File            | Changes                      |
|-------------------------|----------------------------|------------------------------|
| `secrets.go`            | `secrets.ts`               | Port to Node.js crypto API   |
| `s3configservice.go`    | `secrets.ts` (same file)   | Use GCS instead of S3        |
| MinIO S3 client         | `@google-cloud/storage`    | GCS SDK                      |
| `os.UserHomeDir()`      | `require('os').homedir()`  | Node.js equivalent           |
| `filepath.Walk`         | `fs.readdirSync` recursive | Directory traversal          |
| `crypto/cipher` (Go)    | `crypto` (Node.js)         | AES-256-GCM                  |

**Key Differences:**
- **Storage Backend**: S3 → GCS (bucket API compatible)
- **Encryption**: Go `crypto/cipher` → Node.js `crypto` module
- **Path Handling**: `filepath` → `path` module
- **Environment Variables**: Go `os.Getenv` → `appenv.get()`

**Compatibility:**
- ✅ Same encryption format (interoperable between Go/TS services)
- ✅ Same GCS bucket structure
- ✅ Same environment variable names

---

## Consequences

### Positive

✅ **Security**: Encrypted config files at rest and in transit  
✅ **Portability**: Works across dev/staging/production environments  
✅ **Simplicity**: Single folder download on startup  
✅ **Auditability**: All access logged to Cloud Audit Logs  
✅ **Consistency**: Matches existing Go service patterns  
✅ **Atomicity**: Atomic writes with temp files prevent corruption  

### Negative

❌ **Startup Dependency**: Application requires GCS connectivity to start  
❌ **Key Management**: Manual key rotation process (quarterly)  
❌ **Disk Usage**: Local cache requires disk space in `LOCAL_BASE_FOLDER`  
❌ **Single Point of Failure**: If GCS_CONFIG_BUCKET unavailable, startup fails  

### Mitigation

**Startup Dependency:**
- Implement retry logic with exponential backoff
- Health check endpoint shows config folder status
- Fallback to cached config if GCS temporarily unavailable

**Key Rotation:**
- Document quarterly rotation procedure
- Automate with cron job or CI/CD pipeline
- Monitor key age with alerts

**Disk Usage:**
- Cleanup on shutdown (`cleanupConfigFolder()`)
- Monitor disk usage in health checks
- Set max folder size limits

**Availability:**
- Use GCS multi-region buckets (99.95% SLA)
- Enable object versioning for rollback
- Keep local backup of config files

---

## Future Enhancements

1. **Automatic Key Rotation**
   - Monthly rotation via Cloud Scheduler
   - Zero-downtime rotation with dual-key support

2. **Per-File Key Derivation**
   - Derive file-specific keys from master key + file path
   - Limits blast radius of key compromise

3. **Compression**
   - Compress before encryption (reduces storage costs)
   - `gzip` + `AES-256-GCM`

4. **Caching Layer**
   - In-memory cache for frequently accessed configs
   - TTL-based invalidation

5. **Versioning Support**
   - Track config file versions in GCS metadata
   - Rollback to previous versions

6. **Audit Integration**
   - Log all config access to audit system
   - Alert on suspicious access patterns

---

## References

- **ADR-0007**: GCS Signed URL Configuration (service account setup)
- **NIST SP 800-38D**: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC
- **Go Implementation**: `apps/api/src/storage/secrets.go`, `s3configservice.go`
- **GCS Documentation**: https://cloud.google.com/storage/docs
- **Node.js Crypto**: https://nodejs.org/api/crypto.html

---

## Appendix: CLI Commands

### Generate Encryption Key
```bash
openssl rand -base64 32
```

### Create GCS Bucket
```bash
gcloud storage buckets create gs://iep-config-prod \
  --location=us-central1 \
  --uniform-bucket-level-access
```

### Upload Config Files
```bash
npm run config:upload -- /path/to/config
```

### Download Config Files
```bash
npm run config:download
```

### Check Health
```bash
curl http://localhost:3000/health/secrets
```

### Cleanup
```bash
npm run config:cleanup
```

---

**End of ADR-0008**
