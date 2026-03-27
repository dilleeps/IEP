import type { Migration } from "../umzug.js";

/**
 * Migration: Extend Goal Progress for IEP Goals
 * Uses raw SQL for idempotent operations, indexes only (no foreign keys)
 * Note: Database columns remain unchanged (goal_name, goal_description, goal_category)
 * Sequelize model uses field mapping to map camelCase to snake_case
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Add IEP-specific columns if not exists
    ALTER TABLE goal_progress
      ADD COLUMN IF NOT EXISTS document_id UUID,
      ADD COLUMN IF NOT EXISTS baseline TEXT,
      ADD COLUMN IF NOT EXISTS target TEXT,
      ADD COLUMN IF NOT EXISTS measurement_method TEXT,
      ADD COLUMN IF NOT EXISTS criteria TEXT,
      ADD COLUMN IF NOT EXISTS frequency VARCHAR(100),
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS lineage_group UUID,
      ADD COLUMN IF NOT EXISTS previous_goal_id UUID;

    -- Create indexes for performance (no foreign keys)
    CREATE INDEX IF NOT EXISTS idx_goal_document_id ON goal_progress(document_id);
    CREATE INDEX IF NOT EXISTS idx_goal_lineage_group ON goal_progress(lineage_group);
    CREATE INDEX IF NOT EXISTS idx_goal_previous_goal_id ON goal_progress(previous_goal_id);
    CREATE INDEX IF NOT EXISTS idx_goal_start_date ON goal_progress(start_date);
    CREATE INDEX IF NOT EXISTS idx_goal_child_id ON goal_progress(child_id);
  `);
  
  console.log('✅ Extended goal_progress table with IEP-specific fields');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Drop indexes
    DROP INDEX IF EXISTS idx_goal_child_id;
    DROP INDEX IF EXISTS idx_goal_start_date;
    DROP INDEX IF EXISTS idx_goal_previous_goal_id;
    DROP INDEX IF EXISTS idx_goal_lineage_group;
    DROP INDEX IF EXISTS idx_goal_document_id;

    -- Drop columns
    ALTER TABLE goal_progress
      DROP COLUMN IF EXISTS previous_goal_id,
      DROP COLUMN IF EXISTS lineage_group,
      DROP COLUMN IF EXISTS start_date,
      DROP COLUMN IF EXISTS frequency,
      DROP COLUMN IF EXISTS criteria,
      DROP COLUMN IF EXISTS measurement_method,
      DROP COLUMN IF EXISTS target,
      DROP COLUMN IF EXISTS baseline,
      DROP COLUMN IF EXISTS document_id;
  `);
  
  console.log('✅ Reverted goal_progress table extensions');
};
