# ADR-0003: Database Schema & Dashboard Architecture

## Status

**Accepted**

## Date

2026-02-01

---

## Context

The dashboard (Advocacy Hub) requires:
1. **Compliance Health:** Track service delivery % vs IEP mandates
2. **Goal Mastery:** Aggregate goal status (Mastered/Progressing/Emerging)
3. **Action Items:** Prioritized next steps based on data patterns
4. **Multi-year Lineage:** Compare progress across IEP cycles
5. **Real-time Updates:** Teachers/therapists log progress → parent sees updates

**Key Requirements from [requirements.md](../references/requirements.md):**
- LC-01: Goal lineage tracking across years
- LC-02: Multi-year trend visualization
- LC-03: Service continuity comparison
- PT-01-06: Progress tracking with evidence
- LA-02: Compliance deadline tracking

This ADR ensures the schema supports both **current dashboard needs** and **long-term scalability** (Phase 2-3).

---

## Decision Summary

### Schema Design Principles

1. **Temporal Data:** Support year-over-year comparison (IEP versions, goal evolution)
2. **Aggregation-Friendly:** Pre-compute common metrics (goal completion %, service delivery %)
3. **Flexible Metadata:** JSONB for extensibility without schema changes
4. **Audit Trail:** All changes tracked with `createdAt`, `updatedAt`, `deletedAt`
5. **Normalization:** Separate concerns (IEP → Goals → Progress → Services)

### Dashboard Query Strategy

**Anti-Pattern:** Real-time aggregation on every page load ❌
**Pattern:** Materialized views + scheduled jobs for dashboard metrics ✅

---

## Core Schema Design

### 1. User & Child Management

```typescript
User {
  id: UUID (PK)
  email: string (unique)
  passwordHash: string
  role: enum (PARENT, ADVOCATE, TEACHER_THERAPIST, ADMIN, SUPPORT)
  status: enum (active, pending, suspended)
  createdAt, updatedAt, deletedAt
}

ChildProfile {
  id: UUID (PK)
  userId: UUID (FK → User) // Parent owner
  name: string
  dateOfBirth: date
  age: integer (computed)
  grade: string
  schoolName: string
  schoolDistrict: string
  
  // Diagnoses (multiple per child)
  disabilities: text[] // ["SLD", "ADHD", "Dyslexia"]
  focusTags: text[] // ["Reading", "Math", "Social Skills"]
  
  // IEP Metadata
  lastIepDate: date
  nextIepReviewDate: date
  reevaluationDueDate: date
  
  // Advocacy State
  advocacyLevel: enum (Beginner, Intermediate, Advanced)
  advocacyBio: text
  primaryGoal: text
  stateContext: string // "California" for state-specific rules
  
  isActive: boolean
  reminderPreferences: jsonb
  createdAt, updatedAt, deletedAt
}
```

**Why `disabilities: text[]`?**
- Supports multiple diagnoses (primary + secondary)
- Future: Can normalize to `Diagnosis` table if needed structured data

---

### 2. IEP Document Management (Lineage)

```typescript
IepDocument {
  id: UUID (PK)
  userId: UUID (FK → User) // Parent owner (child's parent)
  childId: UUID (FK → ChildProfile)
  uploadedById: UUID (FK → User) // Who uploaded (could be parent, advocate, admin)
  
  // File metadata (set during upload)
  fileName: string
  originalFileName: string
  fileSize: integer (bytes)
  mimeType: string ("application/pdf", etc.)
  storagePath: string // GCS path: /{userId}/{childId}/{documentId}.pdf
  uploadDate: timestamp // System timestamp (when uploaded)
  
  // Processing status (set during upload)
  status: enum (uploaded, processing, analyzed, error)
  analysisStatus: enum (pending, in_progress, completed, failed)
  
  // Extraction review status (IEP-01: manual edit requirement)
  extractionStatus: enum (pending_review, reviewed, finalized) | null
  reviewedAt: timestamp | null
  reviewedBy: UUID (FK → User) | null
  
  // ALL fields below populated by AI after extraction
  // IEP Period (CRITICAL for lineage) - extracted from document
  iepStartDate: date | null // AI extracts from doc (e.g., "IEP Date: 09/01/2024")
  iepEndDate: date | null // AI extracts or infers (usually start + 1 year)
  iepMeetingDate: date | null // AI extracts from doc
  iepReviewDate: date | null // AI extracts (annual review date)
  reevaluationDate: date | null // AI extracts (triennial evaluation)
  
  // Document classification (AI inferred, STATIC)
  documentType: enum | null (iep, progress_report, evaluation, pwn, other)
  // NOTE: "current" vs "expired" computed dynamically at query time based on iepEndDate
  schoolYear: string | null // "2024-2025" (computed from iepStartDate after extraction)
  version: integer // For same cycle (1, 2, 3 if amended)
  
  // Extracted content
  content: text | null // Full extracted text (for search)
  metadata: jsonb // ALL AI extraction data (student info, goals, services, red flags, etc.)
  
  // Confidence scores (from AI)
  confidence: jsonb | null // { overall: 0.85, metadata: 0.90, goals: 0.88, services: 0.75 }
  
  createdAt, updatedAt, deletedAt
}

// Indexes for dashboard queries
CREATE INDEX idx_iep_child_year ON iep_documents(child_id, school_year);
CREATE INDEX idx_iep_dates ON iep_documents(iep_start_date, iep_end_date);
CREATE INDEX idx_iep_status ON iep_documents(child_id, status, analysis_status);
CREATE INDEX idx_iep_child_type_date ON iep_documents(child_id, document_type, iep_end_date DESC);

**Query Pattern: Get Current IEP (Dynamic Computation)**

**Key Design Decision:** "current" vs "expired" status is NOT persisted in database.
Instead, it's computed dynamically at query time by comparing `iep_end_date >= NOW()`.

**Why?**
- What's "current" today becomes "expired" tomorrow
- No need for scheduled jobs to update status
- Single source of truth: `iepEndDate` field

```sql
-- Most recent active IEP for a child
SELECT * FROM iep_documents
WHERE child_id = $1
  AND document_type = 'iep'
  AND iep_end_date >= NOW()
ORDER BY iep_end_date DESC
LIMIT 1;

-- All IEPs with computed status
SELECT 
  *,
  CASE 
    WHEN document_type = 'iep' AND iep_end_date >= NOW() THEN 'current'
    WHEN document_type = 'iep' AND iep_end_date < NOW() THEN 'expired'
    ELSE NULL
  END AS iep_status
FROM iep_documents
WHERE child_id = $1
ORDER BY iep_end_date DESC;
```
```

**Data Flow:**

1. **Upload (Minimal Record):**
   ```typescript
   IepDocument.create({
     id: uuid,
     userId, // Parent owner (from ChildProfile)
     childId,
     uploadedById: req.user.id, // Who performed the upload (parent/advocate/admin)
     fileName, fileSize, mimeType, storagePath,
     uploadDate: NOW(),
     status: 'uploaded',
     analysisStatus: 'pending',
     // All other fields: null
   })
   ```

2. **AI Extraction (Populates Fields):**
   ```typescript
   // After AI analysis completes
   IepDocument.update({
     status: 'analyzed',
     analysisStatus: 'completed',
     
     // Extracted dates
     iepStartDate: '2024-09-01',
     iepEndDate: '2025-08-31',
     iepMeetingDate: '2024-09-01',
     schoolYear: '2024-2025', // Computed from iepStartDate
     
     // Inferred type
     documentType: 'current_iep',
     
     // All extracted data in JSONB
     metadata: {
       studentName: "Arjun",
       age: 10,
       grade: "5th",
       schoolName: "Elementary School",
       disabilities: ["SLD", "ADHD"],
       goals: [...],
       services: [...],
       accommodations: [...],
       redFlags: [...],
       summary: "...",
       legalPerspective: "..."
     },
     
     confidence: { overall: 0.85, metadata: 0.90, goals: 0.88 }
   })
   ```

3. **Normalize to Tables (After Parent Review - IEP-01 Manual Edit):**
   ```typescript
   // ONLY create normalized records AFTER parent reviews and finalizes extraction
   // This ensures data accuracy per IEP-01 requirement: "OCR + manual edit"
   
   if (document.extractionStatus === 'finalized') {
     // Create normalized Goal records
     metadata.goals.forEach(goalData => {
       Goal.create({
         documentId,
         childId,
         goalName: goalData.description.slice(0, 100),
         goalText: goalData.description,
         baseline: goalData.baseline,
         target: goalData.target,
         domain: goalData.domain,
         // ... etc
       })
     })
     
     // Create normalized Service records
     metadata.services.forEach(serviceData => {
       Service.create({
         documentId,
         childId,
         serviceType: serviceData.serviceType,
         minutesPerSession: serviceData.minutesPerSession,
         // ... etc
       })
     })
     
     // Create SmartPrompt records
     metadata.redFlags.forEach(redFlag => {
       SmartPrompt.create({
         userId, childId,
         promptType: redFlag.type,
         severity: redFlag.severity,
         message: redFlag.message,
         // ... etc
       })
     })
   }
   ```

4. **Extraction Correction Tracking:**
   ```typescript
   ExtractionCorrection {
     id: UUID (PK)
     documentId: UUID (FK → IepDocument)
     field: string // \"metadata.iepEndDate\" or \"goals[0].baseline\"
     originalValue: jsonb // What AI extracted
     correctedValue: jsonb // What parent corrected to
     aiConfidence: decimal // Original confidence score
     correctedBy: UUID (FK → User)
     correctedAt: timestamp
     reason: text | null
   }
   
   // Example corrections
   await ExtractionCorrection.create({
     documentId: doc.id,
     field: 'goals[0].baseline',
     originalValue: null,
     correctedValue: 'Currently reads at 40 WPM with 60% comprehension',
     aiConfidence: 0.0,
     correctedBy: userId,
     reason: 'AI missed baseline - manually added from page 3'
   });
   ```

**Why `metadata` JSONB?**
- **Schema flexibility:** AI extraction evolves without DB migrations
- **Data preservation:** Keep raw AI output for debugging/reprocessing
- **Correction history:** Original AI extraction preserved alongside parent corrections
- **Audit trail:** Original extraction stored alongside normalized data
- **Confidence tracking:** Per-field confidence scores preserved

**Why separate `schoolYear` and `iepStartDate`?**
- `schoolYear`: For grouping/filtering ("Show 2024-2025 IEP")
- `iepStartDate/EndDate`: For precise date calculations and lineage comparison

---

### 3. Goals (SMART Goals with Baseline/Target)

```typescript
Goal {
  id: UUID (PK)
  documentId: UUID (FK → IepDocument) // Which IEP this goal belongs to
  childId: UUID (FK → ChildProfile) // Denormalized for faster queries
  userId: UUID (FK → User) // Denormalized for access control
  
  // Goal identification
  goalName: string // Short title: "Reading Comprehension"
  goalText: text // Full goal description from IEP
  domain: enum (reading, math, writing, behavior, social, communication, motor, adaptive, other)
  
  // SMART criteria
  baseline: string // "Currently reads at 40 WPM with 60% comprehension"
  target: string // "Read at 80 WPM with 90% comprehension"
  measurementMethod: string // "Running records every 2 weeks"
  criteria: string // "80% accuracy on 4 out of 5 trials"
  frequency: string // "Biweekly"
  
  // Timeline
  startDate: date // Goal start (usually IEP start date)
  targetDate: date // Goal end (usually IEP end date)
  
  // Current status
  status: enum (not_started, in_progress, achieved, modified, discontinued)
  progressPercentage: integer // 0-100 (computed from progress entries)
  currentLevel: string // Latest progress value
  
  // Lineage tracking (CRITICAL for multi-year comparison)
  previousGoalId: UUID (FK → Goal, nullable) // Links to same goal from previous IEP
  lineageGroup: UUID // Groups related goals across years (same UUID for "Reading Comprehension 2023, 2024, 2025")
  
  // Metadata
  notes: text
  metadata: jsonb // AI extraction confidence, red flags, etc.
  
  createdAt, updatedAt, deletedAt
}

// Indexes
CREATE INDEX idx_goal_child_status ON goals(child_id, status);
CREATE INDEX idx_goal_lineage ON goals(lineage_group, start_date);
CREATE INDEX idx_goal_domain ON goals(domain, status);
```

**Lineage Design:**
- `previousGoalId`: Direct parent-child link
- `lineageGroup`: UUID shared by all related goals across years
- Example: "Reading Comprehension" goals from 2023, 2024, 2025 all have same `lineageGroup`

**Why `progressPercentage`?**
- Cached value for fast dashboard queries
- Recomputed via trigger or scheduled job when `ProgressEntry` is added

---

### 4. Progress Tracking (Evidence-Based Updates)

```typescript
ProgressEntry {
  id: UUID (PK)
  goalId: UUID (FK → Goal)
  childId: UUID (FK → ChildProfile) // Denormalized
  userId: UUID (FK → User) // Who logged this (parent/teacher/therapist)
  
  // Progress data
  reportedDate: date // When was this progress observed
  currentLevel: string // "Currently reading at 65 WPM with 75% comprehension"
  progressValue: decimal // Numeric value if quantifiable (65.0 WPM)
  progressUnit: string // "WPM", "%", "trials", etc.
  
  // Qualitative assessment
  notes: text // Teacher notes
  evidence: text[] // URLs to attachments (images, work samples)
  confidenceLevel: enum (low, medium, high) // How confident is this measurement
  
  // Context
  reportedBy: UUID (FK → User) // Teacher/therapist who logged
  reportedByRole: enum (parent, teacher, therapist, case_manager, other)
  observationContext: string // "1:1 reading session", "small group math"
  
  // Metadata
  metadata: jsonb // Custom fields per district
  
  createdAt, updatedAt, deletedAt
}

// Indexes
CREATE INDEX idx_progress_goal_date ON progress_entries(goal_id, reported_date DESC);
CREATE INDEX idx_progress_child ON progress_entries(child_id, reported_date DESC);
```

**Why separate `progressValue` and `currentLevel`?**
- `currentLevel`: Human-readable text for display
- `progressValue`: Numeric for calculations and trend charts

---

### 5. Services (Related Services Tracking)

```typescript
Service {
  id: UUID (PK)
  documentId: UUID (FK → IepDocument) // Which IEP mandates this service
  childId: UUID (FK → ChildProfile)
  
  // Service definition
  serviceType: enum (speech_therapy, occupational_therapy, physical_therapy, 
                     counseling, behavior_support, transportation, other)
  provider: string // "Speech Therapist", "OT"
  
  // Frequency mandate
  minutesPerSession: integer // 30
  sessionsPerWeek: decimal // 2.0
  weeklyMinutes: integer // 60 (computed: minutesPerSession * sessionsPerWeek)
  
  // Timeline
  startDate: date
  endDate: date
  
  // Status
  status: enum (active, suspended, discontinued, completed)
  
  // Delivery tracking
  totalSessionsPlanned: integer // Over IEP period
  totalSessionsDelivered: integer // Actual sessions logged
  deliveryPercentage: decimal // Computed: (delivered / planned) * 100
  
  notes: text
  metadata: jsonb
  
  createdAt, updatedAt, deletedAt
}

ServiceLog {
  id: UUID (PK)
  serviceId: UUID (FK → Service)
  childId: UUID (FK → ChildProfile)
  
  // Session details
  sessionDate: date
  minutesDelivered: integer
  provider: string
  location: enum (resource_room, general_ed, pull_out, push_in, teletherapy)
  
  // Status
  status: enum (completed, missed, canceled, makeup)
  missedReason: string // If missed: "Student absent", "No staff available"
  
  // Notes
  notes: text
  goals_addressed: UUID[] // Which goals were worked on
  
  createdAt, updatedAt
}

// Indexes
CREATE INDEX idx_service_child_status ON services(child_id, status);
CREATE INDEX idx_service_log_date ON service_logs(service_id, session_date DESC);
```

**Compliance Health Calculation:**
```sql
SELECT 
  child_id,
  SUM(minutes_delivered) / SUM(weekly_minutes * weeks_in_period) * 100 AS delivery_percentage
FROM services s
JOIN service_logs sl ON s.id = sl.service_id
WHERE s.status = 'active'
GROUP BY child_id;
```

---

### 6. Smart Prompts & Action Items

```typescript
SmartPrompt {
  id: UUID (PK)
  userId: UUID (FK → User)
  childId: UUID (FK → ChildProfile)
  
  // Prompt type (from requirements.md)
  promptType: enum (
    LIMITED_PROGRESS,
    VAGUE_GOALS,
    SERVICE_REDUCTION,
    PWN_MISSING,
    GENERIC_PROGRESS,
    PARENT_CONCERNS_IGNORED,
    LRE_CONCERN,
    MISSED_SERVICES,
    IEP_EXIT_PRESSURE,
    PROCEDURAL_VIOLATIONS
  )
  
  category: enum (LEGAL, ADVOCACY, MEETING_PREP, RESOURCE, COMPLIANCE)
  priority: enum (LOW, MEDIUM, HIGH, URGENT)
  
  // Content
  title: string // "Goal is not SMART"
  message: text // Parent-friendly explanation
  legalContext: text // IDEA reference (34 CFR § 300.320)
  suggestedQuestions: text[] // Questions to ask at IEP meeting
  recommendedActions: text[] // "Request IEP Meeting", "Download Evidence"
  
  // Evidence links
  relatedGoals: UUID[] // Goals triggering this prompt
  relatedDocuments: UUID[] // Documents involved
  relatedServices: UUID[] // Services involved
  
  // Action
  actionable: boolean // Can parent take action now?
  actionUrl: string // Deep link: "/letters/pwn-request"
  actionLabel: string // "Generate PWN Request Email"
  
  // Context data (trigger details)
  contextData: jsonb // { goalId, missingFields: ["baseline", "criteria"], aiConfidence: 0.85 }
  
  // User interaction
  acknowledged: boolean
  acknowledgedAt: timestamp
  dismissed: boolean
  dismissedAt: timestamp
  expiresAt: timestamp // Time-sensitive prompts
  
  createdAt, updatedAt
}

// Indexes
CREATE INDEX idx_prompt_user_active ON smart_prompts(user_id, acknowledged, expires_at);
CREATE INDEX idx_prompt_priority ON smart_prompts(child_id, priority, created_at DESC);
```

---

### 7. Dashboard Aggregations (Materialized Views)

**Problem:** Real-time aggregation on every dashboard load is slow.

**Solution:** Materialized views refreshed hourly or on-demand.

```sql
-- Compliance Health Summary
CREATE MATERIALIZED VIEW dashboard_compliance_health AS
SELECT 
  c.id AS child_id,
  c.user_id,
  
  -- Service delivery
  COALESCE(
    SUM(sl.minutes_delivered) / NULLIF(SUM(s.weekly_minutes * 
      EXTRACT(WEEK FROM (LEAST(NOW(), s.end_date) - s.start_date))), 0) * 100,
    0
  ) AS service_delivery_percentage,
  
  -- Missed sessions
  COUNT(CASE WHEN sl.status = 'missed' THEN 1 END) AS total_missed_sessions,
  
  -- Timeline compliance
  CASE 
    WHEN c.next_iep_review_date < NOW() THEN 'overdue'
    WHEN c.next_iep_review_date - NOW() < INTERVAL '30 days' THEN 'due_soon'
    ELSE 'on_track'
  END AS review_status,
  
  NOW() AS refreshed_at
FROM child_profiles c
LEFT JOIN services s ON c.id = s.child_id AND s.status = 'active'
LEFT JOIN service_logs sl ON s.id = sl.service_id
GROUP BY c.id, c.user_id, c.next_iep_review_date;

CREATE INDEX idx_dashboard_compliance_user ON dashboard_compliance_health(user_id);

-- Goal Mastery Summary
CREATE MATERIALIZED VIEW dashboard_goal_mastery AS
SELECT 
  c.id AS child_id,
  c.user_id,
  
  -- Current IEP goals
  COUNT(CASE WHEN g.status = 'achieved' THEN 1 END) AS mastered_goals,
  COUNT(CASE WHEN g.status = 'in_progress' AND g.progress_percentage >= 50 THEN 1 END) AS progressing_goals,
  COUNT(CASE WHEN g.status = 'in_progress' AND g.progress_percentage < 50 THEN 1 END) AS emerging_goals,
  COUNT(CASE WHEN g.status = 'not_started' THEN 1 END) AS not_started_goals,
  
  -- Overall progress
  AVG(g.progress_percentage) AS average_progress,
  
  NOW() AS refreshed_at
FROM child_profiles c
LEFT JOIN iep_documents d ON c.id = d.child_id AND d.document_type = 'current_iep'
LEFT JOIN goals g ON d.id = g.document_id AND g.deleted_at IS NULL
GROUP BY c.id, c.user_id;

CREATE INDEX idx_dashboard_goals_user ON dashboard_goal_mastery(user_id);

-- Action Items (Active Smart Prompts)
CREATE MATERIALIZED VIEW dashboard_action_items AS
SELECT 
  sp.user_id,
  sp.child_id,
  sp.priority,
  sp.prompt_type,
  sp.title,
  sp.action_label,
  sp.action_url,
  sp.created_at
FROM smart_prompts sp
WHERE sp.acknowledged = FALSE
  AND sp.dismissed = FALSE
  AND (sp.expires_at IS NULL OR sp.expires_at > NOW())
ORDER BY 
  CASE sp.priority
    WHEN 'URGENT' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  sp.created_at DESC;

CREATE INDEX idx_dashboard_actions_user ON dashboard_action_items(user_id, child_id);
```

**Refresh Strategy:**
```sql
-- Refresh on-demand (after data change)
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_compliance_health;

-- Scheduled refresh (cron job every hour)
-- Or trigger-based refresh when relevant tables change
```

---

## Dashboard API Endpoints

### GET /api/v1/dashboard/overview

**Query:**
```sql
SELECT 
  -- Child info
  c.id AS child_id,
  c.name AS child_name,
  c.grade,
  c.school_name,
  c.disabilities,
  
  -- Compliance health
  ch.service_delivery_percentage,
  ch.total_missed_sessions,
  ch.review_status,
  
  -- Goal mastery
  gm.mastered_goals,
  gm.progressing_goals,
  gm.emerging_goals,
  gm.average_progress,
  
  -- Action items (top 5)
  (
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'priority', priority,
        'title', title,
        'actionLabel', action_label,
        'actionUrl', action_url
      )
    )
    FROM dashboard_action_items
    WHERE user_id = $1 AND child_id = c.id
    LIMIT 5
  ) AS action_items

FROM child_profiles c
LEFT JOIN dashboard_compliance_health ch ON c.id = ch.child_id
LEFT JOIN dashboard_goal_mastery gm ON c.id = gm.child_id
WHERE c.user_id = $1 AND c.is_active = TRUE;
```

**Response:**
```json
{
  "success": true,
  "data": {
    "child": {
      "id": "uuid",
      "name": "HJH",
      "grade": "3rd",
      "school": "Elementary School",
      "disabilities": ["SLD"]
    },
    "complianceHealth": {
      "serviceDeliveryPercentage": 0,
      "missedSessions": 5,
      "reviewStatus": "due_soon",
      "message": "Service delivery gap detected. Documentation required."
    },
    "goalMastery": {
      "mastered": 0,
      "progressing": 0,
      "emerging": 0,
      "averageProgress": 0
    },
    "actionItems": [
      {
        "priority": "HIGH",
        "title": "Goal is not SMART",
        "actionLabel": "Request Goal Revision",
        "actionUrl": "/letters/goal-revision-request"
      }
    ]
  }
}
```

---

## Lineage Comparison (Multi-Year Trends)

### GET /api/v1/goals/:lineageGroupId/history

**Query:**
```sql
SELECT 
  g.id,
  g.goal_name,
  g.baseline,
  g.target,
  g.current_level,
  g.progress_percentage,
  g.status,
  d.school_year,
  d.iep_start_date,
  d.iep_end_date,
  
  -- Progress entries for this goal
  (
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'date', pe.reported_date,
        'value', pe.progress_value,
        'notes', pe.notes
      ) ORDER BY pe.reported_date
    )
    FROM progress_entries pe
    WHERE pe.goal_id = g.id
  ) AS progress_history

FROM goals g
JOIN iep_documents d ON g.document_id = d.id
WHERE g.lineage_group = $1
ORDER BY d.iep_start_date ASC;
```

**Response (Multi-Year Chart Data):**
```json
{
  "lineageGroup": "uuid-reading-comprehension",
  "goalName": "Reading Comprehension",
  "history": [
    {
      "schoolYear": "2023-2024",
      "baseline": "40 WPM, 60% comprehension",
      "target": "60 WPM, 80% comprehension",
      "achieved": "58 WPM, 78% comprehension",
      "status": "achieved",
      "progressData": [
        { "date": "2023-09-01", "value": 40 },
        { "date": "2023-11-01", "value": 48 },
        { "date": "2024-02-01", "value": 55 },
        { "date": "2024-05-01", "value": 58 }
      ]
    },
    {
      "schoolYear": "2024-2025",
      "baseline": "58 WPM, 78% comprehension",
      "target": "80 WPM, 90% comprehension",
      "achieved": "65 WPM, 82% comprehension",
      "status": "in_progress",
      "progressData": [
        { "date": "2024-09-01", "value": 58 },
        { "date": "2024-11-01", "value": 62 },
        { "date": "2025-01-01", "value": 65 }
      ]
    }
  ]
}
```

---

## Scalability Considerations

### Performance Optimizations

1. **Partitioning:**
   ```sql
   -- Partition IepDocuments by school_year for archival
   CREATE TABLE iep_documents_2024 PARTITION OF iep_documents
   FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
   ```

2. **Indexes:**
   - Composite indexes on common query patterns (child_id + date range)
   - Partial indexes on active records (WHERE deleted_at IS NULL)

3. **Caching:**
   - Redis for dashboard metrics (5-minute TTL)
   - Invalidate on write (when progress/service log added)

4. **Read Replicas:**
   - Dashboard queries → read replica
   - Write operations → primary DB

### Data Retention

```sql
-- Archive old IEPs after 7 years (FERPA requirement)
CREATE TABLE iep_documents_archive AS 
SELECT * FROM iep_documents WHERE iep_end_date < NOW() - INTERVAL '7 years';

-- Soft delete + hard delete after retention period
DELETE FROM iep_documents WHERE deleted_at < NOW() - INTERVAL '7 years';
```

---

## Migration Strategy

**Phase 1 (Current):**
- Core tables: User, ChildProfile, IepDocument, Goal, ProgressEntry, Service
- Basic dashboard: Compliance health, Goal status
- Materialized views for aggregations

**Phase 2:**
- Add lineage tracking: `previousGoalId`, `lineageGroup` to Goals
- Service logs for compliance tracking
- Smart prompts generation

**Phase 3:**
- Partitioning for large datasets
- Read replicas for scaling
- Advanced analytics (regression analysis, predictive alerts)

---

## Trade-Offs

| Decision | Benefit | Trade-Off |
|----------|---------|-----------|
| **Materialized views** | Fast dashboard loads | Eventual consistency (stale data) |
| **Denormalized childId in Goal** | Faster queries | Data redundancy |
| **JSONB metadata** | Schema flexibility | Harder to query/index |
| **Lineage via UUID** | Simple implementation | Manual maintenance if goals renamed |
| **Weekly aggregation** | Lower DB load | Not real-time (acceptable for dashboards) |

---

## Success Metrics

- ✅ Dashboard loads < 500ms (p95)
- ✅ Lineage comparison < 1s for 5+ years
- ✅ Supports 10K+ active children per instance
- ✅ Compliance health accuracy > 95%
- ✅ Zero data loss on schema migrations

---

## References

- [requirements.md](../references/requirements.md) - Product requirements
- [systemarchitecture.md](../systemarchitecture.md) - Infrastructure
- [0002-document-upload-and-ai-extraction.md](./0002-document-upload-and-ai-extraction.md) - Document processing

---

**Final Note:** This schema balances **current needs** (dashboard) with **future scalability** (lineage, analytics). All design decisions support the Phase 1-3 roadmap from requirements.md.
