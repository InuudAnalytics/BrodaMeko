import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.title}>Privacy policy</AppText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.centerWrap}>
        <AppText style={styles.comingSoon}>Coming soon</AppText>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    minHeight: 44,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: {
    color: darkTheme.colors.muted,
    fontSize: 18,
    lineHeight: 24,
  },
});

export default PrivacyPolicyScreen;
