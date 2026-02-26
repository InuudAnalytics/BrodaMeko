import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CarOwnerDashboardScreen,
  CarOwnerFundWalletScreen,
  CarOwnerTransactionDetailsScreen,
  CarOwnerChatScreen,
  CarOwnerEditProfileScreen,
  CarOwnerDiagnosticExpertsScreen,
  CarOwnerHistoryScreen,
  CarOwnerMechanicDetailsScreen,
  CarOwnerMechanicReviewsScreen,
  CarOwnerLiveTrackingScreen,
  CarOwnerMechanicDiscoveryScreen,
  CarOwnerProfileScreen,
  CarOwnerReportIssueScreen,
  CarOwnerRequestDiagnosticsScreen,
  CarOwnerRewardsScreen,
  CarOwnerWithdrawScreen,
  CarOwnerAddContactSuccessScreen,
} from '../screens';
import RateMechanicScreen from '../screens/carowner/ratings/RateMechanicScreen';
import EditJobScreen from '../screens/carowner/history/EditJobScreen';
import JobDetailsScreen from '../screens/carowner/history/JobDetailsScreen';
import VerifyTopUpScreen from '../screens/carowner/wallet/VerifyTopUpScreen';
import EscrowFundingScreen from '../screens/carowner/wallet/EscrowFundingScreen';
import PaymentSuccessScreen from '../screens/carowner/wallet/PaymentSuccessScreen';
import WaitingMechanicScreen from '../screens/carowner/assistance/WaitingMechanicScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import PlaceholderScreen from '../screens/shared/PlaceholderScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import SupportScreen from '../screens/shared/SupportScreen';
import SupportChatMockScreen from '../screens/shared/SupportChatMockScreen';
import PrivacyPolicyScreen from '../screens/shared/PrivacyPolicyScreen';
import PersonalInfoScreen from '../screens/shared/profile/PersonalInfoScreen';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const CarOwnerStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.CAR_OWNER_DASHBOARD}
      screenOptions={{
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: darkTheme.colors.background },
        headerTintColor: darkTheme.colors.accent,
        headerTitleStyle: {
          color: darkTheme.colors.accent,
          fontWeight: darkTheme.typography.fontWeights.semibold,
        },
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      <Stack.Screen
        name={ROUTES.CAR_OWNER_DASHBOARD}
        component={CarOwnerDashboardScreen}
        options={{ title: 'Home', headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_HISTORY}
        component={CarOwnerHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_MARKETPLACE}
        component={PlaceholderScreen}
        options={{ headerShown: false }}
        initialParams={{ title: 'Market' }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_REWARDS}
        component={CarOwnerRewardsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_FUND_WALLET}
        component={CarOwnerFundWalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_ESCROW_FUNDING}
        component={EscrowFundingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_PAYMENT_SUCCESS}
        component={PaymentSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_VERIFY_TOP_UP}
        component={VerifyTopUpScreen}
        options={{ title: 'Verify top-up' }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_TRANSACTION_DETAILS}
        component={CarOwnerTransactionDetailsScreen}
        options={{ title: 'Transaction details' }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_MECHANIC_DETAILS}
        component={CarOwnerMechanicDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_MECHANIC_REVIEWS}
        component={CarOwnerMechanicReviewsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_JOB_DETAILS}
        component={JobDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_EDIT_JOB}
        component={EditJobScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_WITHDRAW}
        component={CarOwnerWithdrawScreen}
        options={{ title: 'Withdraw' }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_CHAT}
        component={CarOwnerChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_PROFILE}
        component={CarOwnerProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.PERSONAL_INFO}
        component={PersonalInfoScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_EDIT_PROFILE}
        component={CarOwnerEditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_ADD_CONTACT_SUCCESS}
        component={CarOwnerAddContactSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_REPORT_ISSUE}
        component={CarOwnerReportIssueScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_REQUEST_DIAGNOSTICS}
        component={CarOwnerRequestDiagnosticsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_DIAGNOSTIC_EXPERTS}
        component={CarOwnerDiagnosticExpertsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_MECHANIC_DISCOVERY}
        component={CarOwnerMechanicDiscoveryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_WAITING_MECHANIC}
        component={WaitingMechanicScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_LIVE_TRACKING}
        component={CarOwnerLiveTrackingScreen}
        options={{ title: 'Live tracking' }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_RATE_MECHANIC}
        component={RateMechanicScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Placeholder"
        component={PlaceholderScreen}
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
    </Stack.Navigator>
  );
};

export default CarOwnerStack;
