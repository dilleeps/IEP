/**
 * AuthProvider — Expo-managed (zero native modules).
 *
 * Google Sign-In (web)    → Firebase signInWithPopup / signInWithRedirect → backend token exchange
 * Google Sign-In (native) → WebBrowser.openAuthSessionAsync → UI /mobile-auth page
 *                            → Firebase signInWithRedirect → deep link askiepmobile://auth?token=…
 * Apple Sign-In           → expo-apple-authentication → Firebase credential → backend token exchange
 * Token storage           → expo-secure-store (Keychain/Keystore)
 * Token refresh           → auto-scheduled 5 min before JWT expiry
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import {
    signOut as firebaseSignOut,
    getRedirectResult,
    GoogleAuthProvider,
    OAuthProvider,
    signInWithCredential,
    signInWithPopup,
    signInWithRedirect,
} from 'firebase/auth';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Platform } from 'react-native';
import { authService, type AuthUser } from '../lib/auth-service';
import { firebaseAuth } from '../lib/firebase';
import { secureStore } from '../lib/secure-store';

// UI page that handles Firebase signInWithRedirect → deep-links tokens back to the app
const MOBILE_AUTH_URL =
  process.env.EXPO_PUBLIC_MOBILE_AUTH_URL ?? 'https://dev.askiep.com/mobile-auth';

// Detect mobile browser (Android/iOS Chrome, Safari mobile)
// signInWithPopup is blocked by mobile browsers — use redirect flow instead
const isMobileBrowser =
  Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

console.log('[Auth] 🔧 Config:', { MOBILE_AUTH_URL, platform: Platform.OS, isMobileBrowser });

// ── Token helpers ──────────────────────────────────────────────────────────────
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 min before expiry

function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

/** SHA-256 a string using the Web Crypto API (available in RN 0.78+/Hermes). */
async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRawNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: 32}, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}

// ── Context types ──────────────────────────────────────────────────────────────
interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  /** Called by app/auth.tsx after deep link returns from UI /mobile-auth */
  handleMobileAuthCallback: (token: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// ── Provider ───────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isNewUser: false,
  });

  // ── Handle Firebase redirect result on mount (web mobile flow) ────────────────
  // signInWithRedirect reloads the page; on next mount getRedirectResult resolves.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (!result) return; // no pending redirect
        console.log('[Auth] ✅ Redirect sign-in result:', result.user.email);
        const firebaseIdToken = await result.user.getIdToken();
        await handleExchangeToken(firebaseIdToken);
      })
      .catch((err) => {
        console.error('[Auth] ❌ getRedirectResult error:', err.code, err.message);
        setState(prev => ({ ...prev, isLoading: false }));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ── Restore session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await secureStore.getToken();
        if (token) {
          const exp = decodeJwtExp(token);
          if (exp && exp > Date.now()) {
            const payload = decodeJwtPayload(token);
            if (payload) {
              setState({
                user: {
                  id: payload.sub,
                  email: payload.email,
                  displayName: payload.displayName || payload.email,
                  role: payload.role,
                  status: payload.status,
                  provider: 'google',
                  isApproved: payload.isApproved,
                  isActive: true,
                },
                isLoading: false,
                isAuthenticated: true,
                isNewUser: false,
              });
              return;
            }
          }

          // Try refresh
          const refreshToken = await secureStore.getRefreshToken();
          if (refreshToken) {
            try {
              const result = await authService.refreshAccessToken(refreshToken);
              await secureStore.saveTokens({
                token: result.token,
                refreshToken: result.refreshToken,
              });
              const payload = decodeJwtPayload(result.token);
              if (payload) {
                setState({
                  user: {
                    id: payload.sub,
                    email: payload.email,
                    displayName: payload.displayName || payload.email,
                    role: payload.role,
                    status: payload.status,
                    provider: 'google',
                    isApproved: payload.isApproved,
                    isActive: true,
                  },
                  isLoading: false,
                  isAuthenticated: true,
                  isNewUser: false,
                });
                return;
              }
            } catch {
              await secureStore.clearTokens();
            }
          }
        }
      } catch {
        // Keychain access failed — start fresh
      }
      setState(prev => ({...prev, isLoading: false}));
    };
    restore();
  }, []);

  // ── Auto-refresh timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isAuthenticated) return;
    let timer: ReturnType<typeof setTimeout>;

    const scheduleRefresh = async () => {
      const token = await secureStore.getToken();
      if (!token) return;
      const exp = decodeJwtExp(token);
      if (!exp) return;
      const delay = Math.max(0, exp - Date.now() - TOKEN_REFRESH_BUFFER_MS);
      timer = setTimeout(async () => {
        try {
          const refreshToken = await secureStore.getRefreshToken();
          if (refreshToken) {
            const result = await authService.refreshAccessToken(refreshToken);
            await secureStore.saveTokens({
              token: result.token,
              refreshToken: result.refreshToken,
            });
          }
        } catch {
          await secureStore.clearTokens();
          setState({user: null, isLoading: false, isAuthenticated: false, isNewUser: false});
        }
      }, delay);
    };

    scheduleRefresh();
    return () => clearTimeout(timer);
  }, [state.isAuthenticated]);

  // ── Shared: exchange Firebase ID token for backend JWT ────────────────────────
  const handleExchangeToken = useCallback(async (firebaseIdToken: string) => {
    const result = await authService.exchangeFirebaseToken(firebaseIdToken);
    await secureStore.saveTokens({
      token: result.token,
      refreshToken: result.refreshToken,
    });
    setState({
      user: result.user,
      isLoading: false,
      isAuthenticated: true,
      isNewUser: result.isNewUser,
    });
  }, []);

  // ── Mobile auth callback (deep link from UI /mobile-auth page) ─────────────────
  const handleMobileAuthCallback = useCallback(async (token: string, refreshToken: string) => {
    console.log('[Auth] 📲 handleMobileAuthCallback — storing tokens');
    await secureStore.saveTokens({ token, refreshToken });
    const payload = decodeJwtPayload(token);
    if (!payload) throw new Error('Invalid token received from mobile auth');
    setState({
      user: {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName || payload.email,
        role: payload.role,
        status: payload.status,
        provider: 'google',
        isApproved: payload.isApproved,
        isActive: true,
      },
      isLoading: false,
      isAuthenticated: true,
      isNewUser: false,
    });
  }, []);

  // ── Google Sign-In ─────────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    console.log('[Auth] 🚀 Starting Google Sign-In... platform:', Platform.OS);

    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      try {
        if (isMobileBrowser) {
          // Mobile browser: popup is blocked — use redirect (page reloads, result caught on mount)
          console.log('[Auth] 📱 Mobile browser detected — using signInWithRedirect');
          await signInWithRedirect(firebaseAuth, provider);
          return; // page will reload; getRedirectResult hook handles the result
        }
        // Desktop browser: popup stays in same JS context
        const userCredential = await signInWithPopup(firebaseAuth, provider);
        console.log('[Auth] ✅ Web popup sign-in success:', userCredential.user.email);
        const firebaseIdToken = await userCredential.user.getIdToken();
        await handleExchangeToken(firebaseIdToken);
      } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          throw new Error('Google Sign-In was cancelled');
        }
        console.error('[Auth] ❌ Web sign-in error:', err.code, err.message);
        throw err;
      }
      return;
    }

    // Native (iOS / Android): open UI /mobile-auth in system browser.
    // The page runs Firebase signInWithRedirect, then deep-links tokens back.
    const url = `${MOBILE_AUTH_URL}?redirect=${encodeURIComponent('askiepmobile://auth')}`;
    console.log('[Auth] 📱 Opening mobile auth URL:', url);
    const result = await WebBrowser.openAuthSessionAsync(url, 'askiepmobile://');
    console.log('[Auth] 🌐 WebBrowser result type:', result.type);

    if (result.type !== 'success') {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google Sign-In was cancelled');
      }
      throw new Error(`Google Sign-In failed (${result.type})`);
    }
    // Tokens arrive via deep link → app/auth.tsx → handleMobileAuthCallback
    // WebBrowser closes automatically when the deep link fires; no further action needed here.
  }, [handleExchangeToken]);

  // ── Apple Sign-In ──────────────────────────────────────────────────────────────
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    const rawNonce = generateRawNonce();
    const hashedNonce = await sha256(rawNonce);

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!appleCredential.identityToken) {
      throw new Error('Apple Sign-In failed — no identity token');
    }

    const provider = new OAuthProvider('apple.com');
    const firebaseCredential = provider.credential({
      idToken: appleCredential.identityToken,
      rawNonce,
    });

    const userCredential = await signInWithCredential(firebaseAuth, firebaseCredential);
    const firebaseIdToken = await userCredential.user.getIdToken();
    await handleExchangeToken(firebaseIdToken);
  }, [handleExchangeToken]);

  // ── Sign-Out ────────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      const token = await secureStore.getToken();
      if (token) await authService.revokeToken(token);
    } catch {
      // Best-effort
    }
    try {
      await firebaseSignOut(firebaseAuth);
    } catch {
      // Firebase sign-out optional
    }
    await secureStore.clearTokens();
    setState({user: null, isLoading: false, isAuthenticated: false, isNewUser: false});
  }, []);

  const getAccessToken = useCallback(async () => secureStore.getToken(), []);

  const value = useMemo(
    () => ({...state, signInWithGoogle, signInWithApple, signOut, getAccessToken, handleMobileAuthCallback}),
    [state, signInWithGoogle, signInWithApple, signOut, getAccessToken, handleMobileAuthCallback],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
