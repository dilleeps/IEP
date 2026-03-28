# Admin Config API

## Overview
CRUD operations for system configuration. ADMIN-only endpoints.

---

## GET /admin/config

List all system configurations (including inactive).

**Access**: ADMIN only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- Standard pagination
- `configType`: Filter by type
- `isActive`: Filter by active status

**Response** (200 OK):
```json
{
  "data": {
    "configurations": [
      {
        "id": "uuid",
        "configKey": "disabilities",
        "configType": "dropdown",
        "configValue": ["ADHD", "Autism", "Dyslexia"],
        "description": "Common disability categories",
        "isActive": true,
        "isEditable": true,
        "metadata": {},
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2026-01-09T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user

---

## POST /admin/config

Create a new configuration.

**Access**: ADMIN only

**Request Body**:
```json
{
  "configKey": "advocacy_levels",
  "configType": "dropdown",
  "configValue": ["Beginner", "Intermediate", "Advanced"],
  "description": "Parent advocacy experience levels",
  "isActive": true,
  "isEditable": true
}
```

**Validation**:
- `configKey`: Required, unique, snake_case
- `configType`: Required, valid enum
- `configValue`: Required, array of strings
- `isActive`, `isEditable`: Booleans (optional, default true)

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "configKey": "advocacy_levels",
    "configType": "dropdown",
    "configValue": ["Beginner", "Intermediate", "Advanced"],
    "description": "Parent advocacy experience levels",
    "isActive": true,
    "isEditable": true,
    "metadata": {},
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Configuration created successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user
- `400 Bad Request`: Validation errors
- `409 Conflict`: configKey already exists

---

## PATCH /admin/config/:id

Update a configuration.

**Access**: ADMIN only

**Request Body** (all fields optional):
```json
{
  "configValue": ["Beginner", "Intermediate", "Advanced", "Expert"],
  "description": "Updated description",
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "configKey": "advocacy_levels",
    "configValue": ["Beginner", "Intermediate", "Advanced", "Expert"],
    "description": "Updated description",
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "Configuration updated successfully"
}
```

**Note**: Cannot update `configKey` (use delete and recreate instead).

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user or config not editable
- `404 Not Found`: Configuration not found
- `400 Bad Request`: Validation errors

---

## DELETE /admin/config/:id

Delete a configuration (permanent).

**Access**: ADMIN only

**Response** (200 OK):
```json
{
  "message": "Configuration deleted successfully"
}
```

**Warning**: This is a permanent delete. Consider setting `isActive: false` instead.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user or config not editable
- `404 Not Found`: Configuration not found

---

## Implementation Notes

### Protected Configurations
- Some configs marked `isEditable: false`
- These are system-critical (e.g., `app_version`)
- Prevent accidental modification
- ADMIN must explicitly override to edit

### Cache Invalidation
- After create/update/delete, invalidate config cache
- Notify connected clients to refresh config
- Consider webhook for cache clusters

### Audit Logging
- Log all config changes
- Track who made changes and when
- Important for compliance and debugging

---

## Related Endpoints
- See [Public Config API](../config/api.md) for read-only access
