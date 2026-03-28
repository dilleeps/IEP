import { DataTypes, Model, Sequelize } from 'sequelize';

export interface LetterDraftAttributes {
  id: string;
  userId: string;
  childId: string;
  letterType: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other';
  title: string;
  content: string;
  contentHtml?: string;
  status: 'draft' | 'final' | 'sent';
  aiModel: string;
  generationContext?: Record<string, any>;
  revisionCount: number;
  sentDate?: Date;
  sentTo?: string[];
  sentMethod?: string;
  parentDraftId?: string;
  versionNumber: number;
  lastEdited: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class LetterDraft extends Model<LetterDraftAttributes> implements LetterDraftAttributes {
  declare id: string;
  declare userId: string;
  declare childId: string;
  declare letterType: 'request' | 'concern' | 'thank_you' | 'follow_up' | 'complaint' | 'appeal' | 'other';
  declare title: string;
  declare content: string;
  declare contentHtml?: string;
  declare status: 'draft' | 'final' | 'sent';
  declare aiModel: string;
  declare generationContext?: Record<string, any>;
  declare revisionCount: number;
  declare sentDate?: Date;
  declare sentTo?: string[];
  declare sentMethod?: string;
  declare parentDraftId?: string;
  declare versionNumber: number;
  declare lastEdited: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

export function initLetterDraftModel(sequelize: Sequelize): void {
  LetterDraft.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        field: 'user_id',
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      letterType: {
        field: 'letter_type',
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      contentHtml: {
        field: 'content_html',
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'draft',
      },
      aiModel: {
        field: 'ai_model',
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'gemini-3-flash-preview',
      },
      generationContext: {
        field: 'generation_context',
        type: DataTypes.JSONB,
      },
      revisionCount: {
        field: 'revision_count',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      sentDate: {
        field: 'sent_date',
        type: DataTypes.DATEONLY,
      },
      sentTo: {
        field: 'sent_to',
        type: DataTypes.ARRAY(DataTypes.TEXT),
      },
      sentMethod: {
        field: 'sent_method',
        type: DataTypes.STRING(50),
      },
      parentDraftId: {
        field: 'parent_draft_id',
        type: DataTypes.UUID,
        references: {
          model: 'letter_drafts',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      versionNumber: {
        field: 'version_number',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      lastEdited: {
        field: 'last_edited',
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
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
      tableName: 'letter_drafts',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );
}
