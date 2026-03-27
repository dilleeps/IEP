# Architecture — AskIEP Web UI

_Part: `ui` | Type: `web` | Generated: 2026-02-21_

---

## Executive Summary

The AskIEP Web UI is a **React 19 Single Page Application** built with Vite 7, following a domain-driven folder structure. It uses React Router 7 for client-side routing, TanStack Query for server-state management, Radix UI primitives with Tailwind CSS 4 for the design system, and Firebase for authentication. All API calls go through a shared `apiRequest`/`apiLongRequest` helper that attaches the Bearer token and handles errors consistently.

---

## Technology Stack

| Category | Technology | Version | Notes |
|---|---|---|---|
| Language | TypeScript | ~5.9.3 | Path alias `@/*` → `src/` |
| Framework | React | 19.2.0 | With React Compiler (Babel plugin) |
| Build Tool | Vite | 7.2.4 | `@tailwindcss/vite` plugin |
| Routing | React Router | 7.11.0 | Nested routes, `RequireAuth`/`RequireRole` guards |
| Data Fetching | TanStack Query | 5.90.19 | Server state, caching, invalidation |
| UI Components | Radix UI | Suite | Headless primitives (dialog, select, tabs, etc.) |
| Styling | Tailwind CSS | 4.1.18 | Via `@tailwindcss/vite`; OKLCH design tokens |
| Component Variants | CVA (class-variance-authority) | 0.7.1 | Button, badge variants |
| Icons | Lucide React | ^0.562.0 | Icon library |
| Auth | Firebase SDK | ^11.0.1 | Google OAuth + token exchange with API |
| Offline/Cache | IDB | ^8.0.3 | IndexedDB wrapper for offline support |
| Animation | tw-animate-css | — | Tailwind animation utilities |
| Markdown | markdown-renderer component | — | Custom component for AI response rendering |

---

## Architecture Pattern

**Domain-Driven SPA with Provider Stack**

```
src/
├── main.tsx              # React entry point — mounts <App />
├── App.tsx               # Root — provider stack, router
├── app/
│   ├── components/       # App-level shared components (e.g., ConsentOverlay)
│   ├── pages/            # Route-bound page components
│   │   ├── admin/        # Admin-only pages
│   │   └── *.tsx         # Feature pages (Dashboard, Child, Goals, etc.)
│   ├── providers/        # Context providers (AuthProvider, ThemeProvider)
│   ├── routing/          # AppRoutes, RequireAuth, RequireRole
│   ├── shell/            # AppShell, Sidebar, Topbar, RoleSwitcher, navConfig
│   └── ui/               # Generic UI fragments (EmptyState, LoadingState, PageHeader)
├── components/
│   ├── auth/             # ChangePasswordDialog
│   ├── ui/               # shadcn-style Radix primitives (button, card, dialog, etc.)
│   ├── Login.tsx         # Login form component
│   └── NotificationContainer.tsx
├── domain/               # Domain modules (mirror API domains)
│   ├── admin/            # Admin service + types
│   ├── advocacy/         # AdvocacyLabPage + API + service + types
│   ├── auth/             # auth.service, roles, types
│   ├── behavior/         # behavior.service + types
│   ├── child/            # child.service + types
│   ├── iep/              # IEP pages (Analyzer, List, Edit, View) + service
│   ├── legal/            # LegalSupportPage + service
│   └── ...               # Other domains
└── lib/                  # Config, HTTP client utilities
```

---

## Provider Stack

```tsx
<ThemeProvider>          // Dark/light mode toggle, localStorage sync
  <NotificationProvider> // Toast/alert notification context
    <QueryClientProvider> // TanStack Query client
      <AuthProvider>     // Firebase auth + JWT token management
        <RouterProvider> // React Router
          <AppRoutes />  // Route tree
        </RouterProvider>
      </AuthProvider>
    </QueryClientProvider>
  </NotificationProvider>
</ThemeProvider>
```

---

## Routing Architecture

All authenticated routes are wrapped in `RequireAuth` → `RequireRole` guards. Unauthenticated users are redirected to `/login`. The `AppShell` provides the layout (Sidebar + Topbar) for all protected pages.

| Route | Component | Auth | Role |
|---|---|---|---|
| `/` | HomeRedirect | — | → dashboard or login |
| `/login` | LoginPage | No | — |
| `/register` | RegisterPage | No | — |
| `/dashboard` | DashboardPage | JWT | Any approved |
| `/child-profile` | ChildProfilePage | JWT | Any |
| `/child-profile/:id` | ChildEditPage | JWT | Any |
| `/iep/analyse` | IEPAnalyzerPage | JWT | Any |
| `/iep/list` | IEPListPage | JWT | Any |
| `/iep/view/:id` | IEPViewPage | JWT | Any |
| `/goal-progress` | GoalProgressPage | JWT | Any |
| `/goal-progress/:id` | GoalEditPage | JWT | Any |
| `/behavior-abc` | BehaviorABCPage | JWT | Any |
| `/behavior-abc/:id` | BehaviorEditPage | JWT | Any |
| `/contact-log` | ContactLogPage | JWT | Any |
| `/contact-log/:id` | ContactLogEditPage | JWT | Any |
| `/letter-writer` | LetterWriterPage | JWT | Any |
| `/letter-writer/:id` | LetterWriterEditPage | JWT | Any |
| `/advocacy-lab` | AdvocacyLabPage | JWT | Any |
| `/advocacy-lab/:id` | AdvocacyLabEditPage | JWT | Any |
| `/compliance` | CompliancePage | JWT | Any |
| `/compliance/:id` | ComplianceEditPage | JWT | Any |
| `/legal-support` | LegalSupportPage | JWT | Any |
| `/resources` | ResourcesPage | JWT | Any |
| `/settings` | SettingsPage | JWT | Any |
| `/admin/users` | AdminUsersPage | JWT | ADMIN only |
| `/admin/users/requests` | AdminRequestsPage | JWT | ADMIN only |
| `/admin/users/import` | AdminUserImportPage | JWT | ADMIN only |
| `/admin/users/:id` | AdminUserEditPage | JWT | ADMIN only |

---

## State Management

| State Category | Tool | Pattern |
|---|---|---|
| Server state | TanStack Query | `useQuery`/`useMutation` in domain service files |
| Auth state | React Context (`AuthProvider`) | Firebase auth + JWT token stored in context |
| UI/Theme state | React Context (`ThemeProvider`) | `localStorage` sync, `documentElement.classList` toggle |
| Notifications | React Context (`NotificationProvider`) | Toast queue |
| Form state | Local component state | `useState`, controlled inputs |
| Offline/Cache | IDB | IndexedDB for offline persistence |

---

## API Communication Pattern

All API calls use the shared `apiRequest` or `apiLongRequest` helpers from `src/lib/`:

```typescript
// Standard requests
const data = await apiRequest('/api/v1/children', { method: 'GET' });

// Long-running (e.g., AI generation with streaming)
const stream = await apiLongRequest('/api/v1/iep/analyse', { method: 'POST', body: formData });
```

These helpers:
- Attach `Authorization: Bearer <token>` from `AuthProvider`
- Set JSON Content-Type headers
- Handle 401 → force logout
- Apply request timeout (longer for AI endpoints)
- Parse NDJSON streams for AI streaming responses

---

## Design System

**Base**: Radix UI headless primitives with CVA variants
**Styling**: Tailwind CSS 4 with OKLCH color tokens defined in `index.css`
**Theme**: `ThemeProvider` toggles `.dark` on `<html>`, CSS tokens adapt

**Component library** (`src/components/ui/`):
- `button`, `badge`, `card`, `input`, `label`, `textarea`
- `dialog`, `alert-dialog`, `sheet`
- `select`, `dropdown-menu`, `checkbox`, `tabs`
- `progress`, `avatar`, `table`
- `alert`, `markdown-renderer`

---

## Authentication Flow

```
User → Firebase Google OAuth
     ↓
Firebase ID Token
     ↓
POST /api/v1/auth/exchange-token
     ↓
AskIEP JWT (accessToken + refreshToken)
     ↓
AuthProvider stores tokens
     ↓
All requests → Authorization: Bearer <accessToken>
```

Also supports internal email/password login via `POST /api/v1/auth/login`.

---

## Component Inventory

See [Component Inventory](./component-inventory-ui.md) for the full component catalog.

---

## Entry Points

| File | Purpose |
|---|---|
| `src/main.tsx` | React root mount point |
| `src/App.tsx` | Provider stack assembly |
| `src/app/routing/AppRoutes.tsx` | Full route definition tree |
| `src/app/shell/AppShell.tsx` | Authenticated layout shell |
| `src/app/shell/navConfig.ts` | Sidebar navigation configuration |

---

## Build & Development

```sh
# Development
npm run dev        # Vite dev server (hot reload)

# Production build
npm run build      # tsc -b && vite build → dist/

# Linting
npm run lint       # ESLint flat config (react-hooks, react-refresh)

# Preview production build
npm run preview
```

**Environment variables** (Vite `VITE_*` prefix):
```
VITE_BASE_API_URL           # API server base URL
VITE_RECAPTCHA_SITE_KEY     # reCAPTCHA v3 site key
VITE_FIREBASE_API_KEY       # Firebase config
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```
