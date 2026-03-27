# Data Models — AskIEP API

_Generated: 2026-02-21 | Database: PostgreSQL 16 + pgvector_

All tables use `snake_case` columns (`underscored: true`). Most domain tables are `paranoid: true` (soft-delete via `deleted_at`). Primary keys are UUID v4.

---

## Table Inventory (~25 tables)

| Table | Description | Paranoid |
|---|---|---|
| `users` | User accounts with RBAC | No |
| `user_preferences` | Per-user UI/notification settings | No |
| `user_registration_requests` | Pending approval requests (Advocate/Teacher) | No |
| `system_configuration` | App-level config key-value store | No |
| `child_profiles` | Children linked to users | Yes |
| `iep_documents` | Uploaded IEP PDF files | Yes |
| `iep_analyses` | AI-extracted IEP analysis results | Yes |
| `goal_progress` | IEP goals with tracking data | Yes |
| `progress_entries` | Time-series measurements per goal | Yes |
| `behavior_logs` | ABC behavior event records | Yes |
| `compliance_logs` | Service delivery compliance tracking | Yes |
| `communication_logs` | School contact history | Yes |
| `letters` | AI-generated advocacy letters | Yes |
| `letter_templates` | Pre-defined letter templates | Yes |
| `advocacy_sessions` | Advocacy Lab AI conversation sessions | Yes |
| `advocacy_insights` | Insights extracted from advocacy sessions | Yes |
| `smart_prompts` | Role-aware contextual prompts | Yes |
| `resources` | Educational resource library | Yes |
| `vector_embeddings` | pgvector embeddings for semantic search | Yes |
| `iep_services` | Scheduled IEP services | Yes |
| `service_logs` | Service delivery log entries | Yes |
| `compliance_summaries` | Aggregated compliance summary views | Yes |
| `ai_conversations` | AI chat conversation threads | Yes |
| `extraction_corrections` | User corrections to AI extractions | Yes |
| `leads` | Landing page lead capture | No |
| `consents` | User consent records | No |
| `audit_logs` | System audit trail | No |

---

## Core Entity Schemas

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | UUIDV4 |
| `email` | VARCHAR(255) | Unique |
| `password_hash` | VARCHAR(255) | Nullable (Firebase users have no password) |
| `display_name` | VARCHAR(255) | — |
| `role` | VARCHAR(50) | PARENT \| ADVOCATE \| TEACHER \| ADMIN |
| `status` | VARCHAR(20) | pending \| active \| suspended |
| `provider` | VARCHAR(20) | internal \| firebase |
| `approved_by` | UUID FK → users | Self-referential |
| `approved_at` | TIMESTAMP | — |
| `last_login_at` | TIMESTAMP | — |
| `created_at` | TIMESTAMP | — |
| `updated_at` | TIMESTAMP | — |

**Indexes**: `idx_users_email` (unique), `idx_users_role`, `idx_users_status`, `idx_users_created_at`

---

### `user_preferences`

| Column | Type | Default |
|---|---|---|
| `id` | UUID PK | — |
| `user_id` | UUID FK → users | Unique (1:1) |
| `theme` | VARCHAR(20) | `light` |
| `language` | VARCHAR(10) | `en` |
| `notifications` | BOOLEAN | `true` |
| `email_updates` | BOOLEAN | `true` |
| `email_frequency` | VARCHAR(20) | `daily` |
| `smart_prompt_frequency` | VARCHAR(20) | `normal` |
| `dashboard_layout` | JSONB | `{}` |
| `dashboard_widgets` | TEXT[] | — |
| `default_view` | VARCHAR(50) | `dashboard` |
| `advocacy_level` | VARCHAR(20) | `Beginner` |
| `show_legal_citations` | BOOLEAN | `false` |
| `show_advocacy_quotes` | BOOLEAN | `true` |
| `show_smart_prompts` | BOOLEAN | `true` |
| `reminder_lead_time_days` | INTEGER | `7` |
| `calendar_sync_enabled` | BOOLEAN | `false` |
| `anonymous_analytics` | BOOLEAN | `true` |
| `additional_settings` | JSONB | `{}` |

---

### `child_profiles` (paranoid)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `user_id` | UUID FK → users | Many children per user |
| `name` | VARCHAR(255) | — |
| `date_of_birth` | DATE | — |
| `age` | INTEGER | — |
| `grade` | VARCHAR(50) | — |
| `school_name` | VARCHAR(255) | — |
| `school_district` | VARCHAR(255) | — |
| `disabilities` | TEXT[] | GIN indexed |
| `focus_tags` | TEXT[] | GIN indexed |
| `last_iep_date` | DATE | — |
| `next_iep_review_date` | DATE | Partial index |
| `advocacy_level` | VARCHAR(20) | — |
| `primary_goal` | TEXT | — |
| `state_context` | VARCHAR(100) | US state for legal context |
| `advocacy_bio` | TEXT | — |
| `accommodations_summary` | TEXT | — |
| `services_summary` | TEXT | — |
| `is_active` | BOOLEAN | `true` |
| `reminder_preferences` | JSONB | `{}` |
| `deleted_at` | TIMESTAMP | Soft delete |

---

### `iep_documents` (paranoid)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `child_id` | UUID FK → child_profiles | — |
| `user_id` | UUID FK → users | — |
| `filename` | VARCHAR(500) | GCS storage filename |
| `original_filename` | VARCHAR(500) | Original upload name |
| `file_size_bytes` | INTEGER | — |
| `mime_type` | VARCHAR(100) | — |
| `storage_path` | VARCHAR(1000) | GCS bucket path |
| `content` | TEXT | Extracted text content |
| `content_preview` | TEXT | First N chars preview |
| `page_count` | INTEGER | — |
| `processing_status` | VARCHAR(50) | pending \| processing \| complete \| failed |
| `processing_error` | TEXT | — |
| `document_date` | DATE | Date on the IEP document |
| `document_type` | VARCHAR(100) | Nullable |
| `school_year` | VARCHAR(20) | e.g., `2025-2026` |
| `analysis_id` | UUID FK → iep_analyses | — |
| `file_hash` | VARCHAR(64) | Dedup hash |
| `deleted_at` | TIMESTAMP | — |

---

### `iep_analyses` (paranoid)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `child_id` | UUID FK → child_profiles | — |
| `document_id` | UUID FK → iep_documents | Nullable (SET NULL on delete) |
| `user_id` | UUID FK → users | — |
| `summary` | TEXT | AI-generated summary |
| `goals` | TEXT[] | Extracted IEP goals |
| `accommodations` | TEXT[] | Extracted accommodations |
| `red_flags` | TEXT[] | AI-identified red flags |
| `legal_lens` | TEXT | Legal analysis perspective |
| `goal_count` | INTEGER | — |
| `accommodation_count` | INTEGER | — |
| `red_flag_count` | INTEGER | — |
| `risk_score` | INTEGER | 0-100 |
| `risk_level` | VARCHAR(20) | low \| medium \| high \| critical |
| `ai_model` | VARCHAR(100) | e.g., `gemini-flash-latest` |
| `ai_tokens_used` | INTEGER | — |
| `processing_time_ms` | INTEGER | — |
| `deleted_at` | TIMESTAMP | — |

---

### `goal_progress` (paranoid)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `child_id` | UUID FK → child_profiles | — |
| `user_id` | UUID FK → users | — |
| `goal_name` | VARCHAR(500) | — |
| `goal_description` | TEXT | — |
| `goal_category` | VARCHAR(100) | academic \| social \| behavioral \| etc. |
| `baseline_value` | VARCHAR(255) | Starting measurement |
| `current_value` | VARCHAR(255) | Latest measurement |
| `target_value` | VARCHAR(255) | Goal target |
| `measurement_unit` | VARCHAR(100) | e.g., `%`, `trials`, `minutes` |
| `status` | VARCHAR(20) | not_started \| in_progress \| mastered |
| `progress_percentage` | INTEGER | 0-100 |
| `start_date` | DATE | — |
| `target_date` | DATE | — |
| `last_updated` | DATE | — |
| `mastered_date` | DATE | — |
| `notes` | TEXT | — |
| `data_source` | VARCHAR(255) | Source of measurement data |
| `deleted_at` | TIMESTAMP | — |

---

### `behavior_logs` (paranoid)

ABC (Antecedent-Behavior-Consequence) behavior tracking.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `child_id` / `user_id` | UUID FK | — |
| `event_date` | DATE | — |
| `event_time` | TIME | — |
| `duration_minutes` | INTEGER | — |
| `antecedent` | TEXT | What happened before |
| `behavior` | TEXT | The behavior observed |
| `consequence` | TEXT | What happened after |
| `intensity` | SMALLINT | 1-5 scale |
| `severity_level` | VARCHAR(20) | low \| medium \| high |
| `location` | VARCHAR(255) | — |
| `activity` | VARCHAR(255) | — |
| `people_present` | TEXT[] | — |
| `intervention_used` | TEXT | — |
| `intervention_effective` | BOOLEAN | — |
| `notes` | TEXT | — |
| `triggers_identified` | TEXT[] | GIN indexed |
| `pattern_tags` | TEXT[] | — |
| `deleted_at` | TIMESTAMP | — |

---

### `compliance_logs` (paranoid)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `child_id` / `user_id` | UUID FK | — |
| `service_date` | DATE | — |
| `service_type` | VARCHAR(255) | e.g., OT, PT, Speech |
| `service_provider` | VARCHAR(255) | — |
| `status` | VARCHAR(20) | provided \| missed \| partial |
| `minutes_provided` | INTEGER | — |
| `minutes_required` | INTEGER | From IEP |
| `notes` | TEXT | — |
| `attachments` | JSONB | `[]` |
| `issue_reported` | BOOLEAN | `false` |
| `resolution_status` | VARCHAR(50) | — |
| `deleted_at` | TIMESTAMP | — |

---

### `communication_logs` (paranoid)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `child_id` / `user_id` | UUID FK | — |
| `communication_date` | DATE | — |
| `contact_name` | VARCHAR(255) | — |
| `contact_role` | VARCHAR(255) | Teacher, Principal, etc. |
| `subject` | VARCHAR(500) | — |
| `method` | VARCHAR(50) | email \| phone \| meeting \| other |
| `summary` | TEXT | — |
| `follow_up_needed` | BOOLEAN | — |
| `follow_up_date` | DATE | — |
| `follow_up_completed` | BOOLEAN | — |
| `attachments` | JSONB | `[]` |
| `deleted_at` | TIMESTAMP | — |

---

### `vector_embeddings` (paranoid)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | — |
| `entity_type` | VARCHAR(100) | e.g., `iep_analysis`, `resource` |
| `entity_id` | UUID | FK to source entity |
| `content` | TEXT | Text that was embedded |
| `content_hash` | VARCHAR(64) | SHA hash for dedup |
| `embedding` | `vector(768)` | 768-dimensional pgvector embedding |
| `metadata` | JSONB | GIN indexed |
| `embedding_model` | VARCHAR(100) | `gemini-embedding-001` |
| `deleted_at` | TIMESTAMP | — |

**Index**: `idx_vector_embeddings_embedding` — IVFFlat cosine similarity index (`vector_cosine_ops`, lists=100)

---

## Entity Relationships

```
users ──< user_preferences (1:1)
users ──< child_profiles (1:N)
  child_profiles ──< iep_documents (1:N)
  child_profiles ──< iep_analyses (1:N)
  child_profiles ──< goal_progress (1:N)
  child_profiles ──< behavior_logs (1:N)
  child_profiles ──< compliance_logs (1:N)
  child_profiles ──< communication_logs (1:N)

iep_documents ──< iep_analyses (via analysis_id, circular)
iep_analyses ──> iep_documents (via document_id, FK)

users ──< letters (1:N)
users ──< advocacy_sessions (1:N)
users ──< ai_conversations (1:N)

vector_embeddings (polymorphic — entity_type + entity_id)
```

---

## Migration History

| Migration | Date | Description |
|---|---|---|
| `20260105-0000` | 2026-01-05 | Enable pgvector extension |
| `20260105-0001` | 2026-01-05 | Create `users` table |
| `20260105-0002` | 2026-01-05 | Create `system_configuration` |
| `20260105-0003` | 2026-01-05 | Create `user_preferences`, `child_profiles` |
| `20260105-0004` | 2026-01-05 | Create `iep_documents`, `iep_analyses`, `resources`, `vector_embeddings` |
| `20260105-0005` | 2026-01-05 | Create `compliance_logs`, `goal_progress`, `communication_logs`, `behavior_logs` |
| `20260105-0006` | 2026-01-05 | Create `letters`, advocacy tables |
| `20260105-0007` | 2026-01-05 | Create `compliance_summaries`, `audit_logs` |
| `20260105-0008` | 2026-01-05 | Create `leads` |
| `20260118-0001` | 2026-01-18 | Create `user_registration_requests` |
| `20260118-0002` | 2026-01-18 | Add `display_name` to users |
| `20260201-0001` | 2026-02-01 | Extend `iep_documents` (new fields) |
| `20260201-0002` | 2026-02-01 | Extend `goal_progress` v2 |
| `20260201-0003` | 2026-02-01 | Create `extraction_corrections` v2 |
| `20260201-0004` | 2026-02-01 | Create `progress_entries` v2 |
| `20260201-0005` | 2026-02-01 | Create `iep_services`, `service_logs` v2 |
| `20260201-0006` | 2026-02-01 | Create dashboard views v2 |
| `20260201-0007` | 2026-02-01 | Make `document_type` nullable |
| `20260201-0008` | 2026-02-01 | Add `file_hash` to documents |
| `20260201-0009` | 2026-02-01 | Add missing goal columns |
| `20260201-0010` | 2026-02-01 | Update `iep_analyses` schema |
| `20260203-0001` | 2026-02-03 | Extend goal text columns |
| `20260208-0001` | 2026-02-08 | Make `password_hash` nullable (Firebase users) |
