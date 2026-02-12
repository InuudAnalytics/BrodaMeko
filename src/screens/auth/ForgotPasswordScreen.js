import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton, AppInput, AppText, AuthMethodToggle, LogoLockup, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const METHODS = {
  PHONE: 'phone',
  EMAIL: 'email',
};

const ForgotPasswordScreen = ({ navigation }) => {
  const [method, setMethod] = useState(METHODS.PHONE);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSendReset = () => {
    const destination = method === METHODS.EMAIL ? email.trim() : phone.trim();

    if (!destination) {
      setMessage('Please enter your email or phone number.');
      return;
    }

    setMessage('Reset instructions sent (placeholder).');
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <LogoLockup style={styles.logoScale} markSize={44} stacked />
          </View>

          <AppText variant="title" style={styles.heading}>
            FORGOT PASSWORD
          </AppText>
          <AppText variant="muted" style={styles.subtitle}>
            Choose where to receive reset instructions.
          </AppText>

          <View style={styles.form}>
            <AuthMethodToggle
              initialValue={METHODS.PHONE}
              onChange={(value) => {
                setMethod(value);
                setMessage('');
              }}
            />

            {method === METHODS.EMAIL ? (
              <AppInput
                label="Email Address"
                placeholder="Youremail.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <AppInput
                label="Phone Number"
                placeholder="09075156578"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setMessage('');
                }}
                keyboardType="phone-pad"
              />
            )}

            {message ? <AppText variant="muted" style={styles.message}>{message}</AppText> : null}

            <View style={styles.actions}>
              <AppButton label="Send reset link" onPress={handleSendReset} />
            </View>

            <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate(ROUTES.LOGIN)}>
              <AppText variant="muted" color={darkTheme.colors.accent}>
                Back to Sign In
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  message: {
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.md,
  },
  actions: {
    marginTop: darkTheme.spacing.sm,
  },
  backLink: {
    alignItems: 'center',
    marginTop: darkTheme.spacing.md,
  },
});

export default ForgotPasswordScreen;

