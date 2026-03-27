# AskIEP Mobile — Setup Guide

> **Starting point:** You have `AskIEPMobile/` — a fresh `create-expo-app` scaffold (Expo 54, RN 0.81.5, React 19).
> Your source files are in `mobileexpo/src/` and `mobileexpo/app/`.
> This guide takes you from zero to running in iOS Simulator.

---

## 1. Copy Source Files

From the repo root (`iepapp/`):

```bash
# Copy all source files into AskIEPMobile
cp -r apps/mobileexpo/src/               apps/AskIEPMobile/src/
cp -r apps/mobileexpo/app/(auth)/        apps/AskIEPMobile/app/(auth)/
cp -r apps/mobileexpo/app/(tabs)/        apps/AskIEPMobile/app/(tabs)/
cp    apps/mobileexpo/app/_layout.tsx    apps/AskIEPMobile/app/_layout.tsx
cp    apps/mobileexpo/global.css         apps/AskIEPMobile/global.css
cp    apps/mobileexpo/tailwind.config.js apps/AskIEPMobile/tailwind.config.js
```

Delete the scaffold placeholder screens (they conflict):

```bash
cd apps/AskIEPMobile
rm -rf app/\(tabs\)  # scaffold has its own — ours replaces it
```

---

## 2. Install Additional Packages

The scaffold already has `expo`, `react-native`, `expo-router`, `expo-web-browser`.
Add the packages our app needs — **always use `npx expo install`** (not `npm install`) so Expo picks the right version for SDK 54:

```bash
cd apps/AskIEPMobile

npx expo install \
  firebase \
  expo-secure-store \
  expo-local-authentication \
  expo-apple-authentication \
  expo-auth-session \
  expo-document-picker \
  @tanstack/react-query \
  nativewind \
  "tailwindcss@^3"
```

---

## 3. Configure NativeWind

**`babel.config.js`** — replace the entire file:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

**`metro.config.js`** — replace the entire file:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

---

## 4. Configure Path Aliases

In `tsconfig.json`, add `paths` inside `compilerOptions`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 5. Set Up Environment Variables

Create `apps/AskIEPMobile/.env` — Expo only reads `EXPO_PUBLIC_*` prefixed vars:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyB6ICE6tfiduVIbT6aKWPI-4QVYiQQBWQ0
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=gen-lang-client-0350197188.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=gen-lang-client-0350197188
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=gen-lang-client-0350197188.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=454503056114
EXPO_PUBLIC_FIREBASE_APP_ID=1:454503056114:web:6f900d2682b4dd5998466b

# Get this from Firebase Console → Authentication → Sign-in method → Google → Web client ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE
```

> **Where to find `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`:**
> Firebase Console → your project → Authentication → Sign-in method → Google → expand → copy "Web client ID"

---

## 6. Update `app.json`

Add `scheme` (required for OAuth redirect) and `expo-router` plugin:

```json
{
  "expo": {
    "name": "AskIEP",
    "slug": "askiep-mobile",
    "scheme": "askiep",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.askiep.mobile"
    },
    "android": {
      "package": "com.askiepmobile",
      "adaptiveIcon": {
        "backgroundColor": "#ffffff"
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-local-authentication",
      "expo-apple-authentication"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 7. Run on iOS Simulator

```bash
cd apps/AskIEPMobile
npx expo start --ios
```

This opens Expo CLI. Press `i` to launch in iOS Simulator — **no build step needed for simulator**.

> Simulator runs via `expo run:ios` (compiles Swift/ObjC) or `npx expo start --ios` (JS-only, faster).
> For first run, use `npx expo start --ios` — if it errors on a native module, switch to `npx expo run:ios`.

---

## 8. What Works vs. What Needs Extra Config

| Feature | Status | Notes |
|---|---|---|
| UI, routing, navigation | ✅ Ready | NativeWind + expo-router |
| Firebase (JS SDK) | ✅ Ready | Pure JS, no native setup needed |
| Secure token storage | ✅ Ready | `expo-secure-store` |
| Biometric auth | ✅ Simulator limited | Face ID prompt appears but always fails on simulator — passes on real device |
| Google Sign-In | ⚠️ Needs client ID | Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env` |
| Apple Sign-In | ⚠️ iOS only | Works on real iOS device; simulator may show button but auth fails |
| Document picker | ✅ Ready | `expo-document-picker` |
| API calls | ⚠️ Needs backend running | Start backend (`cd iepapp && task start`) before testing |

---

## 9. Troubleshooting

**`className` has no effect (NativeWind not working)**
```bash
# Clear Metro cache
npx expo start --clear
```

**`@/*` import not resolving**
Make sure `tsconfig.json` has `baseUrl: "."` and `paths: { "@/*": ["src/*"] }`.

**Google Sign-In popup never appears**
`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is missing or wrong. Check value in Firebase Console.

**`Cannot find module 'expo-local-authentication'`**
Run `npx expo install expo-local-authentication` — don't use plain `npm install`.

**Metro bundler error about `global.css`**
Ensure `metro.config.js` has `withNativeWind(config, { input: './global.css' })`.

---

## 10. File Map — What Came From Where

```
AskIEPMobile/
  app/
    _layout.tsx              ← from mobileexpo/app/_layout.tsx
    (auth)/
      _layout.tsx            ← from mobileexpo/app/(auth)/
      sign-in.tsx            ← from mobileexpo/app/(auth)/
      consent.tsx            ← from mobileexpo/app/(auth)/
    (tabs)/
      _layout.tsx            ← from mobileexpo/app/(tabs)/
      index.tsx              ← Dashboard
      documents.tsx          ← IEP Documents
      tracking.tsx           ← Goals/Behaviors
      chat.tsx               ← AI Advocate
      settings.tsx           ← Settings + Sign Out
  src/
    lib/
      firebase.ts            ← Firebase JS SDK init
      secure-store.ts        ← expo-secure-store wrapper (replaces react-native-keychain)
      biometric-service.ts   ← expo-local-authentication wrapper (replaces react-native-biometrics)
      auth-service.ts        ← exchangeFirebaseToken, refreshAccessToken, revokeToken
      api-client.ts          ← apiRequest<T>(), auto-refresh on 401
      api-config.ts          ← all endpoint URLs + localhost→10.0.2.2 for Android
    providers/
      AuthProvider.tsx       ← Google + Apple sign-in, session restore, useAuth()
      QueryProvider.tsx      ← TanStack Query (staleTime=5min, retry=2)
    components/
      BiometricGate.tsx      ← wraps (tabs) layout, prompts on foreground
  global.css                 ← Tailwind directives
  tailwind.config.js         ← NativeWind content paths
```
