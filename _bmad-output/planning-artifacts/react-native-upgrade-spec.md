# React Native Upgrade Spec — 0.72.17 → 0.84.0

## Overview

Upgrade the mobile app from React Native 0.72.17 to 0.84.0. This includes React 18.2 → 19, NativeWind 2 → 4, TypeScript 4.8 → 5.3, and all supporting deps. New Architecture is default on in 0.74+ — native module compat must be verified.

---

## Risk Map

| Package | Risk | Action |
|---|---|---|
| `nativewind@2` → `v4` | 🔴 Breaking | New setup — remove babel plugin, add metro wrapper, add global.css |
| `react 18.2` → `19` | 🟡 Medium | Update types, fix any breaking React 19 patterns |
| `react-native-biometrics` | 🟡 Medium | Check New Arch support; fallback: disable New Arch in gradle.properties |
| `react-native-vector-icons` | 🟡 Medium | Ensure v10.x works with New Arch |
| `metro-react-native-babel-preset` | 🟡 Remove | Replaced by `@react-native/babel-preset` |
| `@react-native-firebase/*` | 🟢 Safe | v23.x supports New Architecture |
| `@react-navigation/*` | 🟢 Safe | v6 works on 0.84 |
| `react-native-gesture-handler` | 🟢 Safe | v2.30 supports New Arch |

---

## Target Versions

```json
"react-native": "0.84.0",
"react": "19.0.0",
"nativewind": "^4.1.23",
"tailwindcss": "^3.4.0",
"typescript": "^5.3.3",
"@react-native/babel-preset": "0.84.0",
"@react-native/metro-config": "0.84.0",
"@react-native/eslint-config": "0.84.0",
"@types/react": "^19.0.0",
"@types/react-test-renderer": "^19.0.0",
"@tsconfig/react-native": "^3.4.0",
"babel-jest": "^29.6.0",
"jest": "^29.6.0"
```

**Remove:**
- `metro-react-native-babel-preset` (deprecated, replaced by `@react-native/babel-preset`)

---

## File Changes

### 1. `package.json`
Apply all target versions above. Remove `metro-react-native-babel-preset`.

### 2. `babel.config.js`
```js
module.exports = {
  presets: ['@react-native/babel-preset'],
  // nativewind/babel plugin REMOVED — handled by metro now
};
```

### 3. `metro.config.js`
```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = mergeConfig(getDefaultConfig(__dirname), {});
module.exports = withNativeWind(config, { input: './global.css' });
```

### 4. New file — `global.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. `tailwind.config.js` (create if not exists)
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './index.js',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 6. `index.js` — add CSS import at top
```js
import './global.css';
// existing imports follow...
```

### 7. `tsconfig.json`
```json
{
  "extends": "@tsconfig/react-native/tsconfig.json",
  "compilerOptions": {
    "strict": false
  }
}
```

### 8. Native files — apply from React Native Upgrade Helper
Reference diff: https://react-native-community.github.io/upgrade-helper/?from=0.72.17&to=0.84.0

Key native files that change:
- `android/build.gradle` — gradle version, compileSdkVersion
- `android/app/build.gradle` — targetSdkVersion, RN version refs
- `android/gradle/wrapper/gradle-wrapper.properties` — gradle wrapper version
- `android/gradle.properties` — New Architecture flag
- `ios/Podfile` — platform version, New Arch flag
- `ios/<AppName>/AppDelegate.mm` — RN 0.73+ uses new AppDelegate pattern

### 9. `android/gradle.properties` — New Architecture
```properties
newArchEnabled=true
```
> If `react-native-biometrics` fails with New Arch, set `newArchEnabled=false` as fallback and note it.

---

## Implementation Steps

1. **Apply native file changes** from upgrade helper diff (android/ + ios/ + Podfile)
2. **Update `package.json`** — bump all versions, remove `metro-react-native-babel-preset`
3. **Run `npm install`**
4. **Update `babel.config.js`** — swap preset, remove nativewind plugin
5. **Update `metro.config.js`** — add `withNativeWind` wrapper
6. **Create `global.css`** + **`tailwind.config.js`**
7. **Add `import './global.css'`** to `index.js`
8. **iOS: `cd ios && pod install`**
9. **Verify build** — `npm run android` / `npm run ios`
10. **Fix any New Arch compat issues** — check `react-native-biometrics`, `react-native-vector-icons`
11. **Fix any TypeScript errors** from TS 4.8 → 5.3

---

## Fallback — New Architecture Issues

If native modules break with New Architecture:

```properties
# android/gradle.properties
newArchEnabled=false
```

```ruby
# ios/Podfile
ENV['RCT_NEW_ARCH_ENABLED'] = '0'
```

Document which module caused it and open an issue/track for future resolution.

---

## Notes

- **NativeWind v4 `styled()` API** is removed — use `className` prop directly. The existing codebase appears to use `className` already so this should be a no-op.
- **React 19** removes some deprecated APIs (`defaultProps` on function components etc.) — fix any TS errors that surface.
- **`@tsconfig/react-native` v3.4** extends correctly for RN 0.84 + TS 5.x.
- Native changes are mechanical — the upgrade helper diff is the authoritative source for `android/` and `ios/` file changes.
