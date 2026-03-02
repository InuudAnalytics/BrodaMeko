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
