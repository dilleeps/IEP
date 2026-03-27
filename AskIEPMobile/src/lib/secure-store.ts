// Token storage backed by Expo SecureStore (iOS Keychain / Android Keystore).
// Falls back to localStorage on web (SecureStore is unavailable in browsers).
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'askiep_auth_token';
const REFRESH_KEY = 'askiep_refresh_token';

export interface StoredTokens {
  token: string;
  refreshToken: string;
}

// Web shim using localStorage (not secure, fine for development)
const webStore = {
  async setItemAsync(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },
  async getItemAsync(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },
  async deleteItemAsync(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

const store = Platform.OS === 'web' ? webStore : SecureStore;

export const secureStore = {
  // ── Auth tokens ───────────────────────────────────────────────────────────
  async saveTokens(tokens: StoredTokens): Promise<void> {
    await store.setItemAsync(TOKEN_KEY, tokens.token);
    await store.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  },

  async getToken(): Promise<string | null> {
    return store.getItemAsync(TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return store.getItemAsync(REFRESH_KEY);
  },

  async clearTokens(): Promise<void> {
    await store.deleteItemAsync(TOKEN_KEY);
    await store.deleteItemAsync(REFRESH_KEY);
  },

  // ── Generic key/value store ───────────────────────────────────────────────
  async setItem(key: string, value: string): Promise<void> {
    await store.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return store.getItemAsync(key);
  },

  async removeItem(key: string): Promise<void> {
    await store.deleteItemAsync(key);
  },
};
