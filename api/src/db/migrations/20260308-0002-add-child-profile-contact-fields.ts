import type { Migration } from '../umzug.js';

/**
 * Migration: Add country, home_address, and phone_number to child_profiles.
 */
export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    ALTER TABLE child_profiles
      ADD COLUMN IF NOT EXISTS country       VARCHAR(100),
      ADD COLUMN IF NOT EXISTS home_address   TEXT,
      ADD COLUMN IF NOT EXISTS phone_number   VARCHAR(50);
  `);
  console.log('✅ Added country, home_address, phone_number to child_profiles');
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query(`
    ALTER TABLE child_profiles
      DROP COLUMN IF EXISTS phone_number,
      DROP COLUMN IF EXISTS home_address,
      DROP COLUMN IF EXISTS country;
  `);
  console.log('✅ Reverted child_profiles contact fields');
};
