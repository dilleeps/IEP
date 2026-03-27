import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ProgressEntryAttributes {
  id: string;
  goalId: string;
  childId: string;
  userId: string;
  reportedDate: Date;
  currentLevel: string;
  progressValue?: number;
  progressUnit?: string;
  notes?: string;
  evidence: string[];
  confidenceLevel?: 'low' | 'medium' | 'high';
  reportedBy: string;
  reportedByRole?: 'parent' | 'teacher' | 'therapist' | 'case_manager' | 'other';
  observationContext?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ProgressEntry extends Model<ProgressEntryAttributes> implements ProgressEntryAttributes {
  declare id: string;
  declare goalId: string;
  declare childId: string;
  declare userId: string;
  declare reportedDate: Date;
  declare currentLevel: string;
  declare progressValue?: number;
  declare progressUnit?: string;
  declare notes?: string;
  declare evidence: string[];
  declare confidenceLevel?: 'low' | 'medium' | 'high';
  declare reportedBy: string;
  declare reportedByRole?: 'parent' | 'teacher' | 'therapist' | 'case_manager' | 'other';
  declare observationContext?: string;
  declare metadata: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initProgressEntryModel(sequelize: Sequelize): void {
  ProgressEntry.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      goalId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'goal_id',
        references: {
          model: 'goal_progress',
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
      reportedDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'reported_date',
      },
      currentLevel: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'current_level',
      },
      progressValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'progress_value',
      },
      progressUnit: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'progress_unit',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      evidence: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      confidenceLevel: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'confidence_level',
      },
      reportedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'reported_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      reportedByRole: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'reported_by_role',
      },
      observationContext: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'observation_context',
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
      tableName: 'progress_entries',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
