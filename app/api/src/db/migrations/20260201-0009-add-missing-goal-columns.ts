import type { Migration } from "../umzug.js";

/**
 * Migration: Add missing columns to goal_progress table
 * Adds: goal_text, goal_name, domain, data_source
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Add missing columns for IEP goal tracking
    ALTER TABLE goal_progress
      ADD COLUMN IF NOT EXISTS goal_text TEXT,
      ADD COLUMN IF NOT EXISTS goal_name VARCHAR(500),
      ADD COLUMN IF NOT EXISTS domain VARCHAR(100),
      ADD COLUMN IF NOT EXISTS data_source JSONB DEFAULT '{}'::jsonb;

    -- Create index on domain for filtering
    CREATE INDEX IF NOT EXISTS idx_goal_domain ON goal_progress(domain);
  `);
  
  console.log('✅ Added missing goal_text, goal_name, domain, data_source columns to goal_progress');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Drop index
    DROP INDEX IF EXISTS idx_goal_domain;

    -- Drop columns
    ALTER TABLE goal_progress
      DROP COLUMN IF EXISTS data_source,
      DROP COLUMN IF EXISTS domain,
      DROP COLUMN IF EXISTS goal_name,
      DROP COLUMN IF EXISTS goal_text;
  `);
  
  console.log('✅ Removed goal_text, goal_name, domain, data_source columns from goal_progress');
};
