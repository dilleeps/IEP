import type { Migration } from "../umzug.js";

/**
 * Migration: Create Progress Entries Table
 * Uses raw SQL for idempotent operations, indexes only (no foreign keys)
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Create table if not exists
    CREATE TABLE IF NOT EXISTS progress_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      goal_id UUID NOT NULL,
      child_id UUID NOT NULL,
      user_id UUID NOT NULL,
      reported_date DATE NOT NULL,
      current_level TEXT NOT NULL,
      progress_value DECIMAL(10, 2),
      progress_unit VARCHAR(50),
      notes TEXT,
      evidence TEXT[] DEFAULT '{}',
      confidence_level VARCHAR(20),
      reported_by UUID NOT NULL,
      reported_by_role VARCHAR(50),
      observation_context TEXT,
      metadata JSONB DEFAULT '{}' NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Create indexes (no foreign keys - app handles validation)
    CREATE INDEX IF NOT EXISTS idx_progress_goal_id ON progress_entries(goal_id);
    CREATE INDEX IF NOT EXISTS idx_progress_child_id ON progress_entries(child_id);
    CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_progress_reported_by ON progress_entries(reported_by);
    CREATE INDEX IF NOT EXISTS idx_progress_reported_date ON progress_entries(reported_date);
    CREATE INDEX IF NOT EXISTS idx_progress_deleted_at ON progress_entries(deleted_at) WHERE deleted_at IS NULL;
  `);
  
  console.log('✅ Created progress_entries table');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    DROP TABLE IF EXISTS progress_entries CASCADE;
  `);
  
  console.log('✅ Dropped progress_entries table');
};
