import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES } from '../../utils';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();

  const handleRoleLogin = (role) => {
    login(role);
  };

  return (
    <ScreenContainer>
      <AppText variant="title" color={darkTheme.colors.accent}>
        Login
      </AppText>
      <AppText style={styles.roleText}>Role: Guest</AppText>
      <AppText variant="muted" style={styles.bodyText}>
        Choose a role to enter the matching dashboard scaffold.
      </AppText>

      <View style={styles.actions}>
        <AppButton label="Login as Car Owner" onPress={() => handleRoleLogin(ROLES.CAR_OWNER)} />
        <AppButton label="Login as Mechanic" onPress={() => handleRoleLogin(ROLES.MECH)} />
        <AppButton label="Login as Admin" onPress={() => handleRoleLogin(ROLES.ADMIN)} />
      </View>

      <AppButton label="Go to Sign Up" onPress={() => navigation.navigate(ROUTES.SIGN_UP)} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  roleText: {
    marginTop: darkTheme.spacing.sm,
    color: darkTheme.colors.textSecondary,
  },
  bodyText: {
    marginTop: darkTheme.spacing.md,
    color: darkTheme.colors.textSecondary,
  },
  actions: {
    marginTop: darkTheme.spacing.xl,
    marginBottom: darkTheme.spacing.md,
  },
});

export default LoginScreen;
