# Smart Prompts API

## Overview
Contextual prompts and notifications for parents navigating the IEP process. AI-generated guidance based on user activity.

---

## GET /smart-prompts

Get active smart prompts for the authenticated user.

**Access**: PARENT, ADMIN (not ADVOCATE)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `priority`: Filter by priority (low, medium, high, urgent)
- `category`: Filter by category (iep, behavior, communication, compliance, advocacy, general)
- `acknowledged`: Filter by acknowledgment status (true/false)

**Response** (200 OK):
```json
{
  "data": {
    "prompts": [
      {
        "id": "uuid",
        "userId": "uuid",
        "childId": "uuid",
        "promptType": "meeting_reminder",
        "category": "iep",
        "priority": "high",
        "title": "IEP Meeting Approaching",
        "message": "John's IEP review is in 14 days. Start preparing questions and reviewing goals.",
        "actionable": true,
        "actionUrl": "/children/uuid/goals",
        "actionLabel": "Review Goals",
        "contextData": {
          "childName": "John Doe",
          "meetingDate": "2026-03-15",
          "daysUntil": 14
        },
        "acknowledged": false,
        "expiresAt": "2026-03-15T23:59:59Z",
        "createdAt": "2026-01-09T12:00:00Z"
      },
      {
        "id": "uuid",
        "userId": "uuid",
        "childId": null,
        "promptType": "advocacy_tip",
        "category": "advocacy",
        "priority": "medium",
        "title": "Document Everything",
        "message": "Remember to log all communications with the school. This creates a paper trail.",
        "actionable": true,
        "actionUrl": "/communications/new",
        "actionLabel": "Log Communication",
        "acknowledged": false,
        "createdAt": "2026-01-09T11:00:00Z"
      }
    ]
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: User role is ADVOCATE (not allowed)

---

## POST /smart-prompts/:id/acknowledge

Acknowledge a smart prompt (mark as read).

**Access**: PARENT, ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "acknowledged": true,
    "acknowledgedAt": "2026-01-09T12:30:00Z"
  },
  "message": "Prompt acknowledged"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or ADVOCATE role
- `404 Not Found`: Prompt not found

---

## Smart Prompt Object Schema

```typescript
{
  id: string
  userId: string
  childId?: string
  promptType: 'meeting_reminder' | 'document_missing' | 'goal_review' | 'compliance_alert' | 'advocacy_tip' | 'resource_suggestion'
  category: 'iep' | 'behavior' | 'communication' | 'compliance' | 'advocacy' | 'general'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  actionable: boolean
  actionUrl?: string
  actionLabel?: string
  contextData: object
  acknowledged: boolean
  acknowledgedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

---

## Implementation Notes

### PARENT-Only Feature
- Smart prompts are designed for parents new to IEP process
- Advocates are professionals and don't need prompts
- ADMIN can see all prompts for support purposes

### Prompt Types
- `meeting_reminder`: Upcoming IEP meetings
- `document_missing`: No documents uploaded for child
- `goal_review`: Time to review goal progress
- `compliance_alert`: Compliance deadline approaching
- `advocacy_tip`: General advocacy guidance
- `resource_suggestion`: Relevant resource recommendations

### Priority Levels
- `urgent`: Immediate action needed (< 7 days)
- `high`: Important, act soon (7-14 days)
- `medium`: Moderate priority
- `low`: Informational, no urgency

### Actionable Prompts
- `actionable: true` means prompt has associated action
- `actionUrl`: Link to relevant page
- `actionLabel`: Button text (e.g., "Review Goals")
- Non-actionable prompts are informational tips

### Expiration
- Time-sensitive prompts have `expiresAt`
- Expired prompts automatically hidden
- Meeting reminders expire after meeting date

### Context Data
- `contextData` contains variables for prompt personalization
- Child name, dates, specific data
- Used for rendering dynamic content

### AI Generation
- Smart prompts can be AI-generated based on:
  - User activity patterns
  - Upcoming deadlines
  - Missing data (e.g., no goals for child)
  - Compliance issues
- System also generates scheduled prompts (cron jobs)

### Future Enhancements
1. **Frequency Control**: User controls prompt frequency
2. **Categories**: Filter by category
3. **Snooze**: Snooze prompts for later
4. **Custom Prompts**: Users create own reminders
5. **Push Notifications**: Mobile push notifications

---

## Related Endpoints
- See [Children API](../children/api.md)
- See [Dashboard API](../dashboard/api.md) for prompt summary
- See [Preferences API](../preferences/api.md) for notification settings
