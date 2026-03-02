import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { ROUTES } from '../../../utils';

const ProductFeedbackSuccessScreen = ({ navigation }) => {
  const handleBackToMarketplace = () => {
    navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'marketplace' });
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.container}>
        <View style={styles.card}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={72} color="#22C55E" strokeWidth={2} />
          <AppText style={styles.title}>Feedback submitted</AppText>
          <AppText style={styles.subtitle}>Thanks for sharing your feedback about this product.</AppText>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBackToMarketplace} activeOpacity={0.85}>
            <AppText style={styles.primaryText}>Back to marketplace</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#1A1A4A',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#E6C714',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#000033',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProductFeedbackSuccessScreen;
