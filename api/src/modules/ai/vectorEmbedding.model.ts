import { DataTypes, Model, Sequelize } from 'sequelize';

export interface VectorEmbeddingAttributes {
  id: string;
  entityType: 'document' | 'goal' | 'compliance' | 'communication' | 'behavior' | 'resource' | 'other';
  entityId: string;
  embeddingModel: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

export class VectorEmbedding extends Model<VectorEmbeddingAttributes> implements VectorEmbeddingAttributes {
  declare id: string;
  declare entityType: 'document' | 'goal' | 'compliance' | 'communication' | 'behavior' | 'resource' | 'other';
  declare entityId: string;
  declare embeddingModel: string;
  declare embedding: number[];
  declare metadata: Record<string, any>;
  declare createdAt: Date;
}

export function initVectorEmbeddingModel(sequelize: Sequelize): void {
  VectorEmbedding.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      entityType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [['document', 'goal', 'compliance', 'communication', 'behavior', 'resource', 'other']],
        },
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      embeddingModel: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      embedding: {
        type: 'vector(1536)', // pgvector type for OpenAI embeddings
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'vector_embeddings',
      underscored: true,
      timestamps: false,
      createdAt: 'createdAt',
      updatedAt: false,
    }
  );
}
