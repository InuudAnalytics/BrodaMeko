import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const SplashScreen = ({ navigation }) => {
  return (
    <ScreenContainer style={styles.container}>
      <View>
        <AppText variant="title" color={darkTheme.colors.accent}>
          BrotherMeko
        </AppText>
        <AppText style={styles.subtitle}>
          Dark-mode-first car service workflow for owners, mechanics, and admins.
        </AppText>
      </View>

      <AppButton label="Continue" onPress={() => navigation.navigate(ROUTES.LOGIN)} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  subtitle: {
    marginTop: darkTheme.spacing.md,
    color: darkTheme.colors.textSecondary,
  },
});

export default SplashScreen;
