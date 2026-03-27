---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - '_bmad-output/planning-artifacts/tech-architecture-spec.md'
  - 'docs/project-overview.md'
  - 'docs/index.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 2
  planningArtifacts: 1
classification:
  projectType: 'mobile_app'
  domain: 'edtech'
  complexity: 'medium'
  projectContext: 'brownfield'
---

# Product Requirements Document - AskIEP Mobile

**Author:** Muthuishere
**Date:** 2026-02-21

## Executive Summary

AskIEP Mobile is a React Native companion app (iOS + Android) to the existing AskIEP web platform, delivering the full suite of AI-powered IEP management tools to parents on their phones. The app targets a single user role — **Parent** — and shares the same Express/PostgreSQL backend API, Firebase authentication, and AI pipeline (Google Gemini) as the web application.

Parents navigating the US special education system face an asymmetric information problem: school districts produce complex IEP documents filled with legal jargon, compliance requirements, and education-specific terminology. AskIEP solves this by putting an AI-powered comprehension and advocacy tool in parents' pockets — enabling them to upload IEP documents, understand what they mean, identify red flags, and prepare to advocate effectively for their children, all from their phone.

The mobile app provides feature parity with the web: IEP document upload and AI analysis, goal progress tracking, behavior ABC logging, compliance monitoring, contact logging, AI-generated advocacy letters, conversational advocacy lab, legal support agent, and a resource library. All 12 feature domains share the same backend endpoints with zero API duplication.

### What Makes This Special

AskIEP Mobile is not a note-taking or data-entry tool — it's a **comprehension and advocacy platform in your pocket**. The core value is enabling parents to *understand* their child's IEP and *know what to listen for* in meetings. AI-powered document analysis surfaces risk scores, red flags, and plain-language explanations. The advocacy lab and legal support agent provide real-time guidance rooted in IDEA law and special education best practices.

The differentiator is accessibility at the point of need: the school parking lot before a meeting, the kitchen table reviewing a new IEP, the moment a parent needs to understand their rights. No laptop required.

## Project Classification

- **Project Type:** Cross-platform mobile app (React Native 0.72, iOS + Android)
- **Domain:** EdTech — IEP management with FERPA/COPPA considerations
- **Complexity:** Medium — regulated data and AI features, but leveraging an existing production API
- **Project Context:** Brownfield — companion to a shipping web platform with established backend

## Success Criteria

### User Success

- Parent uploads an IEP document from their phone and receives a clear, plain-language AI analysis with red flags and risk scores — *understanding happens without a laptop*
- Parent opens advocacy lab or legal support before a school meeting and walks in knowing what to ask and what to push back on
- Parent can do everything on mobile that they can on web — no feature gaps force them back to a browser
- First-time user completes sign-in (Google/Apple) and reaches dashboard in under 60 seconds

### Business Success

- Mobile app drives **new user acquisition** — parents who wouldn't have signed up via web discover AskIEP through app stores
- Growing monthly active user base on mobile, establishing the foundation for future monetization (payment integration) and marketplace features (live counselor)
- App store presence increases platform credibility and discoverability
- Mobile engagement complements web — users who access both platforms show higher retention

### Technical Success

- Feature parity with web across all 12 domains using the same backend API — zero API duplication
- App runs smoothly on iOS and Android with shared React Native codebase
- App store approval on both Apple App Store and Google Play
- Auth flow (Google + Apple Sign-In → Firebase → JWT) works reliably on both platforms
- NDJSON streaming (IEP analysis, advocacy chat, legal chat) performs well on mobile networks

### Measurable Outcomes

- App store listing live on iOS and Android
- All 12 feature domains functional and tested
- IEP upload + AI analysis completes successfully on mobile (25MB file upload over cellular)
- Sub-3s screen load times on mid-range devices

## Product Scope

### MVP — Minimum Viable Product

**In scope (Phases 1-3 from architecture spec):**
- Project scaffolding, NativeWind + Paper UI, providers, navigation shell
- Google + Apple Sign-In → Firebase → JWT auth flow
- All 12 feature domains: Dashboard, Child Profiles, IEP (upload + AI analysis + extraction review), Goals + Progress, Behavior ABC, Compliance, Contact Log, Letter Writer + AI generation, Advocacy Lab (chat with streaming), Legal Support (chat with streaming), Resources, Settings
- 25 screens total
- NDJSON streaming for AI features
- File upload via document picker
- Biometric re-auth (Touch ID / Face ID) for returning users
- App store submission (iOS + Android)

**Out of scope for MVP (Phase 4 — post-launch):**
- Push notifications (requires new API endpoints + FCM setup)
- Offline support + mutation queue
- Deep linking
- Payment integration
- Live counselor connection (future marketplace feature)

### Growth Features (Post-MVP)

- Push notifications for IEP review dates, follow-up reminders, goal progress nudges
- Deep linking from notifications and shared URLs
- Offline data access with background sync
- Payment integration (subscription/freemium model)

*See Project Scoping & Phased Development for detailed phased roadmap and risk analysis.*

### Vision (Future)

- Live counselor marketplace — connect parents with special education counselors in real-time
- Role expansion — advocate and teacher mobile access
- Camera-based IEP capture (photograph → OCR → analyze)
- Cross-device session continuity (start on phone, finish on web)

*See Project Scoping & Phased Development for expansion details.*

## User Journeys

### Journey 1: Sarah — The IEP Meeting Prep

**Who:** Sarah, mother of 8-year-old Ethan who has autism and a speech delay. She works full-time and has limited time to decode complex documents. She signed up for AskIEP last month via Google Sign-In.

**Opening Scene:** Sarah's phone buzzes — the school emailed a 30-page IEP document for Ethan's annual review meeting in 3 days. She's sitting on the couch at 9pm, laptop in the other room, kids finally asleep. She opens AskIEP on her phone — Face ID unlocks her session instantly and she's on her dashboard in under a second.

**Rising Action:** She taps "Analyze IEP," picks the PDF from her email downloads, selects Ethan's profile, and uploads. The app streams real-time progress — "Extracting goals... Analyzing accommodations... Checking compliance..." — for about 45 seconds. The extraction screen appears: 6 goals identified, 4 services, 2 red flags, confidence score 87%. She reviews each goal in plain language, sees a red flag: "Speech therapy minutes reduced from 120 to 90 per month with no documented justification." She taps into advocacy lab, types "The school wants to reduce my son's speech therapy — what should I ask?"

**Climax:** The AI responds with specific questions to ask at the meeting, references to IDEA procedural safeguards, and a suggestion to request the data supporting the reduction. Sarah screenshots the response.

**Resolution:** Sarah walks into the IEP meeting knowing exactly what changed, why it matters, and what to push back on. She's not overwhelmed — she's prepared.

**Capabilities Revealed:** Biometric re-auth (Face ID), IEP upload (document picker), NDJSON streaming analysis, extraction review with red flags, child profile selection (child switcher), advocacy lab chat, screenshot-friendly UI

---

### Journey 2: Marcus — The Ongoing Tracker

**Who:** Marcus, father of 10-year-old Jade who has ADHD and a learning disability in math. He's been using AskIEP on the web for 4 months and wants mobile access.

**Opening Scene:** Marcus downloads AskIEP from the Play Store during his commute. He taps "Sign in with Google" — same account as web. In 3 seconds he's on his dashboard, Jade's profile already there with all her goals, behavior logs, and compliance records synced.

**Rising Action:** During lunch, he checks Jade's math goal — progress is at 62%, on track. He got a call from the teacher about a meltdown during math class, so he opens Behavior ABC and logs it: antecedent (timed math test), behavior (left classroom), consequence (sent to counselor's office). He flips to Contact Log and records the teacher's call with a follow-up flag for next week. Then he notices compliance shows the school missed 3 OT sessions this month — he opens Letter Writer and generates an advocacy letter requesting make-up sessions.

**Climax:** Marcus has logged the incident, flagged the compliance gap, and drafted an advocacy letter — all during a 15-minute lunch break. No laptop, no waiting until evening.

**Resolution:** Marcus sends the letter to the school the next morning. The school schedules make-up OT sessions. Jade's tracking data builds a documented pattern he can reference at the next IEP meeting. Next time he opens the app, Touch ID gets him in instantly.

**Capabilities Revealed:** Google Sign-In (existing web user), biometric re-auth (Touch ID on subsequent opens), dashboard with synced data, goal progress viewing, behavior ABC logging (form with date/time/ABC fields), contact log entry with follow-up, compliance tracking, letter writer with AI generation, cross-platform data continuity

---

### Journey 3: Priya — The First-Timer

**Who:** Priya, mother of 6-year-old Anika. The school just suggested an evaluation for special education services. Priya immigrated to the US 5 years ago and has never heard of an IEP.

**Opening Scene:** Priya searches "IEP help for parents" on her phone. She finds AskIEP on the App Store, reads the description — "Understand your child's IEP" — and downloads it. She taps "Sign in with Apple," creates her account in one tap.

**Rising Action:** She lands on an empty dashboard — no children added yet. She taps "Add Child," enters Anika's basic info. Then she opens Legal Support and types: "The school wants to evaluate my daughter for special education. What does this mean? What are my rights?" The AI explains the evaluation process, parental consent requirements, timelines under IDEA, and what to expect. She asks follow-up questions: "Can I disagree with the evaluation?" and "What happens after the evaluation?"

**Climax:** For the first time, Priya understands the process. She's not confused or scared — she knows she has the right to consent, the right to an independent evaluation, and a 60-day timeline. She opens Resources and bookmarks two articles on IDEA parental rights.

**Resolution:** When the school sends the evaluation consent form, Priya signs it confidently. After the evaluation, she uploads the resulting IEP document to AskIEP for analysis. She's no longer navigating blind.

**Capabilities Revealed:** App Store discovery and onboarding, Apple Sign-In (new user), empty state UX (no children yet), child profile creation, legal support chat (AI agent), resource browsing, first-time user flow that doesn't overwhelm

---

### Journey Requirements Summary

| Capability | Sarah | Marcus | Priya |
|---|---|---|---|
| First-time Sign-In (Google/Apple) | ✓ | ✓ | ✓ |
| Biometric Re-auth (returning user) | ✓ | ✓ | |
| Dashboard | ✓ | ✓ | ✓ |
| Child Profile CRUD | ✓ | ✓ | ✓ |
| Child Switcher | ✓ | | |
| IEP Upload + AI Analysis (streaming) | ✓ | | |
| Extraction Review (red flags, goals) | ✓ | | |
| Goal Progress Tracking | | ✓ | |
| Behavior ABC Logging | | ✓ | |
| Compliance Monitoring | | ✓ | |
| Contact Log + Follow-ups | | ✓ | |
| Letter Writer + AI Generation | | ✓ | |
| Advocacy Lab Chat | ✓ | | |
| Legal Support Chat | | | ✓ |
| Resources | | | ✓ |
| Empty State / First-Time UX | | | ✓ |
| Cross-Platform Data Sync | | ✓ | |

All 12 feature domains are covered across the three journeys. Every MVP capability maps to at least one real user scenario.

## Domain-Specific Requirements

Domain: **EdTech** | Complexity: **Medium** | Data subjects: **Minors (children with disabilities)**

### Compliance & Regulatory

- **FERPA:** Student education records (IEP documents, goals, services, evaluations) are federally protected. Mobile app must not persist unencrypted student data on-device beyond token/session storage. All IEP data remains server-side.
- **COPPA:** App collects data *about* children under 13 (child profiles, disabilities, diagnoses). Parent is the user providing consent. Privacy policy must clearly disclose data collection about minors.
- **App Store Privacy Disclosures:** Both iOS (App Privacy nutrition labels) and Android (Data Safety section) require accurate disclosure of what data is collected, stored, and transmitted — must reflect child data handling specifically.

### First-Time Consent Flow

The web app implements a **mandatory consent overlay** (reference: `apps/ui/src/app/components/ConsentOverlay.tsx`) that blocks all access until accepted. The mobile app must replicate this flow identically:

- **Trigger:** First login — after Firebase auth succeeds but before accessing dashboard. The API tracks consent status per user; if `user.consentGiven` is false, show the consent screen.
- **Content:** Parent Consent & Data Release Agreement (versioned, currently v1.0) covering:
  - Parent/guardian acknowledgment of legal authority
  - Scope of data collected (IEP documents, evaluations, progress reports, therapy plans)
  - Data storage & security (GCP, encryption at rest/in transit, RBAC)
  - Privacy & compliance alignment (FERPA, SOC 2, ISO 27001, GDPR-ready)
  - Parent rights (access, download, correct, delete, withdraw consent)
  - Audit trail (user ID, timestamp, IP, app version, consent version)
- **Actions:**
  - **Accept & Continue** → calls `submitConsent({ consentType: "parent_guardian", consentText, consentVersion })` API → navigates to dashboard
  - **Decline** → logs out the user immediately
- **Mobile adaptation:** Full-screen scrollable view (not a modal overlay) with clear Accept/Decline buttons. Must be scrollable for the full agreement text on smaller screens.
- **Audit:** System records consent with user identifier, timestamp, device info, app version, and consent version — same as web.

### Technical Constraints

- **Secure Storage:** Use platform-secure storage (iOS Keychain via `react-native-keychain` / Android Keystore) for JWT tokens and biometric credentials — **not** plain AsyncStorage
- **No Local IEP File Caching:** PDF/document content stays server-side. Do not download and persist IEP files to device storage. Temporary upload buffers must be cleared after API submission.
- **TLS Required:** All API communication over HTTPS (already enforced by API infrastructure)
- **Session Timeout:** Auto-logout after extended inactivity — align with web behavior. Biometric re-auth on return.
- **Minimal PII in Logs:** Do not log child names, diagnoses, or IEP content to console or crash reporters. Sanitize before any telemetry.

### App Store Requirements

- **Privacy Policy URL:** Required for both stores — must specifically address collection of data about minors with disabilities
- **Age Rating:** 4+ (iOS) / Everyone (Android) — app is a tool for parents, not used by children
- **App Review Notes:** Prepare reviewer notes explaining: (1) users are parents/guardians, (2) data subjects are minors, (3) parental consent is inherent in the user model, (4) mandatory consent flow enforced on first login
- **Data Safety Responses:** Accurately declare: personal info collected (parent email, name), child info collected (name, age, disability info, IEP records), data encrypted in transit, data not shared with third parties, data deletion available

### Risk Mitigations

| Risk | Mitigation |
|---|---|
| Sensitive child data leaked from device | Keychain/Keystore for tokens; no local IEP caching; clear upload buffers |
| App Store rejection for child data handling | Clear privacy policy; accurate data safety disclosures; reviewer notes explaining parent-as-user model; mandatory consent flow |
| Consent not collected before data access | Replicate web's blocking consent overlay — no navigation possible until accepted |
| Accessibility gaps | Leverage Paper's built-in a11y props; test consent flow and AI chat with VoiceOver (iOS) and TalkBack (Android) |
| PII in crash reports | Sanitize all telemetry; never log child names/diagnoses; strip IEP content from error payloads |

## Mobile App Specific Requirements

### Platform Requirements

- **Framework:** React Native 0.72 (cross-platform — single codebase for iOS and Android)
- **Minimum OS:** iOS 15+ / Android API 28+ (Android 9)
- **React:** 18.2 with functional components and hooks
- **TypeScript:** 4.8 with strict mode
- **Navigation:** React Navigation 6 (stack + bottom tabs)
- **UI:** NativeWind (Tailwind for RN, requires tailwindcss@3) + React Native Paper (Material Design 3)
- **State:** TanStack React Query 5 for server state, React Context for local state
- **Auth:** Firebase Auth (Google + Apple Sign-In) → JWT exchange with API

### Device Permissions

| Permission | Purpose | MVP? |
|---|---|---|
| Internet | API communication | ✅ |
| File/Photo Library access | IEP document upload via document picker | ✅ |
| Biometrics (Face ID / Touch ID) | Quick re-auth for returning users | ✅ |
| Network state | Online/offline detection for graceful error handling | ✅ |
| Camera | Future: photograph IEP → OCR → analyze | ❌ Post-MVP |
| Push notifications | Future: reminders, alerts | ❌ Post-MVP |

**iOS-specific:** `NSFaceIDUsageDescription` in Info.plist for Face ID. `NSPhotoLibraryUsageDescription` for document picker fallback.

**Android-specific:** `USE_BIOMETRIC` and `USE_FINGERPRINT` permissions in AndroidManifest. Storage permissions for document picker on older Android versions.

### Offline Mode (Post-MVP)

- MVP: **Online-only.** All data fetched from API on demand. TanStack Query provides automatic caching for the session but no persistence across app restarts.
- Graceful degradation: Use `@react-native-community/netinfo` to detect offline state and show clear "No connection" messaging instead of cryptic errors.
- Post-MVP (Phase 4): AsyncStorage-backed query persistence, background sync queue for mutations.

### Push Notification Strategy (Post-MVP)

- MVP: **No push notifications.** Users check the app proactively.
- Post-MVP: Firebase Cloud Messaging (FCM) for both platforms. Requires 4 new API endpoints (device registration, preferences). Notifications for: IEP analysis complete, compliance deadline reminders, meeting prep reminders.

### Store Compliance

*Detailed privacy disclosures, age ratings, and App Review notes are documented in Domain-Specific Requirements > App Store Requirements above.*

- **Both stores:** Privacy policy URL, terms of service URL, support contact (io@askiep.com), mandatory consent flow on first login
- **iOS distribution:** TestFlight for beta
- **Android distribution:** Internal testing track for beta; target current Google Play API level requirements

### Implementation Considerations

- **Lazy Loading (Mandatory):** All feature domain screens must be lazy-loaded using React Navigation's lazy prop and `React.lazy()`. Only the auth flow, dashboard, and navigation shell load eagerly. This is critical for startup performance and bundle efficiency given the large dependency set (Paper + NativeWind + Firebase + document picker + biometrics).
- **NDJSON Streaming:** 3 features use server-sent streaming (IEP analysis, Advocacy Lab, Legal Support). RN 0.72+ supports `ReadableStream` — needs custom `lib/http-stream.ts` utility.
- **AsyncStorage vs Keychain:** Tokens and biometric credentials go in Keychain/Keystore (encrypted). Only non-sensitive preferences (theme, last child selected) in AsyncStorage.
- **Deep linking:** Post-MVP. No universal links or app links in Phase 1-3.
- **Bundle size:** Monitor RN bundle size. Lazy loading all domain screens mitigates the impact of the large dependency tree. Consider per-screen code splitting if bundle exceeds 15MB.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Feature-parity MVP — replicate the complete web experience on mobile to capture the app store distribution channel. This isn't a "test the idea" MVP — the web app already validates the product. Mobile MVP validates that *parents will use these features on their phones*.

**Resource Requirements:** 1 React Native developer (full-stack capable), leveraging existing API (no backend changes for MVP). Complexity: medium — 12 domain screens + auth + streaming, but no novel API work.

### MVP Feature Set (Phase 1-3)

**Core User Journeys Supported:** All three — Sarah (IEP analysis), Marcus (ongoing tracking), Priya (first-timer learning)

**Must-Have Capabilities:**

| # | Capability | Phase | Justification |
|---|---|---|---|
| 1 | Project scaffolding, NativeWind + Paper UI, navigation shell | 1 | Foundation — nothing works without this |
| 2 | Google + Apple Sign-In → Firebase → JWT | 1 | No app without auth |
| 3 | Biometric re-auth (Face ID / Touch ID) | 1 | User requested; critical for mobile UX |
| 4 | First-time consent overlay (blocking) | 1 | Legal requirement — must match web |
| 5 | Dashboard | 1 | Landing screen for all journeys |
| 6 | Child profiles + child switcher | 1 | Required by Sarah, Marcus journeys |
| 7 | IEP upload + AI analysis (NDJSON streaming) | 2 | Core value prop — Sarah's journey |
| 8 | IEP extraction review (goals, red flags) | 2 | Completes the analysis flow |
| 9 | Goals + Progress tracking | 2 | Marcus's daily use case |
| 10 | Behavior ABC logging | 2 | Marcus — quick incident capture |
| 11 | Compliance monitoring | 2 | Marcus — flags missed services |
| 12 | Contact log + follow-ups | 2 | Marcus — records interactions |
| 13 | Advocacy Lab chat (streaming) | 3 | Sarah — meeting prep |
| 14 | Legal Support chat (streaming) | 3 | Priya — understanding rights |
| 15 | Letter Writer + AI generation | 3 | Marcus — advocacy letters |
| 16 | Resources browsing | 3 | Priya — self-education |
| 17 | Settings / profile management | 3 | Standard app requirement |
| 18 | Lazy loading across all domain screens | 1 | Performance — mandatory |

### Post-MVP Features

**Phase 4 (Growth):**
- Push notifications (FCM) — requires 4 new API endpoints + device_tokens table
- Offline data access with background sync (AsyncStorage-backed query persistence)
- Payment integration (subscription/freemium model)
- Deep linking (universal links / app links)

**Phase 5 (Vision):**
- Live counselor marketplace — real-time connection with special education counselors
- Role expansion — advocate and teacher mobile access
- Camera-based IEP capture (photograph → OCR → analyze)
- Cross-device session continuity (start on phone, finish on web)

### Risk Mitigation Strategy

| Risk Category | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Technical | NDJSON streaming unreliable on RN 0.72 | Medium | High | Build `http-stream.ts` early in Phase 2; if ReadableStream fails, fall back to polling with SSE |
| Technical | Bundle size exceeds acceptable limits | Medium | Medium | Mandatory lazy loading; monitor with `react-native-bundle-visualizer`; tree-shake unused Paper components |
| Technical | Biometric integration complexity across devices | Low | Medium | `react-native-biometrics` abstracts platform differences; test on 3+ physical devices |
| Market | Parents don't switch from web to mobile | Medium | High | App store presence is the real play — new users discover via store, not migration. Track new-vs-existing user ratio |
| Market | App Store rejection for child data | Low | High | Pre-built consent flow, accurate privacy disclosures, reviewer notes prepared |
| Resource | Single developer bottleneck | Medium | High | Phased approach (3 phases) allows incremental delivery; Phase 1 alone is a shippable app (auth + dashboard + profiles) |
| Resource | Scope creep beyond 12 domains | Medium | Medium | PRD locks MVP scope; new features go to Phase 4+ backlog |

## Functional Requirements

### Authentication & Identity

- **FR1:** Parent can sign in using Google Sign-In
- **FR2:** Parent can sign in using Apple Sign-In
- **FR3:** Parent can sign out of the application
- **FR4:** Returning parent can unlock the app using biometric authentication (Face ID / Touch ID)
- **FR5:** System can exchange Firebase authentication token for API JWT
- **FR6:** System can detect expired sessions and redirect to sign-in

### Consent & Onboarding

- **FR7:** First-time parent can view the full Parent Consent & Data Release Agreement
- **FR8:** First-time parent can accept the consent agreement to proceed to the app
- **FR9:** First-time parent can decline the consent agreement, which logs them out
- **FR10:** System records consent with user identifier, timestamp, device info, app version, and consent version
- **FR11:** System blocks all app navigation until consent is accepted

### Child Profile Management

- **FR12:** Parent can create a child profile with basic information
- **FR13:** Parent can view a list of their children
- **FR14:** Parent can edit a child's profile
- **FR15:** Parent can delete a child's profile
- **FR16:** Parent can switch between children using a child switcher

### Dashboard

- **FR17:** Parent can view a summary dashboard for the selected child
- **FR18:** Dashboard displays goal progress percentages, compliance service counts (met/missed/upcoming), and the 5 most recent activity entries for the selected child
- **FR19:** Parent can navigate to any feature domain from the dashboard

### IEP Document Management

- **FR20:** Parent can upload an IEP document (PDF) from device storage
- **FR21:** System can analyze an uploaded IEP document using AI with real-time streaming progress
- **FR22:** Parent can review extracted IEP data (goals, services, accommodations, red flags) with confidence scores
- **FR23:** Parent can accept or correct extracted IEP data
- **FR24:** Parent can view previously uploaded and analyzed IEP documents

### Goals & Progress

- **FR25:** Parent can view all goals extracted from IEP documents for a child
- **FR26:** Parent can track progress against each goal
- **FR27:** Parent can add progress entries with notes

### Behavior Tracking

- **FR28:** Parent can log a behavior incident with antecedent, behavior, and consequence (ABC format)
- **FR29:** Parent can view a history of behavior incidents for a child
- **FR30:** Parent can edit or delete a behavior entry

### Compliance Monitoring

- **FR31:** Parent can view compliance status for required services (therapy sessions, accommodations)
- **FR32:** System can flag missed or overdue services
- **FR33:** Parent can view compliance trends over time

### Contact Log

- **FR34:** Parent can log a contact with school personnel (calls, emails, meetings)
- **FR35:** Parent can set follow-up reminders on contact entries
- **FR36:** Parent can view contact history for a child

### AI-Powered Communication

- **FR37:** Parent can chat with the Advocacy Lab AI agent with real-time streaming responses
- **FR38:** Parent can chat with the Legal Support AI agent with real-time streaming responses
- **FR39:** Parent can generate advocacy letters using AI with customizable parameters
- **FR40:** Parent can view and manage previously generated letters
- **FR41:** Parent can view conversation history for AI chat sessions

### Resources & Education

- **FR42:** Parent can browse educational resources about IEP rights and processes
- **FR43:** Parent can bookmark resources for later reference

### Settings & Profile

- **FR44:** Parent can view and edit their account profile
- **FR45:** Parent can view notification preference toggles in Settings; toggles are visible but disabled with "Coming soon" labels until push notifications are implemented in Growth phase
- **FR46:** Parent can manage biometric authentication settings (enable/disable)

### Cross-Cutting System Capabilities

- **FR47:** System lazy-loads all feature domain screens for startup performance
- **FR48:** System detects network loss and displays a non-dismissable banner stating "No internet connection" with a retry button; all API-dependent actions show inline "Network unavailable" instead of loading spinners
- **FR49:** System displays empty states with guidance for first-time users (no children, no IEPs)
- **FR50:** System supports secure token storage using platform Keychain/Keystore

## Non-Functional Requirements

### Performance

- **NFR1:** App cold start to interactive dashboard in under 3 seconds on mid-range devices (iPhone 12 / Pixel 6 equivalent)
- **NFR2:** Screen-to-screen navigation completes in under 300ms (lazy-loaded screens may take up to 1 second on first load)
- **NFR3:** Biometric re-auth to dashboard in under 1 second
- **NFR4:** IEP document upload begins streaming progress within 5 seconds of submission
- **NFR5:** AI chat messages begin streaming first token within 3 seconds
- **NFR6:** List screens (goals, behaviors, contacts) render first 20 items within 1 second
- **NFR7:** App JS bundle size stays under 15MB (lazy loading required for all domain screens)

### Security

- **NFR8:** JWT tokens and biometric credentials stored exclusively in platform Keychain (iOS) / Keystore (Android) — never in AsyncStorage
- **NFR9:** All API communication over TLS 1.2+
- **NFR10:** No child PII (names, diagnoses, IEP content) logged to console, crash reporters, or analytics
- **NFR11:** IEP document upload buffers cleared from device memory after API submission
- **NFR12:** Session auto-expires after 30 minutes of inactivity; requires biometric or full re-auth
- **NFR13:** Consent record includes user ID, timestamp, device info, app version, and consent version for audit trail

### Accessibility

- **NFR14:** All interactive elements support VoiceOver (iOS) and TalkBack (Android) with meaningful labels
- **NFR15:** AI chat streaming content is announced progressively to screen readers
- **NFR16:** Minimum touch target size of 44x44 points (iOS) / 48x48dp (Android) per platform guidelines
- **NFR17:** Color contrast ratios meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
- **NFR18:** Consent agreement is fully navigable and readable via screen reader

### Integration

- **NFR19:** App authenticates via Firebase Auth SDK and exchanges token with existing API — no custom auth endpoints needed
- **NFR20:** All 90+ existing REST API endpoints consumed without modification
- **NFR21:** NDJSON streaming maintains connection on cellular networks; on stream interruption, automatically retries up to 3 times with exponential backoff (1s, 2s, 4s) before showing a "Connection lost — tap to retry" message
- **NFR22:** Document picker supports PDF files up to 25MB matching API upload limits
- **NFR23:** Biometric integration gracefully degrades to password/PIN when biometric hardware is unavailable

### Reliability

- **NFR24:** App crash rate below 1% of sessions (measured via crash reporting)
- **NFR25:** Network errors display a plain-language message describing the issue (e.g., "Could not reach server", "Request timed out") with a "Try Again" button — no HTTP status codes or stack traces shown to user
- **NFR26:** When app returns from background during an AI streaming response, the app detects the broken stream and displays the partial content received with a "Continue generation" button to restart from the last chunk
- **NFR27:** Form data (behavior logs, contact entries) persists locally during entry to prevent data loss from accidental navigation
