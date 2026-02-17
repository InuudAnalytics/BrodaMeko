import React, { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { getNextOnboardingRoute, getOnboardingStepIndex, pickSingleImageFromGallery, ROUTES } from '../../../utils';

const UploadProfilePhotoScreen = ({ navigation, route }) => {
  const { mechanicProfile, setProfilePhoto, completedSteps } = useMechanicProfile();
  const [selectedUri, setSelectedUri] = useState(mechanicProfile.profilePhotoUri || null);
  const [loading, setLoading] = useState(false);
  const isOnboarding = Boolean(route?.params?.onboarding);
  const skippedSteps = route?.params?.skippedSteps || [];
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_UPLOAD_PROFILE_PHOTO);
  const progressPercent = useMemo(() => (stepIndex / 4) * 100, [stepIndex]);

  const handlePickPhoto = async () => {
    setLoading(true);
    try {
      const { cancelled, asset, error } = await pickSingleImageFromGallery();

      if (cancelled) {
        return;
      }

      if (error) {
        Alert.alert('Photo upload', error);
        return;
      }

      if (asset?.uri) {
        setSelectedUri(asset.uri);
        setProfilePhoto(asset.uri);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedUri) {
      Alert.alert('Photo required', 'Please upload a profile photo to continue.');
      return;
    }

    setProfilePhoto(selectedUri);

    if (isOnboarding) {
      const { nextRoute, nextSkipped } = getNextOnboardingRoute({
        currentRoute: ROUTES.MECH_UPLOAD_PROFILE_PHOTO,
        completedSteps: { ...completedSteps, photo: true },
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
    const nextSkipped = Array.from(new Set([...skippedSteps, ROUTES.MECH_UPLOAD_PROFILE_PHOTO]));
    const { nextRoute, nextSkipped: resolvedSkipped } = getNextOnboardingRoute({
      currentRoute: ROUTES.MECH_UPLOAD_PROFILE_PHOTO,
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
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Verification screen</AppText>
        </View>

        <AppText style={styles.subtitle}>Please upload a clear photo of your documents</AppText>
        <AppText style={styles.stepLabel}>Step {stepIndex} of 4</AppText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.avatarWrap}>
          {selectedUri ? (
            <Image source={{ uri: selectedUri }} style={styles.avatarImage} />
          ) : (
            <HugeiconsIcon icon={Camera01Icon} size={42} color="rgba(255,255,255,0.75)" strokeWidth={1.8} />
          )}
        </View>

        <AppText style={styles.helperText}>Upload passport photo</AppText>

        <AppButton
          label={loading ? 'Opening gallery...' : 'Choose photo'}
          onPress={handlePickPhoto}
          style={styles.selectBtn}
          textStyle={styles.selectBtnText}
        />
        <AppButton label="Save & continue" onPress={handleSave} style={styles.saveBtn} />

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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
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
  subtitle: {
    marginTop: 12,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  stepLabel: {
    marginTop: 10,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  progressTrack: {
    marginTop: 6,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  avatarWrap: {
    marginTop: 24,
    alignSelf: 'center',
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 1.5,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  helperText: {
    marginTop: 16,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  selectBtn: {
    marginTop: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
  },
  selectBtnText: {
    color: darkTheme.colors.accent,
  },
  saveBtn: {
    marginTop: 12,
  },
  skipRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  skipText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
});

export default UploadProfilePhotoScreen;
