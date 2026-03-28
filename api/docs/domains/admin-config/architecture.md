# Admin Config Domain - Architecture

## Overview
Admin config provides CRUD interface for managing system configuration. Extends public config domain with write operations.

## Key Design Decisions

### 1. ADMIN-Only Write Access
**Decision**: Only ADMIN role can create, update, delete config.

**Rationale**:
- Config affects all users system-wide
- Incorrect config can break functionality
- Requires technical knowledge
- Centralized control

### 2. Protected Config
**Decision**: Some config marked `isEditable: false` to prevent modification.

**Rationale**:
- System-critical config protected
- Prevent accidental changes
- ADMIN must explicitly override
- Examples: `app_version`, `api_version`

### 3. Permanent Delete (Not Soft)
**Decision**: DELETE endpoint permanently removes config.

**Rationale**:
- Config is reference data (can recreate if needed)
- Soft delete via `isActive: false` is preferred method
- Permanent delete for test/obsolete config only
- Clear distinction between deactivate and delete

### 4. Cache Invalidation
**Decision**: Invalidate cache on all write operations.

**Rationale**:
- Config cached aggressively
- Changes must propagate immediately
- Stale cache causes bugs
- Notify all instances in cluster

## Business Rules

### Create Rules
- `configKey` must be unique
- Use snake_case naming
- `configValue` always an array
- Defaults: `isActive: true`, `isEditable: true`

### Update Rules
- Cannot change `configKey` (delete and recreate instead)
- `isEditable: false` configs require override
- `configValue` must be array
- Update invalidates cache

### Delete Rules
- Warn before permanent delete
- Prefer `isActive: false` (deactivate)
- Check if config is in use (future)
- Audit log deletion

## Security Considerations

### Access Control
- ADMIN role strictly enforced
- Audit log all changes
- Track who created/modified config
- Consider two-person rule for critical config

### Validation
- `configKey` format validation (snake_case, no special chars)
- `configType` enum validation
- `configValue` array validation
- Prevent injection attacks

## Dependencies

### Internal
- SystemConfiguration model (shared with public config)
- Audit log service

### External
- Cache invalidation (Redis)
- Webhook notifications (optional)

## Integration Points

- **Public Config**: ADMIN operations affect public config reads
- **Cache**: Invalidate on changes
- **Audit**: Log all config changes
- **Notifications**: Optionally notify on critical changes

## Testing Strategy

### Unit Tests
- Config CRUD operations
- Protected config enforcement
- Cache invalidation
- Unique key validation

### Integration Tests
- Create config (ADMIN only)
- Update config
- Delete config
- Non-ADMIN blocked (403)
- Protected config modification blocked

### Security Tests
- Role-based access enforcement
- Audit logging verification
- Injection attack prevention
