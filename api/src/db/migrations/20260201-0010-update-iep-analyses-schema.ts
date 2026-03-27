import type { Migration } from "../umzug.js";

/**
 * Migration: Update IEP Analyses Table Schema
 * Replaces old columns (goals, accommodations, red_flags, legal_lens, risk_score, risk_level)
 * with new analysis columns (strengths, concerns, recommendations, compliance_issues, compliance_score, extracted_text, ai_insights)
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Add new columns
    ALTER TABLE iep_analyses
      ADD COLUMN IF NOT EXISTS strengths TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS concerns TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS recommendations TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS compliance_issues TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS compliance_score DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS extracted_text TEXT,
      ADD COLUMN IF NOT EXISTS ai_insights JSONB DEFAULT '{}';

    -- Remove old columns if they exist
    ALTER TABLE iep_analyses
      DROP COLUMN IF EXISTS goals,
      DROP COLUMN IF EXISTS accommodations,
      DROP COLUMN IF EXISTS red_flags,
      DROP COLUMN IF EXISTS legal_lens,
      DROP COLUMN IF EXISTS goal_count,
      DROP COLUMN IF EXISTS accommodation_count,
      DROP COLUMN IF EXISTS red_flag_count,
      DROP COLUMN IF EXISTS risk_score,
      DROP COLUMN IF EXISTS risk_level;

    -- Create indexes for array columns
    CREATE INDEX IF NOT EXISTS idx_iep_analyses_compliance_score 
      ON iep_analyses(compliance_score) 
      WHERE deleted_at IS NULL;
  `);

  console.log('✅ Updated iep_analyses table schema');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Drop new indexes
    DROP INDEX IF EXISTS idx_iep_analyses_compliance_score;

    -- Add back old columns
    ALTER TABLE iep_analyses
      ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS accommodations TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS red_flags TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS legal_lens TEXT,
      ADD COLUMN IF NOT EXISTS goal_count INTEGER,
      ADD COLUMN IF NOT EXISTS accommodation_count INTEGER,
      ADD COLUMN IF NOT EXISTS red_flag_count INTEGER,
      ADD COLUMN IF NOT EXISTS risk_score INTEGER,
      ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);

    -- Remove new columns
    ALTER TABLE iep_analyses
      DROP COLUMN IF EXISTS strengths,
      DROP COLUMN IF EXISTS concerns,
      DROP COLUMN IF EXISTS recommendations,
      DROP COLUMN IF EXISTS compliance_issues,
      DROP COLUMN IF EXISTS compliance_score,
      DROP COLUMN IF EXISTS extracted_text,
      DROP COLUMN IF EXISTS ai_insights;
  `);

  console.log('✅ Reverted iep_analyses table schema');
};
