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
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, AuthMethodToggle, NigerianPhoneInput, ScreenContainer } from '../../components';
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
    if (ok) navigation.navigate(ROUTES.OTP_VERIFICATION, { flow: 'forgot_password', method, destination });
    return;
  }

    if (!isValidNigerianPhoneDigits(phone)) {
      setLocalError('Phone number must be exactly 10 digits.');
      return;
    }

    const formattedPhone = withNigerianCountryCode(phone);
    setLocalError('');
    const ok = await requestPasswordReset({ email: '', phoneNumber: formattedPhone });

    if (ok) navigation.navigate(ROUTES.OTP_VERIFICATION, { flow: 'forgot_password', method, destination: formattedPhone });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} keyboardAware={false}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View ref={targetRef} style={animatedStyle}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.headerIcon} activeOpacity={0.85} onPress={() => navigation.replace(ROUTES.LOGIN)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
              </TouchableOpacity>
              <AppText variant="title" style={styles.headerTitle}>Forgot password</AppText>
              <View style={styles.headerSpacer} />
            </View>

            <AppText variant="muted" style={styles.subtitle}>Choose email or phone number to receive your OTP.</AppText>

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
                  label={isLoading ? 'Sending...' : 'Send OTP'}
                  onPress={handleSendReset}
                  disabled={isLoading}
                  left={isLoading ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
                />
              </View>
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
  headerRow: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: darkTheme.colors.text,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  subtitle: { color: darkTheme.colors.muted, marginTop: darkTheme.spacing.lg, marginBottom: darkTheme.spacing.xl, textAlign: 'center' },
  form: { marginTop: darkTheme.spacing.xs },
  errorText: { color: '#FF7B8A', fontSize: darkTheme.typography.fontSizes.xs, lineHeight: 16, marginTop: darkTheme.spacing.xs, marginBottom: darkTheme.spacing.sm },
  actions: { marginTop: darkTheme.spacing.sm },
});

export default ForgotPasswordScreen;
