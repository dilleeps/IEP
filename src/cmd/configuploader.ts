#!/usr/bin/env node

// src/cmd/configuploader.ts
//
// CLI tool to upload encrypted config files to GCS_CONFIG_BUCKET
// Usage: CONFIG_SOURCE_FOLDER=/path/to/config npm run config:upload

import { existsSync, statSync } from "node:fs";
import { expandPath, uploadConfigFolderFrom } from "../shared/storage/secrets.js";
import { appenv } from "../config/appenv.js";
import { logger } from "../config/logger.js";

async function main() {
  try {
    // Get CONFIG_SOURCE_FOLDER (different from LOCAL_BASE_FOLDER used at runtime)
    const sourceFolder = appenv.get("CONFIG_SOURCE_FOLDER")?.trim();
    if (!sourceFolder) {
      logger.error("CONFIG_SOURCE_FOLDER environment variable is required");
      process.exit(1);
    }

    // Expand path (handles ~, $VARS, relative paths)
    const expandedPath = expandPath(sourceFolder);
    logger.info("Resolved config source folder", { 
      original: sourceFolder, 
      expanded: expandedPath 
    });

    // Verify folder exists
    if (!existsSync(expandedPath)) {
      logger.error("CONFIG_SOURCE_FOLDER does not exist", { path: expandedPath });
      process.exit(1);
    }

    // Verify it's a directory
    const stat = statSync(expandedPath);
    if (!stat.isDirectory()) {
      logger.error("CONFIG_SOURCE_FOLDER is not a directory", { path: expandedPath });
      process.exit(1);
    }

    // Verify required environment variables
    const configBucket = appenv.get("GCS_CONFIG_BUCKET");
    const encryptionKey = appenv.get("CONFIG_ENCRYPTION_KEY");
    
    if (!configBucket) {
      logger.error("GCS_CONFIG_BUCKET environment variable is required");
      process.exit(1);
    }
    
    if (!encryptionKey) {
      logger.error("CONFIG_ENCRYPTION_KEY environment variable is required");
      process.exit(1);
    }

    // Upload to GCS_CONFIG_BUCKET
    logger.info("Uploading config folder", { 
      source: expandedPath,
      bucket: configBucket 
    });

    const count = await uploadConfigFolderFrom(expandedPath);

    logger.info("✅ Successfully uploaded files", { 
      count,
      bucket: configBucket 
    });
    
    console.log(`\n✅ Successfully uploaded ${count} files to ${configBucket}`);
    process.exit(0);

  } catch (error: any) {
    logger.error("Failed to upload config folder", { 
      error: error.message,
      stack: error.stack 
    });
    
    console.error(`\n❌ Failed to upload config folder: ${error.message}`);
    process.exit(1);
  }
}

// Run main if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
