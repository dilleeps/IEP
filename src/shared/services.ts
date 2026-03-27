// src/shared/services.ts
// Central service locator for shared services

import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { appenv } from "../config/appenv.js";
import { logger } from '../config/logger.js';
import { LangChainAiService } from "./ai/langchainAi.service.js";
import { PgVectorDbService } from "./ai/vectorDb.service.js";
import { UserStorageService } from "./storage/userStorageService.js";
import { GCS } from "./storage/gcs.js";
import { sendEmail } from "./notification/email.js";
import { sendTelegramMessage as sendTelegram } from "./notification/telegram.js";

// Singleton instances
let aiService: LangChainAiService | null = null;
let vectorDbService: PgVectorDbService | null = null;
let storageService: UserStorageService | null = null;

/**
 * Initialize and get AI service (LangChain-backed with Gemini)
 */
export function getAiService(): LangChainAiService {
  if (!aiService) {
    const apiKey = appenv.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    aiService = new LangChainAiService({
      apiKey,
      defaults: {
        model: appenv.get("GEMINI_MODEL") || "gemini-2.0-flash",
        temperature: parseFloat(appenv.get("GEMINI_TEMPERATURE") || "0.3"),
        systemMessage: appenv.get("GEMINI_SYSTEM_MESSAGE") || "You are a helpful assistant specializing in IEP support. Be concise and accurate.",
      },
    });
  }
  return aiService;
}

/**
 * Initialize and get vector DB service (PGVector with Gemini embeddings)
 */
export function getVectorDbService(): PgVectorDbService {
  if (!vectorDbService) {
    const ai = getAiService();
    vectorDbService = new PgVectorDbService(ai);
  }
  return vectorDbService;
}

/**
 * Initialize and get storage service (GCS/S3 for user documents)
 */
export function getStorageService(): UserStorageService {
  if (!storageService) {
    const storageBackend = appenv.get('STORAGE_BACKEND')?.trim().toLowerCase();
    const appEnvironment = appenv.get('APP_ENVIRONMENT')?.trim().toLowerCase();
    const useLocalStorage =
      storageBackend === 'local' ||
      (!storageBackend && appEnvironment === 'local');

    if (useLocalStorage) {
      const localRoot = resolveLocalStoragePath(
        appenv.get('LOCAL_STORAGE_ROOT') || '~/.iepappconfig/dev/storage',
      );
      logger.info('Using local filesystem storage backend', { localRoot });
      storageService = new UserStorageService({ localRoot });
      return storageService;
    }

    const bucket = appenv.get("GCS_BUCKET_NAME") || appenv.get("GCS_BUCKET");
    const projectId = appenv.get("GCP_PROJECT_ID");

    if (!bucket) {
      throw new Error("GCS_BUCKET_NAME or GCS_BUCKET environment variable is required");
    }

    const gcs = new GCS({
      bucket,
      projectId
    });

    storageService = new UserStorageService({ gcs });
  }
  return storageService;
}

/**
 * Export notification functions directly
 */
export const notification = {
  sendEmail,
  sendTelegram,
};

/**
 * Reset all services (useful for testing)
 */
export function resetServices(): void {
  aiService = null;
  vectorDbService = null;
  storageService = null;
}

function resolveLocalStoragePath(inputPath: string): string {
  if (inputPath.startsWith('~/')) {
    return resolve(join(homedir(), inputPath.slice(2)));
  }
  return resolve(inputPath);
}
