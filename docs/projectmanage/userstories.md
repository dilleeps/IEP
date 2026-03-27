# IEP App - User Stories

**Last Updated**: January 27, 2026

This document captures user stories for features not yet implemented, with a focus on mobile app development and missing functionality identified in the [requirements document](references/requirements.md) and [project status](whatsdoneandpending.md).

---

## Table of Contents
1. [Mobile App - Parent User Stories](#mobile-app---parent-user-stories)
2. [Mobile App - Teacher/Therapist User Stories](#mobile-app---teachertherapist-user-stories)
3. [Mobile App - Advocate User Stories](#mobile-app---advocate-user-stories)
4. [Smart Legal Prompts](#smart-legal-prompts)
5. [Lineage Comparison & Analytics](#lineage-comparison--analytics)
6. [Meeting Preparation Toolkit](#meeting-preparation-toolkit)
7. [Progress Visualization](#progress-visualization)
8. [Legal Knowledge Base](#legal-knowledge-base)
9. [Accessibility Features](#accessibility-features)
10. [File Management & Document Library](#file-management--document-library)
11. [Notifications & Reminders](#notifications--reminders)
12. [Security & Compliance](#security--compliance)

---

## Mobile App - Parent User Stories

### Epic: Parent Dashboard & Child Management

#### US-M001: View Child Dashboard on Mobile
**As a** parent  
**I want to** view my child's IEP dashboard on my mobile device  
**So that** I can quickly check progress and alerts on-the-go

**Acceptance Criteria:**
- [ ] Dashboard displays all children with their photos/avatars
- [ ] Shows current IEP status (active, needs review, expired)
- [ ] Displays active alerts/prompts count with severity indicators
- [ ] Shows upcoming meetings and deadlines
- [ ] Quick access to recent progress updates
- [ ] Pull-to-refresh functionality
- [ ] Works in portrait and landscape modes
- [ ] Loads within 2 seconds on 4G connection

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 5 story points

---

#### US-M002: Add/Edit Child Profile on Mobile
**As a** parent  
**I want to** create and update my child's profile from my phone  
**So that** I can manage information anytime, anywhere

**Acceptance Criteria:**
- [ ] Form includes all required fields (name, DOB, grade, diagnosis)
- [ ] Camera integration for profile photo
- [ ] Photo library access for existing images
- [ ] Diagnosis selection with primary/secondary options
- [ ] School and district auto-complete/search
- [ ] Form validation with clear error messages
- [ ] Save draft capability if interrupted
- [ ] Offline mode saves to local storage, syncs when online
- [ ] Confirmation dialog before saving

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

#### US-M003: View Child's IEP Goals on Mobile
**As a** parent  
**I want to** view all my child's IEP goals on my mobile device  
**So that** I can stay informed about what my child is working on

**Acceptance Criteria:**
- [ ] List view shows all goals with category tags
- [ ] Each goal displays current progress percentage
- [ ] Color-coded status indicators (on track, needs attention, achieved)
- [ ] Tap to expand for full goal details
- [ ] Shows baseline, current level, and target
- [ ] Displays measurement method and frequency
- [ ] Shows recent progress notes (last 3)
- [ ] Filter by category, status, or service provider
- [ ] Search functionality for goals
- [ ] Swipe actions for quick access (view details, add note)

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

#### US-M004: Take Photos/Videos as Evidence
**As a** parent  
**I want to** capture photos or videos as evidence of my child's progress or concerns  
**So that** I can document observations immediately

**Acceptance Criteria:**
- [ ] In-app camera for photos and videos
- [ ] Option to select from photo library
- [ ] Attach to specific goal or general observation
- [ ] Add caption/notes to media
- [ ] Tag with date and location (optional)
- [ ] Preview before uploading
- [ ] Upload progress indicator
- [ ] Works offline (queues for upload)
- [ ] Compression to optimize storage
- [ ] Privacy notice for sensitive content

**Priority:** MEDIUM  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 5 story points

---

### Epic: Progress Tracking on Mobile

#### US-M005: Log Progress Update (Parent)
**As a** parent  
**I want to** log my child's progress observations from my phone  
**So that** I can share what I see at home with the IEP team

**Acceptance Criteria:**
- [ ] Select goal from list
- [ ] Enter observation notes (text area with character count)
- [ ] Attach photos/videos
- [ ] Select observation date (defaults to today)
- [ ] Add tags (behavior, academic, social, communication)
- [ ] Rate progress on simple scale (improved, same, declined)
- [ ] Save as draft or publish
- [ ] Notify teacher/therapist option
- [ ] Works offline, syncs when online
- [ ] Confirmation message after save

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

#### US-M006: View Progress Timeline
**As a** parent  
**I want to** view a timeline of all progress updates for a goal  
**So that** I can see how my child has progressed over time

**Acceptance Criteria:**
- [ ] Chronological timeline view (newest first)
- [ ] Each entry shows date, author, and summary
- [ ] Tap to expand for full notes and attachments
- [ ] Visual indicators for who logged (parent, teacher, therapist)
- [ ] Filter by date range
- [ ] Filter by author role
- [ ] Scroll to load more (pagination)
- [ ] Export timeline as PDF
- [ ] Share timeline via email

**Priority:** MEDIUM  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 5 story points

---

### Epic: Communication & Contact Logging

#### US-M007: Log Communication from Mobile
**As a** parent  
**I want to** log communications with school staff immediately after they happen  
**So that** I have an accurate record while details are fresh

**Acceptance Criteria:**
- [ ] Quick log button on dashboard
- [ ] Select contact from IEP team list
- [ ] Communication type (email, phone, in-person, video)
- [ ] Date/time picker (defaults to now)
- [ ] Subject line (required)
- [ ] Notes (rich text with formatting)
- [ ] Attach related documents/photos
- [ ] Tag with topics (IEP meeting, progress, behavior, services)
- [ ] Mark as follow-up required
- [ ] Set reminder for follow-up
- [ ] Works offline
- [ ] Confirmation after save

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

#### US-M008: Send Quick Email to Teacher
**As a** parent  
**I want to** send a quick email to my child's teacher from the app  
**So that** I can communicate efficiently without leaving the IEP context

**Acceptance Criteria:**
- [ ] Select teacher from contact list
- [ ] Pre-filled templates for common requests
- [ ] Subject and body fields
- [ ] Attach documents from app
- [ ] CC other team members option
- [ ] Save as draft
- [ ] Send and auto-log to communication history
- [ ] Confirmation after send
- [ ] View sent emails in communication log

**Priority:** MEDIUM  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 5 story points

---

### Epic: Smart Legal Prompts on Mobile

#### US-M009: Receive Push Notification for Smart Prompt
**As a** parent  
**I want to** receive push notifications when a legal prompt is triggered  
**So that** I'm alerted immediately to potential IEP issues

**Acceptance Criteria:**
- [ ] Push notification on mobile device
- [ ] Notification shows prompt title and severity
- [ ] Tap to open full prompt details in app
- [ ] Badge indicator on app icon
- [ ] Notification settings to customize alert types
- [ ] Quiet hours setting (no alerts during sleep)
- [ ] Group similar notifications
- [ ] Works when app is closed
- [ ] Delivered within 5 minutes of trigger

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

#### US-M010: Review and Send Smart Prompt Email
**As a** parent  
**I want to** review and send pre-drafted emails for legal prompts from my phone  
**So that** I can respond to IEP issues immediately

**Acceptance Criteria:**
- [ ] View prompt details (issue summary, context, legal basis)
- [ ] Pre-filled email with child name, school, dates
- [ ] Edit subject and body
- [ ] Preview before sending
- [ ] Select recipients (teacher, principal, case manager)
- [ ] CC advocate option (toggle)
- [ ] Schedule send for later
- [ ] Send and log automatically
- [ ] Confirmation with next steps
- [ ] Set follow-up reminder (7, 14, 30 days)

**Priority:** CRITICAL  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 13 story points

---

### Epic: Meeting Preparation

#### US-M011: Access Meeting Prep Checklist on Mobile
**As a** parent  
**I want to** access my IEP meeting prep checklist on my phone  
**So that** I can prepare while commuting or waiting

**Acceptance Criteria:**
- [ ] Checklist personalized to meeting type (annual, re-eval, etc.)
- [ ] Check off items as completed
- [ ] Progress indicator (X of Y items complete)
- [ ] Tap item to see tips/guidance
- [ ] Add custom checklist items
- [ ] Attach documents to checklist items
- [ ] Save notes per checklist item
- [ ] Share checklist with advocate
- [ ] Syncs across devices
- [ ] Reminder notifications for incomplete items

**Priority:** MEDIUM  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

#### US-M012: Take Notes During IEP Meeting
**As a** parent  
**I want to** take notes during an IEP meeting on my phone  
**So that** I can document what was discussed in real-time

**Acceptance Criteria:**
- [ ] Quick note entry screen
- [ ] Voice-to-text input option
- [ ] Timestamp for each note
- [ ] Tag notes by topic (goals, services, placement, etc.)
- [ ] Attach photos of meeting documents
- [ ] Works offline (saves locally)
- [ ] Auto-save every 30 seconds
- [ ] Share notes after meeting
- [ ] Add to meeting record automatically
- [ ] Export as PDF

**Priority:** MEDIUM  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 5 story points

---

### Epic: Documents & Resources

#### US-M013: View IEP Documents on Mobile
**As a** parent  
**I want to** view my child's IEP documents on my phone  
**So that** I can reference them anytime without carrying paper copies

**Acceptance Criteria:**
- [ ] List all uploaded IEP documents
- [ ] Sort by date (newest first)
- [ ] Filter by type (IEP, evaluation, progress report)
- [ ] In-app PDF viewer with zoom and scroll
- [ ] Search within document
- [ ] Highlight and annotate PDF
- [ ] Download for offline access
- [ ] Share via email or messaging
- [ ] Pin frequently accessed documents
- [ ] Delete option with confirmation

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

#### US-M014: Upload Documents from Mobile
**As a** parent  
**I want to** upload documents from my phone's camera or storage  
**So that** I can digitize paper IEP documents immediately

**Acceptance Criteria:**
- [ ] Take photo of document (multi-page support)
- [ ] Select from device storage or cloud drives
- [ ] Auto-crop and enhance document photos
- [ ] Convert to PDF
- [ ] Add document title and type
- [ ] Tag with child and date
- [ ] Preview before upload
- [ ] Upload progress indicator
- [ ] Works with poor connectivity (resume on reconnect)
- [ ] Confirmation after successful upload

**Priority:** HIGH  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 8 story points

---

### Epic: Mobile App Settings & Preferences

#### US-M015: Configure Mobile App Notifications
**As a** parent  
**I want to** customize which notifications I receive on my mobile device  
**So that** I only get alerts that matter to me

**Acceptance Criteria:**
- [ ] Toggle notifications by type (progress, alerts, meetings, messages)
- [ ] Set quiet hours (start and end time)
- [ ] Choose notification sound per type
- [ ] Enable/disable vibration
- [ ] Set severity threshold (only high priority, or all)
- [ ] Preview notification appearance
- [ ] Test notification button
- [ ] Sync settings across devices
- [ ] Save changes confirmation

**Priority:** MEDIUM  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 5 story points

---

#### US-M016: Enable Biometric Login
**As a** parent  
**I want to** log in using Face ID or fingerprint  
**So that** I can access the app quickly and securely

**Acceptance Criteria:**
- [ ] Detect device biometric capability (Face ID, Touch ID, fingerprint)
- [ ] Prompt to enable during onboarding
- [ ] Enable/disable in settings
- [ ] Fallback to password if biometric fails
- [ ] Re-authenticate after 7 days for security
- [ ] Works with multiple biometric profiles (if device supports)
- [ ] Clear error messages if biometric not available
- [ ] Option to require biometric for sensitive actions (delete, share)

**Priority:** MEDIUM  
**Related Issue:** [#54](https://github.com/ASKIEP/iepapp/issues/54)  
**Estimated Effort:** 5 story points

---

## Mobile App - Teacher/Therapist User Stories

### Epic: Student Management

#### US-M017: View Assigned Students
**As a** teacher/therapist  
**I want to** view all students assigned to me on my mobile device  
**So that** I can quickly access their IEP information

**Acceptance Criteria:**
- [ ] List view of all assigned students
- [ ] Search by student name
- [ ] Filter by grade, disability category, or service type
- [ ] Each student card shows photo, name, grade, and active goals count
- [ ] Tap to view full student profile
- [ ] Quick access to goals and progress
- [ ] Shows if parent has recent concerns/questions
- [ ] Alerts for overdue progress updates
- [ ] Pull-to-refresh

**Priority:** HIGH  
**Related Issue:** [#56](https://github.com/ASKIEP/iepapp/issues/56)  
**Estimated Effort:** 8 story points

---

#### US-M018: Log Student Progress (Teacher)
**As a** teacher/therapist  
**I want to** log student progress immediately after a session  
**So that** data is accurate and timely

**Acceptance Criteria:**
- [ ] Select student from my caseload
- [ ] Select goal(s) addressed in session
- [ ] Enter observation notes
- [ ] Record quantitative data (trials, accuracy %)
- [ ] Attach session photos/videos
- [ ] Select session date/time (defaults to now)
- [ ] Mark goal as achieved, in progress, or needs revision
- [ ] Notify parent option
- [ ] Save as draft or publish
- [ ] Works offline
- [ ] Bulk entry for multiple students (same activity)

**Priority:** HIGH  
**Related Issue:** [#56](https://github.com/ASKIEP/iepapp/issues/56)  
**Estimated Effort:** 13 story points

---

#### US-M019: View Behavior ABC Data
**As a** teacher  
**I want to** view behavior incident data for a student  
**So that** I can identify patterns and inform intervention strategies

**Acceptance Criteria:**
- [ ] Timeline of all behavior incidents
- [ ] Filter by date range
- [ ] Filter by behavior type
- [ ] Each entry shows Antecedent, Behavior, Consequence
- [ ] Visual summary (chart) of behavior frequency
- [ ] Identify patterns (time of day, trigger frequency)
- [ ] Export data as CSV or PDF
- [ ] Share with IEP team
- [ ] Add notes to existing incidents
- [ ] Link to relevant goals

**Priority:** MEDIUM  
**Related Issue:** [#56](https://github.com/ASKIEP/iepapp/issues/56)  
**Estimated Effort:** 8 story points

---

#### US-M020: Quick Log Behavior Incident
**As a** teacher  
**I want to** quickly log a behavior incident from my phone  
**So that** I can document it immediately while details are fresh

**Acceptance Criteria:**
- [ ] Quick access button on student profile
- [ ] Select student
- [ ] Record Antecedent (what happened before)
- [ ] Record Behavior (what student did)
- [ ] Record Consequence (what happened after)
- [ ] Time and location fields
- [ ] Severity level (1-5)
- [ ] Duration of behavior
- [ ] Intervention used
- [ ] Attach photos/video if safe to do so
- [ ] Notify parent option
- [ ] Works offline
- [ ] Save time < 2 minutes

**Priority:** HIGH  
**Related Issue:** [#56](https://github.com/ASKIEP/iepapp/issues/56)  
**Estimated Effort:** 8 story points

---

### Epic: Communication with Parents

#### US-M021: Respond to Parent Messages
**As a** teacher/therapist  
**I want to** read and respond to parent messages on my mobile device  
**So that** I can communicate promptly even when away from my desk

**Acceptance Criteria:**
- [ ] Notification for new parent message
- [ ] Inbox view of all messages
- [ ] Filter by student
- [ ] Mark as read/unread
- [ ] Reply with text
- [ ] Attach documents or photos
- [ ] Use message templates for common responses
- [ ] Set flag for follow-up
- [ ] Archive messages
- [ ] Search message history
- [ ] Auto-log to communication record

**Priority:** HIGH  
**Related Issue:** [#56](https://github.com/ASKIEP/iepapp/issues/56)  
**Estimated Effort:** 8 story points

---

#### US-M022: Share Progress Update with Parent
**As a** teacher/therapist  
**I want to** share a progress summary with a parent from my phone  
**So that** I can keep them informed throughout the marking period

**Acceptance Criteria:**
- [ ] Select student and goals to include
- [ ] Auto-generate progress summary (achievements, challenges, next steps)
- [ ] Edit message before sending
- [ ] Attach supporting data/charts
- [ ] Preview parent's view
- [ ] Send via in-app message or email
- [ ] Schedule send for specific date/time
- [ ] Confirm parent received/viewed
- [ ] Log as communication record
- [ ] Request parent feedback/questions

**Priority:** MEDIUM  
**Related Issue:** [#56](https://github.com/ASKIEP/iepapp/issues/56)  
**Estimated Effort:** 8 story points

---

## Mobile App - Advocate User Stories

### Epic: Case Management

#### US-M023: View Assigned Cases on Mobile
**As an** advocate  
**I want to** view all my assigned cases on my mobile device  
**So that** I can stay updated on clients while traveling

**Acceptance Criteria:**
- [ ] List of all assigned families/children
- [ ] Filter by status (active, on hold, closed)
- [ ] Search by family name or child name
- [ ] Each case card shows key info (child, school, next meeting date)
- [ ] Alert indicators for urgent items
- [ ] Tap to view full case details
- [ ] Quick access to recent communications
- [ ] Shows compliance alerts
- [ ] Pull-to-refresh

**Priority:** MEDIUM  
**Related Issue:** [#55](https://github.com/ASKIEP/iepapp/issues/55)  
**Estimated Effort:** 8 story points

---

#### US-M024: Review Smart Legal Prompts (Advocate)
**As an** advocate  
**I want to** review legal prompts for my clients on mobile  
**So that** I can advise parents on urgent issues immediately

**Acceptance Criteria:**
- [ ] Notification for new high-priority prompts
- [ ] List of all active prompts per case
- [ ] Filter by severity and type
- [ ] View prompt details (issue, context, recommended action)
- [ ] Review parent's draft email
- [ ] Provide feedback/suggestions to parent
- [ ] Mark prompt as reviewed
- [ ] Add advocate notes (visible only to advocate)
- [ ] Escalate to legal counsel option
- [ ] Generate case summary for prompt

**Priority:** HIGH  
**Related Issue:** [#55](https://github.com/ASKIEP/iepapp/issues/55)  
**Estimated Effort:** 13 story points

---

#### US-M025: Prepare for IEP Meeting (Advocate)
**As an** advocate  
**I want to** prepare for an IEP meeting using my mobile device  
**So that** I can review case details before arriving

**Acceptance Criteria:**
- [ ] View child's full IEP
- [ ] Review all goals and current progress
- [ ] See parent concerns and questions
- [ ] Access meeting agenda
- [ ] Review previous meeting notes
- [ ] Check compliance status
- [ ] View historical data/trends
- [ ] Add advocate talking points
- [ ] Generate meeting prep document (PDF)
- [ ] Share prep notes with parent
- [ ] Set meeting reminders

**Priority:** MEDIUM  
**Related Issue:** [#55](https://github.com/ASKIEP/iepapp/issues/55)  
**Estimated Effort:** 8 story points

---

#### US-M026: Access Advocacy Resources
**As an** advocate  
**I want to** access legal resources and templates on my mobile device  
**So that** I can reference them during parent consultations

**Acceptance Criteria:**
- [ ] Searchable legal resource library
- [ ] Filter by topic (IDEA, FERPA, LRE, etc.)
- [ ] Quick reference guides
- [ ] State-specific regulations
- [ ] Template letters and forms
- [ ] Case law summaries
- [ ] Bookmark frequently used resources
- [ ] Offline access to bookmarked items
- [ ] Share resources with parents
- [ ] Recently viewed history

**Priority:** MEDIUM  
**Related Issue:** [#55](https://github.com/ASKIEP/iepapp/issues/55)  
**Estimated Effort:** 8 story points

---

## Smart Legal Prompts

### Epic: Trigger Detection Algorithms

#### US-SP001: Detect Limited Progress
**As the** system  
**I want to** automatically detect when a child is not making meaningful progress  
**So that** parents are alerted to request data-driven IEP reviews

**Acceptance Criteria:**
- [ ] Algorithm runs weekly on all active goals
- [ ] Compares current performance to baseline and target
- [ ] Considers time elapsed since IEP start
- [ ] Triggers alert if progress < 25% of expected after 3 months
- [ ] Accounts for goal difficulty and student needs
- [ ] Considers frequency of progress entries (insufficient data flag)
- [ ] Generates specific context (which goals, data trends)
- [ ] Creates parent email with pre-filled details
- [ ] Logs trigger event in audit trail
- [ ] Notifies parent within 24 hours

**Priority:** CRITICAL  
**Related Requirements:** Smart Legal Prompt #1  
**Estimated Effort:** 13 story points

---

#### US-SP002: Detect Vague or Non-Measurable Goals
**As the** system  
**I want to** identify IEP goals that lack clear measurement criteria  
**So that** parents can request IDEA-compliant goal revisions

**Acceptance Criteria:**
- [ ] NLP analysis of goal text during IEP upload
- [ ] Flag goals without quantifiable metrics (%, accuracy, frequency)
- [ ] Flag goals with vague terms ("improve," "increase" without numbers)
- [ ] Flag goals missing baseline data
- [ ] Flag goals without clear measurement method
- [ ] Trigger alert within 48 hours of IEP upload
- [ ] Generate prompt with specific goals flagged
- [ ] Pre-fill email requesting clarification
- [ ] Provide examples of measurable alternatives
- [ ] Allow parent to dismiss if reviewed with team

**Priority:** CRITICAL  
**Related Requirements:** Smart Legal Prompt #2  
**Estimated Effort:** 21 story points

---

#### US-SP003: Detect Service Reduction Risk
**As the** system  
**I want to** alert parents when services may be reduced without data support  
**So that** parents can request justification and prevent inappropriate reductions

**Acceptance Criteria:**
- [ ] Monitor IEP changes for service hour reductions
- [ ] Compare proposed IEP to current IEP
- [ ] Flag reduction > 20% in any service area
- [ ] Check if progress data supports reduction
- [ ] Consider regression risk factors
- [ ] Trigger alert immediately upon detection
- [ ] Generate email requesting data and PWN
- [ ] Include ESY (extended school year) considerations
- [ ] List questions for parent to ask team
- [ ] Track if PWN was provided

**Priority:** CRITICAL  
**Related Requirements:** Smart Legal Prompt #3  
**Estimated Effort:** 13 story points

---

#### US-SP004: Detect Missing Prior Written Notice
**As the** system  
**I want to** identify when a parent request was refused without PWN  
**So that** parents can formally request required documentation

**Acceptance Criteria:**
- [ ] Track parent requests logged in system
- [ ] Monitor for school response within 30 days
- [ ] Flag if response indicates refusal
- [ ] Check if PWN document was uploaded
- [ ] Trigger alert if refused without PWN
- [ ] Generate email formally requesting PWN
- [ ] Include PWN legal requirements (34 CFR 300.503)
- [ ] Template lists required PWN elements
- [ ] Escalation recommendation if no response in 14 days
- [ ] Log PWN status in compliance tracking

**Priority:** CRITICAL  
**Related Requirements:** Smart Legal Prompt #4  
**Estimated Effort:** 13 story points

---

#### US-SP005: Detect Missing or Generic Progress Reports
**As the** system  
**I want to** flag when progress reports lack meaningful data  
**So that** parents can request detailed, objective progress information

**Acceptance Criteria:**
- [ ] Analyze progress report text for specificity
- [ ] Flag reports with generic phrases ("making progress," "doing well")
- [ ] Flag reports missing quantitative data
- [ ] Check progress reporting frequency (per IEP requirement)
- [ ] Trigger if report is overdue (> 2 weeks past due date)
- [ ] Flag if no progress entries in 6 weeks
- [ ] Generate prompt with specific concerns
- [ ] Pre-fill email requesting objective data
- [ ] Suggest questions to ask (baseline, current level, measurement)
- [ ] Notify parent and log compliance concern

**Priority:** CRITICAL  
**Related Requirements:** Smart Legal Prompt #5  
**Estimated Effort:** 13 story points

---

#### US-SP006: Detect Unaddressed Parent Concerns
**As the** system  
**I want to** track whether parent concerns are documented in the IEP  
**So that** parents can ensure their input is formally considered

**Acceptance Criteria:**
- [ ] Parent can flag concerns as "needs IEP team response"
- [ ] Track concerns submitted before/during IEP meetings
- [ ] Monitor IEP document for mention of concerns
- [ ] Flag if meeting notes don't address logged concerns
- [ ] Trigger alert after IEP meeting if concerns unaddressed
- [ ] Generate email requesting documentation
- [ ] Request PWN if concerns were rejected
- [ ] Template includes parent participation rights (34 CFR 300.322)
- [ ] Allow parent to mark concern as resolved
- [ ] Compliance report includes concern tracking

**Priority:** HIGH  
**Related Requirements:** Smart Legal Prompt #6  
**Estimated Effort:** 13 story points

---

#### US-SP007: Detect Restrictive Placement Concerns
**As the** system  
**I want to** identify when a child's placement may violate LRE principles  
**So that** parents can request less restrictive options be considered

**Acceptance Criteria:**
- [ ] Monitor placement changes to more restrictive settings
- [ ] Flag if child moved from general ed to separate classroom
- [ ] Check IEP for LRE justification documentation
- [ ] Verify continuum of options were considered
- [ ] Trigger alert when restrictive placement proposed or implemented
- [ ] Generate email requesting LRE documentation
- [ ] Include questions about supports in less restrictive settings
- [ ] Reference LRE requirements (34 CFR 300.114-116)
- [ ] Suggest requesting placement review
- [ ] Track placement decisions in compliance log

**Priority:** HIGH  
**Related Requirements:** Smart Legal Prompt #7  
**Estimated Effort:** 13 story points

---

#### US-SP008: Detect Missed or Inconsistent Services
**As the** system  
**I want to** identify patterns of missed IEP services  
**So that** parents can request compensatory services

**Acceptance Criteria:**
- [ ] Track service delivery logs from providers
- [ ] Compare delivered services to IEP-mandated frequency
- [ ] Flag if services missed > 20% in any month
- [ ] Calculate total minutes owed
- [ ] Pattern detection for specific days/providers
- [ ] Trigger alert if threshold exceeded
- [ ] Generate email requesting service logs
- [ ] Include compensatory services language
- [ ] Calculate make-up time owed
- [ ] Escalation if pattern continues
- [ ] Track compensation plan if provided

**Priority:** CRITICAL  
**Related Requirements:** Smart Legal Prompt #8  
**Estimated Effort:** 21 story points

---

#### US-SP009: Detect IEP Exit Pressure
**As the** system  
**I want to** identify when schools may be pushing to exit a child from IEP prematurely  
**So that** parents can request proper reevaluation before exit

**Acceptance Criteria:**
- [ ] Monitor communications for exit language ("might not need IEP anymore")
- [ ] Flag if exit suggested before required reevaluation timeline
- [ ] Check if comprehensive reevaluation was conducted
- [ ] Verify if regression risk was considered
- [ ] Trigger alert when exit discussion detected
- [ ] Generate email requesting reevaluation before exit
- [ ] Include parent consent rights
- [ ] Reference exit requirements (34 CFR 300.305)
- [ ] Suggest questions about long-term impacts
- [ ] Track exit process in compliance log

**Priority:** HIGH  
**Related Requirements:** Smart Legal Prompt #9  
**Estimated Effort:** 13 story points

---

#### US-SP010: Detect Pattern of Procedural Violations
**As the** system  
**I want to** identify repeated procedural compliance issues  
**So that** parents can escalate systemic problems appropriately

**Acceptance Criteria:**
- [ ] Track all compliance concerns by type
- [ ] Detect patterns (3+ of same issue in 12 months)
- [ ] Flag timeline violations (meeting notices, evaluations)
- [ ] Monitor documentation gaps (missing PWN, unsigned IEPs)
- [ ] Trigger alert when pattern threshold met
- [ ] Generate detailed compliance concern letter
- [ ] Include history of violations
- [ ] Reference procedural safeguards
- [ ] Recommend escalation (complaint, mediation)
- [ ] Provide links to state complaint process
- [ ] Generate timeline report as evidence

**Priority:** HIGH  
**Related Requirements:** Smart Legal Prompt #10  
**Estimated Effort:** 21 story points

---

### Epic: Smart Prompt Email Generation

#### US-SP011: Auto-Fill Email Context
**As a** parent  
**I want** smart prompt emails to be pre-filled with my child's information  
**So that** I can send professional requests without starting from scratch

**Acceptance Criteria:**
- [ ] Email includes child's full name
- [ ] School name and address populated
- [ ] District name included
- [ ] Teacher/case manager name (if available)
- [ ] Relevant dates (IEP date, evaluation due date, etc.)
- [ ] Specific goals or services affected
- [ ] Primary and secondary diagnosis
- [ ] Grade level
- [ ] All fields editable by parent
- [ ] Preview before sending

**Priority:** CRITICAL  
**Related Requirements:** Core Req #3  
**Estimated Effort:** 8 story points

---

#### US-SP012: One-Click Send and Log
**As a** parent  
**I want to** send a smart prompt email and automatically log it as evidence  
**So that** I have a documented record without extra steps

**Acceptance Criteria:**
- [ ] Single "Send & Log" button
- [ ] Email sent via configured email service
- [ ] Copy saved to parent's account
- [ ] Automatically logged in communication history
- [ ] Tagged with prompt type
- [ ] Timestamped
- [ ] Linked to relevant IEP/goal
- [ ] Confirmation message shown
- [ ] Option to download PDF copy
- [ ] Viewable in evidence timeline
- [ ] Can't be edited after sending (integrity)

**Priority:** CRITICAL  
**Related Requirements:** Core Req #3  
**Estimated Effort:** 8 story points

---

#### US-SP013: Escalation Logic with Follow-up Reminders
**As a** parent  
**I want** the system to remind me to follow up if school doesn't respond  
**So that** issues don't fall through the cracks

**Acceptance Criteria:**
- [ ] Parent sets expected response timeframe (7, 14, 30 days)
- [ ] System tracks if school responds (parent marks as received)
- [ ] If no response by deadline, send reminder notification
- [ ] Reminder includes original email context
- [ ] Suggests next escalation step (follow-up email, meeting request, complaint)
- [ ] Pre-drafted escalation email available
- [ ] Track escalation level (initial, follow-up, formal complaint)
- [ ] Timeline visualization of request → response → escalation
- [ ] Can snooze reminder if response in progress
- [ ] Escalation recommendations based on issue severity

**Priority:** CRITICAL  
**Related Requirements:** Core Req #3  
**Estimated Effort:** 13 story points

---

#### US-SP014: Optional CC to Advocate
**As a** parent  
**I want to** easily CC my advocate on smart prompt emails  
**So that** they're kept in the loop on advocacy efforts

**Acceptance Criteria:**
- [ ] Toggle switch "CC my advocate"
- [ ] Advocate email populated from parent's advocate list
- [ ] Option to add custom CC addresses
- [ ] Preview shows all recipients
- [ ] Advocate receives copy via email
- [ ] Advocate can view email in their app dashboard
- [ ] Parent can set advocate as default CC for all smart prompts
- [ ] Advocate notified they were CC'd
- [ ] Advocate can comment on thread (visible to parent only)
- [ ] BCC option for discreet advocacy support

**Priority:** HIGH  
**Related Requirements:** Core Req #3  
**Estimated Effort:** 5 story points

---

## Lineage Comparison & Analytics

### Epic: Multi-Year Goal Tracking

#### US-LC001: Link Goals Across IEP Years
**As a** parent  
**I want to** see how similar goals have evolved across multiple IEPs  
**So that** I can understand my child's long-term progress in each skill area

**Acceptance Criteria:**
- [ ] System suggests goal matches across years (same skill domain)
- [ ] Parent can manually link goals
- [ ] Visual timeline shows goal progression year-over-year
- [ ] Each year shows baseline → target → achieved for linked goals
- [ ] Color coding for goal status per year
- [ ] Tap goal to see full details for that year
- [ ] Shows if goal continued, achieved, or modified
- [ ] Export lineage as report
- [ ] Share with IEP team

**Priority:** CRITICAL  
**Related Requirements:** LC-01  
**Estimated Effort:** 13 story points

---

#### US-LC002: Multi-Year Trend Visualization
**As a** parent  
**I want to** see charts comparing my child's progress across multiple years  
**So that** I can identify areas of growth and areas needing more support

**Acceptance Criteria:**
- [ ] Line charts for key skill areas (reading, math, behavior, social)
- [ ] X-axis: time (by year or semester)
- [ ] Y-axis: performance level
- [ ] Multiple goals on same chart (if related)
- [ ] Toggle between goal categories
- [ ] Shows trend lines (improving, plateauing, declining)
- [ ] Annotations for major events (evaluation, service changes)
- [ ] Compare to grade-level expectations (if available)
- [ ] Export chart as image or PDF
- [ ] Zoom and pan on chart for details

**Priority:** CRITICAL  
**Related Requirements:** LC-02  
**Estimated Effort:** 13 story points

---

#### US-LC003: Service Continuity Analysis
**As a** parent  
**I want to** compare services across IEP years  
**So that** I can see if supports have remained consistent or changed

**Acceptance Criteria:**
- [ ] Table view of services by year
- [ ] Columns: service type, frequency, duration, provider
- [ ] Highlight increases in green, decreases in red
- [ ] Identify services added or removed
- [ ] Calculate total service hours per year
- [ ] Compare to progress in related goals
- [ ] Flag large reductions (> 20%) with explanation prompt
- [ ] Show if compensatory services were provided
- [ ] Export comparison report
- [ ] Filter by service type (speech, OT, PT, counseling)

**Priority:** CRITICAL  
**Related Requirements:** LC-03  
**Estimated Effort:** 13 story points

---

#### US-LC004: Accommodation Consistency Tracking
**As a** parent  
**I want to** track which accommodations persisted or changed over time  
**So that** I can advocate for supports that have proven helpful

**Acceptance Criteria:**
- [ ] List of all accommodations by IEP year
- [ ] Group by category (testing, classroom, behavioral)
- [ ] Mark accommodations as: continued, added, removed
- [ ] Link accommodations to related goals/progress
- [ ] Identify accommodations consistently used (3+ years)
- [ ] Flag newly removed accommodations (with justification check)
- [ ] Parent can add notes on accommodation effectiveness
- [ ] Correlate accommodations with goal achievement
- [ ] Export accommodation history
- [ ] Share with IEP team before annual review

**Priority:** HIGH  
**Related Requirements:** LC-04  
**Estimated Effort:** 8 story points

---

#### US-LC005: Summary Analytics Dashboard
**As a** parent  
**I want to** see high-level analytics on my child's IEP history  
**So that** I can quickly understand overall progress patterns

**Acceptance Criteria:**
- [ ] % of goals achieved per IEP cycle
- [ ] Average progress rate across all goals
- [ ] Service hours trend over time
- [ ] Number of IEP meetings per year
- [ ] Compliance metrics (timely evaluations, meeting notices)
- [ ] Areas of strength (consistently achieved goals)
- [ ] Areas needing support (repeated goals, low progress)
- [ ] Total time in IEP services
- [ ] Placement history timeline
- [ ] Visual dashboard with charts and key metrics
- [ ] Filterable by date range
- [ ] Export as PDF report

**Priority:** HIGH  
**Related Requirements:** LC-05  
**Estimated Effort:** 13 story points

---

## Meeting Preparation Toolkit

### Epic: Meeting Preparation Features

#### US-MP001: Dynamic Meeting Prep Checklist
**As a** parent  
**I want** a personalized checklist for preparing for IEP meetings  
**So that** I don't forget important preparation steps

**Acceptance Criteria:**
- [ ] Checklist adapts to meeting type (annual, triennial, amendment)
- [ ] Includes standard items (review current IEP, list concerns, prepare questions)
- [ ] Suggests items based on child's situation (e.g., "review behavior data" if behavior goals exist)
- [ ] Parent can add custom checklist items
- [ ] Check off completed items
- [ ] Progress indicator (X of Y complete)
- [ ] Reminders X days before meeting
- [ ] Attach documents to checklist items
- [ ] Notes field per item
- [ ] Share checklist with advocate
- [ ] Reusable template for future meetings
- [ ] Export as PDF

**Priority:** HIGH  
**Related Requirements:** MP-03  
**Estimated Effort:** 8 story points

---

#### US-MP002: Parent Questions & Concerns Entry
**As a** parent  
**I want to** document my questions and concerns before a meeting  
**So that** I remember to address everything during the IEP meeting

**Acceptance Criteria:**
- [ ] Dedicated section for parent questions
- [ ] Organize by category (goals, services, placement, behavior, etc.)
- [ ] Priority flag (must ask vs. nice to ask)
- [ ] Add supporting evidence/documents to questions
- [ ] System suggests questions based on smart prompts or data trends
- [ ] Print or email questions to self before meeting
- [ ] Check off questions as addressed during meeting
- [ ] Add notes on team's responses
- [ ] Flag questions not answered for follow-up
- [ ] Save questions as template for next year
- [ ] Share questions with advocate beforehand

**Priority:** HIGH  
**Related Requirements:** MP-04  
**Estimated Effort:** 8 story points

---

#### US-MP003: Upload Meeting Documents
**As a** parent  
**I want to** upload documents to reference during a meeting  
**So that** all my supporting evidence is organized and accessible

**Acceptance Criteria:**
- [ ] Upload multiple documents at once
- [ ] Document types: evaluations, medical reports, work samples, behavior logs
- [ ] Attach to specific agenda items or goals
- [ ] Tag documents for easy search
- [ ] Preview documents in-app
- [ ] Annotate/highlight key sections
- [ ] Share uploaded docs with team before meeting (optional)
- [ ] Quick access during meeting via mobile
- [ ] Create meeting document packet (PDF)
- [ ] Archive documents after meeting

**Priority:** MEDIUM  
**Related Requirements:** MP-05  
**Estimated Effort:** 8 story points

---

#### US-MP004: Generate Meeting Prep Packet
**As a** parent  
**I want to** generate a comprehensive meeting prep packet as a PDF  
**So that** I have a printed reference for the IEP meeting

**Acceptance Criteria:**
- [ ] Include current IEP summary
- [ ] Include all goals with current progress data
- [ ] Include services and accommodations summary
- [ ] Include parent questions and concerns
- [ ] Include relevant progress charts/graphs
- [ ] Include behavior data (if applicable)
- [ ] Include communication log summary
- [ ] Include checklist
- [ ] Professional formatting (not just raw data dump)
- [ ] Table of contents
- [ ] Page numbers
- [ ] Customizable (parent selects sections to include)
- [ ] Download as PDF
- [ ] Email to self or advocate
- [ ] Save template for future meetings

**Priority:** HIGH  
**Related Requirements:** MP-06  
**Estimated Effort:** 13 story points

---

#### US-MP005: Meeting Reminder Notifications
**As a** parent  
**I want to** receive reminders before IEP meetings  
**So that** I have time to prepare adequately

**Acceptance Criteria:**
- [ ] Notification 30 days before annual review
- [ ] Notification 14 days before meeting
- [ ] Notification 3 days before meeting
- [ ] Notification 1 day before meeting
- [ ] Notification includes meeting type, date, time, location
- [ ] Link to prep checklist
- [ ] Shows prep completion status
- [ ] Customizable reminder timing
- [ ] Push notification + email
- [ ] Snooze option
- [ ] Add to device calendar option

**Priority:** MEDIUM  
**Related Requirements:** MP-02  
**Estimated Effort:** 5 story points

---

## Progress Visualization

### Epic: Goal Progress Charts

#### US-PV001: Visual Progress Bars per Goal
**As a** parent  
**I want to** see color-coded progress bars for each goal  
**So that** I can quickly assess how my child is doing

**Acceptance Criteria:**
- [ ] Progress bar shows % toward target
- [ ] Color-coded: green (on track), yellow (needs attention), red (not progressing)
- [ ] Displays baseline, current level, and target
- [ ] Hover/tap for detailed numbers
- [ ] Shows time remaining in IEP cycle
- [ ] Projected completion indicator (will achieve, might achieve, unlikely)
- [ ] Historical comparison (vs. previous marking periods)
- [ ] Works on mobile and desktop
- [ ] Accessible (screen reader friendly)
- [ ] Printable view

**Priority:** HIGH  
**Related Requirements:** PT-04  
**Estimated Effort:** 8 story points

---

#### US-PV002: Progress Charts with Baseline and Target
**As a** parent  
**I want to** see line charts showing my child's progress toward each goal  
**So that** I can visualize growth over time

**Acceptance Criteria:**
- [ ] Line chart per goal
- [ ] X-axis: time (weeks or months)
- [ ] Y-axis: performance level
- [ ] Baseline marked clearly (starting point)
- [ ] Target marked clearly (goal)
- [ ] Current progress line
- [ ] Trend line (projected progress)
- [ ] Data points clickable for details
- [ ] Annotations for key events (breaks, service changes)
- [ ] Multiple goals on one chart (if related)
- [ ] Zoom and pan controls
- [ ] Export chart as image
- [ ] Responsive design (mobile and desktop)

**Priority:** HIGH  
**Related Requirements:** PT-04  
**Estimated Effort:** 13 story points

---

#### US-PV003: Dashboard Analytics Summary
**As a** parent  
**I want to** see a dashboard with key progress metrics  
**So that** I get a quick overview of my child's IEP status

**Acceptance Criteria:**
- [ ] Total goals count
- [ ] Goals achieved count and %
- [ ] Goals on track count and %
- [ ] Goals needing attention count and %
- [ ] Average progress rate across all goals
- [ ] Service hours completed vs. planned (current month)
- [ ] Upcoming milestones or reviews
- [ ] Recent communications count
- [ ] Active smart prompts count
- [ ] Visual charts and graphs
- [ ] Filterable by date range
- [ ] Drill down into details per metric
- [ ] Export dashboard as PDF
- [ ] Share dashboard with advocate

**Priority:** MEDIUM  
**Related Requirements:** PT-04, Dashboard  
**Estimated Effort:** 13 story points

---

#### US-PV004: Behavior Frequency Charts
**As a** parent or teacher  
**I want to** see charts of behavior incident frequency  
**So that** I can identify patterns and measure intervention effectiveness

**Acceptance Criteria:**
- [ ] Bar chart: incidents per day/week/month
- [ ] Line chart: trend over time
- [ ] Filter by behavior type
- [ ] Color-coded by severity
- [ ] Identify peak times (time of day, day of week)
- [ ] Compare before/after intervention implementation
- [ ] Annotate with intervention changes
- [ ] Export chart as image or PDF
- [ ] Share with IEP team
- [ ] Accessible on mobile

**Priority:** MEDIUM  
**Related Requirements:** Behavior tracking  
**Estimated Effort:** 8 story points

---

## Legal Knowledge Base

### Epic: Educational Resources

#### US-LK001: Browse Plain-Language Legal Articles
**As a** parent  
**I want to** read plain-language articles about special education law  
**So that** I can understand my rights and my child's entitlements

**Acceptance Criteria:**
- [ ] Article library organized by topic (IDEA, FERPA, 504, LRE, PWN, etc.)
- [ ] Articles written at 6th-8th grade reading level
- [ ] Search functionality
- [ ] Filter by topic, relevance, or state
- [ ] Each article includes: summary, key points, resources, related templates
- [ ] Links to official sources (federal regulations, DOE guidance)
- [ ] Bookmark articles
- [ ] Share articles via email or link
- [ ] Reading history
- [ ] Prominent legal disclaimer ("informational only, not legal advice")
- [ ] Suggest articles based on child's situation
- [ ] Update notifications when laws change

**Priority:** MEDIUM  
**Related Requirements:** LA-01  
**Estimated Effort:** 13 story points

---

#### US-LK002: State-Specific Regulations
**As a** parent  
**I want to** access special education regulations specific to my state  
**So that** I understand local requirements and timelines

**Acceptance Criteria:**
- [ ] Auto-detect or let parent select their state
- [ ] State-specific IEP timelines (evaluation, annual review, etc.)
- [ ] State evaluation requirements
- [ ] State dispute resolution processes
- [ ] Contact info for state special education department
- [ ] Parent Training & Information (PTI) center for state
- [ ] State complaint form and instructions
- [ ] Comparison to federal IDEA requirements
- [ ] Download state regulations as PDF
- [ ] Update notifications when state regs change
- [ ] Prominent disclaimer on interpretation

**Priority:** MEDIUM  
**Related Requirements:** LA-01, LA-05  
**Estimated Effort:** 13 story points

---

#### US-LK003: Timeline and Deadline Tracker
**As a** parent  
**I want** the system to automatically track IEP-related deadlines  
**So that** I can ensure the school complies with legal timelines

**Acceptance Criteria:**
- [ ] Track annual IEP review due date (365 days from last IEP)
- [ ] Track triennial evaluation due date (every 3 years)
- [ ] Track reevaluation consent timeline (60 days from request in most states)
- [ ] Track meeting notice requirements (10 days before meeting in most states)
- [ ] Track PWN timeline (reasonable time before implementation)
- [ ] Alert parent if timeline approaching or missed
- [ ] Color-coded status (green = on time, yellow = due soon, red = overdue)
- [ ] Manual deadline entry for other important dates
- [ ] Export timeline as report
- [ ] Include in compliance tracking
- [ ] State-specific timelines

**Priority:** HIGH  
**Related Requirements:** LA-02  
**Estimated Effort:** 13 story points

---

#### US-LK004: Downloadable Letter Templates
**As a** parent  
**I want to** access downloadable templates for common IEP requests  
**So that** I can communicate professionally and effectively

**Acceptance Criteria:**
- [ ] Template library organized by purpose
- [ ] Templates include:
  - Request for IEP meeting
  - Request for evaluation
  - Request for reevaluation
  - Request for records
  - Request for independent evaluation (IEE)
  - Request for Prior Written Notice
  - Disagreement with IEP decisions
  - Request for mediation
  - Formal complaint
- [ ] Templates in Word and PDF format
- [ ] Pre-filled with parent/child info (editable)
- [ ] Instructions for each template
- [ ] Sample scenarios
- [ ] State-specific versions where applicable
- [ ] Download or email to self
- [ ] Integration with smart prompt emails

**Priority:** MEDIUM  
**Related Requirements:** LA-03  
**Estimated Effort:** 8 story points

---

#### US-LK005: Action Triggers for Inactivity
**As a** parent  
**I want** the system to alert me if there's been no IEP activity for too long  
**So that** I'm prompted to follow up with the school

**Acceptance Criteria:**
- [ ] Alert if no progress update logged in 6 weeks
- [ ] Alert if no communication from school in 60 days
- [ ] Alert if annual review approaching with no meeting scheduled
- [ ] Alert if evaluation overdue
- [ ] Notification includes suggested action (email teacher, request meeting)
- [ ] Pre-drafted email for follow-up
- [ ] Snooze option if parent knows situation is okay
- [ ] Configurable inactivity thresholds
- [ ] Notification via app and email
- [ ] Link to relevant templates

**Priority:** MEDIUM  
**Related Requirements:** LA-04  
**Estimated Effort:** 8 story points

---

#### US-LK006: Local Advocacy Directory
**As a** parent  
**I want to** find local advocates, attorneys, and support organizations  
**So that** I can get help when needed

**Acceptance Criteria:**
- [ ] Searchable directory by location (zip code, city, state)
- [ ] Filter by type (advocate, attorney, parent group, disability-specific org)
- [ ] Each listing includes: name, contact info, services offered, languages spoken
- [ ] User ratings and reviews (optional)
- [ ] Link to organization website
- [ ] "Request info" button to contact directly
- [ ] Save favorites
- [ ] Share directory listings
- [ ] National organizations (Wrightslaw, COPAA, etc.)
- [ ] State PTI centers
- [ ] Legal aid organizations
- [ ] Disclaimer about referrals

**Priority:** LOW  
**Related Requirements:** LA-05  
**Estimated Effort:** 13 story points

---

## Accessibility Features

### Epic: WCAG 2.2 AA Compliance

#### US-AC001: Screen Reader Optimization
**As a** parent with visual impairment  
**I want** the app to work seamlessly with screen readers  
**So that** I can manage my child's IEP independently

**Acceptance Criteria:**
- [ ] All UI elements have proper ARIA labels
- [ ] Semantic HTML throughout
- [ ] Skip navigation links
- [ ] Focus indicators visible and clear
- [ ] Keyboard navigation fully supported
- [ ] Announce dynamic content changes
- [ ] Form labels and error messages announced
- [ ] Tables with proper headers
- [ ] Images have descriptive alt text
- [ ] Tested with NVDA (Windows) and VoiceOver (iOS/Mac)
- [ ] Charts and graphs have text alternatives
- [ ] Document structure (headings) logical

**Priority:** HIGH  
**Related Requirements:** AC-01  
**Estimated Effort:** 21 story points

---

#### US-AC002: High Contrast Mode
**As a** parent with low vision  
**I want** a high contrast color theme  
**So that** I can read content more easily

**Acceptance Criteria:**
- [ ] High contrast theme toggle in settings
- [ ] Meets WCAG AAA contrast ratios (7:1 for normal text)
- [ ] Black backgrounds with white/yellow text option
- [ ] White backgrounds with black text option
- [ ] No information conveyed by color alone
- [ ] Borders/outlines for all interactive elements
- [ ] Consistent across all screens
- [ ] Persists across sessions
- [ ] Syncs across devices
- [ ] Preview before applying

**Priority:** MEDIUM  
**Related Requirements:** AC-01  
**Estimated Effort:** 13 story points

---

#### US-AC003: Text Resizing Controls
**As a** parent with low vision  
**I want to** adjust text size without breaking the layout  
**So that** I can read comfortably

**Acceptance Criteria:**
- [ ] Text size options: small, medium, large, extra large
- [ ] Slider or buttons for adjustment
- [ ] Relative font sizing (rem/em) used throughout
- [ ] Layout remains functional at 200% zoom
- [ ] No horizontal scrolling at 200% zoom
- [ ] Images and icons scale appropriately
- [ ] Setting persists across sessions
- [ ] Syncs across devices
- [ ] Applies to all text (headings, body, buttons)
- [ ] Tested on mobile and desktop

**Priority:** MEDIUM  
**Related Requirements:** AC-01  
**Estimated Effort:** 8 story points

---

#### US-AC004: Multilingual Support
**As a** parent whose first language is not English  
**I want** the app in my preferred language  
**So that** I can understand and use it effectively

**Acceptance Criteria:**
- [ ] Language selector in settings and onboarding
- [ ] Support for at least 5 languages: English, Spanish, Mandarin, Vietnamese, Arabic (common in schools)
- [ ] All UI text translated
- [ ] User-entered content remains in original language
- [ ] Date/time formats localized
- [ ] Number formats localized
- [ ] Right-to-left (RTL) support for Arabic
- [ ] Translation quality reviewed by native speakers
- [ ] Legal disclaimer in each language
- [ ] Language preference syncs across devices
- [ ] Export/print documents in selected language
- [ ] Fallback to English if translation missing

**Priority:** MEDIUM  
**Related Requirements:** AC-02  
**Estimated Effort:** 34 story points (significant)

---

#### US-AC005: Simplified Language Mode
**As a** parent with cognitive disabilities or low literacy  
**I want** a simplified language mode  
**So that** I can understand complex IEP information

**Acceptance Criteria:**
- [ ] Toggle for "Simple Language" mode
- [ ] Rewrites complex sentences in plain language
- [ ] Reduces jargon and technical terms
- [ ] Provides definitions for required legal terms
- [ ] Shorter sentences and paragraphs
- [ ] More white space
- [ ] Bullet points instead of long paragraphs
- [ ] Icons and visuals to support text
- [ ] Reading level 5th-6th grade
- [ ] Option to see original text
- [ ] Applies to articles, emails, and system messages
- [ ] Maintains accuracy of legal information

**Priority:** LOW  
**Related Requirements:** AC-03  
**Estimated Effort:** 21 story points

---

#### US-AC006: Text-to-Speech for Content
**As a** parent with reading difficulties  
**I want** the app to read content aloud  
**So that** I can consume information audibly

**Acceptance Criteria:**
- [ ] Text-to-speech button on articles and documents
- [ ] Plays in background (can navigate away)
- [ ] Pause/resume controls
- [ ] Speed adjustment (0.5x to 2x)
- [ ] Highlight text as it's read
- [ ] Natural-sounding voices (not robotic)
- [ ] Language detection (reads in article's language)
- [ ] Works on mobile and desktop
- [ ] Accessible via keyboard shortcut
- [ ] Stop/restart options
- [ ] Skip forward/backward by sentence

**Priority:** LOW  
**Related Requirements:** AC-03  
**Estimated Effort:** 13 story points

---

## File Management & Document Library

### Epic: Document Organization

#### US-FM001: Centralized Document Library
**As a** parent  
**I want** all my child's IEP-related documents in one place  
**So that** I can find what I need quickly

**Acceptance Criteria:**
- [ ] Library view lists all uploaded documents
- [ ] Sort by: name, date uploaded, document type, file size
- [ ] Filter by: document type (IEP, evaluation, progress report, medical, etc.)
- [ ] Filter by: date range
- [ ] Search by filename or content (OCR)
- [ ] Folder/tag organization
- [ ] Thumbnail previews for PDFs and images
- [ ] Bulk select and download
- [ ] Delete with confirmation
- [ ] Storage usage indicator
- [ ] Export list as CSV
- [ ] Shareable folder links (with expiration)

**Priority:** MEDIUM  
**Related Requirements:** File management  
**Estimated Effort:** 13 story points

---

#### US-FM002: In-App PDF Viewer
**As a** parent  
**I want to** view PDF documents without leaving the app  
**So that** I can read IEPs and reports seamlessly

**Acceptance Criteria:**
- [ ] Renders PDFs in-app (no external viewer)
- [ ] Zoom in/out
- [ ] Scroll and pan
- [ ] Page navigation (jump to page X)
- [ ] Table of contents/bookmarks (if PDF has them)
- [ ] Search within PDF
- [ ] Highlight text
- [ ] Add annotations/comments
- [ ] Download option
- [ ] Share option
- [ ] Print option
- [ ] Works on mobile and desktop
- [ ] Handles large PDFs (100+ pages) efficiently

**Priority:** HIGH  
**Related Requirements:** IEP document viewing  
**Estimated Effort:** 13 story points

---

#### US-FM003: Document Tagging and Linking
**As a** parent  
**I want to** tag documents and link them to specific goals or meetings  
**So that** I can organize evidence by context

**Acceptance Criteria:**
- [ ] Add multiple tags per document
- [ ] Pre-defined tag library (IEP, evaluation, medical, progress, behavior)
- [ ] Create custom tags
- [ ] Link document to specific child, IEP, goal, meeting
- [ ] View all documents linked to a goal
- [ ] View all documents linked to a meeting
- [ ] Tag management (rename, merge, delete tags)
- [ ] Filter library by tags
- [ ] Search by tags
- [ ] Bulk tagging

**Priority:** MEDIUM  
**Related Requirements:** File management  
**Estimated Effort:** 8 story points

---

#### US-FM004: Document Sharing with Team
**As a** parent  
**I want to** share documents securely with my child's IEP team  
**So that** they have necessary information for meetings

**Acceptance Criteria:**
- [ ] Select documents to share
- [ ] Choose recipients (teacher, therapist, advocate, etc.)
- [ ] Share via email with secure link
- [ ] Share via in-app messaging
- [ ] Set expiration for shared links (7, 30, 90 days, or never)
- [ ] Revoke access at any time
- [ ] Track who accessed shared documents
- [ ] Require password for sensitive documents (optional)
- [ ] Notification when document is viewed
- [ ] Audit log of sharing actions
- [ ] Watermark option ("Confidential - For IEP Team Only")

**Priority:** LOW  
**Related Requirements:** File management  
**Estimated Effort:** 13 story points

---

#### US-FM005: OCR for Scanned Documents
**As a** parent  
**I want** the system to extract text from scanned IEP documents  
**So that** I can search within them and have data auto-populated

**Acceptance Criteria:**
- [ ] OCR runs automatically on uploaded images and scanned PDFs
- [ ] Extract text from IEP sections (goals, services, accommodations)
- [ ] Suggest auto-populating fields in app (with parent confirmation)
- [ ] Make documents searchable by content
- [ ] Works with handwriting (best effort)
- [ ] Handles multi-page documents
- [ ] Confidence indicator for extracted data
- [ ] Parent can edit extracted text
- [ ] Store original image + OCR text
- [ ] Processing notification (may take 1-2 minutes)
- [ ] Error handling for poor quality scans

**Priority:** LOW  
**Related Requirements:** IEP-01 (PDF extraction)  
**Estimated Effort:** 21 story points

---

## Notifications & Reminders

### Epic: Proactive Alerts

#### US-NR001: Customizable Notification Preferences
**As a** parent  
**I want to** control which notifications I receive  
**So that** I'm not overwhelmed but stay informed on what matters

**Acceptance Criteria:**
- [ ] Notification settings page
- [ ] Toggle each notification type: progress updates, smart prompts, meetings, communications, deadlines, compliance alerts
- [ ] Choose delivery method per type: push, email, SMS, in-app only
- [ ] Set frequency: immediate, daily digest, weekly digest
- [ ] Quiet hours (no notifications during set times)
- [ ] Different settings for weekdays vs. weekends
- [ ] Preview notifications before saving settings
- [ ] Test notification button
- [ ] Separate settings for each child (if multiple)
- [ ] Save and sync across devices

**Priority:** HIGH  
**Related Requirements:** Notifications  
**Estimated Effort:** 8 story points

---

#### US-NR002: Progress Update Reminders (Teacher)
**As a** teacher  
**I want** reminders to log progress updates  
**So that** I don't forget to document student progress

**Acceptance Criteria:**
- [ ] Weekly reminder for students without recent progress (configurable frequency)
- [ ] Shows list of students needing updates
- [ ] Shows number of days since last update per student
- [ ] One-tap to open progress entry form
- [ ] Snooze reminder for X days
- [ ] Mark student as "no session this week" to dismiss
- [ ] Settings to disable reminders during breaks
- [ ] Email and/or push notification
- [ ] Reminder timing customizable (Friday afternoons, for example)

**Priority:** MEDIUM  
**Related Requirements:** PT-03  
**Estimated Effort:** 8 story points

---

#### US-NR003: Overdue Deadline Alerts
**As a** parent  
**I want** alerts when IEP deadlines are missed  
**So that** I can hold the school accountable

**Acceptance Criteria:**
- [ ] Alert when annual IEP review is overdue
- [ ] Alert when evaluation is overdue
- [ ] Alert when meeting notice wasn't provided on time
- [ ] Alert when progress report is late
- [ ] Alert severity based on how overdue (yellow, orange, red)
- [ ] Notification includes: what's overdue, by how many days, suggested action
- [ ] Link to template email requesting compliance
- [ ] Log alert in compliance tracking
- [ ] Escalation recommendation if significantly overdue
- [ ] Dismiss option if parent knows situation is handled

**Priority:** HIGH  
**Related Requirements:** LA-02, Compliance  
**Estimated Effort:** 8 story points

---

#### US-NR004: Meeting Confirmation Reminders
**As a** parent  
**I want** reminders to confirm IEP meeting attendance  
**So that** the school knows I'm attending and has time to reschedule if I can't

**Acceptance Criteria:**
- [ ] Notification 7 days before meeting: "Confirm attendance"
- [ ] One-tap confirm button
- [ ] One-tap request to reschedule (sends email to school)
- [ ] If no confirmation after 3 days, send follow-up reminder
- [ ] Confirmation logged in meeting record
- [ ] Add to device calendar option
- [ ] Include meeting details (date, time, location, type)
- [ ] Option to add questions/concerns in response
- [ ] Notification to school when parent confirms/reschedules

**Priority:** MEDIUM  
**Related Requirements:** Meeting management  
**Estimated Effort:** 8 story points

---

## Security & Compliance

### Epic: Audit and Compliance

#### US-SC001: Comprehensive Audit Trail
**As a** system administrator  
**I want** all user actions logged in an audit trail  
**So that** we can track access and changes for FERPA compliance

**Acceptance Criteria:**
- [ ] Log all write operations (create, update, delete)
- [ ] Log all access to sensitive data (IEPs, evaluations, progress)
- [ ] Capture: user ID, action type, timestamp, IP address, affected resource, old/new values
- [ ] Immutable logs (can't be edited or deleted)
- [ ] Searchable by user, date range, action type, resource
- [ ] Export audit logs as CSV
- [ ] Admin-only access to full audit trail
- [ ] Parent can view their own access history
- [ ] Retention per compliance requirements (7 years for education records)
- [ ] Alert on suspicious activity (multiple failed logins, unusual access patterns)
- [ ] Performance: logging doesn't slow down app

**Priority:** HIGH  
**Related Requirements:** SC-03  
**Estimated Effort:** 21 story points

---

#### US-SC002: Consent Management UI
**As a** parent  
**I want to** grant and revoke access to my child's information  
**So that** I control who can see sensitive IEP data

**Acceptance Criteria:**
- [ ] Consent dashboard showing all granted access
- [ ] List: who has access, their role, what data they can see, granted date, expiration (if any)
- [ ] Grant access wizard: select person, select role, set permissions (view only, edit), set expiration
- [ ] Revoke access button with confirmation
- [ ] Instant revocation (user loses access immediately)
- [ ] Audit log of all consent changes
- [ ] Request consent from teacher/advocate (sends invitation)
- [ ] Notification when someone's access expires
- [ ] Export consent history
- [ ] Different levels of access (full IEP, progress only, documents only)

**Priority:** HIGH  
**Related Requirements:** UM-03, SC-01  
**Estimated Effort:** 13 story points

---

#### US-SC003: Data Retention Controls
**As a** parent  
**I want to** control how long my data is kept  
**So that** I can delete information when I no longer need it

**Acceptance Criteria:**
- [ ] Settings to choose retention period (keep indefinitely, or X years)
- [ ] Auto-delete after retention period expires
- [ ] Manual "Delete All Data" option with strong confirmation
- [ ] Explanation of what will be deleted
- [ ] Grace period (30 days to undo deletion)
- [ ] Export all data before deletion option
- [ ] Compliance with education records retention laws (warning if < 7 years)
- [ ] Cannot delete audit logs (compliance requirement)
- [ ] Notification before auto-deletion occurs
- [ ] Account closure = data deleted per schedule

**Priority:** MEDIUM  
**Related Requirements:** SC-04  
**Estimated Effort:** 13 story points

---

#### US-SC004: Privacy Policy & Terms in App
**As a** parent  
**I want** easy access to the privacy policy and terms  
**So that** I understand how my data is used

**Acceptance Criteria:**
- [ ] Privacy policy link in footer and settings
- [ ] Terms of service link in footer and settings
- [ ] Plain-language summary of key points
- [ ] Full legal text available
- [ ] Data collection transparency (what, why, who)
- [ ] User rights (access, correction, deletion)
- [ ] Contact info for privacy questions
- [ ] Version history (show what changed)
- [ ] Notification when policy updates
- [ ] Consent required if material changes
- [ ] Available in all supported languages

**Priority:** MEDIUM  
**Related Requirements:** SC-06  
**Estimated Effort:** 5 story points

---

#### US-SC005: Role-Based Access Revocation
**As an** admin  
**I want to** instantly revoke a user's access  
**So that** we can respond quickly to security concerns

**Acceptance Criteria:**
- [ ] Admin dashboard lists all users
- [ ] "Suspend" and "Revoke Access" buttons per user
- [ ] Confirm action with reason
- [ ] User immediately logged out of all sessions
- [ ] User cannot log back in
- [ ] Email notification to user (optional, for non-malicious cases)
- [ ] Audit log entry
- [ ] Can reactivate user later
- [ ] Bulk suspend option (e.g., former employees)
- [ ] Shows users who haven't logged in recently

**Priority:** MEDIUM  
**Related Requirements:** SC-05  
**Estimated Effort:** 8 story points

---

## Summary

### Total User Stories: 106

#### By Priority:
- **CRITICAL**: 13 stories (primarily Smart Legal Prompts)
- **HIGH**: 40 stories (core features and mobile app)
- **MEDIUM**: 43 stories (enhancements and support features)
- **LOW**: 10 stories (nice-to-have features)

#### By Epic:
- **Mobile App (Parent)**: 16 stories
- **Mobile App (Teacher/Therapist)**: 6 stories
- **Mobile App (Advocate)**: 4 stories
- **Smart Legal Prompts**: 14 stories
- **Lineage Comparison**: 5 stories
- **Meeting Preparation**: 5 stories
- **Progress Visualization**: 4 stories
- **Legal Knowledge Base**: 6 stories
- **Accessibility**: 6 stories
- **File Management**: 5 stories
- **Notifications & Reminders**: 4 stories
- **Security & Compliance**: 5 stories

#### By Estimated Effort:
- **Total Story Points**: Approximately 1,000+ story points
- **Small (5 pts)**: 20 stories
- **Medium (8 pts)**: 46 stories
- **Large (13 pts)**: 33 stories
- **Extra Large (21+ pts)**: 7 stories

---

## Recommended Implementation Order

### Phase 1 - Critical Value (Sprints 1-4)
1. Smart Legal Prompt detection algorithms (US-SP001 through US-SP010)
2. Smart Prompt email generation (US-SP011 through US-SP014)
3. Mobile parent dashboard and core navigation (US-M001 through US-M003)
4. Lineage comparison (US-LC001 through US-LC005)

### Phase 2 - Parent Empowerment (Sprints 5-7)
5. Progress visualization (US-PV001 through US-PV003)
6. Meeting preparation toolkit (US-MP001 through US-MP004)
7. Mobile progress tracking (US-M005 through US-M008)
8. Mobile smart prompts (US-M009 through US-M010)

### Phase 3 - Multi-Role Mobile (Sprints 8-10)
9. Mobile teacher/therapist features (US-M017 through US-M022)
10. Mobile advocate features (US-M023 through US-M026)
11. Mobile documents and settings (US-M013 through US-M016)

### Phase 4 - Legal & Compliance (Sprints 11-13)
12. Legal knowledge base (US-LK001 through US-LK006)
13. Security and compliance features (US-SC001 through US-SC005)
14. Notifications and reminders (US-NR001 through US-NR004)

### Phase 5 - Accessibility & Polish (Sprints 14-16)
15. Accessibility compliance (US-AC001 through US-AC006)
16. File management enhancements (US-FM001 through US-FM005)
17. Meeting features (US-MP005, US-M011, US-M012)

---

**Next Steps:**
1. Review and refine user stories with product team
2. Estimate effort with development team
3. Prioritize within each phase based on user feedback
4. Create detailed acceptance test plans
5. Begin Sprint 1 planning

---

*This document should be updated as stories are completed, refined, or new stories are identified.*
