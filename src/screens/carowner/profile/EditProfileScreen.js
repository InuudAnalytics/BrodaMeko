import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { darkTheme } from '../../../theme';
import { pickSingleImageFromGallery } from '../../../utils';

const MOCK_PROFILE = {
  name: 'Olamilekan Samuel',
  email: 'daciemluix@gmail.com',
  phone: '234 903 989 1093',
  lastNameChangeAt: '2026-02-03T10:00:00.000Z',
};

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

const getDaysSince = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return Date.now() - date.getTime();
};

const EditProfileScreen = ({ navigation }) => {
  const { user } = useAuth();
  const profile = useMemo(() => {
    return {
      name:
        user?.full_name ||
        user?.fullName ||
        user?.name ||
        MOCK_PROFILE.name,
      email: user?.email || MOCK_PROFILE.email,
      phone: user?.phone || user?.phoneNumber || MOCK_PROFILE.phone,
      lastNameChangeAt: user?.lastNameChangeAt || MOCK_PROFILE.lastNameChangeAt,
    };
  }, [user]);

  const [avatarUri, setAvatarUri] = useState(user?.avatar || null);
  const [name, setName] = useState(profile.name);
  const [email] = useState(profile.email);
  const [phone] = useState(profile.phone);

  const timeSinceLastChange = getDaysSince(profile.lastNameChangeAt);
  const isNameLocked = timeSinceLastChange !== null && timeSinceLastChange < DAYS_30_MS;

  const handlePickAvatar = async () => {
    const { asset, cancelled } = await pickSingleImageFromGallery();
    if (!cancelled && asset?.uri) {
      setAvatarUri(asset.uri);
    }
  };

  const handleUpdate = () => {
    console.log('Edit profile update', { name, email, phone, avatarUri });
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
          <View style={[styles.inputWrap, isNameLocked ? styles.inputDisabled : null]}>
            <TextInput
              value={name}
              onChangeText={setName}
              editable={!isNameLocked}
              placeholder="Name"
              placeholderTextColor={darkTheme.colors.muted}
              style={styles.input}
            />
          </View>
          <AppText style={[styles.helper, isNameLocked ? styles.helperMuted : null]}>
            Name can only be changed every 30 days
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Email address</AppText>
          <View style={[styles.inputWrap, styles.inputDisabled]}>
            <TextInput value={email} editable={false} style={styles.input} />
          </View>
          <AppText style={styles.helper}>
            Email cannot be changed for security reasons.{' '}
            <AppText style={styles.helperAccent}>Contact support</AppText>
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Phone number</AppText>
          <View style={[styles.inputWrap, styles.inputDisabled]}>
            <TextInput value={phone} editable={false} style={styles.input} />
          </View>
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <AppButton label="Update" onPress={handleUpdate} />
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
  inputDisabled: {
    opacity: 0.7,
  },
  helper: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    fontSize: 11,
  },
  helperMuted: {
    color: darkTheme.colors.muted,
  },
  helperAccent: {
    color: darkTheme.colors.accent,
  },
  ctaWrap: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xxl,
  },
});

export default EditProfileScreen;
