import type { Migration } from "../umzug.js";
import { DataTypes } from "sequelize";

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  
  // User Registration Requests table - stores pending registrations awaiting admin approval
  await queryInterface.createTable("user_registration_requests", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    display_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['parent', 'advocate', 'teacher', 'admin']],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    organization: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected']],
      },
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
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
  });

  await queryInterface.addIndex("user_registration_requests", ["email"], {
    name: "idx_user_reg_requests_email",
    unique: true,
  });

  await queryInterface.addIndex("user_registration_requests", ["status"], {
    name: "idx_user_reg_requests_status",
  });

  await queryInterface.addIndex("user_registration_requests", ["role", "status"], {
    name: "idx_user_reg_requests_role_status",
  });

  await queryInterface.addIndex("user_registration_requests", {
    name: "idx_user_reg_requests_created",
    fields: [{ name: "created_at", order: "DESC" }],
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable("user_registration_requests");
};
