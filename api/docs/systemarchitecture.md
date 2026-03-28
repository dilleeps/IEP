# AskIEP System Architecture

**Version:** 1.0  
**Last Updated:** February 1, 2026  
**Status:** Active

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Technology Stack](#technology-stack)
4. [Architecture Layers](#architecture-layers)
5. [Infrastructure & Deployment](#infrastructure--deployment)
6. [Data Architecture](#data-architecture)
7. [Security & Compliance](#security--compliance)
8. [API Design](#api-design)
9. [Integration Points](#integration-points)
10. [Scalability & Performance](#scalability--performance)
11. [Monitoring & Observability](#monitoring--observability)

---

## Executive Summary

**AskIEP** is a FERPA-compliant, parent-centered platform that empowers parents of children with Individualized Education Programs (IEPs) to monitor progress, track goals, and navigate the special education process with confidence. The system combines secure document management, AI-powered insights, and Smart Legal Prompts to create an evidence-based advocacy tool.

**Core Objectives:**
- Consolidate IEP information in one secure location
- Provide time-to-time progress tracking with lineage comparison
- Empower parents with legal awareness and procedural safeguards
- Enable seamless collaboration between parents, educators, and advocates
- Create an immutable audit trail for compliance and dispute resolution

---

## System Overview

### Architecture Pattern
**Monolithic Modular Architecture** with clear domain boundaries and RESTful API design.

### Deployment Model
- **Development:** Docker Compose (local)
- **Production:** Google Cloud Platform (Cloud Run + Cloud SQL)
- **CI/CD:** GitHub Actions (planned)

### Key Characteristics
- **Multi-tenant:** Role-based access control (PARENT, ADVOCATE, TEACHER_THERAPIST, ADMIN, SUPPORT)
- **Event-driven:** Audit logging and timeline tracking
- **AI-augmented:** Google Gemini integration for document analysis and smart prompts
- **Mobile-first:** Responsive API design for web and mobile clients

---

## Technology Stack

### Backend (Node.js/TypeScript)
```yaml
Runtime: Node.js 23 (Alpine Linux)
Language: TypeScript 5.9+
Framework: Express 5.2+
ORM: Sequelize 6.37+
Database: PostgreSQL 14+ (with pgvector extension)
Authentication: JWT (jsonwebtoken)
Validation: Zod 4.3+
API Documentation: Swagger/OpenAPI (swagger-jsdoc + swagger-ui-express)
```

### Infrastructure & DevOps
```yaml
Containerization: Docker (multi-stage builds)
Orchestration: Docker Compose (dev), Cloud Run (prod)
Database: Cloud SQL for PostgreSQL (GCP)
Storage: Google Cloud Storage
Observability: OpenTelemetry + Winston logging
Rate Limiting: express-rate-limit
CORS: cors middleware
```

### AI & Machine Learning
```yaml
LLM: Google Gemini (via @google/genai)
Framework: LangChain (@langchain/google-genai)
Use Cases:
  - IEP document extraction (OCR + LLM)
  - Smart Legal Prompt generation
  - Goal measurability analysis
  - Progress report interpretation
  - AI-powered chat assistance
```

### Third-Party Services
```yaml
Email: Nodemailer
File Processing: Multer (multipart/form-data)
Password Hashing: bcrypt
Migrations: Umzug
Testing: Vitest + Supertest + Testcontainers
```

---

## Architecture Layers

### 1. Presentation Layer (API)
**Location:** `src/app.ts`, `src/server.ts`

**Responsibilities:**
- RESTful API endpoints (Express routes)
- Request/response handling
- Authentication middleware
- CORS configuration
- Rate limiting
- Swagger documentation

**Key Middleware:**
```
Request → CORS → Rate Limit → Request Context → Authentication → Authorization → Route Handler → Error Handler → Response
```

---

### 2. Application Layer (Modules)
**Location:** `src/modules/`

**Domain Modules:**
```
auth/               - Authentication & user management
child/              - Child profiles & IEP data
document/           - IEP document management & OCR
goal/               - IEP goal tracking & progress
compliance/         - Timeline tracking & legal deadlines
communication/      - Parent-school communication logs
behavior/           - Behavior tracking & intervention
letter/             - Template letters & PWN requests
advocacy/           - Advocate management & resources
resource/           - Legal resources & knowledge base
preference/         - User preferences & settings
dashboard/          - Analytics & summary views
ai/conversation/    - AI chat & assistance
smart-prompts/      - Context-aware legal prompts
admin/              - Admin user & system management
config/             - System configuration
lead/               - Lead generation (public)
consent/            - FERPA consent management
audit/              - Audit log & timeline
```

**Module Pattern:**
```
module/
├── {domain}.routes.ts      # Express routes
├── {domain}.controller.ts  # Request handlers
├── {domain}.service.ts     # Business logic
├── {domain}.model.ts       # Sequelize models
├── {domain}.schema.ts      # Zod validation
└── {domain}.types.ts       # TypeScript types
```

---

### 3. Business Logic Layer (Services)
**Location:** `src/modules/*/service.ts`

**Core Services:**
- **AuthService:** JWT generation, password hashing, session management
- **ChildService:** Profile management, IEP history
- **DocumentService:** PDF parsing, OCR, metadata extraction
- **GoalService:** SMART goal validation, progress calculation
- **ComplianceService:** Deadline tracking, PWN monitoring
- **SmartPromptsService:** Rule-based + AI prompt generation
- **AIService:** LLM orchestration, document analysis
- **NotificationService:** Email alerts, push notifications
- **AuditService:** Timeline events, access logs

---

### 4. Data Access Layer (Models)
**Location:** `src/modules/*/model.ts`, `src/shared/db/`

**Core Entities:**
```typescript
User                // Parent, Advocate, Teacher, Admin
ChildProfile        // Child demographics, diagnoses
IEP                 // IEP documents, versions, lineage
Goal                // Annual goals, baselines, targets
ProgressEntry       // Progress updates, evidence
Service             // Related services (OT, PT, Speech)
Accommodation       // Supports & accommodations
Meeting             // IEP meetings, attendees
Communication       // Emails, calls, notes
ComplianceEvent     // Deadlines, PWN, timelines
SmartPrompt         // Legal prompts, alerts
Resource            // Legal knowledge base
Letter              // Template letters, drafts
AuditLog            // Access & change tracking
ConsentRecord       // FERPA consent management
```

---

### 5. Shared Layer
**Location:** `src/shared/`

**Components:**
```
errors/         - Custom error classes (BadRequestError, UnauthorizedError, etc.)
db/             - Database utilities, base models
storage/        - Google Cloud Storage integration
notification/   - Email & notification utilities
service/        - Base service classes
ai/             - AI orchestration & prompt templates
utils.ts        - Common utilities
services.ts     - Service registry
```

---

## Infrastructure & Deployment

### Development Environment

**Docker Compose Setup:**
```yaml
services:
  api:
    build: Dockerfile (multi-stage)
    ports: 3000:8080
    environment:
      - POSTGRES_HOST=postgres
      - REDIS_HOST=redis
    networks: iepapp-network
```

**Database:**
- PostgreSQL 14+ with pgvector extension
- Sequelize migrations (`src/db/migrations/`)
- Seed data for demo users (`src/db/seeds/`)

**Local Development:**
```bash
npm run dev           # Start dev server (tsx watch)
npm run db:migrate    # Run migrations
npm run db:seed       # Seed demo data
npm run test          # Run tests
npm run docs          # View API docs
```

---

### Production Environment (GCP)

**Cloud Run:**
- Serverless container deployment
- Auto-scaling (0 to N instances)
- HTTPS with managed certificates
- Environment: `NODE_ENV=production`

**Cloud SQL (PostgreSQL):**
- Managed database service
- Unix socket connection (`/cloudsql/{CONNECTION_NAME}`)
- SSL/TLS encryption
- Automated backups & point-in-time recovery

**Google Cloud Storage:**
- IEP document storage
- Secure signed URLs
- Lifecycle management
- FERPA-compliant encryption

**Networking:**
- VPC connector for Cloud Run → Cloud SQL
- Private IP for database
- Cloud Armor for DDoS protection (planned)

**Secrets Management:**
- Google Secret Manager
- Environment variables via Cloud Run config
- No secrets in code or Docker images

---

### Dockerfile Strategy

**Multi-Stage Build:**
```dockerfile
Stage 1: deps    - Install dependencies (cached)
Stage 2: build   - Compile TypeScript + prune dev deps
Stage 3: runner  - Minimal runtime (node:23-alpine)
```

**Security:**
- Non-root user (`node`)
- Minimal attack surface (Alpine Linux)
- Production-only dependencies
- No source code in final image

---

## Data Architecture

### Database Schema Overview

**Core Relationships:**
```
User (1) ─── (N) ChildProfile
ChildProfile (1) ─── (N) IEP
IEP (1) ─── (N) Goal
Goal (1) ─── (N) ProgressEntry
User (1) ─── (N) SmartPrompt
ChildProfile (1) ─── (N) ComplianceEvent
User (1) ─── (N) Communication
User (1) ─── (N) AuditLog
```

**Key Design Patterns:**
- **Soft Deletes:** All models include `deletedAt` (paranoid mode)
- **Timestamps:** `createdAt`, `updatedAt` on all entities
- **UUIDs:** Primary keys for distributed systems
- **JSONB:** Flexible metadata storage (`contextData`, `metadata`)
- **Indexes:** Optimized for common queries (userId, childId, etc.)

---

### Migration Strategy

**Sequelize + Umzug:**
```bash
npm run db:migrate          # Run pending migrations
npm run db:migrate:down     # Rollback last migration
npm run db:migrate:status   # Show migration status
```

**Migration Guidelines:**
1. One migration per schema change
2. Reversible (up + down)
3. Data migrations separate from schema
4. Test on staging before production

---

### Seed Data (Demo Users)

**Pre-configured Accounts:**
| Role | Email | Password | Status |
|------|-------|----------|--------|
| PARENT | parent@askiep.com | Demo123 | active |
| ADVOCATE | advocate@askiep.com | Demo123 | pending |
| TEACHER_THERAPIST | teacher@askiep.com | Demo123 | pending |
| ADMIN | admin@askiep.com | Demo123 | active |
| SUPPORT | support@askiep.com | Demo123 | active |

---

## Security & Compliance

### Authentication & Authorization

**JWT-Based Authentication:**
```
1. User login → Generate access token (15min) + refresh token (7 days)
2. Client stores tokens (HttpOnly cookies or localStorage)
3. API validates JWT on protected routes
4. Refresh token rotation for extended sessions
```

**Role-Based Access Control (RBAC):**
```typescript
Roles: PARENT | ADVOCATE | TEACHER_THERAPIST | ADMIN | SUPPORT
Permissions: Resource ownership + role hierarchy
Middleware: authenticate → authorize → resource ownership
```

**Middleware Chain:**
```
authenticate.ts       - Verify JWT, attach user to request
authorize.ts          - Check role permissions
resourceOwnership.ts  - Verify data ownership (parent's child only)
```

---

### FERPA Compliance

**Data Protection:**
- ✅ Role-based access control
- ✅ Audit logging (all access & changes)
- ✅ Consent management (parent controls access)
- ✅ Data encryption (at rest + in transit)
- ✅ Secure deletion (soft delete + retention policies)
- ✅ Access revocation (instant)

**Audit Trail:**
```typescript
AuditLog {
  userId, action, resource, resourceId,
  ipAddress, userAgent, metadata,
  timestamp, requestId
}
```

---

### Data Security

**Encryption:**
- **At Rest:** AES-256 (Cloud SQL + GCS)
- **In Transit:** TLS 1.2+ (HTTPS, database connections)
- **Application:** bcrypt for passwords (cost factor 10)

**Rate Limiting:**
```typescript
General: 100 req/15min per IP
Auth: 5 req/15min per IP (login/register)
```

**Input Validation:**
- Zod schemas for all input
- SQL injection prevention (Sequelize ORM)
- XSS protection (sanitized output)
- CSRF protection (planned)

---

## API Design

### RESTful Principles

**Base URL:** `/api/v1`

**Standard Endpoints:**
```
GET    /resource          - List (with pagination)
POST   /resource          - Create
GET    /resource/:id      - Read
PATCH  /resource/:id      - Update (partial)
PUT    /resource/:id      - Replace (full)
DELETE /resource/:id      - Delete (soft)
```

**Query Parameters:**
```
?page=1&limit=20           # Pagination
?sort=-createdAt           # Sorting (- for desc)
?filter[status]=active     # Filtering
?include=child,goals       # Related data
```

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
```

---

### API Documentation

**Swagger/OpenAPI:**
- **URL:** `http://localhost:3000/api-docs`
- **Spec:** `http://localhost:3000/api-docs.json`
- **Generation:** `swagger-jsdoc` (JSDoc annotations)

**Interactive Testing:**
1. Open Swagger UI
2. Authorize with JWT (Bearer token)
3. Test endpoints directly from browser

---

## Integration Points

### Google Gemini (AI)

**Use Cases:**
1. **IEP Document Extraction:**
   - OCR + LLM parsing
   - Goal/service/accommodation extraction
   - Section identification (PLAAFP, etc.)

2. **Smart Legal Prompts:**
   - Pattern detection (limited progress, missing data)
   - Risk assessment (🟢🟡🔴)
   - Email template generation

3. **AI Chat Assistant:**
   - Answer parent questions
   - Explain legal terms
   - Suggest actions

**Configuration:**
```typescript
Model: gemini-2.0-flash-exp
Temperature: 0.7 (prompts), 0.3 (extraction)
Max Tokens: 4096
Safety: Block harmful content
```

---

### Google Cloud Storage

**Document Storage:**
```
Bucket: {PROJECT_ID}-iep-documents
Path: /{userId}/{childId}/{documentId}.pdf
ACL: Private (signed URLs for access)
Lifecycle: Retain 7 years (FERPA)
```

**File Upload Flow:**
```
Client → API (Multer) → Validate → GCS → Store metadata → Return URL
```

---

### Email (Nodemailer)

**Transactional Emails:**
- Welcome emails
- Password reset
- IEP reminders
- Smart prompt alerts
- Template letters (PWN requests, meeting requests)

**Configuration:**
```
Provider: SMTP (configurable)
Templates: Plain text + HTML
Tracking: Email sent logs in AuditLog
```

---

## Scalability & Performance

### Database Optimization

**Indexes:**
```sql
users: email (unique), role
child_profiles: user_id, status
ieps: child_id, effective_date
goals: iep_id, status
smart_prompts: user_id, acknowledged, expires_at
```

**Pagination:**
- Default: 20 items per page
- Max: 100 items per page
- Cursor-based pagination (planned)

**Caching Strategy (Planned):**
- Redis for session storage
- Query result caching (5min TTL)
- Static resource CDN

---

### Cloud Run Auto-Scaling

**Configuration:**
```yaml
Min Instances: 0 (cost optimization)
Max Instances: 10 (initial)
Concurrency: 80 requests per instance
CPU: 1 vCPU
Memory: 512 MB
Timeout: 300s
```

**Scaling Triggers:**
- Request concurrency
- CPU utilization (60%)
- Memory utilization (80%)

---

## Monitoring & Observability

### OpenTelemetry Integration

**Traces:**
- HTTP requests (start → end)
- Database queries
- External API calls (Gemini, GCS)

**Metrics:**
- Request rate, latency, errors
- Database connection pool
- API endpoint performance

**Logs:**
- Winston structured logging
- Log levels: error, warn, info, debug
- Correlation IDs (requestId)

**Exporters:**
```typescript
OTLP gRPC exporter → Google Cloud Trace/Logging
```

---

### Logging Strategy

**Winston Configuration:**
```typescript
Levels: error, warn, info, http, debug
Format: JSON (production), pretty (dev)
Transports: Console, File (optional)
Metadata: requestId, userId, timestamp
```

**Log Examples:**
```
[info] User login successful: user@example.com
[error] Database connection failed: timeout
[warn] Rate limit exceeded: IP 1.2.3.4
```

---

### Health Checks

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-01T12:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "version": "0.1.0"
}
```

---

## Appendix

### Environment Variables

**Required:**
```
NODE_ENV=production
PORT=8080
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=iep_database
POSTGRES_USER=iep_user
POSTGRES_PASSWORD=***
JWT_SECRET=***
JWT_REFRESH_SECRET=***
GEMINI_API_KEY=***
GCS_BUCKET=***
```

**Optional:**
```
DATABASE_URL=postgresql://...
CLOUDSQL_CONNECTION_NAME=project:region:instance
ENABLE_HTTP_LOGGING=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://...
SMTP_HOST=smtp.gmail.com
```

---

### Project Structure
```
apps/api/
├── src/
│   ├── app.ts                  # Express app setup
│   ├── server.ts               # Server entry point
│   ├── config/                 # Configuration
│   │   ├── env.ts              # Environment validation (Zod)
│   │   ├── logger.ts           # Winston setup
│   │   ├── sequelize.ts        # Database connection
│   │   ├── swagger.ts          # API documentation
│   │   └── otel.ts             # OpenTelemetry
│   ├── middleware/             # Express middleware
│   │   ├── authenticate.ts     # JWT validation
│   │   ├── authorize.ts        # RBAC
│   │   ├── errorHandler.ts    # Global error handler
│   │   ├── rateLimit.ts        # Rate limiting
│   │   └── validate.ts         # Zod validation
│   ├── modules/                # Domain modules
│   │   ├── auth/
│   │   ├── child/
│   │   ├── document/
│   │   ├── goal/
│   │   ├── smart-prompts/
│   │   └── ...
│   ├── shared/                 # Shared utilities
│   │   ├── errors/
│   │   ├── db/
│   │   ├── storage/
│   │   └── ai/
│   ├── db/                     # Database migrations & seeds
│   │   ├── migrations/
│   │   ├── seeds/
│   │   ├── migrate.ts
│   │   └── seed.ts
│   └── health/                 # Health check endpoints
├── tests/                      # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                       # Documentation
│   ├── adr/                    # Architecture Decision Records
│   ├── domains/                # Domain documentation
│   └── references/
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yaml         # Local development
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

### Key Decision Records

See [docs/adr/](./adr/) for detailed architectural decisions:
- [ADR-0001: IEP Analyzer & Smart Legal Prompts](./adr/0001-iep-analyserdesign.md)

---

**Document Ownership:** Engineering Team  
**Review Cycle:** Quarterly  
**Next Review:** May 1, 2026
