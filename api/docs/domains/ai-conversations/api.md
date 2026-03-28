# AI Conversations API

## Overview
LangChain-powered AI conversations for IEP help, legal Q&A, meeting prep, and advocacy advice.

---

## POST /ai/conversations

Start a new AI conversation.

**Access**: PARENT, ADVOCATE, ADMIN

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "childId": "uuid",
  "conversationType": "meeting_prep",
  "title": "Preparing for upcoming IEP meeting"
}
```

**Validation**:
- `conversationType`: Required, one of `iep_help`, `legal_qa`, `meeting_prep`, `advocacy_advice`, `general`, `other`
- `title`: Required, string
- `childId`: Optional UUID

**Response** (201 Created):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "childId": "uuid",
    "conversationType": "meeting_prep",
    "title": "Preparing for upcoming IEP meeting",
    "status": "active",
    "messageCount": 0,
    "conversationData": {},
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:00Z"
  },
  "message": "Conversation started"
}
```

---

## GET /ai/conversations

List all conversations.

**Access**: PARENT, ADVOCATE, ADMIN (own conversations; ADMIN sees all)

**Query Parameters**:
- Standard pagination
- `childId`: Filter by child
- `conversationType`: Filter by type
- `status`: Filter by status (active, archived)

**Response** (200 OK):
```json
{
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "userId": "uuid",
        "childId": "uuid",
        "conversationType": "meeting_prep",
        "title": "Preparing for upcoming IEP meeting",
        "status": "active",
        "messageCount": 15,
        "createdAt": "2026-01-09T12:00:00Z",
        "updatedAt": "2026-01-09T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

## GET /ai/conversations/:id

Get a specific conversation with message history.

**Access**: Owner or ADMIN

**Response** (200 OK):
```json
{
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "childId": "uuid",
    "conversationType": "meeting_prep",
    "title": "Preparing for upcoming IEP meeting",
    "status": "active",
    "messageCount": 2,
    "conversationData": {
      "messages": [
        {
          "role": "user",
          "content": "What should I ask at the IEP meeting?",
          "timestamp": "2026-01-09T12:00:00Z"
        },
        {
          "role": "assistant",
          "content": "Here are key questions to ask...",
          "timestamp": "2026-01-09T12:00:05Z"
        }
      ],
      "context": {
        "childAge": 8,
        "disabilities": ["ADHD", "Dyslexia"],
        "goals": ["reading comprehension"]
      }
    },
    "createdAt": "2026-01-09T12:00:00Z",
    "updatedAt": "2026-01-09T12:00:05Z"
  }
}
```

---

## POST /ai/conversations/:id/messages

Send a message to the AI conversation.

**Access**: Owner or ADMIN

**Request Body**:
```json
{
  "message": "What accommodations should I request for reading?"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "userMessage": {
      "role": "user",
      "content": "What accommodations should I request for reading?",
      "timestamp": "2026-01-09T12:05:00Z"
    },
    "assistantMessage": {
      "role": "assistant",
      "content": "Based on your child's dyslexia diagnosis, consider...",
      "timestamp": "2026-01-09T12:05:03Z"
    }
  },
  "message": "Message sent"
}
```

---

## PATCH /ai/conversations/:id

Update conversation (e.g., archive).

**Access**: Owner or ADMIN

**Request Body**:
```json
{
  "status": "archived",
  "title": "Archived: IEP Meeting Prep 2026"
}
```

---

## DELETE /ai/conversations/:id

Soft delete a conversation.

**Access**: Owner or ADMIN

---

## Conversation Object Schema

```typescript
{
  id: string
  userId: string
  childId?: string
  conversationType: 'iep_help' | 'legal_qa' | 'meeting_prep' | 'advocacy_advice' | 'general' | 'other'
  title: string
  status: 'active' | 'archived'
  messageCount: number
  conversationData: {
    messages: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: string
    }>
    context?: object
  }
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

---

## Implementation Notes

### Conversation Types
- `iep_help`: General IEP questions
- `legal_qa`: Legal questions about IDEA, rights
- `meeting_prep`: Prepare for IEP meetings
- `advocacy_advice`: Advocacy strategies
- `general`: General special education questions
- `other`: Other topics

### AI Context
- AI has access to user's child profiles
- Can reference goals, documents, compliance issues
- Personalized advice based on child context
- LangChain memory for conversation continuity

### Message Storage
- Messages stored in `conversationData.messages` array
- JSONB field for flexibility
- Consider moving to separate `messages` table if conversations grow large

### Future Enhancements
1. **Voice Input**: Speech-to-text for messages
2. **Document Upload**: Upload documents for AI analysis
3. **Suggested Questions**: AI suggests follow-up questions
4. **Export**: Export conversation to PDF
5. **Sharing**: Share conversations with advocates

---

## Related Endpoints
- See [Children API](../children/api.md)
- See [Goals API](../goals/api.md)
- See [Documents API](../documents/api.md)
