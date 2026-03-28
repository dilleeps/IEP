# ADR-0004: Multi-Role Access Control (Phase 2)

## Status

**Proposed** (Deferred to Phase 2)

## Date

2026-02-01

---

## Context

**Current State (Phase 1):**
- Only **PARENT** role can upload IEP documents
- Parent owns the child profile and all associated documents
- Simple authorization: `if (req.user.id !== childProfile.userId) throw Forbidden`

**Future Need (Phase 2):**
- **ADVOCATE** may upload documents on behalf of parent (with permission)
- **ADMIN** may upload documents for data migration or support
- **TEACHER_THERAPIST** may upload progress reports or evaluations
- Need to track **who uploaded** vs **who owns** the child's data

**Requirements from [requirements.md](../references/requirements.md):**
- **UM-02:** Role-based Access Control - Define roles: Parent (owner), Teacher/Therapist (contributor), Advocate (viewer)
- **UM-03:** Consent Management - Parent grants/revokes access to child data. Access changes logged.
- **SC-03:** Audit Trail - Record all access, changes, and exports

---

## Decision Summary

### Ownership vs Access Model

**Owner (Parent):**
- Creates the child profile
- Controls who can access child's data
- Receives all notifications and alerts
- Can revoke access at any time

**Delegated Access (Advocate/Admin/Teacher):**
- Can perform actions **on behalf of** parent (with permission)
- Actions tracked with `uploadedById`, `createdBy`, `modifiedBy`
- Audit log shows who performed action and for which child

---

## Schema Changes (Phase 2)

### 1. Access Control Table

```typescript
ChildAccess {
  id: UUID (PK)
  childId: UUID (FK → ChildProfile)
  userId: UUID (FK → User) // Who is being granted access
  grantedBy: UUID (FK → User) // Parent who granted access
  
  // Access level
  role: enum (advocate, teacher_therapist, admin, support)
  permissions: jsonb // { canUpload: true, canEdit: false, canView: true, canDelete: false }
  
  // Status
  status: enum (active, revoked, expired)
  revokedAt: timestamp | null
  revokedBy: UUID (FK → User) | null
  revokedReason: text | null
  
  // Timeline
  grantedAt: timestamp
  expiresAt: timestamp | null // Optional expiration
  
  createdAt, updatedAt
}

// Indexes
CREATE INDEX idx_child_access_user ON child_access(user_id, status);
CREATE INDEX idx_child_access_child ON child_access(child_id, status);
```

### 2. Enhanced IepDocument (Already Prepared in Phase 1)

```typescript
IepDocument {
  // ... existing fields ...
  userId: UUID // Parent owner (never changes)
  uploadedById: UUID // Who performed the upload (parent/advocate/admin)
  // ... rest of fields ...
}
```

**Phase 1 Implementation:**
- `userId` and `uploadedById` are the same (always parent)
- Schema ready for Phase 2 expansion

**Phase 2 Implementation:**
- `userId` still points to parent (owner)
- `uploadedById` can be advocate/admin (uploader)

### 3. Access Audit Log

```typescript
AccessLog {
  id: UUID (PK)
  userId: UUID (FK → User) // Who performed the action
  childId: UUID (FK → ChildProfile) // Which child's data
  action: enum (view, upload, edit, delete, download, grant_access, revoke_access)
  resourceType: enum (document, goal, progress, service)
  resourceId: UUID | null // Specific resource accessed
  
  // Context
  ipAddress: string
  userAgent: string
  outcome: enum (success, denied, error)
  denialReason: text | null
  
  createdAt: timestamp
}

// Indexes
CREATE INDEX idx_access_log_user ON access_logs(user_id, created_at DESC);
CREATE INDEX idx_access_log_child ON access_logs(child_id, created_at DESC);
CREATE INDEX idx_access_log_action ON access_logs(action, created_at DESC);
```

---

## Authorization Logic (Phase 2)

### Upload Document Authorization

```typescript
async canUploadDocument(userId: UUID, childId: UUID): Promise<boolean> {
  // Check if user is parent (owner)
  const child = await ChildProfile.findByPk(childId);
  if (child.userId === userId) return true;
  
  // Check if user has delegated access
  const access = await ChildAccess.findOne({
    where: {
      childId,
      userId,
      status: 'active',
      expiresAt: { [Op.or]: [null, { [Op.gte]: new Date() }] }
    }
  });
  
  if (!access) return false;
  
  // Check permission
  return access.permissions.canUpload === true;
}
```

### Grant Access (Parent Only)

```typescript
async grantAccess(parentId: UUID, childId: UUID, targetUserId: UUID, role: string) {
  // Verify parent owns child
  const child = await ChildProfile.findByPk(childId);
  if (child.userId !== parentId) {
    throw new ForbiddenError('Only parent can grant access');
  }
  
  // Define permissions based on role
  const permissions = getDefaultPermissions(role);
  
  // Create access record
  await ChildAccess.create({
    childId,
    userId: targetUserId,
    grantedBy: parentId,
    role,
    permissions,
    status: 'active',
    grantedAt: new Date()
  });
  
  // Audit log
  await AccessLog.create({
    userId: parentId,
    childId,
    action: 'grant_access',
    resourceType: 'child_access',
    outcome: 'success'
  });
}
```

### Default Permissions by Role

```typescript
function getDefaultPermissions(role: string) {
  const permissionMap = {
    advocate: {
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: false,
      canDownload: true,
      canGrantAccess: false
    },
    teacher_therapist: {
      canView: true,
      canUpload: true, // Progress reports, service logs
      canEdit: false, // Can't edit IEP documents
      canDelete: false,
      canDownload: false,
      canGrantAccess: false
    },
    admin: {
      canView: true,
      canUpload: true,
      canEdit: true,
      canDelete: true,
      canDownload: true,
      canGrantAccess: false // Only parent can grant
    }
  };
  
  return permissionMap[role] || { canView: false };
}
```

---

## API Changes (Phase 2)

### Grant Access API

**Endpoint:** `POST /api/v1/children/:childId/access`

**Request:**
```json
{
  "userId": "uuid-of-advocate",
  "role": "advocate",
  "expiresAt": "2026-12-31T23:59:59Z",
  "customPermissions": {
    "canUpload": true,
    "canEdit": true,
    "canDelete": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessId": "uuid",
    "userId": "uuid-of-advocate",
    "childId": "uuid",
    "role": "advocate",
    "permissions": {
      "canView": true,
      "canUpload": true,
      "canEdit": true,
      "canDelete": false
    },
    "status": "active",
    "grantedAt": "2026-02-01T12:00:00Z",
    "expiresAt": "2026-12-31T23:59:59Z"
  }
}
```

### Revoke Access API

**Endpoint:** `DELETE /api/v1/children/:childId/access/:accessId`

**Response:**
```json
{
  "success": true,
  "message": "Access revoked successfully"
}
```

### List Access API

**Endpoint:** `GET /api/v1/children/:childId/access`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "accessId": "uuid",
      "user": {
        "id": "uuid",
        "name": "Advocate Smith",
        "email": "advocate@example.com",
        "role": "advocate"
      },
      "permissions": { "canView": true, "canUpload": true },
      "grantedAt": "2026-01-15T10:00:00Z",
      "status": "active"
    }
  ]
}
```

---

## Upload Flow (Phase 2)

### Current (Phase 1):
```
Parent uploads document
  ↓
userId = req.user.id (parent)
uploadedById = req.user.id (same as parent)
  ↓
Document saved
```

### Future (Phase 2):
```
Advocate uploads document on behalf of parent
  ↓
Check ChildAccess: Does advocate have canUpload permission?
  ↓
userId = childProfile.userId (parent - owner)
uploadedById = req.user.id (advocate - uploader)
  ↓
Document saved + audit log
  ↓
Parent receives notification: "Your advocate uploaded IEP document"
```

---

## UI Changes (Phase 2)

### Parent Dashboard - Access Management

```
--------------------------------------------------
| Manage Access - Child: Arjun                    |
--------------------------------------------------
| Active Access:                                  |
--------------------------------------------------
| 👤 Advocate Smith (advocate@example.com)        |
| Permissions: View, Upload, Edit                 |
| Granted: Jan 15, 2026                           |
| [Revoke Access]                                 |
--------------------------------------------------
| 🏫 Ms. Johnson (teacher@school.edu)             |
| Permissions: View, Upload Progress              |
| Granted: Sep 1, 2025                            |
| Expires: Aug 31, 2026                           |
| [Revoke Access]                                 |
--------------------------------------------------
| [+ Grant New Access]                            |
--------------------------------------------------
```

### Document List - Show Uploader

```
--------------------------------------------------
| IEP Documents - Arjun                           |
--------------------------------------------------
| 📄 IEP 2024-2025                                |
| Uploaded by: You (Parent)                       |
| Date: Sep 1, 2024                               |
--------------------------------------------------
| 📄 Progress Report Q2                           |
| Uploaded by: Ms. Johnson (Teacher)              |
| Date: Jan 15, 2025                              |
--------------------------------------------------
```

---

## Security Considerations

### FERPA Compliance

**34 CFR § 99.31** - Disclosures without consent:
- School officials with legitimate educational interest
- Parent-authorized representatives (advocates)

**Implementation:**
1. **Written Consent:** Parent must explicitly grant access (via UI action)
2. **Audit Trail:** All access logged with timestamp and action
3. **Revocable:** Parent can revoke access instantly
4. **Limited Scope:** Access granted per child (not all children)
5. **Time-Bound:** Optional expiration dates

### Rate Limiting

```typescript
// Different rate limits by role
const rateLimits = {
  parent: { uploads: 50, requests: 1000 },
  advocate: { uploads: 20, requests: 500 },
  teacher_therapist: { uploads: 30, requests: 300 },
  admin: { uploads: 100, requests: 5000 }
};
```

---

## Migration Strategy

### Phase 1 → Phase 2 Migration

```sql
-- Add uploadedById to existing documents (backfill with userId)
UPDATE iep_documents 
SET uploaded_by_id = user_id 
WHERE uploaded_by_id IS NULL;

-- Make uploadedById non-nullable after backfill
ALTER TABLE iep_documents 
ALTER COLUMN uploaded_by_id SET NOT NULL;

-- Create access control tables
CREATE TABLE child_access (...);
CREATE TABLE access_logs (...);
```

**No breaking changes:** Existing Phase 1 API continues to work.

---

## Trade-Offs

| Decision | Benefit | Trade-Off |
|----------|---------|-----------|
| **Separate uploadedById field** | Track uploader vs owner | Slight schema complexity |
| **Permission-level granularity** | Flexible access control | More complex authorization logic |
| **Expiration dates** | Auto-revoke after time | Need scheduled job to check |
| **Audit logging** | Full transparency | Storage overhead |
| **Parent-only grant** | Parent retains control | Admin can't force access (requires parent consent) |

---

## Implementation Timeline

**Phase 1 (Current):**
- ✅ Schema includes `uploadedById` field (prepared for future)
- ✅ Simple authorization: parent-only uploads

**Phase 2 (Future):**
- Add `ChildAccess` and `AccessLog` tables
- Implement grant/revoke APIs
- Update authorization middleware to check delegated access
- Add UI for access management
- Implement notifications for delegated actions

---

## Success Metrics (Phase 2)

- ✅ Parent can grant access in < 30 seconds
- ✅ Access revocation takes effect immediately (< 1 second)
- ✅ 100% of delegated actions logged in audit trail
- ✅ Zero unauthorized access incidents
- ✅ < 5% of access grants revoked due to misconfiguration

---

## References

- [requirements.md](../references/requirements.md) - UM-02, UM-03, SC-03
- [0002-document-upload-and-ai-extraction.md](./0002-document-upload-and-ai-extraction.md) - Upload flow
- [0003-database-schema-and-dashboard-architecture.md](./0003-database-schema-and-dashboard-architecture.md) - Schema design
- FERPA 34 CFR § 99.31: Disclosure without consent

---

**Final Note:** Phase 1 schema is **forward-compatible** with Phase 2 multi-role access. The `uploadedById` field is already in place, allowing seamless migration when Phase 2 is implemented.
