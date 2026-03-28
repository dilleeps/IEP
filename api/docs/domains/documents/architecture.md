# Documents Domain - Architecture

## Overview
The documents domain handles storage, retrieval, and metadata management for IEP-related files. Documents are linked to child profiles and can be analyzed by AI to extract structured data.

## Key Design Decisions

### 1. Child-Document Relationship
**Decision**: Each document must be linked to a child profile via `childId`.

**Rationale**:
- Documents are always child-specific
- Simplifies querying by child
- Enables child-level document organization
- Supports access control via child ownership

### 2. Dual Status Fields
**Decision**: Separate `status` (upload/processing state) and `analysisStatus` (AI analysis state).

**Rationale**:
- Clear distinction between file handling and AI processing
- `status` tracks upload workflow
- `analysisStatus` tracks AI analysis workflow
- Independent state machines for flexibility

### 3. Flexible Metadata Field
**Decision**: Use JSONB `metadata` field for extensible document information.

**Rationale**:
- Different document types need different metadata
- AI analysis results stored in metadata (extracted goals, accommodations)
- User notes and tags
- Schema-less for future extensions

### 4. Original Filename Preservation
**Decision**: Store both `fileName` (system-generated) and `originalFileName` (user's filename).

**Rationale**:
- UUIDs prevent filename collisions
- Preserve user's original filename for display
- Download uses original filename
- Audit trail of uploaded filenames

### 5. Document Type Classification
**Decision**: Predefined document types (current_iep, previous_iep, etc.) with `other` fallback.

**Rationale**:
- Common IEP documents have specific types
- Enables filtering and organization
- AI can apply type-specific analysis
- `other` allows flexibility

## Data Model

### IEP Document
```typescript
{
  id: string (UUID)
  userId: string (UUID, foreign key to users)
  childId: string (UUID, foreign key to child_profiles)
  fileName: string
  originalFileName: string
  fileSize: number (bytes)
  mimeType: string
  storagePath: string
  uploadDate: Date
  documentType: 'current_iep' | 'previous_iep' | 'progress_report' | 'evaluation' | 'other'
  status: 'uploaded' | 'processing' | 'analyzed' | 'error'
  analysisStatus?: 'pending' | 'in_progress' | 'completed' | 'failed'
  metadata: JSONB
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date (soft delete)
}
```

### Database Constraints
- `userId` references `users.id` with CASCADE delete
- `childId` references `child_profiles.id` with CASCADE delete
- `fileName`, `originalFileName`, `mimeType`, `storagePath` required
- `uploadDate` defaults to NOW
- `status` defaults to `uploaded`

## Business Rules

### Upload Rules
1. File size limit: 10MB (configurable)
2. Allowed MIME types: PDF, images, Word docs (configurable)
3. User must own the child profile
4. Filename sanitization applied
5. UUID-based storage filename

### Access Rules
1. PARENT/ADVOCATE: Can only access own documents
2. ADMIN: Can access all documents
3. Ownership check: `document.userId === user.id` (unless ADMIN)

### Update Rules
1. Only owner or ADMIN can update
2. Cannot update file content (delete and re-upload)
3. Can update: `documentType`, `status`, `metadata`
4. `analysisStatus` typically updated by AI service

### Deletion Rules
1. Soft delete (sets `deletedAt`)
2. File remains in storage (for recovery)
3. Consider archival policy (delete files after X days)

### Analysis Workflow
```
Upload → status: uploaded
      → analysisStatus: pending
      → AI service picks up pending documents
      → analysisStatus: in_progress
      → Extract goals, services, accommodations
      → Store in metadata
      → analysisStatus: completed
      → status: analyzed
```

## Security Considerations

### File Security
- Validate MIME types (prevent executable uploads)
- Scan for malware (future)
- Sanitize filenames (prevent path traversal)
- Encrypted storage recommended

### Access Control
- Ownership validation on all operations
- Download requires authentication
- Direct file URLs not exposed (pre-signed URLs if using S3)

### Privacy
- Documents contain highly sensitive PII
- FERPA compliance required
- Audit all document access
- Retention policies for deleted documents

### Future Security Enhancements
1. **Malware Scanning**: Scan uploads with antivirus
2. **Encryption**: Encrypt files at rest
3. **Pre-signed URLs**: Temporary download links
4. **Access Logs**: Track all document access
5. **Watermarking**: Add watermarks to downloads

## Dependencies

### Internal
- `User` model (userId reference)
- `ChildProfile` model (childId reference)
- Storage service (local or cloud)
- AI service (for document analysis)

### External
- Multer (file upload middleware)
- Sharp or ImageMagick (image processing)
- PDF parsing libraries (pdf-parse, pdfjs)
- Cloud storage SDKs (AWS S3, Azure Blob, GCP Storage)

## Integration Points

- **Children**: Documents linked to child profiles
- **AI Conversations**: Documents used for context in Q&A
- **Goals**: AI extracts goals from IEP documents
- **Dashboard**: Document count and recent uploads
- **Storage**: File system or cloud storage integration

## Testing Strategy

### Unit Tests
- Service layer CRUD operations
- Ownership validation
- File upload handling
- MIME type validation
- Soft delete behavior

### Integration Tests
- Upload document flow
- List own documents (role-based)
- ADMIN access to all documents
- Download document
- Update metadata
- Soft delete
- Ownership enforcement (403)

### Security Tests
- Prevent access to other users' documents
- File type validation
- File size limit enforcement
- Malicious filename handling
- MIME type spoofing prevention
