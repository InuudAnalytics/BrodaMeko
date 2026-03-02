import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';

const TAGS = [
  'Good condition',
  'Original / Genuine',
  'Fast delivery',
  'Well packaged',
  'Exactly as described',
  'Good communication',
];

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

const RateProductScreen = ({ navigation, route }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const productName = route?.params?.productName || route?.params?.product?.name || 'LED headlights';
  const productImage = route?.params?.productImage || route?.params?.product?.images?.[0] || '';
  const sellerName = route?.params?.sellerName || route?.params?.seller?.name || 'Okon spare part hub';
  const orderId = route?.params?.orderId || route?.params?.order_id || 'BM-98-09';

  const initials = useMemo(() => {
    const parts = String(productName || '').trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || 'P').toUpperCase();
  }, [productName]);

  const profileLines = useMemo(
    () => [
      { key: 'name', text: productName, style: styles.profileName },
      { key: 'seller', text: sellerName, style: styles.profileIssue },
      { key: 'id', text: `Order #${orderId}`, style: styles.profileId },
    ],
    [orderId, productName, sellerName]
  );

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Select rating', 'Please choose a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Hook into product rating endpoint when available.
      navigation.navigate('ProductFeedbackSuccess');
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
              {productImage ? (
                <Image source={{ uri: productImage }} style={styles.avatarImage} />
              ) : (
                <AppText style={styles.avatarText}>{initials}</AppText>
              )}
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
          <AppText style={styles.sectionTitle}>Product rating</AppText>
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
              placeholder="Tell us more about the product"
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
    paddingTop: 56,
    paddingBottom: 24,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F28C28',
    borderWidth: 0.5,
    borderColor: '#E6C714',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#111133',
    fontSize: 20,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#F5F5F5',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  profileIssue: {
    marginTop: 2,
    color: 'rgba(245,245,245,0.72)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  profileId: {
    marginTop: 2,
    color: 'rgba(245,245,245,0.45)',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    color: '#F5F5F5',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  starRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 260,
    maxWidth: '100%',
  },
  tagsWrap: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    minHeight: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.35)',
    paddingHorizontal: 12,
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
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  tagTextSelected: {
    color: '#111133',
  },
  feedbackWrap: {
    marginTop: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(245,245,245,0.24)',
    minHeight: 150,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  feedbackInput: {
    minHeight: 130,
    color: '#F5F5F5',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  ctaWrap: {
    marginTop: 'auto',
    paddingTop: 18,
    paddingHorizontal: 28,
  },
});

export default RateProductScreen;
