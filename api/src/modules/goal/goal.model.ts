import { DataTypes, Model, Sequelize } from 'sequelize';

export interface GoalProgressAttributes {
  id: string;
  childId: string;
  userId: string;
  documentId?: string; // IEP document this goal was extracted from
  goalText: string; // Full goal description (was goalName)
  goalName: string; // Short goal name (was goalDescription)
  domain: 'reading' | 'math' | 'writing' | 'behavior' | 'social' | 'communication' | 'motor' | 'adaptive' | 'self_care_independent_living' | 'vocational' | 'transition' | 'social_emotional' | 'speech_language' | 'occupational_therapy' | 'physical_therapy' | 'other'; // was category
  // SMART criteria (IEP-specific)
  baseline?: string;
  target?: string;
  measurementMethod?: string;
  criteria?: string;
  frequency?: string;
  startDate?: Date;
  // Existing fields
  currentValue: string;
  targetValue: string;
  targetDate?: Date;
  status: 'not_started' | 'in_progress' | 'achieved' | 'modified' | 'discontinued';
  progressPercentage?: number;
  notes: string;
  // Lineage tracking
  lineageGroup: string; // UUID linking same goal across years
  previousGoalId?: string;
  milestonesData: Record<string, any>;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class GoalProgress extends Model<GoalProgressAttributes> implements GoalProgressAttributes {
  declare id: string;
  declare childId: string;
  declare userId: string;
  declare documentId?: string;
  declare goalText: string;
  declare goalName: string;
  declare domain: 'reading' | 'math' | 'writing' | 'behavior' | 'social' | 'communication' | 'motor' | 'adaptive' | 'self_care_independent_living' | 'vocational' | 'transition' | 'social_emotional' | 'speech_language' | 'occupational_therapy' | 'physical_therapy' | 'other';
  declare baseline?: string;
  declare target?: string;
  declare measurementMethod?: string;
  declare criteria?: string;
  declare frequency?: string;
  declare startDate?: Date;
  declare currentValue: string;
  declare targetValue: string;
  declare targetDate?: Date;
  declare status: 'not_started' | 'in_progress' | 'achieved' | 'modified' | 'discontinued';
  declare progressPercentage?: number;
  declare notes: string;
  declare lineageGroup: string;
  declare previousGoalId?: string;
  declare milestonesData: Record<string, any>;
  declare lastUpdated: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initGoalProgressModel(sequelize: Sequelize): void {
  GoalProgress.init(
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
      documentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'document_id',
        references: {
          model: 'iep_documents',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      goalText: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'goal_text', // Renamed from goal_name
      },
      goalName: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'goal_name', // Renamed from goal_description
      },
      domain: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'domain', // Renamed from goal_category
        validate: {
          isIn: [['reading', 'math', 'writing', 'behavior', 'social', 'communication', 'motor', 'adaptive', 'self_care_independent_living', 'vocational', 'transition', 'social_emotional', 'speech_language', 'occupational_therapy', 'physical_therapy', 'other']],
        },
      },
      baseline: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      target: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      measurementMethod: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'measurement_method',
      },
      criteria: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      frequency: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'start_date',
      },
      currentValue: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'current_value',
      },
      targetValue: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'target_value',
      },
      targetDate: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'not_started',
        validate: {
          isIn: [['not_started', 'in_progress', 'achieved', 'modified', 'discontinued']],
        },
      },
      progressPercentage: {
        type: DataTypes.DECIMAL(5, 2),
        field: 'progress_percentage',
      },
      notes: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      lineageGroup: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        field: 'lineage_group',
      },
      previousGoalId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'previous_goal_id',
        references: {
          model: 'goal_progress',
          key: 'id',
        },
      },
      milestonesData: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'data_source', // Using data_source column for JSON data
      },
      lastUpdated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'last_updated',
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
      },
    },
    {
      sequelize,
      tableName: 'goal_progress',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
