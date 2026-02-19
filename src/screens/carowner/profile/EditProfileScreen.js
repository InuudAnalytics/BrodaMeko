import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import {
  resendOtp as resendOtpService,
  verifyAddContact as verifyAddContactService,
  verifyOtp as verifyOtpService,
} from '../../../services/auth.service';
import { uploadAvatar as uploadAvatarService } from '../../../services/user.service';
import { darkTheme } from '../../../theme';
import { pickSingleImageFromGallery } from '../../../utils';

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

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserData } = useAuth();
  const profile = useMemo(() => {
    return {
      name:
        user?.full_name ||
        user?.fullName ||
        user?.name ||
        '',
      email: user?.email || '',
      phone: user?.phone || user?.phoneNumber || user?.phone_number || '',
      avatarUri: normalizeAvatarUri(
        user?.avatar ||
        user?.avatar_url ||
        user?.avatarUrl ||
        user?.avatarUri ||
        user?.profile_photo ||
        user?.profile_photo_url ||
        user?.profile_picture ||
        user?.image_url ||
        user?.photo_url ||
        ''
      ) || null,
    };
  }, [user]);

  const [avatarUri, setAvatarUri] = useState(profile.avatarUri);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingContactVerification, setPendingContactVerification] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const handlePickAvatar = async () => {
    const { asset, cancelled } = await pickSingleImageFromGallery();
    if (!cancelled && asset?.uri) {
      setAvatarUri(asset.uri);
    }
  };

  const resolveUploadedAvatarUrl = (responsePayload, fallbackUri) => {
    const payload = responsePayload?.data || responsePayload || {};
    const payloadUser = payload?.user && typeof payload.user === 'object' ? payload.user : null;

    const avatarUrl = String(
      payload?.avatar ||
      payload?.avatar_url ||
      payload?.avatarUrl ||
      payload?.url ||
      payload?.profile_photo ||
      payload?.profile_photo_url ||
      payload?.profile_picture ||
      payload?.photo_url ||
      payload?.image_url ||
      payloadUser?.avatar ||
      payloadUser?.avatar_url ||
      payloadUser?.avatarUrl ||
      payloadUser?.profile_photo ||
      payloadUser?.profile_photo_url ||
      payloadUser?.profile_picture ||
      payloadUser?.photo_url ||
      payloadUser?.image_url ||
      fallbackUri ||
      ''
    ).trim();

    return normalizeAvatarUri(avatarUrl, { cacheBust: true });
  };

  const handleUpdate = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      let nextAvatar = avatarUri || '';
      const avatarChanged = Boolean(avatarUri) && avatarUri !== profile.avatarUri;

      if (avatarChanged) {
        const uploadResponse = await uploadAvatarService({
          uri: avatarUri,
          fileName: 'profile-avatar.jpg',
          type: 'image/jpeg',
        });
        nextAvatar = resolveUploadedAvatarUrl(uploadResponse, avatarUri);
      }

      const trimmedEmail = email.trim();
      const trimmedPhone = phone.trim();
      const previousEmail = String(profile.email || '').trim();
      const previousPhone = String(profile.phone || '').trim();
      const emailChanged = trimmedEmail !== previousEmail;
      const phoneChanged = trimmedPhone !== previousPhone;

      await updateUserData({
        full_name: name.trim(),
        fullName: name.trim(),
        name: name.trim(),
        email: emailChanged ? '' : trimmedEmail,
        phone: phoneChanged ? '' : trimmedPhone,
        phoneNumber: phoneChanged ? '' : trimmedPhone,
        phone_number: phoneChanged ? '' : trimmedPhone,
        avatar: nextAvatar,
        avatar_url: nextAvatar,
        avatarUrl: nextAvatar,
        profile_photo: nextAvatar,
        profile_photo_url: nextAvatar,
        profile_picture: nextAvatar,
        image_url: nextAvatar,
        photo_url: nextAvatar,
      });

      if (phoneChanged && trimmedPhone) {
        await verifyAddContactService({ phoneNumber: trimmedPhone });
        setPendingContactVerification({ type: 'phone', value: trimmedPhone });
        setOtpCode('');
        setOtpError('');
        return;
      }

      if (emailChanged && trimmedEmail) {
        await verifyAddContactService({ email: trimmedEmail });
        setPendingContactVerification({ type: 'email', value: trimmedEmail });
        setOtpCode('');
        setOtpError('');
        return;
      }

      if ((phoneChanged && !trimmedPhone) || (emailChanged && !trimmedEmail)) {
        setOtpError('Contact field left empty. Add a valid value and update to verify it.');
        return;
      }

      navigation.goBack();
    } catch (updateError) {
      Alert.alert('Update failed', updateError?.message || 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyContactOtp = async () => {
    if (!pendingContactVerification || isVerifyingOtp || isResendingOtp) {
      return;
    }

    const trimmedOtp = String(otpCode || '').trim();
    if (!trimmedOtp) {
      setOtpError('Please enter the OTP sent to your contact.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      const response = await verifyOtpService({ otp: trimmedOtp });
      const success = response?.success !== false;

      if (!success) {
        throw new Error(response?.message || 'OTP verification failed.');
      }

      if (pendingContactVerification.type === 'phone') {
        await updateUserData({
          phone: pendingContactVerification.value,
          phoneNumber: pendingContactVerification.value,
          phone_number: pendingContactVerification.value,
        });
      } else {
        await updateUserData({
          email: pendingContactVerification.value,
        });
      }

      setPendingContactVerification(null);
      setOtpCode('');
      navigation.goBack();
    } catch (verifyError) {
      if (pendingContactVerification.type === 'phone') {
        setPhone('');
        await updateUserData({ phone: '', phoneNumber: '', phone_number: '' });
      } else {
        setEmail('');
        await updateUserData({ email: '' });
      }

      setOtpError(verifyError?.message || 'Invalid OTP. Contact was not added.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendContactOtp = async () => {
    if (!pendingContactVerification || isResendingOtp || isVerifyingOtp) {
      return;
    }

    setIsResendingOtp(true);
    setOtpError('');

    try {
      await resendOtpService({
        email: pendingContactVerification.type === 'email' ? pendingContactVerification.value : '',
        phoneNumber: pendingContactVerification.type === 'phone' ? pendingContactVerification.value : '',
      });
    } catch (resendError) {
      setOtpError(resendError?.message || 'Could not resend OTP.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.85} onPress={handlePickAvatar}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback} />
            )}
          </View>
          <View style={styles.cameraBadge}>
            <HugeiconsIcon icon={Camera01Icon} size={14} color={darkTheme.colors.accent} strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <View style={styles.field}>
          <AppText style={styles.label}>Name</AppText>
          <View style={styles.inputWrap}>
            <TextInput
              value={name}
              onChangeText={setName}
              editable={!isSaving}
              placeholder="Enter your name"
              placeholderTextColor={darkTheme.colors.muted}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Email address</AppText>
          <View style={styles.inputWrap}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={!isSaving}
              placeholder="Enter your email"
              placeholderTextColor={darkTheme.colors.muted}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Phone number</AppText>
          <View style={styles.inputWrap}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              editable={!isSaving}
              placeholder="Enter your phone number"
              placeholderTextColor={darkTheme.colors.muted}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {pendingContactVerification ? (
          <View style={styles.otpSection}>
            <AppText style={styles.otpTitle}>Verify {pendingContactVerification.type === 'phone' ? 'phone number' : 'email'}</AppText>
            <AppText style={styles.otpSubtitle}>
              Enter the OTP sent to {pendingContactVerification.value}
            </AppText>
            <View style={styles.inputWrap}>
              <TextInput
                value={otpCode}
                onChangeText={setOtpCode}
                editable={!isVerifyingOtp && !isResendingOtp}
                placeholder="Enter OTP"
                placeholderTextColor={darkTheme.colors.muted}
                style={styles.input}
                keyboardType="number-pad"
              />
            </View>
            {otpError ? <AppText style={styles.otpError}>{otpError}</AppText> : null}
            <View style={styles.otpActionsRow}>
              <AppButton
                label={isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                onPress={handleVerifyContactOtp}
                disabled={isVerifyingOtp || isResendingOtp}
                style={styles.otpVerifyBtn}
                left={isVerifyingOtp ? <ActivityIndicator size="small" color="#000033" /> : null}
              />
              <TouchableOpacity
                style={styles.otpResendBtn}
                activeOpacity={0.85}
                onPress={handleResendContactOtp}
                disabled={isResendingOtp || isVerifyingOtp}
              >
                <AppText style={styles.otpResendText}>
                  {isResendingOtp ? 'Resending...' : 'Resend OTP'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.ctaWrap}>
        <AppButton
          label={isSaving ? 'Updating...' : 'Update'}
          onPress={handleUpdate}
          disabled={isSaving}
          left={isSaving ? <ActivityIndicator size="small" color="#000033" /> : null}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  header: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.sm,
    minHeight: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.md,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: darkTheme.spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.4,
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(226,255,49,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  cameraBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#14144A',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    marginBottom: darkTheme.spacing.md,
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: 14,
    marginBottom: darkTheme.spacing.xs,
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: darkTheme.spacing.md,
    justifyContent: 'center',
  },
  input: {
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  ctaWrap: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xxl,
  },
  otpSection: {
    marginTop: darkTheme.spacing.xs,
    padding: darkTheme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  otpTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  otpSubtitle: {
    marginTop: 4,
    marginBottom: darkTheme.spacing.sm,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  otpError: {
    marginTop: darkTheme.spacing.xs,
    color: '#FF7B8A',
    fontSize: 12,
  },
  otpActionsRow: {
    marginTop: darkTheme.spacing.sm,
  },
  otpVerifyBtn: {
    minHeight: 44,
  },
  otpResendBtn: {
    marginTop: darkTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  otpResendText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default EditProfileScreen;
