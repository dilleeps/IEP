# Compliance Domain - Architecture

## Overview
The compliance domain tracks IEP-related deadlines, service delivery issues, and compliance concerns. Helps parents and advocates monitor school district compliance with IEP requirements.

## Key Design Decisions

### 1. Issue Type Classification
**Decision**: Predefined issue types with `other` fallback.

**Rationale**:
- Common IEP compliance issues are well-defined
- Enables filtering and reporting by issue type
- Dashboard can highlight critical compliance gaps
- `other` allows flexibility for unique situations

### 2. Severity Levels
**Decision**: Four severity levels (low, medium, high, critical).

**Rationale**:
- Prioritize which issues need immediate attention
- Critical issues trigger urgent notifications
- Dashboard highlights high/critical items
- Helps parents triage advocacy efforts

### 3. Status Workflow
**Decision**: Status progression: open → in_progress → resolved/escalated.

**Rationale**:
- Tracks lifecycle of compliance issue
- `escalated` indicates need for formal action (due process)
- Resolved items preserved for records
- Audit trail for IEP meetings

### 4. Evidence Files Array
**Decision**: Store file paths in `evidenceFiles` array field.

**Rationale**:
- Compliance issues often require documentation
- References to uploaded documents
- Multiple pieces of evidence per issue
- Could link to documents domain (future)

## Data Model

### Compliance Log
```typescript
{
  id: string (UUID)
  childId: string (UUID, foreign key)
  userId: string (UUID, foreign key)
  issueType: enum
  description: string
  dateIdentified: Date
  status: enum
  severity: enum
  actionTaken?: string
  resolvedDate?: Date
  notes: string
  evidenceFiles: string[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

## Business Rules

### Creation Rules
- User must own the child profile
- Required: childId, issueType, description, dateIdentified, severity
- Status defaults to `open`

### Access Rules
- PARENT/ADVOCATE: Own compliance items only
- ADMIN: All compliance items

### Update Rules
- Can update status, actionTaken, resolvedDate, notes
- Setting status to `resolved` should include `resolvedDate`

## Security Considerations
- Compliance records are sensitive legal documentation
- Audit trail important for due process
- Access restricted to owner and ADMIN

## Dependencies
- ChildProfile model
- User model
- Dashboard (compliance alerts)

## Testing Strategy
- Create/list/update compliance items
- Status workflow transitions
- Severity filtering
- Ownership enforcement
