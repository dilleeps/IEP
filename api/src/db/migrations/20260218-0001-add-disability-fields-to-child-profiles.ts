import type { Migration } from '../umzug.js';
import { DataTypes } from 'sequelize';

/**
 * Add stable primary_disability and secondary_disability columns to child_profiles.
 *
 * These are set once from the first IEP document and are NOT overwritten when
 * subsequent documents are uploaded. The existing `disabilities` array continues
 * to hold all disability labels (including "other" categories) and can grow as
 * more documents are analyzed.
 */
export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.addColumn('child_profiles', 'primary_disability', {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Main disability classification — set on first IEP finalization, not overwritten.',
  });

  await queryInterface.addColumn('child_profiles', 'secondary_disability', {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Secondary disability classification — set on first IEP finalization, not overwritten.',
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.removeColumn('child_profiles', 'secondary_disability');
  await queryInterface.removeColumn('child_profiles', 'primary_disability');
};
