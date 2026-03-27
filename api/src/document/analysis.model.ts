import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IepAnalysisAttributes {
  id: string;
  documentId: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  complianceIssues: string[];
  complianceScore?: number;
  extractedText: string;
  summary: string;
  aiInsights: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class IepAnalysis extends Model<IepAnalysisAttributes> implements IepAnalysisAttributes {
  declare id: string;
  declare documentId: string;
  declare strengths: string[];
  declare concerns: string[];
  declare recommendations: string[];
  declare complianceIssues: string[];
  declare complianceScore?: number;
  declare extractedText: string;
  declare summary: string;
  declare aiInsights: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export function initIepAnalysisModel(sequelize: Sequelize): void {
  IepAnalysis.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      documentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'iep_documents',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      strengths: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      concerns: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      recommendations: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      complianceIssues: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        defaultValue: [],
      },
      complianceScore: {
        type: DataTypes.DECIMAL(5, 2),
      },
      extractedText: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      aiInsights: {
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
      tableName: 'iep_analyses',
      underscored: true,
      timestamps: true,
    }
  );
}
