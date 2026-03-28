# Advocacy Domain - Architecture

## Overview
Advocacy scenarios provide actionable guidance for parents navigating IEP challenges. Can be manually created or AI-generated based on user data.

## Key Design Decisions

### 1. AI-Generated Insights
**Decision**: Support both manual and AI-generated scenarios.

**Rationale**:
- AI can proactively identify advocacy opportunities
- Analyze patterns in compliance, goals, communications
- Suggest timely interventions
- Users can create own scenarios too

### 2. Action Items Array
**Decision**: Store action items as array of strings.

**Rationale**:
- Breaks down advocacy scenarios into steps
- Users can track progress through checklist
- Simple implementation
- Future: Extract to separate task model

### 3. Trigger Data
**Decision**: Store what triggered the scenario in `triggerData` JSONB.

**Rationale**:
- AI scenarios need context
- Track what data prompted the insight
- Helps improve AI algorithms
- Transparent to users

### 4. Status Lifecycle
**Decision**: active → acknowledged → acted_upon workflow with dismissed option.

**Rationale**:
- Users may not act on all scenarios
- `acknowledged` means user saw it
- `acted_upon` means user took action
- `dismissed` for irrelevant scenarios

## Data Model

```typescript
{
  id: string (UUID)
  userId: string
  childId?: string
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  actionItems: string[]
  status: enum
  acknowledgedAt?: Date
  dismissedAt?: Date
  triggerType?: string
  triggerData: JSONB
  aiGenerated: boolean
  aiConfidenceScore?: number (0-1)
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

## Business Rules
- User owns scenarios
- AI-generated scenarios require approval/dismissal
- Priority affects dashboard ordering

## Dependencies
- ChildProfile (optional)
- AI service (scenario generation)
- Compliance, Goals, Communications (data sources)

## Testing Strategy
- Create manual scenario
- AI scenario generation
- Status workflow
- Action item updates
- Priority filtering
