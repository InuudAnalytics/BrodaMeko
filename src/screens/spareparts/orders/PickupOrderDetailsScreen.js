import React, { useState } from 'react';
import { DeviceEventEmitter, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { sellerConfirmMarketplacePickup } from '../../../services/marketplace.service';
import { darkTheme } from '../../../theme';
import AppAlert from '../../../components/AppAlert';
const formatNaira = (value) => `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

const resolveImageUri = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return String(value?.url || value?.secure_url || value?.uri || value?.path || '').trim();
  }
  return '';
};

const normalizeStatusLabel = (status) => {
  const safeStatus = String(status || '').toLowerCase();
  if (['paid', 'payment_initiated', 'initiated'].includes(safeStatus)) return 'Payment initiated';
  if (['pickup_pending', 'pending_pickup', 'ready_for_pickup', 'preparing'].includes(safeStatus)) {
    return 'Pickup pending';
  }
  if (['completed', 'received'].includes(safeStatus)) return 'Completed';
  return 'Pickup pending';
};

const MAX_ATTEMPTS = 3;

const PickupOrderDetailsScreen = ({ navigation, route }) => {
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [attemptError, setAttemptError] = useState('');
  const order = route?.params?.order || {};
  const isLocked = attempts >= MAX_ATTEMPTS;

  const orderId = String(order?.id || '').trim();
  const imageUri = resolveImageUri(order?.image);
  const displayOrderId = orderId || 'N/A';

  const statusLabel = normalizeStatusLabel(order?.status);

  const handleConfirmPickup = async () => {
    if (isLocked) return;

    const code = pickupCodeInput.replace(/\D/g, '').slice(0, 4);
    if (code.length !== 4) {
      setAttemptError('Enter the full 4-digit code.');
      return;
    }

    if (!orderId) {
      AppAlert.alert('Missing order info', 'Order reference is missing.');
      return;
    }

    setIsSubmitting(true);
    setAttemptError('');
    try {
      await sellerConfirmMarketplacePickup(orderId, code);
      DeviceEventEmitter.emit('sellerPickupConfirmed', { orderId });
      AppAlert.alert('Pickup confirmed', 'Order has been marked as completed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPickupCodeInput('');
      if (nextAttempts >= MAX_ATTEMPTS) {
        setAttemptError('Too many wrong attempts. Use the button below to report this issue.');
      } else {
        const remaining = MAX_ATTEMPTS - nextAttempts;
        setAttemptError(
          `Wrong code. You have ${remaining} more ${remaining === 1 ? 'try' : 'tries'}.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIssue = () => {
    AppAlert.alert(
      'Report an issue',
      'Please contact support about this pickup order.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={darkTheme.colors.accent} strokeWidth={2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Pickup order details</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Buyer details</AppText>
            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>Buyer name</AppText>
              <AppText style={styles.infoValue}>{order?.buyerName || 'Buyer'}</AppText>
            </View>
            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>Phone number</AppText>
              <AppText style={styles.infoValue}>{order?.buyerPhone || 'Not provided'}</AppText>
            </View>
            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>Order ID</AppText>
              <AppText style={styles.infoValue}>{displayOrderId}</AppText>
            </View>
            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>Status</AppText>
              <AppText style={styles.infoValue}>{statusLabel}</AppText>
            </View>
          </View>

          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Product details</AppText>
            <View style={styles.productRow}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} />
              ) : (
                <View style={styles.productImageFallback} />
              )}
              <View style={styles.productInfo}>
                <AppText style={styles.productName} numberOfLines={1}>
                  {order?.productName || 'Product'}
                </AppText>
                <AppText style={styles.productMeta}>Qty: {Number(order?.quantity || 1)}</AppText>
                <AppText style={styles.productMeta}>Shop: {order?.shopName || 'Spare parts shop'}</AppText>
                <AppText style={styles.productAmount}>{formatNaira(order?.amountPaid || 0)}</AppText>
              </View>
            </View>
            <View style={styles.pickupTypeBadge}>
              <AppText style={styles.pickupTypeText}>Pickup</AppText>
            </View>
          </View>

          <View style={styles.noteCard}>
            <AppText style={styles.noteText}>
              Ask the buyer for the secret pickup code before handing over the item.
            </AppText>
          </View>

          <View style={styles.inputWrap}>
            <AppText style={styles.inputLabel}>Enter pickup code</AppText>
            <TextInput
              value={pickupCodeInput}
              onChangeText={(text) => {
                setAttemptError('');
                setPickupCodeInput(text.replace(/\D/g, '').slice(0, 4));
              }}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={[styles.input, isLocked && styles.inputDisabled]}
              editable={!isLocked}
            />
            {attemptError ? (
              <AppText style={styles.attemptError}>{attemptError}</AppText>
            ) : null}
          </View>

          {isLocked ? (
            <TouchableOpacity
              style={styles.reportButton}
              activeOpacity={0.85}
              onPress={handleReportIssue}
            >
              <AppText style={styles.reportButtonText}>Report an issue</AppText>
            </TouchableOpacity>
          ) : (
            <AppButton
              label={isSubmitting ? 'Confirming...' : 'Confirm pickup'}
              onPress={handleConfirmPickup}
              disabled={isSubmitting}
              style={styles.confirmButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#010037',
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    rowGap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    rowGap: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
    flexShrink: 1,
    textAlign: 'right',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  productImageFallback: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  productMeta: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  productAmount: {
    color: '#E6C714',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginTop: 3,
  },
  pickupTypeBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(230,199,20,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pickupTypeText: {
    color: '#E6C714',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  noteCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.45)',
    padding: 11,
  },
  noteText: {
    color: '#DCEBFF',
    fontSize: 12,
    lineHeight: 18,
  },
  inputWrap: {
    rowGap: 8,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  confirmButton: {
    marginTop: 4,
  },
  inputDisabled: {
    opacity: 0.4,
  },
  attemptError: {
    marginTop: 8,
    color: '#EF4444',
    fontSize: 12,
    lineHeight: 16,
  },
  reportButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PickupOrderDetailsScreen;



