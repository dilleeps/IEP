# Advocacy API

## Overview
Manage advocacy scenarios and action timelines for IEP advocacy situations.

---

## POST /advocacy/scenarios

Create a new advocacy scenario.

**Access**: PARENT, ADVOCATE, ADMIN

**Request Body**:
```json
{
  "childId": "uuid",
  "priority": "high",
  "category": "services",
  "title": "Request for additional speech therapy sessions",
  "description": "Current 2x/week speech therapy insufficient for progress",
  "actionItems": [
    "Gather progress data",
    "Request IEP meeting",
    "Prepare parent concerns letter"
  ],
  "status": "active"
}
```

**Validation**:
- `priority`: Required, one of `high`, `medium`, `low`
- `category`: Required, string
- `title`, `description`: Required strings
- `actionItems`: Required, array of strings
- `childId`: Optional UUID

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "childId": "uuid",
    "priority": "high",
    "category": "services",
    "title": "Request for additional speech therapy sessions",
    "description": "Current 2x/week speech therapy insufficient for progress",
    "actionItems": [
      "Gather progress data",
      "Request IEP meeting",
      "Prepare parent concerns letter"
    ],
    "status": "active",
    "acknowledgedAt": null,
    "dismissedAt": null,
    "triggerType": "manual",
    "triggerData": {},
    "aiGenerated": false,
    "aiConfidenceScore": null,
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Advocacy scenario created successfully"
}
```

---

## GET /advocacy/scenarios

List all advocacy scenarios.

**Access**: PARENT, ADVOCATE, ADMIN (own scenarios; ADMIN sees all)

**Query Parameters**:
- Standard pagination
- `childId`: Filter by child
- `priority`: Filter by priority
- `status`: Filter by status (active, acknowledged, acted_upon, dismissed)

---

## GET /advocacy/scenarios/:id

Get a specific scenario.

**Access**: Owner or ADMIN

---

## PATCH /advocacy/scenarios/:id

Update a scenario.

**Access**: Owner or ADMIN

**Request Body**:
```json
{
  "status": "acknowledged",
  "actionItems": [
    "Gather progress data ✓",
    "Request IEP meeting (in progress)",
    "Prepare parent concerns letter"
  ]
}
```

---

## DELETE /advocacy/scenarios/:id

Soft delete a scenario.

**Access**: Owner or ADMIN

---

## POST /advocacy/scenarios/:id/events

Add a timeline event to a scenario.

**Access**: Owner or ADMIN

**Request Body**:
```json
{
  "eventType": "action_taken",
  "description": "Sent email requesting IEP meeting",
  "date": "2026-01-09"
}
```

---

## Advocacy Scenario Object Schema

```typescript
{
  id: string
  userId: string
  childId?: string
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  actionItems: string[]
  status: 'active' | 'acknowledged' | 'acted_upon' | 'dismissed'
  acknowledgedAt?: string
  dismissedAt?: string
  triggerType?: string
  triggerData: object
  aiGenerated: boolean
  aiConfidenceScore?: number
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

---

## Implementation Notes

### AI-Generated Scenarios
- AI can suggest advocacy scenarios based on:
  - Compliance issues
  - Goal progress concerns
  - Communication patterns
- `aiGenerated: true` for AI-suggested scenarios
- `aiConfidenceScore` indicates AI's confidence

### Status Workflow
```
active → acknowledged → acted_upon
      ↓
   dismissed
```

---

## Related Endpoints
- See [Children API](../children/api.md)
- See [AI Conversations API](../ai-conversations/api.md)
- See [Smart Prompts API](../smart-prompts/api.md)
