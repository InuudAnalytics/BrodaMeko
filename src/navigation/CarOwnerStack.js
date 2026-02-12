import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CarOwnerDashboardScreen,
  CarOwnerHistoryScreen,
  CarOwnerMechanicDiscoveryScreen,
  CarOwnerProfileScreen,
  CarOwnerReportIssueScreen,
  CarOwnerRequestDiagnosticsScreen,
  CarOwnerRewardsScreen,
  CarOwnerSettingsScreen,
} from '../screens';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const CarOwnerStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.CAR_OWNER_DASHBOARD}
      screenOptions={{
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
        name={ROUTES.CAR_OWNER_SETTINGS}
        component={CarOwnerSettingsScreen}
        options={{ title: 'Chat' }}
      />
      <Stack.Screen name={ROUTES.CAR_OWNER_PROFILE} component={CarOwnerProfileScreen} options={{ title: 'Profile' }} />
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
        name={ROUTES.CAR_OWNER_MECHANIC_DISCOVERY}
        component={CarOwnerMechanicDiscoveryScreen}
        options={{ title: 'Nearby mechanics' }}
      />
    </Stack.Navigator>
  );
};

export default CarOwnerStack;
