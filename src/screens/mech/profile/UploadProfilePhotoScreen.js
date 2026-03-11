import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ImageUploadIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import { useMechanicProfile } from '../../../context';
import { uploadAvatar as uploadAvatarService } from '../../../services/user.service';
import { darkTheme, withAlpha } from '../../../theme';
import { getOnboardingStepIndex, MECH_ONBOARDING_STEPS, pickSingleImageFromGallery, ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';
const normalizeAvatarUri = (value, { cacheBust = false } = {}) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (/^(https?:\/\/|file:|content:|data:|asset:)/i.test(raw)) {
    if (cacheBust && /^https?:\/\//i.test(raw)) {
      return `${raw}${raw.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }
    return raw;
  }

  const base = String(BASE_URL || '').trim().replace(/\/+$/, '');
  const path = raw.replace(/^\/+/, '');
  const absolute = base ? `${base}/${path}` : raw;

  if (cacheBust) {
    return `${absolute}${absolute.includes('?') ? '&' : '?'}t=${Date.now()}`;
  }

  return absolute;
};

const UploadProfilePhotoScreen = ({ navigation, route }) => {
  const { mechanicProfile, setProfilePhoto } = useMechanicProfile();
  const { updateUserData, refreshUserProfile } = useAuth();
  const [selectedUri, setSelectedUri] = useState(mechanicProfile.profilePhotoUri || null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isOnboarding = Boolean(route?.params?.onboarding);
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_UPLOAD_PROFILE_PHOTO);
  const totalSteps = MECH_ONBOARDING_STEPS.length;
  const progressPercent = useMemo(() => (stepIndex / totalSteps) * 100, [stepIndex, totalSteps]);

  const handlePickPhoto = async () => {
    setLoading(true);
    try {
      const { cancelled, asset, error } = await pickSingleImageFromGallery();

      if (cancelled) {
        return;
      }

      if (error) {
        AppAlert.alert('Photo upload', error);
        return;
      }

      if (asset?.uri) {
        setSelectedUri(asset.uri);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!selectedUri) {
      AppAlert.alert('Photo required', 'Please upload a profile photo to continue.');
      return;
    }

    const submit = async () => {
      setUploading(true);

      try {
        const response = await uploadAvatarService({
          uri: selectedUri,
          fileName: 'mechanic-avatar.jpg',
          type: 'image/jpeg',
        });
        const payload = response?.data || response || {};
        const uploadedUri = normalizeAvatarUri(
          payload?.avatar ||
          payload?.avatar_url ||
          payload?.avatarUrl ||
          payload?.url ||
          payload?.profile_photo ||
          payload?.profile_photo_url ||
          payload?.profile_picture ||
          payload?.image_url ||
          payload?.photo_url ||
          selectedUri
        , { cacheBust: true });

        setProfilePhoto(uploadedUri);
        await updateUserData({
          avatar: uploadedUri,
          avatar_url: uploadedUri,
          avatarUrl: uploadedUri,
          profile_photo: uploadedUri,
          profile_photo_url: uploadedUri,
          profile_picture: uploadedUri,
          image_url: uploadedUri,
          photo_url: uploadedUri,
        });
        await refreshUserProfile().catch(() => {});

        if (isOnboarding) {
          navigation.replace(ROUTES.MECH_KYC_UPLOAD, { onboarding: true });
          return;
        }

        navigation.goBack();
      } catch (uploadError) {
        AppAlert.alert('Upload failed', uploadError?.message || 'Could not upload profile photo.');
      } finally {
        setUploading(false);
      }
    };

    submit();
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
        <AppText style={styles.stepLabel}>Step {stepIndex} of {totalSteps}</AppText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.uploadCard, selectedUri ? styles.uploadCardFilled : null]}
          onPress={handlePickPhoto}
        >
          {selectedUri ? (
            <Image source={{ uri: selectedUri }} style={styles.uploadedImage} />
          ) : (
            <>
              <View style={styles.uploadIconBadge}>
                <HugeiconsIcon icon={ImageUploadIcon} size={24} color={darkTheme.colors.accent} strokeWidth={1.9} />
              </View>
              <AppText style={styles.uploadCardTitle}>Upload profile photo</AppText>
              <AppText style={styles.uploadCardSubtitle}>
                Add a clear passport-style photo for profile identification
              </AppText>
              <View style={styles.addPhotosBtn}>
                <AppText style={styles.addPhotosText}>{loading ? 'Opening...' : 'Add photos'}</AppText>
              </View>
            </>
          )}
        </TouchableOpacity>
        <AppButton
          label={uploading ? 'Saving...' : 'Continue'}
          onPress={handleSave}
          style={styles.saveBtn}
          disabled={uploading}
        />

      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
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
  uploadCard: {
    marginTop: 24,
    width: '100%',
    height: 225,
    borderWidth: 1.2,
    borderColor: withAlpha(darkTheme.colors.accent, 0.5),
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#727497',
    alignItems: 'center',
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
  saveBtn: {
    marginTop: 12,
  },
});

export default UploadProfilePhotoScreen;




