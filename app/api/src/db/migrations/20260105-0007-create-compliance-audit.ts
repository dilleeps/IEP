import type { Migration } from "../umzug.js";
import { DataTypes, Op } from "sequelize";

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
  
  // User Consents table
  await queryInterface.createTable("user_consents", {
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
    consent_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    consent_given: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    consent_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    consent_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    consented_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex("user_consents", ["user_id", "consent_type"], {
    name: "idx_user_consents_user_id",
  });

  await queryInterface.addIndex("user_consents", ["child_id"], {
    name: "idx_user_consents_child_id",
    where: { child_id: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("user_consents", ["user_id", "consent_type", "consent_given"], {
    name: "idx_user_consents_active",
    where: { consent_given: true, revoked_at: null },
  });

  // Data Access Requests table
  await queryInterface.createTable("data_access_requests", {
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
    request_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    entity_types: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "pending",
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    request_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    export_file_path: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    export_generated_at: {
      type: DataTypes.DATE,
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
  });

  await queryInterface.addIndex("data_access_requests", ["user_id", "created_at"], {
    name: "idx_data_access_requests_user_id",
    order: [["created_at", "DESC"]],
  });

  await queryInterface.addIndex("data_access_requests", ["status", "due_date"], {
    name: "idx_data_access_requests_status",
  });

  await queryInterface.addIndex("data_access_requests", ["request_type"], {
    name: "idx_data_access_requests_type",
  });

  // Data Sharing Logs table
  await queryInterface.createTable("data_sharing_logs", {
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
    child_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "child_profiles",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    shared_with: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    shared_with_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    data_shared: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    legal_basis: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    consent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "user_consents",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    recipient_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    recipient_organization: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    data_processing_agreement: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    shared_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await queryInterface.addIndex("data_sharing_logs", ["user_id", "shared_at"], {
    name: "idx_data_sharing_logs_user_id",
    order: [["shared_at", "DESC"]],
  });

  await queryInterface.addIndex("data_sharing_logs", ["child_id"], {
    name: "idx_data_sharing_logs_child_id",
    where: { child_id: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await queryInterface.addIndex("data_sharing_logs", ["shared_with", "shared_with_type"], {
    name: "idx_data_sharing_logs_shared_with",
  });

  await queryInterface.addIndex("data_sharing_logs", ["entity_type", "entity_id"], {
    name: "idx_data_sharing_logs_entity",
  });

  // Audit Logs table
  await queryInterface.createTable("audit_logs", {
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
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    request_method: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    request_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    device_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    device_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    old_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    new_values: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    pii_accessed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pii_fields: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    retention_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex("audit_logs", {
    name: "idx_audit_logs_user_id",
    fields: ["user_id", "created_at"],
  });

  await queryInterface.addIndex("audit_logs", {
    name: "idx_audit_logs_action",
    fields: ["action"],
  });

  await queryInterface.addIndex("audit_logs", {
    name: "idx_audit_logs_entity",
    fields: ["entity_type", "entity_id"],
  });

  await queryInterface.addIndex("audit_logs", {
    name: "idx_audit_logs_created_at",
    fields: ["created_at"],
  });

  await queryInterface.addIndex("audit_logs", {
    name: "idx_audit_logs_pii_accessed",
    fields: ["pii_accessed", "created_at"],
    where: { pii_accessed: true },
  });

  await queryInterface.addIndex("audit_logs", {
    name: "idx_audit_logs_retention",
    fields: ["retention_until"],
    where: { retention_until: { [Op.ne]: null } },
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable("audit_logs");
  await queryInterface.dropTable("data_sharing_logs");
  await queryInterface.dropTable("data_access_requests");
  await queryInterface.dropTable("user_consents");
};
