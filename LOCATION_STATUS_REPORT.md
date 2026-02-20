# Broda Meko App V1 - Location Crash Report

## Problem Statement
Broda Meko app v1 was crashing when location feature tried to run.
This happened during map/location startup for car owner flow.

## Why It Happened
Main source of the problem:
- Google Maps API key is not fully activated yet.
- Google requires billing setup (about $10 activation) before full Maps SDK use.

Other related factors:
- App had location structure ready, but live map/location services were still waiting for active billing/key.
- When location flow runs with inactive key setup, app can fail or behave unstable on some screens/devices.

## What We Did (Temporary Safe Fix)
- We did **not** remove location system.
- We added a safe switch to disable live location calls for now.
- We kept all location/map structure in place for fast re-enable later.
- We added TODO notes in code so team knows exactly what to turn back on.

## Current App Behavior (What to Expect Now)
- App should open and run without location crash.
- Car owner dashboard still shows map-style UI structure (mock style).
- Live location request/calls are paused for now.
- User can continue normal flow without app breaking because of location.

## Final Solution Needed
To fully restore live location:
1. Activate Google billing and valid Maps key.
2. Turn location feature flag back on.
3. Verify on device.

After this, app should return to live location behavior quickly without major rework.
