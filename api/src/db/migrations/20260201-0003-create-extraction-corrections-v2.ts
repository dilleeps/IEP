import type { Migration } from "../umzug.js";

/**
 * Migration: Create Extraction Corrections Table
 * Uses raw SQL for idempotent operations, indexes only (no foreign keys)
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Create table if not exists
    CREATE TABLE IF NOT EXISTS extraction_corrections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL,
      field VARCHAR(255) NOT NULL,
      original_value JSONB,
      corrected_value JSONB,
      ai_confidence DECIMAL(3, 2),
      corrected_by UUID NOT NULL,
      corrected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    -- Create indexes (no foreign keys - app handles validation)
    CREATE INDEX IF NOT EXISTS idx_corrections_document_id ON extraction_corrections(document_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_corrected_by ON extraction_corrections(corrected_by);
    CREATE INDEX IF NOT EXISTS idx_corrections_field ON extraction_corrections(field);
    CREATE INDEX IF NOT EXISTS idx_corrections_corrected_at ON extraction_corrections(corrected_at);
  `);
  
  console.log('✅ Created extraction_corrections table');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    DROP TABLE IF EXISTS extraction_corrections CASCADE;
  `);
  
  console.log('✅ Dropped extraction_corrections table');
};
