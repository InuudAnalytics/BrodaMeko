# In-App Calling Integration Checklist (Mar 2026)

Reference backend: `C:\bm\BrodaMeko-Backend`

## Completed
- [x] Added calls endpoint map in frontend config:
  - `POST /api/v1/calls/start`
  - `POST /api/v1/calls/token`
  - `POST /api/v1/calls/{call_id}/accept`
  - `POST /api/v1/calls/{call_id}/reject`
  - `POST /api/v1/calls/end`
  - `GET /api/v1/calls/{call_id}`
  - `GET /api/v1/calls/history`
- [x] Added `src/services/calls.service.js` with typed methods:
  - `startCall`
  - `getCallToken`
  - `acceptCall`
  - `rejectCall`
  - `endCall`
  - `getCall`
  - `getCallHistory`
- [x] Wired car-owner marketplace call actions to backend call start flow:
  - `OrderTrackingScreen`
  - `PickupTrackingScreen`
- [x] Wired seller-side orders "Call buyer" to backend call start flow:
  - `spareparts/orders/OrdersScreen`
- [x] Updated call UI screens to use backend call lifecycle:
  - Outgoing screen polls `GET /calls/{call_id}` and auto-transitions.
  - Incoming screen accepts/rejects via backend endpoints.
  - In-progress screen ends call via backend endpoint and handles terminal state polling.
  - Ended screen shows end reason when provided.
- [x] Added chat websocket call signal passthrough (`call.*`) in `ChatContext`.
- [x] Installed Stream RN SDK dependency:
  - `@stream-io/video-react-native-sdk`
- [x] Added call lifecycle context:
  - `src/context/CallContext.js`
  - wired provider in `src/App.js`
- [x] Integrated in-call media session bootstrap:
  - fetches call token and call details
  - initializes Stream client
  - joins provider call in audio mode
  - supports local mic toggle + leave cleanup
- [x] Added call permissions for production builds:
  - Android `RECORD_AUDIO`
  - iOS `NSMicrophoneUsageDescription`

## Remaining
- [ ] Verify native runtime setup on each platform:
  - Android clean build after dependency install
  - iOS `pod install` and device test
- [x] Handle incoming call UX globally (foreground signal routes to incoming screen).
- [x] Bind push notifications for call incoming/accepted to deep-link call screens.
- [x] Implement call history UI using `GET /api/v1/calls/history`.
- [x] Add retry/fallback handling for duplicate call requests (`409`) and active-call conflicts.
- [x] Add analytics for call start, accept, reject, missed, failed, ended.
- [ ] Add E2E/manual test matrix for CAR_OWNER/MECH/SPARE_PARTS_SELLER roles.
