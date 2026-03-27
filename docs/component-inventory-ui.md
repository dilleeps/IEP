# Component Inventory — AskIEP Web UI

_Generated: 2026-02-21 | Framework: React 19 + Radix UI + Tailwind CSS 4_

---

## Design System Primitives (`src/components/ui/`)

These are shadcn/ui-style wrappers around Radix UI primitives, styled with Tailwind CSS and CVA.

| Component | Radix Primitive | Description |
|---|---|---|
| `button.tsx` | `@radix-ui/react-slot` | Button with CVA variants (default, outline, ghost, destructive, etc.) |
| `badge.tsx` | — | Status/label badge with variants |
| `card.tsx` | — | Card container with header, content, footer slots |
| `input.tsx` | — | Styled text input |
| `textarea.tsx` | — | Styled textarea |
| `label.tsx` | `@radix-ui/react-label` | Form field label |
| `checkbox.tsx` | `@radix-ui/react-checkbox` | Checkbox with check icon |
| `select.tsx` | `@radix-ui/react-select` | Dropdown select |
| `dialog.tsx` | `@radix-ui/react-dialog` | Modal dialog |
| `alert-dialog.tsx` | `@radix-ui/react-alert-dialog` | Confirmation dialog |
| `sheet.tsx` | — | Side-panel slide-out sheet |
| `dropdown-menu.tsx` | `@radix-ui/react-dropdown-menu` | Dropdown context menu |
| `tabs.tsx` | `@radix-ui/react-tabs` | Tabbed navigation |
| `progress.tsx` | `@radix-ui/react-progress` | Progress bar |
| `avatar.tsx` | `@radix-ui/react-avatar` | Avatar with image + fallback |
| `table.tsx` | — | Styled HTML table |
| `alert.tsx` | — | Alert/notification box |
| `markdown-renderer.tsx` | — | Custom Markdown → HTML renderer for AI responses |

---

## Auth Components

| Component | Path | Description |
|---|---|---|
| `Login.tsx` | `src/components/Login.tsx` | Login form (email/password + Google OAuth button) |
| `ChangePasswordDialog.tsx` | `src/components/auth/ChangePasswordDialog.tsx` | Change password modal dialog |

---

## App Shell Components

| Component | Path | Description |
|---|---|---|
| `AppShell.tsx` | `src/app/shell/AppShell.tsx` | Authenticated layout: Sidebar + Topbar + Outlet |
| `Sidebar.tsx` | `src/app/shell/Sidebar.tsx` | Navigation sidebar with role-based links |
| `Topbar.tsx` | `src/app/shell/Topbar.tsx` | Top navigation bar, user menu, theme toggle |
| `RoleSwitcher.tsx` | `src/app/shell/RoleSwitcher.tsx` | Dev/admin tool to switch active role view |
| `navConfig.ts` | `src/app/shell/navConfig.ts` | Navigation items configuration (icons, paths, role guards) |

---

## App-Level UI Fragments

| Component | Path | Description |
|---|---|---|
| `EmptyState.tsx` | `src/app/ui/EmptyState.tsx` | Empty list/state placeholder |
| `LoadingState.tsx` | `src/app/ui/LoadingState.tsx` | Loading spinner/skeleton |
| `PageHeader.tsx` | `src/app/ui/PageHeader.tsx` | Consistent page title + action button header |
| `ConsentOverlay.tsx` | `src/app/components/ConsentOverlay.tsx` | First-visit consent/terms overlay |
| `NotificationContainer.tsx` | `src/components/NotificationContainer.tsx` | Toast notification renderer |

---

## Page Components

### Authentication Pages

| Page | Path | Description |
|---|---|---|
| `LoginPage` | `src/app/pages/LoginPage.tsx` | Login form page |
| `RegisterPage` | `src/app/pages/RegisterPage.tsx` | Registration form (role selection) |

### Core App Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `DashboardPage` | `src/app/pages/DashboardPage.tsx` | `/dashboard` | Summary widgets, upcoming IEP dates, goal status |
| `ChildProfilePage` | `src/app/pages/ChildProfilePage.tsx` | `/child-profile` | List of child profiles |
| `ChildEditPage` | `src/app/pages/ChildEditPage.tsx` | `/child-profile/:id` | Create/edit child profile form |
| `SettingsPage` | `src/app/pages/SettingsPage.tsx` | `/settings` | User preferences form |
| `ResourcesPage` | `src/app/pages/ResourcesPage.tsx` | `/resources` | Educational resource library browser |
| `NotFoundPage` | `src/app/pages/NotFoundPage.tsx` | `*` | 404 page |
| `ConsentPage` | `src/app/pages/ConsentPage.tsx` | — | Consent management page |

### IEP Domain Pages (in `src/domain/iep/`)

| Page | Route | Description |
|---|---|---|
| `IEPAnalyzerPage` | `/iep/analyse` | Upload + analyze IEP PDF; shows AI results |
| `IEPListPage` | `/iep/list` | List uploaded IEP documents |
| `IEPEditPage` | `/iep/:id/edit` | Edit IEP document metadata |
| `IEPViewPage` | `/iep/view/:id` | View IEP analysis results (goals, accommodations, red flags, risk) |

### Goal Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `GoalProgressPage` | `src/app/pages/GoalProgressPage.tsx` | `/goal-progress` | List goals with progress indicators |
| `GoalEditPage` | `src/app/pages/GoalEditPage.tsx` | `/goal-progress/:id` | Create/edit goal + add progress entries |

### Behavior Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `BehaviorABCPage` | `src/app/pages/BehaviorABCPage.tsx` | `/behavior-abc` | List behavior log entries with filters |
| `BehaviorEditPage` | `src/app/pages/BehaviorEditPage.tsx` | `/behavior-abc/:id` | Create/edit ABC behavior entry |

### Communication Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `ContactLogPage` | `src/app/pages/ContactLogPage.tsx` | `/contact-log` | List communication log entries |
| `ContactLogEditPage` | `src/app/pages/ContactLogEditPage.tsx` | `/contact-log/:id` | Create/edit communication log entry |

### Letter Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `LetterWriterPage` | `src/app/pages/LetterWriterPage.tsx` | `/letter-writer` | List generated letters |
| `LetterWriterEditPage` | `src/app/pages/LetterWriterEditPage.tsx` | `/letter-writer/:id` | AI letter generation form |

### Advocacy & AI Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `AdvocacyLabPage` | `src/domain/advocacy/AdvocacyLabPage.tsx` | `/advocacy-lab` | Advocacy sessions list |
| `AdvocacyLabEditPage` | `src/app/pages/AdvocacyLabEditPage.tsx` | `/advocacy-lab/:id` | AI chat session interface |
| `LegalSupportPage` | `src/domain/legal/LegalSupportPage.tsx` | `/legal-support` | Legal support AI agent interface |

### Compliance Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `CompliancePage` | `src/app/pages/CompliancePage.tsx` | `/compliance` | List compliance log entries with summary |
| `ComplianceEditPage` | `src/app/pages/ComplianceEditPage.tsx` | `/compliance/:id` | Create/edit compliance log entry |

### Admin Pages

| Page | Path | Route | Description |
|---|---|---|---|
| `AdminUsersPage` | `src/app/pages/admin/AdminUsersPage.tsx` | `/admin/users` | User list with search/filter |
| `AdminRequestsPage` | `src/app/pages/admin/AdminRequestsPage.tsx` | `/admin/users/requests` | Pending approval requests |
| `AdminUserEditPage` | `src/app/pages/admin/AdminUserEditPage.tsx` | `/admin/users/:id` | Edit user role/status |
| `AdminUserImportPage` | `src/app/pages/admin/AdminUserImportPage.tsx` | `/admin/users/import` | CSV bulk user import |

---

## Domain Service Modules (`src/domain/`)

Each domain mirrors the API module structure:

| Domain | Service File | API File | Description |
|---|---|---|---|
| `auth` | `auth.service.ts` | — | Firebase auth + token exchange |
| `child` | `child.service.ts` | — | Child CRUD via API |
| `iep` | `iep.service.ts` | `iep.api.ts` | IEP document + analysis API calls |
| `advocacy` | `advocacy.service.ts` | `advocacy.api.ts` | Advocacy session API calls |
| `behavior` | `behavior.service.ts` | — | Behavior log API calls |
| `admin` | `userManagement.service.ts` | — | Admin user management |
| `legal` | — | — | Legal support AI agent |

---

## Domain-Specific Sub-components

### Advocacy Lab

| Component | Description |
|---|---|
| `ChatInput.tsx` | Textarea input with submit button for AI chat |
| `ChatMessage.tsx` | Single message bubble (user / AI) with markdown rendering |
| `QuickPrompts.tsx` | Horizontal scroll of quick-start prompt buttons |

### Routing Guards

| Component | Description |
|---|---|
| `RequireAuth.tsx` | Redirects unauthenticated users to `/login` |
| `RequireRole.tsx` | Redirects to dashboard if user lacks required role(s) |

---

## Provider Components

| Provider | Description |
|---|---|
| `AuthProvider.tsx` | Firebase auth state + JWT management; exposes `useAuth()` hook |
| `ThemeProvider.tsx` | Dark/light mode toggle via `localStorage` and `documentElement.classList` |

---

## Summary

| Category | Count |
|---|---|
| UI Primitives (design system) | 18 |
| Auth Components | 2 |
| Shell Components | 5 |
| App UI Fragments | 5 |
| Auth Pages | 2 |
| Core Pages | 7 |
| IEP Pages | 4 |
| Goal Pages | 2 |
| Behavior Pages | 2 |
| Communication Pages | 2 |
| Letter Pages | 2 |
| Advocacy/AI Pages | 3 |
| Compliance Pages | 2 |
| Admin Pages | 4 |
| Domain Services | 7 |
| Domain Sub-components | 5+ |
| **Total** | **~76** |
