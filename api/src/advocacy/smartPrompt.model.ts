import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SmartPromptAttributes {
  id: string;
  userId: string;
  childId: string;
  promptType: 'question' | 'tip' | 'reminder' | 'action' | 'warning' | 'resource';
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  triggerCondition?: string;
  status: 'pending' | 'shown' | 'actioned' | 'dismissed';
  context: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class SmartPrompt extends Model<SmartPromptAttributes> implements SmartPromptAttributes {
  declare id: string;
  declare userId: string;
  declare childId: string;
  declare promptType: 'question' | 'tip' | 'reminder' | 'action' | 'warning' | 'resource';
  declare title: string;
  declare content: string;
  declare priority: 'low' | 'medium' | 'high' | 'urgent';
  declare triggerCondition?: string;
  declare status: 'pending' | 'shown' | 'actioned' | 'dismissed';
  declare context: Record<string, any>;
  declare expiresAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
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
        allowNull: false,
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      promptType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['question', 'tip', 'reminder', 'action', 'warning', 'resource']],
        },
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['low', 'medium', 'high', 'urgent']],
        },
      },
      triggerCondition: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'shown', 'actioned', 'dismissed']],
        },
      },
      context: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      expiresAt: {
        type: DataTypes.DATE,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'smart_prompts',
      underscored: true,
      timestamps: true,
    }
  );
}
