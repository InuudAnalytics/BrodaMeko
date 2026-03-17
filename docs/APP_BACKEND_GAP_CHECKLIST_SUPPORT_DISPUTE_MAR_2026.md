# App-Backend Gap Checklist (Support, Disputes, and Related Flows)

Date: 2026-03-15 (updated)
Scope: Mobile app (`C:\bm\BrodaMeko`) against backend routes in `C:\bm\BrodaMeko-Backend`

## Confirmed backend capabilities not implemented (or not fully implemented) in app

- [x] User support ticket API integration

  - Implemented: `GET/POST /api/v1/support/tickets`, `GET /api/v1/support/tickets/{id}`, `GET /api/v1/support/tickets/{id}/messages`, `PATCH /api/v1/support/tickets/{id}/read`, `POST /api/v1/support/tickets/{id}/messages/images`
  - App now uses real API via `src/services/support.service.js`, `SupportScreen`, `SupportTicketListScreen`, and `SupportChatScreen`.

- [x] User support realtime chat integration

  - Implemented: `GET /api/v1/support/ws` WebSocket connect/send in `SupportChatScreen`.

- [x] Dispute API integration (new dispute module)

  - Implemented: `POST /api/v1/dispute/jobs/{id}/dispute`, `POST /api/v1/dispute/orders/{id}/dispute`, `GET /api/v1/dispute/disputes/jobs`, `GET /api/v1/dispute/disputes/orders`
  - App wiring exists in `src/services/dispute.service.js` and dispute list UI.

- [x] Evidence upload for disputes

  - Service-level support exists (multipart `evidence` up to 5 images).
  - Implemented for order disputes (`OrderDisputeScreen`).
  - Implemented for job disputes (`JobDisputeScreen`).

- [x] Dispute ticket linkage in support creation

  - `createSupportTicket` supports `job_dispute_id` and `order_dispute_id` payload fields.

- [x] Order dispute UX and history
  - History/list exists in `DisputeListScreen`.
  - End-user order dispute filing UX exists in marketplace `OrderTrackingScreen -> OrderDisputeScreen`, including `order_item_id` + evidence picker.

## Existing but partial app implementation to keep

- [x] Keep current job dispute fallback (`POST /api/v1/jobs/{id}/dispute`) during migration.
- [x] Migrate to `/api/v1/dispute/...` without breaking live users.

## Delivery plan (bit-by-bit)

### Phase 1: API plumbing and endpoint config

- [x] Add `support` section to `src/config/endpoints.js`
- [x] Add `dispute` section to `src/config/endpoints.js`
- [x] Create `src/services/support.service.js`
- [x] Create `src/services/dispute.service.js`
- [ ] Add typed payload validators and standardized error mapping

### Phase 2: Replace mock support submission

- [x] Wire `SupportScreen` submit to `POST /support/tickets`
- [x] Persist created ticket ID and navigate to real chat thread screen
- [ ] Add create-ticket category/priority inputs (default-safe values are currently used internally)
- [x] Add loading/error/retry states

### Phase 3: Real support ticket chat

- [x] Build `SupportTicketListScreen` using `GET /support/tickets`
- [ ] Build `SupportTicketDetailsScreen` using `GET /support/tickets/{id}`
- [ ] Build `SupportTicketMessagesScreen` using `GET /support/tickets/{id}/messages`
- [x] Implement image message upload with `POST /support/tickets/{id}/messages/images`
- [x] Implement mark-read with `PATCH /support/tickets/{id}/read`
- [x] Add support WS client for live incoming/outgoing updates

### Phase 4: Disputes (jobs and marketplace orders)

- [x] Add `File Job Dispute` form with evidence upload (`/dispute/jobs/{id}/dispute`)
- [x] Add `File Order Dispute` form with evidence + `order_item_id` support
- [x] Add `My Job Disputes` list screen (`/dispute/disputes/jobs`)
- [x] Add `My Order Disputes` list screen (`/dispute/disputes/orders`)
- [x] Add dispute detail card/surface in job/order tracking views
- [x] Link support ticket creation from dispute list/detail (`job_dispute_id` or `order_dispute_id`)
  - Implemented from `DisputeListScreen` row action: open existing linked ticket or auto-create linked ticket, then navigate to chat.

### Phase 5: Migration and hardening

- [x] Feature flag new dispute endpoints per role
  - Implemented in `src/config/featureFlags.js` with `isDisputeV2EnabledForRole(role)` and consumed in dispute screens + `jobs.service` routing.
- [x] Keep old job dispute endpoint as fallback for one release
- [x] Telemetry: success/failure rates for support/dispute APIs
  - Implemented app-side telemetry events (support ticket create, dispute submit, support WS lifecycle/send).
- [x] End-to-end QA matrix: car owner, mechanic, seller; with/without images; read states; reconnection
  - Added run matrix: `docs/QA_SUPPORT_DISPUTE_MATRIX_MAR_2026.md`.
- [x] Remove `SupportChatMockScreen` only after full parity
  - Route and navigation now use `ROUTES.SUPPORT_CHAT` + `SupportChatScreen`; legacy screen file removed.

## Suggested execution order for next sessions

- [x] Session 1: Phase 1 only (endpoints + services)
- [x] Session 2: Phase 2 (real support ticket submission)
- [x] Session 3: Phase 3 (ticket list/chat/messages + image upload)
- [x] Session 4: Phase 4 job disputes + history (partial)
- [x] Session 5: Phase 4 order disputes + support linking (via dispute list flow)
- [x] Session 6: Phase 5 cleanup, telemetry, QA, rollout

## Immediate remaining focus

1. Add typed payload validators and standardized error mapping in services.
2. Add category/priority selectors for support ticket creation UI (currently defaults are safe and backend-valid).
3. Split support chat into explicit ticket detail/messages screens if product wants route-level parity with backend resources.

4. Wallet credit path: backend GET /wallets/verify/payment only verifies Paystack status, it does not credit wallet balance.

- Backend file: wallet.go
- Actual credit happens in webhook handler (charge.success): webhook.go
- Impact: user can “verify payment success” and still see 0 until webhook is received/processed.

2. Paystack webhook production setup must be complete.

- Endpoint: POST /api/v1/webhooks/paystack
- Requires valid X-Paystack-Signature from Paystack (cannot be generated by app client).
- Ensure Paystack dashboard webhook URL + backend secret/env are correct.

3. Add backend-safe fallback for wallet top-up UX.

- In app, after verify success, poll /auth/me wallet for 30–60s and show “payment received, awaiting wallet credit webhook” if unchanged.
- App file: FundWalletScreen.js

Important cleanup

1. Remove/disable “Fund wallet” entry for non-car-owner roles if backend keeps funding car-owner only.

- Backend rule in wallet.go
- App file showing placeholder for mechanic: MechanicWalletScreen.js

2. Add strict payload validators + normalized error mapping in support/dispute services (still open in checklist).

- support.service.js
- dispute.service.js

3. Add contract tests for top-up/verify/webhook-dependent states (so this doesn’t regress).
   C:\bm\BrodaMeko-Backend>
