import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { AppText, PullToRefreshIndicator, ScreenContainer } from '../../../components';
import { getCarOwnerJob, getMechanicJobStats } from '../../../services/jobs.service';
import { getMechanicReviews } from '../../../services/mechanic-reviews.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const FALLBACK_AVATAR = 'https://i.pravatar.cc/160?img=47';
const FALLBACK_NAME = 'Toluwalase Daniel';
const FALLBACK_RATING = 3.8;
const FALLBACK_TOTAL_JOBS = 12;
const FALLBACK_REVIEW_COUNT = 130;
const FALLBACK_REVIEW = {
  author: 'Cody Fischer',
  date: '12-02-2021',
  text:
    "Chidi is a very good mechanic, he came to fix my car yesterday at the 3rd mainland bridge and he was very quick at his work, he's really who he think he is. His rate for fixing my car was a very considerable amount too.",
};
const FALLBACK_DISTRIBUTION = [72, 58, 48, 34, 22];

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

const toName = (job, fallbackFromRoute) => {
  return (
    String(
      job?.mechanic?.name ||
        job?.provider?.name ||
        job?.assigned_mechanic?.name ||
        fallbackFromRoute ||
        FALLBACK_NAME
    ).trim() || FALLBACK_NAME
  );
};

const toAvatar = (job, fallbackFromRoute) => {
  const avatar =
    job?.mechanic?.avatar ||
    job?.mechanic?.photo ||
    job?.provider?.avatar ||
    job?.assigned_mechanic?.avatar ||
    fallbackFromRoute ||
    FALLBACK_AVATAR;
  return String(avatar || '').trim() || FALLBACK_AVATAR;
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

const toReviews = (job) => {
  const items =
    job?.mechanic?.reviews ||
    job?.provider?.reviews ||
    job?.reviews ||
    job?.feedback ||
    [];
  return Array.isArray(items) ? items : [];
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

const toDistribution = (reviews) => {
  if (!reviews.length) {
    return FALLBACK_DISTRIBUTION;
  }

  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((review) => {
    const rating = Math.round(toNumber(review?.rating || review?.stars, 0));
    if (rating >= 1 && rating <= 5) {
      counts[5 - rating] += 1;
    }
  });

  const max = Math.max(...counts, 1);
  return counts.map((value) => Math.round((value / max) * 100));
};

const RatingRow = ({ level, width }) => {
  return (
    <View style={styles.barRow}>
      <View style={styles.levelBadge}>
        <AppText style={styles.levelText}>{level}</AppText>
      </View>
      <HugeiconsIcon icon={StarIcon} size={16} color="#FFB800" strokeWidth={2} />
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(0, Math.min(width, 100))}%` }]} />
      </View>
    </View>
  );
};

const MechanicDetailsScreen = ({ navigation, route }) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const preview = route?.params?.preview || {};
  const [job, setJob] = useState(null);
  const [reviewsPayload, setReviewsPayload] = useState([]);
  const [statsPayload, setStatsPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pullDistance = useRef(new Animated.Value(0)).current;

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
      setError(requestError?.message || 'Could not load mechanic details.');
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
    const reviews = reviewsPayload.length ? reviewsPayload : toReviews(job);
    const firstReview = reviews[0] || {};

    const name = toName(job, preview?.mechanicName);
    const avatar = toAvatar(job, preview?.avatarUrl);
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
    const reviewCount = toNumber(
      job?.mechanic?.review_count ||
        job?.provider?.review_count ||
        reviews.length,
      FALLBACK_REVIEW_COUNT
    );

    return {
      name,
      avatar,
      rating,
      totalJobs,
      reviewCount,
      distribution: toDistribution(reviews),
      review: {
        author:
          String(firstReview?.author_name || firstReview?.name || FALLBACK_REVIEW.author).trim() ||
          FALLBACK_REVIEW.author,
        date: formatDate(firstReview?.created_at || firstReview?.date),
        text:
          String(firstReview?.comment || firstReview?.review || firstReview?.text || FALLBACK_REVIEW.text).trim() ||
          FALLBACK_REVIEW.text,
      },
    };
  }, [job, preview, reviewsPayload, statsPayload]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.listWrap}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loading} />
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={event => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
            pullDistance.setValue(pullValue);
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>

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
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_REVIEWS, {
                    jobId,
                    mechanicId: toMechanicId(job, route),
                    preview: {
                      mechanicName: viewModel.name,
                      avatarUrl: viewModel.avatar,
                      rating: viewModel.rating,
                      totalJobs: viewModel.totalJobs,
                    },
                  })
                }
              >
                <AppText style={styles.seeMore}>See more</AppText>
              </TouchableOpacity>
            </View>

            <AppText style={styles.reviewCount}>{viewModel.reviewCount} reviews</AppText>

            <View style={styles.bigStarsRow}>
              {[1, 2, 3].map((item) => (
                <HugeiconsIcon key={item} icon={StarIcon} size={30} color="#FFB800" strokeWidth={2} />
              ))}
            </View>

            <View style={styles.barsWrap}>
              <RatingRow level="5" width={viewModel.distribution[0]} />
              <RatingRow level="4" width={viewModel.distribution[1]} />
              <RatingRow level="3" width={viewModel.distribution[2]} />
              <RatingRow level="2" width={viewModel.distribution[3]} />
              <RatingRow level="1" width={viewModel.distribution[4]} />
            </View>

            <View style={styles.reviewItem}>
              <Image source={{ uri: viewModel.avatar }} style={styles.reviewAvatar} />
              <View style={styles.reviewHeadText}>
                <AppText style={styles.reviewAuthor}>{viewModel.review.author}</AppText>
                <AppText style={styles.reviewDate}>{viewModel.review.date}</AppText>
              </View>
            </View>
            <AppText style={styles.reviewText}>{viewModel.review.text}</AppText>
          </View>
        ) : null}
        </Animated.ScrollView>
      </View>
    </ScreenContainer>
  );
};

// TODO: Replace this screen's mechanic profile fallbacks with data from a dedicated mechanic-details endpoint when backend exposes one.
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#010037',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 28,
  },
  listWrap: {
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
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
    fontSize: 40 / 2,
    lineHeight: 46 / 2,
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
  seeMore: {
    color: '#A0C21F',
    fontSize: 14,
    lineHeight: 18,
  },
  reviewCount: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 36 / 2,
    lineHeight: 42 / 2,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  bigStarsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  barsWrap: {
    marginTop: 14,
    rowGap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  levelBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6F7596',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 18,
  },
  barTrack: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E1E4E8',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#D2ED24',
  },
  reviewItem: {
    marginTop: 26,
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
    fontSize: 34 / 2,
    lineHeight: 40 / 2,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  reviewDate: {
    marginTop: 1,
    color: '#9EA4C8',
    fontSize: 14,
    lineHeight: 18,
  },
  reviewText: {
    marginTop: 10,
    color: '#C6CAE8',
    fontSize: 15,
    lineHeight: 20,
  },
});

export default MechanicDetailsScreen;
