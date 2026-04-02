import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { leaveMechanicReview } from '../../../services/mechanic-reviews.service';
import { darkTheme } from '../../../theme';
import AppAlert from '../../../components/AppAlert';
import { ROUTES } from '../../../utils';

const TAGS = ['Arrived on time', 'Professional', 'Friendly', 'Resolved issue quickly'];

const pad2 = (v) => String(v).padStart(2, '0');
const makeBmId = (date = new Date()) => `#BM-${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}`;

const toAvatarUri = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw?.url || raw?.uri || null;
  const str = String(raw).trim();
  return str || null;
};

// ─── star ────────────────────────────────────────────────────────────────────

const StarShape = ({ filled }) => (
  <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
      fill={filled ? '#E6C714' : 'transparent'}
      stroke={filled ? '#E6C714' : 'rgba(245,245,245,0.7)'}
      strokeWidth={1.25}
    />
  </Svg>
);

const AnimatedStar = ({ value, rating, onPress }) => {
  const filled = value <= rating;
  const fillOpacity = useRef(new Animated.Value(filled ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fillOpacity, {
      toValue: value <= rating ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [fillOpacity, rating, value]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.28, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress(value);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={10}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <StarShape filled={false} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fillOpacity }]}>
          <StarShape filled />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// ─── screen ──────────────────────────────────────────────────────────────────

const RateMechanicScreen = ({ navigation, route }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const mechanicName =
    route?.params?.mechanic?.name ||
    route?.params?.mechanicName ||
    'Mechanic';

  const issueName =
    route?.params?.issueName ||
    route?.params?.issue ||
    route?.params?.job?.issue ||
    route?.params?.job?.issue_name ||
    '';

  const displayId = route?.params?.displayId || makeBmId();

  const avatarUri = toAvatarUri(
    route?.params?.avatarUrl ||
    route?.params?.mechanic?.avatar ||
    route?.params?.mechanic?.photo
  );

  const mechanicId = String(
    route?.params?.mechanicId ||
    route?.params?.mechanic_id ||
    route?.params?.mechanic?.id ||
    route?.params?.mechanic?.mechanic_id ||
    ''
  ).trim();

  const initials = useMemo(() => {
    const parts = String(mechanicName || '').trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || 'M').toUpperCase();
  }, [mechanicName]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!rating) {
      AppAlert.alert('Select rating', 'Please choose a star rating before submitting.');
      return;
    }
    if (!mechanicId) {
      AppAlert.alert('Missing mechanic', 'Could not identify mechanic for this review.');
      return;
    }

    setSubmitting(true);
    try {
      const commentText = [feedback.trim(), ...selectedTags].filter(Boolean).join(' | ');
      await leaveMechanicReview(mechanicId, {
        rating,
        comment: commentText || 'No additional comment.',
      });
      AppAlert.alert('Rating submitted', 'Thanks for your feedback.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      AppAlert.alert('Submit failed', e?.message || 'Could not submit review right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>

        {/* profile card — tap to view mechanic profile */}
        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={mechanicId ? 0.75 : 1}
          onPress={() => {
            if (!mechanicId) return;
            navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DETAILS, {
              jobId: route?.params?.jobId || '',
              mechanicId,
              preview: { mechanicName, avatarUrl: avatarUri },
            });
          }}
        >
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <AppText style={styles.avatarText}>{initials}</AppText>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <AppText style={styles.profileName}>{mechanicName}</AppText>
            {issueName ? (
              <AppText style={styles.profileIssue}>{issueName}</AppText>
            ) : null}
            <AppText style={styles.profileId}>ID: {displayId}</AppText>
          </View>
          {mechanicId ? (
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(245,245,245,0.35)" strokeWidth={2} />
          ) : null}
        </TouchableOpacity>

        {/* star rating */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Service rating</AppText>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((v) => (
              <AnimatedStar key={v} value={v} rating={rating} onPress={setRating} />
            ))}
          </View>
        </View>

        {/* quick tags */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>What stood out?</AppText>
          <View style={styles.tagsWrap}>
            {TAGS.map((tag) => {
              const selected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.9}
                  style={[styles.tag, selected && styles.tagSelected]}
                  onPress={() => toggleTag(tag)}
                >
                  <AppText style={[styles.tagText, selected && styles.tagTextSelected]}>
                    {tag}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* feedback input */}
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Detailed feedback</AppText>
          <View style={styles.feedbackWrap}>
            <LiftableTextInput
              value={feedback}
              onChangeText={setFeedback}
              style={styles.feedbackInput}
              multiline
              textAlignVertical="top"
              placeholder="Tell us more about your experience"
              placeholderTextColor="rgba(255,255,255,0.36)"
            />
          </View>
        </View>

        {/* submit */}
        <View style={styles.ctaWrap}>
          <AppButton
            label={submitting ? 'Submitting...' : 'Submit'}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { backgroundColor: '#000033' },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 28,
  },

  profileCard: {
    backgroundColor: 'rgba(245,245,245,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: { marginRight: 12 },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E6C714',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F28C28',
    borderWidth: 2,
    borderColor: '#E6C714',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#111133',
    fontSize: 22,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  profileInfo: { flex: 1 },
  profileName: {
    color: '#F5F5F5',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  profileIssue: {
    marginTop: 2,
    color: 'rgba(245,245,245,0.72)',
    fontSize: 14,
    lineHeight: 18,
  },
  profileId: {
    marginTop: 2,
    color: 'rgba(245,245,245,0.45)',
    fontSize: 12,
    lineHeight: 16,
  },

  section: { marginTop: 22 },
  sectionTitle: {
    color: '#F5F5F5',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },

  starRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 280,
  },

  tagsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.3)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: '#E6C714',
    borderColor: '#E6C714',
  },
  tagText: {
    color: 'rgba(245,245,245,0.9)',
    fontSize: 13,
    lineHeight: 17,
  },
  tagTextSelected: { color: '#111133' },

  feedbackWrap: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(245,245,245,0.1)',
    minHeight: 120,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  feedbackInput: {
    minHeight: 100,
    color: '#F5F5F5',
    fontSize: 14,
    lineHeight: 20,
  },

  ctaWrap: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingHorizontal: 32,
  },
});

export default RateMechanicScreen;
