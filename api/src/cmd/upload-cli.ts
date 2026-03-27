import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

// =========================
// Environment Variables
// =========================
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_BUCKET_NAME = process.env.GCP_BUCKET_NAME;

if (!GCP_PROJECT_ID) {
  console.error("❌ Error: GCP_PROJECT_ID environment variable is required");
  process.exit(1);
}

if (!GCP_BUCKET_NAME) {
  console.error("❌ Error: GCP_BUCKET_NAME environment variable is required");
  process.exit(1);
}

// =========================
// Helper Functions
// =========================
const storage = new Storage({ projectId: GCP_PROJECT_ID });

async function bucketExists(): Promise<boolean> {
  try {
    const [exists] = await storage.bucket(GCP_BUCKET_NAME).exists();
    return exists;
  } catch (error) {
    return false;
  }
}

async function createBucket(): Promise<void> {
  try {
    console.log(`[*] Creating bucket: ${GCP_BUCKET_NAME}`);
    await storage.createBucket(GCP_BUCKET_NAME, {
      location: process.env.GCP_REGION || "us-central1",
      storageClass: "STANDARD",
    });
    console.log(`✅ Bucket created: ${GCP_BUCKET_NAME}`);
  } catch (error: any) {
    console.error(`❌ Error creating bucket: ${error.message}`);
    throw error;
  }
}

async function uploadFile(
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  // Expand tilde in source path
  const expandedSource = sourcePath.replace(/^~/, process.env.HOME || "");

  // Check if source file exists
  if (!fs.existsSync(expandedSource)) {
    throw new Error(`Source file not found: ${expandedSource}`);
  }

  const bucket = storage.bucket(GCP_BUCKET_NAME);

  // Remove leading slash from destination
  const cleanDest = destinationPath.replace(/^\/+/, "");

  console.log(`[*] Uploading: ${expandedSource} -> gs://${GCP_BUCKET_NAME}/${cleanDest}`);

  try {
    await bucket.upload(expandedSource, {
      destination: cleanDest,
      metadata: {
        cacheControl: "public, max-age=3600",
      },
    });

    console.log(`✅ Upload complete: ${cleanDest}`);
    console.log(
      `🌐 URL: https://storage.googleapis.com/${GCP_BUCKET_NAME}/${cleanDest}`
    );
  } catch (error: any) {
    console.error(`❌ Upload failed: ${error.message}`);
    throw error;
  }
}

async function uploadDirectory(
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const expandedSource = sourcePath.replace(/^~/, process.env.HOME || "");

  if (!fs.existsSync(expandedSource)) {
    throw new Error(`Source directory not found: ${expandedSource}`);
  }

  if (!fs.statSync(expandedSource).isDirectory()) {
    throw new Error(`Source is not a directory: ${expandedSource}`);
  }

  const bucket = storage.bucket(GCP_BUCKET_NAME);
  const cleanDest = destinationPath.replace(/^\/+/, "");

  console.log(`[*] Uploading directory: ${expandedSource} -> gs://${GCP_BUCKET_NAME}/${cleanDest}`);

  const files = fs.readdirSync(expandedSource, { recursive: true });
  let uploadCount = 0;

  for (const file of files) {
    const filePath = path.join(expandedSource, file.toString());
    
    if (fs.statSync(filePath).isDirectory()) {
      continue;
    }

    const relativePath = path.relative(expandedSource, filePath);
    const destPath = cleanDest ? `${cleanDest}/${relativePath}` : relativePath;

    try {
      await bucket.upload(filePath, {
        destination: destPath,
        metadata: {
          cacheControl: "public, max-age=3600",
        },
      });
      uploadCount++;
      console.log(`  ✓ ${relativePath}`);
    } catch (error: any) {
      console.error(`  ✗ ${relativePath}: ${error.message}`);
    }
  }

  console.log(`✅ Upload complete: ${uploadCount} files uploaded`);
}

async function downloadFile(
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const bucket = storage.bucket(GCP_BUCKET_NAME);
  const cleanSource = sourcePath.replace(/^\/+/, "");
  const expandedDest = destinationPath.replace(/^~/, process.env.HOME || "");

  console.log(`[*] Downloading: gs://${GCP_BUCKET_NAME}/${cleanSource} -> ${expandedDest}`);

  try {
    // Create directory if it doesn't exist
    const destDir = path.dirname(expandedDest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    await bucket.file(cleanSource).download({
      destination: expandedDest,
    });

    console.log(`✅ Download complete: ${expandedDest}`);
  } catch (error: any) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

async function listFiles(prefix?: string): Promise<void> {
  const bucket = storage.bucket(GCP_BUCKET_NAME);
  const cleanPrefix = prefix?.replace(/^\/+/, "");

  console.log(`[*] Listing files in gs://${GCP_BUCKET_NAME}${cleanPrefix ? `/${cleanPrefix}` : ""}`);

  try {
    const [files] = await bucket.getFiles({ prefix: cleanPrefix });

    if (files.length === 0) {
      console.log("  (no files found)");
      return;
    }

    files.forEach((file) => {
      console.log(`  📄 ${file.name} (${formatBytes(String(file.metadata.size))})`);
    });

    console.log(`\n✅ Total: ${files.length} files`);
  } catch (error: any) {
    console.error(`❌ List failed: ${error.message}`);
    throw error;
  }
}

function formatBytes(bytes: string | undefined): string {
  if (!bytes) return "0 B";
  const size = parseInt(bytes);
  if (size === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return Math.round((size / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// =========================
// Main CLI
// =========================
const cmd = process.argv[2];
const sourcePath = process.argv[3];
const destinationPath = process.argv[4];

console.log("=".repeat(50));
console.log("GCP Storage Upload CLI");
console.log(`  Project: ${GCP_PROJECT_ID}`);
console.log(`  Bucket: ${GCP_BUCKET_NAME}`);
console.log("=".repeat(50));
console.log();

async function main() {
  try {
    // Ensure bucket exists
    if (!(await bucketExists())) {
      await createBucket();
      console.log();
    }

    if (cmd === "upload") {
      if (!sourcePath || !destinationPath) {
        console.error("❌ Error: Both source and destination paths are required");
        console.log("Usage: tsx src/db/upload-cli.ts upload <source> <destination>");
        process.exit(1);
      }

      await uploadFile(sourcePath, destinationPath);
      process.exit(0);
    }

    if (cmd === "upload-dir") {
      if (!sourcePath || !destinationPath) {
        console.error("❌ Error: Both source and destination paths are required");
        console.log("Usage: tsx src/db/upload-cli.ts upload-dir <source-dir> <destination-prefix>");
        process.exit(1);
      }

      await uploadDirectory(sourcePath, destinationPath);
      process.exit(0);
    }

    if (cmd === "download") {
      if (!sourcePath || !destinationPath) {
        console.error("❌ Error: Both source and destination paths are required");
        console.log("Usage: tsx src/db/upload-cli.ts download <source> <destination>");
        process.exit(1);
      }

      await downloadFile(sourcePath, destinationPath);
      process.exit(0);
    }

    if (cmd === "list") {
      const prefix = sourcePath; // optional
      await listFiles(prefix);
      process.exit(0);
    }

    // Show usage
    console.log("Usage:");
    console.log("  tsx src/db/upload-cli.ts upload <source> <destination>");
    console.log("    Upload a single file to the bucket");
    console.log();
    console.log("  tsx src/db/upload-cli.ts upload-dir <source-dir> <destination-prefix>");
    console.log("    Upload an entire directory recursively");
    console.log();
    console.log("  tsx src/db/upload-cli.ts download <source> <destination>");
    console.log("    Download a file from the bucket");
    console.log();
    console.log("  tsx src/db/upload-cli.ts list [prefix]");
    console.log("    List files in the bucket (optionally with prefix)");
    console.log();
    console.log("Environment Variables:");
    console.log("  GCP_PROJECT_ID   - Required: Your GCP project ID");
    console.log("  GCP_BUCKET_NAME  - Required: Target bucket name");
    console.log("  GCP_REGION       - Optional: Bucket region (default: us-central1)");
    console.log();
    console.log("Examples:");
    console.log("  tsx src/db/upload-cli.ts upload ./config.json configs/prod/config.json");
    console.log("  tsx src/db/upload-cli.ts upload-dir ./dist public");
    console.log("  tsx src/db/upload-cli.ts download configs/prod/config.json ./local-config.json");
    console.log("  tsx src/db/upload-cli.ts list configs/");
    process.exit(1);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
