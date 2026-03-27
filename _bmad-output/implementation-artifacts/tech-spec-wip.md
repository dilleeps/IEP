---
title: 'Legal Support Chat with Session Memory'
slug: 'legal-support-chat-session-memory'
created: '2026-02-08'
status: 'in-progress'
stepsCompleted: [1]
tech_stack: []
files_to_modify: []
code_patterns: []
test_patterns: []
---

# Tech-Spec: Legal Support Chat with Session Memory

**Created:** 2026-02-08

## Overview

### Problem Statement

The `/legal-support` page is empty/static and lacks a legal FAQ chatbot. Users need a dedicated Legal Support experience (separate from Advocacy Lab) with quick queries, a legal disclaimer, and an AI assistant that can answer IDEA-related questions. The current UI mock shows the desired layout but has no backend integration or session handling.

### Solution

Implement a Legal Support chat experience that matches the provided mock UI: quick-query buttons, legal disclaimer, chat pane with typing indicator, and a “New Chat” action. Back it with new Legal Support agent endpoints under `/api/v1/agent/legal-support/sessions`. Maintain session context in-memory per session; “New Chat” starts a fresh session and clears thread. Use the `LEGAL_SUPPORT` system prompt to generate plain-language answers with “What to say” guidance and explicit “not legal advice” messaging.

### Scope

**In Scope:**
- Backend: new Legal Support agent endpoints (create session, send message returning assistant reply; optional get session) with in-memory session context and `LEGAL_SUPPORT` prompt.
- Frontend: replace `/legal-support` content with the mock chat layout; load or create a session on entry; render current session thread; quick queries send messages; typing indicator; “New Chat” resets session/thread; friendly error bubble on failures; keep legal disclaimer visible.
- Auth: bearer-authenticated API calls using existing client helpers.

**Out of Scope:**
- Changes to Advocacy Lab endpoints or prompts; other conversation types.
- Attachments/uploads; multi-thread list UI/history browser; persistence beyond in-memory session.
- File uploads or external resources; offline support.

## Context for Development

### Codebase Patterns

- UI uses Vite + React 19, Tailwind 4 utilities, `@/*` alias, `apiRequest` helpers for authenticated calls.
- Routing: `/legal-support` page already registered; current `LegalSupportPage` shows resource list.
- API: Express 5, NodeNext ESM with `.js` suffix on local imports; `authenticate` middleware for protected routes; Zod validation; `AppError` for expected failures; rate limiting applied globally.
- AI patterns: Existing advocacy routes use session/message pattern; new legal-support agent should follow router → controller → service layering and reuse ai/gemini client where appropriate with new system prompt.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| apps/ui/src/app/pages/LegalSupportPage.tsx | Target page to replace content with chat UI |
| apps/ui/src/app/routing/AppRoutes.tsx | Route entry for `/legal-support` |
| apps/ui/src/lib/config.ts | API endpoint configuration |
| apps/ui/src/lib/logger.ts | Logging helper |
| apps/ui/src/domain/* | Patterns for service clients and types |
| apps/api/src/modules/ai | AI/gemini integration patterns |
| apps/api/src/middleware/authenticate.ts | Bearer auth |
| apps/api/src/modules/advocacy/advocacy.routes.ts | Reference for session/message route patterns |
| apps/api/src/app.ts / server.ts | Router mounting and middleware order |

### Technical Decisions

- **Dedicated legal agent**: New `/api/v1/agent/legal-support/sessions` namespace to avoid touching Advocacy Lab; uses `LEGAL_SUPPORT` system prompt.
- **Session storage**: In-memory per session (no DB persistence); session ID returned on create; server retains message history for that session during its lifetime.
- **Synchronous reply**: `send message` endpoint returns assistant reply in the same response; no polling required.
- **Auth**: Require bearer token via existing auth middleware; rate limit with existing limiter.
- **UI layout**: Match mock (quick queries left, chat right), keep legal disclaimer banner, typing indicator, and “New Chat” to reset state and start a new session.

## Implementation Plan

### Tasks

1) Backend: Legal Support agent endpoints
- File: apps/api/src/modules/agent/legal-support/legalSupport.routes.ts (NEW)
  - POST `/sessions` → create session with in-memory store; return `sessionId`.
  - POST `/sessions/:sessionId/messages` → accept `{ message: string }`, run Gemini with `LEGAL_SUPPORT` prompt and session history, return `{ reply, messages }`.
  - Optional: GET `/sessions/:sessionId` to return current messages for resilience.
- File: apps/api/src/modules/agent/legal-support/legalSupport.controller.ts (NEW)
  - Wire to service; map requests/responses; use `AppError` for missing session/invalid input.
- File: apps/api/src/modules/agent/legal-support/legalSupport.service.ts (NEW)
  - Manage in-memory sessions (Map keyed by sessionId); append user/assistant messages; call Gemini client with `LEGAL_SUPPORT` prompt; enforce max history length.
  - Use types for `LegalSupportMessage` ({ role: 'user' | 'assistant'; content: string }).
- File: apps/api/src/modules/agent/legal-support/legalSupport.validation.ts (NEW)
  - Zod schemas for create/send; validate message presence/min length.
- File: apps/api/src/modules/agent/legal-support/legalSupport.types.ts (NEW)
  - DTOs for requests/responses; session shape.
- File: apps/api/src/modules/agent/legal-support/index.ts (NEW)
  - Export router for mounting.
- File: apps/api/src/app.ts (or routes index)
  - Mount `/api/v1/agent/legal-support` with `authenticate`, rate limit, validate middleware.
- File: apps/api/src/modules/ai/gemini.service.ts
  - Add helper for legal support prompt if needed (reuse `LEGAL_SUPPORT` string from shared constants or define new constant).

2) Frontend: Legal Support chat UI
- File: apps/ui/src/app/pages/LegalSupportPage.tsx
  - Replace resource list with chat layout matching mock.
  - Manage `messages`, `sessionId`, `input`, `isLoading`.
  - On mount: create session (POST `/agent/legal-support/sessions`) and store `sessionId`.
  - Send flow: optimistic user message push, call POST `/agent/legal-support/sessions/{id}/messages`, append assistant reply, handle errors with fallback bubble.
  - Quick queries trigger send with preset text.
  - “New Chat” → create new session, clear messages.
  - Typing indicator while loading; auto-scroll to bottom on updates.
- File: apps/ui/src/domain/legal/legal.service.ts (NEW)
  - Methods: `createSession()`, `sendMessage(sessionId, message)`, optional `getSession(sessionId)`; use `apiRequest` with bearer token.
- File: apps/ui/src/domain/legal/types.ts (extend)
  - Define `LegalSupportMessage`, `CreateSessionResponse`, `SendMessageResponse`.
- File: apps/ui/src/lib/config.ts
  - Add endpoint paths for legal support agent.
- File: apps/ui/src/app/ui components
  - Reuse existing primitives; ensure Tailwind classes match mock; keep disclaimer block.

3) Error handling, logging, resilience
- UI: show inline assistant bubble with error text on failure; disable send while loading; guard against empty input.
- Backend: return `AppError` for missing session or invalid body; cap history length to prevent runaway context; log errors via existing logger.

4) Testing
- Backend: unit tests for service (session creation, message append, missing session error, history cap) and controller (happy path/validation errors).
- Frontend: light tests if feasible (service call structure), or manual test checklist.

### Acceptance Criteria

- Given an authenticated user, when they open `/legal-support`, a session is created and the chat UI renders with quick queries and disclaimer.
- Given the user sends a message (or clicks a quick query), when the request succeeds, the assistant reply appears in the thread; loading indicator shows during the call.
- Given the user clicks “New Chat”, a new session is created, prior thread clears, and subsequent messages use the new sessionId.
- Given the API fails (network or server), an inline assistant bubble shows a friendly error; UI remains usable for retry.
- Backend enforces auth, validates request bodies, and uses the `LEGAL_SUPPORT` prompt; no changes are made to Advocacy Lab endpoints.

## Additional Context

### Dependencies

- Backend: existing ai/gemini client; no new external deps expected.
- Frontend: reuse existing `apiRequest` helper; no new deps.

### Testing Strategy

- Backend: unit tests for service logic; controller tests for 200/400/401/404 paths.
- Frontend: manual checklist—send message, quick query, New Chat, error path, auto-scroll, loading indicator.

### Notes

- Keep imports ordered stdlib → third-party → local; API local imports need `.js` suffix. Use `authenticate` and rate limiting on the new router. Keep messages in-memory (Map) and optionally cap history length.
