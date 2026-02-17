import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { getNextOnboardingRoute, getOnboardingStepIndex, pickSingleImageFromGallery, ROUTES } from '../../../utils';

const MAX_IMAGES = 5;

const UploadCard = ({ title, subtitle, images, onAddPress, onRemovePress, loading }) => {
  const hasImages = images.length > 0;

  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadIconBadge}>
        <HugeiconsIcon icon={Camera01Icon} size={24} color={darkTheme.colors.accent} strokeWidth={1.9} />
      </View>
      <AppText style={styles.uploadCardTitle}>{title}</AppText>
      <AppText style={styles.uploadCardSubtitle}>{subtitle}</AppText>

      <TouchableOpacity style={styles.addPhotosBtn} activeOpacity={0.85} onPress={onAddPress}>
        <AppText style={styles.addPhotosText}>{loading ? 'Opening...' : 'Add photos'}</AppText>
      </TouchableOpacity>

      {hasImages ? (
        <View style={styles.grid}>
          {images.map((uri, index) => (
            <View key={`${title}-${uri}-${index}`} style={styles.tile}>
              <Image source={{ uri }} style={styles.tileImage} />
              <TouchableOpacity style={styles.removeBtn} activeOpacity={0.85} onPress={() => onRemovePress(index)}>
                <AppText style={styles.removeText}>-</AppText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const KycUploadScreen = ({ navigation, route }) => {
  const { mechanicProfile, setKyc, completedSteps } = useMechanicProfile();
  const [ninImages, setNinImages] = useState(mechanicProfile.ninImages || []);
  const [loadingKey, setLoadingKey] = useState('');
  const isOnboarding = Boolean(route?.params?.onboarding);
  const skippedSteps = route?.params?.skippedSteps || [];
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_KYC_UPLOAD);
  const progressPercent = useMemo(() => (stepIndex / 4) * 100, [stepIndex]);

  const canUpload = useMemo(() => ninImages.length > 0, [ninImages.length]);

  const addImage = async (target) => {
    const currentCount = ninImages.length;

    if (currentCount >= MAX_IMAGES) {
      Alert.alert('Upload limit', `Maximum of ${MAX_IMAGES} images allowed.`);
      return;
    }

    setLoadingKey(target);

    try {
      const { cancelled, asset, error } = await pickSingleImageFromGallery();

      if (cancelled) {
        return;
      }

      if (error) {
        Alert.alert('Upload failed', error);
        return;
      }

      if (!asset?.uri) {
        return;
      }

      setNinImages((prev) => [...prev, asset.uri].slice(0, MAX_IMAGES));
    } finally {
      setLoadingKey('');
    }
  };

  const removeImage = (target, index) => {
    setNinImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpload = () => {
    if (!canUpload) {
      return;
    }

    setKyc({ ninImages });

    if (isOnboarding) {
      const { nextRoute, nextSkipped } = getNextOnboardingRoute({
        currentRoute: ROUTES.MECH_KYC_UPLOAD,
        completedSteps: { ...completedSteps, kyc: true },
        skippedSteps,
      });
      if (nextRoute === ROUTES.MECH_PROFILE_SETUP) {
        navigation.navigate(nextRoute);
        return;
      }
      navigation.replace(nextRoute, { onboarding: true, skippedSteps: nextSkipped });
      return;
    }

    navigation.goBack();
  };

  const handleSkipNext = () => {
    const nextSkipped = Array.from(new Set([...skippedSteps, ROUTES.MECH_KYC_UPLOAD]));
    const { nextRoute, nextSkipped: resolvedSkipped } = getNextOnboardingRoute({
      currentRoute: ROUTES.MECH_KYC_UPLOAD,
      completedSteps,
      skippedSteps: nextSkipped,
    });
    if (nextRoute === ROUTES.MECH_PROFILE_SETUP) {
      navigation.navigate(nextRoute);
      return;
    }
    navigation.replace(nextRoute, { onboarding: true, skippedSteps: resolvedSkipped });
  };

  const handleSkipAll = () => {
    navigation.navigate(ROUTES.MECH_PROFILE_SETUP);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Verification screen</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText style={styles.subTitle}>Please upload a clear photo of your documents</AppText>
          <AppText style={styles.stepLabel}>Step {stepIndex} of 4</AppText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <UploadCard
            title="Upload NIN"
            subtitle="Add photos of national identification number for identification"
            images={ninImages}
            loading={loadingKey === 'nin'}
            onAddPress={() => addImage('nin')}
            onRemovePress={(index) => removeImage('nin', index)}
          />
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Upload" onPress={handleUpload} disabled={!canUpload} style={styles.uploadBtn} />
          {isOnboarding ? (
            <View style={styles.skipRow}>
              <TouchableOpacity activeOpacity={0.85} onPress={handleSkipNext}>
                <AppText style={styles.skipText}>Skip next</AppText>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.85} onPress={handleSkipAll}>
                <AppText style={styles.skipText}>Skip all</AppText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  container: {
    flex: 1,
  },
  header: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  subTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 12,
  },
  stepLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  uploadCard: {
    borderWidth: 1.2,
    borderColor: 'rgba(226,255,49,0.5)',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#727497',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadCardTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  uploadCardSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 260,
  },
  addPhotosBtn: {
    marginTop: 12,
    minWidth: 120,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  addPhotosText: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  grid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tile: {
    width: 62,
    height: 62,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  tileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeBtn: {
    position: 'absolute',
    right: 3,
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#1A1A1A',
    fontSize: 12,
    lineHeight: 12,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  uploadBtn: {
    borderRadius: 10,
  },
  skipRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  skipText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
});

export default KycUploadScreen;
