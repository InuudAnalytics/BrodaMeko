import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { darkTheme } from '../../../theme';

const ProfileScreen = () => {
  const { signOut, isLoading } = useAuth();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="title" style={styles.heading}>
          Profile
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          Profile page coming soon.
        </AppText>

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
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heading: {
    color: darkTheme.colors.text,
  },
  subtext: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.sm,
  },
  signOutWrap: {
    width: '100%',
    maxWidth: 280,
    marginTop: darkTheme.spacing.lg,
  },
});

export default ProfileScreen;
