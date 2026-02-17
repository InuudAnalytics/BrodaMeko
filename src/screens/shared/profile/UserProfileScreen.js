import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
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
import { useAuth } from '../../../context';
import { getWalletBalance } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const MOCK_USER = {
  fullName: 'Saheed Niyi',
  email: 'saheedniyi@gmail.com',
};

const SETTINGS_ROWS = [
  { key: 'personal', label: 'Personal information', icon: User02Icon },
  { key: 'security', label: 'Security', icon: ShieldUserIcon },
  { key: 'notifications', label: 'Notifications', icon: Notification01Icon },
  { key: 'help', label: 'Help & Support', icon: HelpCircleIcon },
];

const readUser = (user) => {
  const fullName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    MOCK_USER.fullName;
  const email = user?.email || MOCK_USER.email;

  return {
    fullName: String(fullName || MOCK_USER.fullName),
    email: String(email || MOCK_USER.email),
  };
};

const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `#${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
  const { user, signOut } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);

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

      const fetchBalance = async () => {
        try {
          const response = await getWalletBalance();
          if (active && response.success) {
            setWalletBalance(response.data?.balance || 0);
          }
        } catch (error) {
          // refined error handling can go here
        }
      };

      fetchBalance();

      return () => {
        active = false;
      };
    }, [])
  );

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
            <AppText style={styles.avatarText}>{initials}</AppText>
          </View>
          <AppText variant="subtitle" style={styles.name}>
            {profile.fullName}
          </AppText>
          <View style={styles.emailRow}>
            <HugeiconsIcon icon={Mail01Icon} size={16} color={darkTheme.colors.muted} strokeWidth={1.9} />
            <AppText variant="muted" style={styles.email}>
              {profile.email}
            </AppText>
          </View>

          <AppButton
            label="Edit profile"
            onPress={() => navigation.navigate(ROUTES.CAR_OWNER_EDIT_PROFILE)}
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
              onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REWARDS)}
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
                  <AppText style={styles.chipValue}>12</AppText>
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
                  <AppText style={styles.chipValue}>4.8</AppText>
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
          {SETTINGS_ROWS.map((row, index) => (
            <SettingRow
              key={row.key}
              label={row.label}
              icon={row.icon}
              isLast={index === SETTINGS_ROWS.length - 1}
              onPress={() => navigation.navigate('Placeholder', { title: row.label })}
            />
          ))}
        </View>

        <AppButton
          label="Logout"
          onPress={signOut}
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
