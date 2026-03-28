# Admin Users API

## Overview
User management for administrators. List, create, update, delete, and manage user accounts.

---

## GET /admin/users

List all users in the system.

**Access**: ADMIN only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- Standard pagination (page, limit, sortBy, sortOrder)
- `role`: Filter by role (PARENT, ADVOCATE, ADMIN)
- `status`: Filter by status (active, pending, inactive, suspended)
- `search`: Search by email or name

**Response** (200 OK):
```json
{
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "parent@example.com",
        "role": "PARENT",
        "status": "active",
        "provider": "internal",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890",
        "lastLoginAt": "2026-01-09T10:00:00Z",
        "approvedAt": null,
        "approvedBy": null,
        "createdAt": "2026-01-01T12:00:00Z",
        "updatedAt": "2026-01-09T10:00:00Z"
      },
      {
        "id": "uuid",
        "email": "advocate@example.com",
        "role": "ADVOCATE",
        "status": "pending",
        "provider": "internal",
        "firstName": "Jane",
        "lastName": "Smith",
        "lastLoginAt": null,
        "approvedAt": null,
        "createdAt": "2026-01-08T15:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 125,
      "totalPages": 3
    }
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user

---

## GET /admin/users/stats

Get user statistics.

**Access**: ADMIN only

**Response** (200 OK):
```json
{
  "data": {
    "totalUsers": 1250,
    "activeUsers": 980,
    "pendingUsers": 15,
    "inactiveUsers": 50,
    "suspendedUsers": 5,
    "usersByRole": {
      "PARENT": 1100,
      "ADVOCATE": 140,
      "ADMIN": 10
    },
    "recentRegistrations": [
      {
        "date": "2026-01-09",
        "count": 8
      },
      {
        "date": "2026-01-08",
        "count": 12
      }
    ]
  }
}
```

---

## POST /admin/users

Create a new user (typically for ADMIN accounts).

**Access**: ADMIN only

**Request Body**:
```json
{
  "email": "newadmin@example.com",
  "password": "SecurePassword123",
  "role": "ADMIN",
  "firstName": "Alice",
  "lastName": "Admin",
  "phone": "+1234567890"
}
```

**Validation**:
- `email`: Required, unique, valid format
- `password`: Required, minimum 8 characters
- `role`: Required, one of PARENT, ADVOCATE, ADMIN
- `firstName`, `lastName`: Required strings

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "email": "newadmin@example.com",
    "role": "ADMIN",
    "status": "active",
    "provider": "internal",
    "firstName": "Alice",
    "lastName": "Admin",
    "phone": "+1234567890",
    "createdAt": "2026-01-09T12:00:00Z"
  },
  "message": "User created successfully"
}
```

**Note**: ADMIN-created users start with `status: active` regardless of role.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user
- `400 Bad Request`: Validation errors
- `409 Conflict`: Email already exists

---

## PATCH /admin/users/:id

Update a user's profile information.

**Access**: ADMIN only

**Request Body** (all fields optional):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1987654321",
  "role": "ADVOCATE"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "ADVOCATE",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1987654321",
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "User updated successfully"
}
```

**Note**: Cannot update `email`, `status`, `provider` via this endpoint (use specific endpoints).

---

## PATCH /admin/users/:id/status

Update a user's status (approve, suspend, activate, deactivate).

**Access**: ADMIN only

**Request Body**:
```json
{
  "status": "active",
  "reason": "Verified advocate credentials"
}
```

**Validation**:
- `status`: Required, one of `active`, `inactive`, `suspended`
- `reason`: Optional, text (for audit log)

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "status": "active",
    "approvedAt": "2026-01-09T13:00:00Z",
    "approvedBy": "admin-uuid",
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "User status updated successfully"
}
```

**Status Transitions**:
- `pending` → `active`: Approve user (sets `approvedAt`, `approvedBy`)
- `active` → `inactive`: Temporarily deactivate
- `active` → `suspended`: Block user (e.g., TOS violation)
- `inactive` → `active`: Reactivate
- `suspended` → `active`: Unsuspend

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user
- `404 Not Found`: User not found
- `400 Bad Request`: Invalid status value

---

## DELETE /admin/users/:id

Permanently delete a user and all associated data.

**Access**: ADMIN only

**Response** (200 OK):
```json
{
  "message": "User deleted successfully"
}
```

**Warning**: This permanently deletes:
- User account
- All child profiles
- All documents, goals, communications, behaviors, etc.
- Cannot be undone

**Recommendation**: Use status `inactive` or `suspended` instead of deletion.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not an ADMIN user
- `404 Not Found`: User not found

---

## Implementation Notes

### Pending Approvals
- ADVOCATE and ADMIN roles require approval
- PARENT role auto-approved on registration
- Pending users can see status in login response
- ADMIN approves by setting `status: active`

### Status Management
- `active`: Can login and use system
- `pending`: Awaiting approval (cannot login)
- `inactive`: Temporarily disabled (cannot login)
- `suspended`: Blocked (cannot login, potential TOS violation)

### Audit Logging
- All admin user operations should be audited
- Track who made changes and why
- Important for compliance and security

### Search
- Search by email (exact or partial match)
- Search by first/last name
- Case-insensitive search

---

## Related Endpoints
- See [Auth API](../auth/api.md) for user registration
- See [User Profile API](../user/api.md) for profile management
