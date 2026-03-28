# ADR-0007: GCS Signed URL Configuration for Document Downloads

**Status**: Resolved  
**Date**: 2026-02-01  
**Context**: Production document download endpoint failing with "Cannot sign data without 'client_email'"

---

## Problem Statement

The document download endpoint (`GET /api/v1/iep/:id/download`) was failing with the error:
```
Error: Cannot sign data without 'client_email'
```

This occurs when Google Cloud Storage (GCS) attempts to generate signed URLs without proper service account credentials.

---

## Root Cause

GCS signed URLs require:
1. A service account with Storage permissions
2. Access to the service account's private key and email
3. The `@google-cloud/storage` library uses these credentials to cryptographically sign the URL

**Current Issue**: The application was configured with:
- ✅ `GCS_BUCKET` - Bucket name
- ✅ `GCP_PROJECT_ID` - Project ID
- ❌ `GCP_SERVICE_ACCOUNT_JSON_PATH` - **MISSING** (causes the error)

Without the service account JSON file, the GCS client cannot access `client_email` or `private_key` needed for URL signing.

---

## Solution

### Required Environment Variables

Add the following to your `.env` file:

```bash
# Google Cloud Storage Configuration
GCS_BUCKET=your-bucket-name                           # ✅ Already configured
GCP_PROJECT_ID=your-gcp-project-id                    # ✅ Already configured

# Service Account JSON Path (REQUIRED for signed URLs)
GCP_SERVICE_ACCOUNT_JSON_PATH=/path/to/service-account-key.json  # ⚠️ ADD THIS
```

### Service Account Setup Steps

#### 1. Create Service Account (if not exists)
```bash
gcloud iam service-accounts create iep-storage-signer \
  --display-name="IEP Document Storage Signer" \
  --project=your-project-id
```

#### 2. Grant Storage Permissions
```bash
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:iep-storage-signer@your-project-id.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

**Minimum Required Permissions**:
- `storage.objects.get` - Read objects
- `storage.buckets.get` - Access bucket metadata
- `iam.serviceAccounts.signBlob` - Sign URLs (implicit with service account key)

#### 3. Create and Download JSON Key
```bash
gcloud iam service-accounts keys create ~/gcs-service-account.json \
  --iam-account=iep-storage-signer@your-project-id.iam.gserviceaccount.com
```

**OR via Console**:
1. Go to **GCP Console** → **IAM & Admin** → **Service Accounts**
2. Click on service account → **Keys** tab
3. Click **Add Key** → **Create new key** → **JSON**
4. Download and save securely

#### 4. Secure the Key File
```bash
# Move to secure location (e.g., /etc/secrets/)
sudo mkdir -p /etc/secrets
sudo mv ~/gcs-service-account.json /etc/secrets/
sudo chmod 600 /etc/secrets/gcs-service-account.json
sudo chown app-user:app-user /etc/secrets/gcs-service-account.json
```

#### 5. Update Environment Variable
```bash
# In .env
GCP_SERVICE_ACCOUNT_JSON_PATH=/etc/secrets/gcs-service-account.json
```

---

## How Signed URLs Work

### Code Flow

```typescript
// 1. User requests download
GET /api/v1/iep/:id/download

// 2. Controller calls service
const downloadUrl = await this.service.getDownloadUrl(documentId, 3600);

// 3. Service calls GCS
const storage = getStorageService();
return storage.downloadURL(doc.storagePath, expiresInSeconds);

// 4. GCS generates signed URL
const file = this.bucket().file(objectKey);
const [url] = await file.getSignedUrl({
  version: "v4",
  action: "read",
  expires: Date.now() + expiresInSeconds * 1000,
});

// 5. Signed URL returned to client
{ "downloadUrl": "https://storage.googleapis.com/bucket/path?X-Goog-Algorithm=..." }
```

### Signed URL Components

Example signed URL:
```
https://storage.googleapis.com/bucket-name/documents/uuid.pdf
  ?X-Goog-Algorithm=GOOG4-RSA-SHA256
  &X-Goog-Credential=service-account%40project.iam.gserviceaccount.com%2F20260201%2Fauto%2Fstorage%2Fgoog4_request
  &X-Goog-Date=20260201T120000Z
  &X-Goog-Expires=3600
  &X-Goog-SignedHeaders=host
  &X-Goog-Signature=abc123...
```

**Key Parameters**:
- `X-Goog-Algorithm`: Signing algorithm (GOOG4-RSA-SHA256)
- `X-Goog-Credential`: Service account email + date/region
- `X-Goog-Date`: Timestamp when URL was generated
- `X-Goog-Expires`: Seconds until expiration (3600 = 1 hour)
- `X-Goog-Signature`: Cryptographic signature using service account's private key

**Security Benefits**:
- ✅ No need to expose GCS bucket publicly
- ✅ Time-limited access (expires after 1 hour by default)
- ✅ No authentication required on client side
- ✅ Direct download from GCS (no proxy through API server)
- ✅ Cost-effective (bandwidth from GCS, not API server)

---

## Service Account JSON Structure

The JSON file must contain these fields:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "iep-storage-signer@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**Critical Fields for Signing**:
- `client_email` - Service account email (used in signature)
- `private_key` - RSA private key (signs the URL)
- `project_id` - GCP project identifier

---

## Alternative: Application Default Credentials (ADC)

**For Development Only**:
```bash
gcloud auth application-default login
```

**Why NOT for Production**:
- ❌ Requires human login session
- ❌ Cannot be automated in CI/CD
- ❌ Credentials stored in user's home directory
- ❌ Not suitable for containers/servers
- ❌ May not have signing permissions

**Use service account JSON for production!**

---

## Error Handling

Updated code in `gcs.ts` includes fallback:

```typescript
async presignUrl(params: {
  objectKey: string;
  action: SignedUrlAction;
  expiresInSeconds: number;
}): Promise<string> {
  const file = this.bucket().file(params.objectKey);

  try {
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: params.action,
      expires: Date.now() + params.expiresInSeconds * 1000,
    });

    return url;
  } catch (error: any) {
    // If signed URL fails (missing service account), log error
    if (error.message?.includes('client_email')) {
      logger.error('Signed URL generation failed - service account not configured', { 
        objectKey: params.objectKey,
        error: error.message,
        help: 'Set GCP_SERVICE_ACCOUNT_JSON_PATH environment variable'
      });
    }
    throw error; // Re-throw to show user proper error
  }
}
```

---

## Testing the Fix

### 1. Verify Environment Variable
```bash
echo $GCP_SERVICE_ACCOUNT_JSON_PATH
# Should output: /etc/secrets/gcs-service-account.json

cat $GCP_SERVICE_ACCOUNT_JSON_PATH | jq .client_email
# Should output: "iep-storage-signer@your-project.iam.gserviceaccount.com"
```

### 2. Test Download Endpoint
```bash
# Upload a document first
curl -X POST http://localhost:3000/api/v1/iep/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "childId=$CHILD_ID" \
  -F "file=@sample.pdf"

# Get signed download URL
curl http://localhost:3000/api/v1/iep/$DOC_ID/download \
  -H "Authorization: Bearer $TOKEN"

# Response should be:
{
  "downloadUrl": "https://storage.googleapis.com/bucket/path?X-Goog-Algorithm=..."
}
```

### 3. Verify Signed URL Works
```bash
# Download file using signed URL (no auth needed)
curl "$DOWNLOAD_URL" -o downloaded.pdf

# Check file size
ls -lh downloaded.pdf
```

---

## Deployment Checklist

- [ ] Create GCP service account with Storage Object Viewer role
- [ ] Generate and download JSON key file
- [ ] Store key file securely on server (`/etc/secrets/`)
- [ ] Set file permissions to 600 (read/write owner only)
- [ ] Add `GCP_SERVICE_ACCOUNT_JSON_PATH` to `.env`
- [ ] Restart application
- [ ] Test download endpoint
- [ ] Verify signed URLs expire correctly (wait 1+ hour)
- [ ] Monitor logs for signing errors
- [ ] Set up key rotation policy (recommended: every 90 days)

---

## Security Considerations

### Service Account Key Rotation
```bash
# Every 90 days, create new key
gcloud iam service-accounts keys create ~/new-key.json \
  --iam-account=iep-storage-signer@project.iam.gserviceaccount.com

# Deploy new key to production
# Update GCP_SERVICE_ACCOUNT_JSON_PATH

# Delete old key after verification
gcloud iam service-accounts keys delete $OLD_KEY_ID \
  --iam-account=iep-storage-signer@project.iam.gserviceaccount.com
```

### Least Privilege Permissions
```bash
# Use custom role for minimum permissions
gcloud iam roles create iepDocumentSigner \
  --project=your-project-id \
  --permissions=storage.objects.get,storage.buckets.get
```

### Monitoring
```bash
# Enable Cloud Audit Logs for storage access
# Monitor for:
# - Failed signing attempts
# - Unusual download patterns
# - Expired URL usage attempts
```

---

## Related Files

- **GCS Service**: `src/shared/storage/gcs.ts`
- **Document Service**: `src/modules/document/document.service.ts`
- **Document Controller**: `src/modules/document/document.controller.ts`
- **Environment Config**: `src/config/appenv.ts`
- **API Tests**: `requests/analyse/iep-analysis-workflow.http#L654`

---

## References

- [GCS Signed URLs Documentation](https://cloud.google.com/storage/docs/access-control/signed-urls)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [@google-cloud/storage Node.js Docs](https://googleapis.dev/nodejs/storage/latest/)
- [ADR-0001: IEP Document Processing](./0001-iep-analyserdesign.md)

---

## Consequences

### Positive
- ✅ Secure document downloads without exposing GCS publicly
- ✅ Time-limited access reduces security risk
- ✅ Cost-effective (direct download from GCS, no API bandwidth)
- ✅ Scalable (no proxy through API server)

### Negative
- ⚠️ Requires service account management
- ⚠️ Key rotation adds operational overhead
- ⚠️ Service account JSON must be kept secure

### Mitigations
- Automate key rotation (every 90 days)
- Use secrets management (e.g., GCP Secret Manager, Kubernetes Secrets)
- Monitor for unauthorized access attempts
- Implement proper file permissions (600)
