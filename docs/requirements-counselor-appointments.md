# Counselor Appointments + Services (Requirements)

## 1) Goal
Enable parents to book service appointments (e.g., Counseling, Speech Therapy) for a specific child, and enable counselors/service providers to manage availability, accept/waitlist requests, review documents (IEP + other uploads), reschedule when needed, and communicate updates. After an appointment is accepted and payment is received (payment optional for now), automatically create a Google Meet link in the counselor’s Google account and sync the event to Google Calendar with reminders.

This document defines **scope, roles, UI, APIs, data, and acceptance criteria**.

---

## 2) Roles & Access
### 2.1 Roles in system
Current roles in repo include: `PARENT`, `ADVOCATE`, `TEACHER_THERAPIST`, `ADMIN`, `SUPPORT`.

### 2.2 New role required
Introduce a dedicated role:
- **`COUNSELOR`** (or a more general name like `SERVICE_PROVIDER`).

Assumption for implementation: use `COUNSELOR`.

### 2.2.1 Counselor authentication source (Firebase Google)
Counselors must sign in using **Google via Firebase**. There is no password-based registration/login for counselors.

Backend must support exchanging Firebase ID token → app JWT (existing pattern in API), and counselor access must be gated by admin approval.

### 2.2.2 Admin approval required for counselor access
When a counselor signs in with Google for the first time:
- Create (or upsert) a user with `provider=google`
- Assign role `COUNSELOR`
- Set user `status=pending` until approved by an admin

Until approved:
- Counselor must not access protected counselor routes
- UI must show an “Awaiting admin approval” screen/message
- API must treat the account as authenticated-but-not-authorized (e.g., return `ACCOUNT_PENDING_APPROVAL` / HTTP 403 during token exchange or on protected route access)

Once approved:
- Admin sets `status=active` and records `approvedAt/approvedBy`
- Counselor can access counselor routes and configure profile

### 2.3 Counselor permissions
A counselor can:
- Configure **services offered** (templates + custom)
- Configure **availability timelines** (multiple slots per day)
- View appointment requests addressed to them
- **Accept** or **waitlist** an appointment request
- View **accepted** appointments and **waitlisted** appointments
- Reschedule appointment time/day (with parent notification)
- View child-related documents shared for the appointment:
  - IEP documents stored in Postgres
  - Other uploaded documents attached to the appointment
- Send messages/notifications to the parent regarding the appointment
- Mark appointment as completed
- See payment status (placeholder now)
- Access Google Calendar + Google Meet integration (via Firebase Google login)

Counselor must see setup alerts if profile is incomplete:
- If no availability timelines are configured: show alert “Availability not set up — parents cannot book yet.”
- If payment is not configured/enabled: show alert “Online payment not enabled — payment features are currently unavailable.”

A counselor cannot:
- Manage other users (admin-only)
- View documents for appointments they are not assigned to

### 2.4 Parent permissions
A parent can:
- Create appointment requests for a **specific child**
- Browse and select counselors by:
  - Department/service type
  - Name
- Attach documents to appointment request:
  - select an already-stored IEP document for that child (from Postgres)
  - upload other documents (optional)
- Track appointment request status:
  - pending / waitlisted / accepted / rescheduled / canceled / completed
  - payment pending / paid (optional)
- Pay (optional placeholder for now)
- View Google Meet link **only after payment is received** (if payment is enabled)
- View the appointment in calendar (UI display; optional “Add to calendar” link)

Parents must see a booking alert:
- If counselor has not configured availability: “This counselor has not published availability yet.”

### 2.5 Admin requirements (counselor onboarding + approvals)
Admin must have explicit user-management support for counselor Google sign-ups:
- View a list of pending counselor accounts created via Firebase Google sign-in
- Approve a counselor account (moves user from `pending` → `active`, sets `approvedAt/approvedBy`)
- Reject a counselor account (moves user to `inactive` or deletes the user)
- (Optional) Set counselor profile flags that affect product behavior:
  - `paymentsEnabled` (default: false)
  - internal notes about readiness (e.g., “availability not configured yet”)

Admin approval is required before counselor can access any counselor routes.

---

## 3) Services / Departments
### 3.1 Default service templates
System should seed or provide these templates (exact structure):

```ts
SERVICE_TEMPLATES = [
  { label: "Speech Therapy - 30 min", serviceType: "Speech Therapy", minutes: 30 },
  { label: "Occupational Therapy - 30 min", serviceType: "Occupational Therapy", minutes: 30 },
  { label: "Physical Therapy - 30 min", serviceType: "Physical Therapy", minutes: 30 },
  { label: "Counseling - 30 min", serviceType: "Counseling", minutes: 30 },
  { label: "Resource Room - 60 min", serviceType: "Resource Room", minutes: 60 },
  { label: "Extended School Year (ESY)", serviceType: "ESY", minutes: 60 },
  { label: "Custom Service", serviceType: "", minutes: 30 },
];
```

### 3.2 Custom departments / services
Counselor must be able to create customized service entries, e.g.:
- “Behavior Coaching - 45 min”
- “Transition Planning - 60 min”
- “Executive Function Support - 30 min”
- “Parent Coaching - 30 min”

Rules:
- A counselor can offer multiple services.
- Services have: `label`, `serviceType`, `minutes`, optional `price`.
- Service type functions as “department” for parent browsing.

---

## 4) Availability (Timeline Customization)
### 4.1 Counselor availability model
Counselor configures availability as **multiple timelines (slots) per day**, such as:
- Morning availability (e.g., 08:00–11:00)
- Evening availability (e.g., 17:00–20:00)

Required capabilities:
- Create **many time windows in a single day**
- Optionally define weekly patterns (Mon–Sun)
- Optionally define breaks/blocked times
- Ability to edit availability later

Minimum viable approach (recommended):
- Store recurring weekly availability with start/end times per weekday
- Generate bookable slots (e.g., every 30 min) for UI

### 4.2 Slot selection
Parents select:
- counselor
- child
- service type (department)
- desired date
- desired slot (start time)

System must validate:
- selected slot fits counselor availability
- selected slot does not overlap an already accepted appointment

### 4.3 Timeline change warning
Parent booking UI must show an alert:
- “Appointment time is subject to counselor approval and may change.”

---

## 5) Appointment Lifecycle & Statuses
### 5.1 Appointment request states
Appointments must support these statuses:
- `REQUESTED` (parent submitted)
- `WAITLISTED` (counselor put on waitlist)
- `ACCEPTED` (counselor accepted proposed slot or changed slot)
- `RESCHEDULE_REQUESTED` (either side requests change)
- `RESCHEDULED` (new slot confirmed)
- `CANCELED` (by parent or counselor)
- `COMPLETED` (appointment finished)

### 5.2 Payment statuses (optional feature)
Payment is **optional now**. Implement placeholders/state only.
- `PAYMENT_NOT_REQUIRED`
- `PAYMENT_PENDING`
- `PAID`
- `PAYMENT_FAILED`

Rule:
- If payment is enabled for the counselor/service, Meet link is visible to parent only when status is `PAID`.

---

## 6) Counselor UI Requirements
Add a counselor-facing area (route examples):
- `/counselor/appointments`
- `/counselor/availability`
- `/counselor/services`

### 6.0 Access gating + profile setup alerts
If counselor status is `pending`:
- Show a dedicated screen: “Your counselor account is awaiting admin approval.”
- Disable access to booking/availability/services screens.

If counselor is active but missing required setup:
- If no services configured: show alert “Add at least one service to accept appointments.”
- If no availability windows configured: show alert “Add availability to receive appointment requests.”
- If payments are expected but not configured: show alert “Payment not configured (optional for now).”

### 6.1 Appointments list
Counselor can view two tabs/sections:
- **Accepted** appointments (assigned to them)
- **Waitlisted** appointments (assigned to them)

For each appointment show:
- Parent name
- Child name
- Service type + duration
- Scheduled date/time
- Status
- Payment status (placeholder)

### 6.2 Appointment details
For an appointment, counselor can:
- Accept or Waitlist (if in REQUESTED)
- Edit scheduled time (timeline) and/or change day due to urgency
- See all documents attached:
  - IEP document(s) selected from child’s stored IEPs
  - additional documents uploaded with the appointment
- Send message notification to parent:
  - “Confirmed appointment for …”
  - “Rescheduled due to …”
  - “Please upload …”

### 6.3 Availability editor
Counselor can:
- Add multiple time windows per day
- Define morning/evening windows on the same weekday
- Save changes, which affect future booking slots

### 6.4 Service catalog editor
Counselor can:
- Choose from templates
- Add custom departments/services
- Set duration and (optional) fee

---

## 7) Parent UI Requirements
Add a parent-facing area (route examples):
- `/appointments` (list)
- `/appointments/new` (booking)

### 7.1 Appointment booking flow
Parent steps:
1) Select child
2) Browse counselors:
   - filter by department/service type
   - search/sort by counselor name
3) Select service type + duration
4) Choose a slot from counselor availability
5) Attach documents:
   - select a stored IEP document (Postgres) for that child
   - upload other documents (optional)
6) Submit request

UI elements:
- Show counselor’s appointment fee (if configured)
- Show the warning: time may change based on counselor approval

### 7.2 Parent appointment list
Parent can view all their appointment requests grouped by status:
- Pending request
- Waitlisted
- Accepted
- Rescheduled
- Completed

Each appointment shows:
- Counselor name
- Service/department
- Scheduled date/time (or requested time)
- Status badge
- Payment status badge (placeholder)

### 7.3 Payment UI (placeholder)
After booking is accepted:
- Show a “Payment” section
- If payment is enabled, show “Proceed to payment” button

For now, do not implement real payment processing; add:
- placeholder UI
- placeholder API hooks
- clear internal TODO points for future integration

### 7.4 Meet link visibility
- If payment is enabled: show Google Meet link only when payment status is `PAID`.
- If payment is not enabled: show Meet link after appointment is `ACCEPTED`.

---

## 8) Documents & Storage
### 8.1 IEP document selection
When parent creates appointment:
- Must be able to select a child’s existing IEP document(s) already stored in Postgres.

### 8.2 Additional documents
Parent can optionally upload additional documents to share with the counselor.

Rules:
- Counselor sees only documents tied to an appointment assigned to them.
- Documents must have metadata: filename, type, uploadedAt, uploadedBy.

---

## 9) Notifications & Messaging
### 9.1 Required notifications
Send notifications to parent when:
- counselor accepts the appointment
- counselor waitlists the appointment
- counselor changes timeline (time) or day
- counselor cancels appointment

Send notifications to counselor when:
- parent submits a new appointment request
- parent uploads new documents

Implementation note:
- Minimum: in-app notifications + email (if email infrastructure exists)
- Optional: push notification (future)

---

## 10) Google Integration (Firebase Login)
### 10.1 Authentication requirement
Counselor logs in via Firebase with Google account.

Additional requirement for counselor accounts:
- Google connection must be per-counselor, tied to the counselor’s Google account.
- If counselor is not approved yet, do not attempt Calendar/Meet creation.

### 10.2 Meet link creation
After appointment is accepted AND (if payment enabled) payment is received:
- Create a Google Calendar event in the counselor’s Google account
- Request a Google Meet link via Calendar “conference data”
- Store:
  - `meetLink`
  - calendar event id

### 10.3 Calendar sync & reminders
- Add event to counselor’s primary calendar
- Add reminders (default: e.g., 30 minutes before)
- Counselor can see the appointment in their Google Calendar

Constraints / Notes:
- Requires Google OAuth scopes for Calendar and Meet conference creation.
- If consent is missing/expired, system must prompt counselor to reconnect Google.

---

## 11) Data Model (Proposed)
### 11.1 Entities
**CounselorProfile**
- userId (FK users)
- displayName
- bio (optional)
- servicesOffered[]
- timezone
- googleConnected (boolean)
- googleRefreshToken (secure storage)

Suggested derived/config flags for UI gating (can be computed server-side):
- `hasAvailability`: true if counselor has at least one availability window
- `hasServices`: true if counselor has at least one service configured
- `paymentsEnabled`: true if counselor uses online payment (optional feature)

**CounselorService**
- id
- counselorId
- label
- serviceType (department)
- minutes
- priceCents (optional)
- currency (default USD)
- paymentRequired (boolean)

**CounselorAvailabilityWindow**
- id
- counselorId
- weekday (0–6)
- startTime (HH:mm)
- endTime (HH:mm)

**Appointment**
- id
- parentUserId
- childId
- counselorUserId
- counselorServiceId
- requestedStartAt
- scheduledStartAt
- scheduledEndAt
- status
- paymentStatus
- meetLink (nullable)
- googleCalendarEventId (nullable)
- notes (optional)

**AppointmentDocument**
- id
- appointmentId
- kind: `IEP_REFERENCE` | `UPLOAD`
- iepDocumentId (nullable)
- uploadDocumentId (nullable)

---

## 12) API Requirements (Implemented + Proposed)
### 12.1 Counselor APIs
Implemented (`/api/v1` prefix):
- `GET /counselor/service-metadata`
- `GET /counselor/services`
- `POST /counselor/services`
- `PATCH /counselor/services/:id`
- `DELETE /counselor/services/:id`

- `GET /counselor/availability`
- `PUT /counselor/availability` (bulk replace)

- `GET /counselor/profile`
- `PUT /counselor/profile`

- `GET /counselor/appointments`
- `PATCH /counselor/appointments/:id/status`

### 12.2 Parent APIs
Implemented (`/api/v1` prefix):
- `GET /counselor/catalog`
- `POST /counselor/appointments` (create request)
- `GET /counselor/appointments/mine`
- `PATCH /counselor/appointments/mine/:id` (reschedule update or cancel)

Proposed next endpoints:
- `POST /appointments/:id/documents` (upload additional docs)
- `POST /appointments/:id/payment-intent` (returns stub)
- `POST /appointments/:id/payment-confirm` (stub to set `PAID` in dev)

Documents:
- `GET /children/:childId/iep-documents` (existing endpoint if available)

### 12.3 Admin APIs (approval of Firebase counselor sign-ups)
Admin must be able to manage counselor Google sign-ups:
- List pending counselor accounts (e.g., `GET /admin/users?role=COUNSELOR&status=pending&provider=google`)
- Approve counselor (set `status=active`, set `approvedAt/approvedBy`)
- Reject counselor (set `status=inactive` or delete user)

Notes:
- This is an extension to existing Admin User Management pages/routes.
- Approval must be required before counselor can access counselor screens.

---

## 13) Security & Compliance
- Authorization checks on every endpoint:
  - Parent can only access their own appointments/children
  - Counselor can only access appointments assigned to them
  - Admin can access everything
- Audit log for:
  - accept/waitlist/reschedule/cancel
  - document access
- Do not expose Meet link unless user is authorized and payment rules satisfied.

---

## 14) Acceptance Criteria
### Admin
- When a counselor signs in with Google the first time, an account exists in `pending` state (not usable yet)
- Admin can approve/reject counselor Google sign-ups from the existing Admin User Management area
- Approved counselors can access counselor pages; pending counselors always see the “Awaiting admin approval” screen

### Counselor
- Can configure multiple availability windows on the same day (morning + evening)
- Can see Accepted list and Waitlisted list for their appointments
- Can accept or waitlist a request
- Can reschedule time/day and parent is notified
- Can view IEP and attached documents for accepted/waitlisted appointments
- After accept (+ paid when required), system creates Calendar event + Meet link
- Calendar event contains reminders

### Parent
- Can book appointment for a selected child
- Can browse counselors by department and name
- Sees warning that counselor approval may change time
- Can attach existing IEP document from storage + optional other documents
- Can see status badges (pending/waitlisted/accepted/etc.)
- Sees payment placeholder UI (no real processing yet)
- Can view Meet link after payment received (when payment required)

---

## 15) Out of Scope (for now)
- Real payment processor integration (Stripe/etc.)
- Video conferencing providers other than Google Meet
- Multi-counselor group sessions
- Complex insurance claims/billing
