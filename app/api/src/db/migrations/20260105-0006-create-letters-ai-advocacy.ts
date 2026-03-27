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
  
  // Letter Drafts table
  await queryInterface.createTable("letter_drafts", {
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
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    letter_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content_html: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "draft",
    },
    ai_model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "gemini-3-flash-preview",
    },
    generation_context: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    revision_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sent_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    sent_to: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    sent_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    parent_draft_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "letter_drafts",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    last_edited: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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

  await queryInterface.addIndex("letter_drafts", ["child_id", "last_edited"], {
    name: "idx_letter_drafts_child_id",
    where: { deleted_at: null },
    order: [["last_edited", "DESC"]],
  });

  await queryInterface.addIndex("letter_drafts", ["letter_type"], {
    name: "idx_letter_drafts_type",
  });

  await queryInterface.addIndex("letter_drafts", ["status"], {
    name: "idx_letter_drafts_status",
  });

  await queryInterface.addIndex("letter_drafts", ["parent_draft_id"], {
    name: "idx_letter_drafts_parent",
    where: { parent_draft_id: { [sequelize.Sequelize.Op.ne]: null } },
  });

  // Letter Templates table
  await queryInterface.createTable("letter_templates", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    template: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    template_html: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    variables: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    is_system_template: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    usage_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    state_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    legal_context: {
      type: DataTypes.TEXT,
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

  await queryInterface.addIndex("letter_templates", ["category"], {
    name: "idx_letter_templates_category",
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("letter_templates", ["is_system_template", "is_active"], {
    name: "idx_letter_templates_system",
    where: { is_active: true },
  });

  await queryInterface.addIndex("letter_templates", ["user_id"], {
    name: "idx_letter_templates_user_id",
    where: { user_id: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("letter_templates", ["is_public"], {
    name: "idx_letter_templates_public",
    where: { is_public: true },
  });

  await queryInterface.addIndex("letter_templates", ["tags"], {
    name: "idx_letter_templates_tags",
    using: "GIN",
  });

  await queryInterface.addIndex("letter_templates", ["state_code"], {
    name: "idx_letter_templates_state",
    where: { state_code: { [sequelize.Sequelize.Op.ne]: null } },
  });

  // AI Conversations table
  await queryInterface.createTable("ai_conversations", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    child_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    conversation_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    messages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    message_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ai_model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "gemini-3-flash-preview",
    },
    total_tokens_used: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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

  await queryInterface.addIndex("ai_conversations", ["user_id", "last_message_at"], {
    name: "idx_ai_conversations_user_id",
    where: { deleted_at: null },
    order: [["last_message_at", "DESC"]],
  });

  await queryInterface.addIndex("ai_conversations", ["child_id"], {
    name: "idx_ai_conversations_child_id",
    where: { child_id: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("ai_conversations", ["conversation_type"], {
    name: "idx_ai_conversations_type",
  });

  // Advocacy Insights table
  await queryInterface.createTable("advocacy_insights", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
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
    child_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "child_profiles",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    action_items: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "active",
    },
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    dismissed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    trigger_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    trigger_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ai_generated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ai_confidence_score: {
      type: DataTypes.DECIMAL(3, 2),
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

  await queryInterface.addIndex("advocacy_insights", ["user_id", "created_at"], {
    name: "idx_advocacy_insights_user_id",
    where: { deleted_at: null },
    order: [["created_at", "DESC"]],
  });

  await queryInterface.addIndex("advocacy_insights", ["child_id"], {
    name: "idx_advocacy_insights_child_id",
    where: { child_id: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("advocacy_insights", ["priority", "status"], {
    name: "idx_advocacy_insights_priority",
    where: { status: "active" },
  });

  await queryInterface.addIndex("advocacy_insights", ["status"], {
    name: "idx_advocacy_insights_status",
    where: { status: "active" },
  });

  await queryInterface.addIndex("advocacy_insights", ["trigger_type"], {
    name: "idx_advocacy_insights_trigger",
  });

  // Smart Prompts table
  await queryInterface.createTable("smart_prompts", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
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
    child_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "child_profiles",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    recommended_actions: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
    questions_to_ask: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    trigger_data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    trigger_entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    trigger_entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "pending",
    },
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    action_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    legal_references: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    legal_lens: {
      type: DataTypes.TEXT,
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

  await queryInterface.addIndex("smart_prompts", ["user_id", "created_at"], {
    name: "idx_smart_prompts_user_id",
    where: { deleted_at: null },
    order: [["created_at", "DESC"]],
  });

  await queryInterface.addIndex("smart_prompts", ["child_id"], {
    name: "idx_smart_prompts_child_id",
    where: { child_id: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("smart_prompts", ["status"], {
    name: "idx_smart_prompts_status",
    where: { status: "pending" },
  });

  await queryInterface.addIndex("smart_prompts", ["severity", "status"], {
    name: "idx_smart_prompts_severity",
    where: { status: "pending" },
  });

  await queryInterface.addIndex("smart_prompts", ["expires_at"], {
    name: "idx_smart_prompts_expires",
    where: { expires_at: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("smart_prompts", ["trigger_entity_type", "trigger_entity_id"], {
    name: "idx_smart_prompts_trigger",
  });

  // Compliance Summaries table
  await queryInterface.createTable("compliance_summaries", {
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
    requirement: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    requirement_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    last_completed_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    next_due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    related_compliance_log_ids: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
    },
    related_document_ids: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: true,
    },
    total_expected: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_completed: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    compliance_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    last_calculated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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

  await queryInterface.addIndex("compliance_summaries", ["child_id"], {
    name: "idx_compliance_summaries_child_id",
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("compliance_summaries", ["user_id"], {
    name: "idx_compliance_summaries_user_id",
  });

  await queryInterface.addIndex("compliance_summaries", ["status", "due_date"], {
    name: "idx_compliance_summaries_status",
    where: { status: { [sequelize.Sequelize.Op.ne]: "compliant" } },
  });

  await queryInterface.addIndex("compliance_summaries", ["due_date"], {
    name: "idx_compliance_summaries_due_date",
    where: { due_date: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("compliance_summaries", ["requirement_type"], {
    name: "idx_compliance_summaries_requirement",
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable("compliance_summaries");
  await queryInterface.dropTable("smart_prompts");
  await queryInterface.dropTable("advocacy_insights");
  await queryInterface.dropTable("ai_conversations");
  await queryInterface.dropTable("letter_templates");
  await queryInterface.dropTable("letter_drafts");
};
