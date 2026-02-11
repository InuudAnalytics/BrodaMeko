import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBottomNav, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const HistoryScreen = ({ navigation }) => {
  return (
    <ScreenContainer padded={false} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <AppText variant="title" style={styles.heading}>
          History
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          Service history page coming soon.
        </AppText>
      </View>

      <AppBottomNav activeTab={ROUTES.CAR_OWNER_HISTORY} onTabPress={(routeName) => navigation.navigate(routeName)} />
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
  },
  subtext: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.sm,
  },
});

export default HistoryScreen;
