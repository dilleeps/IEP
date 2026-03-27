// src/umzug.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Umzug, SequelizeStorage } from "umzug";
import type { Sequelize } from "sequelize";
import {getSequelize, initDb} from "../config/sequelize.js";

// import { initDb, getSequelize } from "./config/sequelize.js";

// --- ESM-safe __dirname (if you are CJS, you can remove this block and use __dirname directly)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Your migration function type: context is Sequelize
export type Migration = (params: { context: Sequelize; name: string; path?: string }) => Promise<unknown>;

await initDb();
const sequelize = getSequelize();

// IMPORTANT: Ctx = Sequelize
export const migrator = new Umzug<Sequelize>({
    migrations: {
        // adjust path based on where your migrations folder is relative to this file
        glob: ["migrations/*.{ts,js}", { cwd: __dirname }],
        resolve: (params) => {
            // Normalize migration name to always use .ts extension for consistency
            // (DB stores .ts names from dev, but production has .js compiled files)
            const name = params.name?.replace(/\.js$/, '.ts') ?? params.path!;
            const migration = Umzug.defaultResolver(params);
            return { ...migration, name };
        },
    },
    context: sequelize, // ✅ Sequelize instance
    storage: new SequelizeStorage({ sequelize }),

    // console does NOT match Umzug's logger type in strict TS; easiest is disable:
    logger: undefined,
});
