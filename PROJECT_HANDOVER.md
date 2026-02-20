# BrodaMeko App Handover (Current Build)

## 1) App Summary
- Platform: React Native CLI (JavaScript)
- Theme baseline: dark (`#000033`) + accent (`#E2FF31`)
- Roles: Car Owner, Mechanic, Admin
- Auth routing:
  - Logged in -> role stack
  - Logged out + role already selected -> Login
  - First launch without selected role -> Role Selection

## 2) Backend Endpoints In Use

### Auth
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/resend-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password/reset`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/update-password`
- `POST /api/v1/auth/upload-avatar` (multipart)
- `POST /api/v1/auth/verify/add-contact`
- `POST /api/v1/auth/devices/register`

### Wallet / Transactions
- `GET /api/v1/wallet/balance`
- `POST /api/v1/wallets/top-up`
- `GET /api/v1/wallets/verify/payment`
- `GET /api/v1/transactions/list`
- `GET /api/v1/transactions/:reference`

### Jobs
- `POST /api/v1/jobs/create` (multipart)
- `GET /api/v1/jobs/car-owner`
- `GET /api/v1/jobs/car-owner/:jobId`
- `POST /api/v1/jobs/car-owner/:jobId/update` (multipart)
- `DELETE /api/v1/jobs/:jobId`
- `GET /api/v1/jobs/mechanic/assigned`
- `GET /api/v1/jobs/mechanic/assigned/:jobId`
- `POST /api/v1/jobs/:jobId/status`
- `POST /api/v1/jobs/:jobId/confirm`
- `GET /api/v1/jobs/:jobId/mechanics/for-job`

### Mechanic Profile / Setup
- `POST /api/v1/me/mechanic/add-services`
- `GET /api/v1/me/mechanic/services`
- `PATCH /api/v1/me/mechanic/:serviceId`
- `DELETE /api/v1/me/mechanic/:serviceId/delete`
- `POST /api/v1/me/mechanic/bank`
- `POST /api/v1/me/mechanic/bank/verify`
- `GET /api/v1/me/mechanic/bank/list`
- `DELETE /api/v1/me/mechanic/bank/:bankId/delete` (service exists)
- `POST /api/v1/me/mechanic/bank/:bankId/primary` (service exists)

### Chat
- `POST /api/v1/chat/conversations/create`
- `GET /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations/:conversationId/messages`
- `POST /api/v1/chat/conversations/images/upload/:conversationId` (multipart)
- `POST /api/v1/chat/conversations/:conversationId/read`
- `POST /api/v1/chat/conversations/:conversationId/quotation`
- `POST /api/v1/chat/conversations/:conversationId/quotation/respond`
- `POST /api/v1/chat/jobs/:jobId/payment/initiate`

### WebSocket Chat
- `wss://brodameko-server-50cv.onrender.com/api/v1/chat/ws`
- Integrated via `ChatContext` + `src/services/ws.service.js` for realtime updates and reconnect attempts.

---

## 3) Car Owner View

### Dashboard (`src/screens/carowner/home/DashboardScreen.js`)
- Purpose: entry home with greeting and quick actions.
- Data/logic:
  - Reads logged in user from AuthContext.
  - Requests location permission via `useUserLocation`.
- Important status:
  - **Google map rendering is intentionally disabled in code** pending billing/API activation.
  - A mocked map-style view is shown instead.

### Report Issue (`src/screens/carowner/assistance/ReportIssueScreen.js`)
- Purpose: choose issue, add car make, optional/required description, upload images, submit job.
- Endpoint calls:
  - `POST /api/v1/jobs/create` via `JobsContext.createJob`.
- Notes:
  - Image upload UX supports add/remove and max 5.
  - On success navigates to Find Mechanics with returned `jobId`.

### Find Mechanics (`src/screens/carowner/assistance/FindMechanicsScreen.js`)
- Purpose: list mechanics matching a created job and allow hire/chat start.
- Endpoint calls:
  - `GET /api/v1/jobs/:jobId/mechanics/for-job`
  - `POST /api/v1/chat/conversations/create`
- Notes:
  - Requires a valid `jobId` passed in route params.

### Chat (`src/screens/carowner/chat/ChatScreen.js` -> shared chat)
- Purpose: real-time chat and quotation handling with mechanic.
- Endpoint calls:
  - Conversations/messages/read/images/quotation/respond/payment initiate endpoints (through ChatContext).
- Notes:
  - Uses WebSocket for realtime.
  - If socket unavailable, pending local messages are used as fallback.

### Live Tracking (`src/screens/carowner/assistance/LiveTrackingScreen.js`)
- Purpose: show job progress and completion confirmation.
- Endpoint calls:
  - `POST /api/v1/jobs/:jobId/confirm`
- Notes:
  - Map UI is currently visual/mock style, not live map navigation.

### History (`src/screens/carowner/history/HistoryScreen.js`)
- Purpose: jobs history list (pending, completed, cancelled).
- Endpoint calls:
  - `GET /api/v1/jobs/car-owner`
- Notes:
  - Maps backend payload fields (`issue_type`, `car_make`, `status`, `id`) into card UI.
  - Status badge colors:
    - `pending` -> grey
    - `completed` -> green
    - `cancelled` -> red
  - `View details` now routes to job details (`CAR_OWNER_JOB_DETAILS`).
  - `Rate` now routes to mechanic details (`CAR_OWNER_MECHANIC_DETAILS`).
  - If network/token fails (`0/401`), it falls back to mock history data.

### Job Details (`src/screens/carowner/history/JobDetailsScreen.js`)
- Purpose: view a specific job + actions.
- Endpoint calls:
  - `GET /api/v1/jobs/car-owner/:jobId`
  - `DELETE /api/v1/jobs/:jobId`
- Notes:
  - Handles nested job payload shapes:
    - `{ job: {...} }`
    - `{ data: { job: {...} } }`
    - `{ data: {...} }`
  - Header UI cleaned up to centered title with icon back button.

### Edit Job (`src/screens/carowner/history/EditJobScreen.js`)
- Purpose: edit job car make/description/images.
- Endpoint calls:
  - `POST /api/v1/jobs/car-owner/:jobId/update`

### Wallet (`src/screens/carowner/wallet/WalletScreen.js`)
- Purpose: view balance + recent transactions.
- Endpoint calls:
  - `GET /api/v1/wallet/balance`
  - `GET /api/v1/transactions/list`

### Fund Wallet (`src/screens/carowner/wallet/FundWalletScreen.js`)
- Purpose: initialize top up, open checkout in-app, then verify on the same screen.
- Endpoint calls:
  - `POST /api/v1/wallets/top-up`
  - `GET /api/v1/wallets/verify/payment`
- Notes:
  - Uses Paystack `authorization_url` from top-up response in an in-app `WebView` modal.
  - `reference` from top-up is auto-filled; `trxref` defaults to same value.
  - Verify call uses query params:
    - `/api/v1/wallets/verify/payment?reference=<ref>&trxref=<ref>`

### Verify Top Up (`src/screens/carowner/wallet/VerifyTopUpScreen.js`)
- Purpose: manual payment verification screen.
- Endpoint calls:
  - `GET /api/v1/wallets/verify/payment`

### Transaction Details (`src/screens/carowner/wallet/TransactionDetailsScreen.js`)
- Purpose: fetch one transaction by reference.
- Endpoint calls:
  - `GET /api/v1/transactions/:reference`

### Escrow Funding (`src/screens/carowner/wallet/EscrowFundingScreen.js`)
- Purpose: cost breakdown/confirm-pay flow placeholder.
- Status: **mostly hardcoded/mock** values and navigation.

### Payment Success (`src/screens/carowner/wallet/PaymentSuccessScreen.js`)
- Purpose: success feedback card and timed redirect.
- Status: UI-only (no endpoint).

### Rate Mechanic (`src/screens/carowner/ratings/RateMechanicScreen.js`)
- Purpose: local rating form UI.
- Status: **hardcoded/local MVP**, no backend submit wired yet.

### Profile (`src/screens/carowner/profile/ProfileScreen.js` -> shared user profile)
- Purpose: user account page, stats and settings entry points.
- Endpoint calls (shared profile):
  - `GET /api/v1/wallet/balance`
  - Jobs list endpoint by role (`/jobs/car-owner` for car owner)

### Edit Profile (`src/screens/carowner/profile/EditProfileScreen.js`)
- Purpose: update local profile fields + avatar + add contact verification flow.
- Endpoint calls:
  - `POST /api/v1/auth/upload-avatar`
  - `POST /api/v1/auth/verify/add-contact`
- Notes:
  - Missing-contact flow (email/phone) now uses auth OTP screen:
    - Navigate to `OTPVerificationScreen` with `flow='add_contact'`.
    - Verify via existing auth OTP UI.
    - On success navigates to `AddContactSuccessScreen`.
    - Verified contact is written to auth user state and appears filled in edit profile.

### Notifications (`src/screens/shared/NotificationsScreen.js`)
- Purpose: notifications UI with tabs.
- Notes:
  - Contains local mock notifications + mechanic chat-request entries from chat conversations (`unread_count`).
  - Bell/top-nav unread badge count is not fully wired globally yet.

### Support (`src/screens/shared/SupportScreen.js`)
- Purpose: submit support description + optional screenshot.
- Status: UI/local alert currently, **no backend ticket endpoint wired**.

---

## 4) Mechanic View

### Mechanic Gating / Setup Entry (`src/screens/mech/profile/MechanicProfileSetupScreen.js`)
- Purpose: onboarding checklist and progress before dashboard access.
- Data source:
  - `MechanicProfileContext` (AsyncStorage persisted per user/role key).
- Notes:
  - Access to mechanic dashboard is gated until all required steps are complete.

### Upload Profile Photo (`src/screens/mech/profile/UploadProfilePhotoScreen.js`)
- Purpose: upload mechanic avatar.
- Endpoint calls:
  - `POST /api/v1/auth/upload-avatar`
- Also updates local onboarding state in context.

### Upload ID (`src/screens/mech/profile/KycUploadScreen.js`)
- Purpose: upload NIN image locally for onboarding step completion.
- Status: local/context state only (no dedicated ID upload endpoint currently wired).

### Upload Certificate (`src/screens/mech/profile/UploadCertificateScreen.js`)
- Purpose: upload certificate image locally for onboarding step completion.
- Status: local/context state only (no dedicated certificate upload endpoint currently wired).

### Bank Details (`src/screens/mech/profile/BankDetailsScreen.js`)
- Purpose: resolve bank account and save mechanic bank details.
- Endpoint calls:
  - `GET /api/v1/me/mechanic/bank/list`
  - `POST /api/v1/me/mechanic/bank/verify`
  - `POST /api/v1/me/mechanic/bank`
- Notes:
  - Includes temporary **Skip for now** path in onboarding.

### Service Pricing (`src/screens/mech/profile/ServicePricingScreen.js`)
- Purpose: submit offered service ranges.
- Endpoint calls:
  - `POST /api/v1/me/mechanic/add-services` (per row)
- Notes:
  - Includes temporary **Skip for now** path in onboarding.

### Mechanic Dashboard (`src/screens/mech/home/MechanicDashboardScreen.js`)
- Purpose: jobs summary, wallet snapshot, available jobs preview.
- Endpoint calls:
  - `GET /api/v1/wallet/balance`
  - `GET /api/v1/jobs/mechanic/assigned`
- Notes:
  - Earnings card text/amount still partly presentational.

### Mechanic Jobs (`src/screens/mech/jobs/MechanicJobsScreen.js`)
- Purpose: available/active/completed tabs.
- Endpoint calls:
  - `GET /api/v1/jobs/mechanic/assigned`
  - `POST /api/v1/jobs/:jobId/status` (accept)

### Mechanic Job Details (`src/screens/mech/jobs/MechanicJobDetailsScreen.js`)
- Purpose: inspect one job and progress state actions.
- Endpoint calls:
  - `GET /api/v1/jobs/mechanic/assigned/:jobId`
  - `POST /api/v1/jobs/:jobId/status` (repairing/completed)

### Mechanic Wallet (`src/screens/mech/wallet/MechanicWalletScreen.js`)
- Purpose: wallet UI for mechanic.
- Status: currently display-focused with hardcoded transaction cards; no dedicated mechanic transaction feed wired.

### Mechanic Chat (`src/screens/mech/chat/MechanicChatScreen.js` -> shared chat)
- Purpose: realtime mechanic side chat, quotations.
- Endpoint calls:
  - same chat endpoints as car owner through `ChatContext`.
- Notes:
  - Conversation entry is currently most reliable via Notifications chat-request items.
  - There is an active known issue where some mechanic sessions remain in `Disconnected` socket state after role/user switching.

### Mechanic Profile (footer profile route)
- Screen: `src/screens/shared/profile/UserProfileScreen.js`
- Endpoint calls:
  - `GET /api/v1/wallet/balance`
  - `GET /api/v1/jobs/mechanic/assigned` (for total jobs count)
- Notes:
  - Email row is conditionally hidden when absent.

---

## 5) Auth / Shared Flow

### Splash (`src/screens/auth/SplashScreen.js`)
- Purpose: role/login entry decision.
- Uses `selectedRole`, `hasSeenRoleSelection`, `skipRoleSelectionOnNextLaunch` from AuthContext.

### Role Selection (`src/screens/auth/RoleSelectionScreen.js`)
- Purpose: choose persisted role before sign-in/sign-up.

### Login / Signup / OTP / Forgot / Reset
- Purpose: full auth flow.
- Endpoints: auth domain list above.
- Notes:
  - Google sign-in code path exists, but native setup must be complete for build stability.

### Conversations List (`src/screens/shared/ConversationsScreen.js`)
- Purpose: render conversation list and enter chat.
- Endpoints:
  - `GET /api/v1/chat/conversations`

### Placeholder (`src/screens/shared/PlaceholderScreen.js`)
- Purpose: reusable coming-soon fallback.

---

## 6) Known Gaps / Non-Working or Demo Areas

1. Google Maps / live map rendering
- Car owner dashboard currently has map rendering intentionally disabled in code.
- Reason: Google Maps billing/API key not fully active.
- Current behavior: mocked map-style view + location permission flow.

2. Paystack flow is demo-level
- Car owner wallet top-up now opens Paystack authorization in in-app WebView and supports verify on same screen.
- Deep-link/callback finalization is still heuristic (success URL pattern checks + manual "Done, verify").
- If WebView renders blank/partial checkout on some devices, verify with external browser to isolate device WebView constraints.

3. Support tickets are not backend-wired
- Support screen currently captures input and image but does not post to backend.

4. Notifications are local mock data
- Notifications screen is present, filterable, and mark-as-read locally.
- No backend notifications feed integration yet.
- Bell icon unread badge summary is still pending global wiring.

5. Mechanic onboarding skip helpers are enabled
- Bank and Service steps currently include temporary "Skip for now" paths for testing.

6. History fallback behavior
- Car owner history falls back to mock items when unauthorized/offline response is detected.

7. Mechanic chat websocket stability
- Chat socket lifecycle has reconnect guards and pending flush improvements.
- Remaining issue observed: some mechanic sessions stay disconnected (especially after account/role switching in same app runtime).
- Backend ws auth/authorization and conversation ownership validation should be checked together with client logs.

---

## 7) Bundle / Distribution Notes (High Level)
- For Android public sharing, generate release `.aab`/`.apk` and host on Play Internal Testing, Firebase App Distribution, or direct file host.
- For iOS, use TestFlight.
- If you want, next step can be a release checklist markdown (`versioning`, `keystore/signing`, `env switch`, `smoke test`, `distribution link setup`).

### Android APK Build (React Native CLI)
1. Ensure dependencies are installed:
   - `npm install`
2. Build release APK:
   - `cd android`
   - `./gradlew assembleRelease` (macOS/Linux)
   - `gradlew.bat assembleRelease` (Windows)
3. Output location:
   - `android/app/build/outputs/apk/release/app-release.apk`
4. If using split APKs:
   - disable splits or use universal APK for direct sharing/testing.
5. Signing:
   - Ensure `android/gradle.properties` and `android/app/build.gradle` release signing config is correctly set for your keystore.
