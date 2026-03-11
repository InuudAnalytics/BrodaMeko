import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText, ScreenContainer } from '../../../components';
import { getTransactionDetails } from '../../../services/transactions.service';
import { darkTheme } from '../../../theme';

const readValue = (payload, keys, fallback = 'N/A') => {
  for (let index = 0; index < keys.length; index += 1) {
    const value = payload?.[keys[index]];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return fallback;
};

const toNaira = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return String(value || 'N/A');
  }
  return `\u20A6${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const normalizeStatusText = (value) => String(value || '').trim().toLowerCase();

const resolveStatusBadge = (payload) => {
  const escrow = normalizeStatusText(payload?.escrow_status || payload?.escrowStatus);
  const payment = normalizeStatusText(payload?.payment_status || payload?.paymentStatus);
  const status = normalizeStatusText(payload?.status);
  const haystack = `${escrow} ${payment} ${status}`.trim();

  if (['held', 'in_escrow', 'funded', 'secured'].includes(escrow)) {
    return { label: 'In escrow', tone: 'warning' };
  }
  if (['released', 'disbursed'].includes(escrow)) {
    return { label: 'Released', tone: 'success' };
  }
  if (['refunded', 'reversed'].includes(escrow)) {
    return { label: 'Refunded', tone: 'neutral' };
  }
  if (haystack.includes('pending') || haystack.includes('processing')) {
    return { label: 'Pending', tone: 'warning' };
  }
  if (
    haystack.includes('success') ||
    haystack.includes('successful') ||
    haystack.includes('paid') ||
    haystack.includes('completed')
  ) {
    return { label: 'Successful', tone: 'success' };
  }
  if (
    haystack.includes('failed') ||
    haystack.includes('cancelled') ||
    haystack.includes('canceled') ||
    haystack.includes('declined')
  ) {
    return { label: 'Failed', tone: 'danger' };
  }
  return { label: 'Processing', tone: 'neutral' };
};

const TransactionDetailsScreen = ({ navigation, route }) => {
  const reference = String(route?.params?.reference || '').trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchDetails = async () => {
      if (!reference) {
        setError('Transaction reference is missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await getTransactionDetails(reference);
        const payload = response?.data || response?.transaction || response || null;

        if (active) {
          setDetails(payload);
          setError('');
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError?.message || 'Could not load transaction details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      active = false;
    };
  }, [reference]);

  const entries = useMemo(() => {
    const payload = details || {};

    return [
      { label: 'Reference', value: readValue(payload, ['reference', 'trxref', 'id'], reference || 'N/A') },
      { label: 'Status', value: readValue(payload, ['status']) },
      { label: 'Escrow status', value: readValue(payload, ['escrow_status', 'escrowStatus']) },
      { label: 'Payment status', value: readValue(payload, ['payment_status', 'paymentStatus']) },
      {
        label: 'Amount',
        value: toNaira(payload?.amount || payload?.total || payload?.value || payload?.paid_amount),
      },
      { label: 'Type', value: readValue(payload, ['type', 'transaction_type', 'channel']) },
      { label: 'Date', value: readValue(payload, ['created_at', 'createdAt', 'date']) },
    ];
  }, [details, reference]);

  const statusBadge = useMemo(() => resolveStatusBadge(details || {}), [details]);

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <AppText style={styles.backText}>Back</AppText>
        </TouchableOpacity>
        <AppText style={styles.title}>Transaction details</AppText>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.centerState}>
          <AppText style={styles.errorText}>{error}</AppText>
        </View>
      ) : null}

      {!loading && !error ? (
        <View style={styles.card}>
          <View
            style={[
              styles.statusBadge,
              statusBadge.tone === 'success' ? styles.statusBadgeSuccess : null,
              statusBadge.tone === 'warning' ? styles.statusBadgeWarning : null,
              statusBadge.tone === 'danger' ? styles.statusBadgeDanger : null,
            ]}
          >
            <AppText
              style={[
                styles.statusBadgeText,
                statusBadge.tone === 'success' ? styles.statusBadgeTextSuccess : null,
                statusBadge.tone === 'warning' ? styles.statusBadgeTextWarning : null,
                statusBadge.tone === 'danger' ? styles.statusBadgeTextDanger : null,
              ]}
            >
              {statusBadge.label}
            </AppText>
          </View>

          {entries.map((item) => (
            <View key={item.label} style={styles.row}>
              <AppText style={styles.label}>{item.label}</AppText>
              <AppText style={styles.value}>{item.value}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    marginBottom: 16,
  },
  backText: {
    color: darkTheme.colors.accent,
    fontSize: 14,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#FF7F7F',
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    rowGap: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    minHeight: 22,
    borderRadius: 11,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(60, 200, 120, 0.18)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(230, 199, 20, 0.22)',
  },
  statusBadgeDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
  },
  statusBadgeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  statusBadgeTextSuccess: {
    color: '#7CF0A6',
  },
  statusBadgeTextWarning: {
    color: '#E6C714',
  },
  statusBadgeTextDanger: {
    color: '#F87171',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  label: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
  value: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: 13,
    textAlign: 'right',
  },
});

export default TransactionDetailsScreen;
