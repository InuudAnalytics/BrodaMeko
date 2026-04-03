import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Download01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { getTransactionDetails } from '../../../services/transactions.service';
import { darkTheme } from '../../../theme';

// ─── helpers ────────────────────────────────────────────────────────────────

const readVal = (obj, keys, fallback = '—') => {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return fallback;
};

const toNaira = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value || '—');
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDateTime = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;
};

const prettyType = (value) =>
  String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

const resolveStatusBadge = (payload) => {
  const norm = (v) => String(v || '').trim().toLowerCase();
  const escrow = norm(payload?.escrow_status || payload?.escrowStatus);
  const payment = norm(payload?.payment_status || payload?.paymentStatus);
  const status = norm(payload?.status);
  const haystack = `${escrow} ${payment} ${status}`;

  if (['held', 'in_escrow', 'funded', 'secured'].includes(escrow))
    return { label: 'In Escrow', bg: 'rgba(230,199,20,0.18)', color: '#E6C714' };
  if (['released', 'disbursed'].includes(escrow))
    return { label: 'Released', bg: 'rgba(60,200,120,0.18)', color: '#7CF0A6' };
  if (['refunded', 'reversed'].includes(escrow))
    return { label: 'Refunded', bg: 'rgba(123,200,255,0.14)', color: '#7BC8FF' };
  if (haystack.includes('pending') || haystack.includes('processing'))
    return { label: 'Pending', bg: 'rgba(230,199,20,0.18)', color: '#E6C714' };
  if (
    haystack.includes('success') ||
    haystack.includes('successful') ||
    haystack.includes('paid') ||
    haystack.includes('completed')
  )
    return { label: 'Successful', bg: 'rgba(60,200,120,0.18)', color: '#7CF0A6' };
  if (
    haystack.includes('failed') ||
    haystack.includes('cancelled') ||
    haystack.includes('canceled') ||
    haystack.includes('declined')
  )
    return { label: 'Failed', bg: 'rgba(248,113,113,0.18)', color: '#F87171' };
  return { label: 'Processing', bg: 'rgba(123,200,255,0.14)', color: '#7BC8FF' };
};

// ─── row ────────────────────────────────────────────────────────────────────

const Row = ({ label, value, valueStyle }) => (
  <View style={styles.row}>
    <AppText style={styles.rowLabel}>{label}</AppText>
    <AppText style={[styles.rowValue, valueStyle]} numberOfLines={0}>{value}</AppText>
  </View>
);

// ─── screen ─────────────────────────────────────────────────────────────────

const TransactionDetailsScreen = ({ navigation, route }) => {
  const reference = String(route?.params?.reference || '').trim();
  const preview = route?.params?.preview || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      if (!reference) {
        setError('Transaction reference is missing.');
        setLoading(false);
        return;
      }
      try {
        const res = await getTransactionDetails(reference);
        const payload = res?.data || res?.transaction || res || null;
        if (active) { setDetails(payload); setError(''); }
      } catch (e) {
        if (active) setError(e?.message || 'Could not load transaction details.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [reference]);

  const badge = useMemo(() => resolveStatusBadge(details || {}), [details]);

  const amountDisplay = useMemo(() => {
    if (!details) return preview?.amountText || '—';
    const raw = details?.amount ?? details?.total ?? details?.value ?? details?.paid_amount;
    if (raw === undefined || raw === null) return preview?.amountText || '—';
    return toNaira(raw);
  }, [details, preview]);

  const isPositive = preview?.positive ?? true;

  const handleShare = async () => {
    if (!details) return;
    setSharing(true);
    try {
      const type = prettyType(readVal(details, ['type', 'transaction_type']));
      const desc = readVal(details, ['description', 'narration', 'title']);
      const dateStr = formatDateTime(readVal(details, ['created_at', 'createdAt', 'date']));
      const lines = [
        'BrodaMeko — Transaction Receipt',
        '─────────────────────────────',
        `Amount:    ${amountDisplay}`,
        `Status:    ${badge.label}`,
        `Type:      ${type}`,
        `Reference: ${reference}`,
        `ID:        ${readVal(details, ['id', '_id'])}`,
        `Date:      ${dateStr}`,
        desc && desc !== '—' ? `Details:   ${desc}` : null,
        '─────────────────────────────',
      ].filter(Boolean).join('\n');
      await Share.share({ message: lines, title: 'Transaction Receipt' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Transaction Details</AppText>
        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.85}
          onPress={handleShare}
          disabled={sharing || !details}
        >
          <HugeiconsIcon
            icon={Download01Icon}
            size={20}
            color={details ? darkTheme.colors.accent : 'rgba(255,255,255,0.25)'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.center}>
          <AppText style={styles.errorText}>{error}</AppText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => {
            setLoading(true);
            setError('');
            getTransactionDetails(reference)
              .then((res) => {
                const payload = res?.data || res?.transaction || res || null;
                setDetails(payload);
              })
              .catch((e) => setError(e?.message || 'Could not load transaction details.'))
              .finally(() => setLoading(false));
          }}>
            <AppText style={styles.retryText}>Retry</AppText>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && details ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* amount hero */}
          <View style={styles.hero}>
            <AppText style={[styles.heroAmount, isPositive ? styles.heroAmountPositive : styles.heroAmountNegative]}>
              {amountDisplay}
            </AppText>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <AppText style={[styles.badgeText, { color: badge.color }]}>{badge.label}</AppText>
            </View>
          </View>

          {/* details card */}
          <View style={styles.card}>
            <Row
              label="Description"
              value={readVal(details, ['description', 'narration', 'title'])}
              valueStyle={styles.descValue}
            />
            <View style={styles.divider} />
            <Row label="Type" value={prettyType(readVal(details, ['type', 'transaction_type']))} />
            <View style={styles.divider} />
            <Row label="Reference" value={readVal(details, ['reference', 'trxref'], reference || '—')} />
            <View style={styles.divider} />
            <Row label="Transaction ID" value={readVal(details, ['id', '_id'])} />
            <View style={styles.divider} />
            <Row label="Date" value={formatDateTime(readVal(details, ['created_at', 'createdAt', 'date']))} />
            {details?.payment_status || details?.paymentStatus ? (
              <>
                <View style={styles.divider} />
                <Row label="Payment status" value={prettyType(readVal(details, ['payment_status', 'paymentStatus']))} />
              </>
            ) : null}
            {details?.escrow_status || details?.escrowStatus ? (
              <>
                <View style={styles.divider} />
                <Row label="Escrow status" value={prettyType(readVal(details, ['escrow_status', 'escrowStatus']))} />
              </>
            ) : null}
          </View>

          {/* receipt note */}
          <AppText style={styles.receiptNote}>
            Tap the download icon above to share this receipt.
          </AppText>
        </ScrollView>
      ) : null}
    </ScreenContainer>
  );
};

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#010037' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: darkTheme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  shareBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, rowGap: 12 },
  errorText: { color: '#FF8B8B', textAlign: 'center', fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  retryText: { color: darkTheme.colors.text, fontSize: 14 },

  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', marginBottom: 28, rowGap: 10 },
  heroAmount: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: darkTheme.typography.fontWeights.bold,
    letterSpacing: -0.5,
  },
  heroAmountPositive: { color: '#7CF0A6' },
  heroAmountNegative: { color: '#FFFFFF' },

  badge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },

  card: {
    borderRadius: 14,
    backgroundColor: 'rgba(125,128,173,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 4,
    paddingHorizontal: 14,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    columnGap: 16,
    paddingVertical: 13,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 0,
  },
  rowValue: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'right',
  },
  descValue: { textAlign: 'right' },

  receiptNote: {
    marginTop: 20,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});

export default TransactionDetailsScreen;
