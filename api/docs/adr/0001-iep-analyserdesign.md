# ADR-0001: IEP Document Processing & AI Integration Architecture

## Status

**Accepted**

## Date

2026-02-01 (Last Updated)

## Context

AskIEP is a parent-centered platform that helps parents understand and track their child's IEP. The core functionality revolves around:

1. **Document Upload & Processing:** Parents upload IEP PDFs → system extracts structured data
2. **AI-Powered Analysis:** Use AI to interpret documents and generate parent-friendly insights
3. **Smart Legal Prompts:** Context-aware alerts based on IEP data patterns
4. **Conversational Interface:** Chat with AI to ask questions about IEPs and IDEA procedures

This ADR focuses on **key architectural decisions** for these features.

## Source of Truth

- **Requirements:** [requirements.md](./requirements.md)
- **Implementation:** [systemarchitecture.md](../systemarchitecture.md)
- UI wireframes are illustrative only

---

## Problem Statement

Parents struggle with:
- Dense, legally complex IEP documents
- Understanding what data means for their child
- Knowing when something is wrong (missing data, procedural violations)
- How to communicate effectively with schools
- Accessing their IDEA rights in plain language

The system must empower parents without providing legal advice (UPL compliance)
3. **Guide Documentation:** Generate evidence-based emails, meeting requests, and PWN demands
4. **Preserve Evidence:** Create immutable audit trails for disputes and advocacy
5. **Empower Parents:** Provide awareness and tools, never automated legal decisions

---

## Decision Summary

We will build AskIEP as a **hybrid intelligence system**:

### Architecture Philosophy
* **Evidence-First:** Every alert, recommendation, and action must be traceable to stored data
* **Hybrid Intelligence:** Deterministic rules detect *when* something matters; AI explains *why*
* **Parent Agency:** No outbound communication without explicit parent review and approval
* **Auditability:** Immutable timeline of events for legal defensibility
* **Legally Informational:** System provides awareness, not legal advice or outcomes

### Technology Decisions
* **Backend:** Node.js + TypeScript + Express (modular monolith)
* **Database:** PostgreSQL 16.10 with Sequelize models + Raw SQL migrations (no foreign keys, indexes only)
* **AI:** Gemini 2.0 Flash (direct AiService integration) for document extraction and prompt generation
* **Streaming:** Server-Sent Events (SSE) for real-time extraction progress (30-60s operations)
* **Storage:** Google Cloud Storage (GCS) with streaming uploads for documents
* **Infrastructure:** Google Cloud Platform (Cloud Run + Cloud SQL + GCS)
* **Security:** JWT authentication, RBAC, encryption at rest/transit, FERPA-compliant audit logging

### Core Principle
**AI is a supporting interpreter, never the authority.** Rules produce facts; AI translates facts into parent-friendly insights.

---

## Architectural Principles (Non-Negotiable)

1. **Requirements > UI**
   UI is replaceable. Logic is not.

2. **Evidence First**
   Every alert, prompt, and recommendation must be traceable to stored data.

3. **Hybrid Intelligence**
   Deterministic rules decide *when* something matters.
   AI helps explain *why* it matters.

4. **Parent in Control**
   No outbound communication occurs without explicit parent review.

5. **Auditability by Default**
   Every meaningful action creates a timeline event.

6. **Legally Informational, Not Advisory**
   The system never asserts legal outcomes, only procedural awareness.

---

## System Overview (Logical)

```
IEP Data Ingest
   ↓
Canonical IEP Model
   ↓
Rule-Based Risk Detection
   ↓
AI Semantic Interpretation
   ↓
Smart Legal Prompt Engine
   ↓
Parent Actions (Email / Meeting / Evidence / Escalation)
   ↓
Immutable Timeline & Audit Log
```

---

## Core Architectural Components

### 1. IEP Data Ingestion Layer

**Inputs**

* PDF (primary)
* DOCX / TXT (secondary)
* Future: SIS integrations (OneRoster / Ed-Fi)

**Responsibilities**

* OCR where required
* Section identification (PLAAFP, Goals, Services, Placement, Progress)
* Manual correction support (per requirements)

**Implementation (IEP-01 Requirement)**

* **Upload:** Multipart form data → GCS streaming upload → Create iep_documents record
* **AI Extraction:** SSE streaming analysis (30-60s) → Populate metadata JSONB + confidence scores
* **Manual Review:** Parent corrects low-confidence fields → Logged in extraction_corrections table
* **Finalization:** After review → Normalize JSONB into goal_progress, services, smart_prompts tables

**Extraction Workflow States:**
1. `uploaded` → Document in GCS, pending analysis
2. `processing` / `analyzing` → AI extraction in progress (SSE streaming)
3. `analyzed` / `pending_review` → Results ready for parent review
4. `reviewed` → Parent corrected low-confidence fields
5. `finalized` → Data normalized into structured tables

**Design Choice**

* Extraction errors are expected and surfaced to the parent for correction
* Parsed data is never treated as "final truth" without review
* All corrections create immutable audit records (extraction_corrections table)
* AI confidence scores highlight fields requiring review (< 0.5 = red flag)

---

### 2. Canonical IEP Domain Model

All documents normalize into a **stable internal model**:

```
Child (child_profiles - EXISTING)
 ├─ Profile (name, dob, disabilities)
 └─ IEPDocuments[] (iep_documents - EXTENDED)
      ├─ Metadata (JSONB: studentName, age, grade, school, dates)
      ├─ Extraction Status (pending_review → reviewed → finalized)
      ├─ AI Confidence Scores
      ├─ ExtractionCorrections[] (audit trail for manual edits)
      ├─ Goals[] (goal_progress - EXTENDED)
      │    ├─ SMART Criteria (baseline, target, measurement, criteria)
      │    ├─ Lineage Tracking (lineageGroup, previousGoalId)
      │    └─ ProgressEntries[] (detailed evidence-based logs)
      ├─ Services[]
      │    └─ ServiceLogs[] (delivery tracking, compliance %)
      └─ SmartPrompts[] (context-aware legal alerts)

Dashboard Views (MATERIALIZED)
 ├─ dashboard_compliance_health (service delivery %, missed sessions)
 └─ dashboard_goal_mastery (achieved, progressing, emerging goals)
```

**Why**

* Extends existing tables (iep_documents, goal_progress) instead of replacing
* Enables multi-year lineage comparison via lineageGroup UUID
* Supports deterministic triggers via materialized views
* Decouples storage from document formats via JSONB metadata
* Audit trail via extraction_corrections table
* Application validates relationships (no DB foreign keys)

---

### 3. Rule-Based Risk Detection Engine (Primary Authority)

Rules implement **explicit triggers** from requirements, for example:

* Goal active > X months with insufficient progress
* Goal missing baseline / metric / criteria
* Service minutes reduced without regression data
* Parent request denied without Prior Written Notice
* Missed service sessions beyond threshold
* Removal from general education without LRE documentation
* Repeated procedural timeline violations

**Implementation Strategy**

* **Phase 1 (Implemented):** AI extracts red flags during document analysis → Stored in metadata.redFlags JSONB
* **Phase 2 (Future):** Materialized views calculate compliance metrics (service delivery %, goal progress averages)
* **Phase 3 (Future):** Deterministic SQL queries + application logic for rule evaluation

**Design Decision**
Rules produce **facts**, not recommendations.

**Current Implementation:**
- AI identifies potential issues during extraction (e.g., vague goals, missing baselines)
- Stored in `metadata.redFlags[]` with severity and legal context
- Normalized to `smart_prompts` table on finalization

**Example Facts Extracted:**

```
FACT: Goal G123 has no measurable criteria (AI confidence: 0.85)
FACT: Speech minutes reduced from 60 → 30 without evaluation data
FACT: Progress report uses generic language "making progress" without data
```

**Future Rule Examples (Post-Phase 1):**
```sql
-- Goal active > 6 months with < 25% progress
SELECT * FROM goal_progress 
WHERE status = 'in_progress' 
  AND start_date < NOW() - INTERVAL '6 months'
  AND progress_percentage < 25;

-- Service delivery < 80% compliance
SELECT * FROM services 
WHERE delivery_percentage < 80 
  AND status = 'active';
```

---

### 4. AI Semantic Interpretation Layer (Constrained)

AI is used **only** to:

* Interpret narrative language (“making progress”, “as needed”)
* Classify tone as generic vs data-driven
* Summarize complex sections into plain language
* Assist in mapping facts to Smart Legal Prompts

**Hard Constraints**

* AI does not invent data
* AI does not assess legal compliance
* AI output is always secondary to rule findings

**Post-Validation**
All AI output is validated against known facts before use.

---

### 5. Smart Legal Prompt Engine (Core Product)

Smart Legal Prompts are **domain objects**, not UI features.

Each prompt contains:

* Trigger Condition (machine-evaluated)
* Parent Alert (plain language)
* Legal Context (IDEA-aligned, informational)
* Questions to Ask
* Recommended Actions
* Evidence Auto-Linked
* Risk Severity (🟢🟡🔴)

Prompts are **configurable** by:

* State
* District
* Time thresholds

---

### 6. Action & Documentation System

Supported actions (per requirements):

* Send Email (editable, logged)
* Request IEP Meeting
* Download Evidence Packet
* Escalate (advocate, mediation guidance)

**Key Decision**
Actions are suggestions, not commands.
Parent intent is always explicit.

---

### 7. Email Generation & Logging

Emails are:

* Auto-generated from prompt context
* Pre-filled with factual data
* Editable by the parent
* Logged immutably as evidence

Emails serve dual purpose:

1. Communication
2. Legal paper trail

---

### 8. Timeline & Audit Log (System of Record)

Every significant event is logged:

* Document uploads
* Rule triggers
* Prompt generation
* Emails sent
* Meetings requested
* Escalation guidance shown

**Properties**

* Append-only
* Chronological
* Exportable (PDF)
* FERPA-compliant

This timeline is **more important than dashboards**.

---

## Database Migration Strategy

**Decision: Raw SQL Migrations, No Foreign Keys**

* **ORM Models:** Sequelize models for application queries and relationships
* **Migrations:** Raw SQL with IF NOT EXISTS (idempotent, safe reruns)
* **No Foreign Keys:** Application validates relationships, avoids circular dependency issues
* **Indexes Only:** 36 indexes across 6 tables + 2 materialized views for performance
* **Generated Columns:** delivery_percentage, weekly_minutes (auto-calculated)

**Migration Files:**
1. `20260201-0001-extend-iep-documents-v2.ts` - Add 15 extraction workflow columns
2. `20260201-0002-extend-goal-progress-v2.ts` - Add 9 SMART/lineage fields, rename columns
3. `20260201-0003-create-extraction-corrections-v2.ts` - New audit trail table
4. `20260201-0004-create-progress-entries-v2.ts` - New detailed progress logs
5. `20260201-0005-create-services-and-logs-v2.ts` - New service tracking tables
6. `20260201-0006-create-dashboard-views-v2.ts` - Materialized views for dashboard

**Why No Foreign Keys:**
- Avoids migration circular dependency issues
- Simplifies schema evolution
- Application-level validation provides better error messages
- Enables partial data imports for testing
- Materialized views refresh without FK lock contention

**Trade-off:** Referential integrity enforced in service layer, not database layer.

---

## API Endpoints (Implemented)

**Document Management:**
- `POST /api/v1/iep/upload` - Upload PDF/DOCX/TXT (multipart)
- `GET /api/v1/iep/:id/analyze-iep` - Trigger AI extraction (SSE streaming)
- `GET /api/v1/iep/:id/extraction` - Get extraction results for review
- `POST /api/v1/iep/:id/corrections` - Submit manual corrections
- `POST /api/v1/iep/:id/finalize` - Finalize extraction (normalize to tables)
- `GET /api/v1/iep/:id/can-finalize` - Check if ready to finalize
- `GET /api/v1/iep/:id/download` - Download original document
- `DELETE /api/v1/iep/:id` - Soft delete document

**Progress Tracking:**
- `POST /api/v1/progress-entries` - Log progress entry
- `GET /api/v1/progress-entries/goal/:goalId` - Get progress for goal
- `GET /api/v1/progress-entries/child/:childId` - Get child progress timeline
- `DELETE /api/v1/progress-entries/:id` - Delete progress entry
- `GET /api/v1/progress-entries/timeline` - Get combined timeline

**Service Delivery:**
- `POST /api/v1/services/logs` - Log service session
- `GET /api/v1/services/:serviceId/logs` - Get service logs
- `GET /api/v1/services/:serviceId/compliance` - Get compliance percentage
- `GET /api/v1/services/:serviceId/timeline` - Get delivery timeline
- `GET /api/v1/services/child/:childId` - Get all child services
- `PATCH /api/v1/services/logs/:id` - Update service log
- `DELETE /api/v1/services/logs/:id` - Delete service log

**Dashboard:**
- `GET /api/v1/dashboard/overview` - Dashboard summary (uses materialized views)
- `POST /api/v1/dashboard/refresh` - Manually refresh materialized views

---

## Service Layer Architecture (Implemented)

**SOLID Principles Applied:**

**Single Responsibility:**
- `DocumentService` → Upload & storage
- `ExtractionService` → AI analysis with SSE streaming
- `CorrectionService` → Manual edits & audit trail
- `NormalizationService` → JSONB → normalized tables conversion
- `ProgressEntryService` → Progress tracking with auto-calculation
- `ServiceLogService` → Service delivery compliance tracking
- `DashboardService` → Analytics & materialized view refresh

**Dependency Injection (Manual):**
```typescript
// Shared infrastructure
const storage = GCS.fromAppEnv();
const aiService = new AiService(config);

// Services with dependencies
export const dashboardService = new DashboardService(db, logger);
export const documentService = new DocumentService(storage, db, logger);
export const extractionService = new ExtractionService(aiService, storage, db, logger);
export const correctionService = new CorrectionService(db, dashboardService, logger);
export const normalizationService = new NormalizationService(db, dashboardService, logger);
```

**Async Updates (No Triggers):**
- Progress entries → Call `GoalService.updateProgressPercentage()` after insert/delete
- Service logs → Call `ServiceLogService.updateDeliveryStats()` after insert/update
- Both trigger `DashboardService.refreshMaterializedViews()` after data changes

**Why No Database Triggers:**
- Explicit service method calls provide better visibility
- Easier to test and debug
- Avoids hidden side effects
- Maintains separation of concerns

---

## Security, Privacy & Compliance

* FERPA-compliant access control
* Role-based permissions (Parent / Contributor / Advocate)
* Full audit trail of data access
* Parent-controlled consent & revocation
* Encryption at rest and in transit
* Configurable data retention

---

## Explicit Non-Goals

The system will **not**:

* Provide legal advice
* Decide compliance or violations
* Contact schools automatically
* Replace advocates or attorneys
* Act without parent confirmation

---

## Trade-offs Accepted

| Choice              | Trade-off                               |
| ------------------- | --------------------------------------- |
| Hybrid rules + AI   | More engineering, far more trust        |
| Immutable timelines | Less flexibility, higher accountability |
| Explainability      | Slower iteration, long-term credibility |
| Parent control      | Fewer automations, higher safety        |

These trade-offs are **intentional**.

---

## Consequences

### Positive

* High trust with parents and advocates
* Defensible system behavior
* Deterministic testing possible
* Scales to multi-year lineage analysis
* Survives real disputes, not demos

### Risks

* Higher initial complexity
* Requires disciplined schema evolution
* Needs strong test coverage

---

## Future Amendments (Not Scope Creep)

* State-specific IDEA overlays
* Confidence scoring on interpretations
* Adversarial document detection
* Multi-year regression analytics
* Advocate review mode
* SIS integrations

Each will require its own ADR.

---

## Final Statement

This architecture treats the IEP Analyzer as:

> **A documentation-driven awareness system, not an AI oracle.**

Its purpose is to:

* Surface risk
* Ask the right questions
* Preserve evidence
* Empower parents to act

Not to replace judgment — but to **restore balance**.

