import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';

const Star = ({ filled }) => {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
        fill={filled ? darkTheme.colors.accent : 'transparent'}
        stroke={filled ? darkTheme.colors.accent : 'rgba(255,255,255,0.65)'}
        strokeWidth={1.4}
      />
    </Svg>
  );
};

const RateMechanicScreen = ({ navigation, route }) => {
  const { mechanicId, jobId } = route?.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!rating) {
      setError('Please select a star rating before confirming.');
      return;
    }

    setError('');
    Alert.alert('Rating submitted', 'Thanks for your feedback.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Rate mechanic</AppText>
        </View>

        <View style={styles.body}>
          <AppText style={styles.question}>How was your experience with the mechanic?</AppText>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} hitSlop={6} style={styles.starPressable}>
                <Star filled={value <= rating} />
              </Pressable>
            ))}
          </View>

          {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

          <View style={styles.inputWrap}>
            <LiftableTextInput
              value={comment}
              onChangeText={setComment}
              style={styles.input}
              placeholder="Write a comment"
              placeholderTextColor={darkTheme.colors.muted}
              multiline
              textAlignVertical="top"
            />
          </View>

          <AppText style={styles.metaText}>Mechanic: {mechanicId || 'N/A'} | Job: {jobId || 'N/A'}</AppText>
        </View>

        <AppButton label="Confirm rating" onPress={handleConfirm} style={styles.cta} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 22,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  body: {
    flex: 1,
    paddingTop: 28,
  },
  question: {
    color: darkTheme.colors.text,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  starsRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 240,
  },
  starPressable: {
    padding: 2,
  },
  errorText: {
    marginTop: 10,
    color: '#FF6B6B',
    fontSize: 13,
  },
  inputWrap: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 94,
  },
  metaText: {
    marginTop: 12,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  cta: {
    minHeight: 52,
  },
});

export default RateMechanicScreen;
