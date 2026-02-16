import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';

const ServicePricingScreen = ({ navigation }) => {
  const { mechanicProfile, setHasServicePricing } = useMechanicProfile();
  const [notes, setNotes] = useState('');
  const [hasPricing, setHasPricing] = useState(Boolean(mechanicProfile.hasServicePricing));

  const handleSave = () => {
    setHasServicePricing(hasPricing);
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Add service pricing</AppText>
        </View>

        <AppText style={styles.caption}>Set your default service estimate so car owners can see your pricing.</AppText>

        <TouchableOpacity style={styles.toggleRow} activeOpacity={0.85} onPress={() => setHasPricing((prev) => !prev)}>
          <View>
            <AppText style={styles.toggleTitle}>Pricing configured</AppText>
            <AppText style={styles.toggleSub}>Mark complete once your pricing is set.</AppText>
          </View>
          <View style={[styles.check, hasPricing && styles.checkDone]}>
            {hasPricing ? (
              <HugeiconsIcon icon={Tick02Icon} size={14} color={darkTheme.colors.accent} strokeWidth={2.3} />
            ) : null}
          </View>
        </TouchableOpacity>

        <AppInput
          label="Notes (optional)"
          placeholder="e.g. Flat tire from 8,000 to 12,000"
          value={notes}
          onChangeText={setNotes}
          multiline
          textAlignVertical="top"
          inputStyle={styles.notesInput}
        />

        <AppButton label="Save and continue" onPress={handleSave} style={styles.saveBtn} />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
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
  caption: {
    marginTop: 16,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  toggleRow: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 10,
  },
  toggleTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  toggleSub: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    borderColor: darkTheme.colors.accent,
  },
  notesInput: {
    minHeight: 96,
    paddingTop: 10,
  },
  saveBtn: {
    marginTop: 'auto',
  },
});

export default ServicePricingScreen;
