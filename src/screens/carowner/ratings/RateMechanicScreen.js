import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { leaveMechanicReview } from '../../../services/mechanic-reviews.service';
import { darkTheme } from '../../../theme';

const TAGS = ['Arrived on time', 'Professional', 'Friendly', 'Resolved issue quickly'];

const pad2 = (value) => String(value).padStart(2, '0');

const makeBmId = (date = new Date()) => `#BM-${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}`;

const Star = ({ filled }) => {
  return (
    <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
        fill={filled ? '#E6C714' : 'transparent'}
        stroke={filled ? '#E6C714' : 'rgba(245,245,245,0.8)'}
        strokeWidth={1.25}
      />
    </Svg>
  );
};

const RateMechanicScreen = ({ navigation, route }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const mechanicName =
    route?.params?.mechanic?.name ||
    route?.params?.mechanicName ||
    route?.params?.mechanic_id ||
    'Emeka Nwosu';
  const issueName =
    route?.params?.issueName ||
    route?.params?.issue ||
    route?.params?.job?.issue ||
    route?.params?.job?.issue_name ||
    'Flat tire replacement';
  const displayId = route?.params?.displayId || makeBmId();
  const mechanicId = String(
    route?.params?.mechanicId ||
    route?.params?.mechanic_id ||
    route?.params?.mechanic?.id ||
    route?.params?.mechanic?.mechanic_id ||
    ''
  ).trim();

  const profileLines = useMemo(
    () => [
      { key: 'name', text: mechanicName, style: styles.profileName },
      { key: 'issue', text: issueName, style: styles.profileIssue },
      { key: 'id', text: `ID: ${displayId}`, style: styles.profileId },
    ],
    [displayId, issueName, mechanicName]
  );

  const initials = useMemo(() => {
    const parts = String(mechanicName || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return (parts[0]?.[0] || 'M').toUpperCase();
  }, [mechanicName]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Select rating', 'Please choose a star rating before submitting.');
      return;
    }

    if (!mechanicId) {
      Alert.alert('Missing mechanic', 'Could not identify mechanic for this review.');
      return;
    }

    setSubmitting(true);
    try {
      const commentText = [feedback.trim(), ...selectedTags].filter(Boolean).join(' | ');
      await leaveMechanicReview(mechanicId, {
        rating,
        comment: commentText || 'No additional comment.',
      });
      Alert.alert('Rating submitted', 'Thanks for your feedback.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (submitError) {
      Alert.alert('Submit failed', submitError?.message || 'Could not submit review right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <AppText style={styles.avatarText}>{initials}</AppText>
            </View>
          </View>

          <View style={styles.profileInfo}>
            {profileLines.map((line) => (
              <AppText key={line.key} style={line.style}>
                {line.text}
              </AppText>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Service rating</AppText>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} hitSlop={8}>
                <Star filled={value <= rating} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>What stood out?</AppText>
          <View style={styles.tagsWrap}>
            {TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  activeOpacity={0.9}
                  style={[styles.tag, isSelected ? styles.tagSelected : null]}
                  onPress={() => toggleTag(tag)}
                >
                  <AppText style={[styles.tagText, isSelected ? styles.tagTextSelected : null]}>{tag}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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

        <View style={styles.ctaWrap}>
          <AppButton label={submitting ? 'Submitting...' : 'Submit'} onPress={handleSubmit} disabled={submitting} />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000033',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 84,
    paddingBottom: 28,
  },
  profileCard: {
    backgroundColor: 'rgba(245,245,245,0.18)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    marginRight: 10,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F28C28',
    borderWidth: 4,
    borderColor: '#E6C714',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#111133',
    fontSize: 24,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#F5F5F5',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  profileIssue: {
    marginTop: 2,
    color: 'rgba(245,245,245,0.72)',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  profileId: {
    marginTop: 2,
    color: 'rgba(245,245,245,0.45)',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    color: '#F5F5F5',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  starRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 304,
    maxWidth: '100%',
  },
  tagsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    minHeight: 40,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.35)',
    paddingHorizontal: 16,
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
    fontSize: 19,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  tagTextSelected: {
    color: '#111133',
  },
  feedbackWrap: {
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(245,245,245,0.24)',
    minHeight: 186,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  feedbackInput: {
    minHeight: 160,
    color: '#F5F5F5',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  ctaWrap: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingHorizontal: 32,
  },
});

export default RateMechanicScreen;
