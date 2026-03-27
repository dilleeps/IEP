import { DataTypes, Model, Sequelize } from 'sequelize';

export interface LetterTemplateAttributes {
  id: string;
  name: string;
  description: string;
  category: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other';
  content: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LetterTemplate extends Model<LetterTemplateAttributes> implements LetterTemplateAttributes {
  declare id: string;
  declare name: string;
  declare description: string;
  declare category: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other';
  declare content: string;
  declare variables: string[];
  declare isActive: boolean;
  declare usageCount: number;
  declare createdBy?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initLetterTemplateModel(sequelize: Sequelize): void {
  LetterTemplate.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['request', 'concern', 'thank_you', 'follow_up', 'complaint', 'appeal', 'other']],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      variables: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      createdBy: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
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
      tableName: 'letter_templates',
      underscored: true,
      timestamps: true,
    }
  );
}
