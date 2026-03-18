import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { registerDevice } from '../services/device.service';
import { getNotifications } from '../services/notifications.service';
import { useAuth } from './AuthContext';
import { navigationRef } from '../navigation/navigationRef';
import {
  checkNotificationPermission,
  getDeviceType,
  getFcmToken,
  listenForForegroundMessages,
  listenForNotificationOpen,
  listenForTokenRefresh,
  requestNotificationPermission,
} from '../utils/pushNotifications';
import { buildCallNavigationTarget } from '../utils/callRouting';
import { trackTelemetryEvent } from '../services/telemetry.service';

const NotificationsContext = createContext(undefined);

const normalizeRemoteMessage = (message) => {
  if (!message || typeof message !== 'object') {
    return null;
  }
  return {
    title: message?.notification?.title || message?.data?.title || '',
    body: message?.notification?.body || message?.data?.body || '',
    data: message?.data || {},
  };
};

const getNavigationTarget = (message) => {
  const data = message?.data || {};
  const callTarget = buildCallNavigationTarget(data);
  if (callTarget) {
    return callTarget;
  }

  const routeName = String(data?.screen || data?.route || data?.screen_name || '').trim();
  let params = data?.params && typeof data.params === 'object' ? data.params : {};
  if (!Object.keys(params).length && typeof data?.params === 'string') {
    try {
      const parsed = JSON.parse(data.params);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        params = parsed;
      }
    } catch {
      params = {};
    }
  }

  if (routeName) {
    return { routeName, params };
  }

  return { routeName: 'Notifications', params: {} };
};

export const NotificationsProvider = ({ children }) => {
  const { token, isBootstrapped } = useAuth();
  const [fcmToken, setFcmToken] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [lastNotification, setLastNotification] = useState(null);
  const [unreadTick, setUnreadTick] = useState(0);
  const tokenRef = useRef('');
  const appStateRef = useRef(AppState.currentState);
  const hadTokenRef = useRef(false);
  const registerRetryRef = useRef(null);

  const logTelemetry = useCallback((event, payload = {}) => {
    if (__DEV__) {
      console.log('[Notifications][Telemetry]', event, payload);
    }
    trackTelemetryEvent(event, payload);
  }, []);

  const registerToken = useCallback(
    async (nextToken, { source = 'unknown', attempt = 1 } = {}) => {
      const safeToken = String(nextToken || '').trim();
      if (!safeToken || !token) {
        logTelemetry('register_token_skipped', {
          hasToken: Boolean(token),
          hasFcmToken: Boolean(safeToken),
          source,
        });
        return;
      }

      try {
        await registerDevice({ fcm_token: safeToken, device_type: getDeviceType() });
        logTelemetry('register_device_success', { source, attempt });
      } catch (error) {
        logTelemetry('register_device_failed', {
          source,
          attempt,
          message: error?.message || String(error),
        });
        if (registerRetryRef.current) {
          clearTimeout(registerRetryRef.current);
          registerRetryRef.current = null;
        }
        if (attempt < 3) {
          registerRetryRef.current = setTimeout(() => {
            registerToken(safeToken, { source: `${source}_retry`, attempt: attempt + 1 });
          }, attempt * 2500);
        }
      }
    },
    [logTelemetry, token]
  );

  const syncGrantedToken = useCallback(async ({ source = 'manual', forceRegister = false } = {}) => {
    const tokenValue = await getFcmToken();
    const trimmed = String(tokenValue || '').trim();
    logTelemetry('fcm_token_fetched', {
      source,
      hasToken: Boolean(trimmed),
      sameAsCurrent: trimmed && trimmed === tokenRef.current,
    });

    if (!trimmed && __DEV__) {
      console.warn(
        '[Notifications] Permission granted but no FCM token returned. Check Firebase/APNs configuration.'
      );
    }

    if (!trimmed) {
      return;
    }

    const changed = trimmed !== tokenRef.current;
    tokenRef.current = trimmed;
    setFcmToken(trimmed);
    if (changed || forceRegister) {
      await registerToken(trimmed, { source, attempt: 1 });
    }
  }, [logTelemetry, registerToken]);

  const checkAndSyncToken = useCallback(async (source = 'manual') => {
    if (!token) {
      setFcmToken('');
      tokenRef.current = '';
      setPermissionStatus('unknown');
      logTelemetry('permission_check_skipped_no_auth', { source });
      return;
    }

    const status = await checkNotificationPermission();
    setPermissionStatus(status);
    logTelemetry('permission_status_check', { source, status });
    if (status !== 'granted') {
      setFcmToken('');
      tokenRef.current = '';
      return;
    }

    await syncGrantedToken({ source });
  }, [logTelemetry, syncGrantedToken, token]);

  const requestAndSyncToken = useCallback(async () => {
    if (!token) {
      return;
    }

    const status = await requestNotificationPermission();
    setPermissionStatus(status);
    logTelemetry('permission_status_request', { status });
    if (status !== 'granted') {
      setFcmToken('');
      tokenRef.current = '';
      return;
    }

    await syncGrantedToken({ source: 'permission_request' });
  }, [logTelemetry, syncGrantedToken, token]);

  const promptPermissionIfNeeded = useCallback(
    async (source = 'manual_prompt') => {
      if (!token) {
        logTelemetry('permission_prompt_skipped_no_auth', { source });
        return 'unknown';
      }

      const currentStatus = await checkNotificationPermission();
      setPermissionStatus(currentStatus);
      logTelemetry('permission_status_before_prompt', { source, status: currentStatus });

      if (currentStatus === 'granted') {
        await syncGrantedToken({ source, forceRegister: true });
        return 'granted';
      }

      if (currentStatus === 'blocked') {
        return 'blocked';
      }

      const requestedStatus = await requestNotificationPermission();
      setPermissionStatus(requestedStatus);
      logTelemetry('permission_status_after_prompt', { source, status: requestedStatus });

      if (requestedStatus === 'granted') {
        await syncGrantedToken({ source: `${source}_granted`, forceRegister: true });
      } else {
        setFcmToken('');
        tokenRef.current = '';
      }

      return requestedStatus;
    },
    [logTelemetry, syncGrantedToken, token]
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      await getNotifications({ page: 1, limit: 1 });
      setUnreadTick((prev) => prev + 1);
    } catch (error) {
      // Ignore refresh failure.
    }
  }, []);

  const handleForegroundMessage = useCallback(
    (message) => {
      const normalized = normalizeRemoteMessage(message);
      if (!normalized) {
        return;
      }
      setLastNotification(normalized);
      setUnreadTick((prev) => prev + 1);
    },
    []
  );

  const handleNotificationOpen = useCallback((message) => {
    const normalized = normalizeRemoteMessage(message);
    if (normalized) {
      setLastNotification(normalized);
    }
    const target = getNavigationTarget(message || {});
    logTelemetry('push_opened', {
      route: target?.routeName || '',
      has_call_target: target?.routeName === 'CallIncoming',
    });
    if (navigationRef.isReady()) {
      navigationRef.navigate(target.routeName, target.params);
    }
  }, [logTelemetry]);

  useEffect(() => {
    if (!isBootstrapped) {
      return undefined;
    }
    if (!token) {
      setFcmToken('');
      tokenRef.current = '';
      hadTokenRef.current = false;
      return undefined;
    }

    const hasTokenNow = Boolean(token);
    const source = !hadTokenRef.current && hasTokenNow ? 'login_access' : 'provider_active';
    hadTokenRef.current = hasTokenNow;
    checkAndSyncToken(source);
    if (source === 'login_access') {
      syncGrantedToken({ source: 'login_access_force_register', forceRegister: true });
      promptPermissionIfNeeded('login_access_auto_prompt');
    }

    const unsubscribeMessage = listenForForegroundMessages(handleForegroundMessage);
    const unsubscribeOpen = listenForNotificationOpen(handleNotificationOpen);
    const unsubscribeRefresh = listenForTokenRefresh(async (freshToken) => {
      const trimmed = String(freshToken || '').trim();
      if (!trimmed || trimmed === tokenRef.current) {
        return;
      }
      tokenRef.current = trimmed;
      setFcmToken(trimmed);
      await registerToken(trimmed, { source: 'token_refresh', attempt: 1 });
    });

    return () => {
      if (registerRetryRef.current) {
        clearTimeout(registerRetryRef.current);
        registerRetryRef.current = null;
      }
      unsubscribeMessage?.();
      unsubscribeOpen?.();
      unsubscribeRefresh?.();
    };
  }, [checkAndSyncToken, handleForegroundMessage, handleNotificationOpen, isBootstrapped, promptPermissionIfNeeded, registerToken, syncGrantedToken, token]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        checkAndSyncToken('app_foreground');
        refreshUnreadCount();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [checkAndSyncToken, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      fcmToken,
      permissionStatus,
      lastNotification,
      unreadTick,
      requestPermission: requestAndSyncToken,
      recheckPermissionStatus: checkAndSyncToken,
      promptPermissionIfNeeded,
      refreshUnreadCount,
    }),
    [checkAndSyncToken, fcmToken, lastNotification, permissionStatus, promptPermissionIfNeeded, refreshUnreadCount, requestAndSyncToken, unreadTick]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return context;
};

export default NotificationsContext;
