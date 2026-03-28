import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ResourceAttributes {
  id: string;
  title: string;
  description: string;
  category: 'legal' | 'educational' | 'medical' | 'advocacy' | 'support' | 'financial' | 'technology' | 'other';
  resourceType: 'article' | 'video' | 'pdf' | 'link' | 'contact' | 'organization' | 'tool' | 'other';
  url?: string;
  content?: string;
  tags: string[];
  targetAudience: string[];
  state?: string;
  isActive: boolean;
  viewCount: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Resource extends Model<ResourceAttributes> implements ResourceAttributes {
  declare id: string;
  declare title: string;
  declare description: string;
  declare category: 'legal' | 'educational' | 'medical' | 'advocacy' | 'support' | 'financial' | 'technology' | 'other';
  declare resourceType: 'article' | 'video' | 'pdf' | 'link' | 'contact' | 'organization' | 'tool' | 'other';
  declare url?: string;
  declare content?: string;
  declare tags: string[];
  declare targetAudience: string[];
  declare state?: string;
  declare isActive: boolean;
  declare viewCount: number;
  declare rating?: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initResourceModel(sequelize: Sequelize): void {
  Resource.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['legal', 'educational', 'medical', 'advocacy', 'support', 'financial', 'technology', 'other']],
        },
      },
      resourceType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['article', 'video', 'pdf', 'link', 'contact', 'organization', 'tool', 'other']],
        },
      },
      url: {
        type: DataTypes.STRING(1000),
        field: 'external_url',
      },
      content: {
        type: DataTypes.TEXT,
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      targetAudience: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
        field: 'disability_relevance',
      },
      state: {
        type: DataTypes.STRING(100),
        field: 'state_code',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'view_count',
      },
      // Map helpful_count from DB to rating in model for backward compatibility
      rating: {
        type: DataTypes.INTEGER,
        field: 'helpful_count',
        defaultValue: 0,
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
      tableName: 'resources',
      underscored: true,
      timestamps: true,
    }
  );
}
