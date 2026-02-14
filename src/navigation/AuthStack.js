import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ForgotPasswordScreen,
  LoginScreen,
  OTPVerificationScreen,
  ResetPasswordScreen,
  RoleSelectionScreen,
  SignUpScreen,
  SplashScreen,
} from '../screens';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.SPLASH}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: darkTheme.colors.background },
      }}
    >
      <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} />
      <Stack.Screen name={ROUTES.ROLE_SELECTION} component={RoleSelectionScreen} />
      <Stack.Screen name={ROUTES.SIGN_UP} component={SignUpScreen} />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.OTP_VERIFICATION} component={OTPVerificationScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={ROUTES.RESET_PASSWORD} component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
