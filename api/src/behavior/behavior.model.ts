import { DataTypes, Model, Sequelize } from 'sequelize';

export interface BehaviorLogAttributes {
  id: string;
  childId: string;
  userId: string;
  eventDate: string;
  eventTime: string;
  durationMinutes?: number;
  antecedent: string;
  behavior: string;
  consequence: string;
  intensity: number;
  severityLevel?: string;
  location?: string;
  activity?: string;
  peoplePresent?: string[];
  interventionUsed?: string;
  interventionEffective?: boolean;
  notes?: string;
  triggersIdentified?: string[];
  patternTags?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class BehaviorLog extends Model<BehaviorLogAttributes> implements BehaviorLogAttributes {
  declare id: string;
  declare childId: string;
  declare userId: string;
  declare eventDate: string;
  declare eventTime: string;
  declare durationMinutes?: number;
  declare antecedent: string;
  declare behavior: string;
  declare consequence: string;
  declare intensity: number;
  declare severityLevel?: string;
  declare location?: string;
  declare activity?: string;
  declare peoplePresent?: string[];
  declare interventionUsed?: string;
  declare interventionEffective?: boolean;
  declare notes?: string;
  declare triggersIdentified?: string[];
  declare patternTags?: string[];
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initBehaviorLogModel(sequelize: Sequelize): void {
  BehaviorLog.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      eventDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'event_date',
      },
      eventTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'event_time',
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        field: 'duration_minutes',
      },
      antecedent: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      behavior: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      consequence: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      intensity: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 10,
        },
      },
      severityLevel: {
        type: DataTypes.STRING(20),
        field: 'severity_level',
      },
      location: {
        type: DataTypes.STRING(255),
      },
      activity: {
        type: DataTypes.STRING(255),
      },
      peoplePresent: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        field: 'people_present',
      },
      interventionUsed: {
        type: DataTypes.TEXT,
        field: 'intervention_used',
      },
      interventionEffective: {
        type: DataTypes.BOOLEAN,
        field: 'intervention_effective',
      },
      notes: {
        type: DataTypes.TEXT,
      },
      triggersIdentified: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        field: 'triggers_identified',
      },
      patternTags: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        field: 'pattern_tags',
      },
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at',
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      tableName: 'behavior_logs',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
