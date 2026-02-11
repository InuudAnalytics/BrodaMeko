import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  CarOwnerDashboardScreen,
  CarOwnerHistoryScreen,
  CarOwnerProfileScreen,
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
      <Stack.Screen name={ROUTES.CAR_OWNER_REWARDS} component={CarOwnerRewardsScreen} options={{ title: 'Rewards' }} />
      <Stack.Screen
        name={ROUTES.CAR_OWNER_SETTINGS}
        component={CarOwnerSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen name={ROUTES.CAR_OWNER_PROFILE} component={CarOwnerProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
};

export default CarOwnerStack;
