import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  AppButton,
  AppInput,
  AppText,
  DividerOr,
  GoogleButton,
  LogoLockup,
  ScreenContainer,
} from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES } from '../../utils';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    // Placeholder auth behavior for now:
    // we mark the user as authenticated and route to the Car Owner dashboard.
    login(ROLES.CAR_OWNER);
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <LogoLockup style={styles.logoScale} markSize={44} stacked />
        </View>

        <AppText variant="title" style={styles.heading}>
          SIGN IN
        </AppText>
        <AppText variant="muted" style={styles.subtitle}>
          Are you ready for the road?
        </AppText>

        <View style={styles.form}>
          <AppInput
            label="Email Address"
            placeholder="Youremail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <View style={styles.passwordLabelRow}>
            <AppText variant="body">Password</AppText>
            <TouchableOpacity onPress={() => {}}>
              <AppText variant="muted" color={darkTheme.colors.accent}>
                Forgot password
              </AppText>
            </TouchableOpacity>
          </View>

          <AppInput
            placeholder="....."
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <AppText variant="muted" style={styles.toggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </AppText>
              </TouchableOpacity>
            }
          />

          <View style={styles.primaryCta}>
            <AppButton label="Sign In" onPress={handleSignIn} />
          </View>

          <DividerOr />

          <GoogleButton label="Sign in with Google" onPress={() => {}} />

          <View style={styles.footer}>
            <AppText variant="muted">Dont have an account? </AppText>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.SIGN_UP)}>
              <AppText variant="muted" color={darkTheme.colors.accent}>
                Sign Up
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: darkTheme.spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: darkTheme.spacing.sm,
    marginBottom: darkTheme.spacing.lg,
  },
  logoScale: {
    transform: [{ scale: 0.35 }],
  },
  heading: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: darkTheme.colors.muted,
    marginBottom: darkTheme.spacing.lg,
  },
  form: {
    marginTop: darkTheme.spacing.xs,
  },
  passwordLabelRow: {
    marginBottom: darkTheme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleText: {
    color: darkTheme.colors.muted,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  primaryCta: {
    marginTop: darkTheme.spacing.sm,
  },
  footer: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoginScreen;
