# ADR-0011: Cloud Run Signed URL Permissions

**Status**: Active  
**Date**: 2026-02-04  
**Context**: Cloud Run deployment failing with "Permission 'iam.serviceAccounts.signBlob' denied"

---

## Problem Statement

When deploying to **Google Cloud Run**, the application fails to generate signed URLs with the error:

```
Permission 'iam.serviceAccounts.signBlob' denied on resource (or it may not exist)
```

This occurs because:
1. Cloud Run uses **Application Default Credentials (ADC)** with Workload Identity
2. The service account doesn't have permission to call `iam.serviceAccounts.signBlob` API
3. Unlike local development with JSON keys, Cloud Run requires explicit IAM permissions for signing

---

## Root Cause

**Standard signing flow** (works locally with JSON key):
```typescript
// Uses private key from service account JSON file
const [url] = await file.getSignedUrl({
  version: "v4",
  action: "read",
  expires: Date.now() + 3600 * 1000,
});
// ✅ Works locally - private key available in JSON file
// ❌ Fails in Cloud Run - no JSON file, uses ADC
```

**Cloud Run environment**:
- No service account JSON key file
- Uses **Workload Identity** (metadata service)
- Requires **IAM Credentials API** (`iam.serviceAccounts.signBlob` permission)
- Service account must be granted `roles/iam.serviceAccountTokenCreator`

---

## Solution Options

### **Option 1: Grant Service Account Self-Impersonation (Recommended)**

Allow the service account to sign blobs by granting it permission to impersonate itself:

```bash
# Get your Cloud Run service account email
SERVICE_ACCOUNT=$(gcloud run services describe YOUR_SERVICE \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

echo "Service Account: $SERVICE_ACCOUNT"

# Grant the service account permission to sign blobs (self-impersonation)
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:$SERVICE_ACCOUNT"
```

**What this does**:
- Grants `iam.serviceAccounts.signBlob` permission
- Allows service account to call IAM Credentials API on itself
- No code changes needed - standard `getSignedUrl()` will work

**Verify it works**:
```bash
# Deploy and test
gcloud run deploy YOUR_SERVICE \
  --service-account=$SERVICE_ACCOUNT \
  --region=us-central1

# Test signed URL endpoint
curl "https://YOUR_SERVICE_URL/api/v1/iep/DOCUMENT_ID/download" \
  -H "Authorization: Bearer $TOKEN"
```

---

### **Option 2: Use IAM Credentials API (Fallback)**

If Option 1 doesn't work or is blocked by organization policy, the application now includes **automatic fallback** to IAM Credentials API.

**How it works**:
1. Try standard `getSignedUrl()` first
2. If it fails with "signBlob" error, call IAM Credentials API directly
3. Build signed URL manually using API response

**Code implementation** (already added to `gcs.ts`):
```typescript
async presignUrl(params: {
  objectKey: string;
  action: SignedUrlAction;
  expiresInSeconds: number;
}): Promise<string> {
  try {
    // Try standard signing first
    const [url] = await file.getSignedUrl({ ... });
    return url;
  } catch (error) {
    // Fallback to IAM Credentials API
    if (error.message?.includes('signBlob')) {
      return this.signUrlWithIAM(params);
    }
    throw error;
  }
}
```

**Required permission** (same as Option 1):
```bash
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:$SERVICE_ACCOUNT"
```

---

### **Option 3: Use Public Bucket with Token-Based Access**

If signed URLs are too complex, switch to **public bucket + application-level tokens**:

```typescript
// Generate download token in application
const downloadToken = jwt.sign({ 
  documentId, 
  userId 
}, SECRET, { expiresIn: '1h' });

// Store object with public-read ACL
await file.save(buffer, {
  metadata: { 
    cacheControl: 'private, max-age=3600',
  },
  predefinedAcl: 'publicRead',
});

// Return URL with application token
return {
  url: `https://storage.googleapis.com/bucket/${objectKey}?token=${downloadToken}`
};
```

**Pros**:
- ✅ No IAM permissions needed
- ✅ Simple to implement
- ✅ Works everywhere (Cloud Run, local, etc.)

**Cons**:
- ❌ Files are publicly accessible (anyone with URL can download)
- ❌ Must implement application-level access control
- ❌ Token validation adds latency

---

## Recommended Approach

**For Cloud Run Production**:
1. ✅ Use **Option 1** (grant `roles/iam.serviceAccountTokenCreator`)
2. ✅ Keep **Option 2** as automatic fallback (already implemented)
3. ✅ No code changes needed

**Implementation Steps**:

```bash
#!/bin/bash
# deploy-cloud-run.sh

# 1. Get service account
SERVICE_ACCOUNT=$(gcloud run services describe iep-api \
  --region=us-central1 \
  --format='value(spec.template.spec.serviceAccountName)')

# 2. Grant signing permission
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:$SERVICE_ACCOUNT"

# 3. Grant storage permissions (if not already set)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/storage.objectViewer"

# 4. Deploy Cloud Run
gcloud run deploy iep-api \
  --source=. \
  --service-account=$SERVICE_ACCOUNT \
  --region=us-central1 \
  --allow-unauthenticated=false

echo "✅ Deployment complete"
echo "Service Account: $SERVICE_ACCOUNT"
echo "Permissions: roles/iam.serviceAccountTokenCreator, roles/storage.objectViewer"
```

---

## Environment Variables

**Cloud Run deployment** does NOT need:
- ❌ `GCP_SERVICE_ACCOUNT_JSON_PATH` (uses Workload Identity)
- ❌ Service account JSON key file

**Required variables**:
```bash
GCS_BUCKET=your-bucket-name          # ✅ Required
GCP_PROJECT_ID=your-project-id       # ✅ Required
```

**Update Dockerfile**:
```dockerfile
# Remove this - not needed for Cloud Run
# COPY service-account.json /etc/secrets/
# ENV GCP_SERVICE_ACCOUNT_JSON_PATH=/etc/secrets/service-account.json

# Only set these
ENV GCS_BUCKET=iep-documents
ENV GCP_PROJECT_ID=your-project-id
```

---

## Testing

### 1. **Verify Service Account Permissions**
```bash
SERVICE_ACCOUNT="iep-api@your-project.iam.gserviceaccount.com"

# Check if service account has signing permission
gcloud iam service-accounts get-iam-policy $SERVICE_ACCOUNT \
  --format=json | jq '.bindings[] | select(.role=="roles/iam.serviceAccountTokenCreator")'

# Expected output:
{
  "members": [
    "serviceAccount:iep-api@your-project.iam.gserviceaccount.com"
  ],
  "role": "roles/iam.serviceAccountTokenCreator"
}
```

### 2. **Test Signed URL Generation**
```bash
# Get auth token
TOKEN=$(gcloud auth print-identity-token)

# Upload a test document
curl -X POST https://YOUR_SERVICE_URL/api/v1/iep/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "childId=test-child-123" \
  -F "file=@sample.pdf"

# Get signed URL
DOWNLOAD_URL=$(curl -s https://YOUR_SERVICE_URL/api/v1/iep/DOC_ID/download \
  -H "Authorization: Bearer $TOKEN" | jq -r '.downloadUrl')

echo "Signed URL: $DOWNLOAD_URL"

# Download file (no auth needed)
curl "$DOWNLOAD_URL" -o test-download.pdf

# Verify file size
ls -lh test-download.pdf
```

### 3. **Check Cloud Run Logs**
```bash
gcloud run services logs read iep-api \
  --region=us-central1 \
  --limit=50 \
  | grep -i "signed url\|signblob\|permission"
```

**Expected logs (success)**:
```
INFO: GCS initialized {credentials: "adc"}
INFO: Generating signed URL {objectKey: "documents/abc123.pdf"}
INFO: Signed URL generated successfully
```

**Error logs (permission issue)**:
```
WARN: Standard signed URL failed, using IAM Credentials API
ERROR: IAM Credentials API signing failed: Permission denied
```

---

## Security Considerations

### **Principle of Least Privilege**

The service account needs **two roles**:

1. **Storage Object Viewer** (`roles/storage.objectViewer`):
   - `storage.objects.get` - Read objects
   - `storage.buckets.get` - Access bucket metadata

2. **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`):
   - `iam.serviceAccounts.signBlob` - Sign URLs
   - **Only on itself** (self-impersonation)

```bash
# Grant storage permissions at project level
gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/storage.objectViewer"

# Grant signing permissions (self-impersonation only)
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:$SERVICE_ACCOUNT"
```

### **Why Self-Impersonation is Safe**

- Service account can **only sign blobs for itself**, not other accounts
- No escalation of privileges
- Required for standard GCS signed URL generation
- Industry best practice for Cloud Run + GCS

### **Monitoring**

Enable **Cloud Audit Logs** to track signing operations:

```bash
# Enable IAM audit logs
gcloud projects set-iam-policy YOUR_PROJECT policy.yaml
```

**policy.yaml**:
```yaml
auditConfigs:
- service: iamcredentials.googleapis.com
  auditLogConfigs:
  - logType: ADMIN_READ
  - logType: DATA_READ
  - logType: DATA_WRITE
```

**Query audit logs**:
```bash
gcloud logging read 'resource.type="service_account"
  AND protoPayload.methodName="google.iam.credentials.v1.IAMCredentials.SignBlob"' \
  --limit=50 \
  --format=json
```

---

## Troubleshooting

### **Issue**: "Permission denied on resource"

**Cause**: Service account lacks `roles/iam.serviceAccountTokenCreator`

**Fix**:
```bash
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:$SERVICE_ACCOUNT"
```

---

### **Issue**: "Service account does not exist"

**Cause**: Cloud Run using default compute service account

**Fix**: Create dedicated service account
```bash
# Create service account
gcloud iam service-accounts create iep-api \
  --display-name="IEP API Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT \
  --member="serviceAccount:iep-api@YOUR_PROJECT.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud iam service-accounts add-iam-policy-binding \
  iep-api@YOUR_PROJECT.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:iep-api@YOUR_PROJECT.iam.gserviceaccount.com"

# Deploy Cloud Run with service account
gcloud run deploy iep-api \
  --service-account=iep-api@YOUR_PROJECT.iam.gserviceaccount.com
```

---

### **Issue**: Organization policy blocks `iam.serviceAccountTokenCreator`

**Cause**: Org policy restricts service account impersonation

**Workaround**: Use **Option 3** (public bucket + app tokens)

---

## Consequences

### **Positive**
- ✅ Works in Cloud Run without JSON keys
- ✅ Uses native Workload Identity (more secure)
- ✅ Automatic fallback to IAM Credentials API
- ✅ No service account key rotation needed
- ✅ Follows GCP best practices

### **Negative**
- ⚠️ Requires IAM permission configuration
- ⚠️ Different setup than local development
- ⚠️ Organization policies may block self-impersonation

### **Mitigations**
- Document Cloud Run deployment steps clearly
- Provide automated deployment script
- Include IAM permission verification in health check
- Monitor audit logs for signing failures

---

## Related Files

- **GCS Service**: [src/shared/storage/gcs.ts](../../src/shared/storage/gcs.ts)
- **Previous ADR**: [0007-signedurl-issue.md](./0007-signedurl-issue.md)
- **Deployment**: `deploy-cloud-run.sh` (to be created)

---

## References

- [Cloud Run Service Identity](https://cloud.google.com/run/docs/securing/service-identity)
- [IAM Credentials API](https://cloud.google.com/iam/docs/reference/credentials/rest)
- [GCS Signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls)
- [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Service Account Self-Impersonation](https://cloud.google.com/iam/docs/service-account-permissions#token-creator-role)

---

## Summary

**For Cloud Run deployments**:
1. Grant service account `roles/iam.serviceAccountTokenCreator` (self-impersonation)
2. Remove `GCP_SERVICE_ACCOUNT_JSON_PATH` from environment
3. Code automatically falls back to IAM Credentials API if needed
4. Monitor logs for signing errors

**One-line fix**:
```bash
gcloud iam service-accounts add-iam-policy-binding YOUR_SERVICE_ACCOUNT \
  --role=roles/iam.serviceAccountTokenCreator \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT"
```
