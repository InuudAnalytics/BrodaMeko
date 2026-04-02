# App Store Review — Issue Resolution Report

**App:** BrodaMeko
**Submission ID:** ebaf115a-1f8b-4ea6-ba0c-38d5c86c0088
**Review Date:** March 24, 2026
**Review Device:** iPad Air 11-inch (M3), iPadOS 26.3.1
**Resolution Date:** March 26, 2026

---

## Issue 1 — Guideline 4.8: Login Services

### Problem Statement

The app offered third-party login options (Google, Apple) but the Sign in with Apple flow was non-functional at the time of review. When a user tapped "Sign up with Apple" on the registration screen, an error message — *"Apple Sign-In is not available in this build yet."* — was displayed inline on the screen. This indicated that the Apple authentication native module was not properly linked, making Sign in with Apple unavailable as a functional login path.

Apple's Guideline 4.8 requires that any app offering third-party login must provide an equivalent login option that: limits data collection to name and email, allows users to keep their email private, and does not collect interaction data for advertising without consent. Sign in with Apple satisfies all three requirements and must be present and functional if other third-party login methods are offered.

### Resolution

The `@invertase/react-native-apple-authentication` library was integrated as the native module powering the Sign in with Apple flow. The authentication logic was updated to use this library on iOS, with a platform guard ensuring the module is only loaded on iOS devices. The corresponding pod (`RNAppleAuthentication`) was added to the iOS `Podfile` to ensure proper native linking.

The Apple Sign-In button on Android was updated to appear visually dimmed and be non-interactive, since Sign in with Apple is an iOS-exclusive feature. This prevents any misleading error states from surfacing on Android.

These changes were applied to both the Login screen and the Sign Up screen.

---

## Issue 2 — Guideline 4.0: iPad Layout (Overlapping Elements)

### Problem Statement

On the Personal Information screen (the profile editing screen accessible from a user's profile), interface elements were overlapping when the app was used on an iPad Air 11-inch (M3). Specifically, the "Update" action button at the bottom of the screen was rendering over the last form field ("Add recovery email"), partially obscuring it and making it inaccessible.

The root cause was a layout structure that placed the form fields inside a fixed `View` container with no scroll capability. On smaller phone screens, the available vertical space was sufficient to display all fields without overlap. On larger iPad screens, the taller viewport caused the content area to expand, pushing the bottom fields into or behind the fixed Update button positioned outside the scrollable region.

### Resolution

The form fields container on the Personal Information screen was converted from a static `View` to a `ScrollView`. This ensures that regardless of screen size or content height, all form fields remain fully accessible and scrollable above the Update button. The Update button itself remains anchored at the bottom of the screen outside the scroll area, which is the intended interaction pattern.

This fix applies to all user roles (Car Owner, Mechanic, Spare Parts Seller) as they all share the same Personal Information screen implementation.

---

## Summary of Changes

| File | Change |
|---|---|
| `ios/Podfile` | Added `RNAppleAuthentication` pod |
| `package.json` | Added `@invertase/react-native-apple-authentication` dependency |
| `src/context/AuthContext.js` | Wired up invertase Apple auth library; iOS-only platform guard |
| `src/screens/auth/LoginScreen.js` | Apple button disabled and dimmed on Android |
| `src/screens/auth/SignUpScreen.js` | Apple button disabled and dimmed on Android |
| `src/screens/carowner/profile/EditProfileScreen.js` | Replaced `View` with `ScrollView` for form fields |
