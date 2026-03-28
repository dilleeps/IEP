# Admin Resources API

## Overview
CRUD operations for public educational resources. ADMIN-only endpoints.

---

## POST /admin/resources

Create a new resource.

**Access**: ADMIN only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "title": "Understanding IDEA 2004",
  "description": "Comprehensive guide to the Individuals with Disabilities Education Act",
  "category": "legal",
  "resourceType": "article",
  "url": "https://example.com/idea-guide",
  "content": "[Optional full text content]",
  "tags": ["IDEA", "legal", "parent rights"],
  "targetAudience": ["parents", "advocates"],
  "state": "all",
  "isActive": true
}
```

**Validation**:
- `title`: Required, 1-500 characters
- `description`: Required, text
- `category`: Required, valid category enum
- `resourceType`: Required, valid type enum
- `url`: Optional, valid URL
- `tags`: Optional, array of strings
- `targetAudience`: Optional, array of strings
- `state`: Optional, US state code or "all"

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "title": "Understanding IDEA 2004",
    "description": "Comprehensive guide to the Individuals with Disabilities Education Act",
    "category": "legal",
    "resourceType": "article",
    "url": "https://example.com/idea-guide",
    "tags": ["IDEA", "legal", "parent rights"],
    "targetAudience": ["parents", "advocates"],
    "state": "all",
    "isActive": true,
    "viewCount": 0,
    "createdBy": "admin-uuid",
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Resource created successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user
- `400 Bad Request`: Validation errors

---

## PATCH /admin/resources/:id

Update a resource.

**Access**: ADMIN only

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["IDEA", "legal", "parent rights", "2024"],
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    "description": "Updated description",
    "tags": ["IDEA", "legal", "parent rights", "2024"],
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "Resource updated successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user
- `404 Not Found`: Resource not found
- `400 Bad Request`: Validation errors

---

## DELETE /admin/resources/:id

Delete a resource (permanent).

**Access**: ADMIN only

**Response** (200 OK):
```json
{
  "message": "Resource deleted successfully"
}
```

**Warning**: Permanent deletion. Consider setting `isActive: false` instead.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user
- `404 Not Found`: Resource not found

---

## Implementation Notes

### Resource Categories
- `legal`: Legal guides, IDEA, parent rights
- `educational`: Teaching strategies, curriculum
- `medical`: Medical/therapeutic resources
- `advocacy`: Advocacy guides, contacts
- `support`: Support groups, counseling
- `financial`: Funding, grants, benefits
- `technology`: Assistive tech, apps
- `other`: Miscellaneous

### Resource Types
- `article`: Text articles
- `video`: Video content
- `pdf`: Downloadable PDFs
- `link`: External links
- `contact`: Contact information
- `organization`: Organizations
- `tool`: Software tools
- `other`: Other types

### Content Management
- `url`: External resource link
- `content`: Full text (optional, for hosted content)
- Can have both or just URL
- Validate URLs before saving

### Deactivation vs. Deletion
- Prefer `isActive: false` (deactivation)
- Preserves resource history
- Can reactivate later
- Permanent delete for spam only

### Created By Tracking
- `createdBy` stores admin UUID
- Track who added each resource
- Useful for content curation
- Accountability

---

## Related Endpoints
- See [Public Resources API](../resources/api.md) for read-only access
