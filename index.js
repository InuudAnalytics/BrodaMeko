/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { registerBackgroundMessageHandler } from './src/utils/pushNotifications';
import { buildCallNavigationTarget } from './src/utils/callRouting';
import { navigationRef } from './src/navigation/navigationRef';

registerBackgroundMessageHandler();

// Handle taps on notifee notifications while the app is backgrounded (not killed).
// For killed-state taps, NotificationsContext picks up notifee.getInitialNotification().
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const data = detail?.notification?.data || {};

    // Call notifications route directly; everything else reads data.screen or falls back.
    const callTarget = buildCallNavigationTarget(data);
    const routeName = callTarget?.routeName
      || String(data?.screen || data?.route || data?.screen_name || '').trim()
      || 'Notifications';
    const params = callTarget?.params || {};

    if (navigationRef.isReady()) {
      navigationRef.navigate(routeName, params);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
