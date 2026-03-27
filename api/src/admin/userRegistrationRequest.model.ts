import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserRegistrationRequestAttributes {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'COUNSELOR' | 'ADMIN' | 'SUPPORT';
  phone?: string;
  organization?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRegistrationRequest extends Model<UserRegistrationRequestAttributes> implements UserRegistrationRequestAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
  declare displayName: string;
  declare role: 'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST' | 'COUNSELOR' | 'ADMIN' | 'SUPPORT';
  declare phone?: string;
  declare organization?: string;
  declare reason?: string;
  declare status: 'pending' | 'approved' | 'rejected';
  declare approvedBy?: string;
  declare approvedAt?: Date;
  declare rejectedBy?: string;
  declare rejectedAt?: Date;
  declare rejectionReason?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initUserRegistrationRequestModel(sequelize: Sequelize): void {
  UserRegistrationRequest.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        field: 'email',
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        field: 'password_hash',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      displayName: {
        field: 'display_name',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        field: 'role',
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['PARENT', 'ADVOCATE', 'TEACHER_THERAPIST', 'COUNSELOR', 'ADMIN', 'SUPPORT']],
        },
      },
      phone: {
        field: 'phone',
        type: DataTypes.STRING(20),
      },
      organization: {
        field: 'organization',
        type: DataTypes.STRING(255),
      },
      reason: {
        field: 'reason',
        type: DataTypes.TEXT,
      },
      status: {
        field: 'status',
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
      },
      approvedBy: {
        field: 'approved_by',
        type: DataTypes.UUID,
      },
      approvedAt: {
        field: 'approved_at',
        type: DataTypes.DATE,
      },
      rejectedBy: {
        field: 'rejected_by',
        type: DataTypes.UUID,
      },
      rejectedAt: {
        field: 'rejected_at',
        type: DataTypes.DATE,
      },
      rejectionReason: {
        field: 'rejection_reason',
        type: DataTypes.TEXT,
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
    },
    {
      sequelize,
      tableName: 'user_registration_requests',
      timestamps: true,
    }
  );
}
