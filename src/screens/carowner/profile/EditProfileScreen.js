import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import { verifyAddContact as verifyAddContactService } from '../../../services/auth.service';
import { uploadAvatar as uploadAvatarService } from '../../../services/user.service';
import { darkTheme, withAlpha } from '../../../theme';
import { isValidNigerianPhoneDigits, pickSingleImageFromGallery, ROUTES, withNigerianCountryCode } from '../../../utils';

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

const isEmailValid = (value) => {
  const email = String(value || '').trim();
  return Boolean(email && email.includes('@') && email.includes('.'));
};

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserData } = useAuth();

  const profile = useMemo(() => {
    return {
      name: user?.full_name || user?.fullName || user?.name || '',
      email: String(user?.email || '').trim(),
      phone: String(user?.phone || user?.phoneNumber || user?.phone_number || '').trim(),
      avatarUri:
        normalizeAvatarUri(
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

  useFocusEffect(
    useCallback(() => {
      setAvatarUri(profile.avatarUri);
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
    }, [profile.avatarUri, profile.name, profile.email, profile.phone])
  );

  const missingContactType = useMemo(() => {
    if (!profile.email) {
      return 'email';
    }

    if (!profile.phone) {
      return 'phone';
    }

    return null;
  }, [profile.email, profile.phone]);

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

      await updateUserData({
        full_name: name.trim(),
        fullName: name.trim(),
        name: name.trim(),
        avatar: nextAvatar,
        avatar_url: nextAvatar,
        avatarUrl: nextAvatar,
        profile_photo: nextAvatar,
        profile_photo_url: nextAvatar,
        profile_picture: nextAvatar,
        image_url: nextAvatar,
        photo_url: nextAvatar,
      });

      if (!missingContactType) {
        navigation.goBack();
        return;
      }

      if (missingContactType === 'email') {
        const nextEmail = String(email || '').trim();

        if (!isEmailValid(nextEmail)) {
          Alert.alert('Invalid email', 'Enter a valid email address to continue.');
          return;
        }

        await verifyAddContactService({ email: nextEmail });
        navigation.navigate(ROUTES.OTP_VERIFICATION, {
          flow: 'add_contact',
          contactType: 'email',
          destination: nextEmail,
          info: 'Enter the OTP sent to your email to complete contact update.',
        });
        return;
      }

      if (!isValidNigerianPhoneDigits(phone)) {
        Alert.alert('Invalid phone number', 'Phone number must be exactly 10 digits.');
        return;
      }

      const phoneWithCountryCode = withNigerianCountryCode(phone);
      await verifyAddContactService({ phoneNumber: phoneWithCountryCode });
      navigation.navigate(ROUTES.OTP_VERIFICATION, {
        flow: 'add_contact',
        contactType: 'phone',
        destination: phoneWithCountryCode,
        info: 'Enter the OTP sent to your phone number to complete contact update.',
      });
    } catch (updateError) {
      Alert.alert('Update failed', updateError?.message || 'Could not update profile.');
    } finally {
      setIsSaving(false);
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
            <LiftableTextInput
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
            <LiftableTextInput
              value={email}
              onChangeText={setEmail}
              editable={!isSaving && (missingContactType === 'email' || !missingContactType)}
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
            <LiftableTextInput
              value={phone}
              onChangeText={setPhone}
              editable={!isSaving && (missingContactType === 'phone' || !missingContactType)}
              placeholder="Enter your phone number"
              placeholderTextColor={darkTheme.colors.muted}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {missingContactType ? (
          <AppText style={styles.helperText}>
            Add your missing {missingContactType === 'email' ? 'email address' : 'phone number'} and tap Update to receive OTP.
          </AppText>
        ) : null}
      </View>

      <View style={styles.ctaWrap}>
        <AppButton
          label={isSaving ? 'Updating...' : 'Update'}
          onPress={handleUpdate}
          disabled={isSaving}
          left={isSaving ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
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
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.12),
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
  helperText: {
    marginTop: 4,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  ctaWrap: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xxl,
  },
});

export default EditProfileScreen;
