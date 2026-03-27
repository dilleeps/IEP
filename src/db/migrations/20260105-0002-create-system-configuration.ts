import type { Migration } from "../umzug.js";
import { DataTypes } from "sequelize";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load system configuration
const configPath = join(__dirname, "system-config.json");
const systemConfig = JSON.parse(readFileSync(configPath, "utf-8"));

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
  await queryInterface.createTable("system_configuration", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    display_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    values: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allow_custom_values: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    state_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    last_updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
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

  // Create indexes
  await safeAddIndex(queryInterface, "system_configuration", ["category"], {
    name: "idx_system_configuration_category",
    where: { deleted_at: null },
  });

  await safeAddIndex(queryInterface, "system_configuration", ["is_active"], {
    name: "idx_system_configuration_active",
    where: { is_active: true },
  });

  await safeAddIndex(queryInterface, "system_configuration", ["state_code"], {
    name: "idx_system_configuration_state",
    where: { state_code: { [sequelize.Sequelize.Op.ne]: null } },
  });

  await safeAddIndex(queryInterface, "system_configuration", ["sort_order"], {
    name: "idx_system_configuration_sort_order",
  });

  // Insert system configuration from JSON
  const now = new Date();
  const systemConfigData = systemConfig.systemConfiguration.map((config: any, index: number) => ({
    id: uuidv4(),
    category: config.category,
    display_name: config.label || config.key,
    description: config.description || null,
    values: JSON.stringify(config.values),
    metadata: JSON.stringify({}),
    is_active: true,
    allow_custom_values: config.allowCustomValues || false,
    sort_order: index + 1,
    state_code: null,
    last_updated_by: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  }));

  await queryInterface.bulkInsert("system_configuration", systemConfigData);
  
  console.log(`✅ Inserted ${systemConfigData.length} system configuration entries`);
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable("system_configuration");
};
