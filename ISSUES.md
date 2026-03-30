# BrodaMeko — Issues Backlog

---

## 1. Apple Sign-In Fails on Sign-Up — ⏳ PARTIALLY FIXED

**Root cause (diagnosed):**
Both screens call the same `signInWithApple` in `AuthContext.js:758`. Backend handles null name/email gracefully (`apple_sub` lookup, "Apple User" fallback). Real failure points are role mismatch and `selectedRole` being null at tap time.

**Fixed:**
- [x] Role mismatch handled entirely on frontend — `AuthContext.js` checks `authPayload.role !== normalizedSelectedRole` before calling `setAuthedState`. If mismatch, returns `{ roleMismatch: true, existingRole }` without logging the user in. `SignUpScreen.js` shows a modal with two options: **Sign In** (→ LoginScreen) or **Switch Role** (→ OnboardingCarousel/role selection).
- [x] Null `normalizedSelectedRole` already throws a clear error message at `AuthContext.js:779` ("Role could not be determined. Please select a role and try again.")

- [x] If Apple doesn't return a name (edge case: previously revoked auth), `signInWithApple` returns `{ needsName: true }` without creating the account. `SignUpScreen` shows a name input modal — on submit, `completeAppleSignIn` creates the account with the captured name included from the start.

**Remaining checklist:**
- [ ] Test with an Apple ID that has previously authorised the app

---

## 2. Location Permission — ✅ FIXED

- **iOS prompt not showing:** Auto-request guard in `DashboardScreen.js` was skipping `'denied'` status — fixed to also fire on `'denied'` (which is iOS's "not yet asked" state).
- **"Open settings" button doing nothing:** Replaced `openSettings()` from `react-native-permissions` with `Linking.openSettings()` from React Native core.

---

## 3. Location Toggle in Profile Screen — ✅ IMPLEMENTED

Inline `Switch` toggle added to all roles in `UserProfileScreen.js` (below Notifications, above Legal Documents):
- Toggle ON → system permission prompt (`request()`)
- Toggle OFF or already blocked → modal directing user to phone Settings
- `AppState` listener keeps toggle in sync when user returns from Settings

---

## 4. Terms & Conditions and Privacy Policy — ✅ DONE

- **Privacy Policy** → ✅ Loads `https://brodameko.app/privacy-policy-for-brodameko-mobile-application/` via in-app WebView.
- **Terms & Conditions** → ✅ Loads `https://brodameko.app/brodameko-terms-and-conditions/` via in-app WebView (same pattern — loading spinner, retry on failure, both WebViews pre-mounted with `display:none` for instant tab switching).

> Note: The inline Terms summary modal on SignUpScreen still shows local static content. This is intentional — it's a brief summary before accepting, not the full document. The "Open full legal document" link inside it navigates to the WebView screen.

---

## 5. Push Notifications — ✅ PERMISSION FIXED / ⏳ DEEP LINKING PENDING

### Permission prompt (Android + iOS) — ✅ FIXED
- Root cause: `react-native-permissions` v5 removed `PERMISSIONS.ANDROID.POST_NOTIFICATIONS` — the code was hitting an undefined guard and silently returning `'unknown'`.
- Fix: Both Android and iOS now use `checkNotifications()` / `requestNotifications()` from the v5 API (`src/utils/pushNotifications.js`).

### Paystack test → live mode — ⏳ BACKEND ACTION NEEDED
> **Backend:** Change `PAYSTACK_SECRET_KEY` from `sk_test_*` to the live key in your environment and restart. Also update the webhook URL in the **live** Paystack dashboard to point at the production server — test and live webhooks are registered separately.

### Push notification deep linking — ⏳ 27/31 DONE — 4 GAPS REMAIN

**Current state:** Frontend has title-based fallback routing in `NotificationsContext.js` as a stopgap. Backend has implemented data payloads on 27/31 call sites. Deep linking is live for all but the 4 gaps below.

**Remaining gaps (pending backend fix):**

> **Backend:** 4 call sites still missing data payloads:
>
> 1. `jobs/jobs.go:2083` — "Job Disputed" → add `map[string]string{"screen": "Disputes", "job_id": jobID.String()}`
> 2. `payment_webhook/webhook.go:591` — "Payment Secured" → add `map[string]string{"screen": "MechanicDashboardTabs", "job_id": jobID.String()}` (the "Payment Received" call just above it already has this pattern)
> 3. `marketplace/orders.go:2020` — `sendOrderPushAndSMS` helper — thread a `data map[string]string` param through from callers so order status updates can pass `{"screen": "CarOwnerMarketplace"/"SparePartsTabs", "order_id": "..."}`
> 4. `marketplace/store_reviews.go:179` — store review push → add `map[string]string{"screen": "SparePartsTabs"}`
