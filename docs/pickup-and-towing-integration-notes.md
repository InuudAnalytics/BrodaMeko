# Pickup And Towing Integration Notes

## Scope
- Towing flow (car owner assistance)
- Spare parts pickup flow (buyer + seller)

## 1. Existing Endpoints Reused

### Marketplace / Pickup
- `POST /api/v1/marketplace/orders/checkout`
  - Used in checkout to create order with `fulfillment_type` (`pickup` or `delivery`).
- `GET /api/v1/marketplace/seller/orders`
  - Used by seller orders list.
- `PATCH /api/v1/marketplace/orders/{orderId}/items/{itemId}/confirm`
  - Used for existing seller order progression (prepare/ready flow).

### Towing
- No towing-specific endpoint is currently configured in `src/config/endpoints.js`.

## 2. Missing Endpoints Required

### Towing
- `GET /towing-companies` (or equivalent)
  - Required to replace static towing companies list.
- `POST /towing-requests` (or equivalent)
  - Required to create a towing booking when user taps `Book`.

### Pickup
- Seller pickup verification endpoint (example):
  - `POST /api/v1/marketplace/orders/{orderId}/pickup/verify`
  - Required so seller can validate buyer secret code server-side.
- Pickup code issuance endpoint/field
  - Backend should issue and persist `pickup_code` at order creation and return it in order payloads.
- Shop coordinates for pickup navigation
  - Backend should return pickup shop latitude/longitude in order or seller store data.
- Normalized order fulfillment field in seller orders payload
  - Backend should consistently return `fulfillment_type` (`pickup` or `delivery`) to avoid heuristics.

## 3. Temporary Mocks / Local Fallbacks In Use

- Static towing dataset:
  - `src/data/towingCompanies.js`
- Towing booking action is local/modal only:
  - `src/screens/carowner/assistance/TowingCompaniesScreen.js`
- Buyer pickup code local generation fallback:
  - `src/screens/carowner/marketplace/CheckoutScreen.js`
  - `src/screens/carowner/marketplace/PickupTrackingScreen.js`
- Seller pickup code fallback derivation + local comparison:
  - `src/screens/spareparts/orders/PickupOrderDetailsScreen.js`
- Pickup map coordinates fallback (Lagos default):
  - `src/screens/carowner/marketplace/PickupTrackingScreen.js`

## 4. Screens Dependent On Missing Endpoints

### Towing
- `src/screens/carowner/assistance/TowingCompaniesScreen.js`
- `src/components/towing/TowingCompanyDetailsModal.js`

### Pickup
- `src/screens/carowner/marketplace/CheckoutScreen.js`
- `src/screens/carowner/marketplace/PaymentSuccessScreen.js`
- `src/screens/carowner/marketplace/PickupTrackingScreen.js`
- `src/screens/spareparts/orders/OrdersScreen.js`
- `src/screens/spareparts/orders/PickupOrderDetailsScreen.js`

