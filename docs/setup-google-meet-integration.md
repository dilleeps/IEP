# Google Meet Integration Setup

> **Status**: Not configured — Jitsi Meet fallback links are generated automatically until this is completed.

## Overview

The counselor booking system can automatically generate **Google Meet** links when appointments are accepted. This requires a server-side **OAuth 2.0 Web Application** client from Google Cloud Console.

> **Important**: The existing Firebase/Expo web client ID (`454503056114-i9q8vavt8v6...`) is a **public** client without a secret — it **cannot** be used for the Calendar API. You need a separate server-side Web client with a `client_secret` from the same GCP project (`gen-lang-client-0350197188`).

---

## Steps

### 1. Enable the Google Calendar API

1. Go to [Google Cloud Console → APIs & Services → Library](https://console.cloud.google.com/apis/library?project=gen-lang-client-0350197188)
2. Search for **Google Calendar API**
3. Click **Enable**

### 2. Create an OAuth 2.0 Client

1. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0350197188)
2. Click **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: e.g. `AskIEP Counselor Calendar`
5. Under **Authorized redirect URIs**, add:
   - Local: `http://localhost:3000/api/v1/counselor/google/callback`
   - Dev: `https://devapi.askiep.com/api/v1/counselor/google/callback`
   - Production: `https://api.askiep.com/api/v1/counselor/google/callback`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Uncomment and fill in the following lines at the bottom of `.env` (root of monorepo):

```env
GOOGLE_OAUTH_CLIENT_ID=<your-web-oauth-client-id>.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret>
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/v1/counselor/google/callback
```

### 4. Restart the API Server

```bash
task dev:api
# or
cd apps/api && npm run dev
```

### 5. Connect Google from Counselor Profile

1. Log in as a counselor
2. Go to **Profile → Google Meet Integration**
3. The badge should now show a "Connect" option
4. Complete the Google OAuth flow
5. Accept an appointment — a **Google Meet link** will be auto-generated

---

## How It Works

- When a counselor **accepts** an appointment (or clicks "Create Meet Link"), the API calls `createOrUpdateMeetingForAcceptedAppointment`
- If Google Calendar is configured **and** the counselor has connected their Google account → a real **Google Meet** link is created via the Calendar API
- If Google Calendar is **not** configured or the counselor hasn't connected → a **Jitsi Meet** fallback link is generated (`https://meet.jit.si/askiep-<id>`)
- The meet link is stored on the appointment and shown to both parent and counselor

## Related Files

| File | Purpose |
|---|---|
| `apps/api/src/modules/counselor/google-calendar.service.ts` | Google Calendar API wrapper |
| `apps/api/src/modules/counselor/counselor.service.ts` | `createOrUpdateMeetingForAcceptedAppointment` (line ~1020) |
| `apps/api/src/modules/counselor/counselor.routes.ts` | `/google/callback` OAuth redirect handler |
| `apps/ui/src/app/pages/counselor/CounselorProfilePage.tsx` | Google connect UI |
| `apps/ui/src/app/pages/counselor/CounselorAppointmentsPage.tsx` | "Create Meet Link" button |
| `.env` | Environment variables (bottom section) |
