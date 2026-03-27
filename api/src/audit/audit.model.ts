import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AuditLogAttributes {
  id: string;
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  deviceName?: string;
  deviceType?: string;
  piiAccessed?: boolean;
  piiFields?: string[];
  status?: string;
  errorMessage?: string;
  retentionUntil?: Date;
  createdAt: Date;
}

export class AuditLog extends Model<AuditLogAttributes> implements AuditLogAttributes {
  declare id: string;
  declare userId?: string;
  declare action: string;
  declare entityType?: string;
  declare entityId?: string;
  declare oldValues?: Record<string, any>;
  declare newValues?: Record<string, any>;
  declare ipAddress?: string;
  declare userAgent?: string;
  declare requestMethod?: string;
  declare requestPath?: string;
  declare deviceName?: string;
  declare deviceType?: string;
  declare piiAccessed?: boolean;
  declare piiFields?: string[];
  declare status?: string;
  declare errorMessage?: string;
  declare retentionUntil?: Date;
  declare createdAt: Date;
}

export function initAuditLogModel(sequelize: Sequelize): void {
  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      action: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING(100),
      },
      entityId: {
        type: DataTypes.UUID,
      },
      oldValues: {
        type: DataTypes.JSONB,
        field: 'old_values',
      },
      newValues: {
        type: DataTypes.JSONB,
        field: 'new_values',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.TEXT,
        field: 'user_agent',
      },
      requestMethod: {
        type: DataTypes.STRING(10),
        field: 'request_method',
      },
      requestPath: {
        type: DataTypes.STRING(500),
        field: 'request_path',
      },
      deviceName: {
        type: DataTypes.STRING(255),
        field: 'device_name',
      },
      deviceType: {
        type: DataTypes.STRING(50),
        field: 'device_type',
      },
      piiAccessed: {
        type: DataTypes.BOOLEAN,
        field: 'pii_accessed',
        defaultValue: false,
      },
      piiFields: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        field: 'pii_fields',
      },
      status: {
        type: DataTypes.STRING(20),
      },
      errorMessage: {
        type: DataTypes.TEXT,
        field: 'error_message',
      },
      retentionUntil: {
        type: DataTypes.DATE,
        field: 'retention_until',
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'audit_logs',
      underscored: true,
      timestamps: false,
      createdAt: 'createdAt',
      updatedAt: false,
    }
  );
}
