import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import PlaceholderScreen from '../screens/shared/PlaceholderScreen';
import SupportScreen from '../screens/shared/SupportScreen';
import SupportChatMockScreen from '../screens/shared/SupportChatMockScreen';
import PrivacyPolicyScreen from '../screens/shared/PrivacyPolicyScreen';
import {
  SparePartsBankDetailsScreen,
  SparePartsCacUploadScreen,
  SparePartsAddressScreen,
  SparePartsNinUploadScreen,
  SparePartsPersonalInfoScreen,
  SparePartsProfileSetupScreen,
} from '../screens/spareparts/profile';
import SparePartsTabs from './SparePartsTabs';
import AddProductScreen from '../screens/spareparts/store/AddProductScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingCarouselScreen from '../screens/auth/OnboardingCarouselScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import UserProfileScreen from '../screens/shared/profile/UserProfileScreen';
import ProfileBankDetailsScreen from '../screens/shared/profile/ProfileBankDetailsScreen';
import AddContactSuccessScreen from '../screens/carowner/profile/AddContactSuccessScreen';
import { useAuth, useSparePartsProfile } from '../context';
import { ScreenContainer } from '../components';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const SparePartsStack = () => {
  const { user } = useAuth();
  const { isComplete, isHydrated } = useSparePartsProfile();
  const isApproved = String(user?.status || '').toLowerCase() === 'approved';
  // TODO: Ask backend for a dedicated isProfileSetupComplete flag on /auth/me.

  if (!isHydrated) {
    return <ScreenContainer padded={false} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={isComplete || isApproved ? ROUTES.SPARE_PARTS_TABS : ROUTES.SPARE_PARTS_PROFILE_SETUP}
      screenOptions={{
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: darkTheme.colors.background },
        headerTintColor: darkTheme.colors.accent,
        headerTitleStyle: { color: darkTheme.colors.accent },
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.ONBOARDING_CAROUSEL} component={OnboardingCarouselScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.SIGN_UP} component={SignUpScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.OTP_VERIFICATION} component={OTPVerificationScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.RESET_PASSWORD} component={ResetPasswordScreen} options={{ headerShown: false }} />

      <Stack.Screen
        name={ROUTES.SPARE_PARTS_PROFILE_SETUP}
        component={SparePartsProfileSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SPARE_PARTS_UPLOAD_CAC}
        component={SparePartsCacUploadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SPARE_PARTS_UPLOAD_NIN}
        component={SparePartsNinUploadScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SPARE_PARTS_ADDRESS}
        component={SparePartsAddressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.SPARE_PARTS_BANK_DETAILS}
        component={SparePartsBankDetailsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen name={ROUTES.SPARE_PARTS_TABS} component={SparePartsTabs} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.SPARE_PARTS_ADD_PRODUCT} component={AddProductScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.SPARE_PARTS_DASHBOARD} component={PlaceholderScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name={ROUTES.SPARE_PARTS_PERSONAL_INFO}
        component={SparePartsPersonalInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={ROUTES.CHANGE_PASSWORD} component={ChangePasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.SUPPORT} component={SupportScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.SUPPORT_CHAT_MOCK} component={SupportChatMockScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.PRIVACY_POLICY} component={PrivacyPolicyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.USER_PROFILE} component={UserProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name={ROUTES.PROFILE_BANK_DETAILS}
        component={ProfileBankDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_ADD_CONTACT_SUCCESS}
        component={AddContactSuccessScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default SparePartsStack;
