import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';

const ServicePricingScreen = ({ navigation }) => {
  const { mechanicProfile, setHasServicePricing } = useMechanicProfile();
  const added = Boolean(mechanicProfile.hasServicePricing);

  const handleAddPricing = () => {
    setHasServicePricing(true);
  };

  const handleSave = () => {
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

        <AppText style={styles.note}>Youll set price ranges for services you can handle.</AppText>

        <TouchableOpacity style={styles.stateRow} activeOpacity={0.85} onPress={handleAddPricing}>
          <View style={styles.stateLeft}>
            <AppText style={styles.stateTitle}>{added ? 'Pricing added' : 'Pricing not added yet'}</AppText>
            <AppText style={styles.stateSub}>Tap Add pricing to mark this step as complete.</AppText>
          </View>
          <View style={[styles.checkWrap, added && styles.checkWrapDone]}>
            {added ? <HugeiconsIcon icon={Tick02Icon} size={14} color={darkTheme.colors.accent} strokeWidth={2.4} /> : null}
          </View>
        </TouchableOpacity>

        <AppButton label="Add pricing" onPress={handleAddPricing} style={styles.actionBtn} />
        <AppButton label="Save & continue" onPress={handleSave} style={styles.saveBtn} />
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
  note: {
    marginTop: 16,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  stateRow: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  stateLeft: {
    flex: 1,
  },
  stateTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  stateSub: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapDone: {
    borderColor: darkTheme.colors.accent,
  },
  actionBtn: {
    marginTop: 14,
  },
  saveBtn: {
    marginTop: 12,
  },
});

export default ServicePricingScreen;
