import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  DollarCircleIcon,
  Edit01Icon,
  HelpCircleIcon,
  Mail01Icon,
  Notification01Icon,
  ShieldUserIcon,
  StarIcon,
  User02Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import { getCarOwnerJobs, getMechanicAssignedJobs } from '../../../services/jobs.service';
import { getWalletBalance } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';

const MOCK_USER = {
  fullName: 'Saheed Niyi',
};

const SETTINGS_ROWS = [
  { key: 'personal', label: 'Personal information', icon: User02Icon },
  { key: 'service_pricing', label: 'Service price', icon: DollarCircleIcon, mechanicOnly: true },
  { key: 'change_password', label: 'Change password', icon: ShieldUserIcon },
  { key: 'notifications', label: 'Notifications', icon: Notification01Icon },
  { key: 'help', label: 'Help & Support', icon: HelpCircleIcon },
];

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
  const fullName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    MOCK_USER.fullName;
  const email = String(user?.email || '').trim();

  return {
    fullName: String(fullName || MOCK_USER.fullName),
    email,
    avatarUri: normalizeAvatarUri(
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

const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const maskEmail = (value) => {
  const email = String(value || '').trim();
  if (!email.includes('@')) {
    return email;
  }

  const [localPart, domain] = email.split('@');
  const compactLocal = String(localPart || '');
  const first = compactLocal.slice(0, 3);
  const last = compactLocal.length > 3 ? compactLocal.slice(-2) : '';
  return `${first}***${last}@${domain}`;
};

const SettingRow = ({ label, icon, onPress, isLast }) => {
  return (
    <TouchableOpacity
      style={[styles.settingRow, isLast && styles.settingRowLast]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <HugeiconsIcon icon={icon} size={20} color={darkTheme.colors.text} strokeWidth={1.9} />
        <AppText style={styles.settingLabel}>{label}</AppText>
      </View>
      <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={darkTheme.colors.muted} strokeWidth={2.1} />
    </TouchableOpacity>
  );
};

const UserProfileScreen = ({ navigation }) => {
  const { user, role, signOut, isLoading } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [rating, setRating] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const profile = readUser(user);
  const settingsRows = SETTINGS_ROWS.filter((row) => !row.mechanicOnly || role === ROLES.MECH);
  const initials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchBalance = async () => {
        try {
          const [walletResponse, jobsResponse] = await Promise.all([
            getWalletBalance(),
            role === ROLES.MECH
              ? getMechanicAssignedJobs({ page: 1, limit: 100 })
              : getCarOwnerJobs({ page: 1, limit: 100 }),
          ]);

          if (!active) {
            return;
          }

          const walletPayload = walletResponse?.data || walletResponse || {};
          setWalletBalance(Number(walletPayload?.balance || walletPayload?.available_balance || 0));

          const jobsPayload = jobsResponse?.data || jobsResponse || {};
          const jobsList = Array.isArray(jobsPayload)
            ? jobsPayload
            : (jobsPayload?.jobs || jobsPayload?.items || jobsPayload?.results || []);
          setTotalJobs(Number(jobsPayload?.total || jobsList.length || 0));

          const rawRating = Number(user?.rating || user?.average_rating || user?.avg_rating || 0);
          setRating(Number.isFinite(rawRating) ? rawRating : 0);
        } catch (error) {
          // refined error handling can go here
        }
      };

      fetchBalance();

      return () => {
        active = false;
      };
    }, [role, user?.average_rating, user?.avg_rating, user?.rating])
  );

  const handleViewWallet = () => {
    if (role === ROLES.MECH) {
      navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'wallet' });
      return;
    }

    navigation.navigate(ROUTES.CAR_OWNER_REWARDS);
  };

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

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.heading}>User profile</AppText>
        </View>

        <View style={styles.userBlock}>
          <View style={styles.avatar}>
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            ) : (
              <AppText style={styles.avatarText}>{initials}</AppText>
            )}
          </View>
          <AppText variant="subtitle" style={styles.name}>
            {profile.fullName}
          </AppText>
          {profile.email ? (
            <View style={styles.emailRow}>
              <HugeiconsIcon icon={Mail01Icon} size={16} color={darkTheme.colors.muted} strokeWidth={1.9} />
              <AppText variant="muted" style={styles.email}>
                {maskEmail(profile.email)}
              </AppText>
            </View>
          ) : null}

          <AppButton
            label="Edit profile"
            onPress={() =>
              navigation.navigate(role === ROLES.MECH ? ROUTES.MECH_EDIT_PROFILE : ROUTES.CAR_OWNER_EDIT_PROFILE)
            }
            style={styles.editButton}
            textStyle={styles.editButtonText}
            icon={Edit01Icon}
            iconSize={16}
            iconColor={darkTheme.colors.accent}
          />
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View>
              <AppText variant="muted" style={styles.walletLabel}>
                Wallet balance
              </AppText>
              <AppText style={styles.walletAmount}>{formatCurrency(walletBalance)}</AppText>
            </View>

            <AppButton
              label="View wallet"
              onPress={handleViewWallet}
              style={styles.walletCta}
              textStyle={styles.walletCtaText}
              icon={Wallet01Icon}
              iconSize={15}
              iconColor="#1A1A1A"
            />
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <View style={styles.chipContent}>
                <View style={styles.chipIconBadge}>
                  <HugeiconsIcon icon={Briefcase01Icon} size={14} color={darkTheme.colors.accent} strokeWidth={2} />
                </View>
                <View style={styles.chipTextColumn}>
                  <AppText style={styles.chipValue}>{totalJobs}</AppText>
                  <AppText variant="muted" style={styles.chipLabel}>
                    Total jobs
                  </AppText>
                </View>
              </View>
            </View>
            <View style={styles.chip}>
              <View style={styles.chipContent}>
                <View style={styles.chipIconBadge}>
                  <HugeiconsIcon icon={StarIcon} size={14} color={darkTheme.colors.accent} strokeWidth={2} />
                </View>
                <View style={styles.chipTextColumn}>
                  <AppText style={styles.chipValue}>{rating ? rating.toFixed(1) : '0.0'}</AppText>
                  <AppText variant="muted" style={styles.chipLabel}>
                    Ratings
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        </View>

        <AppText style={styles.settingsTitle}>Settings</AppText>
        <View style={styles.settingsCard}>
          {settingsRows.map((row, index) => (
            <SettingRow
              key={row.key}
              label={row.label}
              icon={row.icon}
              isLast={index === settingsRows.length - 1}
              onPress={() =>
                row.key === 'help'
                  ? navigation.navigate(ROUTES.SUPPORT)
                  : row.key === 'service_pricing'
                    ? navigation.navigate(ROUTES.MECH_SERVICE_PRICING)
                  : row.key === 'change_password'
                    ? navigation.navigate(ROUTES.CHANGE_PASSWORD)
                  : row.key === 'notifications'
                    ? navigation.navigate('Notifications')
                  : navigation.navigate('Placeholder', { title: row.label })
              }
            />
          ))}
        </View>

        <AppButton
          label={isSigningOut ? 'Logging out...' : 'Logout'}
          onPress={handleSignOut}
          disabled={isSigningOut || isLoading}
          left={isSigningOut ? <ActivityIndicator size="small" color="#FF7B8A" /> : null}
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: darkTheme.spacing.xxl,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  userBlock: {
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(226,255,49,0.22)',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
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
    color: darkTheme.colors.accent,
    fontSize: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  name: {
    color: darkTheme.colors.text,
    marginTop: 10,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  emailRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  email: {
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  editButton: {
    marginTop: 14,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    minHeight: 42,
    paddingHorizontal: 26,
    borderRadius: 20,
  },
  editButtonText: {
    color: darkTheme.colors.accent,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  walletCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    marginBottom: 18,
  },
  walletTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: darkTheme.spacing.sm,
  },
  walletLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  walletAmount: {
    color: darkTheme.colors.text,
    marginTop: 4,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  walletCta: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  walletCtaText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  chipsRow: {
    marginTop: 14,
    flexDirection: 'row',
    columnGap: 10,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
  },
  chipIconBadge: {
    height: 24,
    width: 24,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTextColumn: {
    flex: 1,
  },
  chipLabel: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  chipValue: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    lineHeight: 20,
  },
  settingsTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
    marginBottom: 10,
  },
  settingsCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 18,
    overflow: 'hidden',
  },
  settingRow: {
    minHeight: 60,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '300',
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,77,109,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.55)',
  },
  logoutText: {
    color: '#FF7B8A',
    fontSize: 15,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default UserProfileScreen;
