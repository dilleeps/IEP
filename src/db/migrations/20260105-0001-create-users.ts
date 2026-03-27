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
  await queryInterface.createTable("users", {
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
    
    // Authentication
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    
    // Profile
    display_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    
    // Role-based access control
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "PARENT",
    },
    
    // Status
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    
    // Provider
    provider: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "internal",
    },
    
    // Approval
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Metadata
    last_login_at: {
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


  // Create indexes
  await safeAddIndex(queryInterface, "users", ["email"], {
    name: "idx_users_email",
    unique: true,
  });
  
  await safeAddIndex(queryInterface, "users", ["role"], {
    name: "idx_users_role",
  });
  
  await safeAddIndex(queryInterface, "users", ["status"], {
    name: "idx_users_status",
  });
  
  await safeAddIndex(queryInterface, "users", ["created_at"], {
    name: "idx_users_created_at",
  });

  // Note: Auto-approval logic moved to application layer (auth service)
  // No database triggers needed
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  
  // Drop table
  await queryInterface.dropTable("users");
};
