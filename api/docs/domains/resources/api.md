# Resources API

## Overview
Browse and search public educational resources about IEPs, special education, and advocacy.

---

## GET /resources

List all public resources.

**Access**: PARENT, ADVOCATE, ADMIN (all authenticated users can read)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- Standard pagination (page, limit, sortBy, sortOrder)
- `category`: Filter by category (legal, educational, medical, advocacy, support, financial, technology, other)
- `resourceType`: Filter by type (article, video, pdf, link, contact, organization, tool, other)
- `state`: Filter by US state
- `tags`: Filter by tags (comma-separated)
- `search`: Search in title and description

**Response** (200 OK):
```json
{
  "data": {
    "resources": [
      {
        "id": "uuid",
        "title": "Understanding Your Rights Under IDEA",
        "description": "Comprehensive guide to IDEA 2004 and parent rights",
        "category": "legal",
        "resourceType": "article",
        "url": "https://example.com/idea-rights",
        "tags": ["IDEA", "parent rights", "legal"],
        "targetAudience": ["parents", "advocates"],
        "state": "all",
        "isActive": true,
        "viewCount": 1234,
        "rating": 4.5,
        "createdAt": "2025-06-01T00:00:00Z",
        "updatedAt": "2025-12-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

## GET /resources/:id

Get a specific resource by ID.

**Access**: PARENT, ADVOCATE, ADMIN (all authenticated users)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "title": "Understanding Your Rights Under IDEA",
    "description": "Comprehensive guide to IDEA 2004 and parent rights",
    "category": "legal",
    "resourceType": "article",
    "url": "https://example.com/idea-rights",
    "content": "[Full article content if stored]",
    "tags": ["IDEA", "parent rights", "legal"],
    "targetAudience": ["parents", "advocates"],
    "state": "all",
    "isActive": true,
    "viewCount": 1235,
    "rating": 4.5,
    "createdBy": "admin-uuid",
    "createdAt": "2025-06-01T00:00:00Z",
    "updatedAt": "2025-12-15T00:00:00Z"
  }
}
```

**Note**: View count incremented on each view.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Resource not found or inactive

---

## GET /resources/search

Search resources with full-text search.

**Access**: PARENT, ADVOCATE, ADMIN

**Query Parameters**:
- `q`: Search query (required)
- `category`: Optional filter
- `state`: Optional filter
- Standard pagination

**Response**: Same as GET /resources

---

## Resource Object Schema

```typescript
{
  id: string
  title: string
  description: string
  category: 'legal' | 'educational' | 'medical' | 'advocacy' | 'support' | 'financial' | 'technology' | 'other'
  resourceType: 'article' | 'video' | 'pdf' | 'link' | 'contact' | 'organization' | 'tool' | 'other'
  url?: string
  content?: string
  tags: string[]
  targetAudience: string[]
  state?: string
  isActive: boolean
  viewCount: number
  rating?: number
  createdBy?: string
  createdAt: string
  updatedAt: string
}
```

---

## Implementation Notes

### Public Read Access
- All authenticated users can read resources
- Only ADMIN can create/update/delete (see [Admin Resources API](../admin-resources/api.md))
- No user-specific filtering (public data)

### Categories
- `legal`: Legal guides, parent rights, IDEA information
- `educational`: Teaching strategies, curriculum
- `medical`: Medical/therapeutic resources
- `advocacy`: Advocacy guides, organization contacts
- `support`: Parent support groups, counseling
- `financial`: Funding, grants, benefits
- `technology`: Assistive technology, apps
- `other`: Miscellaneous resources

### Resource Types
- `article`: Text articles
- `video`: Video tutorials, webinars
- `pdf`: Downloadable PDFs
- `link`: External website links
- `contact`: Contact information
- `organization`: Organizations and agencies
- `tool`: Software tools, apps
- `other`: Other resource types

### State Filtering
- State-specific resources (e.g., "California")
- Use "all" for national resources
- Helps users find state-specific legal guidance

### Future Enhancements
1. **User Ratings**: Allow users to rate resources
2. **Favorites**: Bookmark favorite resources
3. **Recommendations**: AI-powered resource recommendations
4. **Comments**: User comments and discussions
5. **Contributions**: Allow users to suggest resources

---

## Related Endpoints
- See [Admin Resources API](../admin-resources/api.md) for CRUD operations
- See [Dashboard API](../dashboard/api.md) for resource suggestions
