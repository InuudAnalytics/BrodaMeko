import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { registerDevice } from '../services/device.service';
import { getNotifications } from '../services/notifications.service';
import { useAuth } from './AuthContext';
import { navigationRef } from '../navigation/navigationRef';
import {
  getDeviceType,
  getFcmToken,
  listenForForegroundMessages,
  listenForNotificationOpen,
  listenForTokenRefresh,
  requestNotificationPermission,
} from '../utils/pushNotifications';

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
  const routeName = String(data?.screen || data?.route || data?.screen_name || '').trim();
  const params = data?.params && typeof data.params === 'object' ? data.params : {};

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

  const registerToken = useCallback(
    async (nextToken) => {
      const safeToken = String(nextToken || '').trim();
      if (!safeToken || !token) {
        return;
      }

      try {
        await registerDevice({ fcm_token: safeToken, device_type: getDeviceType() });
      } catch (error) {
        if (__DEV__) {
          console.log('[Notifications] Failed to register device token:', error?.message || error);
        }
      }
    },
    [token]
  );

  const syncToken = useCallback(async () => {
    if (!token) {
      setFcmToken('');
      tokenRef.current = '';
      return;
    }

    const status = await requestNotificationPermission();
    setPermissionStatus(status);

    const tokenValue = await getFcmToken();
    const trimmed = String(tokenValue || '').trim();

    if (!trimmed || trimmed === tokenRef.current) {
      return;
    }

    tokenRef.current = trimmed;
    setFcmToken(trimmed);
    await registerToken(trimmed);
  }, [registerToken, token]);

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
    if (navigationRef.isReady()) {
      navigationRef.navigate(target.routeName, target.params);
    }
  }, []);

  useEffect(() => {
    if (!isBootstrapped) {
      return undefined;
    }

    syncToken();

    const unsubscribeMessage = listenForForegroundMessages(handleForegroundMessage);
    const unsubscribeOpen = listenForNotificationOpen(handleNotificationOpen);
    const unsubscribeRefresh = listenForTokenRefresh(async (freshToken) => {
      const trimmed = String(freshToken || '').trim();
      if (!trimmed || trimmed === tokenRef.current) {
        return;
      }
      tokenRef.current = trimmed;
      setFcmToken(trimmed);
      await registerToken(trimmed);
    });

    return () => {
      unsubscribeMessage?.();
      unsubscribeOpen?.();
      unsubscribeRefresh?.();
    };
  }, [handleForegroundMessage, handleNotificationOpen, isBootstrapped, registerToken, syncToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshUnreadCount();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [refreshUnreadCount]);

  const value = useMemo(
    () => ({
      fcmToken,
      permissionStatus,
      lastNotification,
      unreadTick,
      requestPermission: requestNotificationPermission,
      refreshUnreadCount,
    }),
    [fcmToken, lastNotification, permissionStatus, refreshUnreadCount, unreadTick]
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
