import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MechanicDashboardTabs from './MechanicDashboardTabs';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import PlaceholderScreen from '../screens/shared/PlaceholderScreen';
import {
  BankDetailsScreen,
  KycUploadScreen,
  MechanicProfileSetupScreen,
  ServicePricingScreen,
  UploadProfilePhotoScreen,
} from '../screens/mech/profile';
import MechanicChatScreen from '../screens/mech/chat/MechanicChatScreen';
import UserProfileScreen from '../screens/shared/profile/UserProfileScreen';
import { useMechanicProfile } from '../context';
import { ScreenContainer } from '../components';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const MechStack = () => {
  const { isComplete, isHydrated } = useMechanicProfile();

  if (!isHydrated) {
    return <ScreenContainer padded={false} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={isComplete ? ROUTES.MECH_DASHBOARD_TABS : ROUTES.MECH_PROFILE_SETUP}
      screenOptions={{
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: darkTheme.colors.background },
        headerTintColor: darkTheme.colors.accent,
        headerTitleStyle: { color: darkTheme.colors.accent },
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      <Stack.Screen
        name={ROUTES.MECH_PROFILE_SETUP}
        component={MechanicProfileSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_UPLOAD_PROFILE_PHOTO}
        component={UploadProfilePhotoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_SERVICE_PRICING}
        component={ServicePricingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_KYC_UPLOAD}
        component={KycUploadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_BANK_DETAILS}
        component={BankDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_CHAT}
        component={MechanicChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Placeholder" component={PlaceholderScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name={ROUTES.USER_PROFILE}
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      {isComplete ? (
        <Stack.Screen
          name={ROUTES.MECH_DASHBOARD_TABS}
          component={MechanicDashboardTabs}
          options={{ headerShown: false }}
        />
      ) : null}
    </Stack.Navigator>
  );
};

export default MechStack;
