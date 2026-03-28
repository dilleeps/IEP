# Goals API

## Overview
Track IEP goals and milestones for children. Supports progress monitoring, status updates, and milestone management.

---

## POST /goals

Create a new IEP goal.

**Access**: PARENT, ADVOCATE, ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "childId": "uuid",
  "goalText": "Increase reading comprehension from 40% to 80% accuracy on grade-level passages",
  "category": "academic",
  "targetDate": "2026-06-15",
  "status": "in_progress",
  "progressPercentage": 45,
  "notes": "Making steady progress with daily practice"
}
```

**Validation**:
- `childId`: Required, valid UUID, must be owned by user
- `goalText`: Required, text
- `category`: Required, one of `academic`, `behavioral`, `communication`, `social`, `adaptive`, `motor`, `other`
- `targetDate`: Optional, valid date
- `status`: Optional, defaults to `not_started`
- `progressPercentage`: Optional, 0-100
- `notes`: Optional, text

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "userId": "uuid",
    "goalText": "Increase reading comprehension from 40% to 80% accuracy on grade-level passages",
    "category": "academic",
    "targetDate": "2026-06-15",
    "status": "in_progress",
    "progressPercentage": 45,
    "notes": "Making steady progress with daily practice",
    "milestonesData": {},
    "lastUpdated": "2026-01-09T12:00:00Z",
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Goal created successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Validation errors
- `403 Forbidden`: Child not owned by user

---

## GET /goals

List all goals for the authenticated user.

**Access**: PARENT, ADVOCATE, ADMIN (own goals; ADMIN sees all)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (default: `lastUpdated`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `childId` (optional): Filter by child ID
- `category` (optional): Filter by category
- `status` (optional): Filter by status

**Response** (200 OK):
```json
{
  "data": {
    "goals": [
      {
        "id": "uuid",
        "childId": "uuid",
        "userId": "uuid",
        "goalText": "Increase reading comprehension from 40% to 80% accuracy",
        "category": "academic",
        "targetDate": "2026-06-15",
        "status": "in_progress",
        "progressPercentage": 45,
        "notes": "Making steady progress",
        "lastUpdated": "2026-01-09T12:00:00Z",
        "createdAt": "2026-01-09T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token

---

## GET /goals/:id

Get a specific goal by ID.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "userId": "uuid",
    "goalText": "Increase reading comprehension from 40% to 80% accuracy on grade-level passages",
    "category": "academic",
    "targetDate": "2026-06-15",
    "status": "in_progress",
    "progressPercentage": 45,
    "notes": "Making steady progress with daily practice",
    "milestonesData": {
      "milestones": [
        {
          "id": "m1",
          "description": "Achieve 50% accuracy",
          "targetDate": "2026-03-01",
          "completed": true,
          "completedDate": "2026-02-28"
        }
      ]
    },
    "lastUpdated": "2026-01-09T12:00:00Z",
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:05:00Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Goal not found

---

## PATCH /goals/:id

Update a goal.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (all fields optional):
```json
{
  "status": "achieved",
  "progressPercentage": 100,
  "notes": "Goal successfully achieved ahead of target date!"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "status": "achieved",
    "progressPercentage": 100,
    "notes": "Goal successfully achieved ahead of target date!",
    "lastUpdated": "2026-01-09T13:00:00Z",
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "Goal updated successfully"
}
```

**Note**: `lastUpdated` automatically set to current timestamp on update.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Goal not found
- `400 Bad Request`: Validation errors

---

## DELETE /goals/:id

Soft delete a goal.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Goal deleted successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Goal not found

---

## POST /goals/:id/milestones

Add a milestone to a goal.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "description": "Achieve 70% accuracy",
  "targetDate": "2026-05-01"
}
```

**Response** (201 Created):
```json
{
  "data": {
    "milestone": {
      "id": "m2",
      "description": "Achieve 70% accuracy",
      "targetDate": "2026-05-01",
      "completed": false
    }
  },
  "message": "Milestone added successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Goal not found
- `400 Bad Request`: Validation errors

---

## PATCH /goals/:goalId/milestones/:milestoneId

Update a milestone.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "completed": true,
  "completedDate": "2026-04-25"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "milestone": {
      "id": "m2",
      "description": "Achieve 70% accuracy",
      "targetDate": "2026-05-01",
      "completed": true,
      "completedDate": "2026-04-25"
    }
  },
  "message": "Milestone updated successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Goal or milestone not found
- `400 Bad Request`: Validation errors

---

## Goal Object Schema

```typescript
{
  id: string                          // UUID
  childId: string                     // Associated child ID
  userId: string                      // Owner's user ID
  goalText: string                    // Goal description
  category: string                    // academic | behavioral | communication | social | adaptive | motor | other
  targetDate?: string                 // ISO 8601 date
  status: string                      // not_started | in_progress | achieved | modified | discontinued
  progressPercentage?: number         // 0-100
  notes: string                       // Progress notes
  milestonesData: object              // JSONB with milestones array
  lastUpdated: string                 // ISO 8601 datetime
  createdAt: string                   // ISO 8601 datetime
  updatedAt: string                   // ISO 8601 datetime
  deletedAt?: string                  // ISO 8601 datetime (soft delete)
}
```

---

## Implementation Notes

### Goal Categories
- `academic`: Reading, writing, math skills
- `behavioral`: Behavior management
- `communication`: Speech, language
- `social`: Social skills, peer interaction
- `adaptive`: Daily living skills
- `motor`: Fine/gross motor skills
- `other`: Miscellaneous goals

### Goal Status
- `not_started`: Goal defined but not yet started
- `in_progress`: Actively working on goal
- `achieved`: Goal successfully met
- `modified`: Goal adjusted or revised
- `discontinued`: Goal no longer pursued

### Milestones
- Stored in `milestonesData` JSONB field
- Each milestone has: `id`, `description`, `targetDate`, `completed`, `completedDate`
- Milestones tracked within goal progress

### Future Enhancements
1. **Progress Charts**: Visualize progress over time
2. **Reminders**: Notifications for target dates
3. **Templates**: Pre-defined goal templates
4. **Baseline Data**: Track starting point data
5. **Evidence Collection**: Link documents/photos as evidence

### Related Endpoints
- See [Children API](../children/api.md) for child management
- See [Documents API](../documents/api.md) for supporting documentation
- See [Dashboard API](../dashboard/api.md) for goal summaries
