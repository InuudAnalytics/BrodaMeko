import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';

const MechanicDiscoveryScreen = ({ route }) => {
  const issue = route?.params?.report?.selectedIssue || 'Issue';

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <AppText variant="title" style={styles.heading}>
          Mechanic Discovery
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          Placeholder screen for finding nearby mechanics.
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          Reported issue: {issue}
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
  },
  subtext: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.sm,
    textAlign: 'center',
  },
});

export default MechanicDiscoveryScreen;
