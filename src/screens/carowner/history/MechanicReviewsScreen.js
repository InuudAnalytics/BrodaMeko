import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StarIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { getCarOwnerJob, getMechanicJobStats } from '../../../services/jobs.service';
import { getMechanicReviews, getReviewReplies, replyToMechanicReview } from '../../../services/mechanic-reviews.service';
import { darkTheme } from '../../../theme';
import { ROLES } from '../../../utils';

const FALLBACK_AVATAR = 'https://i.pravatar.cc/160?img=47';
const FALLBACK_NAME = 'Toluwalase Daniel';
const FALLBACK_RATING = 3.8;
const FALLBACK_TOTAL_JOBS = 12;
const FALLBACK_REVIEW = {
  author: 'Cody Fischer',
  date: '12-02-2021',
  text:
    "Chidi is a very good mechanic, he came to fix my car yesterday at the 3rd mainland bridge and he was very quick at his work, he's really who he think he is. His rate for fixing my car was a very considerable amount too.",
};

const readPayload = (response) => {
  const root = response?.data || response || {};
  if (root?.job && typeof root.job === 'object') {
    return root.job;
  }
  if (root?.data && typeof root.data === 'object') {
    return root.data;
  }
  return root;
};

const toNumber = (value, fallback = 0) => {
  const safe = Number(value);
  return Number.isFinite(safe) ? safe : fallback;
};

const formatDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return FALLBACK_REVIEW.date;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const readReviews = (job) => {
  const list =
    job?.mechanic?.reviews ||
    job?.provider?.reviews ||
    job?.reviews ||
    job?.feedback ||
    [];
  return Array.isArray(list) ? list : [];
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
    job?.provider?._id ||
    job?.provider?.mechanic_id ||
    job?.assigned_mechanic?.id ||
    job?.assigned_mechanic?._id ||
    job?.assigned_mechanic?.mechanic_id ||
    ''
  ).trim();

const normalizeReview = (item, fallbackAvatar) => {
  return {
    id: String(item?.id || item?._id || '').trim(),
    rating: toNumber(item?.rating || item?.stars, 0),
    author:
      String(item?.author_name || item?.name || item?.user?.name || FALLBACK_REVIEW.author).trim() ||
      FALLBACK_REVIEW.author,
    date: formatDate(item?.created_at || item?.date),
    text:
      String(item?.comment || item?.review || item?.text || FALLBACK_REVIEW.text).trim() ||
      FALLBACK_REVIEW.text,
    avatar:
      String(item?.author_avatar || item?.user?.avatar || fallbackAvatar || FALLBACK_AVATAR).trim() ||
      FALLBACK_AVATAR,
    repliesCount: toNumber(item?.replies_count || item?.repliesCount || item?.reply_count || 0),
  };
};

const MechanicReviewsScreen = ({ route }) => {
  const { role } = useAuth();
  const jobId = String(route?.params?.jobId || '').trim();
  const preview = route?.params?.preview || {};
  const [job, setJob] = useState(null);
  const [reviewsPayload, setReviewsPayload] = useState([]);
  const [statsPayload, setStatsPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [replyError, setReplyError] = useState({});

  const loadDetails = useCallback(async () => {
    if (!jobId) {
      setError('Job ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getCarOwnerJob(jobId);
      const parsedJob = readPayload(response);
      setJob(parsedJob);

      const mechanicId = toMechanicId(parsedJob, route);
      if (mechanicId) {
        const [reviewsResponse, statsResponse] = await Promise.all([
          getMechanicReviews(mechanicId).catch(() => null),
          getMechanicJobStats(mechanicId).catch(() => null),
        ]);
        const reviewsRoot = reviewsResponse?.data || reviewsResponse || {};
        const nextReviews = Array.isArray(reviewsRoot)
          ? reviewsRoot
          : (Array.isArray(reviewsRoot?.reviews) ? reviewsRoot.reviews : (Array.isArray(reviewsRoot?.data) ? reviewsRoot.data : []));
        setReviewsPayload(nextReviews);
        setStatsPayload(statsResponse?.data || statsResponse || null);
      } else {
        setReviewsPayload([]);
        setStatsPayload(null);
      }
    } catch (requestError) {
      setError(requestError?.message || 'Could not load mechanic reviews.');
      setJob(null);
      setReviewsPayload([]);
      setStatsPayload(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, route]);

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails])
  );

  const viewModel = useMemo(() => {
    const name =
      String(
        job?.mechanic?.name ||
          job?.provider?.name ||
          job?.assigned_mechanic?.name ||
          preview?.mechanicName ||
          FALLBACK_NAME
      ).trim() || FALLBACK_NAME;

    const avatar =
      String(
        job?.mechanic?.avatar ||
          job?.mechanic?.photo ||
          job?.provider?.avatar ||
          job?.assigned_mechanic?.avatar ||
          preview?.avatarUrl ||
          FALLBACK_AVATAR
      ).trim() || FALLBACK_AVATAR;

    const rating = toNumber(
      job?.mechanic?.rating ||
        job?.provider?.rating ||
        job?.rating ||
        preview?.rating,
      FALLBACK_RATING
    );

    const totalJobs = toNumber(
      statsPayload?.total_completed_jobs ||
        statsPayload?.completed_jobs ||
        job?.mechanic?.total_jobs ||
        job?.provider?.total_jobs ||
        job?.mechanic?.jobs_count ||
        job?.provider?.jobs_count,
      FALLBACK_TOTAL_JOBS
    );

    const rawReviews = reviewsPayload.length ? reviewsPayload : readReviews(job);
    const reviews = rawReviews.length
      ? rawReviews.map((item) => normalizeReview(item, avatar))
      : [normalizeReview({}, avatar), normalizeReview({}, avatar), normalizeReview({}, avatar)];

    return {
      name,
      avatar,
      rating,
      totalJobs,
      reviews,
    };
  }, [job, preview, reviewsPayload, statsPayload]);

  const handleToggleReplies = async (reviewId) => {
    if (!reviewId) {
      return;
    }

    setExpandedReplies((prev) => ({
      ...prev,
      [reviewId]: prev[reviewId] ? null : { loading: true, list: [] },
    }));

    try {
      const response = await getReviewReplies(reviewId);
      const payload = response?.data || response || {};
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.replies)
          ? payload.replies
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      setExpandedReplies((prev) => ({
        ...prev,
        [reviewId]: { loading: false, list },
      }));
    } catch (loadError) {
      setExpandedReplies((prev) => ({
        ...prev,
        [reviewId]: { loading: false, list: [] },
      }));
      setReplyError((prev) => ({
        ...prev,
        [reviewId]: loadError?.message || 'Could not load replies.',
      }));
    }
  };

  const handleSubmitReply = async (reviewId) => {
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
    } catch (submitError) {
      setReplyError((prev) => ({
        ...prev,
        [reviewId]: submitError?.message || 'Could not submit reply.',
      }));
    } finally {
      setReplyLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="small" color="#D2ED24" />
          </View>
        ) : null}

        {!loading ? (
          <View>
            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

            <View style={styles.avatarWrap}>
              <Image source={{ uri: viewModel.avatar }} style={styles.avatar} />
            </View>
            <AppText style={styles.name}>{viewModel.name}</AppText>

            <View style={styles.statsRow}>
              <AppText style={styles.statsText}>Total jobs {viewModel.totalJobs}</AppText>
              <View style={styles.ratingsStat}>
                <AppText style={styles.statsText}>Ratings</AppText>
                <HugeiconsIcon icon={StarIcon} size={14} color="#FFB800" strokeWidth={2} />
                <AppText style={styles.statsText}>{viewModel.rating.toFixed(1)}</AppText>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>Ratings and reviews</AppText>
            </View>

            <View style={styles.reviewsWrap}>
              {viewModel.reviews.map((review, index) => {
                const repliesState = expandedReplies[review.id];
                const replies = repliesState?.list || [];
                const isExpanded = Boolean(repliesState);
                return (
                <View key={`${review.author}-${review.date}-${index}`} style={styles.reviewItem}>
                  <View style={styles.reviewHead}>
                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                    <View style={styles.reviewHeadText}>
                      <AppText style={styles.reviewAuthor}>{review.author}</AppText>
                      <AppText style={styles.reviewDate}>{review.date}</AppText>
                    </View>
                  </View>
                  <AppText style={styles.reviewText}>{review.text}</AppText>
                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      style={styles.replyToggle}
                      onPress={() => handleToggleReplies(review.id)}
                      activeOpacity={0.85}
                    >
                      <AppText style={styles.replyToggleText}>
                        {isExpanded ? 'Hide replies' : `View replies (${review.repliesCount || replies.length || 0})`}
                      </AppText>
                    </TouchableOpacity>
                  </View>

                  {isExpanded ? (
                    <View style={styles.repliesWrap}>
                      {repliesState?.loading ? (
                        <ActivityIndicator size="small" color="#D2ED24" />
                      ) : replies.length ? (
                        replies.map((reply, replyIndex) => (
                          <View key={`${review.id}-${replyIndex}`} style={styles.replyItem}>
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

                  {role === ROLES.MECH ? (
                    <View style={styles.replyBox}>
                      <LiftableTextInput
                        value={replyDrafts[review.id] || ''}
                        onChangeText={(value) =>
                          setReplyDrafts((prev) => ({ ...prev, [review.id]: value }))
                        }
                        placeholder="Write a reply..."
                        placeholderTextColor="rgba(255,255,255,0.36)"
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
              )})}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#010037',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 56,
    paddingBottom: 28,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    color: '#FF8B8B',
    textAlign: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  avatar: {
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 4,
    borderColor: '#F7A23D',
  },
  name: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  statsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 28,
  },
  statsText: {
    color: '#C5C8E2',
    fontSize: 16,
    lineHeight: 20,
  },
  ratingsStat: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  sectionHeader: {
    marginTop: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#C5C8E2',
    fontSize: 14,
    lineHeight: 18,
  },
  reviewsWrap: {
    marginTop: 12,
    rowGap: 22,
  },
  reviewItem: {
    rowGap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 10,
  },
  reviewHeadText: {
    flex: 1,
  },
  reviewAuthor: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  reviewDate: {
    marginTop: 1,
    color: '#9EA4C8',
    fontSize: 14,
    lineHeight: 18,
  },
  reviewText: {
    color: '#C6CAE8',
    fontSize: 15,
    lineHeight: 20,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyToggle: {
    paddingVertical: 4,
  },
  replyToggleText: {
    color: '#E6C714',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  repliesWrap: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
    rowGap: 8,
  },
  replyItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 6,
  },
  replyAuthor: {
    color: '#F5F5F5',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  replyText: {
    color: 'rgba(245,245,245,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  replyEmpty: {
    color: 'rgba(245,245,245,0.6)',
    fontSize: 12,
  },
  replyBox: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
  },
  replyInput: {
    minHeight: 60,
    color: '#FFFFFF',
  },
  replyButton: {
    marginTop: 8,
  },
  replyError: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 6,
  },
});

export default MechanicReviewsScreen;
