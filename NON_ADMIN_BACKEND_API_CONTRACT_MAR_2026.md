# BrodaMeko Non-Admin Backend API Contract (Detailed) - March 10, 2026 (Post-Pull Validation)

This is a frontend-facing contract for non-admin roles only:
- car_owner
- mechanic
- seller

Source files reviewed (including latest pull to `baf26ca`):
- `C:\bm\BrodaMeko-Backend\internal\api\routers\*.go`
- `C:\bm\BrodaMeko-Backend\internal\api\handlers\**\*.go`
- `C:\bm\BrodaMeko-Backend\internal\models\**\*.go`
- `C:\bm\BrodaMeko-Backend\internal\types\enums.go`
- `C:\bm\BrodaMeko-Backend\migrations\*.sql`

## 1. Base URL and Middleware

- Base prefix: `/api/v1`
- Main mount: `internal/api/routers/router.go`
- JWT middleware is active for most routes.
- Public exclusions include signup/login/otp and some marketplace reads.

## 2. Global Response Format

Success:
- Common success style is HTTP 200 with JSON containing `status: "success"` and endpoint-specific data.

Error:
- Standard error helper returns:
```json
{ "status": "error", "message": "..." }
```

Pagination:
- `page` and `per_page` are standard for many handlers.
- Defaults: `page=1`, `per_page=20`, maximum `per_page=100`.

## 3. Canonical Value Sets You Can Safely Send

### 3.1 Job Issue Types (`issue_type`)

Allowed values (from `jobs` and mechanic profile handlers):
- `flat_tyres`
- `tyre_burst`
- `wheel_alignment_issue`
- `battery_problem`
- `dead_battery`
- `alternator_failure`
- `starter_motor_fault`
- `engine_overheating`
- `engine_knocking`
- `engine_misfire`
- `engine_stalling`
- `brake_failure`
- `brake_pad_worn`
- `brake_fluid_leak`
- `abs_fault`
- `gear_not_shifting`
- `clutch_problem`
- `transmission_leak`
- `electrical_fault`
- `headlight_issue`
- `dashboard_warning_light`
- `wiring_problem`
- `fuse_problem`
- `oil_leak`
- `coolant_leak`
- `fuel_leak`
- `power_steering_leak`
- `steering_problem`
- `suspension_noise`
- `shock_absorber_issue`
- `fuel_pump_failure`
- `injector_problem`
- `car_not_accelerating`
- `ac_not_cooling`
- `key_locked_inside`
- `ignition_problem`
- `car_accident_damage`
- `towing_needed`
- `general_inspection`
- `other`

### 3.2 Job Status Values

Known status values in backend:
- `pending`, `accepted`, `en_route`, `arrived`, `in_progress`, `completed`, `cancelled`, `rejected`, `disputed`

Status update endpoint behavior (`PATCH /jobs/{id}/status`):
- Mechanic may set: `en_route`, `arrived`, `in_progress`, `cancelled`, `completed`
- Car owner may set: `cancelled` only
- Car owner cancel only allowed when current job status is `pending` or `accepted`
- Jobs already `completed`, `cancelled`, or `disputed` cannot be updated
- Mechanic must be assigned mechanic for that job
- `completed` path is special:
  - sets completion timestamp and owner confirmation deadline
  - returns message that completion is awaiting owner confirmation

### 3.3 Hiring and Quotation Actions

- Job request response action: `accept` or `decline`
- Quotation response action: `accept` or `reject`

### 3.4 Payment and Delivery Values

- Job payment method: `wallet` or `paystack`
- Marketplace checkout payment method: `wallet` or `paystack`
- Store delivery type: `pickup`, `delivery`, or `both`
- Store delivery scope (when applicable): `state` or `nationwide`
- Checkout fulfillment type (when required): `pickup` or `delivery`

### 3.5 Device and Notification Filters

- Device type for FCM registration: `android`, `ios`, `web`
- Notifications category filter: `jobs`, `payments`, `system`
- Notifications `is_read` filter: `true` or `false`

## 4. Endpoint Contract By Module

All paths below are prefixed by `/api/v1`.

### 4.1 Auth and Account (`/auth/*`)

1. `POST /auth/signup`
- Body: user signup payload (strict decoder, unknown fields rejected).
- Must provide exactly one contact identity: email or phone.
- Typical success includes user and token context.

2. `POST /auth/login`
- Body:
```json
{ "email": "optional", "phone_number": "optional", "password": "required" }
```
- Must provide exactly one of email/phone.
- Success returns auth token and user profile payload.

3. `POST /auth/verify-otp`
- Body: `{ "otp": "string" }`

4. `POST /auth/resend-otp`
- Body: `{ "email": "..." }` or `{ "phone_number": "..." }`

5. `POST /auth/forgot-password`
- Body: `{ "email": "..." }` or `{ "phone_number": "..." }`

6. `PATCH /auth/reset-password/reset`
- Body:
```json
{
  "email": "optional",
  "phone_number": "optional",
  "otp": "required",
  "new_password": "required",
  "confirm_password": "required"
}
```

7. `PATCH /auth/update-password`
- Body:
```json
{ "current_password": "required", "new_password": "required" }
```

8. `POST /auth/devices/register`
- Body:
```json
{ "fcm_token": "required", "device_type": "android|ios|web" }
```

9. `POST /auth/upload-avatar`
- Multipart upload.

10. `POST /auth/logout`

11. `GET /auth/me`
- Returns rich profile payload. Includes role-specific enrichments.

12. `POST /auth/verify/add-contact`
- Body: one of email or phone.

13. `POST /auth/verify/confirm-contact`
- Body: `{ "otp": "string" }`

14. `GET /auth/users/contact-status`

15. `DELETE /auth/users/delete`
- Body: `{ "password": "required" }`
- Can be blocked by unresolved disputes/open obligations.

### 4.2 Car Owner Bank (`/me/car-owner/*`)

- `POST /me/car-owner/bank/verify`
  - Body: `{ "account_number": "required", "bank_name": "required" }`
- `POST /me/car-owner/bank`
  - Body: `{ "bank_name", "bank_code", "account_number", "account_name" }`
- `PATCH /me/car-owner/bank/{id}/primary`
- `DELETE /me/car-owner/bank/{id}/delete`
- `GET /me/car-owner/bank`

Role rule: only `car_owner` can call these.

### 4.3 Mechanic Profile (`/me/mechanic/*`)

Services:
- `POST /me/mechanic/add-services`
  - Body: `{ "issue_type": <allowed_issue_type>, "min_price": >0, "max_price": >= min_price }`
- `GET /me/mechanic/services`
- `PATCH /me/mechanic/services/{id}`
  - Body: `{ "min_price": >0, "max_price": >= min_price }`
- `DELETE /me/mechanic/services/{id}`
- `PATCH /me/mechanic/online-status`
- `GET /me/mechanic/earnings`

Bank:
- `GET /me/mechanic/bank/list`
- `POST /me/mechanic/bank/verify`
  - Body: `{ "account_number", "bank_name" }`
- `POST /me/mechanic/bank`
  - Body: `{ "bank_name", "bank_code", "account_number", "account_name" }`
- `PATCH /me/mechanic/bank/{id}/primary`
- `DELETE /me/mechanic/bank/{id}`
- `GET /me/mechanic/bank`

Address:
- `POST /me/mechanic/address`
  - Body includes address fields plus optional coordinates and `is_primary`.
- `GET /me/mechanic/address`
- `PATCH /me/mechanic/address/{id}`
- `DELETE /me/mechanic/address/{id}`
- `PATCH /me/mechanic/address/{id}/primary`

Role rule: only `mechanic` can call these.

### 4.4 Seller Bank (`/seller/me/*`)

- `POST /seller/me/bank/verify`
  - Body: `{ "account_number", "bank_name" }`
- `POST /seller/me/bank`
  - Body: `{ "bank_name", "bank_code", "account_number", "account_name" }`
- `PATCH /seller/me/bank/{id}/primary`
- `DELETE /seller/me/bank/{id}/delete`
- `GET /seller/me/bank`

Role rule: only `seller`.

### 4.5 Jobs (`/jobs/*`)

Create and manage:
- `POST /jobs/create` (car_owner)
  - Multipart fields:
  - `issue_type` required and must be valid
  - `car_make` required
  - `description` required when `issue_type=other`
  - `images[]` optional, max 2
- `GET /jobs/car-owner`
- `GET /jobs/car-owner/{id}`
- `PATCH /jobs/car-owner/{id}/update` (car_owner)
  - Multipart update, supports `remove_images` JSON array and adding new `images[]`
- `DELETE /jobs/{id}`

Status/dispute/confirmation:
- `PATCH /jobs/{id}/status`
  - See status rules in section 3.2
- `POST /jobs/{id}/confirm`
- `POST /jobs/{id}/dispute` (car_owner)
  - Body: `{ "reason": "required" }`

Discovery and conversation:
- `GET /jobs/{id}/mechanics/for-job` (car_owner)
- `GET /jobs/{id}/get/conversation`
- `GET /jobs/mechanics/{id}/stats`
- `GET /jobs/mechanic/assigned`
- `GET /jobs/mechanic/assigned/{id}`

Hiring subflow:
- `POST /jobs/{id}/hire` (car_owner)
  - Body: `{ "mechanic_id": "uuid" }`
  - Job must still be pending
- `POST /jobs/{id}/request/respond` (mechanic)
  - Body: `{ "action": "accept|decline" }`
- `GET /jobs/{id}/request/status`
- `GET /jobs/mechanic/job-requests`

Live location subflow:
- `POST /jobs/{id}/location/update`
  - Body: `{ "lat": number, "lng": number, "heading"?: number, "speed"?: number }`
  - Allowed only for active statuses: `accepted`, `en_route`, `arrived`, `in_progress`
- `GET /jobs/{id}/location/latest`

### 4.6 Wallet and Transactions

Wallet:
- `POST /wallets/top-up`
  - Body: `{ "amount": number, "email": optional }`
  - Constraints:
  - amount > 0
  - minimum top-up amount is 100 NGN
  - handler is car_owner flow
- `GET /wallets/verify/payment`
- `POST /wallets/request`
  - Body: `{ "amount": number }`
  - Role: `car_owner` or `mechanic`
- `GET /wallets/withdrawals`

Transactions:
- `GET /transactions/list`
- `GET /transactions/{reference}`

### 4.7 Chat and Quotations (`/chat/*`)

Realtime:
- `GET /chat/ws` (WebSocket)

Conversations:
- `POST /chat/conversations/create` (car_owner)
  - Body: `{ "mechanic_id": "uuid", "job_id": "uuid" }`
- `GET /chat/conversations`
- `GET /chat/conversations/{id}/messages`
- `PATCH /chat/conversations/{id}/read`
- `POST /chat/conversations/images/upload/{id}` (multipart image)

Quotation:
- `POST /chat/conversations/{id}/quotation` (mechanic)
  - Body: `{ "amount": number > 0, "job_id": "uuid" }`
- `POST /chat/conversations/{id}/quotation/respond` (car_owner)
  - Body: `{ "quotation_id": "uuid", "action": "accept|reject" }`

Job payment initiation:
- `POST /chat/jobs/{id}/payment/initiate` (car_owner)
  - Body: `{ "payment_method": "wallet|paystack", "email"?: "string" }`
  - Payment is allowed only if job status is one of:
  - `accepted`, `en_route`, `arrived`, `in_progress`, `completed`
  - Disallows payment if already paid.
  - Requires an accepted quotation.

### 4.8 Notifications (`/notifications/*`)

- `GET /notifications/all`
  - Query options:
  - `category=jobs|payments|system`
  - `is_read=true|false`
  - pagination via helper query params
- `PATCH /notifications/read-all`
- `PATCH /notifications/{id}/read`
- `DELETE /notifications/{id}`

### 4.9 Marketplace (`/marketplace/*`)

Store:
- `POST /marketplace/seller/store`
- `PATCH /marketplace/seller/store`
  - Body:
  - `store_name` required
  - `delivery_type`: `pickup|delivery|both`
  - if delivery_type is `delivery` or `both`, `delivery_scope` must be `state` or `nationwide`
- `GET /marketplace/seller/store/me`
- `POST /marketplace/seller/store/logo` (multipart)
- `POST /marketplace/seller/store/banner` (multipart)
- `GET /marketplace/stores/{id}`

Parts:
- `GET /marketplace/parts`
- `GET /marketplace/parts/{id}`
- `POST /marketplace/seller/parts` (seller, multipart)
  - required constraints include:
  - `name` required
  - `price` > 0
  - `stock_quantity` >= 0
  - `condition` is `new` or `refurbished`
  - `images[]` max 5
- `GET /marketplace/seller/parts/me`
- `PATCH /marketplace/seller/parts/{id}`
  - similar validations as create
- `DELETE /marketplace/seller/parts/{id}`
- `POST /marketplace/seller/parts/{id}/images` (multipart)
- `DELETE /marketplace/seller/parts/{id}/images?public_id=...`

Cart:
- `GET /marketplace/cart`
- `POST /marketplace/cart/items`
  - Body: `{ "part_id": "uuid", "quantity": integer >= 1 }`
- `PATCH /marketplace/cart/items/{id}`
  - Body: `{ "quantity": integer >= 1 }`
- `DELETE /marketplace/cart/items/{id}`
- `DELETE /marketplace/cart/clear`

Orders:
- `POST /marketplace/orders/checkout`
  - Body:
```json
{
  "payment_method": "wallet|paystack",
  "delivery_street": "...",
  "delivery_city": "...",
  "delivery_state": "...",
  "delivery_country": "...",
  "notes": "optional",
  "email": "optional/required by payment path",
  "contact_phone": "optional but validated if provided",
  "fulfillment_type": "pickup|delivery (required when seller supports both)"
}
```
- `GET /marketplace/orders`
- `GET /marketplace/orders/{id}`
- `PATCH /marketplace/orders/{id}/cancel`
- `PATCH /marketplace/orders/{id}/items/{itemId}/confirm` (seller confirms)
- `PATCH /marketplace/orders/{id}/items/{itemId}/received` (buyer confirms)
- `GET /marketplace/seller/orders`

### 4.10 Mechanic Reviews (`/mechanic-reviews/*`)

- `POST /mechanic-reviews/{id}/review` (car_owner)
  - Body: `{ "rating": 1..5, "comment": "optional text" }`
  - Must have completed work history with mechanic
- `GET /mechanic-reviews/{id}/reviews`
- `GET /mechanic-reviews/{id}/replies`
- `POST /mechanic-reviews/{id}/reply`
  - Role constraints enforced (mechanic replies to own profile reviews, etc.)

## 5. Representative Success Payload Shapes

These are patterns, not exact exhaustive schemas.

1. Status-message success:
```json
{ "status": "success", "message": "..." }
```

2. Data payload success:
```json
{ "status": "success", "data": { ... } }
```

3. List payload success:
```json
{ "status": "success", "data": [ ... ] }
```

4. Paginated list success (many endpoints):
```json
{
  "status": "success",
  "data": [ ... ],
  "total": 123,
  "page": 1,
  "per_page": 20,
  "pages": 7
}
```

## 6. Representative Error Cases You Should Handle

1. Validation:
- HTTP 400, message like `invalid request body`, `status is required`, `invalid ...`

2. Unauthorized / forbidden:
- HTTP 401 when token/user context missing
- HTTP 403 when role is wrong for endpoint

3. Not found:
- HTTP 404 for missing resource (`job not found`, `part not found`, etc.)

4. Conflict:
- HTTP 409 for duplicate/conflicting action (already requested, already paid, already replied)

## 7. Important Implementation Notes For Frontend

1. Some router entries are method-agnostic (`HandleFunc` without method token), but handlers still enforce method checks internally. Follow methods in this document.

2. Unknown JSON fields are rejected on many endpoints (`decoder.DisallowUnknownFields()` used frequently).

3. Multipart endpoints have explicit max file limits. Exceeding limits returns 400.

4. Contracts here are current as of March 10, 2026 from code, not Swagger (Swagger/OpenAPI file is not present in repo).

## 8. Related Schema Files

Core schema files for these non-admin flows:
- `migrations/000001_create_users_table.up.sql`
- `migrations/000006_create_jobs_table.up.sql`
- `migrations/000008_create_escrows_table.up.sql`
- `migrations/000012_create_conversations_table.up.sql`
- `migrations/000013_create_messages_table.up.sql`
- `migrations/000014_create_quotations_table.up.sql`
- `migrations/000019_create_job_disputes_table.up.sql`
- `migrations/000031_create_withdrawals_table.up.sql`
- `migrations/000033_create_seller_stores_table.up.sql`
- `migrations/000034_create_spare_parts_table.up.sql`
- `migrations/000035_create_carts_table.up.sql`
- `migrations/000036_create_cart_items_table.up.sql`
- `migrations/000037_create_orders_table.up.sql`
- `migrations/000038_create_order_items_table.up.sql`
- `migrations/000039_create_order_escrows_table.up.sql`

## 9. Frontend State Machine Rules (Derived From Code)

This section is intended for strict UI transition handling where backend does not expose an official transition table endpoint.

### 9.1 Job Status Update (`PATCH /jobs/{id}/status`)

Send format:
```json
{ "status": "<target_status>" }
```

Actor-based allowed target statuses:
- Mechanic: `en_route`, `arrived`, `in_progress`, `cancelled`, `completed`
- Car owner: `cancelled` only

Server-side guard constraints:
- Car owner can only cancel when current status is `pending` or `accepted`.
- Request is rejected if job is already terminal: `completed`, `cancelled`, `disputed`.
- Mechanic must be the assigned mechanic on that job.

Notably absent in backend:
- No explicit full transition graph (for example, no hard check that `arrived` must come after `en_route`).
- Frontend should not assume undocumented transitions are valid long-term.

### 9.2 Operational Meaning of Key Statuses

- `completed` (set by mechanic):
  - Backend sets completion metadata and owner confirmation deadline.
  - Response is success + message; no full state object is returned in that endpoint response.
- `cancelled`:
  - Backend attempts escrow refund logic for held escrow on cancel path.
  - Response is success + message; refund ledger details are not returned inline.
- `disputed`:
  - Dispute is filed via `POST /jobs/{id}/dispute` with `{ "reason": "..." }`.
  - Endpoint does not return settlement/refund breakdown payload.

### 9.3 Frontend Rules To Implement Safely

1. Trust server as source of truth:
- After mutation calls, refresh job details/list (or merge from canonical stream/event) instead of relying only on optimistic local transitions.

2. Send only actor-allowed statuses:
- Mechanic UI should expose only: `en_route`, `arrived`, `in_progress`, `cancelled`, `completed`.
- Car owner UI should expose only cancel action.

3. Treat 4xx as normal transition rejection:
- `400`: invalid transition/state constraint.
- `403`: role/ownership/assignment violation.
- `404`: resource no longer present.
- Show backend `message` directly where appropriate.

4. Do not infer refund completion from cancel response body:
- If refund confirmation is needed in UI, fetch wallet/transactions/withdrawals/escrow-related surfaces after cancellation.

5. Prefer resilient client state machine:
- Use current server status + role to compute available next actions at render time.
- If server rejects an action, roll back optimistic UI and refresh.

## 10. Post-Pull Delta (baf26ca)

Validation result against backend update d9cae9b..baf26ca:
- No non-admin route contract changes were introduced.
- `internal/api/handlers/jobs/jobs.go` changed variable ordering in `GetJobConversation`, with no request/response schema change.
- Existing non-admin status/action rules in this document remain valid.

