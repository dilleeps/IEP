# Preferences Domain - Architecture

## Overview
User preferences store personalization settings separate from user profile data. One-to-one relationship with users.

## Key Design Decisions

### 1. Separate from User Profile
**Decision**: Preferences in separate table/model from User.

**Rationale**:
- User profile is identity/auth data
- Preferences are settings/UI data
- Different update frequencies
- Cleaner separation of concerns

### 2. One-to-One Relationship
**Decision**: Each user has exactly one preferences record.

**Rationale**:
- Single source of truth for preferences
- Unique constraint on userId
- Auto-created on first access
- No multi-device preference sets (for now)

### 3. JSONB Settings Fields
**Decision**: Use JSONB for `reminderSettings`, `dashboardLayout`, `privacySettings`.

**Rationale**:
- Flexible schema for future additions
- No migration needed for new settings
- Complex nested settings possible
- Query JSONB fields if needed

### 4. System Theme Option
**Decision**: Support 'system' theme option (in addition to light/dark).

**Rationale**:
- Respects user's OS preference
- Modern UX pattern
- Reduces user decision fatigue
- Better accessibility

## Data Model

### User Preference
```typescript
{
  id: string (UUID)
  userId: string (UUID, unique foreign key)
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  reminderSettings: JSONB
  dashboardLayout: JSONB
  privacySettings: JSONB
  createdAt: Date
  updatedAt: Date
}
```

### Database Constraints
- `userId` unique, references users.id with CASCADE delete
- `theme` validated enum
- `language` defaults to 'en'
- `timezone` defaults to 'UTC'

## Business Rules

### Creation Rules
1. Automatically created on first GET if not exists
2. Use default values for all fields
3. One preferences record per user

### Access Rules
1. Users can only access their own preferences
2. No ADMIN bypass (privacy-sensitive)
3. Cannot view other users' preferences

### Update Rules
1. All fields optional in updates
2. Validate theme, timezone, language
3. JSONB fields merge (not replace) by default

## Security Considerations

### Privacy
- Preferences may contain privacy-sensitive choices
- No admin access to preferences (except for debugging)
- Consider encrypting privacySettings

### Data Validation
- Timezone must be valid IANA timezone
- Language code validation
- Boolean type checking

## Dependencies

### Internal
- User model (userId reference)

### External
- Timezone validation library
- Language code validation

## Integration Points

- **User Profile**: Created alongside user
- **Dashboard**: Uses dashboardLayout for widget display
- **Notifications**: Uses notification settings
- **UI**: Theme and language applied globally

## Testing Strategy

### Unit Tests
- Auto-creation on first access
- Update individual fields
- JSONB field updates
- Default values

### Integration Tests
- GET preferences (auto-create if needed)
- PATCH preferences
- Theme validation
- Timezone validation
- Ownership enforcement
