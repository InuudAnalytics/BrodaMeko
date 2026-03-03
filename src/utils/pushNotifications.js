import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { MOCK_FCM_TOKEN, getMockDeviceType } from '../config/mockDevice';

const loadMessagingModules = () => {
  try {
    const appModule = require('@react-native-firebase/app');
    const messagingModule = require('@react-native-firebase/messaging');
    return { appModule, messagingModule };
  } catch (error) {
    return null;
  }
};

const normalizePermissionStatus = (status) => {
  if (!status) {
    return 'unknown';
  }

  const normalized = String(status).toLowerCase();
  if (normalized.includes('authorized') || normalized === 'granted') {
    return 'granted';
  }
  if (normalized.includes('denied')) {
    return 'denied';
  }
  if (normalized.includes('blocked')) {
    return 'blocked';
  }
  return normalized;
};

const requestAndroidNotificationPermission = async () => {
  try {
    if (Platform.Version < 33) {
      return 'granted';
    }

    const permission = PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
    if (!permission) {
      return 'granted';
    }

    const current = await check(permission);
    if (current === RESULTS.GRANTED) {
      return 'granted';
    }
    if (current === RESULTS.BLOCKED) {
      return 'blocked';
    }

    const result = await request(permission);
    return normalizePermissionStatus(result);
  } catch (error) {
    return 'unknown';
  }
};

const requestIosNotificationPermission = async (messagingState) => {
  if (!messagingState) {
    return 'unknown';
  }

  try {
    const { type, messaging, messagingModule } = messagingState;
    const status =
      type === 'modular' && messagingModule?.requestPermission
        ? await messagingModule.requestPermission(messaging)
        : await messaging().requestPermission();
    return normalizePermissionStatus(status);
  } catch (error) {
    return 'unknown';
  }
};

export const requestNotificationPermission = async () => {
  const messagingState = getMessagingState();

  if (Platform.OS === 'android') {
    return requestAndroidNotificationPermission();
  }

  return requestIosNotificationPermission(messagingState);
};

export const getFcmToken = async () => {
  const messagingState = getMessagingState();

  if (!messagingState) {
    return __DEV__ ? MOCK_FCM_TOKEN : '';
  }

  try {
    const { type, messaging, messagingModule } = messagingState;
    const token =
      type === 'modular' && messagingModule?.getToken
        ? await messagingModule.getToken(messaging)
        : await messaging().getToken();
    return String(token || '').trim();
  } catch (error) {
    return __DEV__ ? MOCK_FCM_TOKEN : '';
  }
};

export const getDeviceType = () => getMockDeviceType();

export const listenForForegroundMessages = (handler) => {
  const messagingState = getMessagingState();
  if (!messagingState || typeof handler !== 'function') {
    return () => {};
  }

  const { type, messaging, messagingModule } = messagingState;
  if (type === 'modular' && messagingModule?.onMessage) {
    return messagingModule.onMessage(messaging, async (message) => {
      handler(message);
    });
  }

  return messaging().onMessage(async (message) => {
    handler(message);
  });
};

export const listenForNotificationOpen = (handler) => {
  const messagingState = getMessagingState();
  if (!messagingState || typeof handler !== 'function') {
    return () => {};
  }

  const { type, messaging, messagingModule } = messagingState;
  const unsubscribeOpen =
    type === 'modular' && messagingModule?.onNotificationOpenedApp
      ? messagingModule.onNotificationOpenedApp(messaging, (message) => {
          handler(message, 'background');
        })
      : messaging().onNotificationOpenedApp((message) => {
          handler(message, 'background');
        });

  const getInitial =
    type === 'modular' && messagingModule?.getInitialNotification
      ? messagingModule.getInitialNotification(messaging)
      : messaging().getInitialNotification();

  getInitial
    .then((message) => {
      if (message) {
        handler(message, 'initial');
      }
    })
    .catch(() => {});

  return unsubscribeOpen;
};

export const listenForTokenRefresh = (handler) => {
  const messagingState = getMessagingState();
  if (!messagingState || typeof handler !== 'function') {
    return () => {};
  }

  const { type, messaging, messagingModule } = messagingState;
  if (type === 'modular' && messagingModule?.onTokenRefresh) {
    return messagingModule.onTokenRefresh(messaging, (token) => {
      handler(token);
    });
  }

  return messaging().onTokenRefresh((token) => {
    handler(token);
  });
};

export const registerBackgroundMessageHandler = () => {
  const messagingState = getMessagingState();
  if (!messagingState) {
    return;
  }

  const { type, messaging, messagingModule } = messagingState;
  if (type === 'modular' && messagingModule?.setBackgroundMessageHandler) {
    messagingModule.setBackgroundMessageHandler(messaging, async () => {
      // TODO: Add background notification handling (local notifications) if needed.
    });
    return;
  }

  messaging().setBackgroundMessageHandler(async () => {
    // TODO: Add background notification handling (local notifications) if needed.
  });
};

const buildMessagingState = () => {
  const modules = loadMessagingModules();
  if (!modules) {
    return null;
  }
  const { appModule, messagingModule } = modules;
  if (!messagingModule) {
    return null;
  }

  if (messagingModule.getMessaging) {
    const app = appModule?.getApp ? appModule.getApp() : appModule?.app?.();
    if (!app) {
      return null;
    }
    const messaging = messagingModule.getMessaging(app);
    return { type: 'modular', messaging, messagingModule };
  }

  const messaging = messagingModule?.default || messagingModule;
  if (!messaging) {
    return null;
  }
  return { type: 'namespaced', messaging };
};

// Override module getter with a stable state builder.
const getMessagingState = () => buildMessagingState();
