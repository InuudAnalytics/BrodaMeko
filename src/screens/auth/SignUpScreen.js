import React from 'react';
import { StyleSheet } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const SignUpScreen = ({ navigation }) => {
  return (
    <ScreenContainer>
      <AppText variant="title" color={darkTheme.colors.accent}>
        Sign Up
      </AppText>
      <AppText style={styles.roleText}>Role: Guest</AppText>
      <AppText variant="muted" style={styles.bodyText}>
        Placeholder registration screen. Real onboarding will be added later.
      </AppText>

      <AppButton label="Back to Login" onPress={() => navigation.navigate(ROUTES.LOGIN)} />
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
    marginBottom: darkTheme.spacing.xl,
    color: darkTheme.colors.textSecondary,
  },
});

export default SignUpScreen;
