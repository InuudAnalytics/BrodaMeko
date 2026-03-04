# Spare Parts Seller Flow Test Plan

Date: 2026-03-04

## Scope
Manual test plan for the spare parts seller flow and the car owner/mechanic marketplace flow, focused on UI state transitions, endpoint calls, and edge cases.

## Assumptions
- Backend endpoints may return empty arrays if no data exists yet.
- Chat flow and mechanic job acceptance conversation id are pending backend fixes.
- Fees (service + delivery) are currently hardcoded in UI; verify amounts shown match design.

## Roles & Entry Points
- **Seller**: Spare Parts dashboard / Store / Orders / Add product
- **Buyer (Car Owner)**: Marketplace / Product details / Cart / Checkout / Payment success
- **Mechanic**: Marketplace (mechanic view) / Cart / Checkout

---

## A) Seller: Store + Products

### A1. Create Store
**Screen**: Seller profile setup or Store setup screen

**Expected endpoint**: `POST /api/v1/marketplace/seller/store`

**Checks**
- Required fields: store_name, description, street, city, state, country, latitude, longitude, opening_time, closing_time, open_days[], delivery_type, delivery_scope
- On success: store details render in Store screen.
- On failure: user sees error message.

### A2. Upload Store Banner
**Expected endpoint**: `POST /api/v1/marketplace/seller/store/banner`

**Checks**
- Uploads single image file and updates UI preview.
- If upload fails: show error toast and keep previous banner.

### A3. Upload Store Logo (Avatar)
**Expected endpoint**: `POST /api/v1/marketplace/seller/store/logo`

**Checks**
- Uploads file successfully; profile avatar updates.

### A4. Add Product (Spare Part)
**Screen**: Add product screen

**Expected endpoint**: `POST /api/v1/marketplace/seller/parts`

**Checks**
- Required fields: name, description, price, category, stock_quantity (if applicable)
- Upload images section
  - Expected: `POST /api/v1/marketplace/seller/parts/:partId/images`
  - Delete: `DELETE /api/v1/marketplace/seller/parts/:partId/images?public_id=...`
- After success: product appears in Seller Store list.

### A5. Update Product
**Expected endpoint**: `PATCH /api/v1/marketplace/seller/parts/:partId`

**Checks**
- Update name, description, price, stock_quantity, is_available
- Ensure UI updates list item and availability badge.

### A6. Delete Product
**Expected endpoint**: `DELETE /api/v1/marketplace/seller/parts/:partId`

**Checks**
- Product removed from list.

---

## B) Buyer (Car Owner): Marketplace + Cart + Checkout

### B1. Marketplace List
**Endpoint**: `GET /api/v1/marketplace/parts`

**Checks**
- Items load, skeleton placeholders show while loading.
- Each card shows image, name, rating, price.
- Favorite button works (local store).

### B2. Product Details
**Endpoint**: `GET /api/v1/marketplace/parts/:partId`

**Checks**
- Carousel images + pagination dots.
- Quantity selector works.
- Add to cart triggers cart state update.
- Buy now routes to checkout with product only.

### B3. Cart
**Endpoints**
- `GET /api/v1/marketplace/cart`
- `POST /api/v1/marketplace/cart/items`
- `PATCH /api/v1/marketplace/cart/items/:itemId`
- `DELETE /api/v1/marketplace/cart/items/:itemId`
- `DELETE /api/v1/marketplace/cart/clear`

**Checks**
- Empty state renders image + text centered.
- Quantity updates and total recalculates.
- Remove item updates list.
- Proceed to checkout goes to Checkout screen.

### B4. Checkout
**Endpoint**: `POST /api/v1/marketplace/orders/checkout`

**Checks**
- Delivery vs pickup selection toggles.
- Payment method selection toggles.
- Confirm and pay navigates to PaymentSuccessScreen.
- Hardcoded fee rendering:
  - Delivery fee (ex: ₦5,000)
  - Service fee (ex: ₦500)
  - Total computed correctly.

**Edge cases**
- Insufficient wallet balance: should show user-friendly error.
- No primary bank (if wallet withdrawal needed): should redirect to bank details.

### B5. Payment Success
**Checks**
- Track order button routes to OrderTrackingScreen.
- Go to marketplace button returns to Marketplace.

---

## C) Seller Orders Flow

### C1. Orders list (Seller)
**Endpoint**: `GET /api/v1/marketplace/seller/orders`

**UI states**
- New → button: Prepare package
- Preparing → button: Mark as ready
- In transit → buttons: Chat with buyer / Track order
- Completed → button: View ratings

**Checks**
- Tabs update list correctly.
- Status pill color matches design.
- Order item card matches UI assets.

### C2. Order actions
**Endpoints**
- Mark shipped: `PATCH /api/v1/marketplace/orders/:orderId/items/:itemId/confirm`
- Buyer confirms received: `PATCH /api/v1/marketplace/orders/:orderId/items/:itemId/received`
- Cancel by buyer: `PATCH /api/v1/marketplace/orders/:orderId/cancel`

**Checks**
- Seller state transitions:
  - New → Preparing (Prepare package)
  - Preparing → In transit (Mark ready)
  - In transit → Completed (Buyer confirms)

---

## D) Cross-Flow: Seller → Buyer visibility

### D1. Product created shows in Marketplace
- After seller adds product, buyer marketplace list should include it.
- If using cached list, pull-to-refresh should fetch new product.

### D2. Order appears in seller orders
- After buyer checkout succeeds, seller order list should show new order.

---

## E) Additional Checks

### E1. Bank details
- Bank details screen shows existing bank card if present.
- Delete bank works.
- Set primary bank works.

### E2. Withdrawal
- If insufficient funds, show short error message.
- If no primary bank, show CTA to add bank details.
- Withdrawals appear in transactions with negative sign and title “Withdrawn”.

---

## Pending Backend Dependencies
- Chat conversation id passed in `/jobs/:jobId/request/status` for car owner.
- Live location allowed only after quotation accepted.

---

## Suggested Test Data
- Product names: LED headlights, Brake pads, Oil filter
- Delivery fee: ₦5,000
- Service fee: ₦500
- Cart total validation: item price + fees

