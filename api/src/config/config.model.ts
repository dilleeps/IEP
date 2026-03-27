import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SystemConfigurationAttributes {
  id: string;
  category: string;
  displayName: string;
  description?: string;
  values: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  allowCustomValues: boolean;
  sortOrder: number;
  stateCode?: string;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class SystemConfiguration extends Model<SystemConfigurationAttributes> implements SystemConfigurationAttributes {
  declare id: string;
  declare category: string;
  declare displayName: string;
  declare description?: string;
  declare values: Record<string, any>;
  declare metadata: Record<string, any>;
  declare isActive: boolean;
  declare allowCustomValues: boolean;
  declare sortOrder: number;
  declare stateCode?: string;
  declare lastUpdatedBy?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initSystemConfigurationModel(sequelize: Sequelize): void {
  SystemConfiguration.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'category',
      },
      displayName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'display_name',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      values: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      allowCustomValues: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'allow_custom_values',
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
      stateCode: {
        type: DataTypes.STRING(2),
        allowNull: true,
        field: 'state_code',
      },
      lastUpdatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'last_updated_by',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      tableName: 'system_configuration',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
