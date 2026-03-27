import path from "node:path";
import { fileURLToPath } from "node:url";
import { Umzug, SequelizeStorage } from "umzug";
import { getSequelize } from "../config/sequelize.js";
import { logger } from "../config/logger.js";
import {migrator} from "./umzug.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// let _umzug: Umzug | null = null;
//
// /**
//  * Get or create the migration Umzug instance
//  */
// function getUmzug(): Umzug {
//   if (!_umzug) {
//     const sequelize = getSequelize();
//     const context = sequelize.getQueryInterface();
//
//
//     _umzug = new Umzug({
//       migrations: {
//         glob: path.join(__dirname, "migrations", "*.ts"),
//       },
//       context: context,
//       storage: new SequelizeStorage({ sequelize }),
//       logger: console,
//     });
//   }
//   return _umzug;
// }

export async function migrateUp() {
  try {
    const umzug = migrator;
    const pending = await umzug.pending();
    logger.info("migrations pending", { count: pending.length });
    
    if (pending.length === 0) {
      logger.info("No pending migrations");
      return;
    }
    
    const res = await umzug.up();
    logger.info("migrations applied", { count: res.length });
  } catch (error) {
    logger.error("Migration failed", { error });
    throw error;
  }
}

export async function migrateDown(to?: string) {
  const umzug = migrator;
  const res = await umzug.down(to ? { to } : undefined);
  logger.info("migrations rolled back", { count: res.length, to });
}

// export type Migration = typeof migrator._types.migration;

