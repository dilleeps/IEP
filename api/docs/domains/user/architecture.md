# User Profile Domain - Architecture

## Overview
User profile management handles user personal information, contact details, and profile updates beyond authentication.

## Key Design Decisions

### 1. Separation from Auth
**Decision**: Keep user profile management separate from authentication logic.

**Rationale**:
- Auth focuses on security (registration, login, tokens)
- Profile focuses on user data (display name, contact info, preferences)
- Clear separation of concerns
- Different update frequencies and validation rules

### 2. Display Name vs First/Last Name
**Decision**: Support both `displayName` (single field) and split names in auth.

**Rationale**:
- `displayName` allows flexibility (nicknames, preferred names)
- Derived from `firstName + lastName` during registration
- Users can customize display name independently
- Supports diverse naming conventions

### 3. Profile Visibility
**Decision**: Users can only view/update their own profile.

**Rationale**:
- Privacy protection
- GDPR compliance
- Users control their own data
- ADMIN access requires separate admin endpoints

## Data Model

### User Profile (from User model)
```typescript
{
  id: string (UUID)
  email: string (read-only in profile)
  displayName: string
  role: 'PARENT' | 'ADVOCATE' | 'ADMIN' (read-only)
  status: 'active' | 'pending' | 'inactive' | 'suspended' (read-only)
  provider: 'internal' | 'google' | 'microsoft' | 'apple' (read-only)
  lastLoginAt: Date (read-only)
  approvedAt?: Date (read-only)
  approvedBy?: string (read-only, admin userId)
  createdAt: Date
  updatedAt: Date
}
```

## Business Rules

### Profile Read Rules
1. Authenticated users only
2. Users see their own profile data
3. Status fields are read-only
4. Email can be viewed but not changed via profile (security consideration)

### Profile Update Rules
1. Authenticated users can update:
   - `displayName`
   - Other editable fields (future: phone, timezone, etc.)
2. Cannot update:
   - `id`, `email`, `role`, `status`, `provider`
   - `lastLoginAt`, `approvedAt`, `approvedBy`
   - `createdAt`, `updatedAt`

### Validation
- `displayName`: Required, 2-100 characters
- Future fields: Phone format, timezone validation

## Security Considerations

### Data Access
- No user can view other users' profiles (except via admin endpoints)
- Profile updates require authentication
- Sensitive fields (status, role) cannot be self-modified

### Future Enhancements
1. **Profile Pictures**: Avatar upload and management
2. **Email Change**: Secure email change with verification
3. **Privacy Settings**: Control data visibility
4. **Timezone**: User timezone for date display
5. **Notification Preferences**: Email/SMS notification settings (separate from preferences domain)

## Dependencies

### Internal
- `User` model
- Auth middleware for authentication
- BaseService, BaseRepo patterns

### External
- Zod for validation

## Integration Points

- **Auth**: Profile created during registration
- **Preferences**: User preferences stored separately
- **Dashboard**: Profile data used for display
- **Admin Users**: Admin can view/modify any profile

## Testing Strategy

### Unit Tests
- Service layer profile retrieval
- Validation of updateable fields
- Read-only field protection

### Integration Tests
- GET profile returns own data
- PATCH profile updates allowed fields
- PATCH profile rejects read-only fields
- Unauthorized access blocked
