# Low-Level Design: IEP Document Management System

## Document Information

| Property | Value |
|----------|-------|
| **Version** | 1.0.0 |
| **Date** | 2026-02-01 |
| **Status** | Implementation Ready |
| **Phase** | Phase 1 (MVP) |

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Design](#database-design)
4. [API Design](#api-design)
5. [Service Layer](#service-layer)
6. [Integration Points](#integration-points)
7. [Migration Scripts](#migration-scripts)
8. [Deployment](#deployment)

---

## System Overview

### Purpose

Implement IEP (Individualized Education Program) document upload, AI-powered extraction, manual correction, and dashboard analytics for parents to monitor their child's educational progress.

### Key Features (Phase 1)

- ✅ Document Upload (PDF/DOCX/TXT)
- ✅ AI Extraction (Gemini 2.0)
- ✅ Manual Correction (IEP-01 Compliance)
- ✅ Dashboard Analytics (Compliance Health, Goal Mastery)
- ✅ Multi-year Lineage Comparison

### Requirements Fulfilled

| Requirement | Implementation |
|-------------|----------------|
| **IEP-01:** Upload + OCR + Manual Edit | Upload → AI Extract → Parent Review → Finalize |
| **IEP-02:** IEP Summary View | Dashboard API with aggregated metrics |
| **IEP-03:** Historical IEP Versions | Multiple documents per child with dates |
| **LC-01:** Goal Lineage Tracking | `lineageGroup` UUID links goals across years |
| **PT-01-06:** Progress Tracking | ProgressEntry with evidence attachments |
| **SC-01-03:** FERPA + Audit Trail | Private GCS, audit logs, encryption |

---

## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────┐
│                     Parent Web App                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 API Gateway (Express)                   │
│  ┌──────────────┬──────────────┬───────────────────┐   │
│  │ Auth Middleware │ Rate Limit │ Request Context  │   │
│  └──────────────┴──────────────┴───────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌─────────┐      ┌──────────┐      ┌──────────┐
│   GCS   │      │ Gemini   │      │   DB     │
│ Storage │      │   AI     │      │ Postgres │
└─────────┘      └──────────┘      └──────────┘
```

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Routes Layer                         │
│  (Express Router + Swagger + Validation)               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 Controller Layer                        │
│  (Request/Response Handling + Error Handling)          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  Service Layer                          │
│  (Business Logic + Orchestration)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌─────────┐      ┌──────────┐      ┌──────────┐
│  Data   │      │ External │      │  Shared  │
│  Layer  │      │ Services │      │ Utilities│
└─────────┘      └──────────┘      └──────────┘
```

### SOLID Principles Applied

**Single Responsibility Principle:**
- `DocumentService` → Upload & storage
- `ExtractionService` → AI analysis
- `CorrectionService` → Manual edits
- `DashboardService` → Analytics

**Open-Closed Principle:**
```typescript
// Extensible AI provider interface
interface IAiProvider {
  extract(text: string, schema: z.ZodSchema): Promise<any>;
}

class GeminiProvider implements IAiProvider {
  // Gemini-specific implementation
}

// Future: OpenAI, Claude, etc. without modifying consumers
class OpenAIProvider implements IAiProvider {
  // OpenAI implementation
}
```

**Dependency Inversion:**
```typescript
// Services depend on abstractions, not concrete implementations
class DocumentService {
  constructor(
    private storage: IStorageService,  // Not GCS directly
    private ai: IAiService,            // Not Gemini directly
    private db: IDatabase              // Not Sequelize directly
  ) {}
}
```

---

## Database Design

### Integration Strategy

**Extends Existing Tables:**
- `iep_documents` → Add extraction workflow, AI analysis fields
- `goal_progress` → Add SMART criteria, lineage tracking, IEP references

**New Tables:**
- `extraction_corrections` → Parent correction audit trail
- `progress_entries` → Detailed evidence-based logs
- `services` + `service_logs` → Related services tracking
- `dashboard_compliance_health` + `dashboard_goal_mastery` → Materialized views

### Schema Principles

1. **Extend, Don't Replace:** Enhance existing `goal_progress` and `iep_documents` tables
2. **Normalization:** Separate concerns (IEP → Goals → Progress)
3. **Denormalization:** childId in tables for query performance
4. **Temporal:** Support multi-year comparison
5. **JSONB:** Flexible metadata without migrations
6. **Audit:** All changes tracked with timestamps

### Entity Relationship Diagram

```
┌─────────────┐        ┌──────────────┐
│    User     │───────<│ ChildProfile │
└─────────────┘        └──────────────┘
                              │
                              │ 1:N
                              │
                       ┌──────▼──────────┐
                       │ iep_documents   │ (EXTENDED)
                       │ + extraction    │
                       │ + AI fields     │
                       └──────┬──────────┘
                              │
                    ┌─────────┼──────────────┐
                    │         │              │
                    │ 1:N     │ 1:N          │ 1:N
                    │         │              │
          ┌─────────▼─────┐ ┌▼────────┐  ┌──▼────────┐
          │ goal_progress │ │ services│  │SmartPrompt│
          │ (EXTENDED)    │ └──┬──────┘  │ (EXISTS)  │
          │ + SMART       │    │         └───────────┘
          │ + lineage     │    │ 1:N
          └───────┬───────┘    │
                  │            │
                  │ 1:N    ┌───▼──────────┐
                  │        │ service_logs │
          ┌───────▼──────┐ │ (NEW)        │
          │ progress_    │ └──────────────┘
          │ entries (NEW)│
          └──────────────┘

          ┌─────────────────────────────┐
          │ extraction_corrections (NEW)│
          └─────────────────────────────┘
```

### Core Tables

#### 1. IepDocument

```sql
CREATE TABLE iep_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  uploaded_by_id UUID NOT NULL REFERENCES users(id),
  
  -- File metadata
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Processing status
  status VARCHAR(50) NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'analyzed', 'error')),
  analysis_status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (analysis_status IN ('pending', 'in_progress', 'completed', 'failed')),
  
  -- Extraction review (IEP-01: manual edit)
  extraction_status VARCHAR(50)
    CHECK (extraction_status IN ('pending_review', 'reviewed', 'finalized')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  
  -- Extracted dates (populated by AI)
  iep_start_date DATE,
  iep_end_date DATE,
  iep_meeting_date DATE,
  iep_review_date DATE,
  reevaluation_date DATE,
  
  -- Document classification (STATIC)
  document_type VARCHAR(50)
    CHECK (document_type IN ('iep', 'progress_report', 'evaluation', 'pwn', 'other')),
  school_year VARCHAR(20), -- "2024-2025"
  version INTEGER DEFAULT 1,
  
  -- Extracted content
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  confidence JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_dates CHECK (
    (iep_start_date IS NULL OR iep_end_date IS NULL) OR 
    iep_end_date >= iep_start_date
  )
);

-- Indexes
CREATE INDEX idx_iep_child_id ON iep_documents(child_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_iep_child_year ON iep_documents(child_id, school_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_iep_dates ON iep_documents(child_id, iep_end_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_iep_status ON iep_documents(child_id, status, analysis_status);
CREATE INDEX idx_iep_uploaded_by ON iep_documents(uploaded_by_id, upload_date DESC);
CREATE INDEX idx_iep_metadata ON iep_documents USING gin(metadata);

-- Triggers
CREATE TRIGGER update_iep_document_updated_at
  BEFORE UPDATE ON iep_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 2. ExtractionCorrection

```sql
CREATE TABLE extraction_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES iep_documents(id) ON DELETE CASCADE,
  
  field VARCHAR(255) NOT NULL, -- "metadata.iepEndDate" or "goals[0].baseline"
  original_value JSONB,
  corrected_value JSONB,
  ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  
  corrected_by UUID NOT NULL REFERENCES users(id),
  corrected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_correction_document ON extraction_corrections(document_id, corrected_at DESC);
CREATE INDEX idx_correction_user ON extraction_corrections(corrected_by, corrected_at DESC);
```

#### 3. Goal Progress (Extended)

**Extends existing `goal_progress` table** - see migration `20260201-0002-extend-goal-progress.ts`

New fields added:
```sql
-- Added to existing goal_progress table:
ALTER TABLE goal_progress ADD COLUMN document_id UUID REFERENCES iep_documents(id);
ALTER TABLE goal_progress ADD COLUMN baseline TEXT;
ALTER TABLE goal_progress ADD COLUMN target TEXT;
ALTER TABLE goal_progress ADD COLUMN measurement_method TEXT;
ALTER TABLE goal_progress ADD COLUMN criteria TEXT;
ALTER TABLE goal_progress ADD COLUMN frequency VARCHAR(100);
ALTER TABLE goal_progress ADD COLUMN start_date DATE;
ALTER TABLE goal_progress ADD COLUMN lineage_group UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE goal_progress ADD COLUMN previous_goal_id UUID REFERENCES goal_progress(id);

-- Column renames:
-- goal_name → goal_text
-- goal_description → goal_name  
-- goal_category → domain

-- Existing fields used:
-- id, child_id, user_id, target_date, status, progress_percentage, 
-- current_value (maps to current_level), notes, created_at, updated_at, deleted_at
```

Full schema reference:
```sql
-- goal_progress table structure after migration
CREATE TABLE goals_reference_only (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES iep_documents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Goal identification
  goal_name VARCHAR(255) NOT NULL,
  goal_text TEXT NOT NULL,
  domain VARCHAR(50) NOT NULL
    CHECK (domain IN ('reading', 'math', 'writing', 'behavior', 'social', 
                      'communication', 'motor', 'adaptive', 'other')),
  
  -- SMART criteria
  baseline TEXT,
  target TEXT,
  measurement_method TEXT,
  criteria TEXT,
  frequency VARCHAR(100),
  
  -- Timeline
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  
  -- Current status
  status VARCHAR(50) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'achieved', 'modified', 'discontinued')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_level TEXT,
  
  -- Lineage tracking
  previous_goal_id UUID REFERENCES goals(id),
  lineage_group UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_goal_dates CHECK (target_date >= start_date)
);

CREATE INDEX idx_goal_child ON goals(child_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_goal_document ON goals(document_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_goal_lineage ON goals(lineage_group, start_date);
CREATE INDEX idx_goal_domain ON goals(domain, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_goal_previous ON goals(previous_goal_id) WHERE previous_goal_id IS NOT NULL;

-- NOTE: No triggers - progress_percentage updated via async service method
```

#### 4. ProgressEntry

```sql
CREATE TABLE progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Progress data
  reported_date DATE NOT NULL,
  current_level TEXT NOT NULL,
  progress_value DECIMAL(10,2),
  progress_unit VARCHAR(50),
  
  -- Qualitative
  notes TEXT,
  evidence TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Context
  reported_by UUID NOT NULL REFERENCES users(id),
  reported_by_role VARCHAR(50)
    CHECK (reported_by_role IN ('parent', 'teacher', 'therapist', 'case_manager', 'other')),
  observation_context TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_progress_goal ON progress_entries(goal_id, reported_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_progress_child ON progress_entries(child_id, reported_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_progress_reported_by ON progress_entries(reported_by, reported_date DESC);

-- NOTE: No triggers - use GoalService.updateProgressPercentage() after creating progress entries
```

#### 5. Service & ServiceLog

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES iep_documents(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  
  service_type VARCHAR(100) NOT NULL
    CHECK (service_type IN ('speech_therapy', 'occupational_therapy', 'physical_therapy',
                            'counseling', 'behavior_support', 'transportation', 'other')),
  provider VARCHAR(255),
  
  -- Frequency
  minutes_per_session INTEGER CHECK (minutes_per_session > 0),
  sessions_per_week DECIMAL(3,1) CHECK (sessions_per_week > 0),
  weekly_minutes INTEGER GENERATED ALWAYS AS (minutes_per_session * sessions_per_week) STORED,
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'discontinued', 'completed')),
  
  -- Tracking
  total_sessions_planned INTEGER DEFAULT 0,
  total_sessions_delivered INTEGER DEFAULT 0,
  delivery_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_sessions_planned > 0 
    THEN (total_sessions_delivered::DECIMAL / total_sessions_planned * 100)
    ELSE 0 END
  ) STORED,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_service_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_service_child ON services(child_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_document ON services(document_id) WHERE deleted_at IS NULL;

CREATE TABLE service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  
  session_date DATE NOT NULL,
  minutes_delivered INTEGER CHECK (minutes_delivered >= 0),
  provider VARCHAR(255),
  location VARCHAR(50)
    CHECK (location IN ('resource_room', 'general_ed', 'pull_out', 'push_in', 'teletherapy')),
  
  status VARCHAR(50) NOT NULL
    CHECK (status IN ('completed', 'missed', 'canceled', 'makeup')),
  missed_reason TEXT,
  
  notes TEXT,
  goals_addressed UUID[] DEFAULT ARRAY[]::UUID[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_log_service ON service_logs(service_id, session_date DESC);
CREATE INDEX idx_service_log_child ON service_logs(child_id, session_date DESC);

-- NOTE: No triggers - use ServiceLogService.updateDeliveryStats() after creating service logs
```

#### 6. SmartPrompt

```sql
CREATE TABLE smart_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  
  prompt_type VARCHAR(100) NOT NULL
    CHECK (prompt_type IN ('LIMITED_PROGRESS', 'VAGUE_GOALS', 'SERVICE_REDUCTION',
                           'PWN_MISSING', 'GENERIC_PROGRESS', 'PARENT_CONCERNS_IGNORED',
                           'LRE_CONCERN', 'MISSED_SERVICES', 'IEP_EXIT_PRESSURE',
                           'PROCEDURAL_VIOLATIONS')),
  
  category VARCHAR(50) NOT NULL
    CHECK (category IN ('LEGAL', 'ADVOCACY', 'MEETING_PREP', 'RESOURCE', 'COMPLIANCE')),
  priority VARCHAR(20) NOT NULL
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  
  -- Content
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  legal_context TEXT,
  suggested_questions TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommended_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Evidence
  related_goals UUID[] DEFAULT ARRAY[]::UUID[],
  related_documents UUID[] DEFAULT ARRAY[]::UUID[],
  related_services UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Action
  actionable BOOLEAN DEFAULT true,
  action_url VARCHAR(500),
  action_label VARCHAR(255),
  
  context_data JSONB DEFAULT '{}'::jsonb,
  
  -- User interaction
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_user_active ON smart_prompts(user_id, acknowledged, expires_at)
  WHERE NOT acknowledged AND NOT dismissed;
CREATE INDEX idx_prompt_child ON smart_prompts(child_id, priority, created_at DESC);
CREATE INDEX idx_prompt_priority ON smart_prompts(priority, created_at DESC)
  WHERE NOT acknowledged AND NOT dismissed;
```

#### 7. Materialized Views (Dashboard)

```sql
-- Compliance Health
CREATE MATERIALIZED VIEW dashboard_compliance_health AS
SELECT 
  cp.id AS child_id,
  cp.user_id,
  
  -- Service delivery percentage
  COALESCE(
    SUM(sl.minutes_delivered)::DECIMAL / 
    NULLIF(SUM(s.weekly_minutes * EXTRACT(WEEK FROM (LEAST(NOW()::DATE, s.end_date) - s.start_date))::DECIMAL), 0) * 100,
    0
  ) AS service_delivery_percentage,
  
  -- Missed sessions count
  COUNT(CASE WHEN sl.status = 'missed' THEN 1 END) AS total_missed_sessions,
  
  -- Review status
  CASE 
    WHEN cp.next_iep_review_date < NOW()::DATE THEN 'overdue'
    WHEN cp.next_iep_review_date - NOW()::DATE < 30 THEN 'due_soon'
    ELSE 'on_track'
  END AS review_status,
  
  NOW() AS refreshed_at
FROM child_profiles cp
LEFT JOIN services s ON cp.id = s.child_id AND s.status = 'active' AND s.deleted_at IS NULL
LEFT JOIN service_logs sl ON s.id = sl.service_id
WHERE cp.deleted_at IS NULL
GROUP BY cp.id, cp.user_id, cp.next_iep_review_date;

CREATE UNIQUE INDEX idx_dashboard_compliance_child ON dashboard_compliance_health(child_id);
CREATE INDEX idx_dashboard_compliance_user ON dashboard_compliance_health(user_id);

-- Goal Mastery
CREATE MATERIALIZED VIEW dashboard_goal_mastery AS
SELECT 
  cp.id AS child_id,
  cp.user_id,
  
  COUNT(CASE WHEN g.status = 'achieved' THEN 1 END) AS mastered_goals,
  COUNT(CASE WHEN g.status = 'in_progress' AND g.progress_percentage >= 50 THEN 1 END) AS progressing_goals,
  COUNT(CASE WHEN g.status = 'in_progress' AND g.progress_percentage < 50 THEN 1 END) AS emerging_goals,
  COUNT(CASE WHEN g.status = 'not_started' THEN 1 END) AS not_started_goals,
  
  AVG(g.progress_percentage) AS average_progress,
  
  NOW() AS refreshed_at
FROM child_profiles cp
LEFT JOIN iep_documents doc ON cp.id = doc.child_id 
  AND doc.document_type = 'iep' 
  AND doc.iep_end_date >= NOW()::DATE
  AND doc.deleted_at IS NULL
LEFT JOIN goals g ON doc.id = g.document_id AND g.deleted_at IS NULL
WHERE cp.deleted_at IS NULL
GROUP BY cp.id, cp.user_id;

CREATE UNIQUE INDEX idx_dashboard_goals_child ON dashboard_goal_mastery(child_id);
CREATE INDEX idx_dashboard_goals_user ON dashboard_goal_mastery(user_id);
```

---

## API Design

### Route Structure

```
/api/v1/
├── documents/
│   ├── POST   /upload                    # Upload document
│   ├── GET    /:id                       # Get document metadata
│   ├── POST   /:id/analyze               # Trigger AI analysis (HTTP streaming)
│   ├── GET    /:id/extraction            # Get extraction for review
│   ├── PATCH  /:id/extraction            # Submit corrections
│   ├── POST   /:id/finalize              # Finalize extraction
│   ├── GET    /:id/download              # Download original file
│   └── DELETE /:id                       # Soft delete document
│
├── dashboard/
│   ├── GET    /overview                  # Dashboard summary
│   └── GET    /children/:childId/metrics # Child-specific metrics
│
├── goals/
│   ├── GET    /                          # List goals
│   ├── GET    /:id                       # Get goal detail
│   ├── GET    /:lineageGroupId/history   # Multi-year lineage
│   └── PATCH  /:id                       # Update goal (manual)
│
├── progress/
│   ├── POST   /                          # Log progress entry
│   ├── GET    /goal/:goalId              # Get progress for goal
│   └── DELETE /:id                       # Delete progress entry
│
└── smart-prompts/
    ├── GET    /                          # List active prompts
    ├── POST   /:id/acknowledge           # Acknowledge prompt
    └── POST   /:id/dismiss               # Dismiss prompt
```

### Swagger Documentation

#### POST /api/v1/documents/upload

```yaml
paths:
  /api/v1/documents/upload:
    post:
      tags:
        - Documents
      summary: Upload IEP document
      description: |
        Upload a new IEP document (PDF, DOCX, or TXT). The document will be:
        1. Uploaded to secure cloud storage (GCS)
        2. Queued for AI analysis
        3. Return upload confirmation with document ID
        
        **IEP-01 Requirement:** Parent uploads PDF; system extracts via AI + manual review.
      
      security:
        - BearerAuth: []
      
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - file
                - childId
              properties:
                file:
                  type: string
                  format: binary
                  description: IEP document file (PDF, DOCX, or TXT)
                childId:
                  type: string
                  format: uuid
                  description: UUID of the child this IEP belongs to
      
      responses:
        '201':
          description: Document uploaded successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    properties:
                      documentId:
                        type: string
                        format: uuid
                      fileName:
                        type: string
                      status:
                        type: string
                        enum: [uploaded]
                      analysisStatus:
                        type: string
                        enum: [pending]
                      uploadDate:
                        type: string
                        format: date-time
        
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '413':
          description: File too large (max 10MB)
        '415':
          description: Unsupported file type
```

#### POST /api/v1/documents/:id/analyze (HTTP Streaming)

```yaml
  /api/v1/documents/{id}/analyze:
    post:
      tags:
        - Documents
      summary: Trigger AI document analysis with progress streaming
      description: |
        Analyzes the document using AI extraction. Uses Server-Sent Events (SSE) 
        to stream progress updates in real-time. Long-running operation (30-60s).
        
        **Progress Events:**
        - "Preparing document..."
        - "Downloading document..."
        - "Extracting text from PDF..."
        - "Analyzing with AI (this may take 30-60 seconds)..."
        - "Processing extraction results..."
        - "Analysis complete!"
      
      security:
        - BearerAuth: []
      
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      
      responses:
        '200':
          description: Analysis progress stream (text/event-stream)
          content:
            text/event-stream:
              schema:
                type: string
                example: |
                  data: {"message":"Preparing document..."}
                  
                  data: {"message":"Analyzing with AI..."}
                  
                  data: {"message":"Analysis complete!","documentId":"uuid","status":"completed"}
                  
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          description: Document already being analyzed
```

**Client-Side Usage:**
```typescript
const eventSource = new EventSource('/api/v1/documents/' + docId + '/analyze');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.message);
  
  if (data.status === 'completed') {
    eventSource.close();
    // Redirect to extraction review
  }
};

eventSource.onerror = () => {
  eventSource.close();
  // Handle error
};
```

#### GET /api/v1/documents/:id/extraction

```yaml
  /api/v1/documents/{id}/extraction:
    get:
      tags:
        - Documents
      summary: Get extraction results for review
      description: |
        Retrieve AI extraction results with confidence scores. Parent can review
        before submitting corrections.
        
        **Confidence Indicators:**
        - 🔴 Low (< 0.5): Requires review
        - 🟡 Medium (0.5-0.8): May need review
        - 🟢 High (> 0.8): Likely accurate
      
      security:
        - BearerAuth: []
      
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      
      responses:
        '200':
          description: Extraction results
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      documentId:
                        type: string
                        format: uuid
                      extractionStatus:
                        type: string
                        enum: [pending_review, reviewed, finalized]
                      reviewRequired:
                        type: boolean
                      lowConfidenceFields:
                        type: array
                        items:
                          type: string
                        example: ['goals[0].baseline', 'metadata.iepEndDate']
                      extractedData:
                        type: object
                        properties:
                          metadata:
                            type: object
                            properties:
                              studentName:
                                type: object
                                properties:
                                  value:
                                    type: string
                                  confidence:
                                    type: number
                                  needsReview:
                                    type: boolean
                          goals:
                            type: array
                            items:
                              type: object
```

#### PATCH /api/v1/documents/:id/extraction

```yaml
    patch:
      tags:
        - Documents
      summary: Submit extraction corrections
      description: |
        Parent corrects AI extraction errors. All corrections are logged
        for audit trail and AI improvement.
      
      security:
        - BearerAuth: []
      
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - corrections
              properties:
                corrections:
                  type: array
                  items:
                    type: object
                    required:
                      - field
                      - correctedValue
                    properties:
                      field:
                        type: string
                        example: 'metadata.iepEndDate'
                      originalValue:
                        type: any
                      correctedValue:
                        type: any
                      aiConfidence:
                        type: number
                      reason:
                        type: string
                reviewCompleted:
                  type: boolean
                  description: Mark as reviewed after corrections
      
      responses:
        '200':
          description: Corrections applied
        '400':
          $ref: '#/components/responses/BadRequest'
        '404':
          $ref: '#/components/responses/NotFound'
```

#### GET /api/v1/dashboard/overview

```yaml
  /api/v1/dashboard/overview:
    get:
      tags:
        - Dashboard
      summary: Get dashboard overview
      description: |
        Aggregated metrics for parent dashboard:
        - Compliance Health (service delivery %)
        - Goal Mastery (achieved/progressing/emerging)
        - Active Smart Prompts (action items)
      
      security:
        - BearerAuth: []
      
      parameters:
        - name: childId
          in: query
          schema:
            type: string
            format: uuid
          description: Filter by specific child (optional)
      
      responses:
        '200':
          description: Dashboard data
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: object
                    properties:
                      child:
                        $ref: '#/components/schemas/ChildSummary'
                      complianceHealth:
                        $ref: '#/components/schemas/ComplianceHealth'
                      goalMastery:
                        $ref: '#/components/schemas/GoalMastery'
                      actionItems:
                        type: array
                        items:
                          $ref: '#/components/schemas/SmartPromptSummary'
```

### Request Validation (Zod Schemas)

```typescript
// src/modules/document/document.schema.ts
import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  body: z.object({
    childId: z.string().uuid()
  }),
  file: z.object({
    mimetype: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
    size: z.number().max(10 * 1024 * 1024) // 10MB
  })
});

export const correctionSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    corrections: z.array(z.object({
      field: z.string().min(1),
      originalValue: z.any(),
      correctedValue: z.any(),
      aiConfidence: z.number().min(0).max(1).optional(),
      reason: z.string().optional()
    })),
    reviewCompleted: z.boolean().optional()
  })
});

export const lineageHistorySchema = z.object({
  params: z.object({
    lineageGroupId: z.string().uuid()
  }),
  query: z.object({
    startYear: z.string().regex(/^\d{4}-\d{4}$/).optional(),
    endYear: z.string().regex(/^\d{4}-\d{4}$/).optional()
  })
});
```

---

## Service Layer

### Service Architecture

```typescript
// Open-Closed Principle: New services extend base without modifying
abstract class BaseService {
  constructor(protected logger: ILogger) {}
  
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`${context} failed`, { error });
      throw error;
    }
  }
}
```

### 1. DocumentService

```typescript
// src/modules/document/document.service.ts
import { injectable, inject } from 'tsyringe';
import { IStorageService } from '../../shared/storage/storage.interface';
import { IAiService } from '../../shared/ai/ai.interface';

export class DocumentService extends BaseService {
  constructor(
    private storage: GCS,
    private db: any, // Sequelize instance
    logger: ILogger
  ) {
    super(logger);
  }

  async uploadDocument(
    file: Express.Multer.File,
    childId: string,
    userId: string,
    uploadedById: string
  ): Promise<IepDocument> {
    return this.executeWithErrorHandling(async () => {
      // 1. Validate child belongs to user
      const child = await this.db.childProfiles.findByPk(childId);
      if (!child || child.userId !== userId) {
        throw new ForbiddenError('Access denied to child profile');
      }

      // 2. Generate storage path
      const documentId = uuidv4();
      const ext = this.getExtension(file.mimetype);
      const storagePath = `${userId}/${childId}/${documentId}.${ext}`;

      // 3. Upload to GCS (stream to avoid memory issues)
      await this.storage.uploadStream(
        storagePath,
        file.buffer,
        {
          contentType: file.mimetype,
          metadata: {
            userId,
            childId,
            originalFileName: file.originalname
          }
        }
      );

      // 4. Create DB record
      const document = await this.db.iepDocuments.create({
        id: documentId,
        userId,
        childId,
        uploadedById,
        fileName: `${documentId}.${ext}`,
        originalFileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storagePath,
        uploadDate: new Date(),
        status: 'uploaded',
        analysisStatus: 'pending'
      });

      this.logger.info('Document uploaded', { documentId, childId });
      return document;
    }, 'uploadDocument');
  }

  private getExtension(mimeType: string): string {
    const map = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt'
    };
    return map[mimeType] || 'bin';
  }
}
```

### 2. ExtractionService

```typescript
// src/modules/document/extraction.service.ts
export class ExtractionService extends BaseService {
  constructor(
    private ai: AiService,
    private storage: GCS,
    private db: any,
    logger: ILogger
  ) {
    super(logger);
  }

  async analyzeDocument(documentId: string, res?: Response): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      // Setup HTTP streaming for progress updates
      if (res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }

      const sendProgress = (message: string, data?: any) => {
        if (res) {
          res.write(`data: ${JSON.stringify({ message, ...data })}\n\n`);
        }
      };

      // 1. Update status
      sendProgress('Preparing document...');
      await this.db.iepDocuments.update(
        { status: 'processing', analysisStatus: 'in_progress' },
        { where: { id: documentId } }
      );

      // 2. Download document
      sendProgress('Downloading document...');
      const doc = await this.db.iepDocuments.findByPk(documentId);
      const fileBuffer = await this.storage.download(doc.storagePath);

      // 3. Extract text
      sendProgress('Extracting text from PDF...');
      const text = await this.extractText(fileBuffer, doc.mimeType);

      // 4. AI extraction (call chatAsObject directly)
      sendProgress('Analyzing with AI (this may take 30-60 seconds)...');
      const schema = this.getExtractionSchema();
      const result = await this.ai.chatAsObject({
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this IEP:\n\n${text}` }
        ],
        schema,
        metadata: { temperature: 0.3, model: 'gemini-2.0-flash-exp' }
      });

      const extracted = schema.parse(result.object);

      // 5. Determine document type
      sendProgress('Processing extraction results...');
      const documentType = this.determineDocumentType(extracted);

      // 6. Update document
      await this.db.iepDocuments.update({
        status: 'analyzed',
        analysisStatus: 'completed',
        extractionStatus: 'pending_review',
        content: text,
        metadata: extracted,
        confidence: this.calculateConfidence(extracted),
        documentType,
        schoolYear: this.computeSchoolYear(extracted.metadata.iepStartDate),
        iepStartDate: extracted.metadata.iepStartDate,
        iepEndDate: extracted.metadata.iepEndDate,
        iepMeetingDate: extracted.metadata.iepMeetingDate
      }, { where: { id: documentId } });

      sendProgress('Analysis complete!', { documentId, status: 'completed' });
      if (res) res.end();

      this.logger.info('Document analyzed', { documentId });
    }, 'analyzeDocument');
  }

  private getExtractionSchema() {
    return z.object({
      metadata: z.object({
        documentTypeHint: z.enum(['iep', 'progress_report', 'evaluation', 'pwn', 'other']),
        studentName: z.string().nullable(),
        age: z.number().nullable(),
        grade: z.string().nullable(),
        schoolName: z.string().nullable(),
        iepStartDate: z.string().nullable(),
        iepEndDate: z.string().nullable(),
        // ... rest of schema
      }),
      goals: z.array(z.object({
        description: z.string(),
        baseline: z.string().nullable(),
        target: z.string().nullable(),
        // ... etc
      })),
      services: z.array(z.object({
        serviceType: z.string(),
        minutesPerSession: z.number().nullable(),
        // ... etc
      })),
      // ... rest
    });
  }

  private determineDocumentType(extracted: any): string {
    const hint = extracted.metadata.documentTypeHint;
    if (hint !== 'iep') return hint;
    
    // For IEP docs, don't set current/previous - computed at query time
    return 'iep';
  }
}
```

### 3. CorrectionService

```typescript
// src/modules/document/correction.service.ts
export class CorrectionService extends BaseService {
  constructor(
    private db: any,
    private dashboardService: DashboardService,
    logger: ILogger
  ) {
    super(logger);
  }

  async applyCorrections(
    documentId: string,
    corrections: Correction[],
    userId: string,
    reviewCompleted: boolean
  ): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const doc = await this.db.iepDocuments.findByPk(documentId);
      const metadata = { ...doc.metadata };

      // Apply each correction
      for (const correction of corrections) {
        // Store correction audit
        await this.db.extractionCorrections.create({
          documentId,
          field: correction.field,
          originalValue: this.getNestedValue(metadata, correction.field),
          correctedValue: correction.correctedValue,
          aiConfidence: correction.aiConfidence,
          correctedBy: userId,
          reason: correction.reason
        });

        // Update metadata
        this.setNestedValue(metadata, correction.field, correction.correctedValue);
      }

      // Update document
      const updates: any = { metadata };
      if (reviewCompleted) {
        updates.extractionStatus = 'reviewed';
        updates.reviewedAt = new Date();
        updates.reviewedBy = userId;
      }

      await this.db.iepDocuments.update(updates, { where: { id: documentId } });

      // Refresh dashboard views after data change
      if (reviewCompleted) {
        await this.dashboardService.refreshMaterializedViews();
      }

      this.logger.info('Corrections applied', { documentId, count: corrections.length });
    }, 'applyCorrections');
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => {
      // Handle array notation: goals[0]
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        return acc?.[match[1]]?.[parseInt(match[2])];
      }
      return acc?.[part];
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    const target = parts.reduce((acc, part) => {
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        acc[match[1]] = acc[match[1]] || [];
        acc[match[1]][parseInt(match[2])] = acc[match[1]][parseInt(match[2])] || {};
        return acc[match[1]][parseInt(match[2])];
      }
      acc[part] = acc[part] || {};
      return acc[part];
    }, obj);
    
    const lastMatch = last.match(/^(\w+)\[(\d+)\]$/);
    if (lastMatch) {
      target[lastMatch[1]] = target[lastMatch[1]] || [];
      target[lastMatch[1]][parseInt(lastMatch[2])] = value;
    } else {
      target[last] = value;
    }
  }
}
```

### 4. NormalizationService

```typescript
// src/modules/document/normalization.service.ts
export class NormalizationService extends BaseService {
  constructor(
    private db: any,
    private dashboardService: DashboardService,
    logger: ILogger
  ) {
    super(logger);
  }

  async finalizeExtraction(documentId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const doc = await this.db.iepDocuments.findByPk(documentId);
      
      if (doc.extractionStatus !== 'reviewed') {
        throw new BadRequestError('Document must be reviewed before finalization');
      }

      await this.db.transaction(async (transaction) => {
        // 1. Update document status
        await this.db.iepDocuments.update(
          { extractionStatus: 'finalized' },
          { where: { id: documentId }, transaction }
        );

        // 2. Create normalized Goal records
        await this.createGoals(doc, transaction);

        // 3. Create normalized Service records
        await this.createServices(doc, transaction);

        // 4. Create SmartPrompt records
        await this.createSmartPrompts(doc, transaction);
      });

      // 5. Refresh materialized views after transaction commits
      await this.dashboardService.refreshMaterializedViews();

      this.logger.info('Extraction finalized', { documentId });
    }, 'finalizeExtraction');
  }

  private async createGoals(doc: IepDocument, transaction: any): Promise<void> {
    const goals = doc.metadata.goals || [];
    
    for (const goalData of goals) {
      await this.db.goals.create({
        documentId: doc.id,
        childId: doc.childId,
        userId: doc.userId,
        goalName: goalData.description.substring(0, 255),
        goalText: goalData.description,
        domain: goalData.domain || 'other',
        baseline: goalData.baseline,
        target: goalData.target,
        measurementMethod: goalData.measurementMethod,
        criteria: goalData.criteria,
        frequency: goalData.frequency,
        startDate: doc.iepStartDate || new Date(),
        targetDate: doc.iepEndDate || new Date(),
        status: 'not_started',
        metadata: {
          aiConfidence: goalData.confidence,
          extractionSource: 'ai'
        }
      }, { transaction });
    }
  }

  private async createServices(doc: IepDocument, transaction: any): Promise<void> {
    const services = doc.metadata.services || [];
    
    for (const serviceData of services) {
      const weeklyMinutes = (serviceData.minutesPerSession || 0) * (serviceData.sessionsPerWeek || 0);
      const weeksInPeriod = doc.iepEndDate && doc.iepStartDate
        ? Math.ceil((doc.iepEndDate.getTime() - doc.iepStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        : 52;
      
      await this.db.services.create({
        documentId: doc.id,
        childId: doc.childId,
        serviceType: serviceData.serviceType,
        provider: serviceData.provider,
        minutesPerSession: serviceData.minutesPerSession,
        sessionsPerWeek: serviceData.sessionsPerWeek,
        startDate: doc.iepStartDate || new Date(),
        endDate: doc.iepEndDate || new Date(),
        status: 'active',
        totalSessionsPlanned: Math.ceil(serviceData.sessionsPerWeek * weeksInPeriod),
        metadata: {
          aiConfidence: serviceData.confidence,
          extractionSource: 'ai'
        }
      }, { transaction });
    }
  }

  private async createSmartPrompts(doc: IepDocument, transaction: any): Promise<void> {
    const redFlags = doc.metadata.redFlags || [];
    
    for (const flag of redFlags) {
      await this.db.smartPrompts.create({
        userId: doc.userId,
        childId: doc.childId,
        promptType: flag.type,
        category: this.getCategoryForType(flag.type),
        priority: flag.severity === 'high' ? 'HIGH' : flag.severity === 'medium' ? 'MEDIUM' : 'LOW',
        title: flag.message.substring(0, 500),
        message: flag.message,
        legalContext: flag.legalContext,
        relatedDocuments: [doc.id],
        actionable: true,
        contextData: {
          documentId: doc.id,
          flagType: flag.type,
          severity: flag.severity,
          aiConfidence: flag.confidence
        }
      }, { transaction });
    }
  }
}
```

### 5. GoalService (Async Progress Updates)

```typescript
// src/modules/goal/goal.service.ts
export class GoalService extends BaseService {
  constructor(
    private db: any,
    private dashboardService: DashboardService,
    logger: ILogger
  ) {
    super(logger);
  }

  async createProgressEntry(data: ProgressEntryData): Promise<ProgressEntry> {
    return this.executeWithErrorHandling(async () => {
      const entry = await this.db.progressEntries.create(data);
      
      // Update goal progress percentage asynchronously
      await this.updateProgressPercentage(data.goalId);
      
      // Refresh dashboard views
      await this.dashboardService.refreshMaterializedViews();
      
      return entry;
    }, 'createProgressEntry');
  }

  async updateProgressPercentage(goalId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      // Calculate average progress
      const result = await this.db.progressEntries.findOne({
        where: { goalId, deletedAt: null },
        attributes: [
          [this.db.sequelize.fn('AVG', this.db.sequelize.col('progress_value')), 'avgProgress'],
          [this.db.sequelize.fn('MAX', this.db.sequelize.col('current_level')), 'latestLevel']
        ],
        raw: true
      });

      const progressPercentage = Math.round(result?.avgProgress || 0);
      const currentLevel = result?.latestLevel;

      // Update goal
      await this.db.goals.update(
        { 
          progressPercentage, 
          currentLevel,
          updatedAt: new Date()
        },
        { where: { id: goalId } }
      );

      this.logger.info('Goal progress updated', { goalId, progressPercentage });
    }, 'updateProgressPercentage');
  }

  async deleteProgressEntry(entryId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const entry = await this.db.progressEntries.findByPk(entryId);
      if (!entry) throw new NotFoundError('Progress entry not found');

      await entry.update({ deletedAt: new Date() });
      
      // Recalculate goal progress
      await this.updateProgressPercentage(entry.goalId);
      
      // Refresh dashboard
      await this.dashboardService.refreshMaterializedViews();
    }, 'deleteProgressEntry');
  }
}
```

### 6. ServiceLogService (Async Delivery Stats)

```typescript
// src/modules/service/service-log.service.ts
export class ServiceLogService extends BaseService {
  constructor(
    private db: any,
    private dashboardService: DashboardService,
    logger: ILogger
  ) {
    super(logger);
  }

  async createServiceLog(data: ServiceLogData): Promise<ServiceLog> {
    return this.executeWithErrorHandling(async () => {
      const log = await this.db.serviceLogs.create(data);
      
      // Update service delivery stats asynchronously
      await this.updateDeliveryStats(data.serviceId);
      
      // Refresh dashboard views
      await this.dashboardService.refreshMaterializedViews();
      
      return log;
    }, 'createServiceLog');
  }

  async updateDeliveryStats(serviceId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      // Count completed sessions
      const deliveredCount = await this.db.serviceLogs.count({
        where: { 
          serviceId, 
          status: 'completed'
        }
      });

      // Update service
      await this.db.services.update(
        { 
          totalSessionsDelivered: deliveredCount,
          updatedAt: new Date()
        },
        { where: { id: serviceId } }
      );

      this.logger.info('Service delivery stats updated', { serviceId, deliveredCount });
    }, 'updateDeliveryStats');
  }

  async updateServiceLog(logId: string, updates: Partial<ServiceLogData>): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const log = await this.db.serviceLogs.findByPk(logId);
      if (!log) throw new NotFoundError('Service log not found');

      await log.update(updates);
      
      // Recalculate delivery stats if status changed
      if (updates.status) {
        await this.updateDeliveryStats(log.serviceId);
        await this.dashboardService.refreshMaterializedViews();
      }
    }, 'updateServiceLog');
  }
}
```

### 7. DashboardService

```typescript
// src/modules/dashboard/dashboard.service.ts
export class DashboardService extends BaseService {
  constructor(
    private db: any,
    logger: ILogger
  ) {
    super(logger);
  }
  async getOverview(userId: string, childId?: string): Promise<DashboardOverview> {
    return this.executeWithErrorHandling(async () => {
      const whereClause = childId
        ? { userId, id: childId }
        : { userId, isActive: true };

      const child = await this.db.childProfiles.findOne({
        where: whereClause,
        include: [
          {
            model: this.db.dashboardComplianceHealth,
            as: 'complianceHealth'
          },
          {
            model: this.db.dashboardGoalMastery,
            as: 'goalMastery'
          }
        ]
      });

      if (!child) {
        throw new NotFoundError('Child not found');
      }

      const actionItems = await this.db.smartPrompts.findAll({
        where: {
          userId,
          childId: child.id,
          acknowledged: false,
          dismissed: false,
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gte]: new Date() } }
          ]
        },
        order: [
          [this.db.sequelize.literal(`CASE priority
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
          END`), 'ASC'],
          ['createdAt', 'DESC']
        ],
        limit: 5
      });

      return {
        child: {
          id: child.id,
          name: child.name,
          grade: child.grade,
          school: child.schoolName,
          disabilities: child.disabilities
        },
        complianceHealth: child.complianceHealth,
        goalMastery: child.goalMastery,
        actionItems: actionItems.map(p => ({
          priority: p.priority,
          title: p.title,
          actionLabel: p.actionLabel,
          actionUrl: p.actionUrl
        }))
      };
    }, 'getOverview');
  }

  async refreshMaterializedViews(): Promise<void> {
    await this.db.sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_compliance_health');
    await this.db.sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_goal_mastery');
    this.logger.info('Dashboard views refreshed');
  }
}
```

---

## Integration Points

### Existing Infrastructure Integration

#### 1. GCS Storage Service (Update Existing)

```typescript
// src/shared/storage/gcs.ts (UPDATE EXISTING CLASS)
export class GCS {
  static fromAppEnv(): GCS {
    return new GCS(/* config */);
  }

  // EXISTING METHODS
  async uploadReader(path: string, stream: Readable, options?: any): Promise<void> { /* existing */ }
  async downloadAsBuffer(path: string): Promise<Buffer> { /* existing */ }
  async getSignedUrl(path: string, expiresIn: number): Promise<string> { /* existing */ }

  // ADD THESE CONVENIENCE METHODS
  async uploadStream(
    path: string,
    buffer: Buffer,
    options?: { contentType?: string; metadata?: Record<string, string> }
  ): Promise<void> {
    return this.uploadReader(path, Readable.from(buffer), {
      contentType: options?.contentType,
      metadata: options?.metadata
    });
  }

  async download(path: string): Promise<Buffer> {
    return this.downloadAsBuffer(path);
  }

  async getDownloadUrl(path: string, expiresInSeconds: number = 900): Promise<string> {
    return this.getSignedUrl(path, expiresInSeconds);
  }
}
```

#### 2. AI Service (Use Existing Directly)

```typescript
// src/shared/ai/ai.service.ts (EXISTING - USE AS IS)
export class AiService {
  async chat(/* ... */): Promise<string> { /* existing */ }
  async chatAsObject(/* ... */): Promise<any> { /* existing */ }
  async embed(/* ... */): Promise<number[]> { /* existing */ }
}

// USAGE EXAMPLE: Call chatAsObject directly in services
// No adapter needed - inline the extraction logic where needed:
const result = await aiService.chatAsObject({
  messages: [
    { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
    { role: 'user', content: `Analyze this IEP:\n\n${text}` }
  ],
  schema: extractionSchema,
  metadata: { temperature: 0.3, model: 'gemini-2.0-flash-exp' }
});

const extracted = extractionSchema.parse(result.object);
```

### Overview

Six migrations extend existing tables and create new ones:

1. **20260201-0001-extend-iep-documents.ts** - Add extraction workflow fields
2. **20260201-0002-extend-goal-progress.ts** - Add SMART criteria & lineage
3. **20260201-0003-create-extraction-corrections.ts** - New audit table
4. **20260201-0004-create-progress-entries.ts** - New detailed logs table
5. **20260201-0005-create-services-and-logs.ts** - New services tables
6. **20260201-0006-create-dashboard-views.ts** - Materialized views

### Migration 001: Extend IEP Documents

```typescript
// src/db/migrations/20260201-0001-extend-iep-documents.ts
import type { Migration } from "../umzug.js";
import { DataTypes } from "sequelize";

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  
  // Add extraction workflow columns to EXISTING table
  await queryInterface.addColumn('iep_documents', 'statu
// Instantiate shared dependencies
const storage = GCS.fromAppEnv();
const aiService = new AiService(/* config */);

// Create services with direct dependencies
export const dashboardService = new DashboardService(db, logger);
export const documentService = new DocumentService(storage, db, logger);
export const extractionService = new ExtractionService(aiService, storage, db, logger);
export const correctionService = new CorrectionService(db, dashboardService, logger);
export const normalizationService = new NormalizationService(db, dashboardService, logger);
export const goalService = new GoalService(db, dashboardService, logger);
export const serviceLogService = new ServiceLogService(db, dashboardService, logger);
```

---

## Migration Scripts

### Migration 001: Create Core Tables

```typescript
// src/db/migrations/20260201000001-create-iep-documents.ts
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable('iep_documents', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      child_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'child_profiles', key: 'id' },
        onDelete: 'CASCADE'
      },
      uploaded_by_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
      },
      
      // File metadata
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      original_file_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      storage_path: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true
      },
      upload_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      
      // Processing status
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'uploaded'
      },
      analysis_status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pending'
      },
      
      // Extraction review
      extraction_status: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' }
      },
      
      // Extracted dates
      iep_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      iep_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      iep_meeting_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      iep_review_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      reevaluation_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      
      // Document classification
      document_type: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      school_year: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      
      // Extracted content
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      confidence: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      
      // Audit
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Create indexes
    await queryInterface.addIndex('iep_documents', ['child_id'], {
      name: 'idx_iep_child_id',
      where: { deleted_at: null }
    });
    
    await queryInterface.addIndex('iep_documents', ['child_id', 'school_year'], {
      name: 'idx_iep_child_year',
      where: { deleted_at: null }
    });
    
    await queryInterface.addIndex('iep_documents', ['child_id', 'iep_end_date'], {
      name: 'idx_iep_dates',
      where: { deleted_at: null },
      order: [['iep_end_date', 'DESC']]
    });
    
    await queryInterface.addIndex('iep_documents', ['child_id', 'status', 'analysis_status'], {
      name: 'idx_iep_status'
    });
    
    await queryInterface.addIndex('iep_documents', ['uploaded_by_id', 'upload_date'], {
      name: 'idx_iep_uploaded_by',
      order: [['upload_date', 'DESC']]
    });
    
    // GIN index for JSONB metadata
    await queryInterface.sequelize.query(
      'CREATE INDEX idx_iep_metadata ON iep_documents USING gin(metadata);'
    );
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('iep_documents');
  }
};
```

### Migrations 002-006: See Migration Files

All migrations created in `/src/db/migrations/`:

**Migration 002: Extend Goal Progress**
```typescript
// 20260201-0002-extend-goal-progress.ts
// Adds IEP fields to existing goal_progress table
// - document_id, baseline, target, measurement_method, criteria
// - frequency, start_date, lineage_group, previous_goal_id
// - Renames: goal_name→goal_text, goal_description→goal_name, goal_category→domain
```

**Migration 003: Extraction Corrections**
```typescript
// 20260201-0003-create-extraction-corrections.ts
// NEW TABLE: extraction_corrections
// Audit trail for parent manual corrections
```

**Migration 004: Progress Entries**
```typescript
// 20260201-0004-create-progress-entries.ts
// NEW TABLE: progress_entries
// Detailed evidence-based progress logs with attachments
```

**Migration 005: Services & Logs**
```typescript
// 20260201-0005-create-services-and-logs.ts
// NEW TABLES: services, service_logs
// Related services tracking with delivery stats
// Uses generated columns for delivery_percentage and weekly_minutes
```

**Migration 006: Dashboard Views**
```typescript
// 20260201-0006-create-dashboard-views.ts
// MATERIALIZED VIEWS: dashboard_compliance_health, dashboard_goal_mastery
// Refresh via: REFRESH MATERIALIZED VIEW CONCURRENTLY [view_name]
```
    // Create dashboard_goal_mastery view
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW dashboard_goal_mastery AS
      /* ... full query ... */;
    `);
    
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX idx_dashboard_goals_child 
      ON dashboard_goal_mastery(child_id);
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS dashboard_goal_mastery;');
    await queryInterface.sequelize.query('DROP MATERIALIZED VIEW IF EXISTS dashboard_compliance_health;');
  }
};
```

---

## Deployment

### Environment Variables

```bash
# .env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/iepapp

# GCS Storage (existing)
GCS_BUCKET_NAME=iepapp-documents
GCS_PROJECT_ID=iepapp-prod
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# AI Service (existing)
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# API
API_PORT=3000
API_BASE_URL=https://api.iepapp.com
JWT_SECRET=your-secret-here
```

### Run Migrations

```bash
# Development
npm run db:migrate

# Production (with confirmation)
npm run db:migrate:prod
```

### Materialized View Refresh Strategy

**No scheduled jobs** - views are refreshed on data changes:

```typescript
// Refresh triggers (all async via service methods):
// 1. After document finalization (NormalizationService.finalizeExtraction)
// 2. After corrections marked as reviewed (CorrectionService.applyCorrections)
// 3. After progress entry creation (GoalService.createProgressEntry)
// 4. After service log creation (ServiceLogService.createServiceLog)

// Example in service:
await dashboardService.refreshMaterializedViews();

// Benefits of async approach:
// - No trigger complexity or debugging issues
// - Easy to test and mock
// - Can add retry logic, error handling, logging
// - Can batch multiple updates if needed
// - Clear control flow in application code
```

### Health Check (Update Existing)

```typescript
// src/health/health.routes.ts (UPDATE EXISTING)
// ADD these checks to existing health endpoint:
router.get('/health', async (req, res) => {
  const checks = {
    ...existingChecks, // Keep existing checks
    
    // Add these:
    storage: await checkGCS(),
    ai: await checkGemini(),
    materialized_views: await checkMaterializedViews()
  };
  
  const isHealthy = Object.values(checks).every(c => c.status === 'ok');
  const status = isHealthy ? 200 : 503;
  
  res.status(status).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  });
});

async function checkMaterializedViews(): Promise<{ status: string }> {
  try {
    const result = await db.sequelize.query(
      'SELECT COUNT(*) FROM dashboard_compliance_health',
      { type: QueryTypes.SELECT }
    );
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Upload Success Rate** | > 99% | Monitor upload endpoint errors |
| **AI Extraction Accuracy** | > 90% | Track correction rate |
| **Manual Review Time** | < 3 minutes | Track time from extraction to finalization |
| **Dashboard Load Time** | < 500ms (p95) | API response time monitoring |
| **Lineage Query Time** | < 1s | Query execution time for multi-year data |

---

## Appendix

### Complete Swagger Schema

See [swagger.yaml](../config/swagger/swagger.yaml) for complete API documentation.

### Sample Extraction Prompt

See [ADR-0002](../adr/0002-document-upload-and-ai-extraction.md#prompt-design) for complete AI extraction prompt.

### Related Documentation

- [ADR-0002](../adr/0002-document-upload-and-ai-extraction.md) - Document Upload & AI Extraction
- [ADR-0003](../adr/0003-database-schema-and-dashboard-architecture.md) - Database Schema
- [ADR-0004](../adr/0004-multi-role-access-control.md) - Multi-Role Access (Phase 2)
- [requirements.md](../references/requirements.md) - Product Requirements

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-01  
**Approved By:** Technical Lead  
**Implementation Status:** Ready for Development
