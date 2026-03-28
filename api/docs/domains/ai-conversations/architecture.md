# AI Conversations Domain - Architecture

## Overview
AI conversations provide LangChain-powered chat interface for IEP guidance. Supports contextual, personalized advice based on user's child data.

## Key Design Decisions

### 1. LangChain Integration
**Decision**: Use LangChain for conversation management and AI orchestration.

**Rationale**:
- Built-in conversation memory
- Easy integration with OpenAI, other LLMs
- Support for document retrieval (RAG)
- Chain multiple AI operations

### 2. Messages in JSONB
**Decision**: Store messages in `conversationData.messages` JSONB array.

**Rationale**:
- Simple implementation for MVP
- Flexible message schema
- No additional joins needed
- Future: Extract to separate table if needed (thousands of messages per conversation)

### 3. Contextual AI
**Decision**: AI has access to child profile, goals, documents via context.

**Rationale**:
- Personalized advice
- References specific child data
- More accurate recommendations
- Better user experience

### 4. Conversation Types
**Decision**: Categorize conversations by type (meeting_prep, legal_qa, etc.).

**Rationale**:
- Different prompts for different scenarios
- Filter conversations by purpose
- Analytics on popular topics
- Customized AI behavior per type

### 5. Active vs. Archived Status
**Decision**: Two status values instead of soft delete.

**Rationale**:
- Users may want to archive old conversations
- Archived conversations still searchable
- Active conversations shown prominently
- Can reactivate archived conversations

## Data Model

### AI Conversation
```typescript
{
  id: string (UUID)
  userId: string (foreign key)
  childId?: string (optional foreign key)
  conversationType: enum
  title: string
  status: 'active' | 'archived'
  messageCount: number
  conversationData: JSONB {
    messages: [
      {
        role: 'user' | 'assistant'
        content: string
        timestamp: Date
      }
    ]
    context?: {
      childAge?: number
      disabilities?: string[]
      goals?: string[]
    }
  }
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

### Database Constraints
- `userId` references users.id with CASCADE delete
- `childId` optional, references child_profiles.id with SET NULL
- `conversationType` validated enum
- `messageCount` defaults to 0

## Business Rules

### Creation Rules
- User can create unlimited conversations
- `messageCount` starts at 0
- `status` defaults to 'active'
- Optional child context

### Message Rules
- Each message has role (user or assistant)
- Messages appended to array
- `messageCount` incremented on each user message
- `updatedAt` updated on new messages

### Context Loading
- AI loads child profile data if `childId` provided
- Includes disabilities, goals, recent documents
- Stored in `conversationData.context` for reference
- Privacy-conscious: No unnecessary data exposure

### Archival Rules
- Users can archive old conversations
- Archived conversations excluded from active list
- Can filter to see archived conversations
- Archiving doesn't delete data

## Security Considerations

### Data Privacy
- Conversations contain user questions (potentially sensitive)
- AI responses may reference child data
- Strict ownership enforcement
- Consider encryption for conversationData

### AI Safety
- Content filtering for inappropriate responses
- Disclaimer: "AI advice is not legal advice"
- Human review for flagged conversations
- Rate limiting on message sending

### Future Enhancements
1. **Conversation Export**: Export to PDF for records
2. **Sharing**: Share conversations with advocates (with consent)
3. **Feedback**: Users rate AI responses
4. **Voice**: Voice input/output
5. **Multimodal**: Image analysis for documents

## Dependencies

### Internal
- User model
- ChildProfile model (optional context)
- GoalProgress, IepDocument (context data)

### External
- LangChain
- OpenAI API (or other LLM)
- Vector database (for document RAG - future)

## Integration Points

- **Children**: Load child context for personalized advice
- **Goals**: Reference goals in AI responses
- **Documents**: Future: RAG over uploaded IEP documents
- **Resources**: AI can recommend relevant resources

## Testing Strategy

### Unit Tests
- Conversation creation
- Message appending
- Context loading
- Status transitions

### Integration Tests
- Create conversation
- Send messages
- AI response generation
- Context-aware responses
- Archive/unarchive
- Ownership enforcement

### AI Quality Tests
- Response relevance
- Factual accuracy
- Appropriate tone
- Context utilization
