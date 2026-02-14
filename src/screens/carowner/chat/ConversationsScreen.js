import React, { useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { AppBottomNav, AppText, ScreenContainer } from '../../../components';
import { useChat } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const MOCK_CONVERSATIONS = [
  {
    id: 'mock-conv-1',
    mechanic: { name: 'Samuel Olamilekan' },
    last_message: { text: 'I am close by, 5 minutes away.', created_at: new Date().toISOString() },
    unread_count: 2,
  },
  {
    id: 'mock-conv-2',
    mechanic: { name: 'Emeka Nwosu' },
    last_message: { text: 'I have accepted your request.', created_at: new Date(Date.now() - 3600 * 1000).toISOString() },
    unread_count: 0,
  },
];

const getConversationId = (item) =>
  String(item?.id || item?._id || item?.conversation_id || item?.conversationId || '').trim();

const getDisplayName = (item) =>
  item?.mechanic?.name ||
  item?.name ||
  item?.participant_name ||
  item?.participantName ||
  'Mechanic';

const getInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return 'M';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

const getLastSnippet = (item) =>
  item?.last_message?.text ||
  item?.lastMessage?.text ||
  item?.last_message ||
  item?.lastMessage ||
  'Tap to open conversation';

const getMessageTime = (item) => {
  const rawDate = item?.last_message?.created_at || item?.lastMessage?.created_at || item?.updated_at || null;

  if (!rawDate) {
    return '';
  }

  const date = new Date(rawDate);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getUnreadCount = (item) => Number(item?.unread_count || item?.unreadCount || 0);

const limitText = (value, max = 42) => {
  const text = String(value || '');

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1)}...`;
};

const ConversationItem = ({ item, onPress }) => {
  const name = getDisplayName(item);
  const initials = getInitials(name);
  const snippet = limitText(getLastSnippet(item));
  const unreadCount = getUnreadCount(item);
  const hasUnread = unreadCount > 0;
  const time = getMessageTime(item);

  return (
    <Pressable onPress={onPress} style={styles.row} android_ripple={{ color: 'rgba(255,255,255,0.06)' }}>
      <View style={styles.avatar}>
        <AppText style={styles.avatarText}>{initials}</AppText>
      </View>

      <View style={styles.info}>
        <AppText style={styles.name}>{name}</AppText>
        <AppText variant="muted" numberOfLines={1} style={styles.snippet}>
          {snippet}
        </AppText>
      </View>

      <View style={styles.meta}>
        <AppText variant="muted" style={styles.timeText}>
          {time}
        </AppText>
        {hasUnread ? (
          <View style={styles.unreadBadge}>
            <AppText style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</AppText>
          </View>
        ) : (
          <View style={styles.readDot} />
        )}
      </View>
    </Pressable>
  );
};

const ConversationSeparator = () => <View style={styles.separator} />;
const SKELETON_ITEMS = Array.from({ length: 6 }, (_, index) => `sk-${index}`);

const SkeletonRow = () => {
  return (
    <View style={styles.row}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.info}>
        <View style={styles.skeletonName} />
        <View style={styles.skeletonSnippet} />
      </View>
      <View style={styles.meta}>
        <View style={styles.skeletonTime} />
        <View style={styles.skeletonDot} />
      </View>
    </View>
  );
};

const ConversationsScreen = ({ navigation }) => {
  const { conversations, loadingConversations, error, fetchConversations, openConversation } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const displayData = useMemo(() => {
    if (conversations?.length) {
      return conversations;
    }

    return MOCK_CONVERSATIONS;
  }, [conversations]);

  const handleOpen = async (conversation) => {
    await openConversation(conversation);

    navigation.navigate(ROUTES.CAR_OWNER_CHAT, {
      conversationId: getConversationId(conversation),
      conversation,
      mechanic: conversation?.mechanic,
      fromConversations: true,
    });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <AppText variant="title" style={styles.heading}>
          Conversations
        </AppText>
      </View>

      {loadingConversations ? (
        <FlatList
          data={SKELETON_ITEMS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          renderItem={() => <SkeletonRow />}
          ItemSeparatorComponent={ConversationSeparator}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item, index) => getConversationId(item) || `conv-${index}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ConversationItem item={item} onPress={() => handleOpen(item)} />}
          ItemSeparatorComponent={ConversationSeparator}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <AppText variant="muted" style={styles.stateText}>
                {error ? 'Could not load conversations right now.' : 'No conversations yet.'}
              </AppText>
            </View>
          }
        />
      )}

      <AppBottomNav
        activeTab={ROUTES.CAR_OWNER_SETTINGS}
        onTabPress={(routeName) => navigation.navigate(routeName)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.md,
    paddingBottom: darkTheme.spacing.sm,
  },
  heading: {
    color: darkTheme.colors.text,
  },
  listContent: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.lg,
  },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(226,255,49,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkTheme.colors.accent,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  info: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    fontSize: darkTheme.typography.fontSizes.md,
  },
  snippet: {
    color: 'rgba(255,255,255,0.62)',
    marginTop: 2,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  skeletonName: {
    width: '52%',
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginBottom: 8,
  },
  skeletonSnippet: {
    width: '78%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  meta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    rowGap: darkTheme.spacing.xs,
    minWidth: 44,
  },
  timeText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  skeletonTime: {
    width: 34,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  skeletonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: darkTheme.colors.background,
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  readDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  separator: {
    height: 6,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
    rowGap: darkTheme.spacing.xs,
  },
  stateText: {
    textAlign: 'center',
    color: darkTheme.colors.muted,
  },
});

export default ConversationsScreen;
