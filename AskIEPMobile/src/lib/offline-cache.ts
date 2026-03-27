import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'askiep_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple offline cache built on AsyncStorage.
 * Stores API responses so the app can display data when offline.
 * TTL-based expiry ensures stale data is refreshed when connectivity returns.
 */
export const offlineCache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;
      if (age > CACHE_TTL_MS) {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Silently fail — cache is best-effort
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch {
      // Silently fail
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {
      // Silently fail
    }
  },
};

/**
 * React Query persister integration.
 * Can be used with React Query's built-in persistence to cache query data offline.
 */
export function createOfflineQueryFn<T>(
  key: string,
  fetchFn: () => Promise<T>,
): () => Promise<T> {
  return async () => {
    try {
      const data = await fetchFn();
      await offlineCache.set(key, data);
      return data;
    } catch (error) {
      // If fetch fails, try to return cached data
      const cached = await offlineCache.get<T>(key);
      if (cached) return cached;
      throw error;
    }
  };
}
