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

### Uncommitted updates (post-commit)
- **Seller store setup screen** (`src/screens/spareparts/profile/SparePartsAddressScreen.js`)
  - Store setup payload fields + banner upload UI.
  - Time picker modal (00:00–23:59).
  - Section headers with arrow styling.
- **Marketplace endpoints + services**
  - Added seller store endpoints in `src/config/endpoints.js`.
  - Added seller store service functions in `src/services/spareParts.service.js`.
- **Spare parts profile state**
  - `SparePartsProfileContext` updated to use `storeDetails` instead of addresses.
- **Delete account endpoint switch**
  - `deleteAccount` now uses DELETE method in `src/services/auth.service.js`.
- **Global 401 sign-out handler**
  - Unauthorized responses trigger forced sign-out (`src/services/api.js`, `src/context/AuthContext.js`).
- **Seller onboarding routing**
  - Setup flow routes to seller tabs instead of placeholder.
