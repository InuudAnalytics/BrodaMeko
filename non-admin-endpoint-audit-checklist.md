# Non-Admin Endpoint Audit Checklist

Date: 2026-03-13
Scope: Non-admin flows only (excluding hardcoded experts/towing and blocked delivery by request).

## High Priority

- [ ] Google auth route mismatch (frontend calls endpoint missing in backend router)

  - Frontend: `POST /api/v1/auth/google`
  - Ref: `src/services/auth.service.js`
  - Backend router lacks `/auth/google`
  - Ref: `BrodaMeko-Backend/internal/api/routers/user_router.go`

- [ ] Marketplace Paystack flow can continue as success without confirmed payment
  - Frontend contains "Continuing for testing" fallbacks on pending/failed verification
  - Ref: `src/screens/shared/marketplace/CheckoutScreen.js`

## Medium Priority

- [ ] Buyer marketplace order list/cancel flow is not wired in UI

  - Backend routes exist: `GET /marketplace/orders`, `PATCH /marketplace/orders/{id}/cancel`
  - Ref: `BrodaMeko-Backend/internal/api/routers/markert_place.go`
  - Frontend service methods exist but no screen usage found
  - Ref: `src/services/marketplace.service.js`

  C:\bm\BrodaMeko-Backend>

- [ ] Chat history pagination still underused

  - Chat bootstrap/refresh still fetches fixed `limit: 50, offset: 0`
  - Refs: `src/screens/shared/ChatScreen.js`, `src/context/ChatContext.js`

- [ ] Notifications screen still does not surface `unread_count`
  - Bell badges use unread count already
  - Refs: `src/screens/carowner/home/DashboardScreen.js`, `src/screens/mech/home/MechanicDashboardScreen.js`, `src/screens/spareparts/home/SellerDashboardScreen.js`
  - Notifications page does not display it
  - Ref: `src/screens/shared/NotificationsScreen.js`

## Tick-Off Notes

- Owner:
- Start date:
- Target completion date:

### Progress Log

- [ ] Item 1 complete
- [ ] Item 2 complete
- [ ] Item 3 complete
- [ ] Item 4 complete
- [ ] Item 5 complete
- [ ] Item 6 complete
- [ ] Item 7 complete
- [ ] Item 8 complete
- [ ] Item 9 complete
- [ ] Item 10 complete
