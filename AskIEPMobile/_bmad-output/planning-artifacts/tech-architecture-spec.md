# AskIEP Mobile — Complete Tech Architecture Spec

**Date:** 2026-03-01 (updated)
**Status:** Draft v3 (code-reconciled — reference/ is source of truth)
**Platform:** Expo SDK 52 / React Native 0.76 + TypeScript 5.3+
**Target:** Parent-only mobile app (iOS + Android)
**Reference Code:** `reference/` folder in this workspace — copy/adapt files from there, do not recreate from scratch

---

## 1. Overview

AskIEP Mobile is a React Native companion to the AskIEP web platform, scoped to **parent users only**. It shares the same backend API. The `reference/src/` folder in this workspace contains the working implementation — all development should start by copying from there, not recreating from scratch.

This spec covers the complete mobile app: infrastructure, all 12 feature domains, cross-cutting concerns, and identifies API gaps that need to be built.

---

## 2. Design Principles

- **Reference code is source of truth** — `reference/src/` contains working implementations; copy and adapt, never recreate from scratch
- **Platform-agnostic** — no iOS-only or Android-only code paths; use `Platform.OS` checks and Expo APIs that handle both
- **Platform-native feel** — React Navigation auto-adapts transitions/headers; NativeWind `ios:`/`android:` selectors for style tuning
- **Build for today, architect for tomorrow** — `PARENT` role only now; role infrastructure in `auth-service.ts` already supports `ADVOCATE`/`TEACHER_THERAPIST`
- **Flat lib layer** — `api-client.ts` + `api-config.ts` own all HTTP logic; hooks call these directly, no intermediate service layer
- **Hooks as domain boundary** — each feature domain gets a hook (`useChildren`, `useDashboard`, etc.); screens stay thin

---

## 3. Auth Strategy

### Providers (Both Now)
- **Google Sign-In** — `@react-native-google-signin/google-signin` → Firebase credential → `exchangeFirebaseToken()`
- **Apple Sign-In** — `expo-apple-authentication` → Firebase credential → `exchangeFirebaseToken()` (NOT `@invertase/react-native-apple-authentication`)

### Flow
```
SignInScreen  (reference/src/screens/SignInScreen.tsx)
  ├── [Sign in with Google] → GoogleSignin.signIn() → Firebase credential → exchangeFirebaseToken()
  └── [Sign in with Apple]  → expo-apple-authentication → Firebase credential → exchangeFirebaseToken()

Both → POST /api/v1/auth/exchange-token { idToken }
     → { token, refreshToken, user, isNewUser, requiresSetup }
     → secureStore.saveTokens()   ← react-native-keychain (NOT AsyncStorage)
     → isNewUser=true → ConsentScreen (reference/src/screens/ConsentScreen.tsx)
     → ConsentScreen accepted → BiometricGate → MainTabNavigator
```

### AuthProvider Interface
```ts
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  submitConsent: (payload: ConsentPayload) => Promise<void>;
  requiresSetup: boolean;
  completeSetup: () => void;
}
```

- No `login()` (email/password) — admin-only, not on mobile
- No `register()` — parents register via provider only
- No `changePassword()` — not needed for provider auth
- Auto token refresh timer (same as web)

### Auth Endpoints Used
| Endpoint | Method | Body / Notes |
|---|---|---|
| `/api/v1/auth/exchange-token` | POST | `{ idToken: string }` — Firebase ID token (not `firebaseToken`) |
| `/api/v1/auth/refresh-token` | POST | `{ refreshToken: string }` — note: `refresh-token` not `refresh` |
| `/api/v1/auth/logout` | POST | Bearer token header — server-side cleanup |

**`ExchangeTokenResponse`:**
```ts
interface ExchangeTokenResponse {
  user: AuthUser;
  token: string;          // access token (field is `token` not `accessToken`)
  refreshToken: string;
  isNewUser: boolean;
  requiresSetup: boolean;
}
```

### Roles — Future-Proofed
- `AuthUser.role` already typed as `'PARENT' | 'ADVOCATE' | 'TEACHER_THERAPIST'` in `reference/src/lib/auth-service.ts`
- No `RequireRole` guard or `roles.ts` in reference code — role checks done inline in screens/hooks as needed
- `BiometricGate` (`reference/src/components/BiometricGate.tsx`) already wraps `MainTabNavigator` — copy as-is

---

## 4. Styling & UI Library Strategy

### Recommendation: NativeWind + React Native Paper

| Layer | Library | Purpose |
|---|---|---|
| Layout & Spacing | **NativeWind** (Tailwind for RN) | `className` syntax, responsive, platform selectors (`ios:`, `android:`) |
| UI Components | **React Native Paper** | Pre-built Material Design 3 components (buttons, cards, dialogs, etc.) |
| Navigation | **React Navigation** | Auto-adapts headers, transitions, tab bars per platform |

### Why This Combination
- **NativeWind**: Same Tailwind muscle memory from web. Platform selectors: `ios:bg-blue-500 android:bg-green-500`
- **Paper**: Production-ready components — no building buttons from scratch. Material Design 3 on Android, reasonable adaptation on iOS
- **React Navigation**: Already adapts swipe-back on iOS, material slide on Android, platform-native headers

### Platform-Specific Design
- React Navigation headers/transitions auto-adapt per platform
- NativeWind `ios:` / `android:` prefixes for platform-specific styling
- RN built-in components (Alert, ActionSheet, DatePicker) respect platform norms
- Paper provides consistent component quality across both platforms

---

## 5. Dependencies

| Purpose | Package | Notes |
|---|---|---|
| Layout/Styling | `nativewind` + `tailwindcss@3` | |
| UI Components | `react-native-paper` | |
| Icons | `react-native-vector-icons` | |
| Safe Area | `react-native-safe-area-context` | |
| Navigation | `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack` | |
| **Secure Token Storage** | **`react-native-keychain`** | Keychain (iOS) / Keystore (Android) — NOT AsyncStorage for tokens |
| Async Storage | `@react-native-async-storage/async-storage` | App state only (non-sensitive) |
| Firebase Core | `@react-native-firebase/app` | |
| Firebase Auth | `@react-native-firebase/auth` | |
| Firebase Messaging | `@react-native-firebase/messaging` | |
| Google Sign-In | `@react-native-google-signin/google-signin` | |
| Apple Sign-In | `expo-apple-authentication` | Expo equivalent (replaces `@invertase/react-native-apple-authentication`) |
| Data Fetching | `@tanstack/react-query` | staleTime=5min, gcTime=10min, retry=2 |
| File Picker | `expo-document-picker` | Expo equivalent (replaces `react-native-document-picker`) |
| Network Info | `@react-native-community/netinfo` | |
| Date Picker | `@react-native-community/datetimepicker` | |
| Biometrics | `react-native-biometrics` | Used via `biometric-service.ts` wrapper |

---

## 6. Provider Stack

```tsx
// App.tsx root — matches reference/src/providers/
<QueryProvider>         {/* reference/src/providers/QueryProvider.tsx — copy as-is */}
  <ThemeProvider>       {/* reference/src/providers/ThemeProvider.tsx — copy as-is */}
    <AuthProvider>      {/* reference/src/providers/AuthProvider.tsx — adapt: swap @invertase → expo-apple-authentication */}
      <RootNavigator /> {/* reference/src/navigation/RootNavigator.tsx — copy as-is */}
    </AuthProvider>
  </ThemeProvider>
</QueryProvider>
```

- **`QueryProvider`** owns `QueryClient` (staleTime=5min, gcTime=10min, retry=2) — copy `reference/src/providers/QueryProvider.tsx` verbatim
- **`RootNavigator`** owns `NavigationContainer`, loading state, consent flow, and `BiometricGate` — copy `reference/src/navigation/RootNavigator.tsx` verbatim
- No `PaperProvider`, `NetworkProvider`, or `NotificationProvider` — not in reference

---

## 7. Navigation Architecture

```
RootNavigator (root — owns NavigationContainer)
  ├── [isLoading] → inline ActivityIndicator (no separate SplashScreen)
  ├── SignIn          → SignInScreen (Google + Apple buttons)
  ├── Consent         → ConsentOverlay (new users only — isNewUser=true)
  └── Main            → BiometricGate → MainTabNavigator
                            ├── DashboardTab
                            │   ├── DashboardScreen
                            │   └── ChildrenScreen        (pushed from Dashboard)
                            ├── DocumentsTab
                            │   └── DocumentsScreen       (IEP upload/list/analysis)
                            ├── TrackingTab
                            │   └── TrackingScreen        (Goals + Behavior + Compliance + Contacts)
                            ├── AIChatTab
                            │   └── AIChatScreen          (Advocacy Lab + Legal Support chat)
                            └── SettingsTab
                                ├── SettingsScreen
                                └── ResourcesScreen       (pushed from Settings)
```

**Navigation Types (from `types/navigation.ts`):**
```ts
type RootStackParamList = { SignIn: undefined; Main: undefined; Consent: undefined; };
type MainTabParamList = { DashboardTab: undefined; DocumentsTab: undefined; TrackingTab: undefined; AIChatTab: undefined; SettingsTab: undefined; };
```

**Key navigation behaviours:**
- Loading state: `isLoading=true` shows inline `ActivityIndicator` inside `RootNavigator` — no dedicated SplashScreen component
- Consent flow: `isAuthenticated && isNewUser && !consentDone` → shows `ConsentOverlay` before `Main`
- Biometric gate: `BiometricGate` component wraps `MainTabNavigator` — prompts on app foreground
- Screens are **lazy-loaded** via `React.lazy()` + `Suspense` (FR47 — reduces initial bundle size)
- Tab labels: Dashboard · Documents · Tracking · AI Chat · Settings

**Total screens: 9** (consolidated from spec v1's 25 — features grouped into domain screens)

---

## 8. Complete Folder Structure

```
src/
├── providers/
│   ├── AuthProvider.tsx          # Auth state, signInWithGoogle/Apple, signOut, getAccessToken
│   ├── QueryProvider.tsx         # QueryClient owner (staleTime=5min, gcTime=10min, retry=2)
│   └── ThemeProvider.tsx
├── navigation/
│   ├── RootNavigator.tsx         # Root stack: SignIn | Consent | Main(BiometricGate)
│   └── MainTabNavigator.tsx      # 5 tabs: Dashboard, Documents, Tracking, AIChat, Settings
├── screens/
│   ├── SignInScreen.tsx           # Google + Apple sign-in (was LoginScreen in v1 spec)
│   ├── ConsentScreen.tsx          # ConsentOverlay for new users (isNewUser=true)
│   ├── DashboardScreen.tsx        # Summary cards, child overview
│   ├── ChildrenScreen.tsx         # Child list/create/edit (pushed from Dashboard)
│   ├── DocumentsScreen.tsx        # IEP upload, list, analysis, extraction (consolidated)
│   ├── TrackingScreen.tsx         # Goals + Behavior + Compliance + Contacts (consolidated)
│   ├── AIChatScreen.tsx           # Advocacy Lab + Legal Support chat (consolidated)
│   ├── ResourcesScreen.tsx        # Resources browse (pushed from Settings)
│   └── SettingsScreen.tsx
├── components/
│   ├── BiometricGate.tsx          # Wraps MainTabNavigator — prompts on foreground
│   ├── ErrorBoundary.tsx          # Global crash handler
│   ├── ErrorDisplay.tsx           # Inline error UI component
│   ├── OfflineBanner.tsx          # Offline indicator (was NetworkBanner in v1 spec)
│   └── PlaceholderScreen.tsx      # Empty/loading placeholder
├── hooks/
│   ├── useChildren.ts             # useChildren, useChild, useCreateChild, useUpdateChild, useDeleteChild
│   ├── useDashboard.ts            # useDashboardSummary, useChildOverview(childId)
│   ├── useDocuments.ts            # IEP documents (was useIEP in v1 spec)
│   ├── useGoals.ts
│   ├── useBehaviors.ts            # (plural — matches reference filename)
│   ├── useCompliance.ts
│   ├── useCommunications.ts       # (was useContacts in v1 spec)
│   └── useResources.ts
├── lib/
│   ├── api-client.ts              # apiRequest() — authenticated fetch, auto-refresh on 401
│   ├── api-config.ts              # API URL constants, platform-aware (localhost vs 10.0.2.2)
│   ├── app-config.ts              # Bundle IDs, legal URLs, store metadata, data collection disclosure
│   ├── auth-service.ts            # exchangeFirebaseToken(), refreshAccessToken(), revokeToken()
│   ├── biometric-service.ts       # biometricService.authenticate(), authenticateWithRetry()
│   ├── design.ts                  # Design tokens / theme constants
│   ├── firebase.ts                # Firebase app initialization
│   ├── http-stream.ts             # streamNDJSON() with retry + exponential backoff
│   └── secure-store.ts            # Keychain/Keystore via react-native-keychain
└── types/
    ├── domain.ts                  # Child, CreateChildDto, DashboardSummary, ChildOverview, ...
    └── navigation.ts              # RootStackParamList, MainTabParamList, stack param lists
```

**Key differences from v1 spec:**
- No `domain/` service layer — API calls made directly in hooks via `apiRequest()` + `api-config.ts`
- `secure-store.ts` uses `react-native-keychain` (not AsyncStorage) for JWT tokens
- `api-config.ts` owns all endpoint URLs and handles the `localhost` → `10.0.2.2` platform remap
- `OfflineBanner` (not `NetworkBanner`); `ErrorDisplay` (new); no `ProgressBar`/`ChildSwitcher`/`StreamingChat`/`ConfirmDialog`/`LoadingState` in reference — these are built inline per-screen

---

## 9. Feature Domain Specs

### 9.1 Dashboard

**Screen:** `DashboardScreen`
**Service:** `dashboard.service.ts`

| Method | HTTP | Endpoint |
|---|---|---|
| `getSummary()` | GET | `/api/v1/dashboard/stats` |

**Types:**
```ts
interface DashboardSummary {
  children: { total: number; active: number };
  upcomingDeadlines: Deadline[];
  advocacyAlerts: { total: number; byPriority: { high: number; medium: number; low: number } };
  recentActivity: ActivityItem[];
  statistics: { totalGoals: number; goalsInProgress: number; totalCommunications: number; pendingFollowUps: number };
}
interface Deadline { id: string; childId: string; childName: string; type: string; title: string; date: string; daysUntil: number }
interface ActivityItem { id: string; type: string; title: string; childName?: string; date: string }
```

**Screen Layout:**
- Quick action cards: Analyze IEP, Advocacy Lab, Goal Tracker, Contact Log, Letter Writer
- Compliance health % card
- Goal mastery summary
- Recent IEP documents (last 5)
- Upcoming deadlines
- Advocacy alerts by priority

---

### 9.2 Child Profiles

**Screens:** `ChildListScreen`, `ChildCreateScreen`, `ChildEditScreen`
**Service:** `child.service.ts`

| Method | HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/v1/children` |
| `getById(id)` | GET | `/api/v1/children/:id` |
| `create(data)` | POST | `/api/v1/children` |
| `update(id, data)` | PATCH | `/api/v1/children/:id` |
| `delete(id)` | DELETE | `/api/v1/children/:id` |

**Types:**
```ts
interface Child {
  id: string; userId?: string; name: string; age: number; grade: string;
  disabilities?: string[]; accommodationsSummary?: string; servicesSummary?: string;
  advocacyBio?: string; focusTags?: string[]; advocacyLevel?: string; primaryGoal?: string;
  stateContext?: string; lastIepDate?: string; nextIepReviewDate?: string;
  isActive?: boolean; createdAt: string; updatedAt?: string;
}
interface CreateChildData { name: string; age: number; grade: string; disabilities?: string[]; }
interface UpdateChildData extends Partial<CreateChildData> {}
```

**Screen Notes:**
- ChildListScreen: Card per child, name/age/grade, disability badges (first 3), edit/delete actions
- Delete confirmation warns about cascading deletes (goals, progress, behavior, contact logs)
- ChildCreateScreen/EditScreen: Form with name, age, grade, disabilities multi-select

---

### 9.3 IEP Document Management

**Screen:** `DocumentsScreen` (consolidated — list + upload + analysis + extraction in one screen)
**Hook:** `useDocuments.ts` (was `useIEP` in v1 spec)

| Method | HTTP | Endpoint | Notes |
|---|---|---|---|
| `getAll(childId?)` | GET | `/api/v1/iep?childId=` | Filter by child |
| `getById(id)` | GET | `/api/v1/iep/:id` | |
| `uploadDocument(formData)` | POST | `/api/v1/iep/upload` | **multipart/form-data**, max 25MB |
| `analyzeDocument(id, onLog)` | GET | `/api/v1/iep/:id/analyze-iep` | **NDJSON streaming** (30-60s) |
| `getExtraction(id)` | GET | `/api/v1/iep/:id/extraction` | |
| `submitCorrections(id, data)` | POST | `/api/v1/iep/:id/corrections` | |
| `getCorrections(id)` | GET | `/api/v1/iep/:id/corrections` | |
| `canFinalize(id)` | GET | `/api/v1/iep/:id/can-finalize` | |
| `finalizeDocument(id)` | POST | `/api/v1/iep/:id/finalize` | |
| `getAnalysis(id)` | GET | `/api/v1/iep/:id/analysis` | |
| `analyze(data)` | POST | `/api/v1/iep/analyze` | Text-based analysis |
| `download(id)` | GET | `/api/v1/iep/:id/download` | Presigned GCS URL (1hr) |
| `update(id, data)` | PATCH | `/api/v1/iep/:id` | Update metadata |
| `delete(id)` | DELETE | `/api/v1/iep/:id` | Soft delete |

**Types:**
```ts
interface IEPDocument {
  id: string; childId: string; fileName: string; storagePath: string;
  documentDate: string; schoolYear: string; status: string; analysisId?: string;
  createdAt: string; updatedAt?: string;
}
interface ExtractionData {
  metadata: { studentName: string; age: number; grade: string; schoolName: string; iepStartDate: string; iepEndDate: string; disabilities: string[] };
  goals: ExtractedGoal[];
  services: ExtractedService[];
  redFlags?: RedFlag[];
}
interface ExtractionResponse {
  success: boolean;
  data: {
    studentName: string; grade: string; schoolYear: string;
    iepStartDate: string; iepEndDate: string;
    goals: ExtractedGoal[]; services: ExtractedService[];
    accommodations: string[]; modifications: string[];
    confidence: { overall: number; dates: number; goals: number; services: number };
  };
}
// Stream events for analyze-iep
interface StreamLogEvent { type: 'log'; message: string; stage?: string; meta?: Record<string, unknown> }
interface StreamResultEvent<T> { type: 'result'; data: T }
interface StreamErrorEvent { type: 'error'; message: string; details?: string }
```

**Screen Notes:**
- IEPUploadScreen: Uses `react-native-document-picker` (PDF/DOC/DOCX filter), shows upload progress
- IEPAnalysisScreen: Real-time streaming progress (stage messages via NDJSON), 30-60s processing time
- IEPExtractionScreen: Displays extracted data (goals, services, accommodations, red flags, confidence scores), allows corrections before finalization
- IEPViewScreen: Finalized document summary, download button (opens presigned URL)

---

### 9.4 Goal Progress

**Screens:** `GoalListScreen`, `GoalCreateScreen`, `GoalEditScreen`, `ProgressEntryScreen`
**Service:** `goal.service.ts`

| Method | HTTP | Endpoint |
|---|---|---|
| `getAll(childId?)` | GET | `/api/v1/goals?childId=` |
| `getById(id)` | GET | `/api/v1/goals/:id` |
| `getByChild(childId)` | GET | `/api/v1/goals/child/:childId` |
| `getChildSummary(childId)` | GET | `/api/v1/goals/child/:childId/summary` |
| `create(data)` | POST | `/api/v1/goals` |
| `update(id, data)` | PUT | `/api/v1/goals/:id` |
| `updateProgress(id, data)` | PATCH | `/api/v1/goals/:id/progress` |
| `delete(id)` | DELETE | `/api/v1/goals/:id` |
| `getProgressEntries(goalId)` | GET | `/api/v1/goals/:goalId/progress-entries` |
| `getProgressTimeline(goalId)` | GET | `/api/v1/goals/:goalId/progress-timeline` |
| `createProgressEntry(data)` | POST | `/api/v1/progress-entries` |
| `deleteProgressEntry(id)` | DELETE | `/api/v1/progress-entries/:id` |
| `getProgressByChild(childId)` | GET | `/api/v1/progress-entries/child/:childId` |

**Types:**
```ts
interface Goal {
  id: string; childId: string; iepId?: string;
  area: string; goalArea: string; skillFocus: string; description: string;
  baseline: number; baselineLevel?: string; baselineText: string;
  target: number; targetLevel?: string; targetText: string;
  current: number; currentLevel?: string;
  metric: string; duration: string; timeline: string;
  status: 'Not Started' | 'In Progress' | 'Achieved' | 'Discontinued';
  goalStatement: string; notes: string;
  createdAt: string; updatedAt: string;
}
interface ProgressEntry { id: string; goalId: string; date: string; score: number; notes: string }
interface CreateGoalData {
  childId: string; area: string; goalArea: string; skillFocus: string;
  baseline: number; baselineText: string; target: number; targetText: string;
  metric: string; duration: string; timeline: string; goalStatement: string; notes?: string;
}
```

**Screen Notes:**
- GoalListScreen: Filter by child, progress bars (0-100%), status badges (On Track / Needs Attention / At Risk), add/edit/delete
- GoalCreateScreen: 10 goal areas (Reading, Math, Writing, Communication, Social, Behavior, Self-Help, Motor, Adaptive, Other), dynamic skill focus dropdown, baseline/target phrase templates, auto-generate goal statement
- ProgressEntryScreen: Date picker, score slider (0-100%), notes field

---

### 9.5 Behavior ABC

**Screen:** `TrackingScreen` (consolidated with Goals, Compliance, Contacts)
**Hook:** `useBehaviors.ts` (plural — matches reference filename)

| Hook | HTTP | Endpoint |
|---|---|---|
| `useBehaviors(childId)` | GET | `/api/v1/behaviors?childId=` |
| `useCreateBehavior()` | POST | `/api/v1/behaviors` |
| `useUpdateBehavior()` | PATCH | `/api/v1/behaviors/:id` |
| `useDeleteBehavior()` | DELETE | `/api/v1/behaviors/:id` |

**Types:**
```ts
interface BehaviorEntry {
  id: string; childId: string; date: string; time: string; // HH:mm
  location: string; antecedent: string; behavior: string; consequence: string;
  notes?: string; createdAt: string; updatedAt: string;
}
interface CreateBehaviorData {
  childId: string; date: string; time: string; location: string;
  antecedent: string; behavior: string; consequence: string; notes?: string;
}
```

**Screen Notes (within `TrackingScreen`):**
- Behavior section: ABC entries in 3-column layout (Antecedent | Behavior | Consequence), date/time/location
- Create/edit form: Date picker, time picker, location field, ABC text fields, notes

---

### 9.6 Compliance (Service Delivery)

**Screen:** `TrackingScreen` (consolidated)
**Hook:** `useCompliance.ts`

**⚠️ Endpoint base path is `/api/v1/services` not `/api/v1/compliance`** (from `api-config.ts`):

| Hook | HTTP | Endpoint |
|---|---|---|
| `useCompliance(childId)` | GET | `/api/v1/services?childId=` |
| `useCreateCompliance()` | POST | `/api/v1/services` |
| `useUpdateCompliance()` | PATCH | `/api/v1/services/:id` |
| `useDeleteCompliance()` | DELETE | `/api/v1/services/:id` |

**Types:**
```ts
interface ComplianceItem {
  id: string; userId?: string; childId: string; serviceDate: string; // YYYY-MM-DD
  serviceType: string; serviceProvider?: string;
  status: 'provided' | 'scheduled' | 'missed' | 'cancelled';
  minutesProvided?: number; minutesRequired?: number;
  notes?: string; attachments?: string[];
  issueReported?: boolean; resolutionStatus?: string;
}
```

**Screen Notes (within `TrackingScreen`):**
- Compliance section: 4 summary cards (Services Provided, Missed, Upcoming, Compliance Rate %), entry list with status badges, child filter
- Create/edit form: Service type, provider, date, status, minutes provided vs required, issue flag, notes

---

### 9.7 Contact Log (Communications)

**Screen:** `TrackingScreen` (consolidated)
**Hook:** `useCommunications.ts` (was `useContacts` in v1 spec)

| Hook | HTTP | Endpoint |
|---|---|---|
| `useCommunications(childId)` | GET | `/api/v1/communications?childId=` |
| `useCreateCommunication()` | POST | `/api/v1/communications` |
| `useUpdateCommunication()` | PATCH | `/api/v1/communications/:id` |
| `useDeleteCommunication()` | DELETE | `/api/v1/communications/:id` |

**Types:**
```ts
interface ContactEntry {
  id: string; userId: string; childId?: string; date: string;
  type: 'Email' | 'Meeting' | 'Phone Call' | 'Text/Messaging' | 'Letter';
  contactPerson: string; role: string; subject: string;
  message: string; notes: string;
  createdAt: string; updatedAt: string;
}
```

**Screen Notes (within `TrackingScreen`):**
- Communications section: Type icons (Email/Phone/Meeting), subject, contact person, date
- Create/edit form: Type selector, contact person, role, subject, message body, notes

---

### 9.8 Letter Writer

**Screens:** `LetterListScreen`, `LetterEditScreen`, `LetterGenerateScreen`
**Service:** `letter.service.ts`

| Method | HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/v1/letters` |
| `getById(id)` | GET | `/api/v1/letters/:id` |
| `create(data)` | POST | `/api/v1/letters` |
| `generate(data)` | POST | `/api/v1/letters/generate` |
| `update(id, data)` | PUT | `/api/v1/letters/:id` |
| `updateStatus(id, data)` | PATCH | `/api/v1/letters/:id/status` |
| `send(id, data)` | POST | `/api/v1/letters/:id/send` |
| `delete(id)` | DELETE | `/api/v1/letters/:id` |
| `getTemplates()` | GET | `/api/v1/letters/templates/list` |
| `getTemplate(id)` | GET | `/api/v1/letters/templates/:id` |

**Types:**
```ts
interface Letter {
  id: string; userId?: string; childId: string; letterType: string;
  title: string; content: string; contentHtml?: string;
  status: 'draft' | 'final' | 'sent';
  generationContext?: string; revisionCount?: number; sentDate?: string;
  createdAt: string; updatedAt?: string;
  category?: string; recipient?: string; subject?: string;
}
interface GenerateLetterData { childId: string; letterType: string; context: string; }
```

**Screen Notes:**
- LetterListScreen: Status badges (draft/final/sent), letter type, recipient, last edited, copy-to-clipboard, mark-as-sent
- LetterGenerateScreen: Template selector, child selector, context/instructions field → AI generates letter
- LetterEditScreen: Full text editor for content, subject, recipient, category

---

### 9.9 Advocacy Lab

**Screen:** `AIChatScreen` (consolidated with Legal Support)

**⚠️ Chat endpoint is a single POST, not a session management system** (from `api-config.ts`):

| HTTP | Endpoint | Notes |
|---|---|---|
| POST | `/api/v1/advocacy/chat` | Send message, receive streamed response |

**Types:**
```ts
interface AdvocacyInsight {
  id: string; userId: string; childId?: string;
  priority: 'high' | 'medium' | 'low';
  category: string; title: string; description: string;
  actionItems: string[]; createdAt: string;
}
interface ChatMessageResponse { role: 'assistant' | 'user'; content: string; timestamp: string }
```

**Screen Notes (within `AIChatScreen`):**
- Chat UI with tab/toggle for Advocacy vs Legal
- Advocacy chat: sends messages to `/api/v1/advocacy/chat`, streams NDJSON response via `streamNDJSON()`
- No session management or meeting simulation in reference — single-turn chat model

---

### 9.10 Legal Support

**Screen:** `AIChatScreen` (consolidated with Advocacy Lab)

**⚠️ Chat endpoint is a single POST** (from `api-config.ts`):

| HTTP | Endpoint | Notes |
|---|---|---|
| POST | `/api/v1/legal/chat` | Send message, receive streamed response |

**Types:**
```ts
interface LegalResource { id: string; title: string; category: string; description: string; plainLanguage: string; citation?: string; url?: string }
interface LegalSupportMessage { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }
```

**Screen Notes (within `AIChatScreen`):**
- Legal chat: sends messages to `/api/v1/legal/chat`, streams NDJSON response via `streamNDJSON()`
- No `StreamingChat` shared component in reference — streaming rendered inline per-screen
- No session history or resource browse in reference implementation

---

### 9.11 Resources

**Screen:** `ResourcesScreen`
**Service:** `resource.service.ts`

| Method | HTTP | Endpoint |
|---|---|---|
| `getAll()` | GET | `/api/v1/resources` |
| `getPopular(limit?)` | GET | `/api/v1/resources/popular` |
| `getByCategory(category)` | GET | `/api/v1/resources/category/:category` |
| `getById(id)` | GET | `/api/v1/resources/:id` |
| `create(data)` | POST | `/api/v1/resources` |
| `update(id, data)` | PUT | `/api/v1/resources/:id` |
| `rate(id, data)` | POST | `/api/v1/resources/:id/rate` |
| `delete(id)` | DELETE | `/api/v1/resources/:id` |

**Types:**
```ts
interface Resource { id: string; title: string; category: string; description: string; url?: string; tags?: string[] }
```

**Screen Notes:**
- 3 categories: Advocacy, Legal, Educational
- Card layout with badges (Must Read, Advocacy, Training)
- External links open in-app browser or system browser
- Rating capability per resource

---

### 9.12 Settings

**Screen:** `SettingsScreen`
**Service:** `settings.service.ts`

| Method | HTTP | Endpoint |
|---|---|---|
| `getPreferences()` | GET | `/api/v1/settings/preferences` |
| `updatePreferences(data)` | PATCH | `/api/v1/settings/preferences` |

**Types:**
```ts
interface UserPreferences {
  userId: string; theme?: 'light' | 'dark' | 'auto';
  notifications: boolean; emailUpdates: boolean;
}
```

**Screen Notes:**
- Profile section: Display name, email, role (read-only on mobile — edit via web)
- Theme toggle: light / dark / auto (syncs with RN `useColorScheme`)
- Notification toggles: Push notifications, email updates
- No password change on mobile (provider auth only)

---

## 10. Cross-Cutting Concerns

### 10.1 NDJSON Streaming (Advocacy Lab, Legal Support, IEP Analysis)

**File:** `lib/http-stream.ts` — `streamNDJSON<T>(url, callbacks, options)`

```ts
interface StreamCallbacks<T = any> {
  onData: (chunk: T) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

// Returns AbortController so caller can cancel (e.g. on screen unmount)
async function streamNDJSON<T>(
  url: string,
  callbacks: StreamCallbacks<T>,
  options?: RequestInit
): Promise<AbortController>
```

**Implementation details (from reference code):**
- MAX_RETRIES = 3 with exponential backoff (base 1000ms) for cellular resilience (NFR21)
- Sends `Accept: application/x-ndjson` + `X-Stream-Capabilities: keepalive` headers
- Reads token from `secureStore.getToken()` (Keychain), not from React context
- Resets retry counter on successful connection

**Used by:** IEP analysis (30-60s), Advocacy chat (`/api/v1/advocacy/chat`), Legal chat (`/api/v1/legal/chat`)

### 10.2 File Upload (IEP Documents)

**Package:** `expo-document-picker` (replaces `react-native-document-picker`)

```ts
// DocumentsScreen upload flow:
const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf'] });
if (result.canceled) return;
const formData = new FormData();
formData.append('file', { uri: result.assets[0].uri, type: result.assets[0].mimeType, name: result.assets[0].name } as any);
formData.append('childId', selectedChildId);
await apiRequest(API.iepUpload, { method: 'POST', body: formData }); // max 25MB
```

**Upload progress:** Use `XMLHttpRequest` with `onprogress` event for progress bar (fetch API doesn't support upload progress).

### 10.3 Network Handling

**Package:** `@react-native-community/netinfo`
**Component:** `OfflineBanner` (was `NetworkBanner` in v1 spec) — rendered at screen level, no `NetworkProvider`

- **OfflineBanner:** Persistent banner at top of screen when offline — "No internet connection"
- **TanStack Query:** `networkMode: 'offlineFirst'` — serves cached data when offline, retries when online
- No app-level `NetworkProvider` or mutation queue in reference implementation

### 10.4 Push Notifications

**Package:** `@react-native-firebase/messaging`

**Features:**
- IEP review date reminders
- Follow-up reminders (from contact log)
- Goal progress nudges

**🔴 API GAP — New endpoint needed:**

| Endpoint | Method | Purpose |
|---|---|---|
| `POST /api/v1/notifications/register-device` | POST | Register FCM token for push notifications |
| `DELETE /api/v1/notifications/unregister-device` | DELETE | Remove FCM token on logout |
| `GET /api/v1/notifications/preferences` | GET | Get notification preferences (which types enabled) |
| `PATCH /api/v1/notifications/preferences` | PATCH | Update notification preferences |

**Implementation:** On login, register FCM token with API. API stores token per user. Background service sends FCM messages when events trigger (approaching IEP dates, pending follow-ups).

### 10.5 Deep Linking

**Config:** `navigation/RootNavigator.tsx` linking prop

```ts
const linking = {
  prefixes: ['askiep://', 'https://app.askiep.com'],
  config: {
    screens: {
      Main: {
        screens: {
          DashboardTab: { screens: { Children: 'children/:id' } },
          DocumentsTab: { screens: { Documents: 'iep/:id' } },
          TrackingTab: { screens: { Tracking: 'goals/:id' } },
        },
      },
    },
  },
};
```

**Use cases:** Open specific child/IEP/goal from push notifications.

### 10.6 Error Boundary & Crash Reporting

**Component:** `ErrorBoundary.tsx`

- Wraps `AppNavigator` — catches JS crashes, shows "Something went wrong" screen with retry
- Future: integrate Sentry or Firebase Crashlytics for remote crash reporting
- All service calls wrapped in try/catch with `useNotification()` error toasts

### 10.7 Biometric Auth (Re-authentication)

**Package:** `react-native-biometrics`

- On app foreground after >5 min background: prompt Touch ID / Face ID
- Falls back to asking user to re-authenticate with Google/Apple if biometrics unavailable
- Optional — user can disable in Settings

**🔴 API GAP — Consideration:**
No new endpoint needed — biometrics only gates local token access, doesn't hit the server.

### 10.8 App State Handling

**RN `AppState` API:**

| State Transition | Action |
|---|---|
| background → active | Check token expiry, refresh if needed |
| active → background | No action (keep timers running) |
| inactive (iOS) | Pause non-critical operations |

- Token refresh timer continues via RN background task if needed
- TanStack Query `refetchOnWindowFocus` equivalent: refetch stale queries on foreground

---

## 11. TanStack Query Patterns

All domain hooks follow this pattern:

```ts
// hooks/useChildren.ts
export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: () => childService.getAll(),
  });
}

export function useChild(id: string) {
  return useQuery({
    queryKey: ['children', id],
    queryFn: () => childService.getById(id),
    enabled: !!id,
  });
}

export function useCreateChild() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChildData) => childService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['children'] }),
  });
}
```

**Query Key Strategy:**
| Domain | Keys |
|---|---|
| Children | `['children']`, `['children', id]` |
| IEP | `['iep']`, `['iep', id]`, `['iep', 'extraction', id]`, `['iep', 'analysis', id]` |
| Goals | `['goals']`, `['goals', id]`, `['goals', 'child', childId]`, `['goals', 'summary', childId]` |
| Behavior | `['behavior']`, `['behavior', id]`, `['behavior', 'child', childId]`, `['behavior', 'patterns', childId]` |
| Compliance | `['compliance']`, `['compliance', id]`, `['compliance', 'child', childId]`, `['compliance', 'summary', childId]` |
| Contacts | `['contacts']`, `['contacts', id]`, `['contacts', 'child', childId]`, `['contacts', 'follow-ups']` |
| Letters | `['letters']`, `['letters', id]`, `['letters', 'templates']` |
| Advocacy | `['advocacy']`, `['advocacy', id]`, `['advocacy', 'sessions']`, `['advocacy', 'prompts']` |
| Legal | `['legal', 'resources']`, `['legal', 'sessions', id]` |
| Dashboard | `['dashboard']` |
| Resources | `['resources']`, `['resources', 'popular']`, `['resources', 'category', cat]` |
| Settings | `['settings', 'preferences']` |

---

## 12. Web → Mobile File Translation

### Files That Copy Verbatim
| File | Notes |
|---|---|
| `lib/http.ts` | RN fetch API is identical |
| `lib/logger.ts` | console.* works in RN |
| `domain/auth/types.ts` | Pure TypeScript types |
| `domain/auth/roles.ts` | Full ROLES + ACCESS_POLICY |
| `hooks/useAuthUser.ts` | Same hook composition |
| `hooks/useAuthRole.ts` | Same hook composition |

### Files That Adapt
| File | Key Changes |
|---|---|
| `lib/config.ts` | Swap `import.meta.env.VITE_*` → `react-native-config`. Remove web routes. |
| `domain/auth/auth.service.ts` | Remove `login()`, `register()`, `changePassword()`. Keep `exchangeFirebaseToken()`, `refresh()`, `logout()`, `getProfile()`, `updateProfile()`, `recordConsent()` |
| `hooks/useAsyncStorage.ts` | Async version of `useSessionStorage` — adds `isLoading` state |
| `hooks/useAuthSession.ts` | Uses `useAsyncStorage` instead of `useSessionStorage` |
| `app/providers/AuthProvider.tsx` | Strip email/password methods. Add `loginWithGoogle()`, `loginWithApple()` |
| `app/providers/ThemeProvider.tsx` | Use RN `useColorScheme()` + `Appearance` API + AsyncStorage for persistence |
| `domain/*/types.ts` | Copy types from web, remove web-only UI types |
| `domain/*/service.ts` | Copy service pattern, adapt imports for RN config |

### Files That Are New (Mobile-Only)
| File | Purpose |
|---|---|
| `app/navigation/*.tsx` | All navigators (AppNavigator, AuthStack, MainTabs, stacks) |
| `app/providers/NetworkProvider.tsx` | NetInfo connectivity tracking |
| `hooks/useNotification.tsx` | RN Animated toast notifications |
| `hooks/useNetwork.ts` | Network state hook |
| `hooks/use[Domain].ts` | TanStack Query hooks per domain (12 files) |
| `lib/http-stream.ts` | NDJSON streaming for RN |
| `lib/notifications.ts` | FCM token registration + handling |
| `components/StreamingChat.tsx` | Chat UI for advocacy + legal |
| `components/NetworkBanner.tsx` | Offline indicator |
| `components/ErrorBoundary.tsx` | Global crash handler |
| `components/ChildSwitcher.tsx` | Child selection dropdown |
| `theme/tokens.ts` | Paper theme + design tokens |
| `app/navigation/linking.ts` | Deep link config |

---

## 13. API Gaps — New Endpoints Needed

### 🔴 Push Notifications (New API Module)

The API currently has no push notification support. Mobile requires:

| Endpoint | Method | Purpose | Priority |
|---|---|---|---|
| `POST /api/v1/notifications/register-device` | POST | Store FCM token per user per device | **P0** — Required for push |
| `DELETE /api/v1/notifications/unregister-device` | DELETE | Remove FCM token on logout/uninstall | **P0** |
| `GET /api/v1/notifications/preferences` | GET | Per-user notification type preferences | **P1** — Nice to have at launch |
| `PATCH /api/v1/notifications/preferences` | PATCH | Update which notification types are enabled | **P1** |

**New DB table needed:**
```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios' | 'android'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, token)
);
```

**Background job needed:** Cron or event-driven job to send FCM messages for:
- IEP review dates approaching (7 days, 1 day before)
- Pending follow-ups overdue
- Goal progress reminders (weekly)

### 🟡 Existing Endpoints — Mobile Considerations

| Endpoint | Issue | Recommendation |
|---|---|---|
| `POST /iep/upload` | Max 25MB — mobile networks slower | Consider adding chunked upload or at least clear error for timeout |
| `GET /iep/:id/analyze-iep` | 30-60s streaming | Ensure API doesn't timeout on slow mobile connections; consider longer keepalive |
| Advocacy/Legal chat | Session messages | Verify these support request retries gracefully (idempotency) |

---

## 14. Critical Implementation Notes

### Token Storage — Keychain not AsyncStorage
Reference code uses `react-native-keychain` via `reference/src/lib/secure-store.ts`. **Copy this file verbatim.** Never store JWTs in AsyncStorage (insecure). The `secureStore.getToken()` / `saveTokens()` / `clearTokens()` API is the only token interface.

### Auth Session Restore — Keychain hydration
`AuthProvider` restores session from Keychain on mount (not AsyncStorage). `isLoading=true` during this check. `RootNavigator` shows inline `ActivityIndicator` while `isLoading` is true — no separate SplashScreen component needed.

### api-config.ts owns all endpoints + platform URL remap
`reference/src/lib/api-config.ts` already handles `localhost` → `10.0.2.2` for Android emulator via `Platform.OS`. **Copy then update `API_BASE_URL` to read from `process.env.EXPO_PUBLIC_API_URL`** (Section 16.4). All endpoint strings live here — never hardcode URLs in hooks or screens.

### File Upload — expo-document-picker API
`expo-document-picker` returns `result.assets[0].uri` (not `result.uri`). Use `XMLHttpRequest` for upload progress reporting (fetch API has no upload progress support).

### NativeWind Setup
- Requires `tailwindcss@3` (NativeWind v4 only supports Tailwind CSS v3, not v4)
- Babel plugin + Metro config required
- Platform selectors: `ios:` / `android:` prefixes work in className strings

---

## 15. Implementation Priority

### Phase 1 — Foundation (copy reference/ files first)
1. Init Expo SDK 52 project, install dependencies (Section 16.2 + 16.6)
2. **Copy verbatim** from `reference/src/`:
   - `lib/api-client.ts`, `lib/secure-store.ts`, `lib/auth-service.ts`, `lib/biometric-service.ts`, `lib/firebase.ts`, `lib/design.ts`, `lib/http-stream.ts`
   - `providers/QueryProvider.tsx`, `providers/ThemeProvider.tsx`
   - `components/BiometricGate.tsx`, `components/ErrorBoundary.tsx`, `components/ErrorDisplay.tsx`, `components/OfflineBanner.tsx`, `components/PlaceholderScreen.tsx`
   - `types/domain.ts`, `types/navigation.ts`
3. **Adapt** (minor changes only):
   - `lib/api-config.ts` — change `API_BASE_URL` to read `process.env.EXPO_PUBLIC_API_URL`
   - `providers/AuthProvider.tsx` — swap `@invertase/react-native-apple-authentication` → `expo-apple-authentication`
4. **Copy verbatim** navigation:
   - `navigation/RootNavigator.tsx`, `navigation/MainTabNavigator.tsx`
5. **Copy verbatim** screens already in reference:
   - `screens/SignInScreen.tsx`, `screens/ConsentScreen.tsx`, `screens/DashboardScreen.tsx`
   - `screens/ChildrenScreen.tsx`, `screens/SettingsScreen.tsx`, `screens/ResourcesScreen.tsx`
6. **Copy and adapt** hooks already in reference:
   - `hooks/useChildren.ts`, `hooks/useDashboard.ts`, `hooks/useBehaviors.ts`
   - `hooks/useCompliance.ts`, `hooks/useCommunications.ts`, `hooks/useResources.ts`

### Phase 2 — New screens (build fresh, no reference exists)
7. `screens/DocumentsScreen.tsx` — IEP upload + analysis + extraction (uses `lib/http-stream.ts`)
8. `hooks/useDocuments.ts` — IEP document hooks
9. `screens/TrackingScreen.tsx` — Goals + Behavior + Compliance + Contacts tabs
10. `hooks/useGoals.ts`

### Phase 3 — AI screens
11. `screens/AIChatScreen.tsx` — Advocacy + Legal chat (uses `lib/http-stream.ts` `streamNDJSON()`)
12. Letter writer feature (no reference — build fresh)

### Phase 4 — Polish
13. Push notifications (FCM — new API endpoints needed, Section 13)
14. Deep linking config
15. `app.config.js` ATS settings for production HTTPS

---

## 16. Expo Migration Spec

**Decision:** Use **Expo SDK 52** (managed workflow with Dev Client) instead of bare React Native CLI.

**Date:** 2026-03-01
**Xcode Required:** 15.0+ (confirmed: 15.0.1 ✅)

---

### 16.1 Expo Go vs Expo Dev Client — Why Dev Client

Plain **Expo Go** cannot load native modules. This project uses:
- `@react-native-firebase/app` + `@react-native-firebase/auth` + `@react-native-firebase/messaging`
- `@react-native-google-signin/google-signin`

These require native code — Expo Go will crash. The correct tool is **Expo Dev Client**.

| Mode | Native Modules | QR Code | Build Required |
|---|---|---|---|
| Expo Go | ❌ | ✅ Scan with Expo Go app | None |
| **Expo Dev Client** | ✅ | ✅ Scan with your custom app | Once via EAS or local |
| Bare RN CLI | ✅ | ❌ | Every time |

**QR Code workflow with Dev Client:**
1. Build the dev client once: `eas build --profile development --platform ios` (or android)
2. Install the resulting `.ipa` / `.apk` on your device (or use simulator build)
3. Run `npx expo start` — generates a QR code
4. Scan it with your installed dev client app → hot-reload works exactly like Expo Go

---

### 16.2 SDK Version

```
Expo SDK: 52 (latest stable, March 2026)
React Native: 0.76 (bundled with SDK 52)
TypeScript: 5.3+
Node: 20+
```

Init command (for new project):
```bash
npx create-expo-app@latest mobileexpo --template blank-typescript
cd mobileexpo
npx expo install expo-dev-client
```

---

### 16.3 Firebase Config Files — Already Exist

Firebase config files are **already provisioned** at the monorepo config path:

```
/Users/muthuishere/muthu/consulting/dilproject/iepapp/config/
  ├── GoogleService-Info.plist   # iOS (bundle: org.reactjs.native.example.AskIEPMobile)
  └── google-services.json       # Android (package: com.askiepmobile)
```

Reference them in `app.config.js` using a relative path from `apps/mobileexpo/`:

```js
// apps/mobileexpo/app.config.js
const path = require('path');

const FIREBASE_CONFIG_DIR = path.resolve(__dirname, '../../config');

export default {
  expo: {
    name: 'AskIEP',
    slug: 'askiep-mobile',
    version: '1.0.0',
    scheme: 'askiep',
    ios: {
      bundleIdentifier: 'org.reactjs.native.example.AskIEPMobile',
      googleServicesFile: path.join(FIREBASE_CONFIG_DIR, 'GoogleService-Info.plist'),
      infoPlist: {
        // Allow http:// to localhost and LAN IPs for local dev (iOS ATS)
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
          NSExceptionDomains: {
            localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
          },
        },
        // Required for Apple Sign-In
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              'com.googleusercontent.apps.454503056114-t1kekrd8gou9kb5ua79pb0gnptr5f203',
            ],
          },
        ],
      },
    },
    android: {
      package: 'com.askiepmobile',
      googleServicesFile: path.join(FIREBASE_CONFIG_DIR, 'google-services.json'),
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-google-signin/google-signin',
      'expo-apple-authentication',
      'expo-document-picker',
      'expo-local-authentication',
      '@react-native-firebase/messaging',
      [
        'expo-build-properties',
        {
          ios: { deploymentTarget: '15.1' },
          android: { compileSdkVersion: 34, targetSdkVersion: 34 },
        },
      ],
    ],
    extra: {
      // All EXPO_PUBLIC_ vars are available via Constants.expoConfig.extra
      // but prefer process.env.EXPO_PUBLIC_* directly in code (SDK 49+)
      eas: { projectId: 'YOUR_EAS_PROJECT_ID' },
    },
  },
};
```

---

### 16.4 Environment Variables Strategy

#### How Expo loads env vars

Expo SDK 49+ natively reads `.env` files. Variables prefixed with `EXPO_PUBLIC_` are embedded into the JS bundle and safe to use in app code. Variables **without** the prefix are build-time only (used in `app.config.js`, never in app code).

#### Root `.env` additions

The Taskfile already loads `../../.env` (the monorepo root `.env`). Add these **mobile-specific** vars to that file — no new `.env` file needed:

```bash
# ── Mobile (Expo) ─────────────────────────────────────────
# API Base URL — platform-aware (see Section 16.5)
EXPO_PUBLIC_API_URL=http://localhost:3000

# Google Sign-In web client ID (same as used in reference AuthProvider)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=454503056114-i9q8vavt8v6itc1l6q309984rubl56sp.apps.googleusercontent.com
```

> **Note:** Firebase native modules (`@react-native-firebase`) are configured entirely via the
> `GoogleService-Info.plist` / `google-services.json` files — they do **not** need `VITE_FIREBASE_*`
> vars at runtime. Those web vars stay for the VITE web app only. No duplication needed.

#### Accessing vars in app code

```ts
// src/lib/config.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
```

TypeScript declaration (auto-generated by Expo, or create manually):
```ts
// expo-env.d.ts  (project root)
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  }
}
```

---

### 16.5 Platform-Agnostic API URL (iOS Simulator + Android Emulator + Device)

The API URL differs by platform because of how each environment routes to `localhost`:

| Runtime | `localhost` resolves to | Correct API URL |
|---|---|---|
| iOS Simulator | Your Mac | `http://localhost:3000` |
| Android Emulator | The emulator itself | `http://10.0.2.2:3000` |
| Physical device (LAN) | Nothing / wrong | `http://192.168.x.x:3000` |
| Production | — | `https://api.askiep.com` |

**Single env var, runtime resolution in `config.ts`:**

```ts
// src/lib/config.ts
import { Platform } from 'react-native';

function resolveApiUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

  // Auto-remap localhost → 10.0.2.2 on Android emulator (only in dev builds)
  if (__DEV__ && Platform.OS === 'android' && raw.includes('localhost')) {
    return raw.replace('localhost', '10.0.2.2');
  }

  return raw;
}

export const API_BASE_URL = resolveApiUrl();
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
```

This means you **never change the env var** when switching between simulator and emulator — the remapping is automatic. For a physical device on LAN, set `EXPO_PUBLIC_API_URL=http://192.168.x.x:3000` before running.

---

### 16.6 Package Changes: Expo Equivalents

Swap these three packages to their Expo-maintained equivalents (same API surface, better Expo integration):

| Old (bare RN spec) | New (Expo) | Reason |
|---|---|---|
| `@invertase/react-native-apple-authentication` | `expo-apple-authentication` | Expo-maintained, simpler config |
| `react-native-document-picker` | `expo-document-picker` | Better iOS Files / iCloud integration |
| `react-native-biometrics` | `expo-local-authentication` | Unified Face ID / Touch ID / fingerprint API |

**Keep as-is** (no Expo equivalent):

| Package | Keep? | Reason |
|---|---|---|
| `@react-native-firebase/app` | ✅ | No Expo Firebase alternative |
| `@react-native-firebase/auth` | ✅ | Same |
| `@react-native-firebase/messaging` | ✅ | Same |
| `@react-native-google-signin/google-signin` | ✅ | No Expo equivalent |
| `nativewind` + `tailwindcss` | ✅ | Works cleanly with Expo SDK 52 |
| `react-native-paper` | ✅ | Fully compatible |
| `@react-navigation/*` | ✅ | Fully compatible |
| `@tanstack/react-query` | ✅ | Pure JS, no change |

**Add new** (Expo-specific):

| Package | Purpose |
|---|---|
| `expo-dev-client` | Custom dev client for QR-code hot-reload with native modules |
| `expo-build-properties` | Set iOS/Android SDK versions in `app.config.js` |
| `expo-constants` | Access `app.config.js` extra values if needed |
| `expo-updates` | OTA update support (push fixes without App Store review) |

---

### 16.7 EAS Build Config (`eas.json`)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://prodapi.askiep.com"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.askiep.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### 16.8 Updated Taskfile

The new `apps/mobileexpo/Taskfile.yml` replaces the reference RN CLI Taskfile. It keeps the same `.env` loading path and AVD/device vars, but switches all commands to Expo:

```yaml
version: '3'

dotenv:
  - "../../.env"   # loads monorepo root .env — includes EXPO_PUBLIC_* vars

vars:
  ANDROID_AVD: Pixel_6_API_34
  IOS_DEVICE: "iPhone SE (3rd generation)"

tasks:
  install:
    desc: Install JS dependencies
    cmd: npm install

  start:
    desc: Start Expo dev server (generates QR code)
    cmd: npx expo start

  start:dev-client:
    desc: Start Expo dev server targeting installed Dev Client app (QR code for device)
    cmd: npx expo start --dev-client

  reset:
    desc: Reset Expo bundler cache
    cmd: npx expo start --clear

  ios:
    desc: Run on iOS Simulator (Xcode 15.0.1 required locally)
    cmd: npx expo run:ios --device "{{.IOS_DEVICE}}"

  ios:sim:
    desc: Boot iOS simulator then run
    cmds:
      - |
        if xcrun simctl list devices | grep -q "Booted"; then
          echo "iOS simulator already booted"
        else
          xcrun simctl boot "{{.IOS_DEVICE}}" || true
          open -a Simulator
        fi
      - npx expo run:ios

  android:
    desc: Run on Android Emulator
    cmd: npx expo run:android

  android:start:
    desc: Start Android emulator if not running
    cmds:
      - |
        if adb devices | awk '{print $2}' | grep -q "^device$"; then
          echo "Android emulator already running"
        else
          echo "Starting Android emulator: {{.ANDROID_AVD}}"
          nohup emulator -avd {{.ANDROID_AVD}} -no-snapshot -no-boot-anim \
            -gpu swiftshader_indirect > /tmp/android-emulator.log 2>&1 &
          adb wait-for-device
        fi

  eas:dev:ios:
    desc: EAS cloud build — iOS Dev Client (no local Xcode needed)
    cmd: eas build --profile development --platform ios

  eas:dev:android:
    desc: EAS cloud build — Android Dev Client
    cmd: eas build --profile development --platform android

  eas:preview:
    desc: EAS cloud build — both platforms, internal distribution
    cmd: eas build --profile preview --platform all

  eas:production:
    desc: EAS cloud build — production both platforms
    cmd: eas build --profile production --platform all

  eas:submit:ios:
    desc: Submit iOS build to App Store (no Xcode needed)
    cmd: eas submit --platform ios --latest

  eas:submit:android:
    desc: Submit Android build to Play Store
    cmd: eas submit --platform android --latest

  lint:
    desc: Run ESLint
    cmd: npm run lint

  typecheck:
    desc: TypeScript check
    cmd: npx tsc --noEmit

  test:
    desc: Run tests
    cmd: npm test

  clean:
    desc: Remove node_modules and Expo caches
    cmds:
      - rm -rf node_modules
      - rm -rf .expo
      - rm -rf ios/build android/app/build android/build
      - npx expo install --fix
```

---

### 16.9 Local Development Workflow Summary

**First time setup (one-off):**
```bash
# 1. Install deps
task install

# 2. Build dev client (uploads to EAS, then install on device/simulator)
task eas:dev:ios       # for iPhone physical device or simulator
task eas:dev:android   # for Android

# OR build locally for simulator (requires Xcode 15.0.1 — you have it):
npx expo run:ios       # compiles and installs on booted simulator
```

**Daily development:**
```bash
# Start dev server (QR code in terminal)
task start

# iOS Simulator (local, fast hot-reload)
task ios:sim

# Android Emulator (auto-remaps localhost → 10.0.2.2)
task android:start && task android

# Physical device — scan QR code with installed Dev Client app
task start:dev-client
```

**What the QR code does:**
- `npx expo start` prints a QR code in the terminal
- Open your phone's camera → scan it → Dev Client app opens and connects
- Full hot-reload on save — no rebuild needed unless you change native code

---

### 16.10 What Changes vs What Stays the Same

| What | Change? | Details |
|---|---|---|
| All `src/` domain code | ✅ No change | Services, hooks, types — identical |
| `lib/http.ts` | ✅ No change | Same fetch-based implementation |
| `lib/http-stream.ts` | ✅ No change | ReadableStream works in Expo RN 0.76 |
| `lib/config.ts` | Minor | Add `resolveApiUrl()` platform remap |
| `AuthProvider.tsx` | Minor | Swap `@invertase` → `expo-apple-authentication` |
| `IEPUploadScreen.tsx` | Minor | Swap `react-native-document-picker` → `expo-document-picker` |
| Biometric components | Minor | Swap `react-native-biometrics` → `expo-local-authentication` |
| Navigation | ✅ No change | React Navigation is Expo-compatible |
| NativeWind | ✅ No change | SDK 52 compatible |
| Firebase init | ✅ No change | Configured via plist/json, not JS |
| `.env` | Add 2 vars | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| Build tooling | Replaced | `npx react-native run-ios` → `npx expo run:ios` |

---

## 17. Next Steps

- [ ] Team review and approval of this spec
- [ ] Build API notification endpoints (Section 13)
- [ ] `npx create-expo-app@latest` + install dependencies per Section 16.6
- [ ] Add `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to root `.env`
- [ ] Copy `app.config.js` with Firebase config paths pointing to `../../config/`
- [ ] Copy `eas.json` and run `eas build --profile development` for first Dev Client build
- [ ] Begin Phase 1 implementation (Section 15)
