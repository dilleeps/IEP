# Letters Domain - Architecture

## Overview
Letter generation helps parents create professional, legally appropriate correspondence with schools.

## Key Design Decisions

### 1. AI-Powered Generation
**Decision**: Use AI to generate letter content based on templates and context.

**Rationale**:
- Parents often unsure how to write formal letters
- Legal language can be intimidating
- Templates ensure key points included
- Saves time and reduces stress

### 2. Draft-Final-Sent Workflow
**Decision**: Three-stage status workflow.

**Rationale**:
- Users can edit AI-generated drafts
- Mark as "final" when ready
- Track which letters were actually sent
- Audit trail for compliance

### 3. Keywords and Tone
**Decision**: Store keywords and tone metadata.

**Rationale**:
- AI uses keywords for generation
- Tone affects language style
- Future: Learn from user preferences
- Helps categorize and search letters

### 4. Template System
**Decision**: Predefined templates for common letter types.

**Rationale**:
- Common IEP letters have standard structure
- Templates ensure legal requirements met
- Quick start for users
- Consistent quality

## Data Model

```typescript
{
  id: string (UUID)
  userId: string
  childId?: string
  letterType: enum
  subject: string
  recipient: string
  content: string (full letter text)
  status: 'draft' | 'final' | 'sent'
  tone?: string
  keywords: string[]
  metadata: JSONB (template ID, generation params)
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

## Business Rules
- User owns all their letters
- Content fully editable after AI generation
- childId optional (some letters not child-specific)

## Dependencies
- ChildProfile (optional context)
- AI service (LangChain for generation)
- Template repository

## Testing Strategy
- Generate letter from template
- Edit draft content
- Status workflow transitions
- Template listing
- Ownership enforcement
