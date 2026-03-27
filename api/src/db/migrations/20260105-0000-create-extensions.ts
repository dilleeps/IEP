// src/migrations/001-enable-extensions.ts
import type { Migration } from "../umzug.js";

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  await sequelize.query("CREATE EXTENSION IF NOT EXISTS vector;");
  await sequelize.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.query("DROP EXTENSION IF EXISTS pg_trgm;");
  await sequelize.query("DROP EXTENSION IF EXISTS vector;");
  await sequelize.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
};
