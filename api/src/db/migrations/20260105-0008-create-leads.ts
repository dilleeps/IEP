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
  
  await queryInterface.createTable("leads", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    ip: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    captcha_score: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: 'reCAPTCHA v3 score (0.0 to 1.0)',
    },
    captcha_action: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'reCAPTCHA v3 action name',
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

  // Add indexes for common queries
  await safeAddIndex(queryInterface, 'leads', ['email'], {
    name: 'leads_email_idx',
  });

  await safeAddIndex(queryInterface, 'leads', ['created_at'], {
    name: 'leads_created_at_idx',
  });

  await safeAddIndex(queryInterface, 'leads', ['ip'], {
    name: 'leads_ip_idx',
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable("leads");
};
