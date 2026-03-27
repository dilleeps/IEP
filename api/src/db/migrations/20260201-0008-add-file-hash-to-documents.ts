import type { Migration } from "../umzug.js";

/**
 * Migration: Add file_hash column for duplicate detection
 * ADR: 0005-document-duplication-handling.md
 * 
 * Adds SHA-256 hash column to detect duplicate file uploads
 */
export const up: Migration = async ({ context: sequelize }) => {
  const tableName = 'iep_documents';

  // Add file_hash column
  await sequelize.query(`
    ALTER TABLE ${tableName}
    ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64) NULL;
  `);

  // Add index for fast duplicate lookups (child_id + file_hash)
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_iep_documents_child_hash
    ON ${tableName} (child_id, file_hash)
    WHERE file_hash IS NOT NULL AND deleted_at IS NULL;
  `);

  // Add index for hash-only lookups
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_iep_documents_hash
    ON ${tableName} (file_hash)
    WHERE file_hash IS NOT NULL AND deleted_at IS NULL;
  `);

  console.log('✅ Added file_hash column and indexes to iep_documents table');
};

export const down: Migration = async ({ context: sequelize }) => {
  const tableName = 'iep_documents';

  // Drop indexes
  await sequelize.query(`
    DROP INDEX IF EXISTS idx_iep_documents_child_hash;
  `);

  await sequelize.query(`
    DROP INDEX IF EXISTS idx_iep_documents_hash;
  `);

  // Drop column
  await sequelize.query(`
    ALTER TABLE ${tableName}
    DROP COLUMN IF EXISTS file_hash;
  `);

  console.log('✅ Removed file_hash column and indexes from iep_documents table');
};
