import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MechanicDashboardTabs from './MechanicDashboardTabs';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import MechanicLiveTrackingScreen from '../screens/mech/assistance/MechanicLiveTrackingScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import PlaceholderScreen from '../screens/shared/PlaceholderScreen';
import SupportScreen from '../screens/shared/SupportScreen';
import SupportChatMockScreen from '../screens/shared/SupportChatMockScreen';
import PrivacyPolicyScreen from '../screens/shared/PrivacyPolicyScreen';
import AddContactSuccessScreen from '../screens/carowner/profile/AddContactSuccessScreen';
import {
  BankDetailsScreen,
  EditProfileScreen as MechanicEditProfileScreen,
  KycUploadScreen,
  MechanicAddressScreen,
  MechanicProfileSetupScreen,
  ServicePricingScreen,
  UploadCertificateScreen,
  UploadProfilePhotoScreen,
} from '../screens/mech/profile';
import MechanicChatScreen from '../screens/mech/chat/MechanicChatScreen';
import SetServicesScreen from '../screens/mech/home/SetServicesScreen';
import UserProfileScreen from '../screens/shared/profile/UserProfileScreen';
import PersonalInfoScreen from '../screens/shared/profile/PersonalInfoScreen';
import ProfileBankDetailsScreen from '../screens/shared/profile/ProfileBankDetailsScreen';
import { useAuth, useMechanicProfile } from '../context';
import { ScreenContainer } from '../components';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';
import MarketplaceScreen from '../screens/mech/marketplace/MarketplaceScreen';
import ProductDetailsScreen from '../screens/mech/marketplace/ProductDetailsScreen';
import CartScreen from '../screens/mech/marketplace/CartScreen';
import CheckoutScreen from '../screens/mech/marketplace/CheckoutScreen';
import MarketplacePaymentSuccessScreen from '../screens/mech/marketplace/PaymentSuccessScreen';
import OrderTrackingScreen from '../screens/mech/marketplace/OrderTrackingScreen';
import RateProductScreen from '../screens/mech/marketplace/RateProductScreen';
import OrderDeliveredSuccessScreen from '../screens/mech/marketplace/OrderDeliveredSuccessScreen';
import ProductFeedbackSuccessScreen from '../screens/mech/marketplace/ProductFeedbackSuccessScreen';

const Stack = createNativeStackNavigator();

const MechStack = () => {
  const { user } = useAuth();
  const { isComplete, isHydrated } = useMechanicProfile();
  const isApproved = String(user?.status || '').toLowerCase() === 'approved';
  // TODO: Ask backend for a dedicated isProfileSetupComplete flag on /auth/me.

  if (!isHydrated) {
    return <ScreenContainer padded={false} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={isComplete || isApproved ? ROUTES.MECH_DASHBOARD_TABS : ROUTES.MECH_PROFILE_SETUP}
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
        name={ROUTES.MECH_UPLOAD_CERTIFICATE}
        component={UploadCertificateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_ADDRESS}
        component={MechanicAddressScreen}
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
      <Stack.Screen
        name={ROUTES.MECH_SET_SERVICES}
        component={SetServicesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_LIVE_TRACKING}
        component={MechanicLiveTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Placeholder" component={PlaceholderScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MechanicMarketplace" component={MarketplaceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="PaymentSuccessScreen"
        component={MarketplacePaymentSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SparePartsOrderTrackingScreen"
        component={OrderTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="RateProduct" component={RateProductScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="OrderDeliveredSuccess"
        component={OrderDeliveredSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductFeedbackSuccess"
        component={ProductFeedbackSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CHANGE_PASSWORD}
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={ROUTES.SUPPORT} component={SupportScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.SUPPORT_CHAT_MOCK} component={SupportChatMockScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.PRIVACY_POLICY} component={PrivacyPolicyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name={ROUTES.USER_PROFILE}
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.PERSONAL_INFO}
        component={PersonalInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.PROFILE_BANK_DETAILS}
        component={ProfileBankDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.MECH_EDIT_PROFILE}
        component={MechanicEditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_ADD_CONTACT_SUCCESS}
        component={AddContactSuccessScreen}
        options={{ headerShown: false }}
      />
      {isComplete || isApproved ? (
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
