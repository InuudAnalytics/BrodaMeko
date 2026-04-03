import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, StarIcon } from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppText,
  LiftableTextInput,
  PullToRefreshIndicator,
  ScreenContainer,
} from '../../../components';
import { useAuth } from '../../../context';
import { getCarOwnerJob, getMechanicJobStats } from '../../../services/jobs.service';
import {
  getMechanicReviews,
  getReviewReplies,
  replyToMechanicReview,
} from '../../../services/mechanic-reviews.service';
import { darkTheme } from '../../../theme';
import { ROLES } from '../../../utils';

// ─── helpers ────────────────────────────────────────────────────────────────

const FALLBACK_NAME = 'Assigned mechanic';
const INITIAL_SHOW = 3;

const toNumber = (value, fallback = 0) => {
  const safe = Number(value);
  return Number.isFinite(safe) ? safe : fallback;
};

const toInitial = (value, fallback = 'U') =>
  String(value || '').trim().charAt(0).toUpperCase() || fallback;

const formatDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '--';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const readPayload = (response) => {
  const root = response?.data || response || {};
  if (root?.job && typeof root.job === 'object') return root.job;
  if (root?.data && typeof root.data === 'object') return root.data;
  return root;
};

const toMechanicId = (job, route) =>
  String(
    route?.params?.mechanicId ||
    route?.params?.mechanic_id ||
    route?.params?.mechanic?.id ||
    route?.params?.mechanic?.mechanic_id ||
    job?.mechanic?.id ||
    job?.mechanic?._id ||
    job?.mechanic?.mechanic_id ||
    job?.provider?.id ||
    job?.assigned_mechanic?.id ||
    '',
  ).trim();

const toBreakdown = (summary) => {
  const b = summary?.breakdown || {};
  return {
    5: toNumber(b['5_star'] || b[5], 0),
    4: toNumber(b['4_star'] || b[4], 0),
    3: toNumber(b['3_star'] || b[3], 0),
    2: toNumber(b['2_star'] || b[2], 0),
    1: toNumber(b['1_star'] || b[1], 0),
  };
};

const toDistribution = ({ reviews, summary, reviewCount }) => {
  const total = toNumber(reviewCount, 0);
  if (total > 0 && summary?.breakdown) {
    const b = toBreakdown(summary);
    return [5, 4, 3, 2, 1].map((s) => Math.round((toNumber(b[s], 0) / total) * 100));
  }
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const s = Math.round(toNumber(r?.rating || r?.stars, 0));
    if (s >= 1 && s <= 5) counts[5 - s] += 1;
  });
  const sum = counts.reduce((a, b) => a + b, 0);
  return sum ? counts.map((c) => Math.round((c / sum) * 100)) : [0, 0, 0, 0, 0];
};

const normalizeReview = (item) => ({
  id: String(item?.id || item?._id || '').trim(),
  rating: toNumber(item?.rating || item?.stars, 0),
  author: String(item?.author_name || item?.reviewer_name || item?.name || item?.user?.name || 'Reviewer').trim() || 'Reviewer',
  date: formatDate(item?.created_at || item?.date),
  text: String(item?.comment || item?.review || item?.text || '').trim() || 'No written review.',
  avatar: String(item?.author_avatar || item?.reviewer_avatar || item?.user?.avatar || '').trim(),
  repliesCount: toNumber(item?.replies_count || item?.repliesCount || item?.reply_count, 0),
});

// ─── skeleton ────────────────────────────────────────────────────────────────

const usePulse = () => {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return opacity;
};

const SKL_COLOR = 'rgba(255,255,255,0.18)';

// Both primitives accept the pulse opacity from the parent so all blocks share one loop
const SklRect = ({ opacity, width, height, radius = 6, style }) => (
  <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: SKL_COLOR, opacity }, style]} />
);
const SklCircle = ({ opacity, size }) => (
  <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: SKL_COLOR, opacity }} />
);

const MechanicDetailsSkeleton = () => {
  const opacity = usePulse();
  return (
    <View style={sklStyles.wrap}>
      {/* avatar */}
      <View style={sklStyles.avatarRow}>
        <SklCircle opacity={opacity} size={90} />
      </View>

      {/* name */}
      <View style={sklStyles.nameRow}>
        <SklRect opacity={opacity} width={170} height={16} radius={8} />
      </View>

      {/* stats */}
      <View style={sklStyles.statsRow}>
        <SklRect opacity={opacity} width={90} height={13} radius={6} />
        <SklRect opacity={opacity} width={70} height={13} radius={6} />
      </View>

      {/* stars row */}
      <View style={sklStyles.starsRow}>
        {[0,1,2,3,4].map((i) => (
          <SklCircle key={i} opacity={opacity} size={22} />
        ))}
      </View>

      {/* bars */}
      <View style={sklStyles.barsWrap}>
        {[80, 55, 30, 15, 8].map((w, i) => (
          <View key={i} style={sklStyles.barRow}>
            <SklCircle opacity={opacity} size={22} />
            <SklCircle opacity={opacity} size={12} />
            <SklRect opacity={opacity} width={`${w}%`} height={10} radius={5} style={{ flex: 1 }} />
          </View>
        ))}
      </View>

      {/* section divider */}
      <View style={sklStyles.divider} />
      <SklRect opacity={opacity} width={160} height={12} radius={6} />

      {/* review cards */}
      {[0, 1, 2].map((i) => (
        <View key={i} style={sklStyles.reviewCard}>
          <View style={sklStyles.reviewHead}>
            <SklCircle opacity={opacity} size={42} />
            <View style={sklStyles.reviewHeadLines}>
              <SklRect opacity={opacity} width={110} height={13} radius={6} />
              <SklRect opacity={opacity} width={70} height={10} radius={5} style={{ marginTop: 6 }} />
            </View>
          </View>
          <SklRect opacity={opacity} width="100%" height={11} radius={5} style={{ marginTop: 10 }} />
          <SklRect opacity={opacity} width="72%" height={11} radius={5} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
};

const sklStyles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  avatarRow: { alignItems: 'center', marginBottom: 12 },
  nameRow: { alignItems: 'center', marginBottom: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', columnGap: 28, marginBottom: 18 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', columnGap: 6, marginBottom: 10 },
  barsWrap: { rowGap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', columnGap: 6 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 20 },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 14, marginTop: 12,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  reviewHeadLines: { flex: 1 },
});

// ─── sub-components ──────────────────────────────────────────────────────────

const RatingBar = ({ level, width }) => (
  <View style={styles.barRow}>
    <View style={styles.levelBadge}>
      <AppText style={styles.levelText}>{level}</AppText>
    </View>
    <HugeiconsIcon icon={StarIcon} size={12} color="#FFB800" strokeWidth={2} />
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(width, 100))}%` }]} />
    </View>
  </View>
);

// ─── screen ──────────────────────────────────────────────────────────────────

const MechanicDetailsScreen = ({ navigation, route }) => {
  const { role } = useAuth();
  const jobId = String(route?.params?.jobId || '').trim();
  const preview = useMemo(() => route?.params?.preview || {}, [route?.params?.preview]);

  const [job, setJob] = useState(null);
  const [reviewsPayload, setReviewsPayload] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState(null);
  const [statsPayload, setStatsPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  // replies per review
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [replyError, setReplyError] = useState({});

  const pullDistance = useRef(new Animated.Value(0)).current;

  const loadDetails = useCallback(async () => {
    if (!jobId) { setError('Job ID is missing.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const response = await getCarOwnerJob(jobId);
      const parsedJob = readPayload(response);
      setJob(parsedJob);

      const mechanicId = toMechanicId(parsedJob, route);
      if (mechanicId) {
        const [reviewsRes, statsRes] = await Promise.all([
          getMechanicReviews(mechanicId).catch(() => null),
          getMechanicJobStats(mechanicId).catch(() => null),
        ]);
        const reviewsRoot = reviewsRes || {};
        const nextReviews = Array.isArray(reviewsRoot)
          ? reviewsRoot
          : Array.isArray(reviewsRoot?.reviews)
          ? reviewsRoot.reviews
          : Array.isArray(reviewsRoot?.data)
          ? reviewsRoot.data
          : [];
        setReviewsPayload(nextReviews);
        setReviewsSummary(reviewsRoot?.summary || null);
        setStatsPayload(statsRes?.data || statsRes || null);
      } else {
        setReviewsPayload([]);
        setReviewsSummary(null);
        setStatsPayload(null);
      }
    } catch (e) {
      setError(e?.message || 'Could not load mechanic details.');
      setJob(null);
      setReviewsPayload([]);
      setReviewsSummary(null);
      setStatsPayload(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, route]);

  useFocusEffect(useCallback(() => { loadDetails(); }, [loadDetails]));

  // ── view model ──────────────────────────────────────────────────────────────

  const viewModel = useMemo(() => {
    const reviews = (reviewsPayload.length ? reviewsPayload : (job?.mechanic?.reviews || [])).map(normalizeReview);
    const summaryRating = toNumber(reviewsSummary?.avg_rating, 0);
    const summaryCount = toNumber(reviewsSummary?.total_reviews, 0);

    const name = String(
      job?.mechanic?.full_name || job?.mechanic?.name ||
      job?.provider?.name || job?.assigned_mechanic?.name ||
      preview?.mechanicName || FALLBACK_NAME
    ).trim() || FALLBACK_NAME;

    const avatar = (() => {
      const raw = job?.mechanic?.avatar || job?.provider?.avatar ||
        job?.assigned_mechanic?.avatar || preview?.avatarUrl;
      if (!raw) return '';
      if (typeof raw === 'object') return raw?.url || raw?.uri || '';
      return String(raw).trim();
    })();

    const rating = toNumber(
      summaryRating || job?.mechanic?.rating || job?.provider?.rating || preview?.rating,
      0,
    );
    const totalJobs = toNumber(
      statsPayload?.total_completed_jobs || statsPayload?.completed_jobs ||
      job?.mechanic?.total_jobs || job?.mechanic?.jobs_count,
      0,
    );
    const reviewCount = toNumber(summaryCount || reviews.length, 0);

    return {
      name, avatar, rating, totalJobs, reviewCount,
      distribution: toDistribution({ reviews, summary: reviewsSummary, reviewCount }),
      reviews,
    };
  }, [job, preview, reviewsPayload, reviewsSummary, statsPayload]);

  // ── reply handlers ──────────────────────────────────────────────────────────

  const handleToggleReplies = useCallback(async (reviewId) => {
    if (!reviewId) return;
    setExpandedReplies((prev) => ({
      ...prev,
      [reviewId]: prev[reviewId] ? null : { loading: true, list: [] },
    }));
    try {
      const res = await getReviewReplies(reviewId);
      const payload = res?.data || res || {};
      const list = Array.isArray(payload) ? payload
        : Array.isArray(payload?.replies) ? payload.replies
        : Array.isArray(payload?.data) ? payload.data : [];
      setExpandedReplies((prev) => ({ ...prev, [reviewId]: { loading: false, list } }));
    } catch (e) {
      setExpandedReplies((prev) => ({ ...prev, [reviewId]: { loading: false, list: [] } }));
      setReplyError((prev) => ({ ...prev, [reviewId]: e?.message || 'Could not load replies.' }));
    }
  }, []);

  const handleSubmitReply = useCallback(async (reviewId) => {
    const draft = String(replyDrafts[reviewId] || '').trim();
    if (!reviewId || !draft) {
      setReplyError((prev) => ({ ...prev, [reviewId]: 'Reply cannot be empty.' }));
      return;
    }
    setReplyLoading((prev) => ({ ...prev, [reviewId]: true }));
    setReplyError((prev) => ({ ...prev, [reviewId]: '' }));
    try {
      await replyToMechanicReview(reviewId, { body: draft });
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
      await handleToggleReplies(reviewId);
    } catch (e) {
      setReplyError((prev) => ({ ...prev, [reviewId]: e?.message || 'Could not submit reply.' }));
    } finally {
      setReplyLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  }, [replyDrafts, handleToggleReplies]);

  // ── render ──────────────────────────────────────────────────────────────────

  const filledStars = Math.round(viewModel.rating);
  const visibleReviews = showAll ? viewModel.reviews : viewModel.reviews.slice(0, INITIAL_SHOW);
  const hiddenCount = viewModel.reviews.length - INITIAL_SHOW;

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.listWrap}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loading} />
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            pullDistance.setValue(y < 0 ? Math.min(-y, 140) : 0);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadDetails}
              tintColor="transparent"
              colors={['transparent']}
            />
          }
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>

          {loading ? <MechanicDetailsSkeleton /> : null}

          {!loading ? (
            <View>
              {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

              {/* ── profile ── */}
              <View style={styles.avatarWrap}>
                {viewModel.avatar ? (
                  <Image source={{ uri: viewModel.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <AppText style={styles.avatarInitialText}>
                      {toInitial(viewModel.name, 'M')}
                    </AppText>
                  </View>
                )}
              </View>
              <AppText style={styles.name}>{viewModel.name}</AppText>

              <View style={styles.statsRow}>
                <AppText style={styles.statsText}>Total jobs {viewModel.totalJobs}</AppText>
                <View style={styles.ratingsStat}>
                  <AppText style={styles.statsText}>Rating</AppText>
                  <HugeiconsIcon icon={StarIcon} size={14} color="#FFB800" strokeWidth={2} />
                  <AppText style={styles.statsText}>{viewModel.rating.toFixed(1)}</AppText>
                </View>
              </View>

              {/* ── aggregate stars + bars ── */}
              <View style={styles.aggregateWrap}>
                <View style={styles.bigStarsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <HugeiconsIcon
                      key={s}
                      icon={StarIcon}
                      size={22}
                      color={s <= filledStars ? '#FFB800' : 'rgba(255,255,255,0.22)'}
                      strokeWidth={2}
                    />
                  ))}
                </View>
                <View style={styles.barsWrap}>
                  {[5, 4, 3, 2, 1].map((level, i) => (
                    <RatingBar key={level} level={level} width={viewModel.distribution[i]} />
                  ))}
                </View>
              </View>

              {/* ── reviews ── */}
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>
                  Ratings and reviews
                  {viewModel.reviewCount > 0 ? ` (${viewModel.reviewCount})` : ''}
                </AppText>
              </View>

              <View style={styles.reviewsWrap}>
                {!viewModel.reviews.length ? (
                  <View style={styles.emptyWrap}>
                    <AppText style={styles.emptyText}>No reviews yet.</AppText>
                  </View>
                ) : null}

                {visibleReviews.map((review, index) => {
                  const repliesState = expandedReplies[review.id];
                  const replies = repliesState?.list || [];
                  const isExpanded = Boolean(repliesState);

                  return (
                    <View key={`${review.id || index}`} style={styles.reviewCard}>
                      <View style={styles.reviewHead}>
                        {review.avatar ? (
                          <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                        ) : (
                          <View style={styles.reviewAvatarFallback}>
                            <AppText style={styles.reviewAvatarInitial}>
                              {toInitial(review.author, 'R')}
                            </AppText>
                          </View>
                        )}
                        <View style={styles.reviewHeadText}>
                          <AppText style={styles.reviewAuthor}>{review.author}</AppText>
                          <AppText style={styles.reviewDate}>{review.date}</AppText>
                        </View>
                        {review.rating > 0 ? (
                          <View style={styles.reviewRatingBadge}>
                            <HugeiconsIcon icon={StarIcon} size={11} color="#FFB800" strokeWidth={2} />
                            <AppText style={styles.reviewRatingText}>{review.rating.toFixed(1)}</AppText>
                          </View>
                        ) : null}
                      </View>

                      <AppText style={styles.reviewText}>{review.text}</AppText>

                      {review.id ? (
                        <TouchableOpacity
                          style={styles.replyToggle}
                          onPress={() => handleToggleReplies(review.id)}
                          activeOpacity={0.85}
                        >
                          <AppText style={styles.replyToggleText}>
                            {isExpanded
                              ? 'Hide replies'
                              : `View replies (${review.repliesCount || replies.length || 0})`}
                          </AppText>
                        </TouchableOpacity>
                      ) : null}

                      {isExpanded ? (
                        <View style={styles.repliesWrap}>
                          {repliesState?.loading ? (
                            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
                          ) : replies.length ? (
                            replies.map((reply, ri) => (
                              <View key={`${review.id}-${ri}`} style={styles.replyItem}>
                                <AppText style={styles.replyAuthor}>
                                  {String(reply?.author_name || reply?.user?.name || 'User')}
                                </AppText>
                                <AppText style={styles.replyText}>
                                  {String(reply?.body || reply?.comment || '').trim()}
                                </AppText>
                              </View>
                            ))
                          ) : (
                            <AppText style={styles.replyEmpty}>No replies yet.</AppText>
                          )}
                        </View>
                      ) : null}

                      {role === ROLES.MECH && review.id ? (
                        <View style={styles.replyBox}>
                          <LiftableTextInput
                            value={replyDrafts[review.id] || ''}
                            onChangeText={(v) =>
                              setReplyDrafts((prev) => ({ ...prev, [review.id]: v }))
                            }
                            placeholder="Write a reply..."
                            placeholderTextColor="rgba(255,255,255,0.36)"
                            multiline
                            textAlignVertical="top"
                            style={styles.replyInput}
                          />
                          {replyError[review.id] ? (
                            <AppText style={styles.replyError}>{replyError[review.id]}</AppText>
                          ) : null}
                          <AppButton
                            label={replyLoading[review.id] ? 'Replying...' : 'Reply'}
                            onPress={() => handleSubmitReply(review.id)}
                            disabled={replyLoading[review.id]}
                            style={styles.replyButton}
                          />
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                {!showAll && hiddenCount > 0 ? (
                  <TouchableOpacity
                    style={styles.showMoreBtn}
                    onPress={() => setShowAll(true)}
                    activeOpacity={0.85}
                  >
                    <AppText style={styles.showMoreText}>
                      Show {hiddenCount} more review{hiddenCount !== 1 ? 's' : ''}
                    </AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}
        </Animated.ScrollView>
      </View>
    </ScreenContainer>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#010037' },
  listWrap: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 32 },

  backButton: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },

  errorText: { color: '#FF8B8B', textAlign: 'center', marginBottom: 16 },

  // profile
  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#F7A23D',
  },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#F7A23D',
    backgroundColor: 'rgba(247,162,61,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitialText: {
    color: '#FFFFFF', fontSize: 30, lineHeight: 34,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  name: {
    marginTop: 10, color: '#FFFFFF',
    fontSize: 19, lineHeight: 24, textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  statsRow: {
    marginTop: 12, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', columnGap: 28,
  },
  statsText: { color: '#C5C8E2', fontSize: 14, lineHeight: 18 },
  ratingsStat: { flexDirection: 'row', alignItems: 'center', columnGap: 5 },

  // aggregate
  aggregateWrap: { marginTop: 20 },
  bigStarsRow: {
    flexDirection: 'row', alignItems: 'center', columnGap: 6,
    justifyContent: 'center',
  },
  barsWrap: { marginTop: 10, rowGap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', columnGap: 6 },
  levelBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#6F7596',
    alignItems: 'center', justifyContent: 'center',
  },
  levelText: { color: '#FFFFFF', fontSize: 12, lineHeight: 14 },
  barTrack: {
    flex: 1, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5, backgroundColor: darkTheme.colors.accent },

  // section header
  sectionHeader: {
    marginTop: 28,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  sectionTitle: { color: '#C5C8E2', fontSize: 14, lineHeight: 18 },

  // reviews list
  reviewsWrap: { marginTop: 14, rowGap: 12 },
  emptyWrap: { paddingVertical: 16 },
  emptyText: { color: '#9EA4C8', fontSize: 14, lineHeight: 20 },

  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    rowGap: 8,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center' },
  reviewAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  reviewAvatarFallback: {
    width: 42, height: 42, borderRadius: 21, marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewAvatarInitial: {
    color: '#FFFFFF', fontSize: 16, lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  reviewHeadText: { flex: 1 },
  reviewAuthor: {
    color: '#FFFFFF', fontSize: 15, lineHeight: 19,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  reviewDate: { marginTop: 1, color: '#9EA4C8', fontSize: 12, lineHeight: 16 },
  reviewRatingBadge: {
    flexDirection: 'row', alignItems: 'center', columnGap: 3,
    backgroundColor: 'rgba(255,184,0,0.14)',
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  reviewRatingText: { color: '#FFB800', fontSize: 11, lineHeight: 14 },
  reviewText: { color: '#C6CAE8', fontSize: 14, lineHeight: 20 },

  replyToggle: { alignSelf: 'flex-start', paddingVertical: 2 },
  replyToggleText: {
    color: darkTheme.colors.accent, fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },

  repliesWrap: {
    marginTop: 4, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, padding: 10, rowGap: 8,
  },
  replyItem: {
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', paddingBottom: 6,
  },
  replyAuthor: {
    color: '#F5F5F5', fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  replyText: { color: 'rgba(245,245,245,0.65)', fontSize: 12, marginTop: 2 },
  replyEmpty: { color: 'rgba(245,245,245,0.5)', fontSize: 12 },

  replyBox: {
    marginTop: 4, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, padding: 10,
  },
  replyInput: { minHeight: 52, color: '#FFFFFF', fontSize: 13, backgroundColor: 'transparent' },
  replyError: { color: '#F87171', fontSize: 11, marginTop: 4 },
  replyButton: { marginTop: 8 },

  showMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1, borderColor: `${darkTheme.colors.accent}66`,
  },
  showMoreText: {
    color: darkTheme.colors.accent, fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default MechanicDetailsScreen;
