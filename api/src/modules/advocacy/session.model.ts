import { DataTypes, Model, Sequelize } from 'sequelize';

interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AdvocacySessionAttributes {
  id: string;
  userId: string;
  childId: string;
  scenarioType: 'iep_meeting' | 'school_team' | 'dispute_resolution';
  goal: string;
  messages: SessionMessage[];
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class AdvocacySession extends Model<AdvocacySessionAttributes> implements AdvocacySessionAttributes {
  declare id: string;
  declare userId: string;
  declare childId: string;
  declare scenarioType: 'iep_meeting' | 'school_team' | 'dispute_resolution';
  declare goal: string;
  declare messages: SessionMessage[];
  declare status: 'active' | 'completed' | 'abandoned';
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initAdvocacySessionModel(sequelize: Sequelize): void {
  AdvocacySession.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
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
      scenarioType: {
        type: DataTypes.ENUM('iep_meeting', 'school_team', 'dispute_resolution'),
        allowNull: false,
        field: 'scenario_type',
      },
      goal: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      messages: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'abandoned'),
        allowNull: false,
        defaultValue: 'active',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
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
      tableName: 'advocacy_sessions',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );
}
