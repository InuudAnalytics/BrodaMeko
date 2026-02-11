import React from 'react';
import { StyleSheet } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROLES } from '../../../utils';

const DashboardScreen = () => {
  const { logout } = useAuth();

  return (
    <ScreenContainer>
      <AppText variant="title" color={darkTheme.colors.accent}>
        Admin Dashboard
      </AppText>
      <AppText style={styles.roleText}>Role: {ROLES.ADMIN}</AppText>
      <AppText variant="muted" style={styles.bodyText}>
        Placeholder home screen for administrators.
      </AppText>

      <AppButton label="Logout" onPress={logout} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  roleText: {
    marginTop: darkTheme.spacing.sm,
    color: darkTheme.colors.muted,
  },
  bodyText: {
    marginTop: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.xl,
    color: darkTheme.colors.muted,
  },
});

export default DashboardScreen;
