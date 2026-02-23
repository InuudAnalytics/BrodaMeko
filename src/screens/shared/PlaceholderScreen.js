import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';

const PlaceholderScreen = ({ navigation, route }) => {
  const { title = 'Coming soon', subtitle } = route?.params || {};
  const message = subtitle || `${title} is coming soon.`;

  return (
    <ScreenContainer padded={false} style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>{title}</AppText>
        </View>

        <View style={styles.center}>
          <AppText style={styles.title}>Coming soon</AppText>
          <AppText style={styles.subtitle}>{message}</AppText>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: darkTheme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default PlaceholderScreen;
