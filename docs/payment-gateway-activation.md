# Payment Gateway Activation Guide

This guide explains how to move counselor appointment payments from **mock mode** to a **real payment provider** with minimal code churn.

## Current State (March 2026)

- Backend creates and confirms checkout sessions through `PaymentGatewayProvider`.
- The active implementation is `MockPaymentGatewayProvider`.
- Parent UI uses a session flow:
  1. Create payment session
  2. Show checkout dialog
  3. Confirm payment by `paymentSessionId`
- Payment status is finalized by backend appointment update (`PENDING` -> `PAID`).

## Activation Goal

Switch provider implementation while keeping existing appointment/payment APIs stable.

## Backend Changes Required

### 1) Add Real Provider Class

Create a new provider in counselor payment module, for example:
- `StripePaymentGatewayProvider` (or Razorpay/PayPal/etc.)

It must implement:
- `createCheckoutSession(input)`
- `confirmCheckoutSession(sessionId)`

Contract to preserve:
- Return `sessionId`
- Return `transactionReference` on confirmation
- Keep amount in cents and currency fields aligned with counselor service pricing

### 2) Provider Selection via Config

Refactor provider instantiation in counselor service from hard-coded mock to config-based selection.

Suggested env:
- `PAYMENT_GATEWAY_PROVIDER=mock|stripe`
- Provider secrets (for example):
  - `PAYMENT_SECRET_KEY`
  - `PAYMENT_WEBHOOK_SECRET`

Recommended pattern:
- Add a provider factory (small function) that returns the correct implementation.
- Default to `mock` in local/dev.

### 3) Webhook Verification (Recommended)

If the real provider is async, add webhook endpoint to confirm payment events.

Minimum checks:
- Signature verification
- Idempotency guard (ignore duplicate events)
- Appointment ownership and status validation
- Update payment status only once

### 4) Persistence and Audit

Store/retain:
- Gateway name
- Gateway session id
- Transaction reference
- Finalized timestamp

This improves traceability for refunds, disputes, and reconciliation.

## Frontend Changes Required

UI flow is already session-based and mostly ready.

When activating real gateway:
- Replace mock dialog action with redirect/open checkout URL when required.
- Keep `Complete Payment` action compatible with backend confirmation contract.
- Continue showing payment states from backend (`PENDING`, `PAID`, etc.).

## API Contracts to Keep Stable

Keep these routes/behavior unchanged for minimal impact:
- `POST /appointments/mine/:id/payment/session`
- `PATCH /appointments/mine/:id/payment`

This lets UI/mobile continue working while backend provider changes.

## Rollout Checklist

1. Implement real provider class
2. Add config-based provider selection
3. Add webhook endpoint + signature verification
4. Test sandbox success/failure/timeout flows
5. Verify idempotency and duplicate webhook handling
6. Enable provider in staging
7. Run QA regression (book, pay, cancel, reschedule)
8. Promote to production with monitoring

## Rollback Plan

If issues occur:
- Set provider back to `mock`
- Disable real-provider webhook processing
- Keep appointment booking flow active

Because session endpoints remain stable, rollback is low-risk.

## QA Notes

- In mock mode, dialog must display a clear "Mock Mode" label.
- Payment should only succeed for accepted appointments with pending payment.
- Cancelled appointments must not remain payable.
