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
  
  // Create user_preferences table first (no foreign key dependencies except users)
  await queryInterface.createTable("user_preferences", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    theme: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "light",
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "en",
    },
    notifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    email_updates: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    email_frequency: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "daily",
    },
    smart_prompt_frequency: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "normal",
    },
    dashboard_layout: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    dashboard_widgets: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    default_view: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "dashboard",
    },
    advocacy_level: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Beginner",
    },
    show_legal_citations: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    show_advocacy_quotes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    show_smart_prompts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    reminder_lead_time_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
    },
    calendar_sync_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    anonymous_analytics: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    additional_settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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

  await queryInterface.addIndex("user_preferences", ["user_id"], {
    name: "idx_user_preferences_user_id",
  });

  await queryInterface.addIndex("user_preferences", ["advocacy_level"], {
    name: "idx_user_preferences_advocacy_level",
  });

  // Create child_profiles table
  await queryInterface.createTable("child_profiles", {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    grade: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    school_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    school_district: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    disabilities: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    focus_tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    last_iep_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    next_iep_review_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    advocacy_level: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    primary_goal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    state_context: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    advocacy_bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    accommodations_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    services_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    reminder_preferences: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
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

  await queryInterface.addIndex("child_profiles", ["user_id"], {
    name: "idx_child_profiles_user_id",
    where: { deleted_at: null },
  });

  await queryInterface.addIndex("child_profiles", ["disabilities"], {
    name: "idx_child_profiles_disabilities",
    using: "GIN",
  });

  await queryInterface.addIndex("child_profiles", ["focus_tags"], {
    name: "idx_child_profiles_focus_tags",
    using: "GIN",
  });

  await queryInterface.addIndex("child_profiles", ["next_iep_review_date"], {
    name: "idx_child_profiles_next_review",
    where: { next_iep_review_date: { [sequelize.Sequelize.Op.ne]: null } },
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable("child_profiles");
  await queryInterface.dropTable("user_preferences");
};
