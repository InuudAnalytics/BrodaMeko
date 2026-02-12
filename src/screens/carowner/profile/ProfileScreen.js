import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { darkTheme } from '../../../theme';

const ProfileScreen = () => {
  const { signOut, updatePassword, isLoading, error, clearError } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const mergedError = localError || error;

  const resetMessages = () => {
    if (localError) {
      setLocalError('');
    }

    if (error) {
      clearError();
    }

    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      setLocalError('Please enter both current and new password.');
      return;
    }

    setLocalError('');

    const ok = await updatePassword({ currentPassword, newPassword });

    if (ok) {
      setSuccessMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="title" style={styles.heading}>
          Profile
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          Profile page coming soon.
        </AppText>

        <TouchableOpacity style={styles.toggleRow} onPress={() => setShowForm((prev) => !prev)}>
          <AppText variant="muted">Update Password</AppText>
          <AppText variant="muted" color={darkTheme.colors.accent}>
            {showForm ? 'Hide' : 'Show'}
          </AppText>
        </TouchableOpacity>

        {showForm ? (
          <View style={styles.form}>
            <AppInput
              label="Current password"
              placeholder="Current password"
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                resetMessages();
              }}
              secureTextEntry
              autoCapitalize="none"
            />

            <AppInput
              label="New password"
              placeholder="New password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                resetMessages();
              }}
              secureTextEntry
              autoCapitalize="none"
            />

            {mergedError ? <AppText style={styles.errorText}>{mergedError}</AppText> : null}
            {successMessage ? <AppText style={styles.successText}>{successMessage}</AppText> : null}

            <AppButton
              label={isLoading ? 'Updating...' : 'Update Password'}
              onPress={handleUpdatePassword}
              disabled={isLoading}
              left={isLoading ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
            />
          </View>
        ) : null}

        {/* TEMP SIGNOUT: safe to comment out when no longer needed */}
        <View style={styles.signOutWrap}>
          <AppButton
            label={isLoading ? 'Signing Out...' : 'Sign Out'}
            onPress={signOut}
            disabled={isLoading}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    width: '100%',
    paddingHorizontal: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.xl,
  },
  heading: {
    color: darkTheme.colors.text,
  },
  subtext: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.sm,
  },
  toggleRow: {
    marginTop: darkTheme.spacing.lg,
    marginBottom: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  form: {
    marginTop: darkTheme.spacing.sm,
  },
  errorText: {
    color: '#FF7B8A',
    marginBottom: darkTheme.spacing.sm,
  },
  successText: {
    color: '#40C67A',
    marginBottom: darkTheme.spacing.sm,
  },
  signOutWrap: {
    width: '100%',
    marginTop: darkTheme.spacing.lg,
  },
});

export default ProfileScreen;
