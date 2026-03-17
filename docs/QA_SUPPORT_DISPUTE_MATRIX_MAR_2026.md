# QA Matrix: Support and Dispute Flows

Date: 2026-03-15
App repo: `C:\bm\BrodaMeko`
Backend reference: `C:\bm\BrodaMeko-Backend`

## Backend contract references used

- Support router: `internal/api/routers/user_support_router.go`
  - `GET /api/v1/support/ws`
  - `POST /api/v1/support/tickets`
  - `GET /api/v1/support/tickets`
  - `GET /api/v1/support/tickets/{id}`
  - `GET /api/v1/support/tickets/{id}/messages`
  - `POST /api/v1/support/tickets/{id}/messages/images`
  - `PATCH /api/v1/support/tickets/{id}/read`
- Dispute router: `internal/api/routers/user_dispute_router.go`
  - `POST /api/v1/dispute/jobs/{id}/dispute`
  - `POST /api/v1/dispute/orders/{id}/dispute`
  - `GET /api/v1/dispute/disputes/jobs`
  - `GET /api/v1/dispute/disputes/orders`
- Legacy fallback: `internal/api/routers/jobs_router.go`
  - `POST /api/v1/jobs/{id}/dispute`

## Automated checks run in this pass

- `eslint` on touched support/dispute/navigation/flags files: PASS
- `jest`:
  - `__tests__/dispute.service.test.js`: PASS
  - `__tests__/support.service.test.js`: PASS
  - `__tests__/notificationRouting.test.js`: PASS

## Manual matrix

Use this grid for role/device QA sign-off.

| Area | Scenario | Car Owner | Mechanic | Seller | Expected |
|---|---|---|---|---|---|
| Support create | Create generic ticket | [ ] | [ ] | [ ] | Ticket created, opens `SupportChat`, appears in ticket list |
| Support create | Create linked ticket from dispute (`job_dispute_id`) | [ ] | [ ] | N/A | Ticket created and linked to job dispute |
| Support create | Create linked ticket from dispute (`order_dispute_id`) | [ ] | N/A | [ ] | Ticket created and linked to order dispute |
| Support list | Fetch `GET /support/tickets` and open thread | [ ] | [ ] | [ ] | List loads, row opens matching chat thread |
| Support chat | Receive live message over WS (`/support/ws`) | [ ] | [ ] | [ ] | New message appears without refresh |
| Support chat | Send image message | [ ] | [ ] | [ ] | Upload succeeds and image shows in thread |
| Support read state | Mark read (`PATCH /support/tickets/{id}/read`) | [ ] | [ ] | [ ] | Unread count/read state clears correctly |
| Support reconnect | Network drop and reconnect WS | [ ] | [ ] | [ ] | Connection recovers and message flow resumes |
| Job dispute submit | Submit with reason only | [ ] | [ ] | N/A | Dispute created via role-enabled endpoint |
| Job dispute submit | Submit with images (<=5) | [ ] | [ ] | N/A | Multipart evidence accepted and shown in list/detail |
| Order dispute submit | Submit reason + `order_item_id` | [ ] | N/A | [ ] | Dispute created and listed in order disputes |
| Order dispute submit | Submit with images (<=5) | [ ] | N/A | [ ] | Multipart evidence accepted and shown in list/detail |
| Dispute list | Load job disputes (`GET /dispute/disputes/jobs`) | [ ] | [ ] | N/A | List renders with latest entries |
| Dispute list | Load order disputes (`GET /dispute/disputes/orders`) | [ ] | N/A | [ ] | List renders with latest entries |
| Dispute detail | Open item from list to detail view | [ ] | [ ] | [ ] | Detail screen shows status, evidence, metadata |
| Dispute->support link | Open linked ticket or create new linked ticket | [ ] | [ ] | [ ] | Navigates to support chat with correct ticket |
| Fallback safety | Force v2 off by role, submit job dispute | [ ] | [ ] | N/A | Uses legacy `POST /jobs/{id}/dispute` without user breakage |

## Notes for execution

- Ensure roles map to app auth roles used by feature flags:
  - `car_owner`, `mechanic`, `seller` (`spare_parts_seller` alias supported).
- For evidence tests, include both:
  - no-image payload
  - image payload (multipart)
- For reconnect tests, toggle airplane mode for 10-15 seconds while on chat screen.
