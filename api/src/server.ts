import { startOtel } from "./config/otel.js";
await startOtel();

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initializeFirebase } from "./config/firebase.js";
import { initDb, shutdownDb } from "./config/sequelize.js";
import { migrateUp } from "./db/migrate.js";
import { app } from "./app.js";
import { initSecrets, shutdownSecrets } from "./shared/storage/secrets.js";

async function main() {
  await initSecrets(); // Initialize secrets system (download config if ENABLE_S3=true)
  initializeFirebase();
  await initDb();
  await migrateUp(); // ✅ migrations instead of sync()

  // ── Seed admin user if not exists ──────────────────────────────────
  try {
    const { getSequelize } = await import("./config/sequelize.js");
    const seq = getSequelize();
    const bcrypt = await import("bcrypt");
    const password = process.env.DEFAULT_SEED_PASSWORD || 'Demo123';
    const hash = await bcrypt.hash(password, 12);

    const seedUsers = [
      { email: 'admin@askiep.com', name: 'Demo Admin', role: 'ADMIN' },
      { email: 'parent@askiep.com', name: 'Demo Parent', role: 'PARENT' },
    ];

    for (const u of seedUsers) {
      const [results] = await seq.query(`SELECT id FROM users WHERE email = '${u.email}'`);
      if ((results as any[]).length === 0) {
        await seq.query(
          `INSERT INTO users (id, email, password_hash, display_name, role, status, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', NOW(), NOW())`,
          { bind: [u.email, hash, u.name, u.role] }
        );
        logger.info(`Seeded user: ${u.email} (${u.role})`);
      }
    }
  } catch (seedErr) {
    logger.warn('Seed users failed (non-fatal)', { error: seedErr });
  }

  // Use PORT from environment (Cloud Run sets this to 8080)
  const port = env.PORT;
  console.log(`Starting server on port ${port}...`);
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`server started on port ${port}`, { 
      port,
      docs: `http://localhost:${port}/api-docs/`
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      logger.info("HTTP server closed");
      await shutdownDb();
      logger.info("Database connection closed");
      shutdownSecrets();
      logger.info("Secrets cleanup complete");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error("fatal startup error", { err });
  process.exit(1);
});
