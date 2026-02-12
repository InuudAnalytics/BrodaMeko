import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, LogoLockup, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES } from '../../utils';

const RoleSelectionScreen = ({ navigation }) => {
  const handleUserStart = () => {
    navigation.navigate(ROUTES.SIGN_UP, { role: ROLES.CAR_OWNER });
  };

  const handleMechanicStart = () => {
    navigation.navigate(ROUTES.SIGN_UP, { role: ROLES.MECH });
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.logoWrap}>
        <LogoLockup markSize={86} stacked />
      </View>

      <View style={styles.actions}>
        <AppButton label="Get started as user" onPress={handleUserStart} style={styles.cta} />
        <AppButton label="Get started as mechanic" onPress={handleMechanicStart} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: darkTheme.spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: darkTheme.spacing.xxxl,
  },
  actions: {
    width: '100%',
  },
  cta: {
    marginBottom: darkTheme.spacing.md,
  },
});

export default RoleSelectionScreen;
