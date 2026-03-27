---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/tech-architecture-spec.md'
---

# AskIEP Mobile - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AskIEP Mobile, decomposing the requirements from the PRD and Architecture spec into implementable stories. The app is a React Native companion to the existing AskIEP web platform, targeting the Parent role with full feature parity across all 12 domains.

## Requirements Inventory

### Functional Requirements

- FR1: Parent can sign in using Google Sign-In
- FR2: Parent can sign in using Apple Sign-In
- FR3: Parent can sign out of the application
- FR4: Returning parent can unlock the app using biometric authentication (Face ID / Touch ID)
- FR5: System can exchange Firebase authentication token for API JWT
- FR6: System can detect expired sessions and redirect to sign-in
- FR7: First-time parent can view the full Parent Consent & Data Release Agreement
- FR8: First-time parent can accept the consent agreement to proceed to the app
- FR9: First-time parent can decline the consent agreement, which logs them out
- FR10: System records consent with user identifier, timestamp, device info, app version, and consent version
- FR11: System blocks all app navigation until consent is accepted
- FR12: Parent can create a child profile with basic information
- FR13: Parent can view a list of their children
- FR14: Parent can edit a child's profile
- FR15: Parent can delete a child's profile
- FR16: Parent can switch between children using a child switcher
- FR17: Parent can view a summary dashboard for the selected child
- FR18: Dashboard displays goal progress percentages, compliance service counts (met/missed/upcoming), and the 5 most recent activity entries for the selected child
- FR19: Parent can navigate to any feature domain from the dashboard
- FR20: Parent can upload an IEP document (PDF) from device storage
- FR21: System can analyze an uploaded IEP document using AI with real-time streaming progress
- FR22: Parent can review extracted IEP data (goals, services, accommodations, red flags) with confidence scores
- FR23: Parent can accept or correct extracted IEP data
- FR24: Parent can view previously uploaded and analyzed IEP documents
- FR25: Parent can view all goals extracted from IEP documents for a child
- FR26: Parent can track progress against each goal
- FR27: Parent can add progress entries with notes
- FR28: Parent can log a behavior incident with antecedent, behavior, and consequence (ABC format)
- FR29: Parent can view a history of behavior incidents for a child
- FR30: Parent can edit or delete a behavior entry
- FR31: Parent can view compliance status for required services (therapy sessions, accommodations)
- FR32: System can flag missed or overdue services
- FR33: Parent can view compliance trends over time
- FR34: Parent can log a contact with school personnel (calls, emails, meetings)
- FR35: Parent can set follow-up reminders on contact entries
- FR36: Parent can view contact history for a child
- FR37: Parent can chat with the Advocacy Lab AI agent with real-time streaming responses
- FR38: Parent can chat with the Legal Support AI agent with real-time streaming responses
- FR39: Parent can generate advocacy letters using AI with customizable parameters
- FR40: Parent can view and manage previously generated letters
- FR41: Parent can view conversation history for AI chat sessions
- FR42: Parent can browse educational resources about IEP rights and processes
- FR43: Parent can bookmark resources for later reference
- FR44: Parent can view and edit their account profile
- FR45: Parent can view notification preference toggles in Settings; toggles are visible but disabled with "Coming soon" labels until push notifications are implemented in Growth phase
- FR46: Parent can manage biometric authentication settings (enable/disable)
- FR47: System lazy-loads all feature domain screens for startup performance
- FR48: System detects network loss and displays a non-dismissable banner stating "No internet connection" with a retry button; all API-dependent actions show inline "Network unavailable" instead of loading spinners
- FR49: System displays empty states with guidance for first-time users (no children, no IEPs)
- FR50: System supports secure token storage using platform Keychain/Keystore

### NonFunctional Requirements

- NFR1: App cold start to interactive dashboard in under 3 seconds on mid-range devices
- NFR2: Screen-to-screen navigation completes in under 300ms (lazy-loaded screens may take up to 1 second on first load)
- NFR3: Biometric re-auth to dashboard in under 1 second
- NFR4: IEP document upload begins streaming progress within 5 seconds of submission
- NFR5: AI chat messages begin streaming first token within 3 seconds
- NFR6: List screens (goals, behaviors, contacts) render first 20 items within 1 second
- NFR7: App JS bundle size stays under 15MB (lazy loading required for all domain screens)
- NFR8: JWT tokens and biometric credentials stored exclusively in platform Keychain (iOS) / Keystore (Android)
- NFR9: All API communication over TLS 1.2+
- NFR10: No child PII logged to console, crash reporters, or analytics
- NFR11: IEP document upload buffers cleared from device memory after API submission
- NFR12: Session auto-expires after 30 minutes of inactivity
- NFR13: Consent record includes user ID, timestamp, device info, app version, and consent version for audit trail
- NFR14: All interactive elements support VoiceOver (iOS) and TalkBack (Android) with meaningful labels
- NFR15: AI chat streaming content is announced progressively to screen readers
- NFR16: Minimum touch target size of 44x44 points (iOS) / 48x48dp (Android)
- NFR17: Color contrast ratios meet WCAG 2.1 AA
- NFR18: Consent agreement is fully navigable and readable via screen reader
- NFR19: App authenticates via Firebase Auth SDK and exchanges token with existing API
- NFR20: All 90+ existing REST API endpoints consumed without modification
- NFR21: NDJSON streaming maintains connection on cellular networks with 3 retries and exponential backoff
- NFR22: Document picker supports PDF files up to 25MB matching API upload limits
- NFR23: Biometric integration gracefully degrades to password/PIN when biometric hardware is unavailable
- NFR24: App crash rate below 1% of sessions
- NFR25: Network errors display plain-language messages with retry options
- NFR26: When app returns from background during AI streaming, display partial content with "Continue generation" button
- NFR27: Form data persists locally during entry to prevent data loss from accidental navigation

### Additional Requirements

From Architecture spec:
- React Native 0.72 + TypeScript 4.8 + React 18.2 project scaffolding
- NativeWind (tailwindcss@3) + React Native Paper (Material Design 3) UI layer
- React Navigation 6 with stack + bottom tab navigators
- TanStack React Query 5 for server state management
- Firebase Auth SDK integration (Google + Apple providers)
- Custom `lib/http-stream.ts` for NDJSON streaming (ReadableStream on RN 0.72+)
- `react-native-keychain` for secure token storage (Keychain/Keystore)
- `react-native-biometrics` for Touch ID/Face ID integration
- `@react-native-community/netinfo` for network state detection
- `react-native-document-picker` for IEP upload (PDF, max 25MB)
- Consent flow modeled on web's `ConsentOverlay.tsx` — blocking full-screen modal
- API base URL configurable via environment/config (no hardcoded URLs)
- Error handling via centralized error boundary + per-request error states
- No local IEP data caching — all student data stays server-side (FERPA)
- PII sanitization in all logging and crash reporting

### FR Coverage Map

- FR1 → Epic 1 (Google Sign-In)
- FR2 → Epic 1 (Apple Sign-In)
- FR3 → Epic 1 (Sign out)
- FR4 → Epic 1 (Biometric re-auth)
- FR5 → Epic 1 (Firebase → JWT exchange)
- FR6 → Epic 1 (Session expiry detection)
- FR7 → Epic 2 (View consent agreement)
- FR8 → Epic 2 (Accept consent)
- FR9 → Epic 2 (Decline consent → logout)
- FR10 → Epic 2 (Consent audit trail)
- FR11 → Epic 2 (Block navigation until consent)
- FR12 → Epic 2 (Create child profile)
- FR13 → Epic 2 (View children list)
- FR14 → Epic 2 (Edit child profile)
- FR15 → Epic 2 (Delete child profile)
- FR16 → Epic 2 (Child switcher)
- FR17 → Epic 2 (Dashboard view)
- FR18 → Epic 2 (Dashboard metrics)
- FR19 → Epic 2 (Dashboard navigation)
- FR20 → Epic 3 (IEP upload)
- FR21 → Epic 3 (AI analysis streaming)
- FR22 → Epic 3 (Extraction review)
- FR23 → Epic 3 (Accept/correct data)
- FR24 → Epic 3 (View previous IEPs)
- FR25 → Epic 4 (View goals)
- FR26 → Epic 4 (Track progress)
- FR27 → Epic 4 (Add progress entries)
- FR28 → Epic 4 (Log behavior incident)
- FR29 → Epic 4 (View behavior history)
- FR30 → Epic 4 (Edit/delete behavior)
- FR31 → Epic 4 (Compliance status)
- FR32 → Epic 4 (Flag overdue services)
- FR33 → Epic 4 (Compliance trends)
- FR34 → Epic 4 (Log contact)
- FR35 → Epic 4 (Follow-up reminders)
- FR36 → Epic 4 (Contact history)
- FR37 → Epic 5 (Advocacy Lab chat)
- FR38 → Epic 5 (Legal Support chat)
- FR39 → Epic 5 (Letter generation)
- FR40 → Epic 5 (Manage letters)
- FR41 → Epic 5 (Chat history)
- FR42 → Epic 6 (Browse resources)
- FR43 → Epic 6 (Bookmark resources)
- FR44 → Epic 6 (Account profile)
- FR45 → Epic 6 (Notification prefs scaffold)
- FR46 → Epic 6 (Biometric settings)
- FR47 → Epic 1 (Lazy loading)
- FR48 → Epic 1 (Network detection)
- FR49 → Epic 2 (Empty states)
- FR50 → Epic 1 (Secure token storage)

## Epic List

### Epic 1: App Foundation & Authentication
Parent can install the app, sign in with Google or Apple, unlock with biometrics, and reach a secure authenticated state with proper session management.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR47, FR48, FR50
**NFRs addressed:** NFR1-3, NFR7-9, NFR12, NFR16, NFR17, NFR19, NFR23-25
**Phase:** 1

### Epic 2: Onboarding, Dashboard & Child Management
First-time parent completes consent, manages children, and views a summary dashboard. Returning parents land on their dashboard with child data ready.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR49
**NFRs addressed:** NFR10, NFR13-15, NFR18
**Phase:** 1

### Epic 3: IEP Document Analysis
Parent can upload an IEP document, watch AI analyze it with real-time streaming, review extracted data with confidence scores, and manage their IEP library.
**FRs covered:** FR20, FR21, FR22, FR23, FR24
**NFRs addressed:** NFR4, NFR11, NFR21, NFR22
**Phase:** 2

### Epic 4: Tracking & Compliance
Parent can track goals, log behaviors, monitor service compliance, and maintain a contact log with school personnel — the daily-use features for ongoing IEP management.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36
**NFRs addressed:** NFR6, NFR27
**Phase:** 2

### Epic 5: AI Communication Hub
Parent can chat with AI agents (Advocacy Lab + Legal Support) with streaming responses, generate and manage advocacy letters, and review conversation history.
**FRs covered:** FR37, FR38, FR39, FR40, FR41
**NFRs addressed:** NFR5, NFR15, NFR21, NFR26
**Phase:** 3

### Epic 6: Resources, Settings & Launch Readiness
Parent can browse and bookmark educational resources, manage their profile and app settings, and the app meets all store submission requirements.
**FRs covered:** FR42, FR43, FR44, FR45, FR46
**NFRs addressed:** NFR10, NFR24
**Phase:** 3

---

## Epic 1: App Foundation & Authentication

Parent can install the app, sign in with Google or Apple, unlock with biometrics, and reach a secure authenticated state with proper session management.

### Story 1.1: Project Scaffolding & Navigation Shell

As a developer,
I want to set up the React Native project with all foundational dependencies and navigation structure,
So that all future features have a consistent, performant base to build on.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `npm install` and `npm run ios` / `npm run android`
**Then** the app launches with a bottom tab navigator (Dashboard, Documents, Tracking, AI Chat, Settings) and stack navigators per tab
**And** NativeWind (tailwindcss@3) styles render correctly on both platforms
**And** React Native Paper (Material Design 3) theme is configured with AskIEP brand colors
**And** all domain screens use `React.lazy()` with React Navigation's `lazy` prop (FR47)
**And** TanStack React Query provider wraps the app with default stale/cache config
**And** network state detection shows a non-dismissable "No internet connection" banner when offline (FR48)
**And** the app shell loads in under 3 seconds on a mid-range device (NFR1)
**And** JS bundle size stays under 15MB (NFR7)
**And** all touch targets meet minimum 44x44pt / 48x48dp (NFR16)
**And** color contrast meets WCAG 2.1 AA (NFR17)

### Story 1.2: Google & Apple Sign-In

As a parent,
I want to sign in with my Google or Apple account,
So that I can access my AskIEP data on my phone with the same account I use on the web.

**Acceptance Criteria:**

**Given** an unauthenticated parent on the sign-in screen
**When** they tap "Sign in with Google"
**Then** the Google Sign-In flow opens, and on success the Firebase token is exchanged for an API JWT (FR1, FR5)
**And** the JWT is stored in platform Keychain/Keystore — never AsyncStorage (FR50, NFR8)
**And** the parent is redirected to the consent check (new user) or dashboard (returning user)

**Given** an unauthenticated parent on the sign-in screen
**When** they tap "Sign in with Apple"
**Then** the Apple Sign-In flow opens, and on success the Firebase token is exchanged for an API JWT (FR2, FR5)
**And** the JWT is stored in platform Keychain/Keystore (FR50, NFR8)

**Given** a signed-in parent
**When** they tap "Sign Out" in settings
**Then** the JWT is cleared from Keychain/Keystore, biometric credentials are cleared, and the parent returns to the sign-in screen (FR3)

**Given** any API communication
**Then** all requests use TLS 1.2+ (NFR9)

### Story 1.3: Biometric Re-Authentication

As a returning parent,
I want to unlock the app with Face ID or Touch ID,
So that I can get to my dashboard in under a second without typing credentials.

**Acceptance Criteria:**

**Given** a parent who has previously signed in and enabled biometrics
**When** they open the app
**Then** the biometric prompt appears (Face ID on iOS, fingerprint/face on Android) (FR4)
**And** on success, the parent reaches the dashboard in under 1 second (NFR3)

**Given** a device without biometric hardware or biometrics disabled
**When** the parent opens the app
**Then** the app falls back to the standard sign-in screen with Google/Apple options (NFR23)

**Given** biometric authentication fails 3 times
**When** the parent is prompted
**Then** the app falls back to full Google/Apple re-authentication

**Given** the parent's session has been inactive for 30+ minutes
**When** they return to the app
**Then** the session is expired and biometric or full re-auth is required (NFR12)

### Story 1.4: Session Management & Error Handling

As a parent,
I want the app to handle expired sessions and network errors gracefully,
So that I always know what's happening and never see cryptic error messages.

**Acceptance Criteria:**

**Given** the parent's JWT has expired
**When** any API request returns 401
**Then** the app detects the expired session and redirects to the sign-in screen with a "Session expired" message (FR6)

**Given** the device loses network connectivity
**When** any screen is active
**Then** a non-dismissable banner appears stating "No internet connection" with a retry button (FR48)
**And** all API-dependent actions show inline "Network unavailable" instead of loading spinners

**Given** any API request fails with a network error
**When** the error is displayed
**Then** a plain-language message is shown (e.g., "Could not reach server") with a "Try Again" button — no HTTP codes or stack traces (NFR25)

**Given** any error occurs
**Then** no child PII (names, diagnoses, IEP content) is logged to console, crash reporters, or analytics (NFR10)

---

## Epic 2: Onboarding, Dashboard & Child Management

First-time parent completes consent, manages children, and views a summary dashboard. Returning parents land on their dashboard with child data ready.

### Story 2.1: First-Time Consent Overlay

As a first-time parent,
I want to review and accept the Parent Consent & Data Release Agreement before using the app,
So that I understand how my child's data is handled and the app complies with FERPA/COPPA.

**Acceptance Criteria:**

**Given** a parent who has not yet accepted consent
**When** they complete sign-in
**Then** a full-screen blocking consent overlay appears — no app navigation is possible (FR11)
**And** the consent agreement is fully scrollable and readable (FR7)
**And** the consent text is navigable via VoiceOver and TalkBack (NFR18)

**Given** the parent taps "I Accept"
**When** the consent is submitted
**Then** the system records: user ID, timestamp, device info (model + OS), app version, and consent version (FR10, NFR13)
**And** the parent proceeds to the dashboard (FR8)

**Given** the parent taps "Decline"
**When** the action completes
**Then** the parent is immediately logged out and returned to sign-in (FR9)

### Story 2.2: Child Profile Management

As a parent,
I want to create, view, edit, and delete my children's profiles,
So that I can manage IEP data for each of my children separately.

**Acceptance Criteria:**

**Given** a parent on the child profiles screen
**When** they tap "Add Child"
**Then** a form appears to enter the child's basic information (name, date of birth, school, grade, disability type) (FR12)
**And** on submission, the profile is created via API and appears in the children list

**Given** a parent with one or more children
**When** they view the children list
**Then** all children are displayed with basic info (FR13)
**And** the first 20 items render within 1 second (NFR6)

**Given** a parent viewing a child's profile
**When** they tap "Edit"
**Then** they can modify any field and save changes (FR14)

**Given** a parent viewing a child's profile
**When** they tap "Delete" and confirm
**Then** the child profile is removed (FR15)

**Given** no child PII (names, diagnoses) is ever logged to console or analytics (NFR10)

### Story 2.3: Dashboard & Child Switcher

As a parent,
I want to see a summary dashboard for my selected child and quickly switch between children,
So that I can monitor my child's IEP status at a glance.

**Acceptance Criteria:**

**Given** a parent with at least one child
**When** they land on the dashboard
**Then** they see the selected child's summary: goal progress percentages, compliance service counts (met/missed/upcoming), and the 5 most recent activity entries (FR17, FR18)

**Given** a parent with multiple children
**When** they tap the child switcher
**Then** a picker displays all children and selecting one refreshes the dashboard (FR16)

**Given** a parent on the dashboard
**When** they tap any feature domain card (Documents, Goals, Behavior, Compliance, Contacts, AI Chat, Resources)
**Then** they navigate to that domain screen for the selected child (FR19)
**And** navigation completes in under 300ms (lazy-loaded screens up to 1s on first load) (NFR2)

**Given** all interactive elements on the dashboard
**Then** they support VoiceOver and TalkBack with meaningful labels (NFR14)

### Story 2.4: Empty States & First-Time User Experience

As a first-time parent with no children added yet,
I want to see helpful guidance instead of blank screens,
So that I know how to get started with the app.

**Acceptance Criteria:**

**Given** a parent who has just completed consent with no children
**When** they land on the dashboard
**Then** an empty state is displayed with a clear "Add Your First Child" call-to-action and brief guidance text (FR49)

**Given** a parent who has a child but no IEP documents uploaded
**When** they view the IEP documents screen
**Then** an empty state shows guidance on how to upload their first IEP (FR49)

**Given** any domain screen with no data
**When** the parent views it
**Then** an appropriate empty state with contextual guidance is displayed (FR49)

---

## Epic 3: IEP Document Analysis

Parent can upload an IEP document, watch AI analyze it with real-time streaming, review extracted data with confidence scores, and manage their IEP library.

### Story 3.1: NDJSON Streaming Utility

As a developer,
I want a shared NDJSON streaming utility (`lib/http-stream.ts`),
So that IEP analysis, Advocacy Lab, and Legal Support can all use real-time server streaming.

**Acceptance Criteria:**

**Given** a streaming API endpoint returning NDJSON
**When** the utility connects
**Then** it processes line-delimited JSON chunks and emits parsed objects via callback
**And** it maintains connection on cellular networks (NFR21)
**And** on stream interruption, it retries up to 3 times with exponential backoff (1s, 2s, 4s)
**And** after 3 failed retries, it shows a "Connection lost — tap to retry" message

**Given** the app returns from background during streaming
**When** the stream is broken
**Then** partial content received is preserved and a "Continue generation" button is shown (NFR26)

**Given** streaming content is active
**Then** screen readers announce new content progressively (NFR15)

### Story 3.2: IEP Document Upload

As a parent,
I want to upload my child's IEP document (PDF) from my phone,
So that the AI can analyze it and help me understand it.

**Acceptance Criteria:**

**Given** a parent on the IEP documents screen for a child
**When** they tap "Upload IEP"
**Then** the device document picker opens, filtered to PDF files up to 25MB (FR20, NFR22)

**Given** a parent selects a valid PDF
**When** the upload begins
**Then** streaming progress appears within 5 seconds ("Uploading... Extracting goals... Analyzing accommodations...") (FR21, NFR4)
**And** the upload buffer is cleared from device memory after API submission (NFR11)

**Given** a parent selects a file exceeding 25MB
**When** validation runs
**Then** a clear error message is shown: "File too large. Maximum size is 25MB."

### Story 3.3: IEP Extraction Review

As a parent,
I want to review what the AI extracted from my IEP document,
So that I can verify accuracy and understand goals, services, accommodations, and red flags.

**Acceptance Criteria:**

**Given** AI analysis of an IEP is complete
**When** the parent views the extraction results
**Then** they see: extracted goals, services, accommodations, and red flags — each with confidence scores (FR22)

**Given** the parent reviews an extracted item
**When** they disagree with the extraction
**Then** they can correct the data or mark it as inaccurate (FR23)

**Given** a parent accepts all extracted data
**When** they confirm
**Then** the data is saved and the IEP appears in their document library

### Story 3.4: IEP Document Library

As a parent,
I want to view all previously uploaded and analyzed IEP documents,
So that I can reference past IEPs and track changes over time.

**Acceptance Criteria:**

**Given** a parent with one or more analyzed IEPs
**When** they open the IEP documents screen
**Then** they see a chronological list of all IEP documents with upload date, child name, and analysis status (FR24)

**Given** a parent taps on a previous IEP
**When** the detail screen loads
**Then** they see the full extraction results (goals, services, accommodations, red flags) from that analysis

---

## Epic 4: Tracking & Compliance

Parent can track goals, log behaviors, monitor service compliance, and maintain a contact log with school personnel — the daily-use features for ongoing IEP management.

### Story 4.1: Goals & Progress Tracking

As a parent,
I want to view my child's IEP goals and track progress against each one,
So that I can monitor whether the school is meeting its commitments.

**Acceptance Criteria:**

**Given** a parent with a child who has analyzed IEP goals
**When** they open the Goals screen
**Then** they see all goals extracted from IEP documents with current progress status (FR25)
**And** the first 20 items render within 1 second (NFR6)

**Given** a parent viewing a specific goal
**When** they tap "Track Progress"
**Then** they can see a progress timeline and current status (FR26)

**Given** a parent tracking a goal
**When** they tap "Add Progress Entry"
**Then** they can add a dated entry with notes about observed progress (FR27)
**And** form data persists locally during entry to prevent loss from accidental navigation (NFR27)

### Story 4.2: Behavior ABC Logging

As a parent,
I want to log behavior incidents using the ABC format,
So that I can build a documented record of behavioral patterns for IEP meetings.

**Acceptance Criteria:**

**Given** a parent on the Behavior screen
**When** they tap "Log Incident"
**Then** a form appears with fields: date/time, antecedent (trigger), behavior (what happened), consequence (response) (FR28)
**And** form data persists locally during entry (NFR27)

**Given** a parent has logged behavior incidents
**When** they view the behavior history
**Then** incidents are displayed chronologically with ABC summary (FR29)
**And** the first 20 items render within 1 second (NFR6)

**Given** a parent viewing a behavior entry
**When** they tap edit or delete
**Then** they can modify any field or remove the entry with confirmation (FR30)

### Story 4.3: Compliance Monitoring

As a parent,
I want to see whether my child is receiving all required IEP services,
So that I can identify gaps and hold the school accountable.

**Acceptance Criteria:**

**Given** a parent with a child who has IEP services defined
**When** they open the Compliance screen
**Then** they see status for each required service: therapy sessions, accommodations, with met/missed/upcoming counts (FR31)

**Given** a service session is missed or overdue
**When** the compliance screen loads
**Then** the system flags it with a visual indicator (red/warning badge) (FR32)

**Given** a parent wants to see patterns
**When** they view compliance trends
**Then** they see a timeline or summary view of compliance over time (FR33)

### Story 4.4: Contact Log & Follow-Ups

As a parent,
I want to log communications with school personnel and set follow-up reminders,
So that I have a documented record of every interaction regarding my child's IEP.

**Acceptance Criteria:**

**Given** a parent on the Contact Log screen
**When** they tap "Log Contact"
**Then** a form appears with: date, contact person, type (call/email/meeting), subject, notes (FR34)
**And** form data persists locally during entry (NFR27)

**Given** a parent logging a contact
**When** they toggle "Set Follow-Up"
**Then** they can set a follow-up date and description (FR35)

**Given** a parent with logged contacts
**When** they view the contact history
**Then** entries are listed chronologically with type icon, contact name, and subject (FR36)
**And** the first 20 items render within 1 second (NFR6)

---

## Epic 5: AI Communication Hub

Parent can chat with AI agents (Advocacy Lab + Legal Support) with streaming responses, generate and manage advocacy letters, and review conversation history.

### Story 5.1: Advocacy Lab Chat

As a parent,
I want to chat with the Advocacy Lab AI agent and get real-time streaming responses,
So that I can prepare for IEP meetings with expert guidance on how to advocate for my child.

**Acceptance Criteria:**

**Given** a parent on the Advocacy Lab screen
**When** they type a message and tap send
**Then** the AI response streams in real-time using NDJSON (FR37)
**And** the first token appears within 3 seconds (NFR5)
**And** streaming content is announced progressively to screen readers (NFR15)

**Given** a parent has previous chat sessions
**When** they view conversation history
**Then** all past sessions are listed with date and preview (FR41)

**Given** the app returns from background during streaming
**When** the stream is interrupted
**Then** partial content is displayed with a "Continue generation" button (NFR26)

### Story 5.2: Legal Support Chat

As a parent,
I want to chat with the Legal Support AI agent with streaming responses,
So that I can understand my child's legal rights under IDEA and state special education law.

**Acceptance Criteria:**

**Given** a parent on the Legal Support screen
**When** they type a question and tap send
**Then** the AI response streams in real-time using NDJSON (FR38)
**And** the first token appears within 3 seconds (NFR5)

**Given** a parent has previous Legal Support sessions
**When** they view conversation history
**Then** all past sessions are listed with date and preview (FR41)

### Story 5.3: Letter Writer & AI Generation

As a parent,
I want to generate advocacy letters using AI with customizable parameters,
So that I can send professional, legally-informed communications to my child's school.

**Acceptance Criteria:**

**Given** a parent on the Letter Writer screen
**When** they select a letter type and fill in parameters (recipient, subject, tone, key points)
**Then** the AI generates a complete advocacy letter (FR39)

**Given** a parent has generated letters
**When** they view the letters list
**Then** all previously generated letters are displayed with date, type, and recipient (FR40)

**Given** a parent viewing a generated letter
**When** they tap on it
**Then** they can view the full text, copy it, or share it

---

## Epic 6: Resources, Settings & Launch Readiness

Parent can browse and bookmark educational resources, manage their profile and app settings, and the app meets all store submission requirements.

### Story 6.1: Resources & Bookmarks

As a parent,
I want to browse educational resources about IEP rights and processes and bookmark ones for later,
So that I can educate myself on special education topics at my own pace.

**Acceptance Criteria:**

**Given** a parent on the Resources screen
**When** it loads
**Then** educational resources are displayed organized by topic/category (FR42)

**Given** a parent viewing a resource
**When** they tap the bookmark icon
**Then** the resource is saved to their bookmarks for quick access later (FR43)

**Given** a parent on the bookmarks section
**When** they view their bookmarks
**Then** all bookmarked resources are listed for easy access

### Story 6.2: Settings & Profile Management

As a parent,
I want to manage my account profile, biometric settings, and view future notification preferences,
So that I can control my app experience and security settings.

**Acceptance Criteria:**

**Given** a parent on the Settings screen
**When** they tap "Profile"
**Then** they can view and edit their account information (name, email) (FR44)

**Given** a parent on the Settings screen
**When** they view notification preferences
**Then** toggles are visible but disabled with "Coming soon" labels (FR45)

**Given** a parent on the Settings screen
**When** they tap "Biometric Authentication"
**Then** they can enable or disable Face ID / Touch ID for app unlock (FR46)

**Given** a parent taps "Sign Out"
**When** they confirm
**Then** all credentials are cleared and they return to sign-in (FR3)

### Story 6.3: App Store Submission Preparation

As a developer,
I want to finalize all store compliance requirements,
So that the app can be submitted to the iOS App Store and Google Play Store.

**Acceptance Criteria:**

**Given** the app is feature-complete
**When** preparing for store submission
**Then** privacy policy URL, terms of service URL, and support contact (io@askiep.com) are configured
**And** iOS App Privacy nutrition labels accurately reflect data collection (child data)
**And** Android Data Safety section accurately reflects data handling
**And** age rating is set appropriately (apps for parents managing child data)
**And** app screenshots and descriptions are prepared for both stores
**And** the mandatory consent flow is verified as first-run experience
**And** crash rate is verified below 1% of sessions (NFR24)
**And** no PII leaks exist in logs, crash reports, or analytics (NFR10)
