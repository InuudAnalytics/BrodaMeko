import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../components';
import { updatePassword } from '../../services/auth.service';
import { darkTheme } from '../../theme';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const clearFeedback = () => {
    if (error) {
      setError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async () => {
    const current = currentPassword.trim();
    const next = newPassword.trim();

    if (!current || !next) {
      setError('Current password and new password are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await updatePassword({
        currentPassword: current,
        newPassword: next,
      });

      setCurrentPassword('');
      setNewPassword('');
      setSuccessMessage('Password updated successfully.');
    } catch (submitError) {
      setError(submitError?.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen} keyboardAware={false}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
            </TouchableOpacity>
            <AppText style={styles.headerTitle}>Change password</AppText>
          </View>

          <AppText variant="muted" style={styles.subtitle}>
            Update your account password.
          </AppText>

          <View style={styles.form}>
            <AppInput
              label="Current password"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                clearFeedback();
              }}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              right={(
                <TouchableOpacity onPress={() => setShowCurrentPassword((prev) => !prev)} activeOpacity={0.8}>
                  <HugeiconsIcon
                    icon={showCurrentPassword ? ViewOffIcon : ViewIcon}
                    size={20}
                    color={darkTheme.colors.muted}
                    strokeWidth={1.9}
                  />
                </TouchableOpacity>
              )}
            />

            <AppInput
              label="New password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                clearFeedback();
              }}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              right={(
                <TouchableOpacity onPress={() => setShowNewPassword((prev) => !prev)} activeOpacity={0.8}>
                  <HugeiconsIcon
                    icon={showNewPassword ? ViewOffIcon : ViewIcon}
                    size={20}
                    color={darkTheme.colors.muted}
                    strokeWidth={1.9}
                  />
                </TouchableOpacity>
              )}
            />

            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
            {successMessage ? <AppText style={styles.successText}>{successMessage}</AppText> : null}

            <View style={styles.submitWrap}>
              <AppButton
                label={isSubmitting ? 'Saving...' : 'Save password'}
                onPress={handleSubmit}
                disabled={isSubmitting}
                left={isSubmitting ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: darkTheme.spacing.xxl,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  subtitle: {
    color: darkTheme.colors.muted,
    marginBottom: 18,
  },
  form: {
    marginTop: 6,
  },
  errorText: {
    marginTop: 6,
    color: '#FF7B8A',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  successText: {
    marginTop: 6,
    color: '#9BE564',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  submitWrap: {
    marginTop: 16,
  },
});

export default ChangePasswordScreen;
