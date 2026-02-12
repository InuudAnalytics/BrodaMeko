import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppButton, AppInput, AppText, AuthMethodToggle, LogoLockup, NigerianPhoneInput, ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { isValidNigerianPhoneDigits, ROUTES, useKeyboardLift, withNigerianCountryCode } from '../../utils';

const METHODS = { PHONE: 'phone', EMAIL: 'email' };

const ForgotPasswordScreen = ({ navigation }) => {
  const { requestPasswordReset, isLoading, error, clearError } = useAuth();
  const { targetRef, animatedStyle } = useKeyboardLift({ extraOffset: darkTheme.spacing.sm });

  const [method, setMethod] = useState(METHODS.PHONE);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');

  const mergedError = localError || error;

  const clearAllErrors = () => {
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const handleSendReset = async () => {
    if (method === METHODS.EMAIL) {
      const destination = email.trim();
      if (!destination) {
        setLocalError('Please enter your email or phone number.');
        return;
      }

      setLocalError('');
      const ok = await requestPasswordReset({ email: destination, phoneNumber: '' });
      if (ok) navigation.navigate(ROUTES.RESET_PASSWORD, { method, destination });
      return;
    }

    if (!isValidNigerianPhoneDigits(phone)) {
      setLocalError('Phone number must be exactly 10 digits.');
      return;
    }

    const formattedPhone = withNigerianCountryCode(phone);
    setLocalError('');
    const ok = await requestPasswordReset({ email: '', phoneNumber: formattedPhone });

    if (ok) navigation.navigate(ROUTES.RESET_PASSWORD, { method, destination: formattedPhone });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View ref={targetRef} style={animatedStyle}>
            <View style={styles.logoWrap}>
              <LogoLockup style={styles.logoScale} markSize={44} stacked />
            </View>

            <AppText variant="title" style={styles.heading}>FORGOT PASSWORD</AppText>
            <AppText variant="muted" style={styles.subtitle}>Choose where to receive reset instructions.</AppText>

            <View style={styles.form}>
              <AuthMethodToggle
                initialValue={METHODS.PHONE}
                onChange={(value) => {
                  setMethod(value);
                  clearAllErrors();
                }}
              />

              {method === METHODS.EMAIL ? (
                <AppInput
                  label="Email Address"
                  placeholder="you@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearAllErrors();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <NigerianPhoneInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    clearAllErrors();
                  }}
                />
              )}

              {mergedError ? <AppText style={styles.errorText}>{mergedError}</AppText> : null}

              <View style={styles.actions}>
                <AppButton
                  label={isLoading ? 'Sending...' : 'Send reset OTP'}
                  onPress={handleSendReset}
                  disabled={isLoading}
                  left={isLoading ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
                />
              </View>

              <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                <AppText variant="muted" color={darkTheme.colors.accent}>Back to Sign In</AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: darkTheme.spacing.xl, paddingBottom: darkTheme.spacing.xxl },
  logoWrap: { alignItems: 'center', marginTop: darkTheme.spacing.md, marginBottom: darkTheme.spacing.xl },
  logoScale: { transform: [{ scale: 1.4 }] },
  heading: { color: darkTheme.colors.text, marginBottom: darkTheme.spacing.xs },
  subtitle: { color: darkTheme.colors.muted, marginBottom: darkTheme.spacing.xl },
  form: { marginTop: darkTheme.spacing.xs },
  errorText: { color: '#FF7B8A', fontSize: darkTheme.typography.fontSizes.xs, lineHeight: 16, marginTop: darkTheme.spacing.xs, marginBottom: darkTheme.spacing.sm },
  actions: { marginTop: darkTheme.spacing.sm },
  backLink: { alignItems: 'center', marginTop: darkTheme.spacing.md },
});

export default ForgotPasswordScreen;
