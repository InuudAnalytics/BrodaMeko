import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  AppButton,
  AppInput,
  AppText,
  AuthMethodToggle,
  DividerOr,
  GoogleButton,
  LogoLockup,
  ScreenContainer,
} from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const SUCCESS_COLOR = '#40C67A';
const ERROR_COLOR = '#FF6B7A';

const METHODS = {
  PHONE: 'phone',
  EMAIL: 'email',
};

const LoginScreen = ({ navigation, route }) => {
  const roleParam = route?.params?.role;
  const [method, setMethod] = useState(METHODS.PHONE);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authResult, setAuthResult] = useState({ type: null, message: '' });

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const clearFeedback = () => {
    if (authResult.type) {
      setAuthResult({ type: null, message: '' });
    }
  };

  const handleSignIn = () => {
    const identifier = method === METHODS.EMAIL ? email.trim() : phone.trim();

    if (!identifier || !password.trim()) {
      setAuthResult({ type: 'error', message: 'Please enter your credentials.' });
      return;
    }

    setIsSubmitting(true);
    setAuthResult({ type: null, message: '' });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const shouldFail = identifier.toLowerCase().includes('fail') || password.trim().length < 4;

      if (shouldFail) {
        setAuthResult({ type: 'error', message: 'Incorrect credentials. Please try again.' });
      } else {
        setAuthResult({ type: 'success', message: 'Signed in successfully.' });
      }

      setIsSubmitting(false);
    }, 900);
  };

  const handleForgotPassword = () => {
    navigation.navigate(ROUTES.FORGOT_PASSWORD);
  };

  const isSuccess = authResult.type === 'success';

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
              <AuthMethodToggle
                initialValue={METHODS.PHONE}
                onChange={(value) => {
                  setMethod(value);
                  clearFeedback();
                }}
              />

              {method === METHODS.EMAIL ? (
                <AppInput
                  label="Email Address"
                  placeholder="Youremail.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearFeedback();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <AppInput
                  label="Phone number"
                  placeholder="09075156578"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    clearFeedback();
                  }}
                  keyboardType="phone-pad"
                />
              )}

              <View style={styles.passwordLabelRow}>
                <AppText variant="body">Password</AppText>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <AppText variant="muted" color={darkTheme.colors.accent}>
                    Forgot password
                  </AppText>
                </TouchableOpacity>
              </View>

              <AppInput
                placeholder="....."
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearFeedback();
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                right={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                    <AppText variant="muted" style={styles.toggleText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </AppText>
                  </TouchableOpacity>
                }
              />

              {authResult.type ? (
                <View style={[styles.feedbackRow, isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>
                  <View style={[styles.feedbackIconWrap, isSuccess ? styles.feedbackIconSuccess : styles.feedbackIconError]}>
                    <AppText style={[styles.feedbackIconText, isSuccess ? styles.feedbackIconTextSuccess : styles.feedbackIconTextError]}>
                      {isSuccess ? '\u2713' : 'x'}
                    </AppText>
                  </View>
                  <AppText style={styles.feedbackText}>{authResult.message}</AppText>
                </View>
              ) : null}

              <View style={styles.primaryCta}>
                <AppButton
                  label={isSubmitting ? 'Signing In...' : 'Sign In'}
                  onPress={handleSignIn}
                  disabled={isSubmitting}
                  left={
                    isSubmitting ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null
                  }
                />
              </View>

              <DividerOr />

              <GoogleButton label="Sign in with Google" onPress={() => {}} disabled={isSubmitting} />

              <View style={styles.footer}>
                <AppText variant="muted">Dont have an account? </AppText>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(ROUTES.SIGN_UP, roleParam ? { role: roleParam } : undefined)
                  }
                >
                  <AppText variant="muted" color={darkTheme.colors.accent}>
                    Sign Up
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.xl,
  },
  logoScale: {
    transform: [{ scale: 1.4 }],
  },
  heading: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: darkTheme.colors.muted,
    marginBottom: darkTheme.spacing.xl,
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
  feedbackRow: {
    minHeight: 44,
    borderRadius: darkTheme.radius.md,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
    paddingHorizontal: darkTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
  },
  feedbackSuccess: {
    borderWidth: 1,
    borderColor: 'rgba(64,198,122,0.45)',
    backgroundColor: 'rgba(64,198,122,0.12)',
  },
  feedbackError: {
    borderWidth: 1,
    borderColor: 'rgba(255,107,122,0.45)',
    backgroundColor: 'rgba(255,107,122,0.12)',
  },
  feedbackIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackIconSuccess: {
    backgroundColor: SUCCESS_COLOR,
  },
  feedbackIconError: {
    backgroundColor: ERROR_COLOR,
  },
  feedbackIconText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: darkTheme.typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  feedbackIconTextSuccess: {
    color: darkTheme.colors.background,
  },
  feedbackIconTextError: {
    color: darkTheme.colors.text,
  },
  feedbackText: {
    color: darkTheme.colors.text,
    flex: 1,
  },
  primaryCta: {
    marginTop: darkTheme.spacing.md,
  },
  footer: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoginScreen;

