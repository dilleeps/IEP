import type { Migration } from '../umzug.js';

/**
 * Migration: Add disability source tracking and profile update log to child_profiles.
 *
 * New columns:
 *   other_disabilities TEXT[]      – Additive list of extra disability labels extracted
 *                                    from successive documents (never shrinks).
 *   disability_source_tracking JSONB – Maps each disability field to the document that
 *                                    first set it:
 *                                    {
 *                                      primaryDisability?: { documentId, fileName, setAt },
 *                                      secondaryDisability?: { documentId, fileName, setAt },
 *                                      others: [{ label, documentId, fileName, addedAt }]
 *                                    }
 *   profile_update_log JSONB        – Append-only array of profile mutation events:
 *                                    [{ version, at, documentId, fileName, changes: Record<field,{from,to}> }]
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    ALTER TABLE child_profiles
      ADD COLUMN IF NOT EXISTS other_disabilities      TEXT[]   DEFAULT '{}' NOT NULL,
      ADD COLUMN IF NOT EXISTS disability_source_tracking JSONB DEFAULT '{}' NOT NULL,
      ADD COLUMN IF NOT EXISTS profile_update_log      JSONB   DEFAULT '[]' NOT NULL;

    -- GIN index so we can query source tracking efficiently
    CREATE INDEX IF NOT EXISTS idx_child_disability_source
      ON child_profiles USING gin(disability_source_tracking);
  `);
  console.log('✅ Added disability source tracking + profile update log to child_profiles');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    DROP INDEX IF EXISTS idx_child_disability_source;
    ALTER TABLE child_profiles
      DROP COLUMN IF EXISTS profile_update_log,
      DROP COLUMN IF EXISTS disability_source_tracking,
      DROP COLUMN IF EXISTS other_disabilities;
  `);
  console.log('✅ Reverted child_profiles disability tracking columns');
};
