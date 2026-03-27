import React from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { DarkTheme as NavigationDarkTheme, NavigationContainer } from '@react-navigation/native';
import { AppText, ScreenContainer } from '../components';
import { useAuth } from '../context';
import { navigationRef } from './navigationRef';
import { darkTheme } from '../theme';
import { ROLES } from '../utils';
import AdminStack from './AdminStack';
import AuthStack from './AuthStack';
import CarOwnerStack from './CarOwnerStack';
import MechStack from './MechStack';
import SparePartsStack from './SparePartsStack';

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

const BootSplash = () => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <View style={bootStyles.container}>
      <Animated.Image
        source={require('../../assets/brodamekoLogo.png')}
        style={[bootStyles.logo, { opacity }]}
        resizeMode="contain"
      />
    </View>
  );
};

const bootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
});

const InvalidRoleScreen = ({ role }) => {
  return (
    <ScreenContainer style={{ justifyContent: 'center', alignItems: 'center' }}>
      <AppText variant="title" style={{ color: darkTheme.colors.accent, marginBottom: darkTheme.spacing.sm }}>
        Invalid account role
      </AppText>
      <AppText variant="muted" style={{ textAlign: 'center' }}>
        Signed in, but role "{String(role || 'unknown')}" is not allowed. Please sign out and sign in again.
      </AppText>
    </ScreenContainer>
  );
};

const RootNavigator = () => {
  const { token, role, isBootstrapped } = useAuth();

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

    if (role === ROLES.SPARE_PARTS_SELLER) {
      return <SparePartsStack />;
    }

    // Strict mode: never fall back to another role stack.
    return <InvalidRoleScreen role={role} />;
  };

  if (!isBootstrapped) {
    return <BootSplash />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {token ? renderRoleStack() : <AuthStack />}
    </NavigationContainer>
  );
};

export default RootNavigator;

