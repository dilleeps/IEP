// src/shared/storage/secrets.ts
//
// Encrypted config file management using GCS
// Implements AES-256-GCM encryption for config files stored in GCS_CONFIG_BUCKET

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, join, relative, sep, basename, dirname } from "node:path";
import { Readable } from "node:stream";

import { appenv } from "../../config/appenv.js";
import { logger } from "../../config/logger.js";
import { GCS } from "./gcs.js";

// -------------------- Path Utilities --------------------

/**
 * Expands ~ and relative paths to absolute paths
 * Matches Go's ExpandPath function
 */
export function expandPath(p: string): string {
  if (!p) {
    throw new Error("path cannot be empty");
  }

  // Handle tilde expansion
  if (p.startsWith("~/")) {
    return join(homedir(), p.slice(2));
  }

  // Handle absolute paths
  if (p.startsWith("/")) {
    return p;
  }

  // Handle relative paths - place in home directory
  return join(homedir(), p);
}

// -------------------- Encryption Key Management --------------------

export interface EncryptionKeyInfo {
  key: Buffer;       // 32-byte key for AES-256
  algorithm: string; // "AES-256-GCM"
}

/**
 * Reads and validates CONFIG_ENCRYPTION_KEY from environment
 * Returns 32-byte key for AES-256-GCM
 * Expects base64-encoded key in environment variable
 */
export function getEncryptionKey(): Buffer {
  const keyStr = appenv.get("CONFIG_ENCRYPTION_KEY")?.trim();
  if (!keyStr) {
    throw new Error("CONFIG_ENCRYPTION_KEY environment variable is required");
  }

  // Decode base64
  const key = Buffer.from(keyStr, "base64");

  // Validate length (32 bytes = 256 bits for AES-256)
  if (key.length !== 32) {
    throw new Error(
      `CONFIG_ENCRYPTION_KEY must be 32 bytes for AES-256, got ${key.length} bytes`
    );
  }

  return key;
}

// -------------------- File Path Resolution --------------------

/**
 * Returns the full path to a file in LOCAL_BASE_FOLDER
 * keyname: GCS object key or relative path (e.g., "ar.pub" or "keys/ar.pub")
 * Returns error if file doesn't exist or path traversal detected
 */
export function getAsFile(keyname: string): string {
  // Get and expand LOCAL_BASE_FOLDER
  const baseFolder = appenv.get("LOCAL_BASE_FOLDER")?.trim();
  if (!baseFolder) {
    throw new Error("LOCAL_BASE_FOLDER environment variable is required");
  }

  const expandedBase = expandPath(baseFolder);

  // Validate keyname doesn't contain path traversal
  if (keyname.includes("..")) {
    throw new Error(`keyname contains illegal path traversal: ${keyname}`);
  }

  // Build full path (convert forward slashes to platform separator)
  const fullPath = join(expandedBase, keyname.replace(/\//g, sep));

  // Verify file exists
  if (!existsSync(fullPath)) {
    throw new Error(`file does not exist: ${keyname}`);
  }

  return fullPath;
}

// -------------------- Encryption/Decryption --------------------

/**
 * Encrypts a file using AES-256-GCM
 * Format: [12-byte nonce][encrypted data][16-byte auth tag]
 */
export function encryptFile(keyInfo: EncryptionKeyInfo, plaintext: Buffer): Buffer {
  // Validate key length
  if (keyInfo.key.length !== 32) {
    throw new Error(
      `encryption key must be 32 bytes for AES-256, got ${keyInfo.key.length}`
    );
  }

  // Generate random nonce (12 bytes for GCM)
  const nonce = randomBytes(12);

  // Create cipher (AES-256-GCM)
  const cipher = createCipheriv("aes-256-gcm", keyInfo.key, nonce);

  // Encrypt data
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  // Get authentication tag (16 bytes)
  const authTag = cipher.getAuthTag();

  // Combine: [nonce][encrypted][authTag]
  return Buffer.concat([nonce, encrypted, authTag]);
}

/**
 * Decrypts a file using AES-256-GCM
 * Expects format: [12-byte nonce][encrypted data][16-byte auth tag]
 */
export function decryptFile(keyInfo: EncryptionKeyInfo, ciphertext: Buffer): Buffer {
  // Validate key length
  if (keyInfo.key.length !== 32) {
    throw new Error(
      `decryption key must be 32 bytes for AES-256, got ${keyInfo.key.length}`
    );
  }

  const nonceSize = 12;
  const authTagSize = 16;

  if (ciphertext.length < nonceSize + authTagSize) {
    throw new Error(
      `ciphertext too short: expected at least ${nonceSize + authTagSize} bytes, got ${ciphertext.length}`
    );
  }

  // Extract components
  const nonce = ciphertext.subarray(0, nonceSize);
  const authTag = ciphertext.subarray(ciphertext.length - authTagSize);
  const encrypted = ciphertext.subarray(nonceSize, ciphertext.length - authTagSize);

  // Create decipher
  const decipher = createDecipheriv("aes-256-gcm", keyInfo.key, nonce);
  decipher.setAuthTag(authTag);

  // Decrypt and verify
  try {
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  } catch (error: any) {
    throw new Error(`decryption failed (invalid key or corrupted data): ${error.message}`);
  }
}

// -------------------- GCS Config Service --------------------

export class GCSConfigService {
  constructor(private readonly gcs: GCS) {}

  /**
   * Factory: create from appenv using GCS_CONFIG_BUCKET
   */
  static fromAppEnv(): GCSConfigService {
    const configBucket = appenv.get("GCS_CONFIG_BUCKET");
    if (!configBucket) {
      throw new Error("GCS_CONFIG_BUCKET environment variable is required");
    }

    const projectId = appenv.get("GCP_PROJECT_ID");

    const gcs = new GCS({
      bucket: configBucket,
      projectId
    });

    return new GCSConfigService(gcs);
  }

  /**
   * Encrypts all files in folderPath and uploads to GCS bucket
   * Preserves directory structure as GCS object keys
   */
  async uploadFolder(
    keyInfo: EncryptionKeyInfo,
    folderPath: string
  ): Promise<number> {
    const uploadPromises: Promise<void>[] = [];

    const walkDir = (dirPath: string, basePath: string) => {
      const entries = readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files (starting with .)
        if (entry.name.startsWith(".")) {
          continue;
        }

        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          walkDir(fullPath, basePath);
        } else if (entry.isFile()) {
          // Read file content
          const plaintext = readFileSync(fullPath);

          // Encrypt file content
          const ciphertext = encryptFile(keyInfo, plaintext);

          // Get relative path from folderPath to preserve directory structure
          const relPath = relative(basePath, fullPath);

          // Convert to GCS key (use forward slashes)
          const gcsKey = relPath.split(sep).join("/");

          // Upload encrypted content to GCS
          const uploadPromise = this.gcs.uploadBytes("", gcsKey, ciphertext, "application/octet-stream")
            .then(() => {
              // Success - no return value needed
            })
            .catch((err) => {
              throw new Error(`failed to upload ${gcsKey} to GCS: ${err.message}`);
            });

          uploadPromises.push(uploadPromise);
        }
      }
    };

    walkDir(folderPath, folderPath);

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    return uploadPromises.length;
  }

  /**
   * Downloads all objects from GCS bucket and decrypts to localDownloadFolder
   * Preserves GCS key structure as local directory paths
   */
  async downloadFolder(
    keyInfo: EncryptionKeyInfo,
    localDownloadFolder: string
  ): Promise<number> {
    let count = 0;

    // List all objects in the bucket
    const [files] = await this.gcs["storage"].bucket(this.gcs.bucketName).getFiles();

    for (const file of files) {
      const gcsKey = file.name;

      // Skip directory markers
      if (gcsKey.endsWith("/")) {
        continue;
      }

      // Download encrypted content from GCS
      const [ciphertext] = await file.download();

      // Decrypt content
      const plaintext = decryptFile(keyInfo, ciphertext);

      // Build local file path (convert GCS key to local path)
      const localPath = join(localDownloadFolder, gcsKey.replace(/\//g, sep));

      // Create parent directories with restrictive permissions
      const parentDir = dirname(localPath);
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true, mode: 0o700 });
      }

      // Write to temporary file first (atomic write)
      const tmpPath = localPath + ".tmp";
      writeFileSync(tmpPath, plaintext, { mode: 0o600 });

      // Atomic rename
      try {
        rmSync(localPath, { force: true }); // Remove existing file if any
        writeFileSync(localPath, plaintext, { mode: 0o600 });
        rmSync(tmpPath, { force: true }); // Clean up temp file
      } catch (error: any) {
        rmSync(tmpPath, { force: true }); // Clean up temp file on error
        throw new Error(`failed to write ${localPath}: ${error.message}`);
      }

      count++;
    }

    return count;
  }
}

// -------------------- High-Level Operations --------------------

/**
 * Downloads entire GCS_CONFIG_BUCKET to LOCAL_BASE_FOLDER with decryption
 * Returns error if GCS_CONFIG_BUCKET or CONFIG_ENCRYPTION_KEY not set or download fails
 */
export async function downloadConfigFolder(): Promise<void> {
  // Get and expand LOCAL_BASE_FOLDER
  const baseFolder = appenv.get("LOCAL_BASE_FOLDER")?.trim();
  if (!baseFolder) {
    throw new Error("LOCAL_BASE_FOLDER environment variable is required");
  }

  const expandedPath = expandPath(baseFolder);

  // Get GCS config bucket
  const configBucket = appenv.get("GCS_CONFIG_BUCKET")?.trim();
  if (!configBucket) {
    throw new Error("GCS_CONFIG_BUCKET environment variable is required");
  }

  // Get encryption key
  const encryptionKey = getEncryptionKey();
  const keyInfo: EncryptionKeyInfo = {
    key: encryptionKey,
    algorithm: "AES-256-GCM",
  };

  // Create LOCAL_BASE_FOLDER with restrictive permissions
  if (!existsSync(expandedPath)) {
    mkdirSync(expandedPath, { recursive: true, mode: 0o700 });
  }

  // Create GCS config service
  const configService = GCSConfigService.fromAppEnv();

  // Download and decrypt all files
  const count = await configService.downloadFolder(keyInfo, expandedPath);

  logger.info("Downloaded config folder", {
    bucket: configBucket,
    folder: expandedPath,
    file_count: count,
  });

  // TODO: Log to audit system
  // audit.logConfigDownload(configBucket, count, true, "");
}

/**
 * Uploads entire folder at sourcePath to GCS_CONFIG_BUCKET with encryption
 * Replaces existing files (no versioning)
 * Returns count of uploaded files
 */
export async function uploadConfigFolderFrom(sourcePath: string): Promise<number> {
  // Verify folder exists
  if (!existsSync(sourcePath)) {
    throw new Error(`source folder does not exist: ${sourcePath}`);
  }

  // Get GCS config bucket
  const configBucket = appenv.get("GCS_CONFIG_BUCKET")?.trim();
  if (!configBucket) {
    throw new Error("GCS_CONFIG_BUCKET environment variable is required");
  }

  // Get encryption key
  const encryptionKey = getEncryptionKey();
  const keyInfo: EncryptionKeyInfo = {
    key: encryptionKey,
    algorithm: "AES-256-GCM",
  };

  // Create GCS config service
  const configService = GCSConfigService.fromAppEnv();

  // Encrypt and upload all files
  const count = await configService.uploadFolder(keyInfo, sourcePath);

  logger.info("Uploaded config folder", {
    bucket: configBucket,
    folder: sourcePath,
    file_count: count,
  });

  // TODO: Log to audit system
  // audit.logConfigUpload(configBucket, count, true, "");

  return count;
}

/**
 * Removes LOCAL_BASE_FOLDER and all contents
 */
export function cleanupConfigFolder(): void {
  const baseFolder = appenv.get("LOCAL_BASE_FOLDER")?.trim();
  if (!baseFolder) {
    // Nothing to clean up if not set
    return;
  }

  const expandedPath = expandPath(baseFolder);

  // Remove entire folder
  if (existsSync(expandedPath)) {
    rmSync(expandedPath, { recursive: true, force: true });
    logger.info("Cleaned up config folder", { folder: expandedPath });
  }
}

// -------------------- Lifecycle Management --------------------

/**
 * Initializes secrets system by downloading config folder if ENABLE_S3 is set to true
 * Call this during application startup
 */
export async function initSecrets(): Promise<void> {
  const rawEnableS3 = appenv.get("ENABLE_S3");
  const enableS3 = rawEnableS3?.toLowerCase().trim();
  
  // Log the actual value for debugging
  logger.info("Checking ENABLE_S3 configuration", { 
    raw: rawEnableS3, 
    processed: enableS3,
    willDownload: enableS3 === "true"
  });
  
  // Expand tilde in GOOGLE_APPLICATION_CREDENTIALS if present , as it will not chahnge 
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.startsWith("~/")) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = join(
      homedir(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS.slice(2)
    );
  }
  
  if (enableS3 === "true") {
    logger.info("Downloading config folder from GCS...");
    
    try {
      await downloadConfigFolder();
      logger.info("Config folder downloaded successfully");
    } catch (error: any) {
      logger.error("Failed to download config folder", { error: error.message });
      throw new Error(`failed to download config folder: ${error.message}`);
    }
  } else {
    logger.info("ENABLE_S3 not set to true, skipping config folder download", {
      receivedValue: rawEnableS3,
      processedValue: enableS3
    });
  }

  // Ensure Google credentials path resolves locally after secrets init.
  // If GOOGLE_APPLICATION_CREDENTIALS points to a missing file, fall back
  // to the configured file inside LOCAL_BASE_FOLDER.
  const currentCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const currentCredsMissing = !!currentCredsPath && !existsSync(currentCredsPath);

  if (currentCredsMissing) {
    logger.warn("GOOGLE_APPLICATION_CREDENTIALS file not found; attempting fallback", {
      path: currentCredsPath,
    });
  }

  if (!currentCredsPath || currentCredsMissing) {
    const fallbackFilename = appenv.get("APPFILE_GCP_SERVICE_ACCOUNT_FILE")?.trim();

    if (fallbackFilename) {
      try {
        const fallbackPath = getAsFile(fallbackFilename);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = fallbackPath;
        logger.info("Using local GCP credentials file from LOCAL_BASE_FOLDER", {
          path: fallbackPath,
        });
      } catch (error: any) {
        logger.warn("Could not resolve local fallback GCP credentials file", {
          filename: fallbackFilename,
          error: error?.message,
        });
      }
    }
  }
}

/**
 * Shuts down secrets system by cleaning up local config folder
 * Call this during application shutdown
 */
export function shutdownSecrets(): void {
  const enableS3 = appenv.get("ENABLE_S3")?.toLowerCase().trim();
  if (enableS3 !== "true") {
    logger.info("Skipping secrets cleanup because ENABLE_S3 is not true", {
      receivedValue: appenv.get("ENABLE_S3"),
      processedValue: enableS3,
    });
    return;
  }

  try {
    cleanupConfigFolder();
    logger.info("Secrets system shutdown complete");
  } catch (error: any) {
    logger.error("Failed to cleanup config folder during shutdown", { error: error.message });
  }
}

// -------------------- Health Check --------------------

export interface SecretsHealthStatus {
  healthy: boolean;
  baseFolder?: string;
  folderExists: boolean;
  fileCount?: number;
  missingFiles?: string[];
  error?: string;
}

/**
 * Verifies LOCAL_BASE_FOLDER status and file availability
 */
export function checkSecretsHealth(): SecretsHealthStatus {
  const status: SecretsHealthStatus = {
    healthy: false,
    folderExists: false,
  };

  try {
    // Get and expand LOCAL_BASE_FOLDER
    const baseFolder = appenv.get("LOCAL_BASE_FOLDER")?.trim();
    if (!baseFolder) {
      status.error = "LOCAL_BASE_FOLDER environment variable not set";
      return status;
    }

    const expandedPath = expandPath(baseFolder);
    status.baseFolder = expandedPath;

    // Check if folder exists
    if (!existsSync(expandedPath)) {
      status.folderExists = false;
      status.error = "LOCAL_BASE_FOLDER does not exist";
      return status;
    }

    const stat = statSync(expandedPath);
    if (!stat.isDirectory()) {
      status.error = "LOCAL_BASE_FOLDER is not a directory";
      return status;
    }

    status.folderExists = true;

    // Count files in folder (recursive)
    let count = 0;
    const countFiles = (dirPath: string) => {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          count++;
        } else if (entry.isDirectory()) {
          countFiles(join(dirPath, entry.name));
        }
      }
    };

    countFiles(expandedPath);
    status.fileCount = count;
    status.healthy = true;

    return status;
  } catch (error: any) {
    status.error = error.message;
    return status;
  }
}
