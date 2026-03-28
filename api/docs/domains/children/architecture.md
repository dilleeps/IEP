# Children Domain - Architecture

## Overview
The children domain manages child profiles, which are central to the IEP application. Each user (parent, advocate, admin) can create and manage profiles for children with IEPs. Child profiles serve as the context for all other IEP-related data (documents, goals, communications, etc.).

## Key Design Decisions

### 1. One-to-Many User-Child Relationship
**Decision**: Each user can have multiple child profiles, but each child profile belongs to one user.

**Rationale**:
- Parents often have multiple children with IEPs
- Advocates may manage multiple cases
- Simplifies ownership and access control
- Avoids shared ownership complexity

**Future Consideration**: Implement "shared access" where multiple users (e.g., both parents) can collaborate on a child's profile.

### 2. Advocacy Context Fields
**Decision**: Include `advocacyLevel`, `advocacyBio`, `primaryGoal`, and `stateContext` fields.

**Rationale**:
- AI needs context about parent's experience level
- State-specific legal guidance requires location
- Primary goals help focus recommendations
- Personalizes advocacy assistance

### 3. Flexible Disabilities and Tags
**Decision**: Use array fields for `disabilities` and `focusTags` instead of predefined enums.

**Rationale**:
- Disabilities vary widely and change frequently
- Users can input their specific terminology
- Focus areas are highly personalized
- Avoids constraining user input
- System configuration can provide suggestions

### 4. IEP Date Tracking
**Decision**: Store `lastIepDate` and `nextIepReviewDate` directly on child profile.

**Rationale**:
- Quick access for deadline tracking
- Dashboard can query without joins
- Simplifies compliance monitoring
- Core to IEP process timeline

### 5. Reminder Preferences per Child
**Decision**: Store `reminderPreferences` as JSONB on child profile.

**Rationale**:
- Different reminder needs per child
- Flexible structure for future reminder types
- Separates from global user preferences
- Allows child-specific notification settings

## Data Model

### Child Profile
```typescript
{
  id: string (UUID)
  userId: string (UUID, foreign key to users)
  name: string
  dateOfBirth?: Date
  age?: number
  grade?: string
  schoolName?: string
  schoolDistrict?: string
  disabilities: string[] (array of text)
  focusTags: string[] (array of text)
  lastIepDate?: Date
  nextIepReviewDate?: Date
  advocacyLevel?: 'Beginner' | 'Intermediate' | 'Advanced'
  advocacyBio?: string
  primaryGoal?: string
  stateContext?: string
  isActive: boolean
  reminderPreferences: JSONB
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date (soft delete)
}
```

### Database Constraints
- `userId` references `users.id` with CASCADE delete
- `name` is required
- `isActive` defaults to true
- Soft delete via `deletedAt`

## Business Rules

### Creation Rules
1. Any authenticated user can create child profiles
2. Child profile automatically linked to creator's userId
3. Default `isActive: true` on creation
4. Minimum required field: `name`

### Access Rules
1. PARENT/ADVOCATE: Can only access own child profiles
2. ADMIN: Can access all child profiles
3. Ownership check: `childProfile.userId === user.id` (unless ADMIN)

### Update Rules
1. Only owner or ADMIN can update
2. All fields are optional in updates
3. `userId` cannot be changed
4. `id`, `createdAt` are immutable

### Deletion Rules
1. Soft delete only (sets `deletedAt`)
2. Cascades to related data:
   - Documents
   - Goals
   - Communications
   - Behavior logs
   - Letters
   - Advocacy scenarios
3. ADMIN can restore deleted profiles (future)

### Validation Rules
- `name`: 1-255 characters
- `grade`: 1-50 characters
- `schoolName`, `schoolDistrict`: 1-255 characters
- `advocacyLevel`: Must be `Beginner`, `Intermediate`, or `Advanced`
- `dateOfBirth`, `lastIepDate`, `nextIepReviewDate`: Valid dates
- `age`: Integer > 0

## Security Considerations

### Data Privacy
- Child data is highly sensitive (FERPA, COPPA compliance)
- PII (name, DOB, school) requires protection
- Access restricted to owner and ADMIN only
- Audit logging recommended for all access

### Access Control
- Ownership validation on all read/write operations
- ADMIN role bypass for support purposes
- No public access to child profiles

### Future Security Enhancements
1. **Encryption at Rest**: Encrypt sensitive fields (name, DOB, school)
2. **Access Logs**: Track who accesses child profiles
3. **Shared Access**: Allow parents to grant advocates limited access
4. **Export Controls**: Audit all profile exports

## Dependencies

### Internal
- `User` model (userId reference)
- Document, Goal, Communication, Behavior, Letter, Advocacy models (child relationships)
- Dashboard (aggregates child data)
- AI Conversations (uses child context)

### External
- Zod for validation
- Sequelize ORM
- UUID generation

## Integration Points

- **Documents**: Documents linked to `childId`
- **Goals**: Goals tracked per child
- **Compliance**: Deadlines tracked per child
- **Communications**: Logs associated with child
- **Behavior**: Behavior logs per child
- **Letters**: Letters reference child context
- **Advocacy**: Scenarios linked to child
- **AI**: Conversations use child context
- **Dashboard**: Aggregates per-child statistics

## Testing Strategy

### Unit Tests
- Service layer CRUD operations
- Ownership validation logic
- Soft delete behavior
- Field validation

### Integration Tests
- Create child profile
- List own children (role-based)
- ADMIN access to all children
- Update own vs. other's child (403)
- Soft delete cascades
- Pagination and sorting

### Security Tests
- Prevent access to other users' children
- ADMIN can access any child
- Token validation required
- Invalid UUID handling
