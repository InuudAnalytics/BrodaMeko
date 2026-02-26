import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BankIcon,
  Briefcase01Icon,
  Cancel01Icon,
  Edit01Icon,
  HelpCircleIcon,
  Location01Icon,
  Notification01Icon,
  StarIcon,
  User02Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import { getCarOwnerJobs, getMechanicAssignedJobs, getMechanicJobStats } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';

const getSettingsRows = (role) => {
  const rows = [
    { key: 'personal', label: 'Personal information', icon: User02Icon },
    { key: 'bank', label: 'Bank details', icon: BankIcon },
    { key: 'address', label: 'Address', icon: Location01Icon },
  ];

  if (role === ROLES.MECH) {
    rows.push({ key: 'services', label: 'Services offered', icon: Wrench01Icon });
  }

  rows.push(
    { key: 'notifications', label: 'Notifications', icon: Notification01Icon },
    { key: 'help', label: 'Help & Support', icon: HelpCircleIcon }
  );

  return rows;
};

const normalizeAvatarUri = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (/^(https?:\/\/|file:|content:|data:|asset:)/i.test(raw)) {
    return raw;
  }

  const base = String(BASE_URL || '').trim().replace(/\/+$/, '');
  const path = raw.replace(/^\/+/, '');
  return base ? `${base}/${path}` : raw;
};

const readUser = (user) => {
  const fullName = user?.full_name || user?.fullName || user?.name || 'User';
  const email = String(user?.email || '').trim();

  return {
    fullName: String(fullName || 'User'),
    email,
    avatarUri:
      normalizeAvatarUri(
        user?.avatar ||
          user?.avatar_url ||
          user?.avatarUrl ||
          user?.avatarUri ||
          user?.profile_photo ||
          user?.profile_photo_url ||
          user?.profile_picture ||
          user?.profilePicture ||
          user?.image ||
          user?.image_url ||
          user?.photo_url ||
          ''
      ) || null,
  };
};

const SettingRow = ({ label, icon, onPress, isLast }) => {
  return (
    <TouchableOpacity style={[styles.settingRow, isLast ? styles.settingRowLast : null]} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.settingLeft}>
        <HugeiconsIcon icon={icon} size={20} color="rgba(255,255,255,0.42)" strokeWidth={1.9} />
        <AppText style={styles.settingLabel}>{label}</AppText>
      </View>
      <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="rgba(255,255,255,0.42)" strokeWidth={2.1} />
    </TouchableOpacity>
  );
};

const UserProfileScreen = ({ navigation }) => {
  const { user, role, signOut, isLoading } = useAuth();
  const [totalJobs, setTotalJobs] = useState(0);
  const [rating, setRating] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);

  const profile = readUser(user);
  const initials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchStats = async () => {
        try {
          const mechanicId = String(user?.id || user?._id || user?.mechanic_id || '').trim();
          const [jobsResponse, statsResponse] = await Promise.all([
            role === ROLES.MECH ? getMechanicAssignedJobs({ page: 1, limit: 100 }) : getCarOwnerJobs({ page: 1, limit: 100 }),
            role === ROLES.MECH && mechanicId ? getMechanicJobStats(mechanicId).catch(() => null) : Promise.resolve(null),
          ]);

          if (!active) {
            return;
          }

          const jobsPayload = jobsResponse?.data || jobsResponse || {};
          const statsPayload = statsResponse?.data || statsResponse || {};
          const jobsList = Array.isArray(jobsPayload)
            ? jobsPayload
            : (jobsPayload?.jobs || jobsPayload?.items || jobsPayload?.results || []);
          const completedFromStats = Number(statsPayload?.total_completed_jobs || statsPayload?.completed_jobs || 0);
          setTotalJobs(Number(completedFromStats || jobsPayload?.total || jobsList.length || 0));

          const rawRating = Number(user?.rating || user?.average_rating || user?.avg_rating || 0);
          setRating(Number.isFinite(rawRating) ? rawRating : 0);
        } catch (error) {
          // noop
        }
      };

      fetchStats();
      return () => {
        active = false;
      };
    }, [role, user?.average_rating, user?.avg_rating, user?.id, user?._id, user?.mechanic_id, user?.rating])
  );

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handlePersonalInfo = () => {
    if (role === ROLES.MECH) {
      navigation.navigate(ROUTES.MECH_EDIT_PROFILE);
      return;
    }
    navigation.navigate(ROUTES.CAR_OWNER_EDIT_PROFILE);
  };

  const handleSupportAction = (target) => {
    setShowSupportSheet(false);
    if (target === 'support_center') {
      navigation.navigate(ROUTES.SUPPORT);
      return;
    }
    if (target === 'chat') {
      navigation.navigate(ROUTES.SUPPORT_CHAT_MOCK);
      return;
    }
    navigation.navigate(ROUTES.PRIVACY_POLICY);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.heading}>User profile</AppText>
        </View>

        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            {profile.avatarUri ? <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} /> : <AppText style={styles.avatarText}>{initials}</AppText>}
          </View>
          <AppText style={styles.name}>{profile.fullName}</AppText>
          {profile.email ? <AppText style={styles.email}>{profile.email}</AppText> : null}

          <AppButton
            label="Edit profile"
            onPress={handlePersonalInfo}
            style={styles.editButton}
            textStyle={styles.editButtonText}
            icon={Edit01Icon}
            iconSize={16}
            iconColor={darkTheme.colors.accent}
          />
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statChip}>
            <View style={styles.statIconWrap}>
              <HugeiconsIcon icon={Briefcase01Icon} size={15} color={darkTheme.colors.accent} strokeWidth={2} />
            </View>
            <View>
              <AppText style={styles.statValue}>{totalJobs}</AppText>
              <AppText style={styles.statLabel}>Total jobs</AppText>
            </View>
          </View>

          <View style={styles.statChip}>
            <View style={styles.statIconWrap}>
              <HugeiconsIcon icon={StarIcon} size={15} color={darkTheme.colors.accent} strokeWidth={2} />
            </View>
            <View>
              <AppText style={styles.statValue}>{rating ? rating.toFixed(1) : '0.0'}</AppText>
              <AppText style={styles.statLabel}>Ratings</AppText>
            </View>
          </View>
        </View>

        <AppText style={styles.settingsTitle}>Settings</AppText>
        <View style={styles.settingsCard}>
          {getSettingsRows(role).map((row, index, array) => (
            <SettingRow
              key={row.key}
              label={row.label}
              icon={row.icon}
              isLast={index === array.length - 1}
              onPress={() => {
                if (row.key === 'help') {
                  setShowSupportSheet(true);
                  return;
                }
                if (row.key === 'personal') {
                  handlePersonalInfo();
                  return;
                }
                if (row.key === 'bank') {
                  if (role === ROLES.MECH) {
                    navigation.navigate(ROUTES.MECH_BANK_DETAILS);
                    return;
                  }
                  if (role === ROLES.SPARE_PARTS_SELLER) {
                    navigation.navigate(ROUTES.SPARE_PARTS_BANK_DETAILS);
                    return;
                  }
                  navigation.navigate('Placeholder', { title: 'Bank details' });
                  return;
                }
                if (row.key === 'address') {
                  if (role === ROLES.MECH) {
                    navigation.navigate(ROUTES.MECH_ADDRESS);
                    return;
                  }
                  if (role === ROLES.SPARE_PARTS_SELLER) {
                    navigation.navigate(ROUTES.SPARE_PARTS_ADDRESS);
                    return;
                  }
                  navigation.navigate('Placeholder', { title: 'Address' });
                  return;
                }
                if (row.key === 'services') {
                  navigation.navigate(ROUTES.MECH_SET_SERVICES);
                  return;
                }
                if (row.key === 'notifications') {
                  navigation.navigate('Notifications');
                }
              }}
            />
          ))}
        </View>

        <AppButton
          label={isSigningOut ? 'Logging out...' : 'Logout'}
          onPress={handleSignOut}
          disabled={isSigningOut || isLoading}
          left={isSigningOut ? <ActivityIndicator size="small" color="#C73B4A" /> : null}
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        />
      </ScrollView>

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

            <SettingRow label="Support center" icon={HelpCircleIcon} onPress={() => handleSupportAction('support_center')} />
            <SettingRow label="Chat with BrodaMeko" icon={Notification01Icon} onPress={() => handleSupportAction('chat')} />
            <SettingRow label="Privacy policy" icon={User02Icon} onPress={() => handleSupportAction('privacy')} isLast />
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
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    height: 34,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  userBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F58C43',
    borderWidth: 2,
    borderColor: '#D1A527',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    color: '#111133',
    fontSize: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  name: {
    color: darkTheme.colors.text,
    marginTop: 10,
    fontSize: 20,
    lineHeight: 22,
    // fontFamily: darkTheme.typography.fontFamilies.heading,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  email: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.54)',
    fontSize: 14,
    lineHeight: 22,
  },
  editButton: {
    marginTop: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.55)',
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  editButtonText: {
    color: darkTheme.colors.accent,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  statsCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(60,211,66,0.55)',
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
    flexDirection: 'row',
    columnGap: 12,
  },
  statChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  statLabel: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    lineHeight: 18,
  },
  settingsTitle: {
    color: darkTheme.colors.text,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
    marginBottom: 8,
  },
  settingsCard: {
    borderRadius: 12,
    gap: 8,
    marginBottom: 18,
    overflow: 'hidden',
  },
  settingRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 4,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  settingLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    lineHeight: 24,
  },
  logoutButton: {
    marginTop: 6,
    width: '90%',
    alignSelf: 'center',
    maxWidth: 297,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(207,61,61,0.32)',
  },
  logoutText: {
    color: '#CF3D3DF7',
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
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
});

export default UserProfileScreen;
