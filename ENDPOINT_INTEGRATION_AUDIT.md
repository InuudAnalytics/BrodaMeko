# BrodaMeko Endpoint Integration Audit

Updated on 2026-03-03.

This audit groups endpoints by **current app readiness**:
1) Fully integrated (service + UI flow wired)
2) Service exists but UI not wired (or partially wired)
3) UI exists but still mocked (no service wired)
4) Endpoint known, no service or UI yet

---

## 1) Fully integrated (service + UI flow wired)

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
- `POST /api/v1/auth/verify/confirm-contact`
- `DELETE /api/v1/auth/users/delete`
- `POST /api/v1/auth/upload-avatar`
- `GET /api/v1/auth/users/contact-status`

### Wallet
- `POST /api/v1/wallets/top-up`
- `GET /api/v1/wallets/verify/payment?reference=...&trxref=...`
- `GET /api/v1/wallet/balance`
- `POST /api/v1/wallets/request`
- `GET /api/v1/wallets/withdrawals`

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
- `PATCH /api/v1/me/mechanic/bank/:bankId/primary`
- `DELETE /api/v1/me/mechanic/bank/:bankId/delete`
- `GET /api/v1/me/mechanic/bank/list`
- `GET /api/v1/me/mechanic/bank`
- `GET /api/v1/me/mechanic/address`
- `POST /api/v1/me/mechanic/address`
- `PATCH /api/v1/me/mechanic/address/:addressId`
- `DELETE /api/v1/me/mechanic/address/:addressId`
- `PATCH /api/v1/me/mechanic/address/:addressId/primary`
- `PATCH /api/v1/me/mechanic/online-status`

### Car owner profile/settings
- `POST /api/v1/me/car-owner/bank`
- `POST /api/v1/me/car-owner/bank/verify`
- `POST /api/v1/me/car-owner/bank/:bankId/primary`
- `DELETE /api/v1/me/car-owner/bank/:bankId/delete`

### Spare parts seller profile/settings
- `POST /api/v1/seller/me/bank`
- `POST /api/v1/seller/me/bank/verify`
- `PATCH /api/v1/seller/me/bank/:bankId/primary`
- `DELETE /api/v1/seller/me/bank/:bankId/delete`

### Jobs
- `POST /api/v1/jobs/create`
- `GET /api/v1/jobs/car-owner`
- `GET /api/v1/jobs/car-owner/:jobId`
- `POST /api/v1/jobs/car-owner/:jobId/update`
- `DELETE /api/v1/jobs/:jobId`
- `GET /api/v1/jobs/mechanic/assigned`
- `GET /api/v1/jobs/mechanic/assigned/:jobId`
- `PATCH /api/v1/jobs/:jobId/status`
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
- `POST /api/v1/chat/conversations/create`
- `GET /api/v1/chat/conversations`
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

### Mechanic reviews/ratings
- `POST /api/v1/mechanic-reviews/:mechanicId/review`
- `GET /api/v1/mechanic-reviews/:mechanicId/review`
- `POST /api/v1/mechanic-reviews/:reviewId/reply`
- `GET /api/v1/mechanic-reviews/:reviewId/replies`

### WebSocket
- `wss://.../api/v1/chat/ws` (connect/send/receive implemented in `ws.service` + `ChatContext` + chat screens)
- `job_location_update` payload supported for live tracking (mechanic -> car owner)

### Live location fallback
- `POST /api/v1/jobs/:jobId/location/update`
- `GET /api/v1/jobs/:jobId/location/latest`

### Marketplace (car owner + mechanic)
- `GET /api/v1/marketplace/parts`
- `GET /api/v1/marketplace/parts/:partId`

### Order/cart system (car owner + mechanic)
- `GET /api/v1/marketplace/cart`
- `POST /api/v1/marketplace/cart/items`
- `PATCH /api/v1/marketplace/cart/items/:itemId`
- `DELETE /api/v1/marketplace/cart/items/:itemId`
- `DELETE /api/v1/marketplace/cart/clear`
- `POST /api/v1/marketplace/orders/checkout`
- `GET /api/v1/marketplace/orders`
- `GET /api/v1/marketplace/orders/:orderId`
- `PATCH /api/v1/marketplace/orders/:orderId/items/:itemId/confirm`
- `PATCH /api/v1/marketplace/orders/:orderId/items/:itemId/received`

### Spare parts seller (store setup)
- `GET /api/v1/marketplace/seller/store/me`
- `POST /api/v1/marketplace/seller/store`
- `PATCH /api/v1/marketplace/seller/store`
- `POST /api/v1/marketplace/seller/store/banner`
- `POST /api/v1/marketplace/seller/store/logo`

### Spare parts seller (products)
- `POST /api/v1/marketplace/seller/parts`
- `GET /api/v1/marketplace/seller/parts/me`
- `PATCH /api/v1/marketplace/seller/parts/:partId`
- `DELETE /api/v1/marketplace/seller/parts/:partId`
- `DELETE /api/v1/marketplace/seller/parts/:partId/images?public_id=...`
- `POST /api/v1/marketplace/seller/parts/:partId/images`

### Spare parts seller (orders)
- `GET /api/v1/marketplace/seller/orders`


## ?? Request body uncertain (needs backend confirmation)
- `POST /api/v1/marketplace/seller/parts`
  - Form-data fields beyond `name`, `description`, `price` are assumed (`stock_quantity`, `category`, `condition`).
- `POST /api/v1/marketplace/orders/checkout`
  - Payload fields are based on current API notes; confirm required/optional fields and keys.

---

## 2) Service exists but UI not wired (or partially wired)

### Marketplace orders (car owner + mechanic)
- `PATCH /api/v1/marketplace/orders/:orderId/cancel`

---

## 3) UI exists but still mocked (no service wired)

---

## 4) Endpoint known, no service or UI yet

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

### Spare parts marketplace (public)
- `GET /api/v1/marketplace/stores/:storeId`

---

## Notes
- App contains a Google auth endpoint (`POST /api/v1/auth/google`) that is assumed and may not exist on backend.
