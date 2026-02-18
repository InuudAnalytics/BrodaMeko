# Production Wiring Report (dev usage excluded)

## Wired in production screens/contexts (dev does not count)

### Authentication
- POST `/api/v1/auth/signup` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/verify-otp` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/resend-otp` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/login` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/logout` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/forgot-password` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/reset-password/reset` -> `src/context/AuthContext.js`
- GET `/api/v1/auth/me` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/update-password` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/devices/register` -> `src/context/AuthContext.js`
- POST `/api/v1/auth/upload-avatar` -> `src/screens/shared/profile/UserProfileScreen.js`, `src/screens/mech/profile/UploadProfilePhotoScreen.js`

### Wallet + Transactions
- POST `/api/v1/wallets/top-up` -> `src/screens/carowner/wallet/FundWalletScreen.js`
- GET `/api/v1/wallets/verify/payment` -> `src/screens/carowner/wallet/FundWalletScreen.js`, `src/screens/carowner/wallet/VerifyTopUpScreen.js`
- GET `/api/v1/transactions/list` -> `src/screens/carowner/wallet/WalletScreen.js`
- GET `/api/v1/transactions/:reference` -> `src/screens/carowner/wallet/TransactionDetailsScreen.js`

### Mechanic profile/settings
- POST `/api/v1/me/mechanic/add-services` -> `src/screens/mech/home/SetServicesScreen.js`, `src/context/MechanicServicesContext.js`
- GET `/api/v1/me/mechanic/services` -> `src/screens/mech/home/SetServicesScreen.js`, `src/context/MechanicServicesContext.js`
- PATCH `/api/v1/me/mechanic/:serviceId` -> `src/screens/mech/home/SetServicesScreen.js`, `src/context/MechanicServicesContext.js`
- DELETE `/api/v1/me/mechanic/:serviceId/delete` -> `src/screens/mech/home/SetServicesScreen.js`, `src/context/MechanicServicesContext.js`
- GET `/api/v1/me/mechanic/bank/list` -> `src/screens/mech/profile/BankDetailsScreen.js`
- POST `/api/v1/me/mechanic/bank/verify` -> `src/screens/mech/profile/BankDetailsScreen.js`
- POST `/api/v1/me/mechanic/bank` -> `src/screens/mech/profile/BankDetailsScreen.js`
- POST `/api/v1/me/mechanic/bank/:bankId/primary` -> `src/screens/mech/profile/BankDetailsScreen.js`
- DELETE `/api/v1/me/mechanic/bank/:bankId/delete` -> `src/screens/mech/profile/BankDetailsScreen.js`

### Jobs
- POST `/api/v1/jobs/create` -> `src/screens/carowner/assistance/ReportIssueScreen.js`, `src/context/JobsContext.js`
- GET `/api/v1/jobs/car-owner` -> `src/screens/carowner/history/HistoryScreen.js`, `src/context/JobsContext.js`
- GET `/api/v1/jobs/car-owner/:jobId` -> `src/context/JobsContext.js`, `src/screens/carowner/history/JobDetailsScreen.js`
- POST `/api/v1/jobs/car-owner/:jobId/update` -> `src/context/JobsContext.js`, `src/screens/carowner/history/EditJobScreen.js`
- DELETE `/api/v1/jobs/:jobId` -> `src/context/JobsContext.js`, `src/screens/carowner/history/JobDetailsScreen.js`
- GET `/api/v1/jobs/:jobId/mechanics/for-job` -> `src/screens/carowner/assistance/FindMechanicsScreen.js`
- GET `/api/v1/jobs/mechanic/assigned` -> `src/screens/mech/home/MechanicDashboardScreen.js`, `src/screens/mech/jobs/MechanicJobsScreen.js`
- GET `/api/v1/jobs/mechanic/assigned/:jobId` -> `src/screens/mech/jobs/MechanicJobDetailsScreen.js`
- POST `/api/v1/jobs/:jobId/status` -> `src/screens/mech/jobs/MechanicJobsScreen.js`, `src/screens/mech/jobs/MechanicJobDetailsScreen.js`
- POST `/api/v1/jobs/:jobId/confirm` -> `src/screens/carowner/assistance/LiveTrackingScreen.js`

### Chat
- POST `/api/v1/chat/conversations/create` -> `src/screens/carowner/assistance/FindMechanicsScreen.js`, `src/context/ChatContext.js`
- GET `/api/v1/chat/conversations` -> `src/context/ChatContext.js`
- GET `/api/v1/chat/conversations/:conversationId/messages` -> `src/context/ChatContext.js`, `src/screens/shared/ChatScreen.js`
- POST `/api/v1/chat/conversations/:conversationId/read` -> `src/context/ChatContext.js`, `src/screens/shared/ChatScreen.js`
- POST `/api/v1/chat/conversations/images/upload/:conversationId` -> `src/context/ChatContext.js`, `src/screens/shared/ChatScreen.js`
- POST `/api/v1/chat/conversations/:conversationId/quotation` -> `src/context/ChatContext.js`, `src/screens/shared/ChatScreen.js`
- POST `/api/v1/chat/conversations/:conversationId/quotation/respond` -> `src/context/ChatContext.js`, `src/screens/shared/ChatScreen.js`
- POST `/api/v1/chat/jobs/:jobId/payment/initiate` -> `src/context/ChatContext.js`, `src/screens/shared/ChatScreen.js`

## 🧩 Partially wired

- Mechanic dashboard summary fields (name, earnings, jobs done, rating, wallet balance)
  - `GET /api/v1/auth/me` is used for mechanic name and can provide rating if backend returns `rating` or `average_rating`.
  - `GET /api/v1/jobs/mechanic/assigned` is used for total jobs done on dashboard (using `total` or list length).
  - `GET /api/v1/wallet/balance` is used for wallet balance.
  - Earnings still has no dedicated mechanic earnings summary endpoint in current spec, so dashboard earnings remain placeholder.
- Wallet verify callback/deeplink
  - Manual verification is wired via `VerifyTopUpScreen`, but automatic callback/deeplink handler route remains unimplemented.

## Not wired

- WebSocket chat stream:
  - `wss://brodameko-server-50cv.onrender.com/api/v1/chat/ws`
  - `connectChatWebSocket`, `sendMessage`, `closeChatWebSocket` in `src/services/ws.service.js` are not used in production context/screens yet.

## 🧱 Missing screens

- Callback/deeplink verification route for wallet top-up (optional)
  - `VerifyTopUpScreen` is manual fallback; automatic callback handler screen/route remains unimplemented.
