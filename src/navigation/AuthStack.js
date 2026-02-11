import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, OTPVerificationScreen, SignUpScreen, SplashScreen } from '../screens';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.SPLASH}
      screenOptions={{
        headerStyle: {
          backgroundColor: darkTheme.colors.background,
        },
        headerTintColor: darkTheme.colors.accent,
        headerTitleStyle: {
          color: darkTheme.colors.accent,
          fontSize: 16,
          fontWeight: darkTheme.typography.fontWeights.semibold,
        },
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.SIGN_UP} component={SignUpScreen} options={{ title: 'Sign Up' }} />
      <Stack.Screen
        name={ROUTES.OTP_VERIFICATION}
        component={OTPVerificationScreen}
        options={{ title: 'OTP Verification' }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
