import { DataTypes, Model, Sequelize } from "sequelize";

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string | null;
  displayName: string;
  role: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'COUNSELOR' | 'ADMIN' | 'SUPPORT';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  provider: 'internal' | 'google' | 'microsoft' | 'apple';
  approvedBy?: string;
  approvedAt?: Date;
  lastLoginAt?: Date;
  subscriptionPlanSlug?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string | null;
  declare displayName: string;
  declare role: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'COUNSELOR' | 'ADMIN' | 'SUPPORT';
  declare status: 'active' | 'inactive' | 'pending' | 'suspended';
  declare provider: 'internal' | 'google' | 'microsoft' | 'apple';
  declare approvedBy?: string;
  declare approvedAt?: Date;
  declare lastLoginAt?: Date;
  declare subscriptionPlanSlug?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

/**
 * Initialize User model
 * Should be called after database initialization
 */
export function initUserModel(sequelize: Sequelize): void {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'password_hash',
      },
      displayName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'display_name',
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'PARENT',
        validate: {
          isIn: [['PARENT', 'ADVOCATE', 'TEACHER_THERAPIST', 'COUNSELOR', 'ADMIN', 'SUPPORT']],
        },
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['active', 'inactive', 'pending', 'suspended']],
        },
      },
      provider: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'internal',
        validate: {
          isIn: [['internal', 'google', 'microsoft', 'apple']],
        },
      },
      approvedBy: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'approved_by',
      },
      approvedAt: {
        type: DataTypes.DATE,
        field: 'approved_at',
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        field: 'last_login_at',
      },
      subscriptionPlanSlug: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'informed_parent',
        field: 'subscription_plan_slug',
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
      tableName: "users",
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      schema: 'public',
    },
  );
}
