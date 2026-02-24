# BrodaMeko Endpoint Integration Audit

Generated from codebase scan on 2026-02-24.

## 1) Fully integrated (service + used in app flow/screens)

### Authentication
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/resend-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password/reset`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/update-password`
- `POST /api/v1/auth/devices/register`
- `POST /api/v1/auth/verify/add-contact`
- `POST /api/v1/auth/upload-avatar`

### Wallet
- `POST /api/v1/wallets/top-up`
- `GET /api/v1/wallets/verify/payment?reference=...&trxref=...`

### Transactions
- `GET /api/v1/transactions/list`
- `GET /api/v1/transactions/:reference`

### Mechanic profile/settings
- `POST /api/v1/me/mechanic/add-services`
- `GET /api/v1/me/mechanic/services`
- `PATCH /api/v1/me/mechanic/:serviceId`
- `DELETE /api/v1/me/mechanic/:serviceId/delete`
- `POST /api/v1/me/mechanic/bank`
- `POST /api/v1/me/mechanic/bank/verify`
- `GET /api/v1/me/mechanic/bank/list`

### Jobs
- `POST /api/v1/jobs/create`
- `GET /api/v1/jobs/car-owner`
- `GET /api/v1/jobs/car-owner/:jobId`
- `POST /api/v1/jobs/car-owner/:jobId/update`
- `DELETE /api/v1/jobs/:jobId`
- `GET /api/v1/jobs/mechanic/assigned`
- `GET /api/v1/jobs/mechanic/assigned/:jobId`
- `POST /api/v1/jobs/:jobId/status`
- `POST /api/v1/chat/jobs/:jobId/payment/initiate`
- `POST /api/v1/jobs/:jobId/confirm`
- `GET /api/v1/jobs/:jobId/mechanics/for-job`
- `POST /api/v1/jobs/:jobId/hire`
- `POST /api/v1/jobs/:jobId/request/respond`
- `GET /api/v1/jobs/:jobId/request/status`
- `GET /api/v1/jobs/mechanic/job-requests`
- `GET /api/v1/jobs/:jobId/get/conversation`

### Chat
- `GET /api/v1/chat/conversations/:conversationId/messages`
- `PATCH /api/v1/chat/conversations/:conversationId/read`
- `POST /api/v1/chat/conversations/images/upload/:conversationId`
- `POST /api/v1/chat/conversations/:conversationId/quotation`
- `POST /api/v1/chat/conversations/:conversationId/quotation/respond`

### Notifications
- `GET /api/v1/notifications/all`
- `PATCH /api/v1/notifications/read-all`
- `PATCH /api/v1/notifications/:notificationId/read`
- `DELETE /api/v1/notifications/:notificationId`

### WebSocket
- `wss://.../api/v1/chat/ws` (connect/send/receive is implemented in `ws.service` + `ChatContext` + chat screens)

## 2) Partially integrated (endpoint/service exists, but UI flow is incomplete or not wired)

- `POST /api/v1/chat/conversations/create`
  - Implemented in `chat.service` + `ChatContext.startNewConversation`, but no active screen flow currently calls it.
- `GET /api/v1/chat/conversations`
  - Implemented and used in `shared/ConversationsScreen`, but that screen is not wired into navigation stacks.
- `DELETE /api/v1/me/mechanic/bank/:bankId/delete`
  - Service exists (`deleteMechanicBank`) but no screen action calls it.
- `POST /api/v1/me/mechanic/bank/:bankId/primary`
  - Service exists (`setPrimaryMechanicBank`) but no screen action calls it.

## 3) Not added yet, but there is an existing screen it can be integrated into

### Authentication
- `POST /api/v1/auth/verify/confirm-contact`
  - Can be integrated into `OTPVerificationScreen` add-contact flow (currently reuses `/auth/verify-otp`).

### Jobs
- `GET /api/v1/jobs/mechanics/:mechanicId/stats`
  - Can be integrated into mechanic profile/review screens (`MechanicDetailsScreen`, `MechanicReviewsScreen`).

### Mechanic reviews/ratings
- `POST /api/v1/mechanic-reviews/:mechanicId/review`
  - Can be integrated into `RateMechanicScreen` (currently local submit only).
- `GET /api/v1/mechanic-reviews/:mechanicId/review`
  - Can be integrated into `MechanicDetailsScreen` / `MechanicReviewsScreen` (currently reading reviews from job payload).

### Admin collection
- `POST /api/v1/admin/auth/login`
  - Can be wired in existing auth screens for admin role (`LoginScreen`).
- `POST /api/v1/admin/auth/logout`
  - Can be wired into current logout flow for admin role.
- `GET /api/v1/admin/auth/me`
  - Can be used in auth bootstrap/profile for admin role.
- `PATCH /api/v1/admin/auth/password`
  - Can be integrated into existing `ChangePasswordScreen` for admin role.
- `GET /api/v1/admin/dashboard`
  - Can be integrated into current `AdminDashboardScreen`.
- `GET /api/v1/admin/audit-logs`
  - Can be integrated into `AdminDashboardScreen` (or admin activity view).
- `GET /api/v1/admin/settings`
  - Can be integrated into `AdminDashboardScreen` (or admin settings section).
- `PATCH /api/v1/admin/settings/:settingKey`
  - Can be integrated into `AdminDashboardScreen` (or admin settings section).
- `GET /api/v1/admin/jobs`
  - Can be integrated into `AdminDashboardScreen` (jobs moderation list).

## 4) Not added and no screen currently available to integrate into

- None identified from the provided endpoint list.

## Notes
- The app also contains non-listed endpoints (for example `/api/v1/auth/google` and wallet/transaction fallback routes), but they are outside this provided backend list.
