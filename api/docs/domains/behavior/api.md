# Behavior API

## Overview
Log and track behavior incidents and patterns for children with behavioral IEP goals.

---

## POST /behaviors

Log a behavior incident.

**Access**: PARENT, ADVOCATE, ADMIN

**Request Body**:
```json
{
  "childId": "uuid",
  "date": "2026-01-09T14:30:00Z",
  "behaviorType": "positive",
  "description": "Shared toys with classmates during free play",
  "context": "Recess time after math lesson",
  "triggers": "N/A - positive behavior",
  "interventions": "Verbal praise from teacher",
  "outcome": "Child smiled and continued positive interactions",
  "severity": null,
  "duration": 15,
  "location": "Playground",
  "witnesses": ["Ms. Johnson", "Playground aide"],
  "tags": ["social-skills", "sharing", "positive"]
}
```

**Validation**:
- `childId`: Required, valid UUID
- `date`: Required, valid datetime
- `behaviorType`: Required, one of `positive`, `negative`, `neutral`
- `description`: Required, text
- `severity`: Optional, integer 1-10 (for negative behaviors)
- `duration`: Optional, integer (minutes)

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "userId": "uuid",
    "date": "2026-01-09T14:30:00Z",
    "behaviorType": "positive",
    "description": "Shared toys with classmates during free play",
    "context": "Recess time after math lesson",
    "severity": null,
    "duration": 15,
    "location": "Playground",
    "witnesses": ["Ms. Johnson", "Playground aide"],
    "tags": ["social-skills", "sharing", "positive"],
    "createdAt": "2026-01-09T15:00:00Z",
    "updatedAt": "2026-01-09T15:00:00Z"
  },
  "message": "Behavior logged successfully"
}
```

---

## GET /behaviors

List all behavior logs.

**Access**: PARENT, ADVOCATE, ADMIN (own logs; ADMIN sees all)

**Query Parameters**:
- Standard pagination
- `childId`: Filter by child
- `behaviorType`: Filter by type
- `startDate`, `endDate`: Date range filter

---

## GET /behaviors/:id

Get a specific behavior log.

**Access**: Owner or ADMIN

---

## PATCH /behaviors/:id

Update a behavior log.

**Access**: Owner or ADMIN

---

## DELETE /behaviors/:id

Soft delete a behavior log.

**Access**: Owner or ADMIN

---

## Behavior Object Schema

```typescript
{
  id: string
  childId: string
  userId: string
  date: string (ISO 8601 datetime)
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
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

---

## Implementation Notes

### Behavior Types
- `positive`: Desired behaviors to reinforce
- `negative`: Problem behaviors to address
- `neutral`: Observational notes

### Severity Scale
- 1-3: Minor
- 4-7: Moderate
- 8-10: Severe (used for negative behaviors)

---

## Related Endpoints
- See [Children API](../children/api.md)
- See [Goals API](../goals/api.md) for behavioral goals
- See [Dashboard API](../dashboard/api.md) for behavior patterns
