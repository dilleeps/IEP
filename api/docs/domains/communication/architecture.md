# Communication Domain - Architecture

## Overview
Communication logs document all interactions with school personnel. Critical for maintaining records and demonstrating advocacy efforts.

## Key Design Decisions

### 1. Follow-Up Tracking
**Decision**: Include `followUpRequired` and `followUpDate` fields.

**Rationale**:
- Many communications require follow-up actions
- Dashboard can show pending follow-ups
- Ensures issues don't fall through cracks
- Important for IEP compliance

### 2. Contact Information
**Decision**: Store `contactWith` (name) and optional `contactRole`.

**Rationale**:
- Track who was contacted
- Role provides context (teacher, principal, etc.)
- Free-form fields for flexibility
- Future: Could link to contacts database

### 3. Attachments Array
**Decision**: Store attachment file paths in array.

**Rationale**:
- Communications often include email attachments
- Reference to uploaded documents
- Could link to documents domain

## Data Model

```typescript
{
  id: string (UUID)
  childId: string
  userId: string
  date: Date
  contactType: enum
  contactWith: string
  contactRole?: string
  subject: string
  summary: string
  outcome?: string
  followUpRequired: boolean
  followUpDate?: Date
  attachments: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

## Business Rules
- User must own child profile
- Date cannot be in future
- Follow-up date should be after communication date

## Dependencies
- ChildProfile model
- Dashboard (follow-up reminders)

## Testing Strategy
- CRUD operations
- Follow-up filtering
- Tag-based search
- Ownership enforcement
