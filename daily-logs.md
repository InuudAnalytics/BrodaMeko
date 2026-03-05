# Daily Logs

## February 26, 2026

### Commits

1. **feat(notifications): move unread count to home badges** (`a784f2e`)
   - Moved unread count from notifications screen to home bell for car owner, mechanic, and seller.
   - Updated home dashboards and notifications screen.

2. **fix(auth): allow 6-char alphanumeric otp** (`bf9c049`)
   - OTP inputs now accept 6-character alphanumeric codes in reset password flow.

3. **fix(tabs): align footers at screen bottom** (`5887b62`)
   - Ensured bottom tab bars sit at the bottom across car owner, mechanic, and spare parts screens.

4. **feat(auth): restyle reset password and rules** (`659d651`)
   - Restyled reset password screen and updated password rule UI.

5. **fix(auth): route role changes via onboarding** (`c102530`)
   - Role selection now navigates via onboarding carousel.

6. **fix(nav): disable hardware back on key screens** (`226f346`)
   - Disabled back navigation on onboarding/login and dashboards.

7. **feat(auth): update forgot-password flow and success modal** (`383262b`)
   - Updated forgot password flow and added success modal component.

8. **feat(ui): add scrollable tabs component** (`9b6a1b3`)
   - Added scrollable tabs and applied to history/notifications/mechanic jobs.

9. **feat(carowner): refine live tracking actions** (`d6adfde`)
   - Added confirm-arrival/completion actions and post-job CTAs in live tracking.

10. **chore(mech): refresh services screens** (`0002d6b`)
    - Updated mechanic service pricing and set services UI.

11. **feat(profile): add address step for mech and seller** (`54b1fd9`)
    - Added address step/screen to mechanic and spare parts onboarding + profile.

## February 27, 2026

### Commits

1. **fix(auth): map seller role and remove car owner fallback** (`9c1c4eb`)
   - Correct seller role mapping on signup/login.
   - Removed car-owner fallback when role is missing.

2. **fix(spareparts): wire profile tab and back buttons** (`2ab0a58`)
   - Profile tab now opens shared profile screen.
   - Back buttons on spare parts tabs return to Home.

3. **feat(spareparts): store setup flow and session handling** (`9a7f4e3`)
   - Seller store setup screen + banner upload + time picker.
   - Marketplace seller store endpoints/services wired.
   - Spare parts profile state updated to store details.
   - Global 401 auto sign-out.
   - Updated endpoint audit + daily logs.

## March 2, 2026

### Commits

1. **feat(marketplace): add spare parts order tracking screen with timeline + actions** (`3371d18`)
   - Added marketplace order tracking screen with map + timeline.
   - Wired order tracking route for car owner flow.

2. **feat(marketplace): add rate product screen reusing ratings UI with product-focused tags** (`4ef6561`)
   - Added product rating screen based on mechanic ratings UI.
   - Wired rate product route in car owner marketplace flow.

3. **feat(marketplace): add cart + favorites contexts and product card** (`f6bbac6`)
   - Added CartContext + FavoritesContext with persistence.
   - Added marketplace ProductCard with cart + favorite actions.

4. **feat(marketplace): add car owner marketplace core screens** (`c84294b`)
   - Added marketplace list, product details, cart, and checkout screens for car owner.

5. **feat(marketplace): add car owner favorites, tracking, and feedback flows** (`899812b`)
   - Added favorites, order tracking, delivered success, feedback success flows.
   - Updated rate product flow to use feedback success screen.

6. **feat(marketplace): add mechanic marketplace screens** (`934401e`)
   - Added dedicated mechanic marketplace screens mirroring car owner flow.

7. **feat(navigation): wire marketplace routes and mechanic tab** (`9e03427`)
   - Added mechanic marketplace tab and routes in navigation stacks.

8. **chore(app): wrap app with favorites provider** (`61a4aee`)
   - Added FavoritesProvider to app root.

9. **chore(logs): update daily logs for Mar 2** (`f0809cf`)
   - Logged marketplace and navigation updates for March 2.

10. **feat(spareparts): add orders screen ui** (`ca2c97f`)
    - Added spare parts orders UI with tabs and status states.

11. **chore(api): expand endpoint registry** (`1acab89`)
    - Added additional auth, wallet, marketplace, and seller endpoints.

12. **feat(spareparts): expand seller service helpers** (`9164c16`)
    - Added seller services for bank, parts, images, and orders.

13. **feat(profile): add personal info alert and shared bank details** (`4de3841`)
    - Added profile completion alert and shared bank details screen for all roles.

14. **feat(mech): refresh dashboard tabs and online toggle** (`a33e495`)
    - Updated mechanic dashboard tabs, styling, and online toggle.

15. **feat(mech): align jobs screen header and tabs** (`91ca792`)
    - Updated mechanic jobs screen header and scrollable tabs.

16. **feat(mech): add address management UI and actions** (`b974c82`)
    - Added address empty state, delete, and primary selection in mechanic profile.

17. **feat(wallet): add withdraw modal and withdrawals feed** (`ec5e9bf`)
    - Added withdraw modal and merged withdrawals into wallet history.

18. **feat(reviews): wire mechanic reviews to API** (`be74400`)
    - Wired mechanic reviews list, submit, and replies to backend.

19. **feat(marketplace): wire products, cart, and order tracking** (`831a23f`)
    - Wired marketplace product list/detail, cart, checkout, and tracking.

20. **feat(spareparts): wire store products, images, and orders** (`5cda3d1`)
    - Wired seller products, images, and orders to backend endpoints.

21. **docs: update endpoint integration audit** (`234fe0c`)
    - Updated endpoint integration audit to reflect new wiring.

## March 3, 2026

### Commits

1. **chore(logs): update daily logs for Mar 2** (`a754db6`)
   - Synced daily log records after marketplace/profile integration work.

2. **feat(mech): add active job card and live tracking exit** (`0ef5861`)
   - Added active job card behavior and exit path in mechanic live-tracking flow.

3. **fix(map): show user location pin and reduce firebase warnings** (`8a880b6`)
   - Improved map marker rendering and reduced noisy firebase warnings.

4. **feat: notifications wiring, marketplace fixes, and image normalization** (`e3ac7dc`)
   - Expanded notification wiring and fixed marketplace/image handling issues.

5. **chore(config): add env-backed maps key and places helpers** (`e73efaa`)
   - Added env-driven maps setup and helper utilities for places features.

6. **feat(address): add autocomplete, location fill, and edit flow** (`d8a3783`)
   - Added address autocomplete, location autofill, and edit support.

7. **fix(mechanic): use dynamic rating on dashboard** (`e0f19f9`)
   - Replaced static rating usage with backend-driven values on mechanic dashboard.

8. **fix(mechanic): patch primary address endpoint** (`f48f914`)
   - Corrected primary-address API usage and update behavior.

## March 4, 2026

### Commits

1. **feat(marketplace): cart UX fixes and add-to-cart pulse** (`e34b8f5`)
   - Improved cart interactions and add-to-cart feedback animation.

2. **feat(live-tracking): wire ws + fallback endpoints (unfinished)** (`60393e3`)
   - Added websocket wiring and fallback endpoint plumbing for live tracking.

3. **fix(mechanic): accept jobs + earnings wiring (unfinished)** (`02fd260`)
   - Wired mechanic accept-job and earnings paths; marked incomplete.

4. **feat(assistance): show current city/state in find mechanics** (`52ce529`)
   - Added city/state visibility in car owner find-mechanics flow.

5. **feat: chat stability and wallet/marketplace updates** (`9f48e52`)
   - Improved chat stability and related wallet/marketplace behavior.

## March 5, 2026

### Commits

1. **feat: integrate history, chat, profile, notifications, and marketplace updates** (`3cb520e`)
   - Added history infinite scroll pagination (`onEndReached`) and pending-job action guards.
   - Synced cancel/delete job behavior with shared chat state and cancellation handling.
   - Updated quotation accept/decline flow with lock state and server reconciliation.
   - Fixed contact update payload handling for add-contact/confirm-contact OTP flow.
   - Updated bank details UX: primary badge behavior, add-account flow, and non-primary-only delete actions.
   - Swapped profile logout/delete icons per updated UI requirement.

2. **docs(logs): backfill daily logs for Mar 3, Mar 4, and Mar 5** (`a7461dd`)
   - Added missed records and grouped prior work by date.

3. **fix(chat): memoize route fallbacks and add history mechanic-id backend TODO** (`0f7be7c`)
   - Stabilized chat screen hook dependencies.
   - Added backend integration note for mechanic IDs in history job payloads.

4. **fix(bank): use PATCH for set-primary across mechanic and car owner** (`5689576`)
   - Aligned set-primary bank method with backend (`PATCH`) for all roles.

5. **fix(chat-history): guard ended conversations and stabilize chat navigation** (`946fd30`)
   - Added notification-to-chat guard so ended/deleted conversations do not navigate to broken chat.
   - Added ended-conversation handling for `404`/empty conversation payloads.
   - Improved history mechanic/rating fallbacks and rate action gating.

6. **chore(debug): add push token logs and stabilize services-offered loading** (`7a77b8f`)
   - Added debug logs for notification permission, FCM token fetch, and device registration.
   - Fixed services-offered loading loop by stabilizing context callback dependencies.

### Release / Ops

1. Published first Android build to Google Play internal testing track for QA/testing.
