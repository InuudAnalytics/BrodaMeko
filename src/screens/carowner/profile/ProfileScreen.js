import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';

const ProfileScreen = () => {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="title" style={styles.heading}>
          Profile
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          Profile page coming soon.
        </AppText>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: darkTheme.colors.text,
  },
  subtext: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.sm,
  },
});

export default ProfileScreen;
