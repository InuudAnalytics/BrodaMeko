import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MechDashboardScreen } from '../screens';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const MechStack = () => {
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
        name={ROUTES.MECH_DASHBOARD}
        component={MechDashboardScreen}
        options={{ title: 'Mechanic' }}
      />
    </Stack.Navigator>
  );
};

export default MechStack;
