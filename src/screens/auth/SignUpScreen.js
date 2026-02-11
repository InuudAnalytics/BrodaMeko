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
import { ROUTES } from '../../utils';

const ERROR_COLOR = '#FF7B8A';

const SignUpScreen = ({ navigation }) => {
  const { signUp, isLoading, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const activeError = localError || error;

  const resetErrors = () => {
    if (localError) {
      setLocalError('');
    }

    if (error) {
      clearError();
    }
  };

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError('');
    await signUp({ fullName, email, phone, password });
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
          SIGN UP
        </AppText>
        <AppText variant="muted" style={styles.subtitle}>
          Are you ready for the road?
        </AppText>

        <View style={styles.form}>
          <AppInput
            label="Full name"
            placeholder="Toluwalase Daniel"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              resetErrors();
            }}
            autoCapitalize="words"
          />

          <AppInput
            label="Email Address"
            placeholder="Youremail.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              resetErrors();
            }}
            keyboardType="email-address"
          />

          <AppInput
            label="Phone number"
            placeholder="09075156578"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              resetErrors();
            }}
            keyboardType="phone-pad"
          />

          <AppInput
            label="Password"
            placeholder="....."
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              resetErrors();
            }}
            secureTextEntry={!showPassword}
            right={
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <AppText variant="muted" style={styles.toggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </AppText>
              </TouchableOpacity>
            }
          />

          <AppInput
            label="Confirm password"
            placeholder="....."
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              resetErrors();
            }}
            secureTextEntry={!showConfirmPassword}
            right={
              <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <AppText variant="muted" style={styles.toggleText}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </AppText>
              </TouchableOpacity>
            }
          />

          {activeError ? <AppText style={styles.errorText}>{activeError}</AppText> : null}

          <View style={styles.primaryCta}>
            <AppButton
              label={isLoading ? 'Signing Up...' : 'Sign Up'}
              onPress={handleSignUp}
              disabled={isLoading}
            />
          </View>

          <DividerOr />

          <GoogleButton label="Sign up with Google" onPress={() => {}} disabled={isLoading} />

          <View style={styles.footer}>
            <AppText variant="muted">Have an account? </AppText>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
              <AppText variant="muted" color={darkTheme.colors.accent}>
                Sign In
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
  toggleText: {
    color: darkTheme.colors.muted,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  errorText: {
    color: ERROR_COLOR,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
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

export default SignUpScreen;
