# Preferences API

## Overview
Manage user preferences for theme, language, timezone, and notification settings.

---

## GET /settings/preferences

Get current user's preferences.

**Access**: PARENT, ADVOCATE, ADMIN (own preferences)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "theme": "dark",
    "language": "en",
    "timezone": "America/New_York",
    "emailNotifications": true,
    "pushNotifications": false,
    "reminderSettings": {
      "iepDeadlines": true,
      "goalReviews": true,
      "followUps": true
    },
    "dashboardLayout": {
      "widgets": ["children", "deadlines", "goals", "resources"]
    },
    "privacySettings": {
      "shareDataForImprovement": false
    },
    "createdAt": "2026-01-01T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  }
}
```

**Note**: Preferences automatically created on first access with defaults.

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

## PATCH /settings/preferences

Update user preferences.

**Access**: PARENT, ADVOCATE, ADMIN (own preferences)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (all fields optional):
```json
{
  "theme": "light",
  "language": "es",
  "timezone": "America/Los_Angeles",
  "emailNotifications": false,
  "reminderSettings": {
    "iepDeadlines": true,
    "goalReviews": false,
    "followUps": true
  }
}
```

**Validation**:
- `theme`: One of `light`, `dark`, `system`
- `language`: Valid language code (en, es, etc.)
- `timezone`: Valid IANA timezone
- Boolean fields: true/false

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "theme": "light",
    "language": "es",
    "timezone": "America/Los_Angeles",
    "emailNotifications": false,
    "reminderSettings": {
      "iepDeadlines": true,
      "goalReviews": false,
      "followUps": true
    },
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "Preferences updated successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Invalid field values

---

## Preferences Object Schema

```typescript
{
  id: string
  userId: string (unique)
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  reminderSettings: object
  dashboardLayout: object
  privacySettings: object
  createdAt: string
  updatedAt: string
}
```

---

## Implementation Notes

### Default Values
- `theme`: 'system'
- `language`: 'en'
- `timezone`: 'UTC'
- `emailNotifications`: true
- `pushNotifications`: true

### Reminder Settings
- `iepDeadlines`: Reminders for IEP review dates
- `goalReviews`: Reminders to review goal progress
- `followUps`: Reminders for communication follow-ups
- `meetings`: Meeting reminders (future)

### Dashboard Layout
- Customizable widget order and visibility
- Future: Drag-and-drop dashboard

### Privacy Settings
- `shareDataForImprovement`: Opt-in for anonymized analytics
- Future: More granular privacy controls

### Future Enhancements
1. **Accessibility**: Font size, contrast settings
2. **Notifications**: Granular notification preferences
3. **Data Export**: Preference export/import
4. **Sync**: Cross-device preference sync

---

## Related Endpoints
- See [User Profile API](../user/api.md) for profile management
- See [Dashboard API](../dashboard/api.md) for dashboard customization
