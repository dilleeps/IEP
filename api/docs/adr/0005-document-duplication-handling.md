# ADR 0005: Document Duplication Handling

**Status**: Accepted  
**Date**: 2026-02-01  
**Context**: IEP Application - Preventing duplicate document uploads

---

## Context

Users may attempt to upload the same IEP document multiple times, either accidentally (re-upload) or intentionally (retrying failed uploads). This creates several issues:
- **Storage waste**: Same document stored multiple times
- **Processing cost**: AI extraction runs multiple times on identical content
- **Data confusion**: Multiple records for the same IEP document
- **Parent experience**: Confusing to see duplicate documents in their list

We need a strategy to detect and handle duplicate documents intelligently.

---

## Decision

We will implement **multi-level duplicate detection** with different handling strategies:

### Level 1: File Hash-Based Deduplication (Primary - Exact Match)

**Method**: Calculate SHA-256 hash of file content during upload

**Storage**:
- Add `fileHash` column to `iep_documents` table (indexed)
- Store hash after file upload, before AI processing

**Detection Logic**:
```typescript
// On upload:
1. Calculate SHA-256 hash of uploaded file
2. Check if hash exists for this child: 
   SELECT id, file_name, upload_date, analysis_status 
   FROM iep_documents 
   WHERE child_id = ? AND file_hash = ?
3. If found:
   - Return 409 Conflict with existing document details
   - Option: Allow force re-upload with ?force=true query param
4. If not found:
   - Proceed with normal upload flow
   - Store hash in database
```

**Advantages**:
- ✅ 100% accurate for exact file matches
- ✅ Fast lookup (indexed hash column)
- ✅ Works regardless of filename changes
- ✅ Cryptographically reliable

**Disadvantages**:
- ❌ Doesn't detect near-duplicates (scanned vs digital copy)
- ❌ Different file formats of same IEP not detected

---

### Level 2: Metadata-Based Similarity (Soft Match)

**Method**: Compare extracted IEP metadata after AI processing

**Detection Criteria** (after extraction):
```typescript
// Considered "likely duplicate" if:
- Same childId
- Same iepStartDate and iepEndDate (both present and matching)
- Same iepMeetingDate
- Same number of goals (within ±1)
- Same primaryDisability

// Confidence scoring:
- All 5 match: 95% confidence (very likely duplicate)
- 4 match: 75% confidence (possibly duplicate)  
- 3 match: 50% confidence (maybe same IEP cycle)
```

**User Notification**:
- Flag documents as "possible duplicate" in UI
- Show side-by-side comparison option
- Allow user to mark as "different document" or "archive duplicate"

**Advantages**:
- ✅ Catches near-duplicates (scanned vs typed)
- ✅ Catches different file formats of same IEP
- ✅ Non-blocking (post-upload detection)

**Disadvantages**:
- ❌ Only works after AI extraction completes
- ❌ Requires good extraction accuracy
- ❌ Not 100% reliable

---

### Level 3: Filename + Size Heuristic (Quick Check)

**Method**: Fast pre-check before upload

**Detection Logic**:
```typescript
// Quick check (optional, before hash calculation):
- Same childId
- Same fileName
- Same fileSize (bytes)
- Uploaded within last 7 days

// If all match:
  - Show warning: "You uploaded this file recently"
  - Confirm: "Upload anyway?" or "Use existing"
```

**Advantages**:
- ✅ Very fast (no file read needed)
- ✅ Catches accidental re-uploads immediately
- ✅ Good UX for immediate feedback

**Disadvantages**:
- ❌ False positives (renamed files)
- ❌ False negatives (different scans of same IEP)
- ❌ Unreliable as primary method

---

## Recommended Implementation Strategy

### Phase 1: File Hash (Immediate - High Priority)

**Database Migration**:
```sql
ALTER TABLE iep_documents 
  ADD COLUMN file_hash VARCHAR(64) NULL,
  ADD INDEX idx_child_file_hash (child_id, file_hash);
```

**Upload Flow**:
```typescript
1. Receive file upload
2. Calculate SHA-256 hash
3. Check for existing hash:
   - If exists: Return 409 with existing document details
   - Option to override with ?force=true
4. Upload to GCS
5. Store document record with hash
6. Trigger async AI extraction
```

**API Response for Duplicate**:
```json
{
  "error": "DUPLICATE_DOCUMENT",
  "message": "This document was already uploaded",
  "existingDocument": {
    "documentId": "abc-123",
    "fileName": "iep-2025.pdf",
    "uploadDate": "2026-01-15T10:30:00Z",
    "analysisStatus": "analyzed"
  },
  "options": {
    "useExisting": "/api/v1/iep/documents/abc-123",
    "forceReupload": "/api/v1/iep/upload?force=true"
  }
}
```

### Phase 2: Metadata Similarity (Future Enhancement)

**Implementation**:
- Run after AI extraction completes
- Store similarity scores in `document_metadata.possibleDuplicates`
- Surface in UI as warnings/suggestions
- Allow user to link/merge/archive duplicates

**UI Features**:
- "Possible duplicate" badge on document list
- Side-by-side comparison view
- "Mark as different" action
- "Archive duplicate" action

### Phase 3: Filename Quick Check (Optional UX Enhancement)

**Implementation**:
- Client-side check before upload starts
- Show confirmation dialog if recent similar upload found
- Non-blocking (informational only)

---

## Configuration Options

### Environment Variables:
```env
# Enable/disable duplicate detection levels
DUPLICATE_CHECK_FILE_HASH=true          # Recommended: always true
DUPLICATE_CHECK_METADATA=true           # Post-extraction similarity
DUPLICATE_CHECK_FILENAME=false          # Optional quick check

# Duplicate detection thresholds
DUPLICATE_HASH_SCOPE=child              # child | user | global
DUPLICATE_METADATA_CONFIDENCE=0.75      # 0.0-1.0 threshold
DUPLICATE_FILENAME_WINDOW_DAYS=7        # Time window for quick check

# Behavior on duplicate
DUPLICATE_ACTION=reject                 # reject | warn | allow
ALLOW_FORCE_REUPLOAD=true              # Allow ?force=true override
```

---

## User Experience Flows

### Scenario 1: Exact Duplicate (Hash Match)
```
User uploads "iep-2025.pdf" → Hash calculated → Match found
↓
Response: 409 Conflict
{
  "error": "Document already uploaded on Jan 15, 2026",
  "existingDocument": { ... },
  "suggestion": "View existing document or upload with ?force=true"
}
```

### Scenario 2: Possible Duplicate (Metadata Match)
```
User uploads new file → Upload succeeds → AI extraction runs → Similarity detected
↓
Document saved with flag: possibleDuplicate: true
↓
UI shows: ⚠️ "This may be a duplicate of document uploaded Jan 15"
[View Comparison] [Mark as Different] [Archive This]
```

### Scenario 3: Force Re-upload
```
User uploads with ?force=true → Skip hash check → Upload proceeds
↓
Note added to metadata: "Force re-uploaded despite duplicate hash"
Original document remains (not replaced)
```

---

## Database Schema Changes

```typescript
// iep_documents table
interface IepDocument {
  // ... existing fields
  
  fileHash: string | null;              // SHA-256 hash of file content
  possibleDuplicateOf: string | null;   // ID of potential duplicate
  duplicateConfidence: number | null;    // 0.0-1.0 similarity score
  isDuplicateMarked: boolean;            // User marked as duplicate
  
  metadata: {
    duplicateCheckResults?: {
      hashChecked: boolean;
      hashMatch: boolean;
      metadataChecked: boolean;
      metadataSimilarity: number;
      possibleDuplicates: Array<{
        documentId: string;
        confidence: number;
        reasons: string[];
      }>;
    };
    forceReupload?: boolean;
  };
}
```

---

## Performance Considerations

### Hash Calculation:
- **Impact**: +50-200ms per upload (file read + SHA-256)
- **Acceptable**: Minimal compared to GCS upload time
- **Optimization**: Stream-based hashing for large files

### Database Queries:
- **Index**: `(child_id, file_hash)` composite index
- **Query time**: <10ms for hash lookup
- **Storage**: 64 bytes per document for hash

### AI Extraction:
- **Prevented**: Don't re-extract exact duplicates
- **Savings**: ~30-60 seconds + API costs per duplicate prevented
- **ROI**: High value for duplicate prevention

---

## Security Considerations

### Hash Collisions:
- **SHA-256**: Cryptographically secure, collision resistance 2^256
- **Risk**: Negligible for document deduplication use case

### Privacy:
- **Hash Storage**: Hashes don't reveal document content
- **Scope**: Hash checks scoped to child (not cross-child)
- **Deletion**: Hash deleted when document is deleted

### Force Override:
- **Permission**: Only document owner can force re-upload
- **Audit**: Log all force re-uploads for review
- **Limit**: Rate limit force re-uploads to prevent abuse

---

## Testing Strategy

### Unit Tests:
```typescript
describe('Duplicate Detection', () => {
  test('detects exact duplicate by hash');
  test('allows force re-upload with query param');
  test('detects metadata similarity after extraction');
  test('handles hash calculation errors gracefully');
  test('scopes hash check to correct child');
});
```

### Integration Tests:
```typescript
describe('Upload Flow', () => {
  test('rejects duplicate upload with 409');
  test('returns existing document details on duplicate');
  test('allows force re-upload with ?force=true');
  test('flags possible duplicates after extraction');
});
```

### Performance Tests:
- Hash calculation time for various file sizes
- Database query performance with 1000+ documents
- Concurrent upload handling

---

## Rollback Plan

If duplicate detection causes issues:

1. **Emergency Disable**: Set `DUPLICATE_CHECK_FILE_HASH=false`
2. **Gradual Rollback**: Migrate to warning-only mode
3. **Data Cleanup**: Remove `file_hash` column if needed
4. **User Communication**: Notify users of behavior change

---

## Future Enhancements

### Content-Based Deduplication:
- Use vector embeddings for semantic similarity
- Detect "updated IEP" vs "duplicate IEP"
- Smart versioning (IEP v1, v2, v3)

### Bulk Operations:
- Bulk duplicate scan for existing documents
- Batch archive/merge duplicates
- Duplicate cleanup wizard

### Analytics:
- Dashboard: Duplicate detection rate
- Savings: Storage & processing costs avoided
- User behavior: Force re-upload frequency

---

## References

- [SHA-256 Hashing](https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Multer File Upload](https://github.com/expressjs/multer)

---

## Decision Outcome

**Accepted**: Implement **Phase 1 (File Hash)** immediately with the following specifics:

1. ✅ Add `file_hash` column (VARCHAR 64, indexed)
2. ✅ Calculate SHA-256 during upload
3. ✅ Return 409 Conflict on duplicate
4. ✅ Support `?force=true` override
5. ✅ Scope checks to child (not cross-child)
6. ⏳ Phase 2 (Metadata similarity) - Future enhancement
7. ⏳ Phase 3 (Filename check) - Optional UX improvement

**Migration Priority**: High - Implement before production launch

**Owner**: Backend Team  
**Reviewer**: Product & Security Teams  
**Target**: Sprint 3 (February 2026)
