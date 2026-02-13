import { Platform } from 'react-native';

export const MOCK_FCM_TOKEN = 'mock-fcm-token-dev-placeholder';

export const getMockDeviceType = () => {
  if (Platform.OS === 'ios') {
    return 'ios';
  }

  return 'android';
};

export default {
  MOCK_FCM_TOKEN,
  getMockDeviceType,
};
