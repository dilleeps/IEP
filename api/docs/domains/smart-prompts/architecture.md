# Smart Prompts Domain - Architecture

## Overview
Smart prompts provide contextual, timely guidance to parents navigating the IEP process. Combination of rule-based and AI-generated notifications.

## Key Design Decisions

### 1. PARENT-Only Feature
**Decision**: Smart prompts only for PARENT role, not ADVOCATE or ADMIN.

**Rationale**:
- Parents are learning IEP process
- Advocates are professionals (don't need prompts)
- ADMIN can view for support purposes
- Reduces noise for professional users

### 2. Acknowledgment vs. Dismissal
**Decision**: Simple acknowledgment system (mark as read).

**Rationale**:
- Track if user saw the prompt
- Don't remove prompts (user may want to revisit)
- Future: Add dismissal for unwanted prompts
- Simpler UX

### 3. Expiration System
**Decision**: Optional `expiresAt` for time-sensitive prompts.

**Rationale**:
- Meeting reminders expire after meeting
- Prevents stale prompts accumulating
- Auto-cleanup of outdated prompts
- Database cleanup via cron

### 4. Actionable Prompts
**Decision**: Prompts can include action links (`actionUrl`, `actionLabel`).

**Rationale**:
- Guide user to relevant page
- Reduce friction for taking action
- Improves engagement
- Clear call-to-action

### 5. Rule-Based + AI-Generated
**Decision**: Support both scheduled/rule-based and AI-generated prompts.

**Rationale**:
- Rules: Predictable, reliable (e.g., meeting reminders)
- AI: Personalized, context-aware
- Hybrid approach best of both worlds
- `contextData` stores generation context

## Data Model

### Smart Prompt
```typescript
{
  id: string (UUID)
  userId: string (foreign key)
  childId?: string (optional foreign key)
  promptType: enum
  category: enum
  priority: enum
  title: string
  message: string
  actionable: boolean
  actionUrl?: string
  actionLabel?: string
  contextData: JSONB
  acknowledged: boolean
  acknowledgedAt?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

### Database Constraints
- `userId` references users.id with CASCADE delete
- `childId` optional, references child_profiles.id with SET NULL
- `acknowledged` defaults to false
- Indexes on `userId`, `priority`, `expiresAt`, `acknowledged`

## Business Rules

### Generation Rules
1. **Meeting Reminders**: 30, 14, 7 days before IEP review
2. **Document Missing**: 7 days after child profile created, no documents
3. **Goal Review**: Monthly reminders if goals not updated
4. **Compliance Alerts**: Deadlines approaching
5. **Advocacy Tips**: Weekly tips for new users
6. **Resource Suggestions**: AI suggests based on activity

### Display Rules
- Show unacknowledged prompts first
- Sort by priority (urgent → low)
- Hide expired prompts
- Limit to 10 active prompts at once

### Acknowledgment Rules
- Only owner can acknowledge
- Sets `acknowledgedAt` timestamp
- Acknowledged prompts remain in history
- Can re-acknowledge (no-op)

### Expiration Rules
- Cron job deletes expired prompts daily
- Expired = `expiresAt < NOW()`
- Meeting reminders expire after meeting date
- Tips/suggestions don't expire

## Security Considerations

### Data Privacy
- Prompts may contain child names, dates
- Only visible to owner
- ADMIN can view for support
- No sharing between users

### Access Control
- PARENT role required
- ADVOCATE explicitly blocked
- Ownership validation on acknowledge

## Dependencies

### Internal
- User model (userId)
- ChildProfile (childId, meeting dates)
- GoalProgress (goal review prompts)
- ComplianceLog (compliance alerts)

### External
- Cron/scheduler for timed prompts
- AI service for generated prompts

## Integration Points

- **Dashboard**: Show top 3 prompts
- **Children**: Meeting reminders from IEP dates
- **Goals**: Goal review prompts
- **Compliance**: Compliance alert prompts
- **Resources**: Resource suggestion prompts

## Testing Strategy

### Unit Tests
- Prompt generation logic
- Expiration calculation
- Priority sorting
- Acknowledgment handling

### Integration Tests
- List prompts (PARENT only)
- ADVOCATE blocked (403)
- Acknowledge prompt
- Expired prompts hidden
- Ownership enforcement

### Cron Tests
- Meeting reminder generation
- Expired prompt cleanup
- Weekly tip generation
