# Admin Resources Domain - Architecture

## Overview
Admin resource management provides CRUD interface for educational resources. Extends public resources domain with write operations.

## Key Design Decisions

### 1. ADMIN-Only Write Access
**Decision**: Only ADMIN role can create, update, delete resources.

**Rationale**:
- Resources visible to all users
- Quality control needed
- Prevent spam and misinformation
- Centralized curation

### 2. Created By Tracking
**Decision**: Store `createdBy` (admin UUID) on resource creation.

**Rationale**:
- Accountability for content
- Track who added resources
- Content curation metrics
- Contact creator for questions

### 3. Deactivation Preferred Over Deletion
**Decision**: Recommend `isActive: false` instead of permanent delete.

**Rationale**:
- Preserve resource history
- View counts and ratings preserved
- Can reactivate if needed
- Permanent delete for spam only

### 4. URL Validation
**Decision**: Validate URLs before saving.

**Rationale**:
- Prevent broken links
- Security (prevent malicious URLs)
- User experience
- Data quality

## Business Rules

### Create Resource Rules
- ADMIN role required
- All required fields validated
- URL validated if provided
- `createdBy` set to admin's UUID
- `viewCount` starts at 0
- `isActive` defaults to true

### Update Resource Rules
- ADMIN role required
- Can update any field except:
  - `id`
  - `viewCount` (updated by views)
  - `createdBy`
  - `createdAt`
- URL validation if URL updated

### Delete Resource Rules
- Permanent deletion (no soft delete)
- Warn admin about permanence
- Prefer deactivation (`isActive: false`)
- Consider checking references (future)

### Content Guidelines
- Accurate, up-to-date information
- Appropriate for target audience
- No commercial spam
- Verify external links
- Respect copyright

## Security Considerations

### Access Control
- ADMIN-only write operations
- All authenticated users can read
- No user-specific resources

### URL Validation
- Validate URL format
- Check for malicious patterns
- Consider link checking service
- Warn on suspicious domains

### Content Moderation
- ADMIN curates all content
- Review external links
- Monitor user feedback (future)
- Remove inappropriate content

## Dependencies

### Internal
- Resource model (shared with public resources)
- User model (createdBy reference)

### External
- URL validation library
- Link checker (optional)

## Integration Points

- **Public Resources**: ADMIN operations affect public resource reads
- **Dashboard**: Featured resources
- **AI**: Resources suggested in conversations
- **Smart Prompts**: Resource suggestions

## Testing Strategy

### Unit Tests
- Resource CRUD operations
- URL validation
- Category/type validation
- Created by tracking

### Integration Tests
- Create resource (ADMIN only)
- Update resource
- Delete resource
- Non-ADMIN blocked (403)
- URL validation enforcement

### Security Tests
- ADMIN-only enforcement
- URL validation
- Malicious URL prevention
- Content injection prevention
