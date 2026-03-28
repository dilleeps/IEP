# Config API

## Overview
Read-only public system configuration for dropdowns, feature flags, and constants.

---

## GET /config

Get all active public configuration.

**Access**: PARENT, ADVOCATE, ADMIN (all authenticated users, read-only)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "configurations": [
      {
        "configKey": "disabilities",
        "configType": "dropdown",
        "configValue": ["ADHD", "Autism", "Dyslexia", "Speech/Language", "Other"],
        "description": "Common disability categories"
      },
      {
        "configKey": "us_states",
        "configType": "dropdown",
        "configValue": ["AL", "AK", "AZ", "CA", "..."],
        "description": "US state codes"
      },
      {
        "configKey": "goal_categories",
        "configType": "dropdown",
        "configValue": ["academic", "behavioral", "communication", "social", "adaptive", "motor", "other"],
        "description": "IEP goal categories"
      },
      {
        "configKey": "feature_ai_chat",
        "configType": "feature_flag",
        "configValue": ["enabled"],
        "description": "AI chat feature enabled"
      }
    ]
  }
}
```

**Note**: Only returns active configurations (`isActive: true`).

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

## GET /config/:category

Get configuration by category/key.

**Access**: PARENT, ADVOCATE, ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Example**: `GET /config/disabilities`

**Response** (200 OK):
```json
{
  "data": {
    "configKey": "disabilities",
    "configType": "dropdown",
    "configValue": ["ADHD", "Autism", "Dyslexia", "Speech/Language", "Other"],
    "description": "Common disability categories"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: Configuration not found or inactive

---

## Configuration Object Schema

```typescript
{
  configKey: string
  configType: 'dropdown' | 'setting' | 'feature_flag' | 'constant' | 'other'
  configValue: string[]
  description?: string
  isActive: boolean
  metadata: object
}
```

---

## Implementation Notes

### Configuration Types

#### Dropdown Options
- `disabilities`: Disability categories
- `us_states`: US state codes
- `goal_categories`: Goal categories
- `contact_types`: Communication contact types
- `document_types`: Document types
- `behavior_types`: Behavior types
- `letter_types`: Letter types

#### Feature Flags
- `feature_ai_chat`: AI chat enabled/disabled
- `feature_advocacy_insights`: Advocacy insights
- `feature_document_analysis`: AI document analysis
- `feature_letter_generation`: AI letter generation

#### Settings
- `max_file_upload_size`: Maximum file size (MB)
- `max_children_per_user`: Max children per parent
- `session_timeout`: Session timeout (minutes)

#### Constants
- `app_version`: Current app version
- `support_email`: Support contact email
- `api_version`: API version

### Read-Only Access
- All authenticated users can read config
- Config provides values for dropdowns, validation
- Only ADMIN can modify (see [Admin Config API](../admin-config/api.md))

### Caching
- Config data changes infrequently
- Cache aggressively (TTL: 1 hour)
- Invalidate cache on admin updates

### Future Enhancements
1. **Localization**: Multi-language config values
2. **User Overrides**: User-specific config (preferences)
3. **Versioning**: Track config changes over time
4. **A/B Testing**: Feature flag variations

---

## Related Endpoints
- See [Admin Config API](../admin-config/api.md) for CRUD operations
- See [Preferences API](../preferences/api.md) for user-specific settings
