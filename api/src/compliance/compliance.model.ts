import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ComplianceLogAttributes {
  id: string;
  childId: string;
  userId: string;
  serviceDate: Date;
  serviceType: string;
  serviceProvider?: string;
  status: string;
  minutesProvided?: number;
  minutesRequired?: number;
  notes?: string;
  attachments: any[];
  issueReported: boolean;
  resolutionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ComplianceLog extends Model<ComplianceLogAttributes> implements ComplianceLogAttributes {
  declare id: string;
  declare childId: string;
  declare userId: string;
  declare serviceDate: Date;
  declare serviceType: string;
  declare serviceProvider?: string;
  declare status: string;
  declare minutesProvided?: number;
  declare minutesRequired?: number;
  declare notes?: string;
  declare attachments: any[];
  declare issueReported: boolean;
  declare resolutionStatus?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initComplianceLogModel(sequelize: Sequelize): void {
  ComplianceLog.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      childId: {
        field: 'child_id',
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        field: 'user_id',
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      serviceDate: {
        field: 'service_date',
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      serviceType: {
        field: 'service_type',
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      serviceProvider: {
        field: 'service_provider',
        type: DataTypes.STRING(255),
      },
      status: {
        field: 'status',
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      minutesProvided: {
        field: 'minutes_provided',
        type: DataTypes.INTEGER,
      },
      minutesRequired: {
        field: 'minutes_required',
        type: DataTypes.INTEGER,
      },
      notes: {
        field: 'notes',
        type: DataTypes.TEXT,
      },
      attachments: {
        field: 'attachments',
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      issueReported: {
        field: 'issue_reported',
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      resolutionStatus: {
        field: 'resolution_status',
        type: DataTypes.STRING(50),
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
      deletedAt: {
        field: 'deleted_at',
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      tableName: 'compliance_logs',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
