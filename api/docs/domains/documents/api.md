# Documents API

## Overview
Manage IEP-related documents including current IEPs, previous IEPs, progress reports, evaluations, and other supporting documentation. Supports file upload, storage, and metadata tracking.

---

## POST /documents

Upload a new document.

**Access**: PARENT, ADVOCATE, ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
```
file: <binary file>
childId: uuid
documentType: current_iep | previous_iep | progress_report | evaluation | other
metadata: {"notes": "2025-2026 school year IEP"}
```

**Validation**:
- `file`: Required, max size 10MB
- `childId`: Required, valid UUID, must be owned by user
- `documentType`: Required, one of allowed types
- `metadata`: Optional, JSON object

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "childId": "uuid",
    "fileName": "uuid-timestamp.pdf",
    "originalFileName": "iep-2025.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "storagePath": "/uploads/documents/uuid-timestamp.pdf",
    "uploadDate": "2026-01-09T12:00:00Z",
    "documentType": "current_iep",
    "status": "uploaded",
    "analysisStatus": "pending",
    "metadata": {
      "notes": "2025-2026 school year IEP"
    },
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Document uploaded successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Validation errors, file too large
- `403 Forbidden`: Child not owned by user
- `413 Payload Too Large`: File exceeds size limit

---

## GET /documents

List all documents for the authenticated user.

**Access**: PARENT, ADVOCATE, ADMIN (own documents; ADMIN sees all)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (default: `uploadDate`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `childId` (optional): Filter by child ID
- `documentType` (optional): Filter by document type
- `status` (optional): Filter by status

**Response** (200 OK):
```json
{
  "data": {
    "documents": [
      {
        "id": "uuid",
        "userId": "uuid",
        "childId": "uuid",
        "fileName": "uuid-timestamp.pdf",
        "originalFileName": "iep-2025.pdf",
        "fileSize": 245678,
        "mimeType": "application/pdf",
        "uploadDate": "2026-01-09T12:00:00Z",
        "documentType": "current_iep",
        "status": "analyzed",
        "analysisStatus": "completed",
        "metadata": {
          "notes": "2025-2026 school year IEP"
        },
        "createdAt": "2026-01-09T12:00:00Z",
        "updatedAt": "2026-01-09T12:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

## GET /documents/:id

Get a specific document by ID.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "childId": "uuid",
    "fileName": "uuid-timestamp.pdf",
    "originalFileName": "iep-2025.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf",
    "storagePath": "/uploads/documents/uuid-timestamp.pdf",
    "uploadDate": "2026-01-09T12:00:00Z",
    "documentType": "current_iep",
    "status": "analyzed",
    "analysisStatus": "completed",
    "metadata": {
      "notes": "2025-2026 school year IEP",
      "extractedText": "...",
      "goals": []
    },
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:05:00Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Document not found

---

## GET /documents/:id/download

Download the document file.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```
Content-Type: <document mimeType>
Content-Disposition: attachment; filename="<originalFileName>"
<binary file content>
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Document or file not found

---

## PATCH /documents/:id

Update document metadata.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (all fields optional):
```json
{
  "documentType": "evaluation",
  "status": "analyzed",
  "metadata": {
    "notes": "Updated with 2026 goals",
    "reviewedBy": "Dr. Smith"
  }
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "documentType": "evaluation",
    "status": "analyzed",
    "metadata": {
      "notes": "Updated with 2026 goals",
      "reviewedBy": "Dr. Smith"
    },
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "Document updated successfully"
}
```

**Note**: File content cannot be updated. Delete and re-upload if file needs to change.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Document not found
- `400 Bad Request`: Validation errors

---

## DELETE /documents/:id

Soft delete a document.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Document deleted successfully"
}
```

**Note**: Soft delete (sets `deletedAt`). File remains in storage but marked as deleted.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Document not found

---

## Document Object Schema

```typescript
{
  id: string                          // UUID
  userId: string                      // Owner's user ID
  childId: string                     // Associated child ID
  fileName: string                    // Storage filename (unique)
  originalFileName: string            // User's original filename
  fileSize: number                    // File size in bytes
  mimeType: string                    // MIME type (e.g., application/pdf)
  storagePath: string                 // Path to file in storage
  uploadDate: string                  // ISO 8601 datetime
  documentType: string                // current_iep | previous_iep | progress_report | evaluation | other
  status: string                      // uploaded | processing | analyzed | error
  analysisStatus?: string             // pending | in_progress | completed | failed
  metadata: object                    // Flexible JSON metadata
  createdAt: string                   // ISO 8601 datetime
  updatedAt: string                   // ISO 8601 datetime
  deletedAt?: string                  // ISO 8601 datetime (soft delete)
}
```

---

## Implementation Notes

### Document Types
- `current_iep`: Active IEP document
- `previous_iep`: Historical IEP
- `progress_report`: Progress monitoring reports
- `evaluation`: Educational evaluations
- `other`: Miscellaneous supporting documents

### Status Workflow
```
uploaded → processing → analyzed
         ↓
       error
```

### Analysis Status
- `pending`: Awaiting AI analysis
- `in_progress`: Currently being analyzed
- `completed`: Analysis finished
- `failed`: Analysis encountered error

### Storage
- Files stored in local filesystem or cloud storage (S3, Azure Blob)
- Filenames use UUID to prevent collisions
- MIME types validated for security

### Future Enhancements
1. **OCR**: Extract text from scanned documents
2. **AI Analysis**: Automatically extract goals, services, accommodations
3. **Version Control**: Track document versions
4. **Sharing**: Share documents with advocates
5. **Bulk Upload**: Upload multiple documents at once

### Related Endpoints
- See [Children API](../children/api.md) for child management
- See [AI Conversations API](../ai-conversations/api.md) for document-based Q&A
