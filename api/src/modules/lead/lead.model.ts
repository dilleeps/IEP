import { DataTypes, Model, Sequelize } from "sequelize";

export interface LeadAttributes {
  id: string;
  email: string;
  ip?: string;
  userAgent?: string;
  captchaScore?: number;
  captchaAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Lead extends Model<LeadAttributes> implements LeadAttributes {
  declare id: string;
  declare email: string;
  declare ip?: string;
  declare userAgent?: string;
  declare captchaScore?: number;
  declare captchaAction?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Initialize Lead model
 * Should be called after database initialization
 */
export function initLeadModel(sequelize: Sequelize): void {
  Lead.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ip: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
      },
      captchaScore: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        field: 'captcha_score',
      },
      captchaAction: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'captcha_action',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: "leads",
      timestamps: true,
      underscored: true,
    }
  );
}
