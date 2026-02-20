import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StarIcon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { getCarOwnerJob } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';

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

const normalizeReview = (item, fallbackAvatar) => {
  return {
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
  };
};

const MechanicReviewsScreen = ({ route }) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const preview = route?.params?.preview || {};
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setJob(readPayload(response));
    } catch (requestError) {
      setError(requestError?.message || 'Could not load mechanic reviews.');
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

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
      job?.mechanic?.total_jobs ||
        job?.provider?.total_jobs ||
        job?.mechanic?.jobs_count ||
        job?.provider?.jobs_count,
      FALLBACK_TOTAL_JOBS
    );

    const rawReviews = readReviews(job);
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
  }, [job, preview]);

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
              {viewModel.reviews.map((review, index) => (
                <View key={`${review.author}-${review.date}-${index}`} style={styles.reviewItem}>
                  <View style={styles.reviewHead}>
                    <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                    <View style={styles.reviewHeadText}>
                      <AppText style={styles.reviewAuthor}>{review.author}</AppText>
                      <AppText style={styles.reviewDate}>{review.date}</AppText>
                    </View>
                  </View>
                  <AppText style={styles.reviewText}>{review.text}</AppText>
                </View>
              ))}
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
});

export default MechanicReviewsScreen;
