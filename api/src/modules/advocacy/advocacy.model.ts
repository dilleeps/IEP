// src/modules/advocacy/advocacy.model.ts
import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AdvocacyInsightAttributes {
  id: string;
  userId: string;
  childId?: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actionItems: string[];
  status: 'active' | 'acknowledged' | 'acted_upon' | 'dismissed';
  acknowledgedAt?: Date;
  dismissedAt?: Date;
  triggerType?: string;
  triggerData: Record<string, any>;
  aiGenerated: boolean;
  aiConfidenceScore?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class AdvocacyInsight extends Model<AdvocacyInsightAttributes> implements AdvocacyInsightAttributes {
  declare id: string;
  declare userId: string;
  declare childId?: string;
  declare priority: 'high' | 'medium' | 'low';
  declare category: string;
  declare title: string;
  declare description: string;
  declare actionItems: string[];
  declare status: 'active' | 'acknowledged' | 'acted_upon' | 'dismissed';
  declare acknowledgedAt?: Date;
  declare dismissedAt?: Date;
  declare triggerType?: string;
  declare triggerData: Record<string, any>;
  declare aiGenerated: boolean;
  declare aiConfidenceScore?: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initAdvocacyInsightModel(sequelize: Sequelize): void {
  AdvocacyInsight.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        field: 'user_id',
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      childId: {
        field: 'child_id',
        type: DataTypes.UUID,
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['high', 'medium', 'low']],
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      actionItems: {
        field: 'action_items',
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'active',
        validate: {
          isIn: [['active', 'acknowledged', 'acted_upon', 'dismissed']],
        },
      },
      acknowledgedAt: {
        field: 'acknowledged_at',
        type: DataTypes.DATE,
      },
      dismissedAt: {
        field: 'dismissed_at',
        type: DataTypes.DATE,
      },
      triggerType: {
        field: 'trigger_type',
        type: DataTypes.STRING(100),
      },
      triggerData: {
        field: 'trigger_data',
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      aiGenerated: {
        field: 'ai_generated',
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      aiConfidenceScore: {
        field: 'ai_confidence_score',
        type: DataTypes.DECIMAL(3, 2),
      },
      createdAt: {
        field: 'created_at',
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        field: 'updated_at',
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        field: 'deleted_at',
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'advocacy_insights',
      paranoid: true,
      timestamps: true,
    }
  );
}
