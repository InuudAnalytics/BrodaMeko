import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { getMechanicReviews, replyToMechanicReview } from '../../../services/mechanic-reviews.service';
import { getSellerStore } from '../../../services/spareParts.service';
import { getStoreReviews, replyToStoreReview } from '../../../services/store-reviews.service';
import { darkTheme, withAlpha } from '../../../theme';
import { ROLES } from '../../../utils';

const STAR_FILTERS = [
  { key: 'all', label: 'All reviews' },
  { key: '5', label: '5 stars' },
  { key: '4', label: '4 stars' },
  { key: '3', label: '3 stars' },
  { key: '2', label: '2 stars' },
  { key: '1', label: '1 star' },
];

const readRoot = (response) => response?.data || response || {};

const readList = (response) => {
  const root = readRoot(response);
  if (Array.isArray(root)) {
    return root;
  }
  if (Array.isArray(root?.reviews)) {
    return root.reviews;
  }
  if (Array.isArray(root?.data)) {
    return root.data;
  }
  if (Array.isArray(root?.items)) {
    return root.items;
  }
  return [];
};

const readStore = (response) => {
  const root = readRoot(response);
  const store = root?.store || root?.data || root;
  return store && typeof store === 'object' ? store : null;
};

const readStoreId = (store) =>
  String(store?.id || store?._id || store?.store_id || store?.storeId || '').trim();

const readNumericRating = (item) => {
  const value = Number(item?.rating || item?.stars || item?.star_rating || 0);
  return Number.isFinite(value) ? Math.max(1, Math.min(5, Math.round(value))) : 1;
};

const formatDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'Unknown date';
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return date.toLocaleDateString('en-GB');
};

const normalizeReview = (item) => {
  const id = String(item?.id || item?._id || '').trim();
  const rating = readNumericRating(item);
  const replies = Array.isArray(item?.replies)
    ? item.replies
    : Array.isArray(item?.reply)
      ? item.reply
      : [];

  return {
    id,
    rating,
    reviewerName: String(
      item?.reviewer_name ||
        item?.author_name ||
        item?.name ||
        item?.user?.name ||
        'Reviewer'
    ).trim(),
    reviewDate: formatDate(item?.created_at || item?.date || item?.updated_at),
    text: String(item?.comment || item?.review || item?.text || '').trim() || 'No review text.',
    replies,
  };
};

const toRows = (list, size = 2) => {
  const rows = [];
  for (let index = 0; index < list.length; index += size) {
    rows.push(list.slice(index, index + size));
  }
  return rows;
};

const isReviewRole = (role) => role === ROLES.MECH || role === ROLES.SPARE_PARTS_SELLER;

const UserReviewsScreen = ({ navigation }) => {
  const { user, role } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replying, setReplying] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!isReviewRole(role)) {
      setReviews([]);
      setError('Reviews are only available for mechanics and spare-parts sellers.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setReplyError('');

    try {
      if (role === ROLES.MECH) {
        const mechanicId = String(user?.id || user?._id || user?.mechanic_id || '').trim();
        if (!mechanicId) {
          setReviews([]);
          setError('Mechanic ID is missing.');
          return;
        }
        const response = await getMechanicReviews(mechanicId);
        setReviews(readList(response).map(normalizeReview).filter((item) => item.id));
        return;
      }

      const storeResponse = await getSellerStore();
      const storeId = readStoreId(readStore(storeResponse));
      if (!storeId) {
        setReviews([]);
        setError('Store profile is not ready yet.');
        return;
      }

      const response = await getStoreReviews(storeId);
      setReviews(readList(response).map(normalizeReview).filter((item) => item.id));
    } catch (requestError) {
      setReviews([]);
      setError(requestError?.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [role, user?.id, user?._id, user?.mechanic_id]);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const filteredReviews = useMemo(() => {
    if (activeFilter === 'all') {
      return reviews;
    }
    return reviews.filter((item) => String(item?.rating || '') === activeFilter);
  }, [activeFilter, reviews]);

  const reviewRows = useMemo(() => toRows(filteredReviews), [filteredReviews]);

  const selectedReview = useMemo(
    () => reviews.find((item) => item.id === selectedReviewId) || null,
    [reviews, selectedReviewId]
  );

  const handleSendReply = async () => {
    if (!selectedReview?.id) {
      setReplyError('Select a review to reply to.');
      return;
    }

    const body = String(replyDraft || '').trim();
    if (!body) {
      setReplyError('Reply cannot be empty.');
      return;
    }

    setReplying(true);
    setReplyError('');

    try {
      if (role === ROLES.MECH) {
        await replyToMechanicReview(selectedReview.id, { body });
      } else {
        await replyToStoreReview(selectedReview.id, { body });
      }
      setReplyDraft('');
      await loadReviews();
    } catch (submitError) {
      setReplyError(submitError?.message || 'Could not send reply.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Reviews</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersWrap}>
          {STAR_FILTERS.map((tab) => {
            const isActive = tab.key === activeFilter;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                activeOpacity={0.85}
                onPress={() => setActiveFilter(tab.key)}
              >
                {tab.key !== 'all' ? (
                  <HugeiconsIcon
                    icon={StarIcon}
                    size={12}
                    color={isActive ? darkTheme.colors.background : darkTheme.colors.accent}
                    strokeWidth={2}
                  />
                ) : null}
                <AppText style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}>
                  {tab.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : null}

        {!loading && !error ? (
          <>
            <AppText style={styles.summaryText}>
              {filteredReviews.length} review{filteredReviews.length === 1 ? '' : 's'} in this filter
            </AppText>

            {reviewRows.length ? (
              <View style={styles.gridWrap}>
                {reviewRows.map((row, rowIndex) => (
                  <View key={`review-row-${rowIndex}`} style={styles.gridRow}>
                    {row.map((review) => {
                      const selected = selectedReviewId === review.id;
                      return (
                        <TouchableOpacity
                          key={review.id}
                          style={[styles.reviewCard, selected ? styles.reviewCardSelected : null]}
                          activeOpacity={0.9}
                          onPress={() => {
                            setSelectedReviewId(review.id);
                            setReplyError('');
                          }}
                        >
                          <View style={styles.cardHead}>
                            <AppText style={styles.cardReviewer} numberOfLines={1}>
                              {review.reviewerName}
                            </AppText>
                            <AppText style={styles.cardDate}>{review.reviewDate}</AppText>
                          </View>

                          <View style={styles.ratingRow}>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <HugeiconsIcon
                                key={`${review.id}-star-${index}`}
                                icon={StarIcon}
                                size={12}
                                color={index < review.rating ? '#F7C948' : 'rgba(255,255,255,0.2)'}
                                strokeWidth={2}
                              />
                            ))}
                          </View>

                          <AppText style={styles.cardText} numberOfLines={4}>
                            {review.text}
                          </AppText>

                          <AppText style={styles.replyMeta}>
                            {review.replies.length} repl{review.replies.length === 1 ? 'y' : 'ies'}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                    {row.length === 1 ? <View style={styles.reviewCardSpacer} /> : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.stateCard}>
                <AppText style={styles.emptyText}>No reviews found for this filter.</AppText>
              </View>
            )}
          </>
        ) : null}

        <View style={styles.replyPanel}>
          <AppText style={styles.replyPanelTitle}>Respond</AppText>

          {!selectedReview ? (
            <AppText style={styles.replyPanelHint}>Select a review to reply to.</AppText>
          ) : (
            <>
              <AppText style={styles.selectedMeta} numberOfLines={1}>
                Replying to {selectedReview.reviewerName} ({selectedReview.rating} stars)
              </AppText>

              {selectedReview.replies.length ? (
                <View style={styles.replyThread}>
                  {selectedReview.replies.map((reply, index) => (
                    <View key={`${selectedReview.id}-reply-${index}`} style={styles.replyBubble}>
                      <AppText style={styles.replyAuthor} numberOfLines={1}>
                        {String(reply?.author_name || reply?.author_role || 'User')}
                      </AppText>
                      <AppText style={styles.replyBody}>
                        {String(reply?.body || '').trim()}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}

              <LiftableTextInput
                value={replyDraft}
                onChangeText={(value) => {
                  setReplyDraft(value);
                  setReplyError('');
                }}
                placeholder="Write your response..."
                placeholderTextColor="rgba(255,255,255,0.38)"
                style={styles.replyInput}
                multiline
              />

              {replyError ? <AppText style={styles.replyError}>{replyError}</AppText> : null}

              <AppButton
                label={replying ? 'Sending...' : 'Send reply'}
                onPress={handleSendReply}
                disabled={replying}
                style={styles.replyButton}
              />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080B2A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: darkTheme.spacing.xl,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTitle: {
    marginLeft: 12,
    color: darkTheme.colors.text,
    fontSize: 19,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 26,
  },
  filtersWrap: {
    paddingVertical: 10,
    columnGap: 8,
    paddingRight: 12,
  },
  filterChip: {
    minHeight: 34,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.45),
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  filterChipActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  filterChipText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  filterChipTextActive: {
    color: darkTheme.colors.background,
  },
  summaryText: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.7)',
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  stateCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#FF9A9A',
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.65)',
  },
  gridWrap: {
    marginTop: 12,
    rowGap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  reviewCard: {
    flex: 1,
    minHeight: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
  },
  reviewCardSelected: {
    borderColor: withAlpha(darkTheme.colors.accent, 0.95),
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.1),
  },
  reviewCardSpacer: {
    flex: 1,
  },
  cardHead: {
    marginBottom: 8,
  },
  cardReviewer: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  cardDate: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    columnGap: 2,
    marginBottom: 8,
  },
  cardText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 19,
  },
  replyMeta: {
    marginTop: 8,
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  replyPanel: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.4),
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.08),
    padding: 12,
  },
  replyPanelTitle: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  replyPanelHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.65)',
  },
  selectedMeta: {
    marginTop: 8,
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  replyThread: {
    marginTop: 10,
    rowGap: 8,
  },
  replyBubble: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 8,
  },
  replyAuthor: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginBottom: 2,
  },
  replyBody: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  replyInput: {
    marginTop: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    borderColor: withAlpha(darkTheme.colors.accent, 0.42),
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  replyError: {
    color: '#FF9A9A',
    marginTop: 6,
    fontSize: 12,
  },
  replyButton: {
    marginTop: 10,
    minHeight: 44,
  },
});

export default UserReviewsScreen;
