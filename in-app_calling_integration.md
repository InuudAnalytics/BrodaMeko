# In-App Calling Integration (Production Blueprint)

## Goal
Enable true in-app audio calling between buyer and seller (and later car owner/mechanic) without exposing personal phone numbers.

## Scope (Session 1 target)
- Audio-only WebRTC call (no video)
- App-to-app calling only (no PSTN)
- Order-context calls first (buyer <-> seller on same order)
- Foreground support first, background support in phase 2

## Recommended Architecture
- Media: WebRTC peer-to-peer (RN client)
- Signaling: Backend WebSocket channel (new calls namespace)
- NAT traversal: TURN/STUN (coturn)
- Authorization: backend validates caller/callee relationship from order/job
- Privacy: no phone numbers in call payloads

---

## Accounts and Infrastructure To Create

## Required
1. TURN/STUN infrastructure
- Option A (recommended for control): self-host coturn
  - 1 VPS (Ubuntu) with static public IP
  - DNS record (example: `turn.brodameko.com`)
  - TLS certificate (LetsEncrypt)
- Option B (faster): managed TURN provider (Twilio NTS / Metered / Xirsys)

2. Push notification credentials (already likely present, verify)
- Firebase Cloud Messaging (Android)
- APNs key/cert configured for iOS
- Needed for incoming call wake-up/alerts when app in background

3. Monitoring
- Log aggregation (Render logs / ELK / Datadog)
- Error tracking (Sentry recommended)

## Optional (only if PSTN fallback is required)
- Twilio Voice or Vonage Voice account
- Purchased numbers + masking logic
- This is NOT needed for app-to-app WebRTC phase

---

## Backend Requirements (C:\bm\BrodaMeko-Backend)

## 1) Data model (new tables)
### `calls`
- `id` (uuid, pk)
- `context_type` (`order` | `job`)
- `context_id` (uuid)
- `caller_id` (uuid)
- `callee_id` (uuid)
- `status` (`initiated` | `ringing` | `accepted` | `rejected` | `ended` | `missed` | `failed`)
- `started_at` (timestamp null)
- `ended_at` (timestamp null)
- `end_reason` (`hangup` | `declined` | `timeout` | `network_error` | `busy`)
- `created_at`, `updated_at`

### `call_participants`
- `call_id` (uuid fk)
- `user_id` (uuid fk)
- `joined_at` (timestamp null)
- `left_at` (timestamp null)
- `ice_restart_count` (int default 0)

### `call_events`
- `id` (uuid)
- `call_id` (uuid fk)
- `event_type` (`offer` | `answer` | `ice_candidate` | `ring` | `accept` | `reject` | `end` | `timeout`)
- `from_user_id` (uuid)
- `payload` (jsonb)
- `created_at`

## 2) REST endpoints
Prefix recommendation: `/api/v1/calls`

1. `POST /api/v1/calls/initiate`
- Body:
```json
{
  "context_type": "order",
  "context_id": "<order_uuid>",
  "callee_id": "<user_uuid>",
  "client_call_id": "optional-idempotency-key"
}
```
- Behavior:
  - Validate auth user
  - Validate caller/callee relationship via order/job ownership
  - Enforce rate-limit and max concurrent calls
  - Create call row (`initiated` -> `ringing`)
  - Return call metadata + ws routing info

2. `POST /api/v1/calls/{callId}/accept`
3. `POST /api/v1/calls/{callId}/reject`
4. `POST /api/v1/calls/{callId}/end`
5. `GET /api/v1/calls/{callId}`
6. `GET /api/v1/calls/history?context_type=order&context_id=<id>`

7. `GET /api/v1/calls/ice-servers`
- Returns short-lived TURN credentials
```json
{
  "ice_servers": [
    { "urls": ["stun:turn.brodameko.com:3478"] },
    {
      "urls": ["turns:turn.brodameko.com:5349?transport=tcp"],
      "username": "temp-user",
      "credential": "temp-pass"
    }
  ],
  "ttl_seconds": 600
}
```

## 3) WebSocket signaling
Recommended: extend existing ws auth/session pattern used for chat/support.

New channel events:
- `call.incoming`
- `call.ringing`
- `call.accepted`
- `call.rejected`
- `call.ended`
- `call.offer`
- `call.answer`
- `call.ice_candidate`
- `call.error`

Event envelope:
```json
{
  "event": "call.offer",
  "call_id": "<uuid>",
  "from_user_id": "<uuid>",
  "to_user_id": "<uuid>",
  "payload": { "sdp": "..." },
  "sent_at": "2026-03-17T12:00:00Z"
}
```

## 4) Authorization rules
- `context_type=order`:
  - buyer can call only sellers attached to that order
  - seller can call only buyer for that order
- `context_type=job`:
  - car owner and assigned mechanic only
- reject any cross-context or non-participant call

## 5) Reliability and anti-abuse
- Rate limits:
  - initiate: e.g. 5/min per user
  - signaling flood protection for ICE events
- Idempotency key for initiate
- Call timeout (e.g. 30s no answer -> `missed`)
- One active call per user per context (configurable)

## 6) Notifications
- On incoming call when callee offline/background:
  - create in-app notification with `call_id`, `context_type`, `context_id`
  - push notification payload includes only IDs, never phone number

## 7) Observability
- Structured logs with call lifecycle state transitions
- Metrics:
  - call setup success rate
  - median setup time
  - drop rate < 30s
  - average duration

---

## Frontend Requirements (C:\bm\BrodaMeko)

## 1) Dependencies
- Add `react-native-webrtc`
- Keep existing `@react-native-firebase/messaging`
- Optional phase 2:
  - iOS: CallKit bridge
  - Android: ConnectionService/foreground service helper

## 2) Permissions
### Android
- Add `RECORD_AUDIO` in `AndroidManifest.xml`
- Request runtime microphone permission before call starts

### iOS
- Add `NSMicrophoneUsageDescription` in `ios/BrodaMekoBare/Info.plist`

## 3) New services
Create:
- `src/services/calls.service.js`
  - `initiateCall`, `acceptCall`, `rejectCall`, `endCall`, `getIceServers`
- `src/context/CallContext.js`
  - global call state + WebRTC peer lifecycle
- `src/services/call-signaling.service.js`
  - ws event send/receive abstraction

## 4) New screens/components
- `src/screens/shared/calls/OutgoingCallScreen.js`
- `src/screens/shared/calls/IncomingCallScreen.js`
- `src/screens/shared/calls/InCallScreen.js`
- Reusable `CallBanner` for mini ongoing call UI

## 5) Existing screen edits
1. `OrderTrackingScreen.js`
- Replace `handleCallSeller` tel flow with `initiateCall({ context_type:'order', context_id: orderId, callee_id: sellerUserId })`

2. `PickupTrackingScreen.js`
- same replacement as above

3. Any other "call" entry points in marketplace/job flows
- route to in-app call initiate

4. Notification routing
- Extend `src/utils/notificationRouting.js` to handle `call_id` deep links to `IncomingCallScreen` or `InCallScreen`

## 6) Client state machine
- `idle`
- `outgoing_ringing`
- `incoming_ringing`
- `connecting`
- `in_call`
- `ending`
- `ended`
- `failed`

UI state must be driven from this machine only.

## 7) Data needed from backend for UI
Call action buttons need:
- `counterparty_user_id` (seller user id for order; mechanic id for job)
- `counterparty_name`
- `counterparty_avatar`

Important: Do not use/store phone number for call flow.

---

## Security Requirements
- Never include real phone in call APIs/events
- Signed, short-lived ICE credentials (do not ship static TURN password in app)
- Validate both participants on every state transition
- Audit logs for moderation and dispute investigation
- Encrypt transport (wss/https only)

---

## Testing Plan

## Backend tests
- Unit: authz matrix for order/job participants
- Integration: initiate -> ring -> accept -> end
- Negative: unauthorized caller, stale callId, duplicate accept, timeout

## Mobile tests
- Unit tests for call reducer/state machine
- Manual matrix:
  - Android <-> Android
  - iOS <-> iOS
  - Android <-> iOS
  - app foreground/background transitions
  - network handoff (wifi -> mobile)

## UAT checks
- no phone number visible anywhere
- call starts within <= 5s median on good network
- missed/declined states reflect correctly

---

## Rollout Plan

## Phase 1 (MVP)
- Foreground app-to-app audio calls only
- Order-context only
- No CallKit/ConnectionService

## Phase 2
- Job-context calls
- Background incoming call UX (CallKit/ConnectionService)
- Better reconnect/ICE-restart handling

## Phase 3
- Optional PSTN masked fallback for unreachable app users

---

## Acceptance Criteria
- User taps "Call seller" and sees in-app ringing UI (not phone app)
- Seller receives in-app incoming call UI
- Both can talk audio in app
- No personal phone number exposed in any API/UI/push payload
- Call records are visible in admin/logs for support audit

---

## Open Decisions (decide before coding)
1. TURN option: self-host coturn vs managed provider
2. MVP background behavior: reject with message vs notify and open app
3. Call recording: disabled by default (recommended)
4. Concurrent call policy: one active call per user or per context

---

## Effort Estimate (realistic)
- Backend APIs/signaling/authz/logging: 5-8 dev days
- Mobile WebRTC integration + call UI/state: 6-10 dev days
- QA + tuning + cross-platform stabilization: 4-6 dev days
- Total: 3-5 weeks to production-quality rollout
