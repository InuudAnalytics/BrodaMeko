import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { RESULTS, checkNotifications, requestNotifications } from 'react-native-permissions';

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

const normalizeMessagingAuthorizationStatus = (status) => {
  if (typeof status !== 'number') {
    return normalizePermissionStatus(status);
  }

  if (status === 1 || status === 2 || status === 3) {
    return 'granted';
  }
  if (status === 0) {
    return 'denied';
  }
  if (status === -1) {
    return 'unknown';
  }

  return 'unknown';
};

const checkAndroidNotificationPermission = async () => {
  try {
    console.log('[Notifications][Android] Platform.Version:', Platform.Version);
    const { status } = await checkNotifications();
    const normalized = normalizePermissionStatus(status);
    console.log('[Notifications][Android] checkNotifications status:', status, '→', normalized);
    return normalized;
  } catch (error) {
    console.warn('[Notifications][Android] checkAndroidNotificationPermission error:', error?.message);
    return 'unknown';
  }
};

const requestAndroidNotificationPermission = async () => {
  try {
    console.log('[Notifications][Android] Platform.Version:', Platform.Version);
    const { status: currentStatus } = await checkNotifications();
    console.log('[Notifications][Android] pre-request checkNotifications:', currentStatus);

    if (currentStatus === RESULTS.GRANTED) {
      console.log('[Notifications][Android] already granted');
      return 'granted';
    }
    if (currentStatus === RESULTS.BLOCKED) {
      console.log('[Notifications][Android] blocked — user must enable from Settings');
      return 'blocked';
    }

    console.log('[Notifications][Android] calling requestNotifications...');
    const { status } = await requestNotifications([]);
    const normalized = normalizePermissionStatus(status);
    console.log('[Notifications][Android] requestNotifications result:', status, '→', normalized);
    return normalized;
  } catch (error) {
    console.warn('[Notifications][Android] requestAndroidNotificationPermission error:', error?.message);
    return 'unknown';
  }
};

// iOS: use Firebase messaging directly — it calls requestAuthorizationWithOptions
// and immediately registers for APNs in the correct sequence. Using
// react-native-permissions for notifications on iOS conflicts with Firebase
// and can cause FCM token retrieval to fail (firebase-ios-sdk #7272).
const checkIosNotificationPermission = async () => {
  try {
    const messagingState = getMessagingState();
    if (!messagingState) {
      console.warn('[Notifications][iOS] Firebase messaging not available');
      return 'unknown';
    }
    const { type, messaging, messagingModule } = messagingState;
    const status =
      type === 'modular' && messagingModule?.hasPermission
        ? await messagingModule.hasPermission(messaging)
        : await messaging().hasPermission();
    const normalized = normalizeMessagingAuthorizationStatus(status);
    console.log('[Notifications][iOS] messaging.hasPermission:', status, '→', normalized);
    return normalized;
  } catch (error) {
    console.warn('[Notifications][iOS] checkIosNotificationPermission error:', error?.message);
    return 'unknown';
  }
};

const requestIosNotificationPermission = async () => {
  try {
    const messagingState = getMessagingState();
    if (!messagingState) {
      console.warn('[Notifications][iOS] Firebase messaging not available');
      return 'unknown';
    }
    const { type, messaging, messagingModule } = messagingState;

    // Check current status first — if already granted or blocked, skip request
    const currentStatus =
      type === 'modular' && messagingModule?.hasPermission
        ? await messagingModule.hasPermission(messaging)
        : await messaging().hasPermission();
    const currentNormalized = normalizeMessagingAuthorizationStatus(currentStatus);
    console.log('[Notifications][iOS] pre-request hasPermission:', currentStatus, '→', currentNormalized);

    if (currentNormalized === 'granted') {
      return 'granted';
    }
    if (currentNormalized === 'blocked') {
      return 'blocked';
    }

    console.log('[Notifications][iOS] calling messaging.requestPermission...');
    const requestedStatus =
      type === 'modular' && messagingModule?.requestPermission
        ? await messagingModule.requestPermission(messaging)
        : await messaging().requestPermission();
    const normalized = normalizeMessagingAuthorizationStatus(requestedStatus);
    console.log('[Notifications][iOS] requestPermission result:', requestedStatus, '→', normalized);
    return normalized;
  } catch (error) {
    console.warn('[Notifications][iOS] requestIosNotificationPermission error:', error?.message);
    return 'unknown';
  }
};

export const checkNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    return checkAndroidNotificationPermission();
  }

  return checkIosNotificationPermission();
};

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    return requestAndroidNotificationPermission();
  }

  return requestIosNotificationPermission();
};

export const getFcmToken = async () => {
  const messagingState = getMessagingState();

  if (!messagingState) {
    return '';
  }

  try {
    const { type, messaging, messagingModule } = messagingState;
    const token =
      type === 'modular' && messagingModule?.getToken
        ? await messagingModule.getToken(messaging)
        : await messaging().getToken();
    return String(token || '').trim();
  } catch (error) {
    return '';
  }
};

export const getDeviceType = () => (Platform.OS === 'ios' ? 'ios' : 'android');

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

const CALL_CHANNEL_ID = 'brodameko_calls';

const showIncomingCallNotification = async (data = {}) => {
  try {
    await notifee.createChannel({
      id: CALL_CHANNEL_ID,
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
    const callerName = String(data.caller_name || 'Someone').trim();
    await notifee.displayNotification({
      id: 'incoming_call',
      title: `\uD83D\uDCDE ${callerName} is calling`,
      body: 'Tap to answer',
      data,
      android: {
        channelId: CALL_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        fullScreenAction: { id: 'default', launchActivity: 'default' },
        pressAction: { id: 'default' },
        smallIcon: 'ic_launcher',
        sound: 'default',
        // Auto-dismiss after 35 s — matches the backend's 30 s call window + buffer.
        timeoutAfter: 35000,
      },
    });
  } catch (e) {
    if (__DEV__) console.warn('[Notifications] showIncomingCallNotification error:', e?.message);
  }
};

export const registerBackgroundMessageHandler = () => {
  const messagingState = getMessagingState();
  if (!messagingState) {
    return;
  }

  const backgroundHandler = async (remoteMessage) => {
    const data = remoteMessage?.data || {};
    const callId = String(data?.call_id || '').trim();
    const callType = String(data?.type || '').trim();

    // For incoming calls on Android the backend sends data-only FCM (no notification
    // key) so this handler runs. Display a full-screen-intent notification via
    // notifee so the call breaks through the lock screen.
    if (callId && callType === 'call.incoming') {
      await showIncomingCallNotification(data);
      return;
    }

    if (__DEV__) {
      const messageId = String(remoteMessage?.messageId || '').trim();
      const dataKeys = Object.keys(data);
      console.log('[Notifications] Background message received', {
        hasMessageId: Boolean(messageId),
        dataKeys,
      });
    }
  };

  const { type, messaging, messagingModule } = messagingState;
  if (type === 'modular' && messagingModule?.setBackgroundMessageHandler) {
    messagingModule.setBackgroundMessageHandler(messaging, backgroundHandler);
    return;
  }

  messaging().setBackgroundMessageHandler(backgroundHandler);
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
