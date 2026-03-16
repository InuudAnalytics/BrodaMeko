import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Alert01Icon,
  ArrowLeft01Icon,
  Camera01Icon,
  Cancel01Icon,
  HelpCircleIcon,
  Notification01Icon,
  User02Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import { verifyAddContact as verifyAddContactService } from '../../../services/auth.service';
import { uploadAvatar as uploadAvatarService } from '../../../services/user.service';
import { uploadSellerStoreLogo } from '../../../services/spareParts.service';
import { darkTheme, withAlpha } from '../../../theme';
import { isValidNigerianPhoneDigits, pickSingleImageFromGallery, ROLES, ROUTES, withNigerianCountryCode } from '../../../utils';
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

const isEmailValid = (value) => {
  const email = String(value || '').trim();
  return Boolean(email && email.includes('@') && email.includes('.'));
};

const SupportActionRow = ({ label, icon, onPress, isLast }) => {
  return (
    <TouchableOpacity style={[styles.supportRow, isLast ? styles.supportRowLast : null]} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.supportRowLeft}>
        <HugeiconsIcon icon={icon} size={18} color="rgba(255,255,255,0.75)" strokeWidth={1.9} />
        <AppText style={styles.supportRowLabel}>{label}</AppText>
      </View>
      <AppText style={styles.supportChevron}>›</AppText>
    </TouchableOpacity>
  );
};

const EditProfileScreen = ({ navigation }) => {
  const { user, role, updateUserData } = useAuth();

  const profile = useMemo(
    () => ({
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
    }),
    [user]
  );

  const [avatarUri, setAvatarUri] = useState(profile.avatarUri);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [passwordMask] = useState('••••••••');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setAvatarUri(profile.avatarUri);
      setName(profile.name);
      setEmail(profile.email);
      setPhone(profile.phone);
    }, [profile.avatarUri, profile.name, profile.email, profile.phone])
  );

  const hasEmail = Boolean(String(profile.email || '').trim());
  const emailMissing = !hasEmail;
  const safeOriginalPhone = String(profile.phone || '').trim();
  const safeCurrentPhone = String(phone || '').trim();
  const phoneMissing = !safeOriginalPhone;
  const phoneChangedWhenMissing = phoneMissing && Boolean(safeCurrentPhone) && safeCurrentPhone !== safeOriginalPhone;
  const emailChangedWhenMissing = emailMissing && String(email || '').trim() && String(email || '').trim() !== String(profile.email || '').trim();

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
        const uploadResponse = role === ROLES.SPARE_PARTS_SELLER
          ? await uploadSellerStoreLogo({
              uri: avatarUri,
              fileName: 'store-logo.jpg',
              type: 'image/jpeg',
            })
          : await uploadAvatarService({
          uri: avatarUri,
          fileName: 'profile-avatar.jpg',
          type: 'image/jpeg',
        });
        nextAvatar = resolveUploadedAvatarUrl(uploadResponse, avatarUri);
      }

      await updateUserData({
        avatar: nextAvatar,
        avatar_url: nextAvatar,
        avatarUrl: nextAvatar,
        profile_photo: nextAvatar,
        profile_photo_url: nextAvatar,
        profile_picture: nextAvatar,
        image_url: nextAvatar,
        photo_url: nextAvatar,
      });

      if (emailChangedWhenMissing) {
        const nextEmail = String(email || '').trim();
        if (!isEmailValid(nextEmail)) {
          AppAlert.alert('Invalid email', 'Enter a valid email address to continue.');
          return;
        }

        await verifyAddContactService({ email: nextEmail });
        navigation.navigate(ROUTES.OTP_VERIFICATION, {
          flow: 'add_contact',
          contactType: 'email',
          destination: nextEmail,
          verifyEndpoint: 'confirm_contact',
          info: 'Enter the OTP sent to your email to complete contact update.',
        });
        return;
      }

      if (phoneChangedWhenMissing) {
        if (!isValidNigerianPhoneDigits(safeCurrentPhone)) {
          AppAlert.alert('Invalid phone number', 'Phone number must be exactly 10 digits.');
          return;
        }

        const phoneWithCountryCode = withNigerianCountryCode(safeCurrentPhone);
        await verifyAddContactService({ phoneNumber: phoneWithCountryCode });
        navigation.navigate(ROUTES.OTP_VERIFICATION, {
          flow: 'add_contact',
          contactType: 'phone',
          destination: phoneWithCountryCode,
          verifyEndpoint: 'confirm_contact',
          info: 'Enter the OTP sent to your phone number to complete contact update.',
        });
        return;
      }

      navigation.goBack();
    } catch (updateError) {
      setEmail(profile.email);
      setPhone(profile.phone);
      AppAlert.alert('Update failed', updateError?.message || 'Could not update profile.');
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
        <AppText style={styles.headerTitle}>Personal information</AppText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.85} onPress={handlePickAvatar}>
          <View style={styles.avatar}>
            {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} /> : <View style={styles.avatarFallback} />}
          </View>
          <View style={styles.cameraBadge}>
            <HugeiconsIcon icon={Camera01Icon} size={15} color={darkTheme.colors.accent} strokeWidth={2} />
          </View>
        </TouchableOpacity>

        <View style={styles.field}>
          <AppText style={styles.label}>Name</AppText>
          <View style={styles.inputWrap}>
            <LiftableTextInput
              value={name}
              onChangeText={setName}
              editable={false}
              placeholder="Enter your name"
              placeholderTextColor={darkTheme.colors.muted}
              style={[styles.input, styles.inputDisabled]}
            />
          </View>
          <AppText style={styles.helperText}>
            Name cannot be changed for security reasons.{' '}
            <AppText style={styles.helperLink} onPress={() => setShowSupportSheet(true)}>
              Contact support
            </AppText>
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Email address</AppText>
          <View style={styles.inputWrap}>
            <LiftableTextInput
              value={email}
              onChangeText={setEmail}
              editable={emailMissing && !isSaving}
              placeholder="Enter your email"
              placeholderTextColor={darkTheme.colors.muted}
              style={[styles.input, !emailMissing ? styles.inputDisabled : null]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {!emailMissing ? (
            <AppText style={styles.helperText}>
              Email cannot be changed for security reasons.{' '}
              <AppText style={styles.helperLink} onPress={() => setShowSupportSheet(true)}>
                Contact support
              </AppText>
            </AppText>
          ) : null}
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Phone number</AppText>
          <View style={styles.inputWrap}>
            <LiftableTextInput
              value={phone}
              onChangeText={setPhone}
              editable={phoneMissing && !isSaving}
              placeholder="Enter your phone number"
              placeholderTextColor={darkTheme.colors.muted}
              style={[styles.input, !phoneMissing ? styles.inputDisabled : null]}
              keyboardType="phone-pad"
            />
          </View>
          {!phoneMissing ? (
            <AppText style={styles.helperText}>
              Phone number cannot be changed for security reasons.{' '}
              <AppText style={styles.helperLink} onPress={() => setShowSupportSheet(true)}>
                Contact support
              </AppText>
            </AppText>
          ) : null}
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Password</AppText>
          <View style={styles.inputWrap}>
            <LiftableTextInput value={passwordMask} editable={false} style={[styles.input, styles.inputDisabled]} />
          </View>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate(ROUTES.CHANGE_PASSWORD)}>
            <AppText style={styles.helperLinkSolo}>Change password</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Add recovery email</AppText>
          <View style={styles.inputWrap}>
            <LiftableTextInput
              value={recoveryEmail}
              onChangeText={setRecoveryEmail}
              editable={!isSaving}
              placeholder=""
              placeholderTextColor={darkTheme.colors.muted}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <AppButton
          label={isSaving ? 'Updating...' : 'Update'}
          onPress={handleUpdate}
          disabled={isSaving}
          left={isSaving ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
        />
      </View>

      <Modal visible={showSupportSheet} transparent animationType="fade" onRequestClose={() => setShowSupportSheet(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSupportSheet(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <AppText style={styles.sheetTitle}>Help & Support</AppText>
              <TouchableOpacity style={styles.sheetCloseBtn} activeOpacity={0.85} onPress={() => setShowSupportSheet(false)}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} color="rgba(255,255,255,0.65)" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <SupportActionRow
              label="Support center"
              icon={HelpCircleIcon}
              onPress={() => {
                setShowSupportSheet(false);
                navigation.navigate(ROUTES.SUPPORT);
              }}
            />
            <SupportActionRow
              label="My disputes"
              icon={Alert01Icon}
              onPress={() => {
                setShowSupportSheet(false);
                navigation.navigate(ROUTES.DISPUTES);
              }}
            />
            <SupportActionRow
              label="Chat with BrodaMeko"
              icon={Notification01Icon}
              onPress={() => {
                setShowSupportSheet(false);
                navigation.navigate(ROUTES.SUPPORT_CHAT);
              }}
            />
            <SupportActionRow
              label="Privacy policy"
              icon={User02Icon}
              isLast
              onPress={() => {
                setShowSupportSheet(false);
                navigation.navigate(ROUTES.PRIVACY_POLICY);
              }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    minHeight: 44,
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  avatarWrap: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.6,
    borderColor: '#D1A527',
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.6)',
    backgroundColor: 'rgba(18,18,62,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
    marginBottom: 4,
  },
  inputWrap: {
    minHeight: 44,
    borderRadius: 4,
    backgroundColor: 'rgba(160,161,197,0.21)',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  input: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  inputDisabled: {
    opacity: 0.88,
  },
  helperText: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.36)',
    fontSize: 12,
    lineHeight: 16,
  },
  helperLink: {
    fontSize: 11,
    color: darkTheme.colors.accent,
  },
  helperLinkSolo: {
    marginTop: 4,
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 18,
  },
  ctaWrap: {
    paddingHorizontal: 44,
    paddingBottom: 30,
    paddingTop: 6,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(86, 89, 128, 0.62)',
  },
  sheet: {
    minHeight: '30%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sheetHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  sheetTitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    lineHeight: 20,
  },
  sheetCloseBtn: {
    position: 'absolute',
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 4,
  },
  supportRowLast: {
    borderBottomWidth: 0,
  },
  supportRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  supportRowLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 19,
    lineHeight: 22,
  },
  supportChevron: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 24,
    lineHeight: 26,
  },
});

export default EditProfileScreen;




