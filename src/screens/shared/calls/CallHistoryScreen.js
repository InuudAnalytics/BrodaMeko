import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Call02Icon } from '@hugeicons/core-free-icons';
import { AppText, PullToRefreshIndicator, ScreenContainer } from '../../../components';
import { getCallHistory } from '../../../services/calls.service';
import { darkTheme } from '../../../theme';

const formatDateTime = (value) => {
  const parsed = Date.parse(String(value || '').trim());
  if (!Number.isFinite(parsed)) {
    return 'Unavailable';
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(parsed));
  const read = (type) => String(parts.find((part) => part.type === type)?.value || '').trim();
  const day = read('day');
  const month = read('month');
  const year = read('year');
  const hour = read('hour');
  const minute = read('minute');
  const period = read('dayPeriod').toUpperCase();
  if (!day || !month || !year || !hour || !minute || !period) {
    return 'Unavailable';
  }
  return `${day}-${month}-${year} ${hour}:${minute} ${period}`;
};

const formatDuration = (secondsValue) => {
  const total = Number(secondsValue);
  if (!Number.isFinite(total) || total <= 0) {
    return '00:00';
  }
  const mins = Math.floor(total / 60).toString().padStart(2, '0');
  const secs = Math.floor(total % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const statusStyle = (state) => {
  const normalized = String(state || '').trim().toLowerCase();
  if (normalized === 'accepted') {
    return { bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.5)', text: '#86EFAC', label: 'Accepted' };
  }
  if (normalized === 'ringing') {
    return { bg: 'rgba(230,199,20,0.18)', border: 'rgba(230,199,20,0.5)', text: '#F4DE7A', label: 'Ringing' };
  }
  if (normalized === 'rejected') {
    return { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.5)', text: '#FCA5A5', label: 'Rejected' };
  }
  if (normalized === 'missed') {
    return { bg: 'rgba(251,146,60,0.18)', border: 'rgba(251,146,60,0.5)', text: '#FDBA74', label: 'Missed' };
  }
  if (normalized === 'failed') {
    return { bg: 'rgba(244,63,94,0.16)', border: 'rgba(244,63,94,0.45)', text: '#FDA4AF', label: 'Failed' };
  }
  return { bg: 'rgba(147,197,253,0.18)', border: 'rgba(147,197,253,0.5)', text: '#BFDBFE', label: 'Ended' };
};

const CallHistoryScreen = ({ navigation, route }) => {
  const contextType = String(route?.params?.contextType || '').trim().toLowerCase();
  const contextId = String(route?.params?.contextId || '').trim();
  const pullDistance = useRef(new Animated.Value(0)).current;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const title = useMemo(() => {
    if (contextType === 'order' && contextId) {
      return `Order call history #${contextId.slice(0, 8)}`;
    }
    if (contextType === 'job' && contextId) {
      return `Job call history #${contextId.slice(0, 8)}`;
    }
    return 'Call history';
  }, [contextId, contextType]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      const response = await getCallHistory({
        context_type: contextType || undefined,
        context_id: contextId || undefined,
        page: 1,
        limit: 50,
      });
      const list = Array.isArray(response?.data) ? response.data : [];
      setRows(list);
    } catch (error) {
      setErrorText(error?.message || 'Could not load call history.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.title}>{title}</AppText>
      </View>

      <View style={styles.listWrap}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loading} />
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
            pullDistance.setValue(pullValue);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchHistory}
              tintColor="transparent"
              colors={['transparent']}
            />
          }
        >
          {errorText ? <AppText style={styles.errorText}>{errorText}</AppText> : null}
          {!loading && !rows.length ? (
            <View style={styles.emptyWrap}>
              <AppText style={styles.emptyTitle}>No call records yet</AppText>
              <AppText style={styles.emptyBody}>Your call history will appear here.</AppText>
            </View>
          ) : null}
          {rows.map((row) => {
            const style = statusStyle(row?.state);
            const name = String(row?.other_party?.full_name || 'Contact').trim() || 'Contact';
            const role = String(row?.other_party?.role || '').trim() || 'User';
            const context = String(row?.context_type || '').trim().toLowerCase();
            const contextRef = String(row?.context_id || '').trim();
            return (
              <View key={String(row?.call_id || `${name}-${contextRef}`)} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.iconWrap}>
                    <HugeiconsIcon icon={Call02Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.nameWrap}>
                    <AppText style={styles.name}>{name}</AppText>
                    <AppText style={styles.meta}>{role}</AppText>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: style.bg, borderColor: style.border }]}>
                    <AppText style={[styles.statusText, { color: style.text }]}>{style.label}</AppText>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <AppText style={styles.infoLabel}>When</AppText>
                  <AppText style={styles.infoValue}>{formatDateTime(row?.started_at || row?.ended_at)}</AppText>
                </View>
                <View style={styles.infoRow}>
                  <AppText style={styles.infoLabel}>Duration</AppText>
                  <AppText style={styles.infoValue}>{formatDuration(row?.duration_seconds)}</AppText>
                </View>
                <View style={styles.infoRow}>
                  <AppText style={styles.infoLabel}>Context</AppText>
                  <AppText style={styles.infoValue}>
                    {context ? `${context} #${contextRef.slice(0, 8)}` : 'Unavailable'}
                  </AppText>
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 16,
  },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    paddingTop: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 24,
    rowGap: 10,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 16,
  },
  emptyWrap: {
    marginTop: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  emptyBody: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    marginBottom: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(230,199,20,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWrap: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  meta: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'capitalize',
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  infoLabel: {
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  infoValue: {
    color: darkTheme.colors.text,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'capitalize',
  },
});

export default CallHistoryScreen;
