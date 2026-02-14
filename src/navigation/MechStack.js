import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MechDashboardScreen } from '../screens';
import MechanicProfileSetupScreen from '../screens/mech/profile/MechanicProfileSetupScreen';
import { darkTheme } from '../theme';

const Stack = createNativeStackNavigator();
const MECH_PROFILE_SETUP_ROUTE = 'MechanicProfileSetup';
const MECH_DASHBOARD_TABS_ROUTE = 'MechanicDashboardTabs';

const MechStack = () => {
  const [profileCompleted, setProfileCompleted] = useState(false);

  return (
    <Stack.Navigator
      initialRouteName={profileCompleted ? MECH_DASHBOARD_TABS_ROUTE : MECH_PROFILE_SETUP_ROUTE}
      screenOptions={{
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: darkTheme.colors.background },
        headerTintColor: darkTheme.colors.accent,
        headerTitleStyle: { color: darkTheme.colors.accent },
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      {!profileCompleted ? (
        <Stack.Screen name={MECH_PROFILE_SETUP_ROUTE} options={{ headerShown: false }}>
          {(props) => (
            <MechanicProfileSetupScreen
              {...props}
              onProceed={() => {
                // TODO: replace local state with backend-backed profile completion flag.
                setProfileCompleted(true);
                props.navigation.replace(MECH_DASHBOARD_TABS_ROUTE);
              }}
            />
          )}
        </Stack.Screen>
      ) : null}
      <Stack.Screen name={MECH_DASHBOARD_TABS_ROUTE} component={MechDashboardScreen} options={{ title: 'Mechanic' }} />
    </Stack.Navigator>
  );
};

export default MechStack;
