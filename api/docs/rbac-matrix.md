# Role-Based Access Control (RBAC) Matrix

## User Roles

| Role | Description | Registration | Default Status |
|------|-------------|--------------|----------------|
| **PARENT** | Parents/guardians of students with IEPs | Self-registration | `active` |
| **ADVOCATE** | Professional advocates, consultants | Self-registration | `pending` (requires approval) |
| **ADMIN** | System administrators | Admin-created only | `active` |

## User Status Workflow

```
Registration
    ↓
[PARENT] → active (immediate access)
    ↓
[ADVOCATE/ADMIN] → pending → (admin approval) → active
                             ↓
                     [admin rejection] → inactive/suspended
```

**Status Types**:
- `active` - Can login and access system
- `pending` - Awaiting approval (cannot login)
- `inactive` - Temporarily disabled (cannot login)
- `suspended` - Blocked access (cannot login)

## Domain Access Matrix

| Domain | Endpoint | PARENT | ADVOCATE | ADMIN | Notes |
|--------|----------|--------|----------|-------|-------|
| **Authentication** |
| | POST /auth/register | ✅ Public | ✅ Public | ✅ Public | All can self-register |
| | POST /auth/login | ✅ Public | ✅ Public | ✅ Public | Status must be `active` |
| | POST /auth/refresh | ✅ | ✅ | ✅ | Valid token required |
| | POST /auth/logout | ✅ | ✅ | ✅ | Authenticated |
| | POST /auth/change-password | ✅ | ✅ | ✅ | Authenticated |
| **User Profile** |
| | GET /profile | ✅ | ✅ | ✅ | Own profile |
| | PATCH /profile | ✅ | ✅ | ✅ | Own profile |
| **Children** |
| | POST /children | ✅ | ✅ | ✅ | Create child |
| | GET /children | ✅ | ✅ | ✅ | Own children; ADMIN sees all |
| | GET /children/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /children/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /children/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| **Documents** |
| | POST /documents | ✅ | ✅ | ✅ | Upload document |
| | GET /documents | ✅ | ✅ | ✅ | Own documents; ADMIN sees all |
| | GET /documents/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /documents/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /documents/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| **Goals** |
| | POST /goals | ✅ | ✅ | ✅ | Create goal |
| | GET /goals | ✅ | ✅ | ✅ | Own goals; ADMIN sees all |
| | GET /goals/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /goals/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /goals/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | POST /goals/:id/milestones | ✅ | ✅ | ✅ | Add milestone |
| | PATCH /goals/:goalId/milestones/:id | ✅ | ✅ | ✅ | Update milestone |
| **Compliance** |
| | POST /compliance | ✅ | ✅ | ✅ | Create deadline |
| | GET /compliance | ✅ | ✅ | ✅ | Own deadlines; ADMIN sees all |
| | GET /compliance/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /compliance/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /compliance/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| **Communication** |
| | POST /communications | ✅ | ✅ | ✅ | Log communication |
| | GET /communications | ✅ | ✅ | ✅ | Own logs; ADMIN sees all |
| | GET /communications/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /communications/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /communications/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| **Behavior** |
| | POST /behaviors | ✅ | ✅ | ✅ | Log behavior |
| | GET /behaviors | ✅ | ✅ | ✅ | Own logs; ADMIN sees all |
| | GET /behaviors/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /behaviors/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /behaviors/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| **Letters** |
| | POST /letters/generate | ✅ | ✅ | ✅ | Generate letter |
| | GET /letters | ✅ | ✅ | ✅ | Own letters; ADMIN sees all |
| | GET /letters/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /letters/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /letters/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | GET /letters/templates | ✅ | ✅ | ✅ | Public templates |
| **Advocacy** |
| | POST /advocacy/scenarios | ✅ | ✅ | ✅ | Create scenario |
| | GET /advocacy/scenarios | ✅ | ✅ | ✅ | Own scenarios; ADMIN sees all |
| | GET /advocacy/scenarios/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | PATCH /advocacy/scenarios/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | DELETE /advocacy/scenarios/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | POST /advocacy/scenarios/:id/events | ✅ | ✅ | ✅ | Add timeline event |
| **Resources** |
| | GET /resources | ✅ | ✅ | ✅ | Public resources |
| | GET /resources/:id | ✅ | ✅ | ✅ | Public access |
| | GET /resources/search | ✅ | ✅ | ✅ | Search resources |
| **Preferences** |
| | GET /settings/preferences | ✅ | ✅ | ✅ | Own preferences |
| | PATCH /settings/preferences | ✅ | ✅ | ✅ | Own preferences |
| **Dashboard** |
| | GET /dashboard/summary | ✅ | ✅ | ✅ | Own summary; ADMIN sees system-wide |
| **AI Conversations** |
| | POST /ai/conversations | ✅ | ✅ | ✅ | Start conversation |
| | GET /ai/conversations | ✅ | ✅ | ✅ | Own conversations; ADMIN sees all |
| | GET /ai/conversations/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| | POST /ai/conversations/:id/messages | ✅ | ✅ | ✅ | Add message |
| | DELETE /ai/conversations/:id | ✅ | ✅ | ✅ | Owner or ADMIN |
| **Smart Prompts** |
| | GET /smart-prompts | ✅ | ❌ | ✅ | PARENT and ADMIN only |
| | POST /smart-prompts/:id/acknowledge | ✅ | ❌ | ✅ | PARENT and ADMIN only |
| **Config (Public)** |
| | GET /config | ✅ | ✅ | ✅ | Read-only config |
| | GET /config/:category | ✅ | ✅ | ✅ | Category-specific config |
| **Admin - Config** |
| | GET /admin/config | ❌ | ❌ | ✅ | ADMIN only |
| | POST /admin/config | ❌ | ❌ | ✅ | ADMIN only |
| | PATCH /admin/config/:id | ❌ | ❌ | ✅ | ADMIN only |
| | DELETE /admin/config/:id | ❌ | ❌ | ✅ | ADMIN only |
| **Admin - Users** |
| | GET /admin/users | ❌ | ❌ | ✅ | ADMIN only |
| | GET /admin/users/stats | ❌ | ❌ | ✅ | ADMIN only |
| | POST /admin/users | ❌ | ❌ | ✅ | ADMIN only |
| | PATCH /admin/users/:id | ❌ | ❌ | ✅ | ADMIN only |
| | PATCH /admin/users/:id/status | ❌ | ❌ | ✅ | ADMIN only |
| | DELETE /admin/users/:id | ❌ | ❌ | ✅ | ADMIN only |
| **Admin - Resources** |
| | POST /admin/resources | ❌ | ❌ | ✅ | ADMIN only |
| | PATCH /admin/resources/:id | ❌ | ❌ | ✅ | ADMIN only |
| | DELETE /admin/resources/:id | ❌ | ❌ | ✅ | ADMIN only |

## Access Control Implementation

### Middleware
All routes use the following middleware stack:
```typescript
requireAuth()           // Validates JWT token
requireRole([...])      // Checks user role against allowed roles
checkOwnership()        // Validates user owns the resource (where applicable)
```

### Ownership Rules
For user-scoped resources (children, goals, documents, etc.):
- **PARENT/ADVOCATE**: Can only access their own data (filtered by `userId`)
- **ADMIN**: Can access all data across all users

### Status Validation
- Login: Only `status === 'active'` users can authenticate
- Token Refresh: Validates status on every refresh
- All Protected Routes: Implicitly require `active` status via JWT validation

## Special Access Patterns

### Hybrid Access (Owner or ADMIN)
Many endpoints allow:
- Users to access their own resources
- ADMIN to access any resource

Implementation checks:
```typescript
if (user.role !== 'ADMIN' && resource.userId !== user.id) {
  throw new ForbiddenError();
}
```

### Public + Authenticated Split
- **Resources**: Public read access, ADMIN write access
- **Config**: Public read access, ADMIN write access
- **Letter Templates**: Public read access for all authenticated users

### PARENT-Only Features
- **Smart Prompts**: Contextual guidance specifically for parents navigating IEPs
- Advocates don't need prompts (they're professionals)

## Authorization Error Responses

**401 Unauthorized** - No token or invalid token:
```json
{
  "error": "Authentication required",
  "statusCode": 401
}
```

**403 Forbidden** - Valid token, insufficient permissions:
```json
{
  "error": "Insufficient permissions",
  "statusCode": 403
}
```

**403 Forbidden** - Account not active:
```json
{
  "error": "Account is pending approval",
  "statusCode": 403
}
```

## Testing RBAC

When testing endpoints, ensure:
1. **No Token**: Returns 401
2. **Wrong Role**: Returns 403
3. **Correct Role, Wrong Owner**: Returns 403 (for ownership-based endpoints)
4. **Correct Role + Owner**: Returns 200 with data
5. **ADMIN**: Can access any resource regardless of ownership
