# Notification Module Spec

## Overview

A unified `userNotification.send()` that fans out to exactly **three places**: Firebase FCM (mobile push), `notifications` table (in-app/web), and Email. Telegram and other channels remain standalone utilities — unchanged, called directly when needed.

---

## Architecture

```
Any trigger (API service, admin UI, scheduled job)
  └── userNotification.send(userId, { title, body, type?, data? })
        ├── [always]  INSERT → notifications table  ← web dashboard reads this
        ├── [always]  FCM push → Android + iOS      ← skipped silently if no tokens
        └── [always]  Email → sendEmail()           ← skipped silently if no email

Telegram / other channels → called directly, separate, unchanged
```

### Key Design Decisions
- **Three fixed channels** — DB, FCM, Email. No preference gating — caller decides when to send.
- **Silent skip** — no tokens = no FCM error thrown. No email = no email error thrown.
- **Read state is global** — reading on web marks it read on mobile too.
- **Stale FCM tokens** — auto-deleted when FCM returns `registration-token-not-registered`.
- **Telegram stays separate** — existing `sendTelegramMessage()` untouched, called directly by services that need it.

---

## DB Schema

### `notifications` table (in-app inbox)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `title` | varchar | |
| `body` | text | |
| `type` | varchar | e.g. `document_analyzed`, `iep_deadline`, `admin_message` |
| `data` | jsonb nullable | optional metadata for deep-link etc |
| `read` | boolean | default false |
| `read_at` | timestamp nullable | |
| `created_at` | timestamp | |

> Paranoid (soft delete) — follow existing model conventions (`underscored: true`).

### `device_tokens` table (FCM push)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `token` | varchar unique | FCM registration token |
| `platform` | varchar | `ios` or `android` |
| `created_at` | timestamp | |

---

## API Endpoints

### Mobile — register device token
```
POST /api/notifications/device-token
Auth: Bearer (any authenticated user)
Body: { token: string, platform: 'ios' | 'android' }
Response: { success: true }
```
Upsert by token — if token exists update userId/platform, else insert.

### Mobile/Web — delete device token (logout)
```
DELETE /api/notifications/device-token
Auth: Bearer
Body: { token: string }
Response: 204
```

### Web/Dashboard — list notifications
```
GET /api/notifications?unreadOnly=true&limit=20&offset=0
Auth: Bearer
Response: {
  notifications: Notification[],
  unreadCount: number
}
```

### Web/Dashboard — mark one read
```
PATCH /api/notifications/:id/read
Auth: Bearer
Response: { success: true }
```

### Web/Dashboard — mark all read
```
PATCH /api/notifications/read-all
Auth: Bearer
Response: { updated: number }
```

### Admin UI — send notification to user
```
POST /api/notifications/send
Auth: Bearer (requireRole ADMIN)
Body: { userId: string, title: string, body: string, type?: string, data?: Record<string,string> }
Response: { sent: number, failed: number }
```
`sent` = channels successfully dispatched. `failed` = FCM/email failures (in-app always counts as sent).

---

## Service API

```ts
// The single public interface
userNotification.send(
  userId: string,
  notification: {
    title: string;
    body: string;
    type?: string;                    // default: 'general'
    data?: Record<string, string>;    // optional deep-link / metadata
  }
): Promise<void>
```

Fan-out internals (private, all run in parallel via `Promise.allSettled`):
```ts
_saveToDb(userId, notification)     // always — source of truth for web
_sendFcm(userId, notification)      // always — silently skipped if no device tokens
_sendEmail(userId, notification)    // always — silently skipped if user has no email
```

`Promise.allSettled` — one channel failing does not block others.

---

## File Plan

### API
```
src/modules/notification/
  notification.model.ts         ← Notification + DeviceToken Sequelize models
  notification.service.ts       ← userNotification.send() + channel helpers
  notification.controller.ts    ← all endpoint handlers
  notification.routes.ts        ← route definitions + middleware
  notification.validation.ts    ← Zod schemas

src/config/firebase.ts          ← add getFirebaseMessaging() (admin SDK already initialized)

db/migrations/
  YYYYMMDD-0001-create-notifications.ts
  YYYYMMDD-0002-create-device-tokens.ts

src/app.ts                      ← mount notificationRouter
```

### Web UI
```
src/components/notifications/
  NotificationBell.tsx          ← bell icon + unread count badge (polls every 30s)
  NotificationPanel.tsx         ← dropdown list, click-to-mark-read, mark-all-read

src/domain/notifications/
  notifications.service.ts      ← apiRequest wrappers for all endpoints
```

### Mobile
```
src/services/notificationService.ts
  ├── requestPermission()       ← iOS permission prompt
  ├── getAndRegisterToken()     ← getFCMToken() → POST /api/notifications/device-token
  ├── onTokenRefresh()          ← re-register when token changes
  └── setupForegroundHandler()  ← show in-app banner when app is open
```

**Add to `App.tsx`:** call `setupNotifications()` inside `AuthProvider` after login confirmed.

---

## Channel Fan-out Logic

```ts
async send(userId: string, notification: UserNotification): Promise<void> {
  // Run all three in parallel — one failure doesn't block others
  await Promise.allSettled([
    this.saveToDb(userId, notification),
    this.sendFcm(userId, notification),
    this.sendEmail(userId, notification),
  ]);
}

private async saveToDb(userId, notification) {
  await notificationRepo.create({ userId, ...notification, read: false });
}

private async sendFcm(userId, notification) {
  const tokens = await deviceTokenRepo.findByUserId(userId);
  if (!tokens.length) return; // silent skip
  await this.sendFcmToTokens(tokens, notification);
}

private async sendEmail(userId, notification) {
  const user = await userRepo.findById(userId);
  if (!user?.email) return; // silent skip
  await sendEmail({ to: user.email, subject: notification.title, body: notification.body });
}
```

> Telegram stays separate — services call `sendTelegramMessage()` directly when needed.

---

## Stale Token Handling

```ts
async sendFcm(tokens, notification) {
  const response = await messaging.sendEachForMulticast({ tokens: tokens.map(t => t.token), notification });
  for (const [i, result] of response.responses.entries()) {
    if (result.error?.code === 'messaging/registration-token-not-registered') {
      await deviceTokenRepo.deleteByToken(tokens[i].token); // auto-cleanup
    }
  }
}
```

---

## Mobile Platform Setup Notes

### Android
- Works out of the box — `google-services.json` already in `android/app/`
- No extra native config needed

### iOS
Two things required **outside of code**:
1. **APNs Auth Key (.p8)** — upload to Firebase console → Project Settings → Cloud Messaging → Apple app config
2. **Xcode Capabilities** — enable `Push Notifications` + `Background Modes → Remote notifications` in target Signing & Capabilities

### Mobile package to add
```
@react-native-firebase/messaging  (same version as existing @react-native-firebase/app ^23.8.6)
```

---

## Token Lifecycle

| Event | Action |
|---|---|
| App start / login | `getAndRegisterToken()` → POST device-token (upsert) |
| `onTokenRefresh` fires | POST device-token again |
| FCM returns `registration-token-not-registered` | Auto-delete token from DB |
| User logs out | DELETE /api/notifications/device-token |

---

## Implementation Order

1. DB migrations (`notifications` + `device_tokens`)
2. `notification.model.ts` — both models
3. `firebase.ts` — add `getFirebaseMessaging()`
4. `notification.service.ts` — `send()` fan-out
5. `notification.controller.ts` + `notification.routes.ts` + `notification.validation.ts`
6. Mount in `app.ts`
7. Web UI — `NotificationBell` + `NotificationPanel` + `notifications.service.ts`
8. Mobile — `notificationService.ts` + `App.tsx` hook
