# Behavior Domain - Architecture

## Overview
Behavior tracking logs positive, negative, and neutral behaviors to support Functional Behavior Assessments (FBA) and Behavior Intervention Plans (BIP).

## Key Design Decisions

### 1. Positive Behavior Tracking
**Decision**: Include `positive` behavior type, not just negative incidents.

**Rationale**:
- Positive reinforcement is evidence-based
- Track progress toward behavioral goals
- Balanced view of child's behavior
- Required for some BIPs

### 2. ABC Framework Support
**Decision**: Include `context`, `triggers`, `interventions`, `outcome` fields.

**Rationale**:
- Supports Antecedent-Behavior-Consequence (ABC) analysis
- Required for functional behavior assessments
- Helps identify behavior patterns
- Informs intervention strategies

### 3. Optional Severity Field
**Decision**: Severity is optional and primarily for negative behaviors.

**Rationale**:
- Not all behaviors need severity rating
- Positive behaviors don't have severity
- 1-10 scale provides granularity for negative behaviors
- Helps prioritize intervention efforts

### 4. Witnesses Array
**Decision**: Track witnesses to behavior incidents.

**Rationale**:
- Documentation for formal reports
- Multiple perspectives on incidents
- Important for dispute resolution
- Credibility for due process

## Data Model

```typescript
{
  id: string (UUID)
  childId: string
  userId: string
  date: Date
  behaviorType: 'positive' | 'negative' | 'neutral'
  description: string
  context?: string
  triggers?: string
  interventions?: string
  outcome?: string
  severity?: number (1-10)
  duration?: number (minutes)
  location?: string
  witnesses?: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

## Business Rules
- User must own child profile
- Severity typically used for negative behaviors only
- Date cannot be in future
- Duration in minutes

## Dependencies
- ChildProfile model
- Goals (behavioral goals)
- Dashboard (behavior analytics)

## Testing Strategy
- Log positive/negative behaviors
- ABC data collection
- Date range filtering
- Pattern analysis
- Ownership enforcement
