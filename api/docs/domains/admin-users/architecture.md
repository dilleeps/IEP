# Admin Users Domain - Architecture

## Overview
Admin user management provides full control over user accounts, including approval, status management, and user data access.

## Key Design Decisions

### 1. ADMIN-Only Access
**Decision**: Only ADMIN role can access user management endpoints.

**Rationale**:
- Sensitive user data (PII)
- System-wide impact
- Requires careful handling
- Security-critical operations

### 2. Status-Based Approval
**Decision**: Use `status` field for user lifecycle management.

**Rationale**:
- Single field for user state
- pending → active workflow for approvals
- Support temporary deactivation (inactive)
- Support blocking (suspended)
- Clear state transitions

### 3. Approval Tracking
**Decision**: Track `approvedAt` and `approvedBy` when approving users.

**Rationale**:
- Audit trail for approvals
- Know which admin approved which user
- Important for compliance
- Helps identify approval patterns

### 4. Permanent Delete Warning
**Decision**: DELETE endpoint warns about permanent data loss.

**Rationale**:
- Deletion cascades to all user data
- Cannot be undone
- Prefer status changes (inactive/suspended)
- Only for spam/test accounts

## Data Model

Uses shared User model with admin-specific operations:
```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hashed)
  role: 'PARENT' | 'ADVOCATE' | 'ADMIN'
  status: 'active' | 'pending' | 'inactive' | 'suspended'
  provider: 'internal' | 'google' | 'microsoft' | 'apple'
  firstName: string
  lastName: string
  phone?: string
  lastLoginAt?: Date
  approvedAt?: Date
  approvedBy?: string (admin UUID)
  createdAt: Date
  updatedAt: Date
}
```

## Business Rules

### List Users Rules
- ADMIN sees all users across all statuses
- Pagination for large user bases
- Filter by role, status
- Search by email or name

### Create User Rules
- ADMIN can create users with any role
- Created users start with `status: active` (no approval needed)
- Typically used for ADMIN account creation
- Password must meet requirements

### Update User Rules
- Can update profile fields (name, phone, role)
- Cannot update email (security concern)
- Cannot update status (use separate endpoint)
- Cannot update password (user must change via auth)

### Status Update Rules
- Approve: `pending` → `active` (sets approvedAt, approvedBy)
- Deactivate: `active` → `inactive`
- Suspend: `active` → `suspended`
- Reactivate: `inactive` → `active`
- Unsuspend: `suspended` → `active`
- Track reason for status changes (audit log)

### Delete User Rules
- Permanent deletion (no soft delete)
- Cascades to all user data:
  - Child profiles
  - Documents
  - Goals
  - Communications
  - Behaviors
  - Compliance logs
  - Letters
  - AI conversations
  - etc.
- Use with extreme caution
- Audit log deletion

## Security Considerations

### Access Control
- ADMIN role strictly enforced
- No self-service user management
- Audit all operations

### Data Privacy
- User data contains PII
- Email, name, phone visible to ADMIN
- Password never returned in responses
- Respect GDPR/privacy laws

### Audit Logging
- Log all user management operations
- Track who, what, when, why
- Important for compliance
- Review logs regularly

## Dependencies

### Internal
- User model (shared with auth domain)
- ChildProfile, Documents, Goals, etc. (cascade delete)
- Audit log service

### External
- Bcrypt (password hashing if creating users)

## Integration Points

- **Auth**: Admin creates ADMIN accounts
- **All Domains**: User management affects all user data
- **Dashboard**: Pending approval count
- **Audit**: Log all operations

## Testing Strategy

### Unit Tests
- User filtering by role, status
- Search functionality
- Status transition logic
- Approval tracking

### Integration Tests
- List all users (ADMIN only)
- Non-ADMIN blocked (403)
- Create user
- Update user profile
- Change user status (approval workflow)
- Delete user (cascade verification)
- Search users

### Security Tests
- ADMIN-only enforcement
- Password hashing on create
- PII protection
- Audit logging verification
