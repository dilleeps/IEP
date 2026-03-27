import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AdvocacyInsightAttributes {
  id: string;
  childId: string;
  userId: string;
  insightType: 'strength' | 'concern' | 'recommendation' | 'strategy' | 'resource' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'acknowledged' | 'in_progress' | 'completed' | 'dismissed';
  source: string;
  relatedData: Record<string, any>;
  actionable: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class AdvocacyInsight extends Model<AdvocacyInsightAttributes> implements AdvocacyInsightAttributes {
  declare id: string;
  declare childId: string;
  declare userId: string;
  declare insightType: 'strength' | 'concern' | 'recommendation' | 'strategy' | 'resource' | 'other';
  declare title: string;
  declare description: string;
  declare priority: 'low' | 'medium' | 'high';
  declare status: 'new' | 'acknowledged' | 'in_progress' | 'completed' | 'dismissed';
  declare source: string;
  declare relatedData: Record<string, any>;
  declare actionable: boolean;
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
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      insightType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['strength', 'concern', 'recommendation', 'strategy', 'resource', 'other']],
        },
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['low', 'medium', 'high']],
        },
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'new',
        validate: {
          isIn: [['new', 'acknowledged', 'in_progress', 'completed', 'dismissed']],
        },
      },
      source: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      relatedData: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      actionable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'advocacy_insights',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
