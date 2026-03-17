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

## March 6, 2026

### Commits

1. **fix(mech): improve services update flow and add pull-to-refresh** (`57e39b4`)

   - Patched mechanic service estimate update flow to use correct payload/endpoint behavior.
   - Added refresh support for the services offered screen.

2. **feat(auth,profile): add T&C acceptance and legal-documents placeholder** (`9568740`)

   - Added Terms & Conditions acceptance checkbox to sign-up flow.
   - Added legal documents placeholder entry/page in profile.

3. **fix(notifications): harden token sync and background messaging setup** (`7ce72c1`)

   - Improved FCM token sync behavior and notification permission flow wiring.
   - Updated background notification handler setup.

### Release / Ops

1. Built and uploaded the first iOS `.ipa` to App Store Connect TestFlight using Codemagic middleware publishing flow.
2. Resolved App Store Connect upload blockers during the same cycle:
   - Invalid App Store Connect private key env handling in CI.
   - Missing iOS app icon / `CFBundleIconName` metadata.
   - External TestFlight submission requirement mismatch (beta metadata/compliance path).
   - Duplicate `CFBundleVersion` rejection by incrementing build versioning.

## March 9, 2026

### Commits

1. **fix(mech-dashboard): sync job card actions with status flow** (`14edfbb`) - 09:41 WAT

   - Synced mechanic dashboard active-job CTA behavior with status progression logic.
   - Reduced mismatch between dashboard and jobs tab action states.

2. **feat(mech-jobs): unify job cards and status-driven actions** (`194addd`) - 09:43 WAT

   - Introduced shared mechanic job card behavior across dashboard/jobs surfaces.
   - Standardized status-driven action rendering and final-state badge behavior.

## March 10, 2026

### Commits

1. **fix(notifications): keep permission gate open until explicit action** (`724b4bb`) - 12:49 WAT

   - Updated notification permission gate handling to remain visible until user explicitly accepts/declines.
   - Prevented premature dismissal when location permission modal flow overlaps.

2. **feat(spareparts): add seller pickup confirmation details flow** (`63f6146`) - 19:05 WAT

   - Added dedicated seller pickup order details screen with buyer/product details and 4-digit code input.
   - Wired pickup order routing from seller orders list and local completion state update after verification.

3. **chore(towing): annotate mock data and booking handler TODOs** (`59a367b`) - 19:05 WAT

   - Added explicit backend TODO markers for towing companies data source and booking action handler.
   - Kept current modal-based mock towing booking behavior intact.

4. **docs(logs): add march 9 and march 10 activity entries** (`ef0af1c`) - 19:06 WAT

   - Updated daily logs with dated/timestamped records for March 9 and March 10.

## March 11, 2026

### Commits

1. **chore: commit pending app updates including mechanic status gating and chat quotation fixes** (`13d5240`) - 13:40 WAT

   - Bundled pending marketplace/chat/job-flow fixes after backend sync updates.
   - Included mechanic status gating and quotation handling consistency fixes.

2. **feat(notifications): add foreground toast component and refine bell badge positioning** (`e4a997c`) - 14:24 WAT

   - Added reusable in-app foreground notification toast/banner component.
   - Refined bell unread badge placement for improved visual alignment.

3. **refactor(marketplace): unify buyer/mech flow into shared screens and tracking** (`a01a0b9`) - 16:02 WAT

   - Moved shared marketplace flows/screens for buyer and mechanic into common modules.
   - Unified tracking and checkout-related navigation/state behavior across roles.

4. **refactor(marketplace): share cart screen and fix dynamic store address + cart UI alignment** (`289f295`) - 21:39 WAT

   - Consolidated cart experience into shared screen implementation.
   - Patched dynamic store-address rendering and cart layout alignment issues.

## March 12, 2026

### Commits

1. **chore(marketplace): remove seller-order mocks and align endpoint notes** (`406688b`) - 14:09 WAT

   - Removed stale seller-order mock usage in active flows.
   - Updated integration notes to match current backend endpoint availability.

2. **feat(marketplace): wire store reviews submission and propagate store ids through order flow** (`4bebdb7`) - 14:16 WAT

   - Wired store review submission flow with backend integration.
   - Propagated store IDs through marketplace order/tracking data paths.

3. **feat(ui): add shared no-internet state for list screens and remove history mock fallback** (`312628b`) - 15:02 WAT

   - Added reusable no-internet component for list-fetch screens.
   - Removed remaining history mock fallback behavior.

4. **feat(marketplace): default checkout to pickup and switch tracking contact CTAs to call** (`b5bf20a`) - 15:04 WAT

   - Set pickup as default checkout mode.
   - Changed tracking contact CTAs from message to call behavior.

5. **fix(marketplace): reduce fallback usage with backend store data and remove stale withdraw placeholder** (`4c87c85`) - 15:25 WAT

   - Reduced frontend fallbacks where backend store payload now provides real values.
   - Removed stale withdrawal placeholder path.

6. **feat(legal): add privacy and terms docs and wire legal content in app** (`0f03bc9`) - 15:32 WAT

   - Added draft privacy policy and terms documents.
   - Wired legal content into app legal placeholder flows.

7. **chore(cleanup): remove unused mock auth server file** (`e221976`) - 15:45 WAT

   - Deleted unused `mockServer` auth stub that was no longer part of active flows.

8. **feat(payments): gate quote acceptance and unify checkout wallet/paystack flows** (`6e228d8`) - 16:51 WAT

   - Added wallet sufficiency gate before quotation acceptance + job escrow initiation.
   - Hid manual reference/trxref inputs in fund-wallet UI while keeping backend payload behavior.
   - Added wallet option/balance insufficiency handling in checkout.
   - Unified card/transfer through Paystack init path and added verify-with-fallback testing flow.

9. **fix(report-issue): replace broken issue icons and reorder electrical options** (`98941b6`) - 18:47 WAT

   - Replaced broken issue-reporting icons.
   - Reordered electrical issue options for clearer selection flow.

10. **feat(marketplace): use backend service fee and propagate totals to tracking** (`95e9ee1`) - 18:49 WAT

    - Switched marketplace totals to backend-provided service fee values.
    - Propagated subtotal/service-fee/total into tracking screens.

11. **Add car-owner dispute flow and silent live-tracking status sync** (`98c84d0`) - 19:52 WAT

    - Added car-owner dispute initiation flow.
    - Added silent live-tracking status sync behavior.

## March 13, 2026

### Commits

1. **Add profile reviews hub for mechanics and sellers** (`a3f3c2b`) - 07:43 WAT

   - Added reviews hub access in profile for mechanic and seller roles.

2. **Add profile recovery email add/verify/remove flow** (`2336f2f`) - 07:46 WAT

   - Added recovery email lifecycle flow in profile settings.

3. **Fix order tracking to support multi-item selection** (`8859869`) - 07:58 WAT

   - Added multi-item selection support in marketplace order tracking.

4. **Remove marketplace fallback placeholders and show loading states** (`c9e6183`) - 08:26 WAT

   - Removed stale marketplace placeholders and improved loading state handling.

5. **Align spare-parts address endpoints with seller store routes** (`8ed3f49`) - 08:31 WAT

   - Aligned spare-parts address endpoint usage with seller-store backend routes.

6. **feat(notifications): load in batches of 10 with scroll pagination** (`b00a4fb`) - 08:37 WAT

   - Added paginated notification loading with batch size of 10.

7. **feat(marketplace,chat): consume backend quote/store phone and coordinates fields** (`391753e`) - 08:52 WAT

   - Wired backend quote/store phone and coordinate fields into chat and marketplace flows.

8. **feat(marketplace): wire store details screen service and routes** (`bf261a8`) - 08:54 WAT

   - Wired store-details service call and navigation routes.

9. **fix(chat): use quotation id only for quote actions** (`f3cf3a6`) - 08:57 WAT

   - Updated quote actions to consistently use quotation ID.

10. **Fix API alignment and tracking/review flows** (`9c87a8f`) - 15:53 WAT

    - Aligned frontend methods/endpoints with backend contracts (jobs/chat/wallet).
    - Added tracking-screen cancel action behavior and review-flow updates.

11. **Update logo assets and auth/profile navigation cleanup** (`01c6684`) - 16:05 WAT

    - Updated app/logo assets and auth-page logo presentation.
    - Applied related auth/profile navigation cleanup.
