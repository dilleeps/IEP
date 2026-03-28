import type { Migration } from '../umzug.js';

/**
 * Add missing columns to ai_conversations table:
 * - status (model defines it but migration didn't include it)
 * - conversation_data (JSONB field for storing conversation messages)
 */
export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const { DataTypes } = await import('sequelize');

  const tableDesc = await qi.describeTable('ai_conversations');

  if (!tableDesc.status) {
    await qi.addColumn('ai_conversations', 'status', {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    });
  }

  if (!tableDesc.conversation_data) {
    await qi.addColumn('ai_conversations', 'conversation_data', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
  }
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const tableDesc = await qi.describeTable('ai_conversations');
  if (tableDesc.conversation_data) await qi.removeColumn('ai_conversations', 'conversation_data');
  if (tableDesc.status) await qi.removeColumn('ai_conversations', 'status');
};
