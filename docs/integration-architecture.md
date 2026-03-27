# Integration Architecture — AskIEP

_Generated: 2026-02-21 | Repository Type: Monorepo (2 parts)_

---

## Overview

AskIEP consists of two primary application parts that communicate via REST API, plus several external service integrations:

```
┌─────────────────────────────────────────────────────────────────┐
│                        AskIEP Monorepo                          │
│                                                                 │
│  ┌─────────────────┐    HTTPS REST    ┌──────────────────────┐  │
│  │   UI (apps/ui)  │ ◄──────────────► │  API (apps/api)      │  │
│  │   React 19      │   /api/v1/*      │  Express 5           │  │
│  │   Vite 7        │   Bearer JWT     │  TypeScript          │  │
│  │   Cloud Run     │                  │  Cloud Run           │  │
│  └─────────────────┘                  └──────────┬───────────┘  │
│                                                  │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                    ┌──────────────────────────────┼────────────────────┐
                    │                              │                    │
          ┌─────────▼────────┐      ┌─────────────▼──────┐   ┌────────▼───────┐
          │  Cloud SQL       │      │  Google Cloud      │   │  Firebase      │
          │  PostgreSQL 16   │      │  Storage (GCS)     │   │  (Auth)        │
          │  + pgvector      │      │  IEP PDFs          │   │  Token verify  │
          └──────────────────┘      └────────────────────┘   └────────────────┘
                    │
          ┌─────────▼────────┐      ┌────────────────────┐   ┌────────────────┐
          │  Google Gemini   │      │  Amazon SES        │   │  Telegram Bot  │
          │  AI (analysis +  │      │  (Email via SMTP)  │   │  (Notifications)│
          │  embeddings)     │      └────────────────────┘   └────────────────┘
          └──────────────────┘
```

---

## Integration Points

### 1. UI ↔ API (Primary Integration)

| Property | Value |
|---|---|
| Type | REST over HTTPS |
| Auth | JWT Bearer token (`Authorization: Bearer <token>`) |
| Base URL | `VITE_BASE_API_URL` (env var, baked at build time) |
| API Version | `/api/v1` |
| Content Type | `application/json` (standard) / `multipart/form-data` (file uploads) |
| Streaming | NDJSON over HTTP (for AI responses) |
| HTTP Client | `apiRequest` / `apiLongRequest` helpers in `src/lib/api.ts` |

**Data flow:**
```
UI Component
  → useQuery / useMutation (TanStack Query)
    → domain service (e.g., child.service.ts)
      → apiRequest('/api/v1/children', {...})
        → adds Authorization: Bearer token
        → HTTPS to API
          → Express Router → Controller → Service → Repo → PostgreSQL
            → JSON response
              → TanStack Query caches + provides to component
```

**AI Streaming flow (Advocacy Lab, Legal Support):**
```
UI Component
  → apiLongRequest('/api/v1/advocacy/sessions/:id/chat', { method: 'POST', body: message })
    → HTTPS to API
      → Controller calls LangChain/Gemini
        → streams NDJSON chunks back
          → ndjson-stream.ts parses chunks
            → UI updates chat message incrementally
```

---

### 2. API ↔ PostgreSQL + pgvector (Cloud SQL)

| Property | Value |
|---|---|
| ORM | Sequelize 6.x |
| Connection | Via Unix socket (`/cloudsql/{connection}`) on Cloud Run; TCP locally |
| SSL | `verify-ca` in production; disabled locally |
| Extensions | `pgvector` (vector similarity search) |
| Init | `initDb()` called once at server startup — registers models + associations |

**pgvector usage:**
- `vector_embeddings` table stores 768-dimensional embeddings from `gemini-embedding-001`
- IVFFlat index with cosine similarity (`vector_cosine_ops`, lists=100)
- Used for semantic search in Advocacy Lab and Legal Support agent

---

### 3. API ↔ Google Cloud Storage (File Storage)

| Property | Value |
|---|---|
| Client | `@google-cloud/storage` |
| Auth | GCP Service Account JSON (`APPFILE_GCP_SERVICE_ACCOUNT_FILE`) |
| Usage | Upload IEP PDFs; per-user folder organization |
| Download proxy | `GET /api/v1/storage/download/:path` proxies downloads |
| Signed URLs | Used for secure time-limited download links |

**Upload flow:**
```
User uploads PDF
  → UI: multipart POST /api/v1/iep/upload
    → API: multer parses file
      → document.service: uploads to GCS (user-specific folder)
        → Stores GCS path in iep_documents.storage_path
          → Triggers AI analysis pipeline (async)
```

---

### 4. API ↔ Google Gemini AI

| Property | Value |
|---|---|
| Client | `@google/genai` + `langchain`, `@langchain/google-genai` |
| Auth | `GEMINI_API_KEY` environment variable |
| Model | `gemini-flash-latest` (configurable via `GEMINI_MODEL` / `AI_MODEL`) |
| Temperature | 0.3 (configurable via `AI_TEMPERATURE`) |

**Use cases:**

| Feature | Method | Description |
|---|---|---|
| IEP Analysis | `@google/genai` direct | Extract goals, accommodations, red flags from PDF text |
| Embeddings | `gemini-embedding-001` | 768-dim vectors for semantic search |
| Advocacy Lab | LangChain conversation chain | Streaming chat with IEP context |
| Legal Support | LangChain agent + tools | IDEA/special-ed legal Q&A |
| Letter Generation | LangChain / `@google/genai` | Draft advocacy letters |

---

### 5. API ↔ Firebase (Authentication)

| Property | Value |
|---|---|
| Client | `firebase-admin` SDK |
| Auth | Firebase Service Account JSON (`APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE`) |
| Usage | Verify Firebase ID tokens from Google OAuth sign-in |

**Token exchange flow:**
```
User signs in with Google (Firebase)
  → UI: Firebase.signInWithPopup() → Firebase ID token
    → UI: POST /api/v1/auth/exchange-token { firebaseToken }
      → API: firebase-admin.auth().verifyIdToken(firebaseToken)
        → Creates/finds user in DB
          → Returns AskIEP JWT (accessToken + refreshToken)
            → UI stores JWT, uses for all subsequent API calls
```

---

### 6. API ↔ Amazon SES (Email)

| Property | Value |
|---|---|
| Client | `nodemailer` via SMTP |
| Auth | `SES_SMTP_USER` / `SES_SMTP_PASS` |
| Usage | Registration notifications, approval emails, system alerts |
| Env vars | `SES_SMTP_HOST`, `FROM_EMAIL_ADDRESS`, `NOTIFY_EMAILS` |

---

### 7. API ↔ Telegram Bot (Notifications)

| Property | Value |
|---|---|
| Client | Custom HTTP calls to Telegram Bot API |
| Auth | `TELEGRAM_API_KEY` (bot token) |
| Usage | Operational alerts, new lead notifications |
| Env vars | `TELEGRAM_API_KEY`, `TELEGRAM_CHAT_ID` |

---

## Cross-Part Shared State

There is **no shared runtime state** between UI and API (stateless REST pattern). The JWT token is the shared artifact:

- Issued by API (login/exchange-token)
- Stored in UI (AuthProvider memory + optional localStorage)
- Validated by API on every request (authenticate middleware)
- Contains: `sub` (user ID), `email`, `role`, `isApproved`

---

## Multi-Part Data Flow Examples

### IEP Upload + AI Analysis

```
1. UI: User selects PDF + child + date → POST /api/v1/iep/upload (multipart)
2. API: multer receives file buffer
3. API: Uploads file to GCS → stores path in iep_documents
4. API: Extracts text from PDF (extraction.service)
5. API: Calls Gemini AI with extracted text → gets structured analysis
6. API: Stores analysis in iep_analyses table
7. API: Generates 768-dim embedding for semantic search
8. API: Stores embedding in vector_embeddings (pgvector)
9. API: Returns document ID + analysis summary to UI
10. UI: Navigates to /iep/view/:id to show analysis results
```

### Advocacy Lab Chat

```
1. UI: User opens session → GET /api/v1/advocacy/sessions/:id
2. API: Returns session history (messages, insights)
3. UI: User types message → POST /api/v1/advocacy/sessions/:id/chat
4. API: Loads child context + IEP summaries from DB
5. API: Runs LangChain conversation chain with Gemini
6. API: Streams NDJSON response chunks
7. UI: ndjson-stream parses chunks → updates chat message incrementally
8. API: Stores complete message in advocacy_sessions
```

---

## Security Boundaries

```
Public Internet
    ↓
Cloud Run (allows unauthenticated) ← API handles its own auth
    ↓
authenticate middleware (JWT verification)
    ↓
requireRole / requireResourceOwnership
    ↓
Business Logic
    ↓
Private VPC / Cloud SQL (Unix socket — no public internet)
```

**Key security notes:**
- Cloud SQL is NOT publicly accessible — connected via Unix socket on Cloud Run
- GCS buckets have IAM-controlled access (service account only)
- JWT tokens have configurable expiration (`JWT_EXPIRATION_TIME_IN_MINUTES`)
- Rate limiting applied globally and specifically on auth routes (`authRateLimit`)
- All user data is scoped by `user_id` + `requireResourceOwnership` middleware
