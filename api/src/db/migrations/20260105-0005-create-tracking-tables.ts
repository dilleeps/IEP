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
  
  // Compliance Logs table
  await queryInterface.createTable("compliance_logs", {
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
    service_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    service_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    service_provider: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    minutes_provided: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    minutes_required: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    issue_reported: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resolution_status: {
      type: DataTypes.STRING(50),
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

  await queryInterface.addIndex("compliance_logs", {
    name: "idx_compliance_logs_child_id",
    fields: ["child_id", "service_date"],
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("compliance_logs", {
    name: "idx_compliance_logs_status",
    fields: ["status"],
  });

  await queryInterface.addIndex("compliance_logs", {
    name: "idx_compliance_logs_service_date",
    fields: ["service_date"],
  });

  await queryInterface.addIndex("compliance_logs", {
    name: "idx_compliance_logs_service_type",
    fields: ["service_type"],
  });

  await queryInterface.addIndex("compliance_logs", {
    name: "idx_compliance_logs_issue_reported",
    fields: ["issue_reported"],
    where: { issue_reported: true },
  });

  // Goal Progress table
  await queryInterface.createTable("goal_progress", {
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
    goal_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    goal_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goal_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    baseline_value: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    current_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    target_value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    measurement_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    progress_percentage: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    last_updated: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    mastered_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data_source: {
      type: DataTypes.STRING(255),
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

  await queryInterface.addIndex("goal_progress", {
    name: "idx_goal_progress_child_id",
    fields: ["child_id", "last_updated"],
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("goal_progress", {
    name: "idx_goal_progress_status",
    fields: ["status"],
  });

  await queryInterface.addIndex("goal_progress", {
    name: "idx_goal_progress_category",
    fields: ["goal_category"],
  });

  await queryInterface.addIndex("goal_progress", {
    name: "idx_goal_progress_target_date",
    fields: ["target_date"],
    where: { target_date: { [Op.ne]: null } },
  });

  // Communication Logs table
  await queryInterface.createTable("communication_logs", {
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
    communication_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    contact_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contact_role: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    follow_up_needed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    follow_up_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    follow_up_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
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

  await queryInterface.addIndex("communication_logs", {
    name: "idx_communication_logs_child_id",
    fields: ["child_id", "communication_date"],
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("communication_logs", {
    name: "idx_communication_logs_date",
    fields: ["communication_date"],
  });

  await queryInterface.addIndex("communication_logs", {
    name: "idx_communication_logs_method",
    fields: ["method"],
  });

  await queryInterface.addIndex("communication_logs", {
    name: "idx_communication_logs_follow_up",
    fields: ["follow_up_needed", "follow_up_date"],
    where: { follow_up_needed: true },
  });

  await queryInterface.addIndex("communication_logs", {
    name: "idx_communication_logs_contact",
    fields: ["contact_name"],
  });

  // Behavior Logs table
  await queryInterface.createTable("behavior_logs", {
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
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    event_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    antecedent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    behavior: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    consequence: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    intensity: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    severity_level: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activity: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    people_present: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    intervention_used: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    intervention_effective: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    triggers_identified: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    pattern_tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
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

  await queryInterface.addIndex("behavior_logs", ["child_id", "event_date", "event_time"], {
    name: "idx_behavior_logs_child_id",
    where: { deleted_at: null },
    order: [["event_date", "DESC"], ["event_time", "DESC"]],
  });

  await queryInterface.addIndex("behavior_logs", ["event_date"], {
    name: "idx_behavior_logs_date",
    order: [["event_date", "DESC"]],
  });

  await queryInterface.addIndex("behavior_logs", ["intensity"], {
    name: "idx_behavior_logs_intensity",
  });

  await queryInterface.addIndex("behavior_logs", ["location"], {
    name: "idx_behavior_logs_location",
  });

  await queryInterface.addIndex("behavior_logs", ["triggers_identified"], {
    name: "idx_behavior_logs_triggers",
    using: "GIN",
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable("behavior_logs");
  await queryInterface.dropTable("communication_logs");
  await queryInterface.dropTable("goal_progress");
  await queryInterface.dropTable("compliance_logs");
};
