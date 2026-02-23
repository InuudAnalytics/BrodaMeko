import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ImageUploadIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme, withAlpha } from '../../../theme';
import { getOnboardingStepIndex, pickSingleImageFromGallery, ROUTES } from '../../../utils';

const UploadCertificateScreen = ({ navigation, route }) => {
  const { mechanicProfile, setCertificateImages, completedSteps } = useMechanicProfile();
  const [images, setImages] = useState(mechanicProfile.certificateImages?.slice(0, 1) || []);
  const [openingPicker, setOpeningPicker] = useState(false);
  const isOnboarding = Boolean(route?.params?.onboarding);
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_UPLOAD_CERTIFICATE);
  const progressPercent = useMemo(() => (stepIndex / 5) * 100, [stepIndex]);
  React.useEffect(() => {
    if (!isOnboarding) {
      return;
    }

    if (!completedSteps.id) {
      Alert.alert('Complete previous step', 'Please upload your ID first.');
      navigation.replace(ROUTES.MECH_PROFILE_SETUP);
    }
  }, [completedSteps.id, isOnboarding, navigation]);

  const canContinue = images.length > 0;

  const handlePickImage = async () => {
    setOpeningPicker(true);
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

      setImages([asset.uri]);
    } finally {
      setOpeningPicker(false);
    }
  };

  const handleContinue = () => {
    if (!canContinue) {
      return;
    }

    setCertificateImages(images);

    if (isOnboarding) {
      navigation.replace(ROUTES.MECH_BANK_DETAILS, { onboarding: true });
      return;
    }

    navigation.goBack();
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
          <AppText style={styles.subTitle}>Please upload your certificate</AppText>
          <AppText style={styles.stepLabel}>Step {stepIndex} of 5</AppText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <TouchableOpacity
            style={[styles.uploadCard, images.length ? styles.uploadCardFilled : null]}
            activeOpacity={0.9}
            onPress={handlePickImage}
          >
            {images.length ? (
              <Image source={{ uri: images[0] }} style={styles.uploadedImage} />
            ) : (
              <>
                <View style={styles.uploadIconBadge}>
                  <HugeiconsIcon icon={ImageUploadIcon} size={24} color={darkTheme.colors.accent} strokeWidth={1.9} />
                </View>
                <AppText style={styles.uploadCardTitle}>Upload certificate</AppText>
                <AppText style={styles.uploadCardSubtitle}>Add clear certificate image(s) for verification</AppText>

                <View style={styles.addPhotosBtn}>
                  <AppText style={styles.addPhotosText}>{openingPicker ? 'Opening...' : 'Add photos'}</AppText>
                </View>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
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
    borderColor: withAlpha(darkTheme.colors.accent, 0.5),
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#727497',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    height: 225,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadCardFilled: {
    paddingVertical: 0,
  },
  uploadedImage: {
    width: '100%',
    height: 225,
    resizeMode: 'cover',
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
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
});

export default UploadCertificateScreen;
