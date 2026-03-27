// src/config/fileconfig.ts
//
// File configuration utilities for retrieving config files from LOCAL_BASE_FOLDER

import { getAsFile } from "../shared/storage/secrets.js";
import { appenv } from "./appenv.js";

/**
 * Returns the full path to the GCP service account JSON file
 * Uses APPFILE_GCP_SERVICE_ACCOUNT_FILE environment variable
 * Throws error if environment variable is not set
 */
export function getGcpAccountFile(): string {
  const filename = appenv.get("APPFILE_GCP_SERVICE_ACCOUNT_FILE")?.trim();
  if (!filename) {
    throw new Error("APPFILE_GCP_SERVICE_ACCOUNT_FILE environment variable is required");
  }
  return getAsFile(filename);
}

/**
 * Returns the full path to the Firebase service account JSON file
 * Uses APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE environment variable
 * Throws error if environment variable is not set
 */
export function getFirebaseAccountFile(): string {
  const filename = appenv.get("APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE")?.trim();
  if (!filename) {
    throw new Error("APPFILE_FIREBASE_SERVICE_ACCOUNT_FILE environment variable is required");
  }
  return getAsFile(filename);
}
