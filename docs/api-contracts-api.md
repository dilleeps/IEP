# API Contracts — AskIEP API

_Generated: 2026-02-21 | Base URL: `/api/v1` | Auth: Bearer JWT_

Interactive docs available at runtime: `GET /api-docs` (Swagger UI)

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

Token obtained via `POST /api/v1/auth/login` or `POST /api/v1/auth/exchange-token`.

---

## Auth Routes (`/api/v1/auth`)

### Register (role-specific)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/parent` | No | Register parent (auto-approved) |
| POST | `/auth/register/advocate` | No | Register advocate (pending approval) |
| POST | `/auth/register/teacher` | No | Register teacher/therapist (pending approval) |

**Request body (parent example):**
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123",
  "displayName": "Jane Parent"
}
```

### Login & Token Management

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | No | Email/password login → JWT |
| POST | `/auth/exchange-token` | No | Exchange Firebase ID token → JWT |
| POST | `/auth/refresh` | No | Refresh JWT access token |
| POST | `/auth/logout` | JWT | Invalidate session |
| GET  | `/auth/me` | JWT | Get current user profile |
| POST | `/auth/change-password` | JWT | Change password |

**Login response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "user": { "id": "uuid", "email": "...", "role": "PARENT", "displayName": "..." }
}
```

---

## Children (`/api/v1/children`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/children` | List current user's children |
| POST   | `/children` | Create child profile |
| GET    | `/children/:id` | Get child profile |
| PUT    | `/children/:id` | Update child profile |
| DELETE | `/children/:id` | Soft-delete child profile |

**Child profile fields**: name, dateOfBirth, age, grade, schoolName, schoolDistrict, disabilities[], focusTags[], lastIepDate, nextIepReviewDate, advocacyLevel, primaryGoal, stateContext, advocacyBio, accommodationsSummary, servicesSummary

---

## IEP Documents (`/api/v1/iep`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/iep` | List IEP documents for user |
| POST   | `/iep/upload` | Upload IEP PDF (multipart/form-data) |
| GET    | `/iep/:id` | Get IEP document |
| DELETE | `/iep/:id` | Soft-delete IEP document |
| POST   | `/iep/:id/analyse` | Trigger AI analysis on document |
| GET    | `/iep/:id/analysis` | Get analysis results |
| PUT    | `/iep/:id/analysis/correct` | Submit corrections to AI extraction |
| GET    | `/iep/analyses` | List analyses for user |

**Upload request**: `multipart/form-data` with `file` field (PDF) + `childId`, `documentDate`, `schoolYear` fields.

**Analysis response:**
```json
{
  "id": "uuid",
  "summary": "This IEP covers...",
  "goals": ["Goal 1...", "Goal 2..."],
  "accommodations": ["Extended time", "..."],
  "redFlags": ["Vague goal language", "..."],
  "legalLens": "Under IDEA Section 300.320...",
  "riskScore": 42,
  "riskLevel": "medium",
  "aiModel": "gemini-flash-latest",
  "aiTokensUsed": 1234,
  "processingTimeMs": 2100
}
```

---

## Goals (`/api/v1/goals`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/goals` | List goals (filter by `childId`) |
| POST   | `/goals` | Create goal |
| GET    | `/goals/:id` | Get goal |
| PUT    | `/goals/:id` | Update goal |
| DELETE | `/goals/:id` | Soft-delete goal |

**Goal fields**: childId, goalName, goalDescription, goalCategory, baselineValue, currentValue, targetValue, measurementUnit, status, progressPercentage, startDate, targetDate, notes, dataSource

### Progress Entries (`/api/v1/progress-entries`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/progress-entries` | List entries (filter by `goalId`) |
| POST   | `/progress-entries` | Add progress entry |
| DELETE | `/progress-entries/:id` | Delete entry |

---

## Behavior Logs (`/api/v1/behaviors`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/behaviors` | List behavior entries (filter by `childId`) |
| POST   | `/behaviors` | Create behavior entry |
| GET    | `/behaviors/:id` | Get entry |
| PUT    | `/behaviors/:id` | Update entry |
| DELETE | `/behaviors/:id` | Soft-delete entry |

**Fields**: childId, eventDate, eventTime, durationMinutes, antecedent, behavior, consequence, intensity(1-5), severityLevel, location, activity, peoplePresent[], interventionUsed, interventionEffective, notes, triggersIdentified[], patternTags[]

---

## Compliance Logs (`/api/v1/compliance`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/compliance` | List compliance logs (filter by `childId`) |
| POST   | `/compliance` | Create compliance log |
| GET    | `/compliance/:id` | Get log entry |
| PUT    | `/compliance/:id` | Update log entry |
| DELETE | `/compliance/:id` | Soft-delete entry |

**Fields**: childId, serviceDate, serviceType, serviceProvider, status(provided/missed/partial), minutesProvided, minutesRequired, notes, issueReported, resolutionStatus

---

## Communications (`/api/v1/communications`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/communications` | List communication logs (filter by `childId`) |
| POST   | `/communications` | Create log entry |
| GET    | `/communications/:id` | Get log entry |
| PUT    | `/communications/:id` | Update log entry |
| DELETE | `/communications/:id` | Soft-delete entry |

**Fields**: childId, communicationDate, contactName, contactRole, subject, method(email/phone/meeting/other), summary, followUpNeeded, followUpDate, followUpCompleted

---

## Letters (`/api/v1/letters`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/letters` | List letters |
| POST   | `/letters/generate` | AI-generate a letter |
| GET    | `/letters/:id` | Get letter |
| PUT    | `/letters/:id` | Update letter |
| DELETE | `/letters/:id` | Soft-delete letter |
| GET    | `/letters/templates` | List letter templates |

---

## Advocacy Lab (`/api/v1/advocacy`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/advocacy/sessions` | List advocacy sessions |
| POST   | `/advocacy/sessions` | Create new session |
| GET    | `/advocacy/sessions/:id` | Get session with messages |
| POST   | `/advocacy/sessions/:id/chat` | Send message → AI response (streams NDJSON) |
| DELETE | `/advocacy/sessions/:id` | End/delete session |
| GET    | `/advocacy/insights` | List insights across sessions |
| GET    | `/advocacy/smart-prompts` | Get role-aware quick prompts |

---

## Legal Support Agent (`/api/v1/agent/legal-support`) — JWT required

| Method | Path | Description |
|---|---|---|
| POST   | `/agent/legal-support/ask` | Ask a legal question (AI agent, streams NDJSON) |
| GET    | `/agent/legal-support/history` | Get past legal questions |

---

## AI Conversations (`/api/v1/ai/conversations`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/ai/conversations` | List conversations |
| POST   | `/ai/conversations` | Create conversation |
| GET    | `/ai/conversations/:id` | Get conversation with messages |
| POST   | `/ai/conversations/:id/messages` | Add message |

---

## Smart Prompts (`/api/v1/smart-prompts`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/smart-prompts` | Get contextual prompts for current user role |
| POST   | `/smart-prompts` | (Admin) Create smart prompt |

---

## Dashboard (`/api/v1/dashboard`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/dashboard` | Get dashboard summary for current user |
| GET    | `/dashboard/child/:id` | Get per-child dashboard data |

---

## Resources (`/api/v1/resources`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/resources` | List resources (filter by type, category, state) |
| GET    | `/resources/:id` | Get resource |
| GET    | `/resources/search` | Semantic search (pgvector) |

---

## Services (`/api/v1/services`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/services` | List IEP services (filter by `childId`) |
| POST   | `/services` | Create service |
| PUT    | `/services/:id` | Update service |
| DELETE | `/services/:id` | Soft-delete service |

---

## Settings (`/api/v1/settings/preferences`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/settings/preferences` | Get user preferences |
| PUT    | `/settings/preferences` | Update preferences |

---

## Config (`/api/v1/config`) — Public

| Method | Path | Description |
|---|---|---|
| GET    | `/config` | Get public system configuration (features, flags) |

---

## Storage (`/api/v1/storage`) — JWT required

| Method | Path | Description |
|---|---|---|
| GET    | `/storage/download/:path` | Proxy GCS download (signed URL or stream) |

---

## Consents (`/api/v1/consents`)

| Method | Path | Description |
|---|---|---|
| POST   | `/consents` | Record user consent |
| GET    | `/consents/me` | Get current user's consents |

---

## Leads (`/api/v1/leads`) — Public / Admin

| Method | Path | Description |
|---|---|---|
| POST   | `/leads` | Submit lead from landing page (public) |
| GET    | `/leads` | List leads (admin) |

---

## Admin Routes — JWT + ADMIN role required

### Config (`/api/v1/admin/config`)

| Method | Path | Description |
|---|---|---|
| GET    | `/admin/config` | List all system config keys |
| PUT    | `/admin/config/:key` | Update config value |

### Users (`/api/v1/admin/users`)

| Method | Path | Description |
|---|---|---|
| GET    | `/admin/users` | List all users |
| GET    | `/admin/users/:id` | Get user details |
| PUT    | `/admin/users/:id` | Update user (role, status, etc.) |
| DELETE | `/admin/users/:id` | Deactivate user |
| POST   | `/admin/users/import` | Bulk import users via CSV |

### User Management (`/api/v1/admin/user-management`)

| Method | Path | Description |
|---|---|---|
| GET    | `/admin/user-management/requests` | List pending approval requests |
| POST   | `/admin/user-management/requests/:id/approve` | Approve registration request |
| POST   | `/admin/user-management/requests/:id/reject` | Reject registration request |

---

## Error Response Format

All errors return:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "field": "email" },
    "traceId": "abc123"
  }
}
```

Common error codes: `UNAUTHORIZED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `ACCOUNT_PENDING_APPROVAL`, `INTERNAL_SERVER_ERROR`

---

## Health Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Returns `{ "status": "ok" }` |
