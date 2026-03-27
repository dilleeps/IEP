import type { Migration } from "../umzug.js";
import { DataTypes } from "sequelize";

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  
  // Check if column exists before adding
  const tableDescription = await queryInterface.describeTable('users');
  
  if (!tableDescription.display_name) {
    await queryInterface.addColumn('users', 'display_name', {
      type: DataTypes.STRING(255),
      allowNull: true, // Temporarily allow null for existing records
    });
    
    // Update existing records - use email prefix as display name if null
    await sequelize.query(`
      UPDATE users 
      SET display_name = SPLIT_PART(email, '@', 1) 
      WHERE display_name IS NULL
    `);
    
    // Make it NOT NULL after populating existing records
    await queryInterface.changeColumn('users', 'display_name', {
      type: DataTypes.STRING(255),
      allowNull: false,
    });
  }
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();
  
  const tableDescription = await queryInterface.describeTable('users');
  if (tableDescription.display_name) {
    await queryInterface.removeColumn('users', 'display_name');
  }
};
