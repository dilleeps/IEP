import { DataTypes, Model, Sequelize } from 'sequelize';

export interface SubscriptionPlanAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  billingPeriod: string;
  features: string[];
  limits: Record<string, number>;
  color?: string;
  badgeText?: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  targetAudience?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class SubscriptionPlan
  extends Model<SubscriptionPlanAttributes>
  implements SubscriptionPlanAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare description?: string;
  declare priceCents: number;
  declare billingPeriod: string;
  declare features: string[];
  declare limits: Record<string, number>;
  declare color?: string;
  declare badgeText?: string;
  declare isFeatured: boolean;
  declare isActive: boolean;
  declare sortOrder: number;
  declare targetAudience?: string;
  declare createdBy?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initSubscriptionPlanModel(sequelize: Sequelize): void {
  SubscriptionPlan.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING(100), allowNull: false },
      slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      priceCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'price_cents' },
      billingPeriod: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'month', field: 'billing_period' },
      features: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      limits: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      color: { type: DataTypes.STRING(30), allowNull: true },
      badgeText: { type: DataTypes.STRING(50), allowNull: true, field: 'badge_text' },
      isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_featured' },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
      targetAudience: { type: DataTypes.STRING(255), allowNull: true, field: 'target_audience' },
      createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
      createdAt: { type: DataTypes.DATE, allowNull: false, field: 'created_at' },
      updatedAt: { type: DataTypes.DATE, allowNull: false, field: 'updated_at' },
      deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    },
    {
      sequelize,
      tableName: 'subscription_plans',
      underscored: true,
      paranoid: true,
      timestamps: true,
    }
  );
}
