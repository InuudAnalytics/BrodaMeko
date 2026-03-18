# In-App Calling Integration (Easy + Production-Ready Plan)

## Goal

Enable true in-app audio calling (no phone app, no exposed phone numbers) with the fastest path to production.

## Recommended Choice (for easiest integration)

### Option A (Recommended): Stream Video SDK

Why:

- Very fast React Native integration
- Managed signaling/media infra (less backend complexity)
- In-app audio/video flows already solved
- Has a free tier (verify current limits in Stream dashboard)

### Option B (Alternative): Agora Voice SDK

Why:

- Strong real-time quality
- Good free tier for low-medium usage
- Slightly more setup complexity than Stream for full call UX/state

### Option C (Not recommended for your current speed goal)

- Raw WebRTC + custom signaling + TURN
- Most flexible, but highest backend/mobile complexity and longer stabilization

---

## What You Need To Create (Accounts)

## 1) Stream account (recommended)

1. Sign up at Stream dashboard
2. Create an app (region close to users)
3. Copy:

- `STREAM_API_KEY` (frontend-safe, example: `your_stream_api_key`)
- `STREAM_API_SECRET` (backend only)
- App ID / environment details

## 2) Push credentials (already likely present, verify)

- FCM for Android
- APNs for iOS
- Needed for incoming call notifications when app is backgrounded

## 3) Optional monitoring

- Sentry (mobile + backend)
- Structured logs for call lifecycle

---

## Architecture (Recommended)

- Call engine + signaling: Stream
- App authorization: your backend (JWT + call participant checks)
- Privacy model: app user IDs only (never raw phone numbers)
- Call context: order/job scoped eligibility from your DB

Flow:

1. User taps `Call seller` / `Call mechanic`
2. App calls your backend `POST /api/v1/calls/start`
3. Backend validates caller/callee are allowed for that order/job
4. Backend creates/fetches Stream call + returns call metadata
5. App requests short-lived Stream token from backend (`POST /api/v1/calls/token`)
6. App joins in-app call UI

---

## Backend Work Required (C:\bm\BrodaMeko-Backend)

## Env vars

- `STREAM_API_KEY`
- `STREAM_API_SECRET`
- optional: `STREAM_APP_REGION`

## Minimal endpoints to add

Prefix: `/api/v1/calls`

1. `POST /calls/start`
   Request:

```json
{
  "context_type": "order",
  "context_id": "<order_uuid>",
  "callee_id": "<user_uuid>",
  "audio_only": true
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "call_id": "<uuid_or_stream_call_id>",
    "stream_call_type": "default",
    "stream_call_id": "order_<order_uuid>",
    "caller_id": "<uuid>",
    "callee_id": "<uuid>",
    "context_type": "order",
    "context_id": "<uuid>",
    "state": "ringing"
  }
}
```

2. `POST /calls/token`
   Request:

```json
{
  "user_id": "<current_user_uuid>"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "stream_api_key": "<key>",
    "token": "<short_lived_token>",
    "expires_at": "2026-03-17T13:00:00Z"
  }
}
```

3. `POST /calls/end`
   Request:

```json
{
  "call_id": "<id>",
  "reason": "hangup"
}
```

4. (Optional but recommended) `GET /calls/:id`

- For resume/rejoin and state sync

## Required backend authorization rules

- Order calls:
  - buyer <-> seller linked to order items only
- Job calls:
  - car_owner <-> assigned mechanic only
- Reject all non-participants
- Never include phone numbers in API/push payloads

## Required backend persistence

Keep internal call records (`calls`, `call_events`) for support/audit.

Suggested `calls` fields:

- `id`, `context_type`, `context_id`, `caller_id`, `callee_id`
- `provider` (`stream`)
- `provider_call_id`
- `status` (`ringing|accepted|ended|missed|failed`)
- `started_at`, `ended_at`, `created_at`, `updated_at`

---

## Frontend Work Required (C:\bm\BrodaMeko)

## 1) Install SDK

For Stream:

- `@stream-io/video-react-native-sdk`
- (plus any peer deps required by current Stream RN docs)

## 2) iOS/Android permissions

- Android: `RECORD_AUDIO`
- iOS: `NSMicrophoneUsageDescription`

## 3) New frontend services

- `src/services/calls.service.js`
  - `startCall`, `fetchCallToken`, `endCall`, `getCall`

## 4) New call state holder

- `src/context/CallContext.js`
  - call lifecycle state
  - active call metadata
  - token refresh handling

## 5) New screens

- `OutgoingCallScreen`
- `IncomingCallScreen`
- `InCallScreen`

## 6) Existing screen edits

- Replace current `Call seller` external dial behavior with in-app call launch
- Use backend-provided `callee_id` only

## 7) Notification routing

- Handle push payload with `call_id`, `context_type`, `context_id`
- Navigate to `IncomingCallScreen` or rejoin `InCallScreen`

---

## Simple Implementation Plan (Session-by-session)

## Session 1 (fast MVP)

- Stream account setup
- Backend: `/calls/start`, `/calls/token`, `/calls/end`
- Frontend: outgoing + active call screens
- Foreground in-app audio calls

## Session 2

- Incoming call screen + push wake flow
- Call timeout/missed/declined states
- Role/context auth hardening

## Session 3

- Background behavior polish
- Retry/reconnect handling
- Full audit + metrics dashboard

---

## Testing Checklist

- Android->Android call
- iOS->iOS call
- Android->iOS call
- Incoming call while app in background
- Permission denied mic flow
- Unauthorized caller/callee blocked
- No phone number appears anywhere

---

## What You Tell Backend Engineer (copy/paste)

"We are implementing in-app calling with Stream. Please add `POST /api/v1/calls/start`, `POST /api/v1/calls/token`, and `POST /api/v1/calls/end`. Enforce strict order/job participant auth (no non-participants). Return Stream call metadata + short-lived user token. Never expose phone numbers in payloads. Persist call lifecycle for support audit."

---

## Important Notes

- Free tier limits change; verify current pricing/limits before go-live.
- Keep all provider secrets on backend only.
- Do not block launch on PSTN fallback; app-to-app calling is enough for your current requirement.

---

## Backend Handoff Message (Send This As-Is)

Team,

Frontend call UI is now scaffolded and ready (`Outgoing`, `Incoming`, `In-Call`, `Ended` screens in shared/calls).
To integrate in-app calling cleanly into chat and order flows, we need the following backend API contracts and payloads.

### Non-negotiable requirements
- No phone numbers in call APIs/events/push payloads.
- All call eligibility must be validated by context (`order` or `job`) on backend.
- Always return participant identity fields needed by UI:
  - `id`
  - `full_name`
  - `avatar_url` (or `avatar.url`)
  - `role`
- Use authenticated user from token as caller (never trust caller_id from client).

---

### 1) Start Call
**Endpoint**: `POST /api/v1/calls/start`

**Request body**
```json
{
  "context_type": "order",
  "context_id": "<order_uuid_or_job_uuid>",
  "callee_id": "<user_uuid>",
  "audio_only": true,
  "client_call_id": "optional-idempotency-key"
}
```

**Validation rules**
- `context_type` must be `order` or `job`.
- `context_id` must exist.
- `callee_id` must be a valid participant for that context.
- Caller must be authenticated and allowed for context.
- Reject cross-context/non-participant calls with `403`.
- Rate limit initiate endpoint.
- Enforce one active call per context pair (or defined concurrency policy).

**Success response (200)**
```json
{
  "status": "success",
  "message": "call started",
  "data": {
    "call_id": "<internal_call_uuid>",
    "provider": "stream",
    "provider_call_type": "default",
    "provider_call_id": "order_<context_uuid>",
    "audio_only": true,
    "state": "ringing",
    "context": {
      "type": "order",
      "id": "<context_uuid>"
    },
    "participants": {
      "caller": {
        "id": "<uuid>",
        "full_name": "Dumebi Okeke",
        "avatar_url": "https://...",
        "role": "car_owner"
      },
      "callee": {
        "id": "<uuid>",
        "full_name": "Mebi Autos",
        "avatar_url": "https://...",
        "role": "seller"
      }
    },
    "created_at": "2026-03-17T20:10:00Z",
    "expires_at": "2026-03-17T20:10:30Z"
  }
}
```

**Error examples**
- `400` invalid payload
- `401` unauthorized
- `403` caller not allowed for context
- `404` context not found
- `409` call already active
- `429` rate limited

---

### 2) Get Call Token (Provider Token)
**Endpoint**: `POST /api/v1/calls/token`

**Request body**
```json
{
  "call_id": "<internal_call_uuid>"
}
```

**Behavior**
- Verify requester is one of call participants.
- Mint short-lived provider token for requester.
- Return provider key + token + expiry.

**Success response (200)**
```json
{
  "status": "success",
  "data": {
    "provider": "stream",
    "api_key": "<stream_public_api_key>",
    "token": "<short_lived_user_token>",
    "expires_at": "2026-03-17T21:10:00Z",
    "user": {
      "id": "<uuid>",
      "full_name": "Dumebi Okeke",
      "avatar_url": "https://...",
      "role": "car_owner"
    }
  }
}
```

---

### 3) Accept Call
**Endpoint**: `POST /api/v1/calls/{call_id}/accept`

**Request body**
```json
{
  "accepted": true
}
```

**Success response**
```json
{
  "status": "success",
  "message": "call accepted",
  "data": {
    "call_id": "<uuid>",
    "state": "accepted",
    "started_at": "2026-03-17T20:10:07Z"
  }
}
```

---

### 4) Reject Call
**Endpoint**: `POST /api/v1/calls/{call_id}/reject`

**Request body**
```json
{
  "reason": "declined"
}
```

**Success response**
```json
{
  "status": "success",
  "message": "call rejected",
  "data": {
    "call_id": "<uuid>",
    "state": "rejected",
    "ended_at": "2026-03-17T20:10:05Z",
    "end_reason": "declined"
  }
}
```

---

### 5) End Call
**Endpoint**: `POST /api/v1/calls/end`

**Request body**
```json
{
  "call_id": "<internal_call_uuid>",
  "reason": "hangup"
}
```

**Allowed reasons**
- `hangup`
- `declined`
- `missed`
- `timeout`
- `network_error`
- `failed`

**Success response**
```json
{
  "status": "success",
  "message": "call ended",
  "data": {
    "call_id": "<uuid>",
    "state": "ended",
    "ended_at": "2026-03-17T20:14:11Z",
    "end_reason": "hangup",
    "duration_seconds": 244
  }
}
```

---

### 6) Get Call Details (for rejoin/resume)
**Endpoint**: `GET /api/v1/calls/{call_id}`

**Success response**
```json
{
  "status": "success",
  "data": {
    "call_id": "<uuid>",
    "provider": "stream",
    "provider_call_type": "default",
    "provider_call_id": "order_<context_uuid>",
    "audio_only": true,
    "state": "ringing",
    "context": {
      "type": "order",
      "id": "<context_uuid>"
    },
    "participants": {
      "caller": {
        "id": "<uuid>",
        "full_name": "Dumebi Okeke",
        "avatar_url": "https://...",
        "role": "car_owner"
      },
      "callee": {
        "id": "<uuid>",
        "full_name": "Mebi Autos",
        "avatar_url": "https://...",
        "role": "seller"
      }
    },
    "created_at": "2026-03-17T20:10:00Z",
    "started_at": "2026-03-17T20:10:07Z",
    "ended_at": null,
    "end_reason": null,
    "duration_seconds": 0
  }
}
```

---

### 7) Optional Call History (highly useful)
**Endpoint**: `GET /api/v1/calls/history?context_type=order&context_id=<uuid>&page=1&limit=20`

**Success response**
```json
{
  "status": "success",
  "data": [
    {
      "call_id": "<uuid>",
      "state": "ended",
      "context_type": "order",
      "context_id": "<uuid>",
      "other_party": {
        "id": "<uuid>",
        "full_name": "Mebi Autos",
        "avatar_url": "https://...",
        "role": "seller"
      },
      "started_at": "2026-03-17T20:10:07Z",
      "ended_at": "2026-03-17T20:14:11Z",
      "duration_seconds": 244,
      "end_reason": "hangup"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### 8) Push/Realtime event payloads (required for UI)
When emitting WS/push events, include:
- `call_id`
- `state`
- `context_type`
- `context_id`
- `from_user` (`id`, `full_name`, `avatar_url`, `role`)
- `to_user` (`id`, `full_name`, `avatar_url`, `role`)
- `timestamp`

**Incoming call event example**
```json
{
  "event": "call.incoming",
  "data": {
    "call_id": "<uuid>",
    "state": "ringing",
    "context_type": "order",
    "context_id": "<uuid>",
    "from_user": {
      "id": "<uuid>",
      "full_name": "Dumebi Okeke",
      "avatar_url": "https://...",
      "role": "car_owner"
    },
    "to_user": {
      "id": "<uuid>",
      "full_name": "Mebi Autos",
      "avatar_url": "https://...",
      "role": "seller"
    },
    "timestamp": "2026-03-17T20:10:00Z"
  }
}
```

---

### 9) Context authorization matrix

#### `context_type = order`
- Buyer can call seller(s) tied to order items.
- Seller can call the buyer for that order.
- Other users: forbidden.

#### `context_type = job`
- Car owner can call assigned mechanic.
- Assigned mechanic can call car owner.
- Other users: forbidden.

---

### 10) Data frontend requires for sure
For every call lifecycle API/event response, include these fields to avoid extra lookups:
- `call_id`
- `state`
- `context_type`
- `context_id`
- `participants.caller.id`
- `participants.caller.full_name`
- `participants.caller.avatar_url`
- `participants.caller.role`
- `participants.callee.id`
- `participants.callee.full_name`
- `participants.callee.avatar_url`
- `participants.callee.role`
- `created_at`
- `started_at`
- `ended_at`
- `duration_seconds`
- `end_reason`

---

### 11) Security + ops
- Provider secret remains backend-only.
- Provider tokens short-lived.
- Full call lifecycle audit logs persisted.
- Rate-limit call initiation and state transitions.
- Idempotency support on `/calls/start` via `client_call_id`.

Thanks. Once these contracts are ready, frontend can wire call buttons in chat/order tracking and complete in-app calling integration end-to-end.
