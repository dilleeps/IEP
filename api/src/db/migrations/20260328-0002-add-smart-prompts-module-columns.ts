import type { Migration } from '../umzug.js';

/**
 * Add missing columns to smart_prompts table to match the smart-prompts module model.
 * The original migration created columns: type, severity, title, body, action_url, etc.
 * The module model expects: prompt_type, priority, category, acknowledged, etc.
 */
export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const { DataTypes } = await import('sequelize');

  const desc = await qi.describeTable('smart_prompts');

  // Add prompt_type (alias for type in the new model)
  if (!desc.prompt_type) {
    await qi.addColumn('smart_prompts', 'prompt_type', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
    // Copy existing type values to prompt_type
    await sequelize.query('UPDATE smart_prompts SET prompt_type = type WHERE prompt_type IS NULL');
  }

  if (!desc.priority) {
    await qi.addColumn('smart_prompts', 'priority', {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'medium',
    });
  }

  if (!desc.category) {
    await qi.addColumn('smart_prompts', 'category', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
  }

  if (!desc.acknowledged) {
    await qi.addColumn('smart_prompts', 'acknowledged', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });
  }

  if (!desc.acknowledged_at) {
    await qi.addColumn('smart_prompts', 'acknowledged_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!desc.expires_at) {
    await qi.addColumn('smart_prompts', 'expires_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });
  }

  if (!desc.context_data) {
    await qi.addColumn('smart_prompts', 'context_data', {
      type: DataTypes.JSONB,
      defaultValue: {},
    });
  }
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  const desc = await qi.describeTable('smart_prompts');
  for (const col of ['prompt_type', 'priority', 'category', 'acknowledged', 'acknowledged_at', 'expires_at', 'context_data']) {
    if (desc[col]) await qi.removeColumn('smart_prompts', col);
  }
};
