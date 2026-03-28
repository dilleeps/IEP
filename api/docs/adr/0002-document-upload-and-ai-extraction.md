# ADR-0002: Document Upload & AI Extraction Architecture

## Status

**Accepted**

## Date

2026-02-01

---

## Context

The IEP AI Analyzer feature allows parents to:
1. Upload IEP documents (PDF, Word, Text)
2. Get AI-powered analysis showing:
   - Plain-language summary
   - Extracted goals with baselines and targets
   - Advocacy red flags (missing data, vague goals, etc.)
   - Legal perspective on IDEA compliance
3. Store documents in a repository for historical tracking

This ADR documents the architectural decisions for **document upload, storage, and AI extraction only**.

### Mandatory Fields (Upload)

Based on [requirements.md](../references/requirements.md):
- **IEP-01:** "Parent uploads PDF; app extracts key sections (OCR + manual edit)"
  - AI extraction is PRIMARY method
  - Manual correction is REQUIRED for low-confidence fields or extraction errors
- **Zero manual metadata at UPLOAD** → Parent only provides file + childId
- **Manual correction AFTER extraction** → Parent reviews and edits extracted data

**Required at upload time:**
1. `file` (PDF/DOCX/TXT) - REQUIRED
2. `childId` (which child's IEP) - REQUIRED

**AI extracts (then parent can manually correct):**
- Student name, age, grade, school
- IEP dates (start, end, meeting, review)
- Goals (with baselines, targets, measurement)
- Services (minutes, frequency, provider)
- Accommodations, placement, progress reporting
- Red flags and legal perspective

**Manual Correction Flow:**
1. AI completes extraction → marks low-confidence fields
2. Parent reviews extraction results in UI
3. Parent edits incorrect/missing fields
4. System tracks corrections (original AI value vs parent-corrected value)
5. Corrections improve future AI accuracy (feedback loop)

### Document Type Classification

**Problem:** IEP documents don't explicitly state "I am current" or "I am previous".

**Solution:** Two-phase classification:

**Phase 1: AI Extracts Dates**
```json
{
  "iepStartDate": "2024-09-01",
  "iepEndDate": "2025-08-31"
}
```

**Phase 2: Business Logic Determines Type**
```typescript
// After AI extraction completes
const today = new Date();
const iepEndDate = new Date(extractedData.metadata.iepEndDate);

let documentType;
if (!extractedData.metadata.iepEndDate) {
  documentType = 'other'; // Can't determine
} else if (iepEndDate >= today) {
  documentType = 'current_iep'; // Still active
} else {
  documentType = 'previous_iep'; // Expired
}

// If child has multiple IEPs, compare:
const otherIeps = await IepDocument.findAll({ childId });
const mostRecentIep = otherIeps.sort((a, b) => b.iepEndDate - a.iepEndDate)[0];

if (mostRecentIep.id === currentDoc.id) {
  documentType = 'current_iep'; // This is the latest
} else {
  // Mark previous docs as 'previous_iep'
  await IepDocument.update({ documentType: 'previous_iep' }, {
    where: { childId, id: { [Op.ne]: mostRecentIep.id } }
  });
}
```

**Classification Rules:**
1. `current_iep`: `iepEndDate >= today` AND is latest for child
2. `previous_iep`: `iepEndDate < today` OR newer IEP uploaded
3. `progress_report`: AI detects "Progress Report" in title/content
4. `evaluation`: AI detects "Evaluation" / "Assessment" keywords
5. `pwn`: AI detects "Prior Written Notice" keywords
6. `other`: Cannot determine type

---

## Decision Summary

### Storage: Google Cloud Storage (GCS)
- **Why:** Secure, scalable, FERPA-compliant
- **Structure:** `/{userId}/{childId}/{documentId}.{ext}`
- **Access:** Private buckets with signed URLs for downloads
- **Lifecycle:** 7-year retention (FERPA requirement)

### AI: Google Gemini
- **Model:** `gemini-2.0-flash-exp`
- **Purpose:** Extract structured data from unstructured IEP documents
- **Temperature:** `0.3` (low for extraction accuracy)
- **Constraints:** AI interprets but never invents data

### API Design
```
POST /api/v1/documents/upload         → Upload + store in GCS
POST /api/v1/documents/:id/analyze    → Run AI extraction
GET  /api/v1/documents/:id/analysis   → Get analysis results
GET  /api/v1/documents/:id/download   → Download original file
```

---

## Architecture

### Upload Flow

```
User → Upload PDF/DOCX/TXT
   ↓
API validates file (type, size)
   ↓
Store in GCS: /{userId}/{childId}/{documentId}.pdf
   ↓
Save metadata to PostgreSQL (Document table)
   ↓
Return { documentId, status: "uploaded" }
```

**Implementation:**
- `DocumentController.uploadDocument()` handles multipart upload
- `GCS.uploadReader()` streams file to Cloud Storage
- No file stored on local disk (direct stream to GCS)

---

### AI Analysis Flow

```
User → Request analysis (POST /documents/:id/analyze)
   ↓
Fetch document from GCS
   ↓
Send to Gemini with extraction prompt
   ↓
Parse response into structured format:
   {
     summary: "Plain-language overview",
     goals: [{ description, baseline, target, measurementMethod }],
     redFlags: [{ type, severity, message, legalContext }],
     legalPerspective: "IDEA compliance notes"
   }
   ↓
Store analysis in DocumentAnalysis table
   ↓
Return analysis to UI
```

**Key Decision: Hybrid Extraction**
- **OCR (if needed):** Use Gemini's vision capabilities for scanned PDFs
- **LLM Extraction:** Parse text into structured JSON
- **Validation:** Zod schema ensures response matches expected format
- **Confidence Scores:** Low-confidence fields flagged for manual review

---

## Prompt Design

### Extraction Prompt Structure

```typescript
const extractionPrompt = `
You are an IEP document analyzer. Extract ALL structured information from this IEP document.

## Document Metadata (if present in document)
- **Document type hint:** What kind of document is this? Options:
  - "iep" (full IEP document)
  - "progress_report" (periodic update on student progress)
  - "evaluation" (psychological/educational evaluation)
  - "pwn" (Prior Written Notice)
  - "other" (cannot determine)
- Student name
- Age / Grade
- School name / District
- Primary disability / eligibility category
- Secondary disabilities (if any)
- IEP meeting date (if mentioned)
- IEP start date (if mentioned - often implicit as "annual IEP from [date]")
- IEP end date / review date (if mentioned - usually 1 year from start)
- IEP team members (names, roles, contact info if present)

## Document Type Hints (for classification)
- Document title (e.g., "Individualized Education Program", "Progress Report", "Prior Written Notice")
- Keywords indicating type ("Annual IEP", "Evaluation Report", "PWN", "Progress Monitoring")
- Date context (e.g., "This IEP is effective from 9/1/2024 to 8/31/2025")

## Present Levels (PLAAFP)
- Current academic performance levels
- Current functional performance
- How disability affects progress in general curriculum

## Annual Goals
For each goal, extract:
- Description (exact text from document)
- Baseline (current performance level - e.g., "reads 40 WPM with 60% comprehension")
- Target (expected achievement - e.g., "80 WPM with 90% comprehension")
- Measurement method (how progress is measured - e.g., "running records every 2 weeks")
- Measurement criteria (how success is defined - e.g., "80% accuracy on 4 out of 5 trials")
- Frequency (how often measured - e.g., "biweekly", "quarterly")
- Domain (reading, math, writing, behavior, social, communication, motor, adaptive, other)
- Confidence (low/medium/high - based on data completeness)

## Services (Related Services & Special Education)
For each service:
- Service type (speech therapy, OT, PT, counseling, behavior support, etc.)
- Provider (role - e.g., "Speech Therapist", "OT")
- Minutes per session
- Sessions per week
- Location (resource room, general ed, pull-out, push-in)
- Start date / End date (if mentioned)

## Accommodations & Modifications
- List all accommodations (e.g., "extended time", "small group testing")
- List modifications (changes to curriculum expectations)

## Placement & LRE
- Current placement (general ed %, special ed %)
- LRE justification (if provided)
- Removal from general ed reasoning (if provided)

## Progress Reporting
- How often parents receive progress updates
- Format of updates (e.g., "quarterly reports", "weekly data sheets")

## Advocacy Red Flags (Compliance Issues)
Identify issues parents should know about:
- Vague goals (missing baseline, target, or measurement method)
- Subjective progress language ("making progress", "doing well")
- Missing SMART criteria (not Specific, Measurable, Achievable, Relevant, Time-bound)
- Missing SLD-specific interventions
- Potential under-service (low minutes for significant needs)
- Missing baseline data
- No measurement frequency specified
- Service reduction without regression data
- LRE concerns (removal without justification)

For each flag:
- Type (goal_not_smart, subjective_progress, missing_baseline, service_reduction, lre_concern, etc.)
- Severity (low, medium, high)
- Message (parent-friendly explanation)
- Legal context (IDEA reference if applicable - e.g., "34 CFR § 300.320")

## Plain-Language Summary
Provide a 2-3 sentence parent-friendly summary of this IEP:
- What is the child eligible for?
- What are the main goals?
- What services are provided?
- Any major concerns or red flags?

## Legal Perspective
Provide IDEA compliance notes (informational, not legal advice):
- Are goals measurable under 34 CFR § 300.320?
- Is progress monitoring sufficient?
- Are services appropriate for needs?
- Are there LRE concerns?

## Confidence Scores
For each section, provide confidence level (0.0 to 1.0):
- metadata: 0.0-1.0
- goals: 0.0-1.0
- services: 0.0-1.0
- redFlags: 0.0-1.0

Return valid JSON matching this schema:
{
  "metadata": {
    "studentName": string | null,
    "age": number | null,
    "grade": string | null,
    "schoolName": string | null,
    "schoolDistrict": string | null,
    "primaryDisability": string | null,
    "secondaryDisabilities": string[] | null,
    "iepMeetingDate": string | null, // ISO date if found
    "iepStartDate": string | null, // ISO date if found
    "iepEndDate": string | null, // ISO date if found
    "teamMembers": [{ name, role, contact }] | null,
    "documentTypeHint": string | null // "iep", "progress_report", "evaluation", "pwn", "other" (based on title/keywords)
  },
  "presentLevels": string,
  "goals": [{
    description: string,
    baseline: string | null,
    target: string | null,
    measurementMethod: string | null,
    criteria: string | null,
    frequency: string | null,
    domain: string,
    confidence: "low" | "medium" | "high"
  }],
  "services": [{
    serviceType: string,
    provider: string | null,
    minutesPerSession: number | null,
    sessionsPerWeek: number | null,
    location: string | null
  }],
  "accommodations": string[],
  "placement": {
    currentPlacement: string | null,
    lreJustification: string | null
  },
  "progressReporting": {
    frequency: string | null,
    format: string | null
  },
  "redFlags": [{
    type: string,
    severity: "low" | "medium" | "high",
    message: string,
    legalContext: string | null
  }],
  "summary": string,
  "legalPerspective": string,
  "confidence": {
    metadata: number,
    goals: number,
    services: number,
    redFlags: number
  }
}

If data is unclear or missing, set to null and mark confidence as "low".
Do NOT invent data - only extract what is explicitly in the document.
`;
```

---

## Data Model

### Document Table
```typescript
Document {
  id: UUID
  userId: UUID (owner - parent)
  childId: UUID (which child's IEP)
  fileName: string ("IEP_2024.pdf")
  fileType: enum (PDF, DOCX, TXT)
  fileSize: number (bytes)
  gcsPath: string ("/{userId}/{childId}/{documentId}.pdf")
  uploadedAt: timestamp
  status: enum (uploaded, analyzing, analyzed, error)
}
```

### DocumentAnalysis Table
```typescript
DocumentAnalysis {
  id: UUID
  documentId: UUID
  summary: text (plain-language overview)
  goals: JSONB (array of extracted goals)
  redFlags: JSONB (array of advocacy alerts)
  legalPerspective: text (IDEA compliance notes)
  confidence: JSONB ({ overall: 0.85, goals: 0.90, redFlags: 0.80 })
  analyzedAt: timestamp
  model: string ("gemini-2.0-flash-exp")
}
```

---

## UI Components (API Responses)

### Upload Response
```json
{
  "success": true,
  "data": {
    "documentId": "uuid-123",
    "fileName": "IEP_2024.pdf",
    "status": "uploaded",
    "analysisStatus": "pending",
    "uploadDate": "2026-02-01T12:00:00Z"
  }
}
```

**Parent receives notification when analysis completes** (via webhook, polling, or WebSocket).

### Analysis Response (for UI screens shown)
```json
{
  "success": true,
  "data": {
    "documentId": "uuid-123",
    "status": "analyzed",
    "analysisStatus": "completed",
    
    // Extracted metadata (from document)
    "metadata": {
      "studentName": "Arjun",
      "age": 10,
      "grade": "5th",
      "schoolName": "Elementary School",
      "schoolDistrict": "District Name",
      "primaryDisability": "Specific Learning Disability (SLD)",
      "secondaryDisabilities": ["ADHD"],
      "iepMeetingDate": "2024-09-01",
      "iepStartDate": "2024-09-01",
      "iepEndDate": "2025-08-31",
      "teamMembers": [
        { "name": "Ms. Smith", "role": "Case Manager", "contact": "smith@school.edu" }
      ]
    },
    
    // Inferred document classification
    "documentType": "current_iep",
    "schoolYear": "2024-2025",
    
    // Plain-language summary
    "summary": "This IEP identifies Arjun's eligibility under Specific Learning Disability (SLD) but fails to provide specific details on how the school will help him catch up. It lacks clear starting point (baseline) and measurable targets.",
    
    // Extracted goals
    "goals": [
      {
        "description": "Improve reading comprehension",
        "baseline": null,
        "target": null,
        "measurementMethod": null,
        "criteria": null,
        "frequency": null,
        "domain": "reading",
        "confidence": "low",
        "issues": ["not SMART", "missing baseline", "missing target", "no measurement method"]
      }
    ],
    
    // Extracted services
    "services": [
      {
        "serviceType": "Resource Room Support",
        "provider": null,
        "minutesPerSession": null,
        "sessionsPerWeek": null,
        "weeklyMinutes": 180,
        "location": "Resource Room"
      }
    ],
    
    // Advocacy red flags
    "redFlags": [
      {
        "type": "goal_not_smart",
        "severity": "high",
        "message": "Goal is not SMART: 'Will improve reading comprehension' is a statement of intent, not a measurable goal. It lacks a baseline and a specific target (e.g., 80% accuracy).",
        "legalContext": "IDEA requires measurable annual goals (34 CFR § 300.320)"
      },
      {
        "type": "subjective_progress",
        "severity": "medium",
        "message": "Subjective Progress Reporting: Phrases like 'Making progress' and 'Progress is observed' contain zero data. Legally, progress must be measured against the goal's criteria.",
        "legalContext": "Progress must be objective and data-driven"
      },
      {
        "type": "missing_baseline",
        "severity": "high",
        "message": "Missing Baseline: There is no mention of Arjun's current reading level (e.g., DRA level, words per minute, or Lexile), making it impossible to measure growth.",
        "legalContext": "Baseline data required to measure progress"
      }
    ],
    
    // Legal perspective
    "legalPerspective": "Under IDEA (34 CFR § 300.320), an IEP must include a statement of measurable annual goals and a description of how progress will be measured. Arjun's current IEP fails this requirement. Furthermore, the Supreme Court's 'Endrew F.' decision established that a child's IEP must be 'appropriately ambitious' and provide more than 'de minimis' (minimal) progress. The current vague reporting and lack of data-driven goals suggest Arjun is being denied his right to a Free Appropriate Public Education (FAPE).",
    
    // Confidence scores
    "confidence": {
      "metadata": 0.85,
      "goals": 0.90,
      "services": 0.75,
      "redFlags": 0.80,
      "overall": 0.83
    },
    
    "analyzedAt": "2026-02-01T12:05:00Z",
    "model": "gemini-2.0-flash-exp"
  }
}
```

**Key Design Decision:**

All data stored in `metadata` JSONB field for maximum flexibility. System can evolve schema without database migrations - just update AI extraction prompt.

**Privacy:** No data shared externally. All processing happens within user's secured environment.

---

## API Endpoints (Implementation Guide)

### 1. Upload Document

**Endpoint:** `POST /api/v1/documents/upload`

**Request:** Multipart form-data
```
file: [PDF/DOCX/TXT file] (required)
childId: UUID (required)
```

**That's it.** All other data (dates, student info, goals, services) extracted by AI from document content.

### 2. Analyze Document (Background Job)

**Endpoint:** `POST /api/v1/documents/:id/analyze`

**Response includes confidence scores:**
```json
{
  "metadata": { ... },
  "goals": [...],
  "confidence": {
    "metadata": 0.85,
    "goals": 0.72,  // Low confidence - flag for review
    "services": 0.90
  }
}
```

### 3. Get Extraction for Review (NEW - IEP-01 Requirement)

**Endpoint:** `GET /api/v1/documents/:id/extraction`

**Purpose:** Parent reviews AI extraction before finalizing

**Response:**
```json
{
  "documentId": "uuid",
  "extractionStatus": "pending_review",
  "reviewRequired": true,
  "lowConfidenceFields": [
    "goals[0].baseline",
    "goals[2].measurementMethod",
    "services[0].minutesPerSession"
  ],
  "extractedData": {
    "metadata": {
      "studentName": { "value": "Arjun", "confidence": 0.95, "needsReview": false },
      "iepStartDate": { "value": "2024-09-01", "confidence": 0.88, "needsReview": false },
      "iepEndDate": { "value": null, "confidence": 0.0, "needsReview": true }
    },
    "goals": [
      {
        "description": { "value": "Improve reading comprehension", "confidence": 0.90, "needsReview": false },
        "baseline": { "value": null, "confidence": 0.0, "needsReview": true },
        "target": { "value": "80% accuracy", "confidence": 0.65, "needsReview": true }
      }
    ],
    "services": [...]
  }
}
```

**UI displays:**
- ✅ High confidence fields (green)
- ⚠️ Medium confidence fields (yellow) 
- ❌ Low/missing fields (red) - require parent input

### 4. Update Extraction (Manual Correction - IEP-01 Requirement)

**Endpoint:** `PATCH /api/v1/documents/:id/extraction`

**Purpose:** Parent corrects AI extraction errors

**Request:**
```json
{
  "corrections": [
    {
      "field": "metadata.iepEndDate",
      "originalValue": null,
      "correctedValue": "2025-08-31",
      "aiConfidence": 0.0
    },
    {
      "field": "goals[0].baseline",
      "originalValue": null,
      "correctedValue": "Currently reads at 40 WPM with 60% comprehension",
      "aiConfidence": 0.0
    },
    {
      "field": "goals[0].target",
      "originalValue": "80% accuracy",
      "correctedValue": "Read at 80 WPM with 90% comprehension",
      "aiConfidence": 0.65,
      "reason": "AI extracted partial target, added missing WPM metric"
    }
  ],
  "reviewCompleted": true
}
```

**Backend logic:**
```typescript
async updateExtraction(req, res) {
  const { id } = req.params;
  const { corrections, reviewCompleted } = req.body;
  
  // Load current extraction
  const document = await IepDocument.findByPk(id);
  const metadata = document.metadata;
  
  // Apply corrections
  corrections.forEach(correction => {
    // Store correction audit trail
    await ExtractionCorrection.create({
      documentId: id,
      field: correction.field,
      originalValue: correction.originalValue,
      correctedValue: correction.correctedValue,
      aiConfidence: correction.aiConfidence,
      correctedBy: req.user.id,
      correctedAt: new Date(),
      reason: correction.reason
    });
    
    // Update metadata with corrected value
    setNestedValue(metadata, correction.field, correction.correctedValue);
  });
  
  // Update document
  await document.update({
    metadata,
    extractionStatus: reviewCompleted ? 'reviewed' : 'pending_review',
    reviewedAt: reviewCompleted ? new Date() : null,
    reviewedBy: reviewCompleted ? req.user.id : null
  });
  
  // If review complete, populate normalized tables
  if (reviewCompleted) {
    await normalizeToTables(document);
  }
  
  return res.json({ success: true });
}
```

**New table: ExtractionCorrection**
```typescript
ExtractionCorrection {
  id: UUID (PK)
  documentId: UUID (FK → IepDocument)
  field: string // "goals[0].baseline"
  originalValue: jsonb // What AI extracted
  correctedValue: jsonb // What parent corrected to
  aiConfidence: decimal // Original AI confidence score
  correctedBy: UUID (FK → User)
  correctedAt: timestamp
  reason: text // Optional explanation
}
```

**Benefits:**
- Audit trail of all corrections
- Training data for improving AI accuracy
- Legal compliance (parent verified data)
- Transparency (show what AI extracted vs what parent corrected)

### 5. Finalize Extraction

**Endpoint:** `POST /api/v1/documents/:id/finalize`

**Purpose:** Parent confirms extraction is complete and accurate

**Effect:**
- Marks document as `extractionStatus: 'finalized'`
- Populates normalized tables (Goal, Service, SmartPrompt)
- Triggers dashboard updates
- Enables lineage comparison

---

## Original API Endpoints (preserved below)

### 1. Upload Document

**Endpoint:** `POST /api/v1/documents/upload`

**Request:** Multipart form-data
```
file: [PDF/DOCX/TXT file] (required)
childId: UUID (required)
```

**That's it.** All other data (dates, student info, goals, services) extracted by AI from document content.

**Controller:** `DocumentController.uploadDocument()`
```typescript
async uploadDocument(req, res) {
  // 1. Validate file type and size
  // 2. Generate documentId (UUID)
  // 3. Parse dates (use documentDate if provided, else NOW)
  // 4. Stream to GCS: /{userId}/{childId}/{documentId}.pdf
  // 5. Save metadata to Document table with custom dates
  // 6. Return { documentId, status: "uploaded" }
}
```

**Implementation:**
```typescript
import { GCS } from '../../shared/storage/gcs.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

async uploadDocument(req, res) {
  const file = req.file; // from multer
  const { childId } = req.body;
  const userId = req.user.id;
  
  // Validate file type
  if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(file.mimetype)) {
    throw new BadRequestError('Unsupported file type. Accepted: PDF, DOCX, TXT');
  }
  
  // Validate file size (max 10 MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new BadRequestError('File too large. Maximum size: 10 MB');
  }
  
  // Upload to GCS
  const gcs = GCS.fromAppEnv();
  const documentId = uuidv4();
  const ext = getExtension(file.mimetype);
  const gcsPath = `${userId}/${childId}/${documentId}.${ext}`;
  
  const readable = Readable.from(file.buffer);
  await gcs.uploadReader(userId, `${childId}/${documentId}.${ext}`, readable, {
    contentType: file.mimetype
  });
  
  // Save minimal metadata (AI will populate rest after analysis)
  const document = await IepDocument.create({
    id: documentId,
    userId,
    childId,
    fileName: file.originalname,
    fileType: getFileType(file.mimetype),
    fileSize: file.size,
    gcsPath,
    uploadDate: new Date(), // System timestamp
    status: 'uploaded',
    analysisStatus: 'pending',
    
    // All fields below populated by AI extraction
    documentType: null, // AI infers: current_iep, previous_iep, progress_report, etc.
    iepStartDate: null,
    iepEndDate: null,
    schoolYear: null,
    metadata: {} // JSONB - stores all extracted data
  });
  
  // Trigger async AI analysis (background job)
  await queueAnalysisJob(documentId);
  
  return res.json({ 
    success: true, 
    data: {
      documentId: document.id,
      fileName: document.fileName,
      status: document.status,
      analysisStatus: document.analysisStatus,
      uploadDate: document.uploadDate
    }
  });
}
```

**Design Philosophy: AI-First, Zero Manual Entry**

1. **Upload:** Parent uploads file → System stores in GCS
2. **Trigger:** Background job queued for AI analysis
3. **Extract:** AI reads document and extracts ALL metadata
4. **Store:** Extracted data saved to database
5. **Notify:** Parent notified when analysis complete

**No manual data entry required.** System infers everything from document content.

---

### 2. Analyze Document

**Endpoint:** `POST /api/v1/documents/:id/analyze`

**Controller:** `DocumentController.analyzeDocument()`
```typescript
async analyzeDocument(req, res) {
  // 1. Fetch document from DB
  // 2. Download from GCS
  // 3. Send to Gemini with extraction prompt
  // 4. Parse response (Zod validation)
  // 5. Store in DocumentAnalysis table
  // 6. Update document status to "analyzed"
  // 7. Return analysis
}
```

**Implementation:**
```typescript
import { AiService } from '../../shared/ai/ai.service.js';
import { analysisSchema } from './document.schema.js';

async analyzeDocument(req, res) {
  const { id } = req.params;
  const document = await Document.findByPk(id);
  
  // Download from GCS
  const gcs = GCS.fromAppEnv();
  const fileBuffer = await gcs.downloadAsBuffer(document.gcsPath);
  
  // Convert to text (if PDF, use OCR)
  const text = await extractText(fileBuffer, document.fileType);
  
  // AI extraction
  const ai = new AiService(geminiApiKey);
  const response = await ai.chatAsObject({
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: `Analyze this IEP:\n\n${text}` }
    ],
    schema: analysisSchema,
    metadata: { temperature: 0.3, model: 'gemini-2.0-flash-exp' }
  });
  
  // Determine STATIC document type (iep, progress_report, evaluation, pwn, other)
  const documentType = determineDocumentType(response);
  
  // Validate response
  const validated = analysisSchema.parse(response.object);
  
  // Store analysis
  const analysis = await DocumentAnalysis.create({
    documentId: id,
    summary: validated.summary,
    goals: validated.goals,
    redFlags: validated.redFlags,
    legalPerspective: validated.legalPerspective,
    model: 'gemini-2.0-flash-exp'
  });
  
  // Update document status
  await document.update({ status: 'analyzed' });
  
  return res.json({ success: true, data: analysis });
}

// Helper: Determine STATIC document type (not time-dependent)
function determineDocumentType(extractedData) {
  const hint = extractedData.metadata.documentTypeHint;
  
  // Map AI hint to static type
  if (hint === 'progress_report') return 'progress_report';
  if (hint === 'evaluation') return 'evaluation';
  if (hint === 'pwn') return 'pwn';
  if (hint === 'iep') return 'iep';
  
  return 'other';
}

// Helper: Check if IEP is currently active (computed dynamically)
function isCurrentIep(document) {
  if (document.documentType !== 'iep') return false;
  if (!document.iepEndDate) return false;
  return new Date(document.iepEndDate) >= new Date();
}

// Helper: Get current IEP for a child (query-time computation)
async function getCurrentIep(childId) {
  const ieps = await IepDocument.findAll({
    where: { 
      childId,
      documentType: 'iep',
      iepEndDate: { [Op.gte]: new Date() } // Only active IEPs
    },
    order: [['iepEndDate', 'DESC']]
  });
  
  return ieps[0]; // Most recent active IEP
}
```

---

### 3. Get Analysis

**Endpoint:** `GET /api/v1/documents/:id/analysis`

**Controller:** `DocumentController.getAnalysis()`
```typescript
async getAnalysis(req, res) {
  const { id } = req.params;
  const analysis = await DocumentAnalysis.findOne({ 
    where: { documentId: id },
    order: [['analyzedAt', 'DESC']]
  });
  
  if (!analysis) {
    throw new NotFoundError('Analysis not found');
  }
  
  return res.json({ success: true, data: analysis });
}
```

---

## Security & Compliance

### FERPA Compliance
- ✅ Documents stored in private GCS buckets
- ✅ Access controlled by userId (parent owns child's documents)
- ✅ All access logged in AuditLog table
- ✅ Signed URLs expire after 15 minutes
- ✅ 7-year retention policy

### Rate Limiting
```typescript
uploadRateLimit: 10 uploads / hour per user
analyzeRateLimit: 20 analyses / hour per user
```

### File Validation
- **Allowed types:** PDF, DOCX, TXT
- **Max size:** 10 MB
- **Virus scan:** (planned - ClamAV integration)

---

## Alignment with Requirements

**This ADR implements the following requirements from [requirements.md](../references/requirements.md):**

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **IEP-01:** Upload IEP Document (OCR + manual edit) | AI extraction + manual correction API (GET/PATCH `/extraction`) | ✅ Complete |
| **IEP-02:** IEP Summary View | Analysis API returns goals, services, accommodations | ✅ Complete |
| **IEP-03:** Historical IEP Versions | Multiple documents stored per child with dates | ✅ Complete |
| **IEP-04:** Editable Fields | Manual correction API allows field-level edits | ✅ Complete |
| **SC-01:** FERPA Compliance | Private GCS buckets, audit logs, parent-controlled access | ✅ Complete |
| **SC-02:** Data Encryption | AES-256 at rest, TLS 1.2+ in transit | ✅ Complete |
| **SC-03:** Audit Trail | ExtractionCorrection table tracks all manual edits | ✅ Complete |

**Key Design Decisions:**
1. **AI-First, Manual-Correction-Available:** Upload requires zero manual entry (reduces friction), but parent MUST review and can correct any field (IEP-01 compliance)
2. **Confidence-Based Review:** Low-confidence fields automatically flagged for parent review
3. **Audit Trail:** All corrections tracked with original AI value vs corrected value
4. **Finalization Required:** Data not finalized until parent confirms extraction accuracy
5. **Dynamic Status:** "current" vs "expired" IEP computed at query time (technical decision, not deviation from requirements)

---

## Trade-offs

| Decision | Benefit | Trade-off |
|----------|---------|-----------|
| **GCS for storage** | Scalable, secure, compliant | GCP vendor lock-in |
| **Gemini for AI** | High accuracy, vision support | Cost per extraction |
| **Async analysis** | Better UX (upload completes fast) | Requires polling or webhooks |
| **Structured extraction** | Predictable UI rendering | Less flexible than raw text |
| **Manual correction required** | Data accuracy + legal compliance (IEP-01) | Extra step for parent |
| **Confidence scoring** | Transparent about AI limitations | Parent sees uncertainty |

---

## Future Enhancements

1. **Batch Analysis:** Upload multiple IEPs and compare across years
2. **OCR Improvements:** Custom model training on IEP-specific layouts
3. **Smart Auto-Correction:** Learn from parent corrections to improve AI
4. **Real-time Analysis:** WebSocket updates during extraction
5. **Multi-language:** Detect and translate non-English IEPs
6. **Mobile OCR:** Use device camera for quick capture + upload

---

## Success Metrics

- ✅ < 5% extraction error rate (after manual review)
- ✅ < 30 seconds average AI analysis time
- ✅ 90%+ parent satisfaction with extraction accuracy
- ✅ < 3 minutes average time for parent to review + finalize extraction
- ✅ Zero FERPA violations in document access
- ✅ 100% of documents reviewed by parent before finalization (IEP-01 compliance)

---

## References

- [requirements.md](../references/requirements.md) - Product requirements (IEP-01, SC-01, etc.)
- [0003-database-schema-and-dashboard-architecture.md](./0003-database-schema-and-dashboard-architecture.md) - Schema design
- [systemarchitecture.md](../systemarchitecture.md) - System overview
- Google Gemini API: https://ai.google.dev/gemini-api/docs
- GCS Documentation: https://cloud.google.com/storage/docs
- IDEA 34 CFR § 300.320: Measurable annual goals

---

**Final Note:** This ADR fully implements IEP-01 requirement "OCR + manual edit" through AI extraction with mandatory parent review and correction capability. Dynamic status computation ("current" vs "expired") is a technical implementation detail not specified in requirements.
