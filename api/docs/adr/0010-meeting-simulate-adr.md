# ADR 0010: Advocacy Lab Meeting Simulation API

## Status
Implemented - 2026-02-04

## Context
The Advocacy Lab is an interactive AI-powered chatbot that helps parents and advocates practice and refine their advocacy skills through simulated IEP meeting scenarios. Parents need a safe environment to rehearse difficult conversations, receive real-time coaching with legal frameworks, and build confidence before actual meetings with schools.

## Requirements

### User Experience Goals
- **Safe Practice Environment**: Allow parents to practice advocacy without real-world consequences
- **Immediate Feedback**: Provide coaching on approach, legal grounding, and communication effectiveness
- **Quick Access**: Offer pre-defined prompts for common advocacy statements
- **Conversational Flow**: Natural back-and-forth simulation of school administrator responses
- **Legal Education**: Reference IDEA, Section 504, FAPE, and LRE principles through practice

### Functional Requirements
1. **Role-play Scenarios**: AI acts as school personnel (principal, special ed coordinator, teacher)
2. **Coaching Feedback**: After each exchange, provide constructive feedback on parent's approach
3. **Quick Prompts**: Pre-defined advocacy statements users can select
4. **Session Management**: Create, persist, retrieve, and delete practice sessions
5. **Multiple Scenarios**: Support IEP meetings, school team meetings, dispute resolution

## Design Decisions

### API Architecture
We integrated meeting simulation into the existing **advocacy module** rather than creating a new module because:
- Advocacy insights and meeting practice are conceptually related
- Reuses existing authentication and authorization middleware
- Leverages the same AI service infrastructure
- Maintains clean separation of concerns within the advocacy domain

### Endpoints

#### 1. Simple Meeting Simulation (Stateless)
```
POST /api/advocacy/simulate-meeting
Body: { userMessage: string, childContext: string }
Response: { response: string }
```
- Quick, stateless simulation without session management
- Ideal for one-off practice scenarios
- Returns AI response with coaching feedback inline

#### 2. Session-Based Practice (Stateful)
```
POST /api/advocacy/sessions
Body: { scenarioType: string, goal: string, childId: string }
Response: { session: { id, scenarioType, goal, messages, status } }

POST /api/advocacy/sessions/:sessionId/messages
Body: { message: string, childContext: string }
Response: { response: { role, content, timestamp } }

GET /api/advocacy/sessions/:sessionId
Response: { session: { id, scenarioType, goal, messages, status } }

DELETE /api/advocacy/sessions/:sessionId
Response: 204 No Content
```
- Persistent practice sessions across multiple exchanges
- Track conversation history
- Support scenario switching and goal tracking

#### 3. Quick Prompts Library
```
GET /api/advocacy/prompts
Response: { prompts: string[] }
```
- Pre-defined advocacy statements for quick access
- Examples: "I disagree with this placement", "Can we request an IEE?", "I want to see the data"

### AI Prompt Design

#### System Prompt
```
You are a school administrator role-playing in an IEP meeting simulation.
Your job is to respond realistically to the parent's advocacy statements,
then provide coaching feedback.

After your response as the school admin, add a "Coach Note:" section that:
- Evaluates the parent's approach (tone, specificity, legal grounding)
- Suggests improvements or stronger phrasing
- References relevant legal frameworks (IDEA, FAPE, Section 504, LRE)
- Encourages continued practice
```

#### Response Format
```
[School Administrator Response]
"While I understand your concerns, we believe the current placement
is appropriate for [Child Name]'s needs..."

Coach Note:
Good start! You clearly stated your disagreement. To strengthen this:
- Be more specific about what data concerns you
- Reference FAPE (Free Appropriate Public Education) explicitly
- Ask to see the evaluation data that supports their placement decision

Try: "I appreciate the team's effort, but I'm not convinced this placement
offers FAPE for [Child]. Can we review the evaluation data that led to this
recommendation? I'd like to understand how this addresses [specific need]."
```

## Implementation

### Service Layer
**File**: `src/modules/advocacy/advocacy.service.ts`

```typescript
async simulateMeeting(userMessage: string, childContext: string): Promise<string> {
  const systemPrompt = `You are a school administrator role-playing...`;
  const prompt = `Child Context: ${childContext}\n\nParent's Statement: "${userMessage}"`;
  
  const response = await langchainAi.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
  });
  
  return response;
}
```

### Controller Layer
**File**: `src/modules/advocacy/advocacy.controller.ts`

Added endpoints:
- `simulateMeeting`: Stateless simulation
- `createSession`: Initialize new practice session
- `sendMessage`: Send message within session
- `getSession`: Retrieve session details
- `deleteSession`: Remove session
- `getQuickPrompts`: Get advocacy prompt library

### Routes Layer
**File**: `src/modules/advocacy/advocacy.routes.ts`

```typescript
router.post('/simulate-meeting', controller.simulateMeeting);
router.post('/sessions', controller.createSession);
router.post('/sessions/:sessionId/messages', controller.sendMessage);
router.get('/sessions/:sessionId', controller.getSession);
router.delete('/sessions/:sessionId', controller.deleteSession);
router.get('/prompts', controller.getQuickPrompts);
```

## Data Flow

### Stateless Simulation
```
User Input → API → AI Service → Response with Coaching
                                  ↓
                          Return to User (no persistence)
```

### Session-Based Practice
```
1. Create Session → Generate Session ID → Store Initial Message
2. User Message → Append to Session → AI Response → Store Both
3. Repeat Step 2 for continued practice
4. Delete Session → Clear history (or keep for analytics)
```

## Quick Prompts Library

Pre-defined statements parents can use:
1. "I disagree with this placement."
2. "Can we request an IEE?"
3. "I want to see the data."
4. "Is this a FAPE violation?"
5. "I need 1:1 aide support."
6. "This goal is too vague."
7. "What accommodations are available?"
8. "Can we add more speech therapy hours?"
9. "I want this documented in writing."
10. "When can we schedule a follow-up meeting?"

## Privacy & Security

### In-Memory Session Storage (No Persistence)
- **Memory Storage**: All sessions stored in-memory on the server (not in database)
- **Session Lifecycle**: Sessions exist only while server is running
- **Automatic Cleanup**: Sessions cleared on server restart or after 30 minutes of inactivity
- **No Long-Term Persistence**: Practice conversations are ephemeral by design
- **Privacy-First**: No conversation history stored permanently
- **Data Structure**: Map<sessionId, { userId, childId, scenarioType, goal, messages, lastActivity }>

**Rationale**: 
- Practice sessions are meant to be temporary and private
- No need to review old practice conversations
- Reduces data storage and privacy concerns
- Simpler implementation without database overhead
- Users can restart sessions anytime for fresh practice

### Authentication & Authorization
- All endpoints require authentication via JWT
- Session ownership verified on all operations (retrieve, update, delete)
- User ID embedded in session metadata
- Child ID validates against user's accessible children

## Testing Strategy

### Manual Testing
```bash
# Test stateless simulation
curl -X POST http://localhost:3000/api/advocacy/simulate-meeting \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "I want more speech therapy hours", "childContext": "5yo with speech delays"}'

# Test session creation
curl -X POST http://localhost:3000/api/advocacy/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenarioType": "iep_meeting", "goal": "Refine Legal Negotiation", "childId": "child-123"}'

# Test quick prompts
curl -X GET http://localhost:3000/api/advocacy/prompts \
  -H "Authorization: Bearer $TOKEN"
```

### Integration Tests
- Verify AI response format includes coaching notes
- Test session CRUD operations
- Validate authentication and authorization
- Check error handling for invalid scenarios

## Future Enhancements

### Phase 1 (Current MVP)
- ✅ Stateless meeting simulation
- ✅ In-memory session management
- ✅ Quick prompts library
- ✅ AI coaching with legal frameworks
- ✅ Automatic session cleanup (30 min inactivity)

### Phase 2
- [ ] Optional database persistence (if users request conversation history)
- [ ] Multi-party scenarios (multiple school personnel)
- [ ] Voice input/output for verbal practice
- [ ] Session export (PDF transcript)

### Phase 3
- [ ] Progress analytics (track skill improvement)
- [ ] Real IEP data integration (pull child's actual IEP)
- [ ] Scenario library expansion (504 plans, dispute resolution)
- [ ] Expert review (share anonymized sessions with advocates)

### Phase 4
- [ ] Video simulation (AI-generated avatars)
- [ ] Team mode (practice with multiple parents)
- [ ] Certification program (advocacy skill badges)

## Success Metrics

- **Engagement**: Average session length (target: 10+ minutes)
- **Usage**: Sessions per user per week (target: 2+)
- **Retention**: Return rate after first session (target: 60%+)
- **Satisfaction**: Self-reported confidence improvement (target: 80%+)
- **Outcomes**: Correlation with successful IEP meetings (self-reported)

## Benefits

1. **Confidence Building**: Parents practice difficult conversations without fear
2. **Legal Education**: Learn IDEA/FAPE principles through practical application
3. **Immediate Feedback**: Real-time coaching on advocacy approach
4. **Accessibility**: 24/7 availability for practice
5. **Privacy**: Local storage option ensures sensitive practice remains private
6. **Cost-Effective**: Reduces need for paid advocacy coaching for basic skills

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI generates poor legal advice | Disclaimer: "This is practice, not legal advice. Consult IEP attorney for legal matters." |
| Users over-rely on simulation | Encourage real-world practice and actual advocate consultation |
| Session data leaks | Implement strong encryption, offer local-only storage |
| AI fails to provide constructive feedback | Refine prompts, add fallback templates, human review of edge cases |

## References

- **ADR 0009**: SQL Error VARCHAR(255) exceeded (related to data storage)
- **IDEA Regulations**: 34 CFR Part 300 (IEP requirements)
- **FAPE Standards**: Free Appropriate Public Education guidelines
- **Gemini AI Service**: `src/modules/ai/gemini.service.ts`
- **Advocacy Module**: `src/modules/advocacy/`

## Conclusion

The Advocacy Lab Meeting Simulation API provides a foundational tool for parents to build advocacy skills through safe, AI-coached practice. By integrating into the existing advocacy module and leveraging our Gemini AI infrastructure, we deliver immediate value with minimal architectural complexity. Future phases will add persistence, analytics, and advanced scenarios as user adoption grows.
