import { DataTypes, Model, Sequelize } from 'sequelize';

export interface ExtractionCorrectionAttributes {
  id: string;
  documentId: string;
  field: string;
  originalValue: any;
  correctedValue: any;
  aiConfidence?: number;
  correctedBy: string;
  correctedAt: Date;
  reason?: string;
  createdAt: Date;
}

export class ExtractionCorrection extends Model<ExtractionCorrectionAttributes> implements ExtractionCorrectionAttributes {
  declare id: string;
  declare documentId: string;
  declare field: string;
  declare originalValue: any;
  declare correctedValue: any;
  declare aiConfidence?: number;
  declare correctedBy: string;
  declare correctedAt: Date;
  declare reason?: string;
  declare createdAt: Date;
}

export function initExtractionCorrectionModel(sequelize: Sequelize): void {
  ExtractionCorrection.init(
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
      field: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      originalValue: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'original_value',
      },
      correctedValue: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'corrected_value',
      },
      aiConfidence: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        field: 'ai_confidence',
      },
      correctedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'corrected_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      correctedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'corrected_at',
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'extraction_corrections',
      underscored: true,
      timestamps: false,
    }
  );
}
