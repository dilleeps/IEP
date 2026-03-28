# ADR 0009: SQL Error - VARCHAR(255) Length Exceeded in Goal Progress

## Status
Identified - 2026-02-03

## Context
When inserting goal progress data extracted from IEP documents, we encountered a PostgreSQL error:

```
Error: value too long for type character varying(255)
Code: 22001
```

### Error Location
- **Table**: `goal_progress`
- **Operation**: INSERT
- **Service**: `NormalizationService.finalizeExtraction()`

### SQL Statement
```sql
INSERT INTO "public"."goal_progress" (
  "id","child_id","user_id","document_id","goal_text","goal_name","domain",
  "baseline","target","measurement_method","criteria","frequency","start_date",
  "current_value","target_value","status","progress_percentage","notes",
  "lineage_group","data_source","last_updated","created_at","updated_at"
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
```

## Problem Analysis

### Problematic Fields
The following fields contain data exceeding 255 characters:

1. **goal_text** (293 characters):
   ```
   By 10/19/2024, in the learning environment and with visual supports (ex. visual schedule, task analysis), Lakshmann will initiate and complete a 3+ item schedule of non-mastered vocational tasks, with no more than 2 gestural prompts, 4 out of 5 opportunities, as measured by data collection.
   ```

2. **baseline** and **current_value** (434 characters each):
   ```
   Currently, Lakshmaan initiate and complete a 3 item schedule of mastered vocational tasks, with no more than 2 gestural prompts, 0 out of 1 opportunities. The amount of prompts per task varies based on the task. However, Laks often requires 2-5 prompts per task to initiate, complete multiple trials of a task (ex. wrapping 5 sets of silverware), and for thoroughness (ex. wiping all parts of a table top).
   ```

### Root Cause
IEP documents contain extensive descriptive text for goals, baselines, and targets. These fields naturally exceed 255 characters as they must capture:
- Detailed goal descriptions with context and conditions
- Baseline performance levels with specific examples
- Measurement criteria and frequency details
- Multiple prompts, trials, and thoroughness requirements

## Decision

### Option 1: Increase Column Limits (RECOMMENDED)
Change VARCHAR(255) to TEXT or VARCHAR with higher limits for text-heavy fields.

**Affected Columns**:
- `goal_text`: VARCHAR(255) → TEXT
- `baseline`: VARCHAR(255) → TEXT  
- `target`: VARCHAR(255) → TEXT
- `current_value`: VARCHAR(255) → TEXT
- `target_value`: VARCHAR(255) → TEXT
- `notes`: VARCHAR(255) → TEXT (already may be long)
- `criteria`: VARCHAR(255) → VARCHAR(500) or TEXT
- `measurement_method`: VARCHAR(255) → VARCHAR(500)

**Pros**:
- Preserves complete IEP data without truncation
- Maintains data integrity and legal compliance
- IEP documents require full text for legal/educational value

**Cons**:
- Slight increase in storage (negligible for TEXT in PostgreSQL)
- Potential performance impact on very large datasets (minimal in practice)

### Option 2: Truncate Data
Trim fields to 255 characters with "..." indicator.

**Pros**:
- No schema changes needed

**Cons**:
- ❌ Loss of critical IEP information
- ❌ Legal/compliance risk (incomplete educational records)
- ❌ Poor user experience (educators need full context)

## Consequences

### Chosen Solution: Option 1

#### Migration Required
```sql
-- Migration: Update goal_progress columns to TEXT
ALTER TABLE goal_progress 
  ALTER COLUMN goal_text TYPE TEXT,
  ALTER COLUMN baseline TYPE TEXT,
  ALTER COLUMN target TYPE TEXT,
  ALTER COLUMN current_value TYPE TEXT,
  ALTER COLUMN target_value TYPE TEXT,
  ALTER COLUMN notes TYPE TEXT,
  ALTER COLUMN criteria TYPE TEXT,
  ALTER COLUMN measurement_method TYPE TEXT;
```

#### Model Updates
Update Sequelize model definitions for `GoalProgress` to use `DataTypes.TEXT` for affected fields.

#### Testing Required
- Verify insertion of long IEP goal text
- Test with real IEP document samples (typically 2-4 pages with extensive goals)
- Confirm no performance degradation on queries

## Implementation Checklist
- [ ] Create migration file to alter column types
- [ ] Update GoalProgress model in `src/modules/goal/goal-progress.model.ts`
- [ ] Run migration in development
- [ ] Test with real IEP documents
- [ ] Verify API responses handle long text properly
- [ ] Update any frontend components that display truncated text
- [ ] Deploy migration to staging/production

## References
- PostgreSQL Error Code 22001: String data right truncation
- IEP Document Standards: Goals typically 200-500 characters
- IDEA Requirements: Complete and accurate educational records

## Notes
This is a data model limitation, not an application logic error. IEP documents are legal educational records and must be stored in their entirety per IDEA compliance requirements.