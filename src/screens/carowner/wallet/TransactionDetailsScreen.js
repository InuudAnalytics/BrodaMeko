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
  return `#${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
      {
        label: 'Amount',
        value: toNaira(payload?.amount || payload?.total || payload?.value || payload?.paid_amount),
      },
      { label: 'Type', value: readValue(payload, ['type', 'transaction_type', 'channel']) },
      { label: 'Date', value: readValue(payload, ['created_at', 'createdAt', 'date']) },
    ];
  }, [details, reference]);

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
    backgroundColor: '#000033',
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
