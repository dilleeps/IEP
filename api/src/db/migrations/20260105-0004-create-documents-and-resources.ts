import type { Migration } from "../umzug.js";
import { DataTypes } from "sequelize";

// Helper to safely add indexes (ignore if exists)
async function safeAddIndex(queryInterface: any, tableName: string, fields: string[], options: any) {
  try {
    await queryInterface.addIndex(tableName, fields, options);
  } catch (error: any) {
    if (!error.message?.includes('already exists')) {
      throw error;
    }
  }
}

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  
  // IEP Documents table
  await queryInterface.createTable("iep_documents", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    child_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "child_profiles",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    filename: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    original_filename: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    file_size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    storage_path: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content_preview: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    page_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    processing_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "pending",
    },
    processing_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    document_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    document_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    school_year: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    analysis_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex("iep_documents", ["child_id"], {
    name: "idx_iep_documents_child_id",
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("iep_documents", ["user_id"], {
    name: "idx_iep_documents_user_id",
  });

  await queryInterface.addIndex("iep_documents", ["processing_status"], {
    name: "idx_iep_documents_status",
  });

  await queryInterface.addIndex("iep_documents", ["document_date"], {
    name: "idx_iep_documents_document_date",
    order: [["document_date", "DESC"]],
  });

  // IEP Analyses table
  await queryInterface.createTable("iep_analyses", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    child_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "child_profiles",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    document_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "iep_documents",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    goals: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    accommodations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    red_flags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    legal_lens: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    goal_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    accommodation_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    red_flag_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    risk_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    risk_level: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ai_model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "gemini-3-flash-preview",
    },
    ai_tokens_used: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    processing_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex("iep_analyses", ["child_id", "created_at"], {
    name: "idx_iep_analyses_child_id",
    where: { deleted_at: null },
    order: [["created_at", "DESC"]],
  });

  await queryInterface.addIndex("iep_analyses", ["document_id"], {
    name: "idx_iep_analyses_document_id",
  });

  await queryInterface.addIndex("iep_analyses", ["risk_level"], {
    name: "idx_iep_analyses_risk_level",
  });

  // Add foreign key constraint from iep_documents to iep_analyses
  await queryInterface.addConstraint("iep_documents", {
    fields: ["analysis_id"],
    type: "foreign key",
    name: "iep_documents_analysis_id_fkey",
    references: {
      table: "iep_analyses",
      field: "id",
    },
    onDelete: "SET NULL",
  });

  // Resources table
  await queryInterface.createTable("resources", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resource_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    disability_relevance: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    external_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    state_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    helpful_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    published_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    last_reviewed: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex("resources", ["resource_type"], {
    name: "idx_resources_type",
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("resources", ["category"], {
    name: "idx_resources_category",
  });

  await queryInterface.addIndex("resources", ["tags"], {
    name: "idx_resources_tags",
    using: "GIN",
  });

  await queryInterface.addIndex("resources", ["state_code"], {
    name: "idx_resources_state",
    where: { state_code: { [sequelize.Sequelize.Op.ne]: null } },
  });

  // Vector Embeddings table
  await queryInterface.createTable("vector_embeddings", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    embedding: {
      type: "vector(768)",
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    embedding_model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "gemini-embedding-001",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addConstraint("vector_embeddings", {
    fields: ["entity_type", "entity_id", "deleted_at"],
    type: "unique",
    name: "vector_embeddings_entity_unique",
  });

  await queryInterface.addIndex("vector_embeddings", ["entity_type", "entity_id"], {
    name: "idx_vector_embeddings_entity",
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("vector_embeddings", ["metadata"], {
    name: "idx_vector_embeddings_metadata",
    using: "GIN",
  });

  await queryInterface.addIndex("vector_embeddings", ["content_hash"], {
    name: "idx_vector_embeddings_content_hash",
    where: { content_hash: { [sequelize.Sequelize.Op.ne]: null } },
  });

  // Create vector similarity search index (IVFFlat)
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_vector_embeddings_embedding ON vector_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
    WHERE embedding IS NOT NULL AND deleted_at IS NULL;
  `);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("vector_embeddings");
  await queryInterface.dropTable("resources");
  
  // Remove the foreign key constraint before dropping iep_analyses
  await queryInterface.removeConstraint("iep_documents", "iep_documents_analysis_id_fkey");
  
  await queryInterface.dropTable("iep_analyses");
  await queryInterface.dropTable("iep_documents");
}
