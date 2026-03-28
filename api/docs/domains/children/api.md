# Children API

## Overview
Manage child profiles for parents, advocates, and admins. Each user can have multiple child profiles containing IEP-related information, school details, and advocacy context.

---

## POST /children

Create a new child profile.

**Access**: PARENT, ADVOCATE, ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "name": "John Doe",
  "dateOfBirth": "2015-03-15",
  "age": 8,
  "grade": "3rd Grade",
  "schoolName": "Lincoln Elementary",
  "schoolDistrict": "Springfield District",
  "disabilities": ["ADHD", "Dyslexia"],
  "focusTags": ["reading", "attention", "social skills"],
  "lastIepDate": "2025-09-01",
  "nextIepReviewDate": "2026-09-01",
  "advocacyLevel": "Beginner",
  "advocacyBio": "New to IEP process",
  "primaryGoal": "Improve reading comprehension",
  "stateContext": "California",
  "reminderPreferences": {
    "meetingReminders": true,
    "progressReports": true
  }
}
```

**Validation**:
- `name`: Required, 1-255 characters
- `dateOfBirth`: Optional, valid date
- `age`: Optional, integer
- `grade`: Optional, 1-50 characters
- `schoolName`: Optional, 1-255 characters
- `schoolDistrict`: Optional, 1-255 characters
- `disabilities`: Optional, array of strings
- `focusTags`: Optional, array of strings
- `advocacyLevel`: Optional, one of `Beginner`, `Intermediate`, `Advanced`
- `lastIepDate`, `nextIepReviewDate`: Optional, valid dates
- `reminderPreferences`: Optional, JSON object

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "John Doe",
    "dateOfBirth": "2015-03-15",
    "age": 8,
    "grade": "3rd Grade",
    "schoolName": "Lincoln Elementary",
    "schoolDistrict": "Springfield District",
    "disabilities": ["ADHD", "Dyslexia"],
    "focusTags": ["reading", "attention", "social skills"],
    "lastIepDate": "2025-09-01",
    "nextIepReviewDate": "2026-09-01",
    "advocacyLevel": "Beginner",
    "advocacyBio": "New to IEP process",
    "primaryGoal": "Improve reading comprehension",
    "stateContext": "California",
    "isActive": true,
    "reminderPreferences": {
      "meetingReminders": true,
      "progressReports": true
    },
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Child profile created successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Validation errors

---

## GET /children

List all child profiles for the authenticated user.

**Access**: PARENT, ADVOCATE, ADMIN (own children; ADMIN sees all)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (default: `createdAt`)
- `sortOrder` (optional): `asc` or `desc` (default: `desc`)
- `isActive` (optional): Filter by active status (true/false)

**Response** (200 OK):
```json
{
  "data": {
    "children": [
      {
        "id": "uuid",
        "userId": "uuid",
        "name": "John Doe",
        "dateOfBirth": "2015-03-15",
        "age": 8,
        "grade": "3rd Grade",
        "schoolName": "Lincoln Elementary",
        "schoolDistrict": "Springfield District",
        "disabilities": ["ADHD", "Dyslexia"],
        "focusTags": ["reading", "attention", "social skills"],
        "lastIepDate": "2025-09-01",
        "nextIepReviewDate": "2026-09-01",
        "advocacyLevel": "Beginner",
        "isActive": true,
        "createdAt": "2026-01-09T12:00:00Z",
        "updatedAt": "2026-01-09T12:00:00Z"
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

## GET /children/:id

Get a specific child profile by ID.

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
    "userId": "uuid",
    "name": "John Doe",
    "dateOfBirth": "2015-03-15",
    "age": 8,
    "grade": "3rd Grade",
    "schoolName": "Lincoln Elementary",
    "schoolDistrict": "Springfield District",
    "disabilities": ["ADHD", "Dyslexia"],
    "focusTags": ["reading", "attention", "social skills"],
    "lastIepDate": "2025-09-01",
    "nextIepReviewDate": "2026-09-01",
    "advocacyLevel": "Beginner",
    "advocacyBio": "New to IEP process",
    "primaryGoal": "Improve reading comprehension",
    "stateContext": "California",
    "isActive": true,
    "reminderPreferences": {
      "meetingReminders": true,
      "progressReports": true
    },
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  }
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Child profile not found

---

## PATCH /children/:id

Update a child profile.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (all fields optional):
```json
{
  "name": "John Smith",
  "age": 9,
  "grade": "4th Grade",
  "disabilities": ["ADHD", "Dyslexia", "Anxiety"],
  "nextIepReviewDate": "2027-01-15",
  "isActive": true
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "name": "John Smith",
    "age": 9,
    "grade": "4th Grade",
    "disabilities": ["ADHD", "Dyslexia", "Anxiety"],
    "nextIepReviewDate": "2027-01-15",
    "isActive": true,
    "updatedAt": "2026-01-09T13:00:00Z"
  },
  "message": "Child profile updated successfully"
}
```

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Child profile not found
- `400 Bad Request`: Validation errors

---

## DELETE /children/:id

Soft delete a child profile.

**Access**: Owner or ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Child profile deleted successfully"
}
```

**Note**: This is a soft delete (sets `deletedAt` timestamp). Related data (goals, documents, etc.) are preserved but marked as deleted.

**Errors**:
- `401 Unauthorized`: Invalid or missing token
- `403 Forbidden`: Not the owner or admin
- `404 Not Found`: Child profile not found

---

## Child Profile Object Schema

```typescript
{
  id: string                          // UUID
  userId: string                      // Owner's user ID
  name: string                        // Child's name
  dateOfBirth?: string                // ISO 8601 date
  age?: number                        // Child's age
  grade?: string                      // Current grade
  schoolName?: string                 // School name
  schoolDistrict?: string             // School district
  disabilities: string[]              // List of disabilities
  focusTags: string[]                 // Areas of focus
  lastIepDate?: string                // Last IEP date (ISO 8601)
  nextIepReviewDate?: string          // Next review date (ISO 8601)
  advocacyLevel?: string              // Beginner | Intermediate | Advanced
  advocacyBio?: string                // Parent's advocacy experience
  primaryGoal?: string                // Primary goal for child
  stateContext?: string               // US state for legal context
  isActive: boolean                   // Active status
  reminderPreferences: object         // Notification preferences
  createdAt: string                   // ISO 8601 datetime
  updatedAt: string                   // ISO 8601 datetime
  deletedAt?: string                  // ISO 8601 datetime (soft delete)
}
```

---

## Implementation Notes

### Ownership Rules
- PARENT/ADVOCATE: Can only manage their own children
- ADMIN: Can view/manage all children across all users

### Soft Deletes
- Child profiles are soft deleted (not permanently removed)
- Related data (goals, documents) cascade soft delete

### Future Enhancements
1. **Photo Upload**: Add child profile pictures
2. **Document Attachment**: Quick links to related IEP documents
3. **History Tracking**: Audit log of profile changes
4. **Sharing**: Allow advocates to be granted access to child profiles
5. **Export**: Export child profile to PDF

### Related Endpoints
- See [Documents API](../documents/api.md) for document management
- See [Goals API](../goals/api.md) for goal tracking
- See [Dashboard API](../dashboard/api.md) for child summaries
