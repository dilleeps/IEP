import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ComplianceSummaryAttributes {
  id: string;
  childId: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  overallScore: number;
  servicesProvided: number;
  servicesMissed: number;
  accommodationsMet: number;
  accommodationsMissed: number;
  progressReported: boolean;
  meetingsHeld: number;
  concerns: string[];
  highlights: string[];
  recommendations: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ComplianceSummary extends Model<ComplianceSummaryAttributes> implements ComplianceSummaryAttributes {
  declare id: string;
  declare childId: string;
  declare userId: string;
  declare periodStart: Date;
  declare periodEnd: Date;
  declare overallScore: number;
  declare servicesProvided: number;
  declare servicesMissed: number;
  declare accommodationsMet: number;
  declare accommodationsMissed: number;
  declare progressReported: boolean;
  declare meetingsHeld: number;
  declare concerns: string[];
  declare highlights: string[];
  declare recommendations: string[];
  declare metadata: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initComplianceSummaryModel(sequelize: Sequelize): void {
  ComplianceSummary.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      childId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'child_profiles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      overallScore: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      servicesProvided: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      servicesMissed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      accommodationsMet: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      accommodationsMissed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      progressReported: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      meetingsHeld: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      concerns: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      highlights: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      recommendations: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      metadata: {
        type: DataTypes.JSONB,
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
    },
    {
      sequelize,
      tableName: 'compliance_summaries',
      underscored: true,
      timestamps: true,
    }
  );
}
