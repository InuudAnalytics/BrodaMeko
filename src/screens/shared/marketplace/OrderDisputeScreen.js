import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Delete02Icon, Image01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import AppAlert from '../../../components/AppAlert';
import { isDisputeV2EnabledForRole } from '../../../config/featureFlags';
import { useAuth } from '../../../context';
import { fileOrderDispute } from '../../../services/dispute.service';
import { darkTheme } from '../../../theme';
import { pickSingleImageFromGallery, ROUTES } from '../../../utils';

const MAX_EVIDENCE = 5;

const normalizeOrderItems = (rawItems = []) => {
  const source = Array.isArray(rawItems) ? rawItems : [];
  return source
    .map((item, index) => {
      const id = String(item?.id || item?._id || item?.item_id || '').trim();
      const name = String(item?.name || item?.part_name || item?.title || `Item ${index + 1}`).trim();
      const status = String(item?.status || '').trim().toLowerCase();
      return { id, name: name || `Item ${index + 1}`, status };
    })
    .filter((item) => item.id);
};

const readImageUri = (file) => String(file?.uri || '').trim();

const OrderDisputeScreen = ({ navigation, route }) => {
  const { role } = useAuth();
  const orderId = String(route?.params?.orderId || route?.params?.order_id || '').trim();
  const initialReason = String(route?.params?.initialReason || '').trim();
  const items = useMemo(() => normalizeOrderItems(route?.params?.orderItems), [route?.params?.orderItems]);
  const initialItemId = String(route?.params?.itemId || route?.params?.order_item_id || '').trim();
  const [selectedItemId, setSelectedItemId] = useState(initialItemId || items[0]?.id || '');
  const [reason, setReason] = useState(initialReason);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedItemLabel = useMemo(() => {
    const selected = items.find((item) => item.id === selectedItemId);
    return selected?.name || 'No item selected';
  }, [items, selectedItemId]);

  const handleAddEvidence = async () => {
    if (evidenceFiles.length >= MAX_EVIDENCE) {
      AppAlert.alert('Limit reached', `You can upload up to ${MAX_EVIDENCE} evidence images.`);
      return;
    }

    const { cancelled, asset, error } = await pickSingleImageFromGallery();
    if (cancelled) {
      return;
    }
    if (error) {
      AppAlert.alert('Image error', error);
      return;
    }
    if (!asset?.uri) {
      AppAlert.alert('Image error', 'No image selected.');
      return;
    }

    setEvidenceFiles((prev) => {
      const next = [...prev, asset];
      return next.slice(0, MAX_EVIDENCE);
    });
  };

  const handleRemoveEvidence = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const safeReason = String(reason || '').trim();
    if (!orderId) {
      AppAlert.alert('Missing order', 'Order ID is missing. Go back and try again.');
      return;
    }
    if (!safeReason) {
      AppAlert.alert('Reason required', 'Please enter your dispute reason.');
      return;
    }
    if (!selectedItemId) {
      AppAlert.alert('Item required', 'Select the specific order item to dispute.');
      return;
    }
    if (submitting) {
      return;
    }
    if (!isDisputeV2EnabledForRole(role)) {
      AppAlert.alert('Unavailable', 'Order dispute flow is temporarily unavailable for your role.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fileOrderDispute(orderId, {
        reason: safeReason,
        order_item_id: selectedItemId,
        evidence: evidenceFiles,
      });
      const payload = response?.data || response || {};
      const disputeId = String(payload?.dispute_id || payload?.data?.dispute_id || payload?.id || '').trim();

      AppAlert.alert('Dispute submitted', 'Your order dispute has been logged for admin review.', [
        {
          text: 'View disputes',
          onPress: () =>
            navigation.navigate(ROUTES.DISPUTES, {
              focusDisputeId: disputeId || undefined,
              focusType: 'order',
              openedAt: Date.now(),
            }),
        },
        { text: 'Done', style: 'cancel' },
      ]);
    } catch (error) {
      AppAlert.alert('Submit failed', error?.message || 'Could not submit order dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>File order dispute</AppText>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <AppText style={styles.label}>Order ID</AppText>
          <AppText style={styles.value}>{orderId || 'Unknown'}</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.label}>Order item</AppText>
          {items.length ? (
            <View style={styles.itemWrap}>
              {items.map((item) => {
                const selected = item.id === selectedItemId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemChip, selected ? styles.itemChipActive : null]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedItemId(item.id)}
                  >
                    <AppText style={[styles.itemChipName, selected ? styles.itemChipNameActive : null]} numberOfLines={1}>
                      {item.name}
                    </AppText>
                    <AppText style={[styles.itemChipStatus, selected ? styles.itemChipNameActive : null]}>
                      {item.status || 'pending'}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <AppText style={styles.helpText}>No order item loaded. Go back and reopen this order.</AppText>
          )}
          <AppText style={styles.helpText}>Selected: {selectedItemLabel}</AppText>
        </View>

        <View style={styles.card}>
          <AppText style={styles.label}>Reason</AppText>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Describe the issue with this order item"
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            textAlignVertical="top"
            style={styles.reasonInput}
            editable={!submitting}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.evidenceHeader}>
            <AppText style={styles.label}>Evidence images</AppText>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.85} onPress={handleAddEvidence} disabled={submitting}>
              <HugeiconsIcon icon={Image01Icon} size={15} color={darkTheme.colors.background} strokeWidth={2} />
              <AppText style={styles.addBtnText}>Add image</AppText>
            </TouchableOpacity>
          </View>
          <AppText style={styles.helpText}>
            Optional. Backend accepts up to {MAX_EVIDENCE} files under the `evidence` field.
          </AppText>
          {evidenceFiles.length ? (
            <View style={styles.evidenceGrid}>
              {evidenceFiles.map((file, index) => (
                <View key={`${readImageUri(file)}-${index}`} style={styles.evidenceItem}>
                  <Image source={{ uri: readImageUri(file) }} style={styles.evidenceImage} />
                  <TouchableOpacity
                    style={styles.removeEvidenceBtn}
                    activeOpacity={0.85}
                    onPress={() => handleRemoveEvidence(index)}
                    disabled={submitting}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} color="#FFFFFF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label={submitting ? 'Submitting...' : 'Submit dispute'}
          onPress={handleSubmit}
          disabled={submitting}
          left={submitting ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
        />
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
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    rowGap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  value: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  helpText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
    lineHeight: 15,
  },
  itemWrap: {
    marginTop: 8,
    rowGap: 8,
  },
  itemChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemChipActive: {
    borderColor: 'rgba(230,199,20,0.75)',
    backgroundColor: 'rgba(230,199,20,0.14)',
  },
  itemChipName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  itemChipNameActive: {
    color: darkTheme.colors.accent,
  },
  itemChipStatus: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.56)',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  reasonInput: {
    marginTop: 8,
    minHeight: 110,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: darkTheme.colors.text,
    fontSize: 13,
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addBtn: {
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: darkTheme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: 10,
  },
  addBtnText: {
    color: darkTheme.colors.background,
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  evidenceGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  evidenceItem: {
    width: 78,
    height: 78,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeEvidenceBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
});

export default OrderDisputeScreen;
