# Security and Compliance Baseline

## Scope
This document defines operational security controls, legal/compliance requirements, and verification checklists for AskIEP APIs and clients.

## Non-Functional Security Requirements
- Authentication: All protected API routes must require a valid bearer token.
- Authorization: Every protected route must enforce role checks (`requireRole`) and resource ownership checks where applicable.
- Child-level isolation: Any route that accepts `childId` must verify that the child belongs to the requesting account (except `ADMIN`).
- Cross-account prevention: Non-admin users must never read or mutate another account's child, document, file, service, communication, behavior, goal, letter, compliance, or advocacy records.
- Token validation:
  - Reject missing, malformed, expired, or invalid-signature tokens.
  - Reject tokens with unknown roles.
  - Reject non-active account tokens.
- Storage access: File downloads must be owner-only, with `ADMIN` as the only bypass role.
- Auditability: Successful and denied access attempts to sensitive data must be logged with actor, path, method, and timestamp.
- Data-in-transit: TLS required in all environments.
- Data-at-rest: Encrypted storage required for document payloads and database volumes.
- Least privilege: Service accounts and admins must have minimal required permissions.
- Fail-safe defaults: Any authorization or ownership check failure returns `403` and no sensitive payload.

## Data Protection Measures
- Encryption:
  - TLS for API transport.
  - Encrypted cloud object storage for uploaded documents.
  - Encrypted database storage.
- Access controls:
  - JWT-based authentication for protected endpoints.
  - RBAC with explicit allow-lists.
  - Child-level ownership checks on child-scoped endpoints.
- Segregation:
  - User-scoped querying (`userId`) for list/read operations.
  - Child ownership checks for `childId` path/body/query access.
  - Service/file access pinned to child/account ownership.
- Monitoring and logs:
  - Request logs + audit logs for read/write access.
  - Audit records include request path/method, actor, and entity metadata.
- Consent and legal acknowledgment:
  - Terms of service and privacy policy acknowledgments are recorded.
  - AI informational-only acknowledgment is recorded.

## Penetration Testing Checklist
### Authentication and session
- [ ] Missing bearer token returns `401`.
- [ ] Invalid signature token returns `401`.
- [ ] Expired token returns `401`.
- [ ] Token with unknown role returns `401`.
- [ ] Token for inactive/suspended account is rejected.

### Authorization and RBAC
- [ ] Non-admin user cannot call admin endpoints.
- [ ] Resource write endpoints enforce role restrictions (for example, resource create/update/delete = `ADMIN`).
- [ ] Legal support and AI endpoints enforce intended role set.

### Ownership and multi-tenancy
- [ ] User A cannot access User B child IDs on any `/child/:childId` endpoint.
- [ ] User A cannot upload documents against User B child ID.
- [ ] User A cannot analyze User B documents by ID list.
- [ ] User A cannot access service logs/compliance/timeline for User B services.
- [ ] User A cannot download User B storage object keys.

### API hardening
- [ ] Validate body/query/params with schema enforcement.
- [ ] Confirm no sensitive fields are returned in unauthorized error responses.
- [ ] Confirm rate limiting is active and does not leak internals.

### Audit and traceability
- [ ] Successful sensitive GETs generate audit records.
- [ ] Sensitive write operations generate audit records.
- [ ] Unauthorized access attempts are logged with enough context for incident triage.

## Breach Response Procedure
### Detection and triage
1. Classify incident severity within 30 minutes of confirmation.
2. Assign incident commander, security lead, and communications owner.
3. Preserve volatile evidence (logs, request traces, affected IDs).

### Containment
1. Revoke compromised credentials/tokens.
2. Block suspicious IPs or disable affected routes/features.
3. Rotate relevant secrets/keys.

### Eradication and recovery
1. Patch root vulnerability and deploy.
2. Validate controls via targeted regression and security test cases.
3. Restore services under heightened monitoring.

### Notification
1. Notify internal stakeholders immediately after confirmation.
2. Notify impacted users without undue delay and no later than 72 hours after confirmed impact, unless law requires a shorter timeline.
3. Notification content must include:
   - Incident summary and timeline
   - Data categories impacted
   - Mitigations already taken
   - User actions recommended
   - Contact channel for support

### Post-incident actions
1. Complete root-cause analysis within 5 business days.
2. Publish corrective action plan with owners and due dates.
3. Update this checklist and tests to prevent recurrence.

## Legal/Compliance Notices (App Copy Requirements)
- AI informational-only disclaimer must be shown in AI output surfaces.
- Consent flow must include explicit acknowledgment for:
  - Terms of service
  - Privacy policy
  - AI informational-only notice
- Consent events must be timestamped and audit logged.
