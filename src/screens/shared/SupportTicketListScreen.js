import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import { getSupportTickets } from '../../services/support.service';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';
import AppAlert from '../../components/AppAlert';

const formatDateTime = (value) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeTicket = (raw, index = 0) => ({
  id: String(raw?.id || `ticket-${index}`).trim(),
  subject: String(raw?.subject || 'Support ticket').trim(),
  status: String(raw?.status || 'open').trim().toLowerCase(),
  category: String(raw?.category || 'other').trim().toLowerCase(),
  priority: String(raw?.priority || 'normal').trim().toLowerCase(),
  unreadCount: Number(raw?.unread_count || 0),
  updatedAt: raw?.updated_at || raw?.created_at || null,
});

const SupportTicketListScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const response = await getSupportTickets({ page: 1, limit: 50 });
      const payload = response?.data || response || {};
      const data = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setTickets(data.map((item, index) => normalizeTicket(item, index)).filter((item) => item.id));
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load support tickets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTickets({ silent: true });
  };

  const handleOpenTicket = (ticket) => {
    const ticketId = String(ticket?.id || '').trim();
    if (!ticketId) {
      AppAlert.alert('Missing ticket', 'Ticket ID is missing.');
      return;
    }
    navigation.navigate(ROUTES.SUPPORT_CHAT, { ticketId });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.ticketCard} activeOpacity={0.88} onPress={() => handleOpenTicket(item)}>
      <View style={styles.ticketTopRow}>
        <AppText style={styles.ticketSubject} numberOfLines={1}>
          {item.subject}
        </AppText>
        {item.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <AppText style={styles.unreadBadgeText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.ticketMetaRow}>
        <AppText style={styles.ticketMetaText}>{item.status}</AppText>
        <AppText style={styles.ticketMetaText}>•</AppText>
        <AppText style={styles.ticketMetaText}>{item.category}</AppText>
        <AppText style={styles.ticketMetaText}>•</AppText>
        <AppText style={styles.ticketMetaText}>{formatDateTime(item.updatedAt)}</AppText>
      </View>
    </TouchableOpacity>
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <AppText style={styles.emptyTitle}>No support tickets yet</AppText>
        <AppText style={styles.emptyBody}>Tap New ticket to raise an issue.</AppText>
      </View>
    ),
    []
  );

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Support tickets</AppText>
        <TouchableOpacity
          style={styles.newBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate(ROUTES.SUPPORT_CREATE)}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} color={darkTheme.colors.background} strokeWidth={2.2} />
          <AppText style={styles.newBtnText}>New ticket</AppText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.disputesBtn} activeOpacity={0.85} onPress={() => navigation.navigate(ROUTES.DISPUTES)}>
        <AppText style={styles.disputesBtnText}>View my disputes</AppText>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={tickets.length ? styles.listContent : styles.listEmptyContent}
          ListEmptyComponent={emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkTheme.colors.accent}
              colors={[darkTheme.colors.accent]}
              progressBackgroundColor={darkTheme.colors.background}
            />
          }
        />
      )}

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
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
  },
  newBtn: {
    minHeight: 32,
    borderRadius: 16,
    backgroundColor: darkTheme.colors.accent,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  newBtnText: {
    color: darkTheme.colors.background,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputesBtn: {
    marginHorizontal: 12,
    marginBottom: 10,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  disputesBtnText: {
    color: darkTheme.colors.text,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    rowGap: 10,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  ticketCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ticketTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketSubject: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: darkTheme.colors.background,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  ticketMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  ticketMetaText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'capitalize',
  },
  emptyWrap: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  emptyBody: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.64)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorText: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    color: '#FF8E8E',
    fontSize: 12,
  },
});

export default SupportTicketListScreen;

