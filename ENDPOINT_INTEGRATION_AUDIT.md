# BrodaMeko Endpoint Integration Audit

Updated on 2026-02-27.

## 1) Fully integrated (service + used in app flow/screens)

### Authentication
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/resend-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `PATCH /api/v1/auth/reset-password/reset`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/update-password`
- `POST /api/v1/auth/devices/register`
- `POST /api/v1/auth/verify/add-contact`
- `POST /api/v1/auth/upload-avatar`

### Wallet
- `POST /api/v1/wallets/top-up`
- `GET /api/v1/wallets/verify/payment?reference=...&trxref=...`
- `GET /api/v1/wallet/balance`

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
- `GET /api/v1/me/mechanic/address`
- `POST /api/v1/me/mechanic/address`
- `PATCH /api/v1/me/mechanic/address/:addressId`

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
- `GET /api/v1/jobs/mechanics/:mechanicId/stats`

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
- `wss://.../api/v1/chat/ws` (connect/send/receive implemented in `ws.service` + `ChatContext` + chat screens)

## 2) Partially integrated (endpoint/service exists, but UI flow is incomplete or not wired)

### Authentication
- `POST /api/v1/auth/verify/confirm-contact`
  - Endpoint exists in backend list; currently OTP flow reuses `/auth/verify-otp` for confirm-contact.

### Chat
- `POST /api/v1/chat/conversations/create`
  - Implemented in `chat.service` + `ChatContext.startNewConversation`, but no active screen flow currently calls it.
- `GET /api/v1/chat/conversations`
  - Implemented and used in `shared/ConversationsScreen`, but that screen is not wired into navigation stacks.

### Mechanic profile/settings
- `DELETE /api/v1/me/mechanic/bank/:bankId/delete`
  - Service exists (`deleteMechanicBank`), no UI action calls it.
- `POST /api/v1/me/mechanic/bank/:bankId/primary`
  - Service exists (`setPrimaryMechanicBank`), no UI action calls it.
- `DELETE /api/v1/me/mechanic/address/:addressId`
  - Endpoint in backend list; delete action not wired in UI yet.
- `POST /api/v1/me/mechanic/address/:addressId/primary`
  - Endpoint in backend list; primary toggle currently stored locally and sent on save, but no dedicated call.
- `POST /api/v1/me/mechanic/online-status`
  - Not wired into UI toggle yet.

### Wallet
- `POST /api/v1/wallets/request`
  - Withdrawal UI not wired.
- `GET /api/v1/wallets/withdrawals`
  - Withdrawal history UI not wired.

## 3) Not added yet, but there is an existing screen it can be integrated into

### Authentication
- `GET /api/v1/auth/users/contact-status`
  - Can be integrated into profile settings (missing-contact banner/CTA).
- `POST /api/v1/auth/users/delete`
  - Can be integrated into profile settings (Delete account action).

### Mechanic reviews/ratings
- `POST /api/v1/mechanic-reviews/:mechanicId/review`
  - Can be integrated into `RateMechanicScreen` (currently local submit only).
- `GET /api/v1/mechanic-reviews/:mechanicId/review`
  - Can be integrated into `MechanicDetailsScreen` / `MechanicReviewsScreen` (currently reading reviews from job payload).
- `POST /api/v1/mechanic-reviews/:reviewId/reply`
  - No UI in mechanic or car owner flows yet.
- `GET /api/v1/mechanic-reviews/:reviewId/replies`
  - No UI in mechanic or car owner flows yet.

### Admin collection
- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/auth/me`
- `PATCH /api/v1/admin/auth/password`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/audit-logs`
- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings/:settingKey`
- `GET /api/v1/admin/jobs`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:userId/status`
- `GET /api/v1/admin/users/:userId`
- `DELETE /api/v1/admin/users/:userId`
  - Admin screens exist only as placeholders; none of the endpoints above are wired into UI.

### Car owner profile/settings
- `POST /api/v1/me/car-owner/bank`
- `POST /api/v1/me/car-owner/bank/verify`
- `DELETE /api/v1/me/car-owner/bank/:bankId/delete`
- `POST /api/v1/me/car-owner/bank/:bankId/primary`
  - No car-owner bank UI wired yet.

## 4) Not added and no screen currently available to integrate into

### Spare parts marketplace
- `POST /api/v1/marketplace/seller/store`
- `PATCH /api/v1/marketplace/seller/store`
- `GET /api/v1/marketplace/seller/store/me`
- `POST /api/v1/marketplace/seller/store/logo`
- `POST /api/v1/marketplace/seller/store/banner`
- `GET /api/v1/marketplace/stores/:storeId`
- `GET /api/v1/marketplace/parts`
- `POST /api/v1/marketplace/seller/parts`
- `GET /api/v1/marketplace/parts/:partId`
- `GET /api/v1/marketplace/seller/parts/me`
- `DELETE /api/v1/marketplace/seller/parts/:partId`
- `PATCH /api/v1/marketplace/seller/parts/:partId`
- `DELETE /api/v1/marketplace/seller/parts/:partId/images?public_id=...`
- `POST /api/v1/marketplace/seller/parts/:partId/images`

### Order/cart system
- `GET /api/v1/marketplace/cart`
- `POST /api/v1/marketplace/cart/items`
- `PATCH /api/v1/marketplace/cart/items/:itemId`
- `DELETE /api/v1/marketplace/cart/items/:itemId`
- `DELETE /api/v1/marketplace/cart/clear`
- `POST /api/v1/marketplace/orders/checkout`
- `PATCH /api/v1/marketplace/orders/:orderId/cancel`
- `GET /api/v1/marketplace/orders`
- `GET /api/v1/marketplace/orders/:orderId`
- `PATCH /api/v1/marketplace/orders/:orderId/items/:itemId/confirm`
- `GET /api/v1/marketplace/seller/orders`
- `PATCH /api/v1/marketplace/orders/:orderId/items/:itemId/received`

## Notes
- Spare parts seller address endpoints are **assumed** as `/api/v1/me/spare-parts/address` (see `src/config/endpoints.js`). Confirm with backend if a different path is expected.
- App also contains a Google auth endpoint not in this list.
