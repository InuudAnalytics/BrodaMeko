import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../components';
import AppAlert from '../../components/AppAlert';
import { getMyJobDisputes, getMyOrderDisputes } from '../../services/dispute.service';
import { createSupportTicket, getSupportDisputeTicket } from '../../services/support.service';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const pickList = (response) => {
  const payload = response?.data || response || {};
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
};

const formatDateTime = (value) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeEvidence = (raw) => {
  if (!raw) {
    return [];
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry, index) => {
      if (typeof entry === 'string') {
        const url = entry.trim();
        return url ? { id: `evidence-${index}`, url } : null;
      }
      if (typeof entry === 'object') {
        const url = String(entry?.url || entry?.secure_url || entry?.content || '').trim();
        const id = String(entry?.public_id || entry?.id || `evidence-${index}`).trim();
        return url ? { id: id || `evidence-${index}`, url } : null;
      }
      return null;
    })
    .filter(Boolean);
};

const readTicketIdFromPayload = (response) => {
  const payload = response?.data || response || {};
  return String(payload?.data?.id || payload?.id || payload?.ticket_id || '').trim();
};

const DisputeDetailScreen = ({ navigation, route }) => {
  const disputeId = String(route?.params?.disputeId || '').trim();
  const disputeType = String(route?.params?.disputeType || route?.params?.type || '').trim().toLowerCase();
  const sourceJobId = String(route?.params?.sourceJobId || '').trim();
  const sourceOrderId = String(route?.params?.sourceOrderId || '').trim();
  const sourceOrderItemId = String(route?.params?.sourceOrderItemId || '').trim();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingSupport, setOpeningSupport] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  const resolveFromList = useCallback((items) => {
    if (!Array.isArray(items) || !items.length) {
      return null;
    }
    if (disputeId) {
      return items.find((item) => String(item?.id || '').trim() === disputeId) || null;
    }
    if (disputeType === 'order' && sourceOrderId) {
      return (
        items.find((item) => String(item?.order_id || '').trim() === sourceOrderId) || null
      );
    }
    if (disputeType === 'job' && sourceJobId) {
      return (
        items.find((item) => String(item?.job_id || '').trim() === sourceJobId) || null
      );
    }
    if (disputeType === 'order' && sourceOrderItemId) {
      return (
        items.find((item) => String(item?.order_item_id || '').trim() === sourceOrderItemId) || null
      );
    }
    return items[0] || null;
  }, [disputeId, disputeType, sourceJobId, sourceOrderId, sourceOrderItemId]);

  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      const isOrder = disputeType === 'order' || Boolean(sourceOrderId) || Boolean(sourceOrderItemId);
      const response = isOrder
        ? await getMyOrderDisputes({ page: 1, limit: 100 })
        : await getMyJobDisputes({ page: 1, limit: 100 });
      const data = pickList(response);
      const found = resolveFromList(data);
      if (!found) {
        setError('Dispute record not found.');
        setDetail(null);
      } else {
        setDetail(found);
      }
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load dispute detail.');
      setDetail(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [disputeType, resolveFromList, sourceOrderId, sourceOrderItemId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const evidence = useMemo(() => normalizeEvidence(detail?.evidence), [detail?.evidence]);
  const isOrderDispute = useMemo(() => {
    if (String(detail?.order_id || '').trim()) {
      return true;
    }
    if (String(detail?.job_id || '').trim()) {
      return false;
    }
    return disputeType === 'order' || Boolean(sourceOrderId) || Boolean(sourceOrderItemId);
  }, [detail?.job_id, detail?.order_id, disputeType, sourceOrderId, sourceOrderItemId]);

  const handleOpenSupport = async () => {
    const id = String(detail?.id || disputeId || '').trim();
    if (!id || openingSupport) {
      return;
    }

    setOpeningSupport(true);
    try {
      const lookup = await getSupportDisputeTicket({
        disputeId: id,
        type: isOrderDispute ? 'order' : 'job',
      });
      const ticketId = readTicketIdFromPayload(lookup);
      if (ticketId) {
        navigation.navigate(ROUTES.SUPPORT_CHAT, { ticketId });
        return;
      }

      AppAlert.alert('Unavailable', 'Support chat is not open for this dispute yet.');
    } catch (lookupError) {
      const statusCode = Number(lookupError?.statusCode || lookupError?.response?.status || 0);
      if (statusCode !== 404) {
        AppAlert.alert('Could not open', lookupError?.message || 'Could not open dispute support chat.');
        setOpeningSupport(false);
        return;
      }

      try {
        const created = await createSupportTicket({
          subject: `Dispute follow-up: ${String(detail?.reason || 'Dispute').slice(0, 80)}`,
          category: isOrderDispute ? 'order_dispute' : 'job_dispute',
          priority: 'high',
          job_dispute_id: isOrderDispute ? undefined : id,
          order_dispute_id: isOrderDispute ? id : undefined,
        });
        const ticketId = readTicketIdFromPayload(created);
        if (!ticketId) {
          AppAlert.alert('Created but unavailable', 'Support ticket was created, but chat ID was missing.');
          return;
        }
        navigation.navigate(ROUTES.SUPPORT_CHAT, { ticketId });
      } catch (createError) {
        AppAlert.alert('Create failed', createError?.message || 'Could not create linked support ticket.');
      }
    } finally {
      setOpeningSupport(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Dispute detail</AppText>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadDetail({ silent: true });
              }}
              tintColor={darkTheme.colors.accent}
              colors={[darkTheme.colors.accent]}
              progressBackgroundColor={darkTheme.colors.background}
            />
          }
        >
          {error ? (
            <View style={styles.card}>
              <AppText style={styles.errorText}>{error}</AppText>
            </View>
          ) : null}

          {detail ? (
            <>
              <View style={styles.card}>
                <View style={styles.row}>
                  <AppText style={styles.label}>Type</AppText>
                  <AppText style={styles.value}>{isOrderDispute ? 'Order dispute' : 'Job dispute'}</AppText>
                </View>
                <View style={styles.row}>
                  <AppText style={styles.label}>Status</AppText>
                  <AppText style={styles.valueCap}>{String(detail?.status || '-')}</AppText>
                </View>
                <View style={styles.row}>
                  <AppText style={styles.label}>Created</AppText>
                  <AppText style={styles.value}>{formatDateTime(detail?.created_at)}</AppText>
                </View>
                <View style={styles.row}>
                  <AppText style={styles.label}>Resolved</AppText>
                  <AppText style={styles.value}>{formatDateTime(detail?.resolved_at)}</AppText>
                </View>
              </View>

              <View style={styles.card}>
                <AppText style={styles.label}>Reason</AppText>
                <AppText style={styles.reason}>{String(detail?.reason || '-')}</AppText>
              </View>

              {detail?.admin_notes ? (
                <View style={styles.card}>
                  <AppText style={styles.label}>Admin notes</AppText>
                  <AppText style={styles.reason}>{String(detail?.admin_notes || '')}</AppText>
                </View>
              ) : null}

              {detail?.resolution ? (
                <View style={styles.card}>
                  <AppText style={styles.label}>Resolution</AppText>
                  <AppText style={styles.reason}>{String(detail?.resolution || '')}</AppText>
                </View>
              ) : null}

              {evidence.length ? (
                <View style={styles.card}>
                  <AppText style={styles.label}>Evidence</AppText>
                  <View style={styles.evidenceGrid}>
                    {evidence.map((entry) => (
                      <Image key={entry.id} source={{ uri: entry.url }} style={styles.evidenceImage} />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <AppButton
          label={openingSupport ? 'Opening support...' : 'Open or create support chat'}
          onPress={handleOpenSupport}
          disabled={openingSupport || !detail}
          left={openingSupport ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
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
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
    marginBottom: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 12,
  },
  value: {
    color: darkTheme.colors.text,
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
  },
  valueCap: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  reason: {
    marginTop: 6,
    color: darkTheme.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  evidenceGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  evidenceImage: {
    width: 86,
    height: 86,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    resizeMode: 'cover',
  },
  errorText: {
    color: '#FF8E8E',
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
});

export default DisputeDetailScreen;

