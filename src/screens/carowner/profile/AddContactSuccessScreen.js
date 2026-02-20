import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';

const AddContactSuccessScreen = ({ navigation, route }) => {
  const contactType = route?.params?.contactType === 'email' ? 'email' : 'phone number';
  const contactValue = String(route?.params?.contactValue || '').trim();

  const handleDone = () => {
    if (navigation.canGoBack()) {
      navigation.pop(2);
      return;
    }

    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={74} color={darkTheme.colors.accent} strokeWidth={1.8} />
        </View>

        <AppText style={styles.title}>Contact Verified</AppText>
        <AppText style={styles.subtitle}>
          Your {contactType} has been added successfully.
        </AppText>
        {contactValue ? <AppText style={styles.valueText}>{contactValue}</AppText> : null}

        <AppButton label="Done" onPress={handleDone} style={styles.doneBtn} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    flex: 1,
    paddingHorizontal: darkTheme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: darkTheme.spacing.md,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  valueText: {
    marginTop: 6,
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: darkTheme.spacing.xl,
    minWidth: 160,
  },
});

export default AddContactSuccessScreen;
