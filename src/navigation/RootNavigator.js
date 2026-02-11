import React from 'react';
import { DarkTheme as NavigationDarkTheme, NavigationContainer } from '@react-navigation/native';
import { ScreenContainer } from '../components';
import { useAuth } from '../context';
import { darkTheme } from '../theme';
import { ROLES } from '../utils';
import AdminStack from './AdminStack';
import AuthStack from './AuthStack';
import CarOwnerStack from './CarOwnerStack';
import MechStack from './MechStack';

const navTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: darkTheme.colors.accent,
    background: darkTheme.colors.background,
    card: darkTheme.colors.background,
    text: darkTheme.colors.text,
    border: darkTheme.colors.muted,
    notification: darkTheme.colors.accent,
  },
};

const RootNavigator = () => {
  const { token, role, isLoading } = useAuth();

  const renderRoleStack = () => {
    if (role === ROLES.CAR_OWNER) {
      return <CarOwnerStack />;
    }

    if (role === ROLES.MECH) {
      return <MechStack />;
    }

    if (role === ROLES.ADMIN) {
      return <AdminStack />;
    }

    // Fallback when token exists but role is missing/unknown.
    return <CarOwnerStack />;
  };

  if (isLoading) {
    return <ScreenContainer padded={false} />;
  }

  return <NavigationContainer theme={navTheme}>{token ? renderRoleStack() : <AuthStack />}</NavigationContainer>;
};

export default RootNavigator;
