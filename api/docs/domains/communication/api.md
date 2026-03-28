# Communication API

## Overview
Log and track communications with schools, teachers, and IEP team members.

---

## POST /communications

Log a new communication.

**Access**: PARENT, ADVOCATE, ADMIN

**Request Body**:
```json
{
  "childId": "uuid",
  "date": "2026-01-09",
  "contactType": "email",
  "contactWith": "Ms. Johnson",
  "contactRole": "Special Education Teacher",
  "subject": "Question about reading accommodations",
  "summary": "Discussed implementation of audio books",
  "outcome": "Teacher will start next week",
  "followUpRequired": true,
  "followUpDate": "2026-01-16",
  "tags": ["accommodations", "reading"]
}
```

**Validation**:
- `childId`: Required, valid UUID
- `date`: Required, valid date
- `contactType`: Required, one of `email`, `phone`, `meeting`, `letter`, `portal`, `other`
- `contactWith`, `subject`, `summary`: Required strings
- `followUpRequired`: Boolean (default false)

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "childId": "uuid",
    "userId": "uuid",
    "date": "2026-01-09",
    "contactType": "email",
    "contactWith": "Ms. Johnson",
    "contactRole": "Special Education Teacher",
    "subject": "Question about reading accommodations",
    "summary": "Discussed implementation of audio books",
    "outcome": "Teacher will start next week",
    "followUpRequired": true,
    "followUpDate": "2026-01-16",
    "attachments": [],
    "tags": ["accommodations", "reading"],
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Communication logged successfully"
}
```

---

## GET /communications

List all communications.

**Access**: PARENT, ADVOCATE, ADMIN (own communications; ADMIN sees all)

**Query Parameters**:
- Standard pagination (page, limit, sortBy, sortOrder)
- `childId`: Filter by child
- `contactType`: Filter by type
- `followUpRequired`: Filter items needing follow-up

---

## GET /communications/:id

Get a specific communication.

**Access**: Owner or ADMIN

---

## PATCH /communications/:id

Update a communication.

**Access**: Owner or ADMIN

---

## DELETE /communications/:id

Soft delete a communication.

**Access**: Owner or ADMIN

---

## Communication Object Schema

```typescript
{
  id: string
  childId: string
  userId: string
  date: string (ISO 8601 date)
  contactType: 'email' | 'phone' | 'meeting' | 'letter' | 'portal' | 'other'
  contactWith: string
  contactRole?: string
  subject: string
  summary: string
  outcome?: string
  followUpRequired: boolean
  followUpDate?: string (ISO 8601 date)
  attachments: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

---

## Related Endpoints
- See [Children API](../children/api.md)
- See [Dashboard API](../dashboard/api.md) for upcoming follow-ups
