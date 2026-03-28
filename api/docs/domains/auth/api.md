# Authentication API

## Overview
Handles user registration, login, token management, and password changes.

---

## POST /auth/register

Register a new user account.

**Access**: Public

**Request Body**:
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123",
  "role": "PARENT",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Validation**:
- `email`: Valid email format, unique
- `password`: Minimum 8 characters
- `role`: One of `PARENT`, `ADVOCATE`, `ADMIN`
- `firstName`, `lastName`: Required strings
- `phone`: Optional string

**Response** (201 Created):
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "parent@example.com",
      "role": "PARENT",
      "status": "active",
      "provider": "internal",
      "isApproved": true,
      "isActive": true,
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "createdAt": "2026-01-09T12:00:00Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Registration successful"
}
```

**Status-Based Behavior**:
- **PARENT**: `status: 'active'` - immediate access, returns tokens
- **ADVOCATE/ADMIN**: `status: 'pending'` - requires approval, returns tokens but login blocked until approved

**Errors**:
- `409 Conflict`: Email already exists
- `400 Bad Request`: Invalid input (validation errors)

---

## POST /auth/login

Authenticate user and receive access tokens.

**Access**: Public

**Request Body**:
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "parent@example.com",
      "role": "PARENT",
      "status": "active",
      "provider": "internal",
      "isApproved": true,
      "isActive": true,
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Login successful"
}
```

**Errors**:
- `401 Unauthorized`: Invalid email or password
- `403 Forbidden - Status: pending`: "Your account is pending approval"
- `403 Forbidden - Status: inactive`: "Your account has been deactivated"
- `403 Forbidden - Status: suspended`: "Your account has been suspended"

---

## POST /auth/refresh

Refresh access token using refresh token.

**Access**: Authenticated (refresh token required)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200 OK):
```json
{
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  },
  "message": "Token refreshed"
}
```

**Behavior**:
- Validates refresh token signature
- Checks user `status === 'active'`
- Issues new access + refresh tokens

**Errors**:
- `401 Unauthorized`: Invalid or expired refresh token
- `403 Forbidden`: User status not active (suspended/inactive)
- `404 Not Found`: User no longer exists

---

## POST /auth/logout

Logout user (client-side token invalidation).

**Access**: Authenticated

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Logout successful"
}
```

**Note**: Current implementation relies on client-side token removal. Consider implementing token blacklist for production.

---

## POST /auth/change-password

Change user password.

**Access**: Authenticated, `provider: 'internal'` only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "oldPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Validation**:
- `oldPassword`: Must match current password
- `newPassword`: Minimum 8 characters, different from old password

**Response** (200 OK):
```json
{
  "message": "Password changed successfully"
}
```

**Errors**:
- `401 Unauthorized`: Old password incorrect
- `400 Bad Request`: New password same as old, or validation errors
- `403 Forbidden`: User provider is not `internal` (OAuth users cannot change password here)

---

## JWT Token Payload

**Access Token Payload**:
```json
{
  "userId": "uuid",
  "email": "parent@example.com",
  "role": "PARENT",
  "status": "active",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Expiration**:
- Access Token: 7 days (configurable via `JWT_EXPIRES_IN`)
- Refresh Token: 30 days (configurable via `JWT_REFRESH_EXPIRES_IN`)

---

## Common Response Fields

### User Object
All auth responses include a user object with:
- **Core Fields**: `id`, `email`, `role`, `status`, `provider`, `firstName`, `lastName`, `phone`
- **Derived Fields**: `isApproved` (status !== 'pending'), `isActive` (status === 'active')
- **Timestamps**: `createdAt`, `updatedAt`

### Token Fields
- `accessToken`: Short-lived JWT for API requests
- `refreshToken`: Long-lived JWT for token refresh

---

## Status Field Values

| Status | Description | Can Login? |
|--------|-------------|------------|
| `active` | Fully active account | ✅ Yes |
| `pending` | Awaiting admin approval | ❌ No |
| `inactive` | Temporarily disabled | ❌ No |
| `suspended` | Blocked from access | ❌ No |

---

## Provider Field Values

| Provider | Description | Password Change? |
|----------|-------------|------------------|
| `internal` | Email/password auth | ✅ Yes |
| `google` | Google OAuth (future) | ❌ No |
| `microsoft` | Microsoft OAuth (future) | ❌ No |
| `apple` | Apple Sign-In (future) | ❌ No |

---

## Implementation Notes

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- No password returned in any response
- Password validation enforced on registration and change

### Token Security
- Tokens signed with `JWT_SECRET` environment variable
- Status validated on every protected request
- Refresh token rotation on refresh

### Future Enhancements
- Email verification on registration
- Password reset via email
- Two-factor authentication (2FA)
- OAuth provider integration (Google, Microsoft, Apple)
- Token blacklist for secure logout
