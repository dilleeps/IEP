import type { Migration } from "../umzug.js";

/**
 * Migration: Make document_type nullable
 * Since we determine current/previous IEP based on dates, not document type
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Remove NOT NULL constraint from document_type
    ALTER TABLE iep_documents 
      ALTER COLUMN document_type DROP NOT NULL,
      ALTER COLUMN document_type DROP DEFAULT,
      ALTER COLUMN document_type SET DEFAULT NULL;
  `);
  
  console.log('✅ Made document_type nullable in iep_documents table');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    -- Set default value for any NULL document_type records
    UPDATE iep_documents 
    SET document_type = 'iep' 
    WHERE document_type IS NULL;

    -- Add back NOT NULL constraint
    ALTER TABLE iep_documents 
      ALTER COLUMN document_type SET NOT NULL,
      ALTER COLUMN document_type SET DEFAULT 'iep';
  `);
  
  console.log('✅ Reverted document_type to NOT NULL in iep_documents table');
};
