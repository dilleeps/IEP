---
title: 'Firebase Google Authentication with Token Exchange'
slug: 'firebase-google-auth-token-exchange'
created: '2026-02-08'
status: 'in-progress'
stepsCompleted: [1]
tech_stack:
  - Firebase Admin SDK (Node.js)
  - Firebase JS SDK (Web)
  - Express.js
  - TypeScript
  - Sequelize ORM
  - PostgreSQL
  - JWT (jsonwebtoken)
  - React
  - Vite
files_to_modify:
  - apps/api/package.json
  - apps/api/src/modules/auth/auth.controller.ts
  - apps/api/src/modules/auth/auth.service.ts
  - apps/api/src/modules/auth/auth.routes.ts
  - apps/api/src/modules/auth/auth.types.ts
  - apps/api/src/modules/auth/auth.validation.ts
  - apps/api/src/modules/auth/user.model.ts
  - apps/ui/package.json
  - apps/ui/src/app/providers/AuthProvider.tsx
  - apps/ui/src/domain/auth/auth.service.ts
  - apps/ui/src/domain/auth/types.ts
code_patterns:
  - Firebase Admin SDK for server-side token validation
  - Firebase JS SDK signInWithPopup for client-side OAuth
  - JWT token generation after Firebase validation
  - Sequelize model updates with nullable fields
  - Express controller/service/route pattern
  - React Context API for auth state
test_patterns:
  - Unit tests for token exchange endpoint
  - Integration tests for user creation flow
  - Frontend tests for Google sign-in flow
---

# Tech-Spec: Firebase Google Authentication with Token Exchange

**Created:** 2026-02-08

## Overview

### Problem Statement

The application currently supports email/password authentication only. Users want to sign in with their Google accounts for a faster, passwordless experience. The existing system needs a Firebase-based OAuth layer that integrates seamlessly with the current JWT authentication infrastructure while maintaining security and preventing account conflicts.

### Solution

Implement a Firebase token exchange architecture on top of the existing JWT system:

1. **Frontend Flow**: User clicks "Sign in with Google" → Firebase handles OAuth popup → Frontend receives Firebase ID token
2. **Token Exchange**: Frontend sends Firebase token to new `/api/v1/auth/exchange-token` endpoint
3. **Backend Validation**: Validate Firebase token using Firebase Admin SDK → Extract user info (email, displayName, UID)
4. **User Management**:
   - Check if user exists by email
   - If exists with password provider: reject with error
   - If exists with Google provider: return existing user's JWT
   - If new user: auto-create with role='PARENT', status='active', provider='google', passwordHash=null
5. **JWT Response**: Return standard JWT tokens with `requiresSetup` flag for new users
6. **First-Time Setup**: New users redirected to consent agreement page before accessing app

This approach mirrors the existing Go implementation pattern, ensuring consistency across services.

### Scope

**In Scope:**

**Backend:**
- Install and configure Firebase Admin SDK (`firebase-admin` npm package)
- Create Firebase initialization module with service account credentials
- Add `/auth/exchange-token` endpoint (POST)
- Implement `exchangeFirebaseToken()` service method
- Validate Firebase ID tokens server-side
- Auto-create users with role='PARENT', status='active', provider='google'
- Make `users.password_hash` column nullable (create migration)
- Prevent Google sign-in for existing email/password users
- Return `requiresSetup: true` for newly created users
- Add Zod validation schema for exchange token request
- Update auth types to include exchange token DTOs

**Frontend:**
- Install Firebase JS SDK (`firebase` npm package)
- Create Firebase config/initialization module
- Initialize Firebase app with environment variables
- Implement `loginWithGoogle()` method in AuthProvider
- Use `signInWithPopup(GoogleAuthProvider)` for Google OAuth
- Call `/auth/exchange-token` API with Firebase ID token
- Handle exchange response and store JWT session
- Navigate new users (requiresSetup=true) to consent page
- Navigate existing users to dashboard
- Update auth service types to support Google login
- Create consent agreement page/modal component for parents
- Display full consent text (provided by user)
- Record consent acceptance with timestamp

**Database:**
- Create Sequelize migration to alter `users.password_hash` to nullable
- Add migration rollback to restore NOT NULL constraint

**Documentation:**
- Update API documentation for `/auth/exchange-token` endpoint
- Add environment variable documentation for Firebase config

**Out of Scope:**
- Apple Sign-In implementation (UI only shows placeholder button)
- Microsoft/other OAuth providers
- Account linking (merging password and Google accounts)
- Email verification flows for OAuth users
- Password reset functionality for OAuth users
- Multi-factor authentication (MFA)
- Admin approval workflow for Google users (they're auto-approved)
- Social profile syncing (avatar, additional metadata)
- Token refresh from Firebase (we use our own JWT refresh)
- Existing user migration tools (password → Google)

## Context for Development

### Codebase Patterns

**Backend Architecture:**
- **Controller-Service-Model pattern**: Auth logic separated into controller (HTTP), service (business logic), model (data)
- **Middleware-based auth**: `authenticate.ts` middleware validates JWT tokens on protected routes
- **Zod validation**: All request bodies validated with Zod schemas before reaching controllers
- **Error handling**: Custom `AppError` class with status codes and error codes
- **Environment config**: Uses `appenv` utility to load environment variables

**Frontend Architecture:**
- **React Context for auth**: `AuthProvider` wraps app, provides auth state and methods
- **Service layer**: `auth.service.ts` handles all API communication
- **Session management**: `useAuthSession` hook manages localStorage persistence
- **Type safety**: Full TypeScript with shared types between service and components
- **Notification system**: `useNotification` hook for user feedback

**Firebase Pattern (from Go reference):**
- Server-side token validation only (no client-side token refresh)
- Extract user details from verified token
- Auto-create users on first sign-in
- Store provider type for audit trail
- Empty/null password for OAuth users

**Existing User Model:**
- Already supports `provider` field: 'internal' | 'google' | 'microsoft' | 'apple'
- Currently requires `passwordHash` (needs to be nullable)
- Has role-based access: PARENT, ADVOCATE, TEACHER_THERAPIST, ADMIN, SUPPORT
- Status field: 'active', 'inactive', 'pending', 'suspended'
- Includes `approvedBy`, `approvedAt` for admin approval workflow (not used for Google users)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/api/src/modules/auth/auth.controller.ts` | HTTP handlers for auth endpoints |
| `apps/api/src/modules/auth/auth.service.ts` | Business logic for authentication |
| `apps/api/src/modules/auth/auth.routes.ts` | Express route definitions |
| `apps/api/src/modules/auth/auth.types.ts` | TypeScript interfaces for auth DTOs |
| `apps/api/src/modules/auth/auth.validation.ts` | Zod schemas for request validation |
| `apps/api/src/modules/auth/user.model.ts` | Sequelize User model definition |
| `apps/api/src/config/appenv.ts` | Environment variable configuration |
| `apps/ui/src/app/providers/AuthProvider.tsx` | React context for auth state |
| `apps/ui/src/domain/auth/auth.service.ts` | Frontend API client for auth |
| `apps/ui/src/domain/auth/types.ts` | Frontend TypeScript types |
| `apps/ui/src/lib/config.ts` | Frontend configuration and API endpoints |

### Technical Decisions

**1. Firebase Admin SDK vs. REST API**
- **Decision**: Use Firebase Admin SDK
- **Rationale**: Official SDK provides type safety, automatic retry logic, and better error handling vs. manual REST API calls
- **Trade-off**: Adds dependency size (~1MB), but improves reliability and developer experience

**2. Token Exchange Pattern vs. Direct Firebase Auth**
- **Decision**: Implement token exchange (Firebase token → JWT)
- **Rationale**:
  - Maintains existing JWT infrastructure and middleware
  - Single authentication mechanism (JWT) for all routes
  - Easier to add other OAuth providers later
  - Consistent with Go service implementation
- **Trade-off**: Extra API call, but provides flexibility and consistency

**3. Password Field: Nullable vs. Empty String**
- **Decision**: Use `NULL` for OAuth users
- **Rationale**:
  - Semantically correct (no password exists)
  - Cannot accidentally match empty string in login
  - Clear distinction in database queries
- **Trade-off**: Requires migration, but prevents security issues

**4. Account Conflict: Block vs. Link**
- **Decision**: Block Google sign-in if email exists with password
- **Rationale**:
  - Prevents account takeover scenarios
  - Simpler implementation (no merge logic)
  - Clear error message guides user to correct login method
- **Trade-off**: User inconvenience if they forget their login method, but maintains security

**5. New User Auto-Approval**
- **Decision**: Google users auto-approved (status='active')
- **Rationale**:
  - Google OAuth verifies email automatically
  - Reduces friction for parent users
  - Trusted identity provider
- **Trade-off**: Less control over who joins, but improves UX for primary user base

**6. Firebase SDK Initialization**
- **Decision**: Initialize Firebase on app startup (backend) and module load (frontend)
- **Rationale**:
  - One-time setup cost
  - Fails fast if misconfigured
  - Ready for all requests
- **Trade-off**: Increases startup time slightly (~50-100ms)

**7. Consent Agreement: Separate Page vs. Modal**
- **Decision**: Use modal on first dashboard access
- **Rationale**:
  - Non-dismissible modal ensures consent is recorded
  - Less navigation friction
  - Clear blocking behavior
- **Trade-off**: Could create separate onboarding page, but modal is simpler

## Implementation Plan

### Tasks

#### Phase 1: Backend - Firebase Integration & Token Exchange

**Task 1.1: Install Firebase Admin SDK**
- File: `apps/api/package.json`
- Action: Add `firebase-admin` dependency
- Command: `npm install firebase-admin --workspace=apps/api`

**Task 1.2: Create Firebase initialization module**
- File: `apps/api/src/config/firebase.ts` (NEW)
- Action: Create Firebase Admin SDK initialization
- Implementation:
  ```typescript
  import admin from 'firebase-admin';
  import { appenv } from './appenv.js';

  let firebaseApp: admin.app.App | null = null;

  export function initializeFirebase(): void {
    if (firebaseApp) return;

    const serviceAccount = JSON.parse(
      appenv.get('FIREBASE_SERVICE_ACCOUNT_JSON') || '{}'
    );

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  export function getFirebaseAuth(): admin.auth.Auth {
    if (!firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.auth(firebaseApp);
  }
  ```

**Task 1.3: Call Firebase init on server startup**
- File: `apps/api/src/server.ts`
- Action: Import and call `initializeFirebase()` before starting server

**Task 1.4: Make passwordHash nullable**
- File: `apps/api/src/db/migrations/YYYYMMDDHHMMSS-make-password-hash-nullable.ts` (NEW)
- Action: Create Sequelize migration
- Implementation:
  ```typescript
  import { QueryInterface, DataTypes } from 'sequelize';

  export async function up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.changeColumn('users', 'password_hash', {
      type: DataTypes.STRING(255),
      allowNull: true, // Changed from false
    });
  }

  export async function down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.changeColumn('users', 'password_hash', {
      type: DataTypes.STRING(255),
      allowNull: false,
    });
  }
  ```

**Task 1.5: Update User model**
- File: `apps/api/src/modules/auth/user.model.ts`
- Action: Change `passwordHash` to allow null
- Line 52: Change `allowNull: false` to `allowNull: true`

**Task 1.6: Add exchange token types**
- File: `apps/api/src/modules/auth/auth.types.ts`
- Action: Add new DTOs
- Implementation:
  ```typescript
  export interface ExchangeFirebaseTokenDto {
    firebaseToken: string;
  }

  export interface ExchangeTokenResponse extends AuthResponse {
    isNewUser: boolean;
    requiresSetup: boolean;
  }
  ```

**Task 1.7: Add exchange token validation schema**
- File: `apps/api/src/modules/auth/auth.validation.ts`
- Action: Add Zod schema
- Implementation:
  ```typescript
  import { z } from 'zod';

  export const exchangeFirebaseTokenSchema = z.object({
    firebaseToken: z.string().min(1, 'Firebase token is required'),
  });
  ```

**Task 1.8: Implement exchangeFirebaseToken service method**
- File: `apps/api/src/modules/auth/auth.service.ts`
- Action: Add new method to AuthService class
- Implementation:
  ```typescript
  import { getFirebaseAuth } from '../../config/firebase.js';

  async exchangeFirebaseToken(firebaseToken: string): Promise<ExchangeTokenResponse> {
    // Validate Firebase token
    let decodedToken;
    try {
      decodedToken = await getFirebaseAuth().verifyIdToken(firebaseToken);
    } catch (error) {
      throw new AppError('Invalid Firebase token', 401, 'INVALID_FIREBASE_TOKEN');
    }

    const { email, name, uid } = decodedToken;
    if (!email) {
      throw new AppError('Email not found in Firebase token', 400, 'MISSING_EMAIL');
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });
    let isNewUser = false;
    let requiresSetup = false;

    if (user) {
      // User exists - check provider
      if (user.provider === 'internal') {
        throw new AppError(
          'This email is registered with password. Please sign in with email and password.',
          409,
          'EMAIL_EXISTS_WITH_PASSWORD'
        );
      }

      // Existing Google user - update last login
      await user.update({ lastLoginAt: new Date() });
    } else {
      // Create new user
      isNewUser = true;
      requiresSetup = true;

      user = await User.create({
        email,
        displayName: name || email.split('@')[0],
        passwordHash: null,
        role: 'PARENT',
        status: 'active',
        provider: 'google',
        approvedAt: new Date(), // Auto-approved
      } as any);
    }

    // Generate JWT tokens
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: this.toUserResponse(user),
      token,
      refreshToken,
      isNewUser,
      requiresSetup,
    };
  }
  ```

**Task 1.9: Add exchange token controller method**
- File: `apps/api/src/modules/auth/auth.controller.ts`
- Action: Add new controller method
- Implementation:
  ```typescript
  exchangeFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.exchangeFirebaseToken(req.body.firebaseToken);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
  ```

**Task 1.10: Add exchange token route**
- File: `apps/api/src/modules/auth/auth.routes.ts`
- Action: Add new route
- Implementation:
  ```typescript
  authRouter.post(
    '/exchange-token',
    authRateLimit,
    validateBody(exchangeFirebaseTokenSchema),
    controller.exchangeFirebaseToken
  );
  ```

#### Phase 2: Frontend - Firebase Integration & Google Sign-In

**Task 2.1: Install Firebase JS SDK**
- File: `apps/ui/package.json`
- Action: Add `firebase` dependency
- Command: `npm install firebase --workspace=apps/ui`

**Task 2.2: Create Firebase config module**
- File: `apps/ui/src/lib/firebase.ts` (NEW)
- Action: Initialize Firebase app
- Implementation:
  ```typescript
  import { initializeApp } from 'firebase/app';
  import { getAuth, GoogleAuthProvider } from 'firebase/auth';

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const googleProvider = new GoogleAuthProvider();
  ```

**Task 2.3: Update frontend auth types**
- File: `apps/ui/src/domain/auth/types.ts`
- Action: Add Google login response type
- Implementation:
  ```typescript
  export interface GoogleAuthResponse {
    user: User;
    token: string;
    refreshToken: string;
    isNewUser: boolean;
    requiresSetup: boolean;
  }
  ```

**Task 2.4: Add exchange token method to auth service**
- File: `apps/ui/src/domain/auth/auth.service.ts`
- Action: Add new method to AuthService interface and implementation
- Implementation:
  ```typescript
  async exchangeFirebaseToken(firebaseToken: string): Promise<GoogleAuthResponse> {
    logger.info('Exchanging Firebase token');
    const response = await apiRequest<GoogleAuthResponse>(
      config.api.endpoints.auth.exchangeToken,
      {
        method: 'POST',
        body: { firebaseToken },
      }
    );
    logger.info('Firebase token exchanged', { isNewUser: response.isNewUser });
    return response;
  }
  ```

**Task 2.5: Update API config with exchange token endpoint**
- File: `apps/ui/src/lib/config.ts`
- Action: Add endpoint configuration
- Add to `endpoints.auth`: `exchangeToken: '/api/v1/auth/exchange-token'`

**Task 2.6: Implement loginWithGoogle in AuthProvider**
- File: `apps/ui/src/app/providers/AuthProvider.tsx`
- Action: Add method to AuthContextValue interface and implement
- Implementation:
  ```typescript
  import { signInWithPopup } from 'firebase/auth';
  import { auth, googleProvider } from '@/lib/firebase';

  // Add to interface
  interface AuthContextValue {
    // ... existing
    loginWithGoogle: () => Promise<{ requiresSetup: boolean }>;
  }

  // Implement in AuthProvider
  const loginWithGoogle = useCallback(async () => {
    try {
      logger.info('Starting Google sign-in');

      // Sign in with Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseToken = await result.user.getIdToken();

      // Exchange for JWT
      const response = await authService.exchangeFirebaseToken(firebaseToken);

      // Create session
      const session = {
        accessToken: response.token,
        refreshToken: response.refreshToken,
        user: response.user,
        expiresAt: decodeJwtExpiry(response.token) ?? Date.now() + 86400000,
      };

      setSession(session);

      if (response.isNewUser) {
        showSuccess('Welcome!', 'Your account has been created');
      } else {
        showSuccess('Welcome back!', `Logged in as ${response.user.displayName}`);
      }

      logger.info('Google sign-in successful', {
        userId: response.user.id,
        isNewUser: response.isNewUser
      });

      return { requiresSetup: response.requiresSetup };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      showError('Sign-in failed', message);
      logger.error('Google sign-in error', { error: message });
      throw error;
    }
  }, [authService, setSession, showSuccess, showError]);

  // Add to context value
  const value: AuthContextValue = {
    // ... existing
    loginWithGoogle,
  };
  ```

**Task 2.7: Update SignIn component to use loginWithGoogle**
- File: `apps/ui/src/app/pages/auth/SignIn.tsx`
- Action: Update `handleGoogleAuth` to call actual implementation
- Replace mock implementation with:
  ```typescript
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const result = await loginWithGoogle();

      if (result.requiresSetup) {
        navigate('/profile/setup');
      } else {
        navigate(config.routes.user.dashboard);
      }

      showSuccess('Successfully signed in with Google!');
    } catch (error: any) {
      showError(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };
  ```

**Task 2.8: Update UnifiedAuth component**
- File: `apps/ui/src/app/pages/auth/UnifiedAuth.tsx`
- Action: Replace mock implementation with actual loginWithGoogle call
- Same implementation as Task 2.7

**Task 2.9: Create ConsentAgreement component**
- File: `apps/ui/src/app/pages/profile/ConsentAgreement.tsx` (NEW)
- Action: Create modal/page for first-time consent
- Implementation: Full-screen modal with consent text, Accept/Decline buttons
- Store consent acceptance via API call (new endpoint needed)
- Navigate to dashboard after acceptance

**Task 2.10: Add consent acceptance endpoint (Backend)**
- File: `apps/api/src/modules/user/user.controller.ts`
- Action: Add endpoint to record consent
- Store timestamp in user metadata/audit log

#### Phase 3: Testing & Documentation

**Task 3.1: Add backend unit tests**
- File: `apps/api/src/modules/auth/auth.service.test.ts`
- Test cases:
  - Valid Firebase token creates new user
  - Valid Firebase token returns existing Google user
  - Firebase token with existing password email throws error
  - Invalid Firebase token throws error
  - Missing email in token throws error

**Task 3.2: Add backend integration tests**
- File: `apps/api/src/modules/auth/auth.controller.test.ts`
- Test cases:
  - POST `/auth/exchange-token` with valid token returns 200
  - POST `/auth/exchange-token` with invalid token returns 401
  - POST `/auth/exchange-token` with existing password email returns 409

**Task 3.3: Add frontend tests**
- File: `apps/ui/src/app/providers/AuthProvider.test.tsx`
- Test cases:
  - loginWithGoogle calls Firebase and exchanges token
  - loginWithGoogle handles new user flow
  - loginWithGoogle handles existing user flow
  - loginWithGoogle handles errors

**Task 3.4: Update API documentation**
- File: `apps/api/src/docs/swagger.ts` or inline JSDoc
- Document new `/auth/exchange-token` endpoint with request/response schemas

**Task 3.5: Add environment variable documentation**
- File: `README.md` or `docs/setup.md`
- Document all Firebase environment variables required

### Acceptance Criteria

**Backend:**

**Given** a valid Firebase ID token from Google OAuth
**When** POST `/api/v1/auth/exchange-token` with `{ firebaseToken: "valid-token" }`
**Then** response is 200 with JWT tokens and user data
**And** `isNewUser` is `true` if user was created
**And** `requiresSetup` is `true` for newly created users
**And** user has `role='PARENT'`, `status='active'`, `provider='google'`, `passwordHash=null`

---

**Given** a Firebase token for an email that exists with password provider
**When** POST `/api/v1/auth/exchange-token`
**Then** response is 409 with error code `EMAIL_EXISTS_WITH_PASSWORD`
**And** error message guides user to use password login

---

**Given** an invalid or expired Firebase token
**When** POST `/api/v1/auth/exchange-token`
**Then** response is 401 with error code `INVALID_FIREBASE_TOKEN`

---

**Given** a Firebase token without email claim
**When** POST `/api/v1/auth/exchange-token`
**Then** response is 400 with error code `MISSING_EMAIL`

---

**Given** Firebase Admin SDK not initialized
**When** any exchange token request is made
**Then** server fails gracefully with 500 error and logs initialization issue

---

**Given** a valid Firebase token for existing Google user
**When** POST `/api/v1/auth/exchange-token`
**Then** response is 200 with existing user's data
**And** `isNewUser` is `false`
**And** `requiresSetup` is `false`
**And** `lastLoginAt` is updated in database

---

**Frontend:**

**Given** user clicks "Continue with Google" button
**When** Google OAuth popup completes successfully
**Then** Firebase ID token is obtained
**And** token is sent to `/auth/exchange-token` API
**And** JWT is stored in session
**And** user is redirected based on `requiresSetup` flag

---

**Given** a new user completes Google sign-in (`requiresSetup: true`)
**When** token exchange succeeds
**Then** user is navigated to `/profile/setup` or consent modal
**And** consent agreement is displayed
**And** user must accept to continue

---

**Given** an existing user completes Google sign-in (`requiresSetup: false`)
**When** token exchange succeeds
**Then** user is navigated to dashboard
**And** no consent modal is shown

---

**Given** Google OAuth fails (user cancels popup)
**When** sign-in is attempted
**Then** error message is shown
**And** user remains on sign-in page
**And** error is logged

---

**Given** token exchange API returns 409 (email exists with password)
**When** Google sign-in attempts to exchange token
**Then** error message tells user to sign in with password
**And** user remains on sign-in page

---

**Database:**

**Given** migration to make `password_hash` nullable is run
**When** `npm run db:migrate` is executed
**Then** `users.password_hash` column allows NULL values
**And** existing users with passwords are not affected

---

**Given** rollback migration is run
**When** `npm run db:migrate:down` is executed
**Then** `users.password_hash` column is restored to NOT NULL
**And** migration fails if any NULL values exist (expected behavior)

---

**Security:**

**Given** an attacker tries to use a forged Firebase token
**When** POST `/auth/exchange-token` with forged token
**Then** Firebase Admin SDK verification fails
**And** response is 401
**And** no user is created

---

**Given** an attacker tries to claim existing email via Google OAuth
**When** email exists with password provider
**Then** exchange fails with 409
**And** no session is created
**And** existing user account is not modified

---

**Consent Agreement:**

**Given** a new parent user signs in with Google
**When** they land on consent page
**Then** full consent agreement text is displayed
**And** "Accept & Continue" and "Decline" buttons are shown
**And** Accept button records consent timestamp
**And** Decline button logs them out

## Additional Context

### Dependencies

**Backend:**
- `firebase-admin` ^12.0.0 - Firebase Admin SDK for Node.js
- Existing: `express`, `jsonwebtoken`, `sequelize`, `bcrypt`, `zod`

**Frontend:**
- `firebase` ^10.0.0 - Firebase JS SDK
- Existing: `react`, `react-router-dom`

**Environment Variables:**
- Backend: `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON string with service account credentials)
- Frontend: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`

### Testing Strategy

**Unit Tests:**
- Mock Firebase Admin SDK in service tests
- Mock Firebase JS SDK in frontend tests
- Test all error paths (invalid token, missing email, duplicate email)
- Test user creation logic with correct defaults

**Integration Tests:**
- Use test Firebase project for integration tests
- Test full flow: Firebase OAuth → token exchange → JWT session
- Verify database state after user creation
- Test migration up/down scenarios

**Manual Testing Checklist:**
- [ ] Click Google sign-in button opens OAuth popup
- [ ] Complete OAuth creates new user in database
- [ ] New user redirected to consent page
- [ ] Existing user redirected to dashboard
- [ ] Duplicate email with password shows error
- [ ] Cancel OAuth popup shows error message
- [ ] JWT token works on protected routes
- [ ] Token refresh works for Google users
- [ ] Logout clears session properly

**Load Testing:**
- Firebase Admin SDK caches tokens internally, should handle concurrent requests
- Rate limit on `/auth/exchange-token` to prevent abuse

### Notes

**Go Implementation Reference:**
The provided Go code shows the pattern we're replicating:
- `ExchangeFirebaseTokenHandler` validates token and creates/finds user
- Returns `IsNewUser` and `RequiresSetup` flags
- Auto-creates user with empty password
- Generates JWT after validation

**Error Handling Strategy:**
- Use AppError with specific error codes for different failure scenarios
- Firebase errors mapped to user-friendly messages
- Log all authentication attempts for security audit

**Future Enhancements (Out of Scope):**
- Apple Sign-In (similar pattern, different provider)
- Account linking UI for merging password and Google accounts
- Social profile syncing (avatar, additional fields)
- Google One Tap sign-in
- Remember device functionality

**Security Considerations:**
- Firebase tokens are single-use (short-lived)
- Server-side validation prevents token forgery
- Email uniqueness enforced at database level
- Rate limiting prevents brute force attacks
- OAuth popup prevents phishing (not redirect-based)

**Migration Strategy:**
- Run `password_hash` nullable migration before deploying new code
- Deploy backend first (endpoint available but not used)
- Deploy frontend second (uses new endpoint)
- No downtime required (existing auth still works)

**Consent Agreement:**
The provided consent text covers:
- Parent/guardian acknowledgment
- Data scope (IEP documents, evaluations, reports)
- Storage & security (GCP, encryption, monitoring)
- Privacy & compliance (FERPA, SOC 2, ISO 27001, GDPR)
- Parent rights (access, download, correction, deletion, withdrawal)
- Audit & recordkeeping (timestamp, IP, version)
- Contact information

Implementation requirements:
- Non-dismissible modal or full-page component
- Scroll to bottom required before enabling Accept button
- Record acceptance in database with full audit trail
- Display on first login only (check user metadata)
- Logout if declined

**Rollout Plan:**
1. Merge backend changes (migration, endpoint, Firebase init)
2. Run migration on staging
3. Test staging with test Firebase credentials
4. Deploy to production
5. Monitor error rates and user creation metrics
6. Deploy frontend (Google button now functional)
7. Monitor authentication success rates
8. Announce feature to users
