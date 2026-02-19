import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

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

const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  distanceFilter: 10,
  interval: 4000,
  fastestInterval: 3000,
  forceRequestLocation: true,
  showLocationDialog: true,
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
  const [permissionStatus, setPermissionStatus] = useState(PERMISSION_STATE.unknown);
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
    if (permissionStatus !== PERMISSION_STATE.granted || watchIdRef.current !== null) {
      return;
    }

    setError(null);
    watchIdRef.current = Geolocation.watchPosition(
      (position) => {
        const next = toLocation(position);
        if (!next) {
          return;
        }
        setLocation(next);
      },
      (geoError) => {
        setError(geoError?.message || 'Could not update your location.');
      },
      WATCH_OPTIONS
    );
  }, [permissionStatus]);

  const requestPermission = useCallback(async () => {
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
    requestPermission();
  }, [requestPermission]);

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
