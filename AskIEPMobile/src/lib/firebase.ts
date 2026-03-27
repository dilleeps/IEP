// Firebase initialized with the JS SDK (Expo managed — no native modules, no CocoaPods)
// Config values come from Expo public env vars (EXPO_PUBLIC_*).
// Create a .env file at project root with the values from:
//   Firebase Console → Your project → Project Settings → Web App → Config snippet

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import type { Persistence } from 'firebase/auth';
import { initializeAuth } from 'firebase/auth';

// getReactNativePersistence lives in Firebase's Metro/React-Native bundle.
// Metro resolves it correctly at runtime via the "react-native" export condition,
// but tsc uses the browser/ESM types which don't expose it.
const { getReactNativePersistence } = require('@firebase/auth') as {
   
  getReactNativePersistence(storage: any): Persistence;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'TODO_REPLACE',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'TODO_REPLACE',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'TODO_REPLACE',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'TODO_REPLACE',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'TODO_REPLACE',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'TODO_REPLACE',
};

// ── DEBUG: log Firebase env var status on startup ────────────────────────────
const missingVars: string[] = [];
if (!process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'TODO_REPLACE') missingVars.push('EXPO_PUBLIC_FIREBASE_API_KEY');
if (!process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN === 'TODO_REPLACE') missingVars.push('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID === 'TODO_REPLACE') missingVars.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
if (!process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID === 'TODO_REPLACE') missingVars.push('EXPO_PUBLIC_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  console.error('[Firebase] ❌ Missing env vars — set these in .env:', missingVars);
} else {
  console.log('[Firebase] ✅ Config loaded:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: firebaseConfig.apiKey?.slice(0, 8) + '...', // masked
  });
}

// Guard against duplicate initialisation (hot reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Use AsyncStorage for persistence so auth state survives app restarts.
// initializeAuth throws if called twice (hot reload); fall back to getAuth.
let _auth: ReturnType<typeof initializeAuth>;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialised (Fast Refresh / hot reload)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _auth = require('firebase/auth').getAuth(app);
}

export const firebaseAuth = _auth;

export default firebaseAuth;
