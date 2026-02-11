import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CarOwnerDashboardScreen } from '../screens';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const CarOwnerStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: darkTheme.colors.background },
        headerTintColor: darkTheme.colors.accent,
        headerTitleStyle: { color: darkTheme.colors.accent },
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      <Stack.Screen
        name={ROUTES.CAR_OWNER_DASHBOARD}
        component={CarOwnerDashboardScreen}
        options={{ title: 'Car Owner' }}
      />
    </Stack.Navigator>
  );
};

export default CarOwnerStack;
