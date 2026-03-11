import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { LOCATION_ENABLED } from '../config/featureFlags';

const LOCATION_PERMISSION =
  Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

const PERMISSION_STATE = {
  unknown: 'unknown',
  granted: 'granted',
  denied: 'denied',
  blocked: 'blocked',
};

const CURRENT_POSITION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  forceRequestLocation: true,
  showLocationDialog: true,
};

const normalizePermissionStatus = (status) => {
  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return PERMISSION_STATE.granted;
  }

  if (status === RESULTS.BLOCKED || status === RESULTS.UNAVAILABLE) {
    return PERMISSION_STATE.blocked;
  }

  if (status === RESULTS.DENIED) {
    return PERMISSION_STATE.denied;
  }

  return PERMISSION_STATE.unknown;
};

const toLocation = (position) => {
  const coords = position?.coords || {};
  const latitude = Number(coords.latitude);
  const longitude = Number(coords.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: Number(coords.accuracy || 0),
  };
};

export const useUserLocation = () => {
  const [location, setLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(
    LOCATION_ENABLED ? PERMISSION_STATE.unknown : PERMISSION_STATE.blocked
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const refreshOnce = useCallback(async () => {
    if (!LOCATION_ENABLED) {
      return null;
    }

    if (permissionStatus !== PERMISSION_STATE.granted) {
      return null;
    }

    setLoading(true);
    setError(null);

    const nextLocation = await new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const normalized = toLocation(position);
          if (normalized) {
            setLocation(normalized);
            resolve(normalized);
            return;
          }

          setError('Could not read your location.');
          resolve(null);
        },
        (geoError) => {
          setError(geoError?.message || 'Could not get your location.');
          resolve(null);
        },
        CURRENT_POSITION_OPTIONS
      );
    });

    setLoading(false);
    return nextLocation;
  }, [permissionStatus]);

  const startWatching = useCallback(() => {
    // NOTE: watchPosition is intentionally disabled on this build.
    // android.location.FusedLocationProviderClient throws a native-level
    // java.lang.IncompatibleClassChangeError from RNFusedLocation when
    // startObserving/watchPosition is called. This is a JVM Error (not an
    // Exception) so it cannot be caught in JS and crashes the native thread.
    // Root cause: Play Services location library version mismatch in the build.
    // Safe path: use the one-shot refreshOnce() read, called from useFocusEffect
    // in DashboardScreen whenever the screen gains focus.
    // TODO: RE-ENABLE watchPosition once Play Services location version is aligned.
  }, []);

  const requestPermission = useCallback(async () => {
    if (!LOCATION_ENABLED) {
      setPermissionStatus(PERMISSION_STATE.blocked);
      setError(null);
      return PERMISSION_STATE.blocked;
    }

    setLoading(true);
    setError(null);

    try {
      const checkedStatus = await check(LOCATION_PERMISSION);
      let normalized = normalizePermissionStatus(checkedStatus);

      if (normalized === PERMISSION_STATE.denied || normalized === PERMISSION_STATE.unknown) {
        const requestedStatus = await request(LOCATION_PERMISSION);
        normalized = normalizePermissionStatus(requestedStatus);
      }

      setPermissionStatus(normalized);
      if (__DEV__) {
        console.log('[Location][Telemetry] request_permission_result', { status: normalized });
      }

      if (normalized === PERMISSION_STATE.granted) {
        await refreshOnce();
      }

      return normalized;
    } catch (requestError) {
      setPermissionStatus(PERMISSION_STATE.blocked);
      setError(requestError?.message || 'Location permission request failed.');
      return PERMISSION_STATE.blocked;
    } finally {
      setLoading(false);
    }
  }, [refreshOnce]);

  useEffect(() => {
    if (!LOCATION_ENABLED) {
      setPermissionStatus(PERMISSION_STATE.blocked);
      return;
    }
    let mounted = true;

    const hydratePermissionState = async () => {
      try {
        const checkedStatus = await check(LOCATION_PERMISSION);
        const normalized = normalizePermissionStatus(checkedStatus);
        if (!mounted) {
          return;
        }
        setPermissionStatus(normalized);
        if (__DEV__) {
          console.log('[Location][Telemetry] check_permission_on_mount', { status: normalized });
        }
        if (normalized === PERMISSION_STATE.granted) {
          await refreshOnce();
        }
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setPermissionStatus(PERMISSION_STATE.blocked);
        setError(requestError?.message || 'Location permission check failed.');
      }
    };

    hydratePermissionState();
    return () => {
      mounted = false;
    };
  }, [refreshOnce]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    permissionStatus,
    loading,
    error,
    requestPermission,
    startWatching,
    stopWatching,
    refreshOnce,
  };
};

export default useUserLocation;
