# Config Domain - Architecture

## Overview
Public configuration stores system-wide settings, dropdown options, feature flags, and constants. Read by all users, managed by ADMIN.

## Key Design Decisions

### 1. Public Read, Admin Write
**Decision**: All authenticated users can read; only ADMIN can write.

**Rationale**:
- Config provides UI dropdown values
- Consistent data across users
- Centralized management
- No user-specific config (use preferences for that)

### 2. Array Config Values
**Decision**: `configValue` is always an array of strings.

**Rationale**:
- Consistent data type (always array)
- Supports single values: `["value"]`
- Supports multiple values: `["val1", "val2"]`
- Simplifies client-side handling

### 3. Active/Inactive vs. Soft Delete
**Decision**: Use `isActive` boolean instead of soft delete.

**Rationale**:
- Config is reference data, not user data
- Deactivate obsolete config (don't delete)
- Can reactivate if needed
- Simpler than paranoid deletion

### 4. Config Types
**Decision**: Four config types (dropdown, setting, feature_flag, constant).

**Rationale**:
- Clear categorization
- Different use cases
- UI can render appropriately
- Query by type if needed

## Data Model

### System Configuration
```typescript
{
  id: string (UUID)
  configKey: string (unique)
  configType: 'dropdown' | 'setting' | 'feature_flag' | 'constant' | 'other'
  configValue: string[] (always array)
  description?: string
  isActive: boolean
  isEditable: boolean
  metadata: JSONB
  createdAt: Date
  updatedAt: Date
}
```

### Database Constraints
- `configKey` unique
- `configType` validated enum
- `configValue` required, array
- `isActive` defaults to true
- `isEditable` defaults to true

## Business Rules

### Read Rules
1. All authenticated users can read active config
2. Inactive config hidden from non-ADMIN
3. ADMIN sees all config (active and inactive)
4. No userId filtering (global data)

### Write Rules (Admin Only)
1. Only ADMIN can create, update, delete
2. Some config marked `isEditable: false` (protected)
3. Deactivate instead of delete
4. Update `updatedAt` on changes

### Config Key Naming
- Use snake_case: `goal_categories`, `feature_ai_chat`
- Descriptive names
- Prefix by type: `feature_*`, `setting_*`
- Consistent naming convention

## Security Considerations

### Data Access
- No sensitive data in config (public reference data)
- Authentication required to prevent scraping
- Rate limiting recommended

### Protected Config
- Some config marked `isEditable: false`
- Prevents accidental modification of critical settings
- ADMIN can still edit via override

## Dependencies

### Internal
- Admin endpoints for CRUD

### External
- None (self-contained)

## Integration Points

- **All Domains**: Use config for dropdown values
- **UI**: Renders dropdowns from config
- **Validation**: Validates against config values
- **Feature Flags**: Enable/disable features

## Caching Strategy
- Config changes infrequently
- Cache in Redis or memory (TTL: 1 hour)
- Invalidate on admin updates
- Client-side caching also beneficial

## Testing Strategy

### Unit Tests
- Config retrieval by key
- Active/inactive filtering
- Type filtering

### Integration Tests
- GET all config (authenticated)
- GET specific config by key
- Inactive config hidden
- Unauthorized access (401)

### Admin Tests
- CRUD operations (see admin-config tests)
- Protected config enforcement
