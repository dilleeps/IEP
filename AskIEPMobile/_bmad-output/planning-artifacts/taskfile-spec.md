# AskIEP Mobile — Taskfile Spec

**Date:** 2026-02-21
**Status:** Draft (Party Mode discussion — Architect + Dev + Analyst)
**File:** `apps/mobile/Taskfile.yml`
**Workspace:** `ios/AskIEPMobile.xcworkspace`
**Scheme:** `AskIEPMobile`

---

## 1. Overview

Expand the existing mobile Taskfile with build, device targeting, setup/onboarding, quality gates, JS bundle, and environment validation tasks. Organize all tasks by category for developer ergonomics.

---

## 2. Taskfile Variables

```yaml
vars:
  APP_NAME: AskIEPMobile
  IOS_WORKSPACE: ios/{{.APP_NAME}}.xcworkspace
  IOS_SCHEME: "{{.APP_NAME}}"
  ANDROID_DIR: android
  BUNDLE_OUTPUT_DIR: build
```

---

## 3. Task Inventory

### 3.1 Setup & Maintenance

| Task | Description | Commands |
|---|---|---|
| `setup` | First-time dev onboarding | `install` → `pods` → `env:check` |
| `nuke` | Full reset — burn it down, rebuild | `clean` → `install` → `pods` |
| `env:check` | Validate required env vars and native config files exist | Check `.env`, `ios/GoogleService-Info.plist`, `android/app/google-services.json` |

### 3.2 Run (Dev)

| Task | Description | Command | Status |
|---|---|---|---|
| `dev` | Start Metro bundler | `npx react-native start` | ✅ Exists |
| `ios` | Run on iOS simulator | `npx react-native run-ios` | ✅ Exists |
| `android` | Run on Android emulator | `npx react-native run-android` | ✅ Exists |
| `ios:device` | Run on physical iOS device | `npx react-native run-ios --device` | 🆕 New |
| `android:device` | Run on physical Android device | `npx react-native run-android --active-arch-only` | 🆕 New |

### 3.3 Build

| Task | Description | Command | Status |
|---|---|---|---|
| `build:android:debug` | Debug APK | `cd android && ./gradlew assembleDebug` | 🆕 New |
| `build:android:release` | Release APK | `cd android && ./gradlew assembleRelease` | ✅ Exists as `android-release` (rename) |
| `build:android:aab` | Release AAB (Play Store) | `cd android && ./gradlew bundleRelease` | ✅ Exists as `android-aab` (rename) |
| `build:ios:debug` | Debug iOS build | `xcodebuild -workspace {{IOS_WORKSPACE}} -scheme {{IOS_SCHEME}} -configuration Debug -sdk iphonesimulator build` | 🆕 New |
| `build:ios:release` | Release iOS archive | `xcodebuild -workspace {{IOS_WORKSPACE}} -scheme {{IOS_SCHEME}} -configuration Release -sdk iphoneos -archivePath build/{{APP_NAME}}.xcarchive archive` | 🆕 New |

### 3.4 JS Bundle (CI/QA)

| Task | Description | Command |
|---|---|---|
| `bundle:ios` | Offline JS bundle for iOS | `npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output {{BUNDLE_OUTPUT_DIR}}/ios/main.jsbundle --assets-dest {{BUNDLE_OUTPUT_DIR}}/ios` |
| `bundle:android` | Offline JS bundle for Android | `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output {{BUNDLE_OUTPUT_DIR}}/android/index.android.bundle --assets-dest {{BUNDLE_OUTPUT_DIR}}/android/res` |

### 3.5 Quality

| Task | Description | Command | Status |
|---|---|---|---|
| `lint` | Run ESLint | `npm run lint` | ✅ Exists |
| `typecheck` | Run TypeScript check | `npx tsc --noEmit` | ✅ Exists (see Note 1) |
| `test` | Run Jest tests | `npm test` | ✅ Exists |
| `check` | All quality gates in one | `lint` → `typecheck` → `test` | 🆕 New |

### 3.6 Cleanup

| Task | Description | Status |
|---|---|---|
| `clean` | Remove node_modules and native build artifacts | ✅ Exists |
| `reset` | Reset Metro cache | ✅ Exists |
| `pods` | Install CocoaPods | ✅ Exists |

---

## 4. Renames

Standardize naming with colon-delimited categories:

| Current Name | New Name | Reason |
|---|---|---|
| `android-release` | `build:android:release` | Consistent `build:platform:variant` pattern |
| `android-aab` | `build:android:aab` | Consistent `build:platform:variant` pattern |

---

## 5. package.json Fix

Add missing `typecheck` script:

```json
"typecheck": "tsc --noEmit"
```

The Taskfile `typecheck` task currently runs `npm run typecheck` but this script does not exist in `package.json`.

---

## 6. env:check Validation Rules

The `env:check` task should verify:

1. **File: `../../.env`** — exists (dotenv source for Taskfile)
2. **File: `ios/GoogleService-Info.plist`** — exists (Firebase iOS config)
3. **File: `android/app/google-services.json`** — exists (Firebase Android config)
4. **Print clear ✅/❌ status** for each check with actionable fix instructions

---

## 7. Task Dependencies

```
setup → install → pods → env:check
nuke  → clean → install → pods
check → lint → typecheck → test (sequential, fail-fast)
```

---

## 8. Implementation Notes

- **Taskfile vars** for workspace/scheme names — avoid hardcoding in build commands
- **`build` output directory** should be gitignored (add `build/` to `.gitignore` if not present)
- **`build:ios:release`** produces an `.xcarchive` — actual IPA export would be a separate step (out of scope for now, can add `export:ios` later)
- **`ios:device`** — user may need to specify device name; RN CLI auto-detects if only one USB device is connected
- **`android:device`** — `--active-arch-only` flag speeds up builds by targeting only the connected device's architecture
- **Fail-fast on `check`** — if lint fails, don't bother running typecheck or test
- **Old task names** (`android-release`, `android-aab`) can be kept as aliases during transition if desired

---

## 9. Final Task Count

| Category | Existing | New | Renamed |
|---|---|---|---|
| Setup & Maintenance | 0 | 3 | 0 |
| Run (Dev) | 3 | 2 | 0 |
| Build | 2 | 3 | 2 |
| JS Bundle | 0 | 2 | 0 |
| Quality | 3 | 1 | 0 |
| Cleanup | 3 | 0 | 0 |
| **Total** | **11** | **11** | **2** |
