// src/modules/smart-prompts/smart-prompts.model.ts
import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SmartPromptAttributes {
  id: string;
  userId: string;
  childId?: string;
  promptType: 'meeting_reminder' | 'document_missing' | 'goal_review' | 'compliance_alert' | 'advocacy_tip' | 'resource_suggestion';
  category: 'iep' | 'behavior' | 'communication' | 'compliance' | 'advocacy' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  contextData: Record<string, any>;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class SmartPrompt extends Model<SmartPromptAttributes> implements SmartPromptAttributes {
  declare id: string;
  declare userId: string;
  declare childId?: string;
  declare promptType: 'meeting_reminder' | 'document_missing' | 'goal_review' | 'compliance_alert' | 'advocacy_tip' | 'resource_suggestion';
  declare category: 'iep' | 'behavior' | 'communication' | 'compliance' | 'advocacy' | 'general';
  declare priority: 'low' | 'medium' | 'high' | 'urgent';
  declare title: string;
  declare message: string;
  declare actionable: boolean;
  declare actionUrl?: string;
  declare actionLabel?: string;
  declare contextData: Record<string, any>;
  declare acknowledged: boolean;
  declare acknowledgedAt?: Date;
  declare expiresAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initSmartPromptModel(sequelize: Sequelize): void {
  SmartPrompt.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      childId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      promptType: {
        type: DataTypes.ENUM('meeting_reminder', 'document_missing', 'goal_review', 'compliance_alert', 'advocacy_tip', 'resource_suggestion'),
        allowNull: false,
      },
      category: {
        type: DataTypes.ENUM('iep', 'behavior', 'communication', 'compliance', 'advocacy', 'general'),
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      actionable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      actionUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      actionLabel: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      contextData: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      acknowledged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      acknowledgedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'smart_prompts',
      paranoid: true,
      timestamps: true,
      indexes: [
        {
          fields: ['user_id', 'acknowledged', 'expires_at'],
        },
        {
          fields: ['child_id'],
        },
        {
          fields: ['priority', 'created_at'],
        },
      ],
    }
  );
}
