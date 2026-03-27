import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AiConversationAttributes {
  id: string;
  userId: string;
  childId?: string;
  conversationType: 'iep_help' | 'legal_qa' | 'meeting_prep' | 'advocacy_advice' | 'general' | 'other';
  title: string;
  status: 'active' | 'archived';
  messageCount: number;
  conversationData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class AiConversation extends Model<AiConversationAttributes> implements AiConversationAttributes {
  declare id: string;
  declare userId: string;
  declare childId?: string;
  declare conversationType: 'iep_help' | 'legal_qa' | 'meeting_prep' | 'advocacy_advice' | 'general' | 'other';
  declare title: string;
  declare status: 'active' | 'archived';
  declare messageCount: number;
  declare conversationData: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initAiConversationModel(sequelize: Sequelize): void {
  AiConversation.init(
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
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      conversationType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['iep_help', 'legal_qa', 'meeting_prep', 'advocacy_advice', 'general', 'other']],
        },
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'active',
        validate: {
          isIn: [['active', 'archived']],
        },
      },
      messageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      conversationData: {
        type: DataTypes.JSONB,
        defaultValue: {},
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
      tableName: 'ai_conversations',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
