# AskIEP Platform — Guided Feature Tour

> A complete walkthrough of every feature organized by user role, with step-by-step examples.

---

## Table of Contents

1. [Public Pages (No Login Required)](#1-public-pages-no-login-required)
2. [Parent Role](#2-parent-role)
3. [Advocate Role](#3-advocate-role)
4. [Teacher/Therapist Role](#4-teachertherapist-role)
5. [Counselor Role](#5-counselor-role)
6. [Admin Role](#6-admin-role)
7. [Cross-Role Features](#7-cross-role-features)

---

## 1. Public Pages (No Login Required)

### Landing Page (`/`)
The homepage introduces AskIEP to prospective users.

**What you'll see:**
- Hero section with tagline and call-to-action buttons
- Features grid showcasing IEP Analyzer, Goal Tracking, Letter Writer, Advocacy Lab, Compliance Tracker, and Expert Consultations
- Vision & Mission statements
- About section explaining who AskIEP serves
- Contact form for inquiries

**Example flow:**
1. Visit `dev.askiep.com`
2. Scroll through the feature highlights
3. Click "Get Started" → redirects to `/register`
4. Or click "View Plans" → redirects to `/plans`

---

### Plans Page (`/plans`)
Public subscription tier comparison — viewable without logging in.

**What you'll see:**
- **Informed Parent** — Free tier: IEP upload & analysis, goal tracking, basic letter templates
- **Prepared Parent** — ~~$14.99/mo~~ **$9.99/mo** (Early Bird): AI advocacy tools, compliance tracking, contact log, unlimited letters
- **Protected Parent** — ~~$49.99/mo~~ **$29.99/mo** (Early Bird): Everything in Prepared + expert consultations, legal support, priority AI, additional expert calls at $49.99 each

**Example flow:**
1. Visit `/plans`
2. Compare tier features side-by-side
3. See the July 4th promotional banner: "1 month free + 1 free expert consultation"
4. Click "Get Started" on any plan → redirects to `/register`

---

### Login Page (`/login`)
Firebase-powered authentication.

**Example flow:**
1. Enter email and password, or use Google Sign-In
2. New users see a "Create an account" link at the bottom → `/register`
3. After login, parents without an IEP are redirected to the IEP Analyzer as onboarding

---

### Registration Page (`/register`)
Self-service parent registration with auto-approval.

**Example flow:**
1. Enter display name, email, password
2. Select role (Parent is default)
3. Submit → account is created and auto-approved (no admin gate)
4. Redirect to `/iep/analyse` to upload your first IEP document

---

## 2. Parent Role

Parents are the primary users. They have the broadest feature set for managing their child's IEP.

### Sidebar Navigation
| Icon | Page | Description |
|------|------|-------------|
| 📊 | Dashboard | Overview of child, goals, recent activity |
| 👤 | Child Profile | Child's information, school, contacts |
| 🔍 | IEP Analyzer | Upload & analyze IEP documents with AI |
| 📄 | IEP Documents | List of all uploaded IEPs |
| 🎯 | Goal Progress | Track IEP goal progress vs. expected |
| 💬 | Contact Log | Record communications with school |
| ✉️ | Letter Writer | AI-generated letters to school district |
| ⚖️ | Advocacy Lab | AI-powered advocacy scenario practice |
| ✅ | Compliance | Track school's IDEA compliance |
| ⚖️ | Legal Support | Legal rights reference & guidance |
| 📚 | Resources | Educational resources library |
| 👨‍⚕️ | Expert Consultation | Book 1-on-1 expert sessions |
| 💳 | Billing | Manage subscription & payments |
| ⚙️ | Settings | Account settings, language toggle |

---

### Feature Deep Dives

#### A. IEP Analyzer (`/iep/analyse`)
Upload your child's IEP document (PDF) and get AI-powered analysis.

**Example walkthrough:**
1. Click "Upload IEP" and select a PDF file
2. The system extracts text using OCR/parsing
3. **Extraction Review Step**: Review extracted sections — Goals, Services, Accommodations, Present Levels
4. AI identifies the child's school name, district, address, phone, and country
5. A child profile is **auto-created** with extracted information
6. Goals are automatically populated in Goal Progress
7. Services and accommodations are saved for reference

**Key details:**
- Uses Google Gemini AI with 32,768 max tokens (handles large multi-goal IEPs)
- Extracts: goals, services, accommodations, present levels, school info, dates
- Auto-populates child profile fields (school, district, address, phone)

---

#### B. Goal Progress (`/goal-progress`)
Track each IEP goal's actual progress against expected progress.

**Example walkthrough:**
1. After IEP upload, goals appear automatically
2. Each goal shows:
   - **Actual progress** (entered by you or teacher)
   - **Expected progress** (calculated from IEP dates: `(today - start) / (end - start)`)
   - Visual progress bar comparing both
3. Filter goals by category (Academic, Behavioral, Social, etc.)
4. Click a goal to edit progress notes or update percentage
5. If no IEP is uploaded yet, you'll see a prompt to upload one

**Example:**
> Goal: "Student will read 50 words per minute by end of year"
> IEP period: Sep 2025 – Jun 2026 (10 months)
> Current date: Mar 2026 → Expected: ~60%
> Actual: 45% → Visual shows actual trailing behind expected

---

#### C. Child Profile (`/child-profile`)
Manage your child's information, auto-populated from IEP analysis.

**Example walkthrough:**
1. View child's name, date of birth, grade level
2. See auto-populated fields: school name, district, address, phone, country
3. Edit any field manually
4. Add additional children via "Add Child" button

---

#### D. Letter Writer (`/letter-writer`)
AI-powered letter generation for school communications.

**Example walkthrough:**
1. Click "New Letter"
2. Select letter type: IEP Meeting Request, Service Dispute, Progress Report Request, etc.
3. AI pre-fills your child's name, school, district (from child profile)
4. Customize the letter content
5. Download as PDF or copy to clipboard
6. View history of all generated letters

**Example:**
> Type: "Request for IEP Meeting"
> Generated letter includes: your child's name, school name, specific concerns from the IEP analysis, requested meeting dates

---

#### E. Advocacy Lab (`/advocacy-lab`)
Practice advocacy scenarios with AI-powered role-play.

**Example walkthrough:**
1. Select a scenario: "Disagreement about placement", "Requesting ESY", "Service reduction pushback"
2. AI plays the role of the school administrator
3. Practice your responses with real-time feedback
4. Get suggested talking points enriched with your child's actual IEP data
5. Save session notes for future reference

---

#### F. Contact Log (`/contact-log`)
Record all communications with school staff.

**Example walkthrough:**
1. Click "New Entry"
2. Fill in: date, contact person, method (email/phone/in-person), subject, notes
3. Attach relevant documents
4. View chronological history of all contacts
5. Use as evidence trail for compliance tracking

---

#### G. Compliance Tracker (`/compliance`)
Monitor whether the school is meeting IDEA requirements.

**Example walkthrough:**
1. View compliance checklist items
2. Mark items as: Compliant, Non-Compliant, Pending
3. Add evidence notes and dates
4. Track deadlines for IEP reviews, evaluations, and responses
5. Generate compliance summary reports

---

#### H. Expert Consultation (`/expert-consultation`)
Book 1-on-1 sessions with special education experts.

**Example walkthrough:**
1. Browse available consultation slots
2. Slots show scarcity indicators: "Only 2 left!" for popular times
3. Select a date and time
4. Confirm booking → receive a calendar invite via email
5. After booking, see meeting details with Google Meet join link
6. Available on Protected Parent plan; additional calls at $49.99 each

**Key details:**
- Auto-generated time slots with realistic availability windows
- Calendar invites sent as ICS attachments from noreply@askiep.com
- Rebooking supported if a previous appointment was cancelled

---

#### I. Billing (`/billing`)
Manage your subscription and payment.

**Example walkthrough:**
1. View your current plan tier
2. Compare all three tiers with pricing
3. See early bird pricing: strikethrough regular price, discounted price with badge
4. July 4th banner shows promotional benefits
5. Click "Upgrade" → `/billing/checkout/:planSlug`
6. Enter payment details via Stripe Elements
7. Stripe webhook confirms payment and updates your subscription

---

#### J. Settings (`/settings`)
Account preferences and app configuration.

**What you can do:**
- Update display name and email
- Toggle language: English ↔ Spanish (via topbar toggle)
- View subscription status
- Manage notification preferences

---

## 3. Advocate Role

Advocates support parents in navigating the IEP process. They have a subset of parent features focused on monitoring and compliance.

### Sidebar Navigation
| Page | Description |
|------|-------------|
| Dashboard | Overview of assigned cases |
| Child Profile | View child information (read access) |
| Goal Progress | Monitor goal tracking |
| Contact Log | Review communication history |
| Compliance | Track school compliance |
| Legal Support | Access legal resources |
| Advocacy Lab | Practice advocacy scenarios |
| Resources | Educational materials |
| Settings | Account settings |

**Example flow:**
1. Log in as Advocate
2. Dashboard shows assigned families
3. Review a child's IEP goals and progress
4. Check compliance status
5. Use Advocacy Lab to prepare for an upcoming IEP meeting
6. Reference Legal Support for IDEA procedural safeguards

---

## 4. Teacher/Therapist Role

Teachers and therapists have a focused view for tracking student progress and behavior.

### Sidebar Navigation
| Page | Description |
|------|-------------|
| Dashboard | Student overview |
| Goal Progress | Update goal progress data |
| Contact Log | Log parent/team communications |
| Settings | Account settings |

**Example flow:**
1. Log in as Teacher/Therapist
2. Select a student from the dashboard
3. Navigate to Goal Progress
4. Update progress percentage on a specific goal (e.g., "Reading fluency: 65%")
5. Add progress notes
6. Log a parent communication in Contact Log

---

## 5. Counselor Role

Counselors have a completely separate interface for managing their availability, appointments, and services.

### Sidebar Navigation
| Page | Description |
|------|-------------|
| Dashboard | Counselor-specific overview |
| Appointments | View and manage bookings |
| Availability | Set available time slots |
| My Services | Define service offerings |
| Settings (Profile) | Counselor profile settings |
| Resources | Educational materials |

**Example flow:**

#### Setting Up Availability (`/counselor/availability`)
1. Log in as Counselor
2. Navigate to Availability
3. Set available hours for each day of the week
4. Define appointment duration (30 min, 60 min)
5. Block out vacation/unavailable dates

#### Managing Appointments (`/counselor/appointments`)
1. View upcoming booked appointments
2. See parent name, child info, and consultation topic
3. Mark appointments as completed or cancelled
4. View appointment history

#### Managing Services (`/counselor/services`)
1. Define your specialties and service types
2. Set pricing for different consultation types
3. Add service descriptions

#### Payment Integration
- Counselors receive payments through the integrated payment gateway
- Stripe handles payment processing
- Payment confirmation sent to both counselor and parent

---

## 6. Admin Role

Admins have full platform access plus administrative tools.

### Sidebar Navigation (all Parent features PLUS)
| Page | Description |
|------|-------------|
| User Management | Create, edit, import users |
| Subscription Plans | Manage plan tiers and pricing |
| All parent features | Full access to every parent feature |

---

### Admin-Specific Features

#### A. User Management (`/admin/users`)
**Example walkthrough:**
1. View all registered users in a searchable table
2. Filter by role (Parent, Advocate, Teacher, Counselor, Admin)
3. Click a user to edit their profile
4. Change user roles, enable/disable accounts
5. View registration requests at `/admin/users/requests`
6. Bulk import users via CSV at `/admin/users/import`

#### B. Subscription Plans Management (`/admin/plans`)
**Example walkthrough:**
1. View all subscription tiers as draggable cards
2. Drag-and-drop to reorder plan display order
3. Edit plan details: name, price, features, Stripe product ID
4. Toggle plans as active/inactive
5. Set early bird pricing and promotional messaging
6. Changes reflect immediately on the public Plans page and Billing page

**Example:**
> Drag "Protected Parent" above "Prepared Parent" to reorder
> Edit "Prepared Parent" → change price from $9.99 to $12.99
> Toggle early bird badge on/off
> Add a new feature bullet: "Priority email support"

---

## 7. Cross-Role Features

### Language Toggle (All Roles)
- Click the language toggle in the top navigation bar
- Switch between **English** and **Spanish** instantly
- All navigation labels, common UI text, page headings, and form labels translate
- ~440 translation keys covering the full UI

**Example:**
> Toggle to Spanish → "Dashboard" becomes "Tablero", "Goal Progress" becomes "Progreso de Metas", "Settings" becomes "Configuracion"

---

### Resources Page (All Roles)
Available to every role. Provides curated educational materials about special education, IDEA, IEP processes, and parent rights.

---

### Responsive Design
- Full desktop layout with collapsible sidebar
- Mobile-friendly views for all pages
- Touch-friendly buttons and navigation

---

## Quick Reference: Role → Feature Matrix

| Feature | Parent | Advocate | Teacher | Counselor | Admin |
|---------|--------|----------|---------|-----------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ (own) | ✅ |
| Child Profile | ✅ | ✅ | — | — | ✅ |
| IEP Analyzer | ✅ | — | — | — | ✅ |
| IEP Documents | ✅ | — | — | — | ✅ |
| Goal Progress | ✅ | ✅ | ✅ | — | ✅ |
| Contact Log | ✅ | ✅ | ✅ | — | ✅ |
| Letter Writer | ✅ | — | — | — | ✅ |
| Advocacy Lab | ✅ | ✅ | — | — | ✅ |
| Compliance | ✅ | ✅ | — | — | ✅ |
| Legal Support | ✅ | ✅ | — | — | ✅ |
| Resources | ✅ | ✅ | ✅ | ✅ | ✅ |
| Expert Consultation | ✅ | — | — | — | ✅ |
| Counselor Booking | ✅ | — | — | — | ✅ |
| Billing | ✅ | — | — | — | ✅ |
| Counselor Dashboard | — | — | — | ✅ | — |
| Counselor Appointments | — | — | — | ✅ | — |
| Counselor Availability | — | — | — | ✅ | — |
| Counselor Services | — | — | — | ✅ | — |
| User Management | — | — | — | — | ✅ |
| Plan Management | — | — | — | — | ✅ |
| Settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Language Toggle | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Onboarding Flow Summary

```
New User
  │
  ├── Visit Landing Page (/)
  │     └── Click "Get Started"
  │
  ├── View Plans (/plans)
  │     └── Compare tiers
  │
  ├── Register (/register)
  │     └── Auto-approved as Parent
  │
  ├── First Login
  │     └── Redirected to IEP Analyzer (/iep/analyse)
  │           └── Upload IEP PDF
  │                 ├── Child profile auto-created
  │                 ├── Goals auto-populated
  │                 └── Services & accommodations saved
  │
  └── Dashboard (/dashboard)
        └── Full access to all Parent features
```

---

## Technical Notes

- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Payments**: Stripe with webhook integration
- **AI Engine**: Google Gemini for IEP analysis, letter generation, and advocacy scenarios
- **Email**: Calendar invites via SMTP/SES with ICS attachments
- **i18n**: Runtime locale switching via React Context (LanguageProvider)
- **Access Control**: Role-based with `RequireRole` route guards and `ACCESS_POLICY` map
- **Database**: PostgreSQL with Sequelize ORM, 6 idempotent migrations
- **Deployment**: GCP Cloud Run (API + UI), Cloud Build CI/CD
