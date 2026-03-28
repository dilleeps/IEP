# Dashboard API

## Overview
Get aggregated summary data for the user's dashboard, including children count, upcoming deadlines, recent activity, and system statistics.

---

## GET /dashboard/summary

Get dashboard summary for the authenticated user.

**Access**: PARENT, ADVOCATE, ADMIN (own data; ADMIN sees system-wide)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "childrenCount": 2,
    "upcomingDeadlines": [
      {
        "type": "iep_review",
        "childName": "John Doe",
        "date": "2026-03-15",
        "daysUntil": 65
      },
      {
        "type": "follow_up",
        "subject": "Speech therapy hours",
        "date": "2026-01-16",
        "daysUntil": 7
      }
    ],
    "advocacyAlerts": [
      {
        "id": "uuid",
        "priority": "high",
        "title": "Request additional speech therapy",
        "category": "services"
      }
    ],
    "recentActivity": [
      {
        "type": "goal_updated",
        "childName": "John Doe",
        "description": "Reading comprehension goal progress: 45% → 55%",
        "timestamp": "2026-01-08T14:30:00Z"
      },
      {
        "type": "document_uploaded",
        "childName": "Jane Doe",
        "description": "Progress report uploaded",
        "timestamp": "2026-01-07T10:15:00Z"
      }
    ],
    "stats": {
      "activeGoals": 8,
      "documentsUploaded": 15,
      "communicationsLogged": 23,
      "behaviorIncidents": 12
    }
  }
}
```

**For ADMIN users**:
```json
{
  "data": {
    "systemStats": {
      "totalUsers": 1250,
      "activeUsers": 980,
      "pendingApprovals": 15,
      "totalChildren": 1580,
      "resourceViews": 45230
    },
    "recentActivity": [
      {
        "type": "user_registered",
        "email": "new.user@example.com",
        "role": "PARENT",
        "timestamp": "2026-01-09T11:00:00Z"
      }
    ]
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

## Dashboard Summary Schema

```typescript
{
  // For PARENT/ADVOCATE
  childrenCount: number
  upcomingDeadlines: Array<{
    type: string
    childName?: string
    subject?: string
    date: string
    daysUntil: number
  }>
  advocacyAlerts: Array<{
    id: string
    priority: string
    title: string
    category: string
  }>
  recentActivity: Array<{
    type: string
    childName?: string
    description: string
    timestamp: string
  }>
  stats: {
    activeGoals: number
    documentsUploaded: number
    communicationsLogged: number
    behaviorIncidents: number
  }

  // For ADMIN (additional fields)
  systemStats?: {
    totalUsers: number
    activeUsers: number
    pendingApprovals: number
    totalChildren: number
    resourceViews: number
  }
}
```

---

## Implementation Notes

### Deadline Sources
- IEP review dates from child profiles
- Follow-up dates from communications
- Compliance deadlines
- Goal target dates

### Recent Activity Types
- `goal_updated`: Goal progress change
- `goal_achieved`: Goal marked as achieved
- `document_uploaded`: New document added
- `communication_logged`: New communication entry
- `behavior_logged`: Behavior incident
- `letter_generated`: Letter created
- `advocacy_scenario`: New advocacy scenario
- `user_registered` (ADMIN): New user signup
- `user_approved` (ADMIN): User approved

### ADMIN Dashboard
- System-wide statistics
- Pending user approvals
- Resource usage metrics
- Recent user activity

### Performance Considerations
- Dashboard queries aggregate across multiple tables
- Consider caching for frequently accessed data
- Limit recent activity to last 30 days
- Paginate if needed (future)

### Future Enhancements
1. **Widgets**: Customizable dashboard widgets (from preferences)
2. **Charts**: Visual charts for goal progress, behavior patterns
3. **Filters**: Date range filters for activity
4. **Favorites**: Pin favorite children/goals to dashboard
5. **Quick Actions**: Common actions from dashboard

---

## Related Endpoints
- See [Children API](../children/api.md)
- See [Goals API](../goals/api.md)
- See [Compliance API](../compliance/api.md)
- See [Advocacy API](../advocacy/api.md)
- See [Preferences API](../preferences/api.md) for dashboard layout
