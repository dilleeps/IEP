import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IepDocumentAttributes {
  id: string;
  userId: string;
  childId: string;
  uploadedById?: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadDate: Date;
  fileHash?: string;
  documentType?: 'iep' | 'progress_report' | 'evaluation' | 'pwn' | 'other';
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  analysisStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  extractionStatus?: 'pending_review' | 'reviewed' | 'finalized';
  reviewedAt?: Date;
  reviewedBy?: string;
  // Extracted IEP dates
  iepStartDate?: Date;
  iepEndDate?: Date;
  iepMeetingDate?: Date;
  iepReviewDate?: Date;
  reevaluationDate?: Date;
  schoolYear?: string;
  version: number;
  content?: string;
  metadata: Record<string, any>;
  confidence?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class IepDocument extends Model<IepDocumentAttributes> implements IepDocumentAttributes {
  declare id: string;
  declare userId: string;
  declare childId: string;
  declare uploadedById?: string;
  declare fileName: string;
  declare originalFileName: string;
  declare fileSize: number;
  declare mimeType: string;
  declare storagePath: string;
  declare uploadDate: Date;
  declare fileHash?: string;
  declare documentType?: 'iep' | 'progress_report' | 'evaluation' | 'pwn' | 'other';
  declare status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  declare analysisStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  declare extractionStatus?: 'pending_review' | 'reviewed' | 'finalized';
  declare reviewedAt?: Date;
  declare reviewedBy?: string;
  declare iepStartDate?: Date;
  declare iepEndDate?: Date;
  declare iepMeetingDate?: Date;
  declare iepReviewDate?: Date;
  declare reevaluationDate?: Date;
  declare schoolYear?: string;
  declare version: number;
  declare content?: string;
  declare metadata: Record<string, any>;
  declare confidence?: Record<string, any>;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initIepDocumentModel(sequelize: Sequelize): void {
  IepDocument.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      uploadedById: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'uploaded_by_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      fileName: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'filename',
      },
      originalFileName: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'original_filename',
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'file_size_bytes',
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'mime_type',
      },
      storagePath: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        field: 'storage_path',
      },
      uploadDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'document_date',
        defaultValue: DataTypes.NOW,
      },
      fileHash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'file_hash',
      },
      documentType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'document_type',
        defaultValue: null,
        validate: {
          isIn: [['iep', 'progress_report', 'evaluation', 'pwn', 'other']],
        },
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pending',
        field: 'processing_status',
      },
      analysisStatus: {
        // Virtual alias so callers can use analysisStatus; reads from the real
        // 'status' JS attribute (which maps to processing_status column).
        type: DataTypes.VIRTUAL,
        get() {
          return (this as any).getDataValue('status') ?? null;
        },
        set(value: any) {
          (this as any).setDataValue('status', value);
        },
      },
      extractionStatus: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'extraction_status',
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'reviewed_at',
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'reviewed_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      iepStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'iep_start_date',
      },
      iepEndDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'iep_end_date',
      },
      iepMeetingDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'iep_meeting_date',
      },
      iepReviewDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'iep_review_date',
      },
      reevaluationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'reevaluation_date',
      },
      schoolYear: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'school_year',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'content',
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      confidence: {
        type: DataTypes.JSONB,
        allowNull: true,
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
      tableName: 'iep_documents',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
