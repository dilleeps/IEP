# Goals Domain - Architecture

## Overview
The goals domain manages IEP goals and progress tracking. Goals are linked to child profiles and support milestone tracking for incremental progress measurement.

## Key Design Decisions

### 1. JSONB Milestones Storage
**Decision**: Store milestones in `milestonesData` JSONB field instead of separate table.

**Rationale**:
- Milestones are always accessed with their parent goal
- Simplifies queries (no joins needed)
- Flexible milestone structure
- Most goals have 0-5 milestones (manageable in JSONB)
- Future: Can extract to separate table if needed

### 2. Progress Percentage Field
**Decision**: Include `progressPercentage` (0-100) alongside `status` enum.

**Rationale**:
- Numeric progress more granular than status alone
- Enables progress charts and visualizations
- Status provides categorical state
- Both fields useful for different UI needs

### 3. Last Updated Tracking
**Decision**: Separate `lastUpdated` field updated on any goal change.

**Rationale**:
- Track when progress was last reviewed
- Different from `updatedAt` (may update metadata without progress change)
- Helps identify stale goals needing review
- Dashboard can show "last reviewed" dates

### 4. Goal Categories
**Decision**: Use predefined categories for goal types.

**Rationale**:
- Common IEP goal classifications
- Enables filtering by domain
- Dashboard can aggregate by category
- AI can suggest category-specific strategies

### 5. Status Workflow
**Decision**: Support status transitions: not_started → in_progress → achieved/modified/discontinued.

**Rationale**:
- Reflects real-world goal lifecycle
- `modified` allows goal revision without deletion
- `discontinued` tracks abandoned goals (important for IEP compliance)
- Audit trail of goal outcomes

## Data Model

### Goal Progress
```typescript
{
  id: string (UUID)
  childId: string (UUID, foreign key to child_profiles)
  userId: string (UUID, foreign key to users)
  goalText: string
  category: 'academic' | 'behavioral' | 'communication' | 'social' | 'adaptive' | 'motor' | 'other'
  targetDate?: Date
  status: 'not_started' | 'in_progress' | 'achieved' | 'modified' | 'discontinued'
  progressPercentage?: number (0-100)
  notes: string
  milestonesData: JSONB {
    milestones: [
      {
        id: string
        description: string
        targetDate?: Date
        completed: boolean
        completedDate?: Date
      }
    ]
  }
  lastUpdated: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date (soft delete)
}
```

### Database Constraints
- `childId` references `child_profiles.id` with CASCADE delete
- `userId` references `users.id`
- `goalText` required
- `category` required, validated enum
- `status` defaults to `not_started`
- `lastUpdated` defaults to NOW

## Business Rules

### Creation Rules
1. User must own the child profile
2. Required fields: `childId`, `goalText`, `category`
3. `status` defaults to `not_started`
4. `lastUpdated` set to current timestamp
5. `milestonesData` defaults to empty object

### Access Rules
1. PARENT/ADVOCATE: Can only access own goals
2. ADMIN: Can access all goals
3. Ownership check via child: `child.userId === user.id` (unless ADMIN)

### Update Rules
1. Only owner or ADMIN can update
2. Any field update sets `lastUpdated` to current timestamp
3. `progressPercentage` must be 0-100
4. Status transitions should be logical (but not enforced)

### Milestone Rules
1. Milestones stored in `milestonesData.milestones` array
2. Each milestone has unique `id` (UUID or sequential)
3. Milestones can be added, updated, or removed
4. Completed milestones have `completed: true` and `completedDate`

### Deletion Rules
1. Soft delete (sets `deletedAt`)
2. Preserves goal history
3. Cascade from child profile deletion

## Security Considerations

### Data Privacy
- Goals contain sensitive educational information
- FERPA compliance required
- Access restricted to owner and ADMIN

### Access Control
- Ownership validation via child profile
- Cannot access other users' goals
- ADMIN bypass for support

### Future Enhancements
1. **Sharing**: Allow parents to share goals with advocates
2. **Templates**: Pre-defined goal templates by category
3. **Reminders**: Notifications for target dates
4. **Evidence**: Link documents/photos as progress evidence

## Dependencies

### Internal
- `ChildProfile` model (childId reference)
- `User` model (userId reference)
- Dashboard (aggregates goal data)

### External
- Zod for validation
- Sequelize ORM
- UUID generation

## Integration Points

- **Children**: Goals linked to child profiles
- **Dashboard**: Goal progress statistics
- **AI Conversations**: Goals used for context in advocacy advice
- **Documents**: IEP documents contain goals (extracted by AI)
- **Compliance**: Goal review dates tracked

## Testing Strategy

### Unit Tests
- Service layer CRUD operations
- Ownership validation logic
- Milestone add/update/remove
- Progress percentage validation
- lastUpdated auto-update

### Integration Tests
- Create goal for owned child
- List own goals (filtered by child)
- ADMIN access to all goals
- Update goal progress
- Add/update milestones
- Soft delete
- Ownership enforcement (403)

### Business Logic Tests
- Status transitions
- Progress percentage bounds
- Milestone completion tracking
