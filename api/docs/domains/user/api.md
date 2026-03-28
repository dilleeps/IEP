# User Profile API

## Overview
Manage user profile information and settings.

---

## GET /profile

Get current user's profile.

**Access**: Authenticated (any role)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "email": "parent@example.com",
    "displayName": "John Doe",
    "role": "PARENT",
    "status": "active",
    "provider": "internal",
    "lastLoginAt": "2026-01-09T10:30:00Z",
    "approvedAt": null,
    "approvedBy": null,
    "createdAt": "2026-01-01T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

## PATCH /profile

Update current user's profile.

**Access**: Authenticated (any role)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "displayName": "John Smith"
}
```

**Validation**:
- `displayName`: Optional, 2-100 characters

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "email": "parent@example.com",
    "displayName": "John Smith",
    "role": "PARENT",
    "status": "active",
    "provider": "internal",
    "lastLoginAt": "2026-01-09T10:30:00Z",
    "createdAt": "2026-01-01T12:00:00Z",
    "updatedAt": "2026-01-09T12:05:00Z"
  },
  "message": "Profile updated successfully"
}
```

**Read-Only Fields** (cannot be updated via this endpoint):
- `id`, `email`, `role`, `status`, `provider`
- `lastLoginAt`, `approvedAt`, `approvedBy`
- `createdAt`, `updatedAt`

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Validation errors

---

## Profile Object Schema

```typescript
{
  id: string                    // UUID
  email: string                 // User's email (unique)
  displayName: string           // Display name
  role: string                  // PARENT | ADVOCATE | ADMIN
  status: string                // active | pending | inactive | suspended
  provider: string              // internal | google | microsoft | apple
  lastLoginAt?: string          // ISO 8601 datetime
  approvedAt?: string           // ISO 8601 datetime (null if not approved yet)
  approvedBy?: string           // Admin userId who approved (null if auto-approved)
  createdAt: string             // ISO 8601 datetime
  updatedAt: string             // ISO 8601 datetime
}
```

---

## Implementation Notes

### Editable vs Read-Only
- **Editable**: `displayName` (more fields may be added later)
- **Read-Only**: All authentication, status, and audit fields

### Future Enhancements
1. **Avatar Upload**: Profile picture management
2. **Email Change**: Secure email update with verification
3. **Phone Number**: Add phone field to profile
4. **Timezone**: User timezone for localized dates
5. **Privacy Settings**: Control profile visibility

### Related Endpoints
- See [Auth API](../auth/api.md) for password changes
- See [Preferences API](../preferences/api.md) for user settings
- See [Admin Users API](../admin-users/api.md) for admin user management
