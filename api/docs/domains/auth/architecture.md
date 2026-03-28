# Authentication Domain - Architecture

## Overview
The authentication system manages user registration, login, token management, and account status validation using JWT-based authentication.

## Key Design Decisions

### 1. Status-Based Access Control
**Decision**: Replace boolean flags (`isApproved`, `isActive`) with a single `status` enum field.

**Rationale**:
- Cleaner state management (single source of truth)
- Supports more states beyond active/inactive
- Easier to extend for future states (e.g., `locked`, `archived`)

**Status Values**:
- `active` - Can login and access system
- `pending` - Awaiting approval (ADVOCATE/ADMIN during registration)
- `inactive` - Temporarily disabled by admin
- `suspended` - Blocked from system access

### 2. Role-Based Registration Flow
**Decision**: Different registration workflows based on role.

**Flow**:
```
PARENT Registration:
  Register → status: 'active' → Immediate Access

ADVOCATE/ADMIN Registration:
  Register → status: 'pending' → Admin Approval → status: 'active' → Access
```

**Rationale**:
- Parents need immediate access to manage their children's IEPs
- Advocates and admins require vetting to prevent misuse
- Reduces spam and unauthorized access

### 3. OAuth Provider Support
**Decision**: Add `provider` field to track authentication source.

**Values**:
- `internal` - Email/password (current implementation)
- `google` - Google OAuth (future)
- `microsoft` - Microsoft OAuth (future)
- `apple` - Apple Sign-In (future)

**Rationale**:
- Prepare for multi-provider authentication
- Track authentication method for security auditing
- Enable provider-specific logic (password changes only for internal)

### 4. JWT Token Strategy
**Decision**: Use JWT with access + refresh token pattern.

**Implementation**:
- **Access Token**: Short-lived (7 days), contains user data
- **Refresh Token**: Long-lived (30 days), used to issue new access tokens
- **Payload**: `{ userId, email, role, status }`

**Rationale**:
- Stateless authentication (no session storage)
- Refresh tokens allow extending sessions without re-login
- Status in payload enables quick validation

**Security**:
- Tokens include status - validated on every request
- Token refresh requires `status === 'active'`
- Logout invalidates tokens client-side (consider token blacklist for production)

### 5. Frontend Convenience Fields
**Decision**: Include derived `isApproved` and `isActive` fields in responses.

**Mapping**:
```typescript
isApproved = status !== 'pending'
isActive = status === 'active'
```

**Rationale**:
- Backward compatibility with existing frontend code
- Simpler boolean checks for UI logic
- Avoids frontend status string comparisons

## Data Model

### User Model (Simplified)
```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hashed with bcrypt)
  role: 'PARENT' | 'ADVOCATE' | 'ADMIN'
  status: 'active' | 'pending' | 'inactive' | 'suspended'
  provider: 'internal' | 'google' | 'microsoft' | 'apple'
  firstName: string
  lastName: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}
```

## Business Rules

### Registration Rules
1. Email must be unique
2. Password minimum 8 characters
3. PARENT → auto-approved (`status: 'active'`)
4. ADVOCATE/ADMIN → pending approval (`status: 'pending'`)
5. Provider defaults to `internal` for email/password registration

### Login Rules
1. Only `status === 'active'` users can login
2. Password verification with bcrypt
3. Return JWT access + refresh tokens
4. Return user data with derived `isApproved`/`isActive` fields

### Token Refresh Rules
1. Validate refresh token signature
2. Check user still exists
3. Verify `status === 'active'` (logout if suspended)
4. Issue new access token

### Password Change Rules
1. Authenticated users only
2. Verify old password
3. New password must be different
4. Only for `provider: 'internal'` users

## Security Considerations

### Password Security
- Bcrypt hashing with salt rounds: 10
- No password storage in plain text
- Password reset requires email verification (future)

### Token Security
- JWT signed with `JWT_SECRET` from environment
- Token expiration enforced
- Status validation on every protected route
- Consider implementing token blacklist for logout (production)

### Rate Limiting
- Consider adding rate limiting for:
  - Login attempts (prevent brute force)
  - Registration (prevent spam)
  - Token refresh (prevent abuse)

### Future Enhancements
1. **Email Verification**: Verify email before activation
2. **Password Reset**: Secure password reset flow
3. **2FA**: Two-factor authentication option
4. **OAuth Integration**: Google, Microsoft, Apple providers
5. **Token Blacklist**: Revoke tokens on logout
6. **Audit Logging**: Track authentication events

## Error Handling

### Registration Errors
- `409 Conflict`: Email already exists
- `400 Bad Request`: Invalid input (weak password, invalid email)

### Login Errors
- `401 Unauthorized`: Invalid email or password
- `403 Forbidden`: Account pending approval
- `403 Forbidden`: Account inactive or suspended

### Token Errors
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Account suspended (during refresh)

## Dependencies

### Internal
- `User` model (modules/user or modules/auth)
- `BaseService` (shared/service)
- JWT utilities

### External
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT generation/verification
- `zod` - Input validation

## Testing Strategy

### Unit Tests
- Service layer logic (registration, login, token generation)
- Password hashing/verification
- Status-based access validation

### Integration Tests
- Full registration flow (PARENT vs ADVOCATE)
- Login with various status values
- Token refresh with status changes
- Password change flow

### Security Tests
- Weak password rejection
- Duplicate email prevention
- Invalid token handling
- Suspended user access denial
