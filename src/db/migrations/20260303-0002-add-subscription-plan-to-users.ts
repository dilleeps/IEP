import type { Migration } from "../umzug.js";
import { DataTypes } from "sequelize";

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  const tableDescription = await queryInterface.describeTable("users");
  if (!tableDescription.subscription_plan_slug) {
    await queryInterface.addColumn("users", "subscription_plan_slug", {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: "free",
    });
  }
};

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface();

  const tableDescription = await queryInterface.describeTable("users");
  if (tableDescription.subscription_plan_slug) {
    await queryInterface.removeColumn("users", "subscription_plan_slug");
  }
};
