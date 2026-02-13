import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';

const WithdrawScreen = () => {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="title" style={styles.heading}>
          Withdraw
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          This page is coming soon.
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
    paddingHorizontal: darkTheme.spacing.xl,
  },
  heading: {
    color: darkTheme.colors.text,
    textAlign: 'center',
  },
  subtext: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.sm,
    textAlign: 'center',
  },
});

export default WithdrawScreen;
