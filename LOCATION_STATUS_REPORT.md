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

## OpenStreetMap (Quick Start Option)
If we want to avoid waiting on Google billing right now, we can use OpenStreetMap tiles as a quick start.

What this means:
1. Keep our current location permission system.
2. Replace Google map display with OpenStreetMap tile display.
3. Show real map background without Google API billing dependency for now.

Important note:
- This quick start is good for testing and early usage.
- It is not best for heavy production traffic.

### Current Status
- Quick start OpenStreetMap view is now integrated on the Car Owner dashboard.
- Live device location + OSM map now work together in current build flow.

## Production-Grade Option (Add Under Quick Start)
For stable long-term use, we should move from public free tiles to a proper map tile provider or managed service.

Recommended production path:
1. Use a provider (for example MapTiler, Stadia, or self-hosted tile service).
2. Get API access, SLA, better speed, and traffic reliability.
3. Keep OpenStreetMap data attribution in app.
4. Add caching, monitoring, and usage limits for smooth scale.

Expected result:
- Better reliability.
- Better performance.
- Lower risk of map outages as users grow.
