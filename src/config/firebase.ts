import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { appenv } from './appenv.js';
import { logger } from './logger.js';
import { getFirebaseAccountFile } from './fileconfig.js';

let firebaseApp: admin.app.App | null = null;
let firebaseInitError: Error | null = null;

export function initializeFirebase(): void {
  if (firebaseApp || firebaseInitError) {
    if (firebaseInitError) {
      throw firebaseInitError;
    }
    return;
  }

  try {
    const rawJson = appenv.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    const isCloudRun = !!process.env.K_SERVICE;

    if (rawJson) {
      const credentials: admin.ServiceAccount = JSON.parse(rawJson);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    } else if (isCloudRun) {
      // On Cloud Run, use Application Default Credentials (service account identity)
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      const firebaseFilePath = getFirebaseAccountFile();
      const fileContent = readFileSync(firebaseFilePath, 'utf-8');
      const credentials: admin.ServiceAccount = JSON.parse(fileContent);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    }
    logger.info('Firebase initialized');
  } catch (error) {
    firebaseInitError = error instanceof Error ? error : new Error('Failed to initialize Firebase');
    logger.error('Failed to initialize Firebase', { error });
    throw firebaseInitError;
  }
}

export function getFirebaseAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    throw firebaseInitError ?? new Error('Firebase not initialized');
  }

  return admin.auth(firebaseApp);
}
