# Letters API

## Overview
Generate, manage, and track formal letters to schools for IEP-related communications.

---

## POST /letters/generate

Generate a new letter using AI.

**Access**: PARENT, ADVOCATE, ADMIN

**Request Body**:
```json
{
  "childId": "uuid",
  "letterType": "request",
  "subject": "Request for Extended School Year (ESY) Services",
  "recipient": "Dr. Sarah Martinez, Special Education Director",
  "tone": "professional",
  "keywords": ["ESY", "regression", "summer services"],
  "context": "My child showed significant regression during last summer break"
}
```

**Validation**:
- `letterType`: Required, one of `request`, `concern`, `thank_you`, `follow_up`, `complaint`, `appeal`, `other`
- `subject`, `recipient`: Required strings
- `tone`: Optional string
- `childId`: Optional UUID

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "childId": "uuid",
    "letterType": "request",
    "subject": "Request for Extended School Year (ESY) Services",
    "recipient": "Dr. Sarah Martinez, Special Education Director",
    "content": "[AI-generated letter content]",
    "status": "draft",
    "tone": "professional",
    "keywords": ["ESY", "regression", "summer services"],
    "metadata": {
      "generatedBy": "ai",
      "template": "esy-request"
    },
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Letter generated successfully"
}
```

---

## GET /letters

List all letters.

**Access**: PARENT, ADVOCATE, ADMIN (own letters; ADMIN sees all)

**Query Parameters**:
- Standard pagination
- `childId`: Filter by child
- `letterType`: Filter by type
- `status`: Filter by status (draft, final, sent)

---

## GET /letters/:id

Get a specific letter.

**Access**: Owner or ADMIN

---

## PATCH /letters/:id

Update a letter.

**Access**: Owner or ADMIN

**Request Body**:
```json
{
  "content": "[Updated letter content]",
  "status": "final"
}
```

---

## DELETE /letters/:id

Soft delete a letter.

**Access**: Owner or ADMIN

---

## GET /letters/templates

Get available letter templates.

**Access**: PARENT, ADVOCATE, ADMIN

**Response** (200 OK):
```json
{
  "data": {
    "templates": [
      {
        "id": "esy-request",
        "name": "ESY Services Request",
        "description": "Request Extended School Year services",
        "letterType": "request"
      },
      {
        "id": "evaluation-request",
        "name": "Evaluation Request",
        "description": "Request comprehensive evaluation",
        "letterType": "request"
      }
    ]
  }
}
```

---

## Letter Object Schema

```typescript
{
  id: string
  userId: string
  childId?: string
  letterType: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other'
  subject: string
  recipient: string
  content: string
  status: 'draft' | 'final' | 'sent'
  tone?: string
  keywords: string[]
  metadata: object
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

---

## Implementation Notes

### Letter Types
- `request`: Request services, evaluations, meetings
- `concern`: Express concerns about IEP implementation
- `thank_you`: Thank school personnel
- `follow_up`: Follow up on previous communications
- `complaint`: Formal complaints
- `appeal`: Appeal decisions
- `other`: Miscellaneous letters

### Status Workflow
```
draft → final → sent
```

### AI Generation
- Uses LangChain with templates
- Incorporates child context and IEP data
- Professional, legally appropriate language
- Editable by user after generation

---

## Related Endpoints
- See [Children API](../children/api.md)
- See [AI Conversations API](../ai-conversations/api.md)
