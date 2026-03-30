# Push Notification Routing Checklist

Each notification needs a `data` payload sent from the backend so the frontend
knows which screen to open when the user taps it.

Frontend reads: `data.screen` → navigates, `data.params` → JSON string of route params.

---

## Group 1 — Jobs

| # | File | Title | Recipient | Screen | Params |
|---|------|-------|-----------|--------|--------|
| 1.1 | `chat/chat.go:224` | New hire request (chat) | Mechanic | `MechanicChat` | `job_id`, `conversation_id` |
| 1.2 | `jobs/hire.go:177` | New job request (hire) | Mechanic | `MechanicChat` | `job_id` |
| 1.3 | `jobs/hire.go:340` | Request declined | Car Owner | `CarOwnerDashboard` | `job_id` |
| 1.4 | `jobs/hire.go:527` | Request accepted | Car Owner | `CarOwnerLiveTracking` | `job_id` |
| 1.5 | `jobs/jobs.go:1414` | Mechanic En Route | Car Owner | `CarOwnerLiveTracking` | `job_id` |
| 1.6 | `jobs/jobs.go:1416` | Mechanic Arrived | Car Owner | `CarOwnerLiveTracking` | `job_id` |
| 1.7 | `jobs/jobs.go:1418` | Job In Progress | Car Owner | `CarOwnerLiveTracking` | `job_id` |
| 1.8 | `jobs/jobs.go:1421` | Job Cancelled (by owner) | Mechanic | `MechanicDashboardTabs` | `job_id` |
| 1.9 | `jobs/jobs.go:1423` | Job Cancelled (by mechanic) | Car Owner | `CarOwnerHistory` | `job_id` |
| 1.10 | `jobs/jobs.go:1347` | Job Completed — Confirm? | Car Owner | `CarOwnerHistory` | `job_id` |
| 1.11 | `jobs/jobs.go:1954` | Payment Released | Mechanic | `MechanicDashboardTabs` | `job_id` |
| 1.12 | `jobs/jobs.go:2076` | Job Disputed | Mechanic | `Disputes` | `job_id` |
| 1.13 | `cron_jobs/auto_confirm_jobs.go:77` | Payment Released (Auto-Confirmed) | Mechanic | `MechanicDashboardTabs` | `job_id` |

- [x] FCM service supports data payload
- [x] `SendPushToUser` forwards data
- [x] 1.1 — chat.go new hire message
- [x] 1.2 — hire.go new job request
- [x] 1.3 — hire.go declined
- [x] 1.4 — hire.go accepted
- [x] 1.5–1.9 — jobs.go status updates + cancellations
- [x] 1.10 — jobs.go completion confirm
- [x] 1.11 — jobs.go payment released
- [ ] 1.12 — jobs.go:2083 "Job Disputed" — NO data map ⚠️ needs `{"screen":"Disputes","job_id":"..."}`
- [x] 1.13 — auto_confirm_jobs.go

---

## Group 2 — Chat & Quotations

| # | File | Title | Recipient | Screen | Params |
|---|------|-------|-----------|--------|--------|
| 2.1 | `chat/chat.go:788` | New Image | Recipient | `CarOwnerChat` / `MechanicChat` | `job_id`, `conversation_id` |
| 2.2 | `chat/chat.go:943` | New Quotation | Car Owner | `CarOwnerChat` | `job_id`, `conversation_id` |
| 2.3 | `chat/chat.go:1090` | Quotation Rejected | Mechanic | `MechanicChat` | `job_id`, `conversation_id` |
| 2.4 | `chat/chat.go:1185` | Job Assigned / Quotation Accepted | Mechanic | `MechanicChat` | `job_id`, `conversation_id` |
| 2.5 | `chat/chat.go:1508–1511` | Payment Received / Secured (chat path) | Mechanic | `MechanicDashboardTabs` | `job_id` |

- [x] 2.1 — new image in chat
- [x] 2.2 — new quotation
- [x] 2.3 — quotation rejected
- [x] 2.4 — quotation accepted / job assigned
- [x] 2.5 — payment from chat confirm

---

## Group 3 — Payments & Wallet

| # | File | Title | Recipient | Screen | Params |
|---|------|-------|-----------|--------|--------|
| 3.1 | `payment_webhook/webhook.go:292` | Withdrawal Successful | Any | `CarOwnerDashboard` / `MechanicDashboardTabs` | — |
| 3.2 | `payment_webhook/webhook.go:377` | Withdrawal Failed | Any | `CarOwnerDashboard` / `MechanicDashboardTabs` | — |
| 3.3 | `payment_webhook/webhook.go:444` | Wallet Funded | Any | `CarOwnerDashboard` / `MechanicDashboardTabs` | — |
| 3.4 | `payment_webhook/webhook.go:585–593` | Payment Received / Secured (webhook path) | Mechanic | `MechanicDashboardTabs` | `job_id` |
| 3.5 | `payment_webhook/order_payment.go:277` | Order Confirmed! | Buyer | `CarOwnerMarketplace` | `order_id` |
| 3.6 | `payment_webhook/order_payment.go:290` | New Order! (webhook) | Seller | `SparePartsTabs` | `order_id` |

- [x] 3.1–3.3 — wallet webhook notifications
- [ ] 3.4 — webhook.go:591 "Payment Secured" — NO data map ⚠️ needs `{"screen":"MechanicDashboardTabs","job_id":"..."}`
- [x] 3.5–3.6 — order payment webhook

---

## Group 4 — Marketplace & Orders

| # | File | Title | Recipient | Screen | Params |
|---|------|-------|-----------|--------|--------|
| 4.1 | `marketplace/orders.go:1637` | Order Placed! | Buyer | `CarOwnerMarketplace` | `order_id` |
| 4.2 | `marketplace/orders.go:1733` | New Order! | Seller | `SparePartsTabs` | `order_id` |
| 4.3 | `marketplace/orders.go:2018` | Order status update | Buyer / Seller | `CarOwnerMarketplace` / `SparePartsTabs` | `order_id` |
| 4.4 | `marketplace/store_reviews.go:179` | Store Review Received | Seller | `SparePartsTabs` | — |
| 4.5 | `marketplace/store_reviews.go:575` | Store Review Reply | Reviewer | `SparePartsTabs` | — |

- [x] 4.1–4.2 — Order Placed! / New Order! (direct calls)
- [ ] 4.3 — orders.go `sendOrderPushAndSMS` helper — NO data map ⚠️ needs `order_id` + role-appropriate screen
- [x] 4.4 — store_reviews.go:179 — ⚠️ NO data map (screen: SparePartsTabs, no deep-link ID needed)
- [x] 4.5 — store review reply

---

## Group 5 — Disputes

| # | File | Title | Recipient | Screen | Params |
|---|------|-------|-----------|--------|--------|
| 5.1 | `disputes/user_disputes.go:212` | Dispute Filed (job) | Mechanic | `Disputes` | `dispute_id` |
| 5.2 | `disputes/user_disputes.go:415` | Order Dispute Filed | Seller | `Disputes` | `dispute_id` |
| 5.3 | `admins/admin_disputes.go:185` | Dispute Under Review | Filer | `Disputes` | `dispute_id` |

- [x] 5.1 — Dispute Filed (job) ✅
- [x] 5.2 — Order Dispute Filed ✅ (has screen + dispute_id)
- [x] 5.3 — Dispute Under Review ✅

---

## Group 6 — Support

| # | File | Title | Recipient | Screen | Params |
|---|------|-------|-----------|--------|--------|
| 6.1 | `admins/admin_support.go:445` | Support Reply | User | `SupportChat` | `ticket_id` |
| 6.2 | `admins/admin_support.go:575` | Support Image | User | `SupportChat` | `ticket_id` |
| 6.3 | `admins/admin_support.go:674` | Ticket Resolved | User | `Support` | `ticket_id` |

- [x] 6.1 — Support Reply ✅
- [x] 6.2 — Support Image ✅
- [x] 6.3 — Ticket Resolved ✅ (screen: "Support", ticket_id)

---

## Group 7 — Reviews

| # | File | Title | Recipient | Screen | Params |
|---|------|-------|-----------|--------|--------|
| 7.1 | `mechanic_reviews/mechanic_reviews.go:185` | New mechanic review | Mechanic | `UserReviews` | — |
| 7.2 | `mechanic_reviews/mechanic_reviews.go:594` | Review reply | Reviewer | `UserReviews` | — |

- [x] 7.1 — New mechanic review ✅ (screen: "UserReviews")
- [x] 7.2 — Review reply ✅ (screen: "UserReviews")

---

## Group 8 — Calls

Calls are already routed via `callRouting.js` on the frontend using `call_id`, `caller_id` etc.
Backend (`calls/calls.go:366`) already sends these fields.

- [x] Calls already handled end-to-end
