# Resources Domain - Architecture

## Overview
Resources domain provides public educational materials about IEPs, special education laws, and advocacy. Read-only for all authenticated users; managed by ADMIN.

## Key Design Decisions

### 1. Public Read, Admin Write
**Decision**: All authenticated users can read; only ADMIN can write.

**Rationale**:
- Resources benefit all users
- No user-specific data (no userId field)
- Centralized curation by admins
- Prevents spam and misinformation

### 2. No Soft Deletes
**Decision**: No `deletedAt` field; use `isActive` flag instead.

**Rationale**:
- Resources are reference data, not user data
- Deactivate instead of delete
- Can reactivate resources
- Simpler model for public data

### 3. View Count Tracking
**Decision**: Increment `viewCount` on each resource view.

**Rationale**:
- Identify popular resources
- Analytics for content curation
- Recommendations based on popularity
- No user tracking needed (privacy-friendly)

### 4. State-Specific Resources
**Decision**: Optional `state` field for location-specific resources.

**Rationale**:
- Special education laws vary by state
- Help users find relevant local resources
- "all" for national resources
- Important for legal guidance

### 5. Target Audience Array
**Decision**: `targetAudience` array (parents, advocates, teachers, etc.).

**Rationale**:
- Different audiences need different resources
- Filter by audience type
- Resources can target multiple audiences
- Improve discovery

## Data Model

### Resource
```typescript
{
  id: string (UUID)
  title: string
  description: string
  category: enum
  resourceType: enum
  url?: string
  content?: string (full text if stored)
  tags: string[]
  targetAudience: string[]
  state?: string
  isActive: boolean
  viewCount: number
  rating?: number (future)
  createdBy?: string (admin UUID)
  createdAt: Date
  updatedAt: Date
}
```

### Database Constraints
- `title` required, indexed
- `category`, `resourceType` required
- `isActive` defaults to true
- `viewCount` defaults to 0
- No foreign key constraints (public data)

## Business Rules

### Read Rules
1. All authenticated users can read active resources
2. Inactive resources hidden from regular users
3. ADMIN sees all resources (active and inactive)
4. View count increments on GET /resources/:id

### Write Rules (Admin Only)
1. Only ADMIN can create, update, delete resources
2. Deactivate instead of delete (set `isActive: false`)
3. Update `updatedAt` on modifications

### Search Rules
- Full-text search on title, description
- Filter by category, type, state, tags
- Sort by viewCount, rating, createdAt

## Security Considerations

### Data Access
- No user-specific data (public resources)
- Authentication required (prevents anonymous scraping)
- Rate limiting recommended

### Content Moderation
- ADMIN curates all content
- Review external links for safety
- Validate URLs before saving

### Future Enhancements
1. **User Ratings**: Authenticated users rate resources
2. **Comments**: Moderated user comments
3. **Contributions**: Users suggest resources (admin approval)
4. **Personalization**: AI recommends based on user context

## Dependencies

### Internal
- User model (createdBy reference)
- Admin endpoints for CRUD

### External
- Full-text search (PostgreSQL or Elasticsearch)
- Link validation
- Content scraping (for url preview)

## Integration Points

- **Dashboard**: Featured resources widget
- **AI Conversations**: Suggest relevant resources in chat
- **Smart Prompts**: Link resources in contextual prompts
- **Advocacy**: Recommend resources for scenarios

## Testing Strategy

### Unit Tests
- Resource filtering and search
- View count increment
- Active/inactive filtering

### Integration Tests
- List resources (authenticated)
- Search resources
- View resource (increment count)
- Unauthorized access (401)
- Admin CRUD operations

### Content Tests
- URL validation
- Tag consistency
- State code validation
