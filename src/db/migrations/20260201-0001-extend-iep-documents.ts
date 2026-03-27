import type { Migration } from "../umzug.js";

/**
 * Migration: Extend IEP Documents for AI Extraction Workflow
 * Uses raw SQL for idempotent operations, indexes only (no foreign keys)
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Add columns if not exists
    ALTER TABLE iep_documents 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'uploaded' NOT NULL;

    
    ALTER TABLE iep_documents
      ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
      ADD COLUMN IF NOT EXISTS extraction_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS reviewed_by UUID,
      ADD COLUMN IF NOT EXISTS uploaded_by_id UUID,
      ADD COLUMN IF NOT EXISTS iep_start_date DATE,
      ADD COLUMN IF NOT EXISTS iep_end_date DATE,
      ADD COLUMN IF NOT EXISTS iep_meeting_date DATE,
      ADD COLUMN IF NOT EXISTS iep_review_date DATE,
      ADD COLUMN IF NOT EXISTS reevaluation_date DATE,
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}' NOT NULL,
      ADD COLUMN IF NOT EXISTS confidence JSONB,
      ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL,
      ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;

    -- Create indexes (no foreign keys - app handles validation)
    CREATE INDEX IF NOT EXISTS idx_iep_uploaded_by ON iep_documents(uploaded_by_id);
    CREATE INDEX IF NOT EXISTS idx_iep_reviewed_by ON iep_documents(reviewed_by);
    CREATE INDEX IF NOT EXISTS idx_iep_status ON iep_documents(status);
    CREATE INDEX IF NOT EXISTS idx_iep_analysis_status ON iep_documents(analysis_status);
    CREATE INDEX IF NOT EXISTS idx_iep_extraction_status ON iep_documents(extraction_status);
    CREATE INDEX IF NOT EXISTS idx_iep_child_year ON iep_documents(child_id, school_year) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_iep_dates ON iep_documents(child_id, iep_end_date) WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_iep_metadata ON iep_documents USING gin(metadata);
  `);
  
  console.log('✅ Extended iep_documents table with extraction workflow fields');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Drop indexes
    DROP INDEX IF EXISTS idx_iep_metadata;
    DROP INDEX IF EXISTS idx_iep_dates;
    DROP INDEX IF EXISTS idx_iep_child_year;
    DROP INDEX IF EXISTS idx_iep_extraction_status;
    DROP INDEX IF EXISTS idx_iep_analysis_status;
    DROP INDEX IF EXISTS idx_iep_status;
    DROP INDEX IF EXISTS idx_iep_reviewed_by;
    DROP INDEX IF EXISTS idx_iep_uploaded_by;

    -- Drop columns
    ALTER TABLE iep_documents
      DROP COLUMN IF EXISTS upload_date,
      DROP COLUMN IF EXISTS version,
      DROP COLUMN IF EXISTS confidence,
      DROP COLUMN IF EXISTS metadata,
      DROP COLUMN IF EXISTS reevaluation_date,
      DROP COLUMN IF EXISTS iep_review_date,
      DROP COLUMN IF EXISTS iep_meeting_date,
      DROP COLUMN IF EXISTS iep_end_date,
      DROP COLUMN IF EXISTS iep_start_date,
      DROP COLUMN IF EXISTS uploaded_by_id,
      DROP COLUMN IF EXISTS reviewed_by,
      DROP COLUMN IF EXISTS reviewed_at,
      DROP COLUMN IF EXISTS extraction_status,
      DROP COLUMN IF EXISTS analysis_status,
      DROP COLUMN IF EXISTS status;
  `);
  
  console.log('✅ Reverted iep_documents table extensions');
};
