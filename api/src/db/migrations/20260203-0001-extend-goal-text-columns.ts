import type { Migration } from "../umzug.js";

/**
 * Migration: Extend VARCHAR(255) columns to TEXT in goal_progress
 * 
 * Issue: IEP goal descriptions often exceed 255 characters
 * - goal_text: ~293 chars (full goal statement with conditions)
 * - baseline: ~434 chars (detailed current performance)
 * - target: ~200-400 chars (expected achievement)
 * - current_value: ~434 chars (progress notes)
 * - target_value: ~200-400 chars
 * 
 * Solution: Convert to TEXT type for unlimited length
 * 
 * References: ADR-0009 SQL Error VARCHAR(255) exceeded
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Extend text columns in goal_progress to handle long IEP descriptions
    ALTER TABLE goal_progress
      ALTER COLUMN baseline TYPE TEXT,
      ALTER COLUMN target TYPE TEXT,
      ALTER COLUMN current_value TYPE TEXT,
      ALTER COLUMN target_value TYPE TEXT,
      ALTER COLUMN measurement_method TYPE TEXT,
      ALTER COLUMN criteria TYPE TEXT;

    -- goal_text and notes should already be TEXT from previous migrations
    -- but ensure they are TEXT if not already
    ALTER TABLE goal_progress
      ALTER COLUMN goal_text TYPE TEXT,
      ALTER COLUMN notes TYPE TEXT;
  `);
  
  console.log('✅ Extended goal_progress text columns from VARCHAR(255) to TEXT');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Revert to VARCHAR(255) - WARNING: May truncate existing data
    ALTER TABLE goal_progress
      ALTER COLUMN baseline TYPE VARCHAR(255),
      ALTER COLUMN target TYPE VARCHAR(255),
      ALTER COLUMN current_value TYPE VARCHAR(255),
      ALTER COLUMN target_value TYPE VARCHAR(255),
      ALTER COLUMN measurement_method TYPE VARCHAR(255),
      ALTER COLUMN criteria TYPE VARCHAR(255);
  `);
  
  console.log('⚠️  Reverted goal_progress text columns to VARCHAR(255) - data may be truncated');
};
