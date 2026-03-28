import type { Migration } from '../umzug.js';

/**
 * Add status column to ai_conversations table.
 * The model defines 'status' but the original migration didn't include it.
 */
export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const { DataTypes } = await import('sequelize');

  // Check if column already exists
  const tableDesc = await qi.describeTable('ai_conversations');
  if (!tableDesc.status) {
    await qi.addColumn('ai_conversations', 'status', {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    });
  }
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.removeColumn('ai_conversations', 'status');
};
