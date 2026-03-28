import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ServiceAttributes {
  id: string;
  documentId: string;
  childId: string;
  serviceType: 'speech_therapy' | 'occupational_therapy' | 'physical_therapy' | 'counseling' | 'behavior_support' | 'transportation' | 'other';
  provider?: string;
  minutesPerSession?: number;
  sessionsPerWeek?: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'suspended' | 'discontinued' | 'completed';
  totalSessionsPlanned: number;
  totalSessionsDelivered: number;
  notes?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Service extends Model<ServiceAttributes> implements ServiceAttributes {
  declare id: string;
  declare documentId: string;
  declare childId: string;
  declare serviceType: 'speech_therapy' | 'occupational_therapy' | 'physical_therapy' | 'counseling' | 'behavior_support' | 'transportation' | 'other';
  declare provider?: string;
  declare minutesPerSession?: number;
  declare sessionsPerWeek?: number;
  declare startDate: Date;
  declare endDate: Date;
  declare status: 'active' | 'suspended' | 'discontinued' | 'completed';
  declare totalSessionsPlanned: number;
  declare totalSessionsDelivered: number;
  declare notes?: string;
  declare metadata: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initServiceModel(sequelize: Sequelize): void {
  Service.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'document_id',
        references: {
          model: 'iep_documents',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'child_id',
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      serviceType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'service_type',
      },
      provider: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      minutesPerSession: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'minutes_per_session',
      },
      sessionsPerWeek: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
        field: 'sessions_per_week',
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date',
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'end_date',
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'active',
      },
      totalSessionsPlanned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_sessions_planned',
      },
      totalSessionsDelivered: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_sessions_delivered',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
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
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'services',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}

export interface ServiceLogAttributes {
  id: string;
  serviceId: string;
  childId: string;
  sessionDate: Date;
  minutesDelivered?: number;
  provider?: string;
  location?: 'resource_room' | 'general_ed' | 'pull_out' | 'push_in' | 'teletherapy';
  status: 'completed' | 'missed' | 'canceled' | 'makeup';
  missedReason?: string;
  notes?: string;
  goalsAddressed: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceLog extends Model<ServiceLogAttributes> implements ServiceLogAttributes {
  declare id: string;
  declare serviceId: string;
  declare childId: string;
  declare sessionDate: Date;
  declare minutesDelivered?: number;
  declare provider?: string;
  declare location?: 'resource_room' | 'general_ed' | 'pull_out' | 'push_in' | 'teletherapy';
  declare status: 'completed' | 'missed' | 'canceled' | 'makeup';
  declare missedReason?: string;
  declare notes?: string;
  declare goalsAddressed: string[];
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initServiceLogModel(sequelize: Sequelize): void {
  ServiceLog.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'service_id',
        references: {
          model: 'services',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'child_id',
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sessionDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'session_date',
      },
      minutesDelivered: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'minutes_delivered',
      },
      provider: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      missedReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'missed_reason',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      goalsAddressed: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
        defaultValue: [],
        field: 'goals_addressed',
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
      tableName: 'service_logs',
      underscored: true,
      timestamps: true,
    }
  );
}
