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
  CarOwnerLiveTrackingScreen,
  CarOwnerMechanicDiscoveryScreen,
  CarOwnerProfileScreen,
  CarOwnerReportIssueScreen,
  CarOwnerRequestDiagnosticsScreen,
  CarOwnerRewardsScreen,
  CarOwnerWithdrawScreen,
} from '../screens';
import MechanicServicesApiTestScreen from '../screens/dev/MechanicServicesApiTestScreen';
import RateMechanicScreen from '../screens/carowner/ratings/RateMechanicScreen';
import EditJobScreen from '../screens/carowner/history/EditJobScreen';
import JobDetailsScreen from '../screens/carowner/history/JobDetailsScreen';
import VerifyTopUpScreen from '../screens/carowner/wallet/VerifyTopUpScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import PlaceholderScreen from '../screens/shared/PlaceholderScreen';
import SupportScreen from '../screens/shared/SupportScreen';
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
      <Stack.Screen name={ROUTES.CAR_OWNER_HISTORY} component={CarOwnerHistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen name={ROUTES.CAR_OWNER_REWARDS} component={CarOwnerRewardsScreen} options={{ title: 'Wallet' }} />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_FUND_WALLET}
        component={CarOwnerFundWalletScreen}
        options={{ title: 'Fund Wallet' }}
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
        name={ROUTES.CAR_OWNER_EDIT_PROFILE}
        component={CarOwnerEditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_REPORT_ISSUE}
        component={CarOwnerReportIssueScreen}
        options={{ title: 'What is the issue' }}
      />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_REQUEST_DIAGNOSTICS}
        component={CarOwnerRequestDiagnosticsScreen}
        options={{ title: 'Book a diagnostic expert' }}
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
      <Stack.Screen name={ROUTES.SUPPORT} component={SupportScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      {__DEV__ ? (
        <Stack.Screen
          name={ROUTES.DEV_API_TEST}
          component={MechanicServicesApiTestScreen}
          options={{ title: 'API Test (Dev)' }}
        />
      ) : null}
    </Stack.Navigator>
  );
};

export default CarOwnerStack;
