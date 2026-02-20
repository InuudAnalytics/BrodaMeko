import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, LogoLockup, ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { ROUTES, useKeyboardLift } from '../../utils';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { resetPasswordWithOtp, isLoading, error, clearError } = useAuth();
  const { targetRef, animatedStyle } = useKeyboardLift({ extraOffset: darkTheme.spacing.sm });
  const { method = 'email', destination = '' } = route.params || {};

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const mergedError = localError || error;

  const clearAllErrors = () => {
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const handleReset = async () => {
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setLocalError('Please complete all fields.');
      return;
    }

    if (otp.trim().length !== 4) {
      setLocalError('OTP must be 4 digits.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError('');
    const ok = await resetPasswordWithOtp({
      email: method === 'email' ? destination : '',
      phoneNumber: method === 'phone' ? destination : '',
      otp: otp.trim(),
      newPassword,
      confirmPassword,
    });

    if (ok) navigation.navigate(ROUTES.LOGIN);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} keyboardAware={false}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Animated.View ref={targetRef} style={animatedStyle}>
              <View style={styles.logoWrap}>
                <LogoLockup style={styles.logoScale} markSize={44} stacked />
              </View>

              <AppText variant="title" style={styles.heading}>
                RESET PASSWORD
              </AppText>
              <AppText variant="muted" style={styles.subtitle}>
                Enter the 4-digit OTP sent to {destination || method}.
              </AppText>

              <View style={styles.form}>
                <AppInput
                  label="OTP"
                  placeholder="1234"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/\D/g, '').slice(0, 4));
                    clearAllErrors();
                  }}
                  keyboardType="number-pad"
                />

                <AppInput
                  label="New password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    clearAllErrors();
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  right={
                    <TouchableOpacity onPress={() => setShowNewPassword((prev) => !prev)}>
                      <HugeiconsIcon
                        icon={showNewPassword ? ViewOffIcon : ViewIcon}
                        size={20}
                        color={darkTheme.colors.muted}
                        strokeWidth={1.9}
                      />
                    </TouchableOpacity>
                  }
                />

                <AppInput
                  label="Confirm password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    clearAllErrors();
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  right={
                    <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                      <HugeiconsIcon
                        icon={showConfirmPassword ? ViewOffIcon : ViewIcon}
                        size={20}
                        color={darkTheme.colors.muted}
                        strokeWidth={1.9}
                      />
                    </TouchableOpacity>
                  }
                />

                {mergedError ? <AppText style={styles.errorText}>{mergedError}</AppText> : null}

                <View style={styles.primaryCta}>
                  <AppButton
                    label={isLoading ? 'Resetting...' : 'Reset password'}
                    onPress={handleReset}
                    disabled={isLoading}
                    left={isLoading ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
                  />
                </View>

                <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                  <AppText variant="muted" color={darkTheme.colors.accent}>
                    Back to Sign In
                  </AppText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
  primaryCta: { marginTop: darkTheme.spacing.md },
  backLink: { alignItems: 'center', marginTop: darkTheme.spacing.md },
});

export default ResetPasswordScreen;
