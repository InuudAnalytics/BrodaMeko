import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Alert01Icon,
  BankIcon,
  Briefcase01Icon,
  Cancel01Icon,
  Edit01Icon,
  HelpCircleIcon,
  Location01Icon,
  Logout02Icon,
  Notification01Icon,
  StarIcon,
  User02Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import {
  addRecoveryEmail as addRecoveryEmailService,
  deleteAccount as deleteAccountService,
  removeRecoveryEmail as removeRecoveryEmailService,
  verifyRecoveryEmail as verifyRecoveryEmailService,
} from '../../../services/auth.service';
import { getCarOwnerJobs, getMechanicAssignedJobs, getMechanicJobStats } from '../../../services/jobs.service';
import { getSellerOrders } from '../../../services/spareParts.service';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';
import { LOCATION_ENABLED } from '../../../config/featureFlags';

const LOCATION_PERMISSION = Platform.OS === 'ios'
  ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
  : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

const getSettingsRows = (role) => {
  const rows = [
    { key: 'personal', label: 'Personal information', icon: User02Icon },
    { key: 'bank', label: 'Bank details', icon: BankIcon },
    { key: 'recovery_email', label: 'Recovery email', icon: Alert01Icon },
  ];

  if (role === ROLES.MECH || role === ROLES.SPARE_PARTS_SELLER) {
    rows.push({ key: 'address', label: 'Address', icon: Location01Icon });
  }

  if (role === ROLES.MECH) {
    rows.push({ key: 'services', label: 'Services offered', icon: Wrench01Icon });
  }

  if (role === ROLES.MECH || role === ROLES.SPARE_PARTS_SELLER) {
    rows.push({ key: 'reviews', label: 'View reviews', icon: StarIcon });
  }

  rows.push(
    { key: 'notifications', label: 'Notifications', icon: Notification01Icon },
  );

  if (LOCATION_ENABLED) {
    rows.push({ key: 'location', label: 'Location', icon: Location01Icon });
  }

  rows.push(
    { key: 'legal_documents', label: 'Legal documents', icon: Briefcase01Icon },
    { key: 'help', label: 'Help & Support', icon: HelpCircleIcon },
    { key: 'logout', label: 'Logout', icon: Logout02Icon, tone: 'danger' }
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

const SettingRow = ({ label, icon, onPress, isLast, tone }) => {
  const isDanger = tone === 'danger';
  const iconColor = isDanger ? '#FF7B8A' : 'rgba(255,255,255,0.42)';
  const labelStyle = isDanger ? styles.settingLabelDanger : styles.settingLabel;

  return (
    <TouchableOpacity
      style={[styles.settingRow, isDanger ? styles.settingRowDanger : null, isLast ? styles.settingRowLast : null]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <HugeiconsIcon icon={icon} size={20} color={iconColor} strokeWidth={1.9} />
        <AppText style={labelStyle}>{label}</AppText>
      </View>
      <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="rgba(255,255,255,0.42)" strokeWidth={2.1} />
    </TouchableOpacity>
  );
};

const LocationToggleRow = ({ isGranted, onToggle, isLast }) => (
  <View style={[styles.settingRow, isLast ? styles.settingRowLast : null]}>
    <View style={styles.settingLeft}>
      <HugeiconsIcon icon={Location01Icon} size={20} color="rgba(255,255,255,0.42)" strokeWidth={1.9} />
      <AppText style={styles.settingLabel}>Location</AppText>
    </View>
    <Switch
      value={isGranted}
      onValueChange={onToggle}
      trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(230,199,20,0.55)' }}
      thumbColor={isGranted ? darkTheme.colors.accent : 'rgba(255,255,255,0.55)'}
    />
  </View>
);

const UserProfileScreen = ({ navigation, onBack }) => {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const { user, role, signOut, isLoading, refreshUserProfile } = useAuth();
  const [totalJobs, setTotalJobs] = useState(0);
  const [rating, setRating] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [recoveryOtpInput, setRecoveryOtpInput] = useState('');
  const [recoveryStatusText, setRecoveryStatusText] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isRecoveryBusy, setIsRecoveryBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [showLocationOffModal, setShowLocationOffModal] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const totalCountLabel = role === ROLES.SPARE_PARTS_SELLER ? 'Total orders' : 'Total jobs';

  const profile = readUser(user);
  const initials = profile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';
  const currentRecoveryEmail = String(user?.recovery_email || user?.recoveryEmail || '').trim();
  const currentRecoveryVerified = Boolean(
    user?.recovery_email_verified ?? user?.recoveryEmailVerified ?? false
  );

  useEffect(() => {
    if (!LOCATION_ENABLED) return;

    const syncPermission = async () => {
      try {
        const result = await check(LOCATION_PERMISSION);
        setLocationGranted(result === RESULTS.GRANTED || result === RESULTS.LIMITED);
      } catch (_) {}
    };

    syncPermission();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current !== 'active' && nextState === 'active') {
        syncPermission();
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, []);

  const handleLocationToggle = useCallback(async (value) => {
    if (!value) {
      setShowLocationOffModal(true);
      return;
    }
    try {
      const current = await check(LOCATION_PERMISSION);
      console.log('[Location] check result:', current);
      if (current === RESULTS.BLOCKED) {
        setShowLocationOffModal(true);
        return;
      }
      const result = await request(LOCATION_PERMISSION);
      console.log('[Location] request result:', result);
      const granted = result === RESULTS.GRANTED || result === RESULTS.LIMITED;
      setLocationGranted(granted);
      if (!granted) {
        setShowLocationOffModal(true);
      }
    } catch (e) {
      console.log('[Location] toggle error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchStats = async () => {
        try {
          const mechanicId = String(user?.id || user?._id || user?.mechanic_id || '').trim();
          if (role === ROLES.SPARE_PARTS_SELLER) {
            const ordersResponse = await getSellerOrders();
            if (!active) {
              return;
            }
            const ordersPayload = ordersResponse?.data || ordersResponse || {};
            const ordersList = Array.isArray(ordersPayload?.data)
              ? ordersPayload.data
              : Array.isArray(ordersPayload)
                ? ordersPayload
                : [];
            setTotalJobs(Number(ordersPayload?.count || ordersPayload?.total || ordersList.length || 0));
          } else {
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
          }

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

  const handleDeleteAccount = async () => {
    if (isDeleting) {
      return;
    }

    const password = String(deletePassword || '').trim();
    if (!password) {
      setDeleteError('Password is required.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteAccountService({ password });
      await signOut();
      setShowDeleteModal(false);
      setDeletePassword('');
    } catch (error) {
      setDeleteError(error?.message || 'Could not delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenRecoveryModal = () => {
    setRecoveryEmailInput(currentRecoveryEmail);
    setRecoveryOtpInput('');
    setRecoveryError('');
    setRecoveryStatusText('');
    setShowRecoveryModal(true);
  };

  const handleSendRecoveryOtp = async () => {
    const safeEmail = String(recoveryEmailInput || '').trim().toLowerCase();
    if (!safeEmail) {
      setRecoveryError('Recovery email is required.');
      return;
    }

    setIsRecoveryBusy(true);
    setRecoveryError('');
    setRecoveryStatusText('');

    try {
      const response = await addRecoveryEmailService({ recoveryEmail: safeEmail });
      setRecoveryStatusText(response?.message || 'OTP sent to recovery email.');
      await refreshUserProfile?.();
    } catch (error) {
      setRecoveryError(error?.message || 'Could not add recovery email.');
    } finally {
      setIsRecoveryBusy(false);
    }
  };

  const handleVerifyRecoveryOtp = async () => {
    const safeOtp = String(recoveryOtpInput || '').trim();
    if (!safeOtp) {
      setRecoveryError('OTP is required.');
      return;
    }

    setIsRecoveryBusy(true);
    setRecoveryError('');
    setRecoveryStatusText('');

    try {
      const response = await verifyRecoveryEmailService({ otp: safeOtp });
      setRecoveryStatusText(response?.message || 'Recovery email verified.');
      setRecoveryOtpInput('');
      await refreshUserProfile?.();
    } catch (error) {
      setRecoveryError(error?.message || 'Could not verify recovery email.');
    } finally {
      setIsRecoveryBusy(false);
    }
  };

  const handleRemoveRecoveryEmail = async () => {
    setIsRecoveryBusy(true);
    setRecoveryError('');
    setRecoveryStatusText('');

    try {
      const response = await removeRecoveryEmailService();
      setRecoveryEmailInput('');
      setRecoveryOtpInput('');
      setRecoveryStatusText(response?.message || 'Recovery email removed.');
      await refreshUserProfile?.();
    } catch (error) {
      setRecoveryError(error?.message || 'Could not remove recovery email.');
    } finally {
      setIsRecoveryBusy(false);
    }
  };

  const handlePersonalInfo = () => {
    if (role === ROLES.MECH) {
      navigation.navigate(ROUTES.MECH_EDIT_PROFILE);
      return;
    }
    if (role === ROLES.SPARE_PARTS_SELLER) {
      navigation.navigate(ROUTES.SPARE_PARTS_PERSONAL_INFO);
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
    if (target === 'disputes') {
      navigation.navigate(ROUTES.DISPUTES);
      return;
    }
    if (target === 'chat') {
      navigation.navigate(ROUTES.SUPPORT_CHAT);
      return;
    }
    navigation.navigate(ROUTES.PRIVACY_POLICY);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.contentTablet]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => {
              if (onBack) {
                onBack();
                return;
              }
              navigation.goBack();
            }}
          >
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
              <AppText style={styles.statLabel}>{totalCountLabel}</AppText>
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
          {getSettingsRows(role).map((row, index, array) => {
            const isLast = index === array.length - 1;
            if (row.key === 'location') {
              return (
                <LocationToggleRow
                  key="location"
                  isGranted={locationGranted}
                  onToggle={handleLocationToggle}
                  isLast={isLast}
                />
              );
            }
            return (
            <SettingRow
              key={row.key}
              label={row.key === 'logout' && isSigningOut ? 'Logging out...' : row.label}
              icon={row.icon}
              tone={row.tone}
              isLast={isLast}
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
                  navigation.navigate(ROUTES.PROFILE_BANK_DETAILS);
                  return;
                }
                if (row.key === 'recovery_email') {
                  handleOpenRecoveryModal();
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
                  return;
                }
                if (row.key === 'services') {
                  navigation.navigate(ROUTES.MECH_SET_SERVICES);
                  return;
                }
                if (row.key === 'reviews') {
                  navigation.navigate(ROUTES.USER_REVIEWS);
                  return;
                }
                if (row.key === 'notifications') {
                  navigation.navigate('Notifications');
                  return;
                }
                if (row.key === 'legal_documents') {
                  navigation.navigate(ROUTES.PRIVACY_POLICY, { documentType: 'privacy' });
                  return;
                }
                if (row.key === 'logout') {
                  if (isSigningOut) {
                    return;
                  }
                  handleSignOut();
                }
              }}
            />
            );
          })}
        </View>

        <AppButton
          label={isDeleting ? 'Deleting...' : 'Delete my account'}
          onPress={() => {
            setShowDeleteModal(true);
            setDeleteError('');
          }}
          disabled={isDeleting || isLoading}
          left={
            isDeleting ? (
              <ActivityIndicator size="small" color="#C73B4A" />
            ) : (
              <HugeiconsIcon icon={Alert01Icon} size={16} color="#C73B4A" strokeWidth={2} />
            )
          }
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
            <SettingRow label="My disputes" icon={Alert01Icon} onPress={() => handleSupportAction('disputes')} />
            <SettingRow label="Chat with BrodaMeko" icon={Notification01Icon} onPress={() => handleSupportAction('chat')} />
            <SettingRow label="Privacy policy" icon={User02Icon} onPress={() => handleSupportAction('privacy')} isLast />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRecoveryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecoveryModal(false)}
      >
        <View style={styles.deleteModalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowRecoveryModal(false)} />
          <View style={styles.recoveryCard}>
            <AppText style={styles.recoveryTitle}>Recovery email</AppText>
            <AppText style={styles.recoverySubtitle}>
              Add a backup email for password recovery.
            </AppText>

            <View style={styles.recoveryStatusRow}>
              <AppText style={styles.recoveryStatusLabel}>Current</AppText>
              <AppText style={styles.recoveryStatusValue}>
                {currentRecoveryEmail || 'Not set'}
              </AppText>
              <AppText style={styles.recoveryStatusBadge}>
                {currentRecoveryVerified ? 'Verified' : currentRecoveryEmail ? 'Pending verification' : 'None'}
              </AppText>
            </View>

            <AppInput
              value={recoveryEmailInput}
              onChangeText={(value) => {
                setRecoveryEmailInput(value);
                setRecoveryError('');
                setRecoveryStatusText('');
              }}
              placeholder="Enter recovery email"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <AppButton
              label={isRecoveryBusy ? 'Sending...' : 'Send OTP'}
              onPress={handleSendRecoveryOtp}
              disabled={isRecoveryBusy}
              style={styles.recoveryActionButton}
            />

            <AppInput
              value={recoveryOtpInput}
              onChangeText={(value) => {
                setRecoveryOtpInput(value);
                setRecoveryError('');
                setRecoveryStatusText('');
              }}
              placeholder="Enter OTP"
              keyboardType="number-pad"
            />

            <AppButton
              label={isRecoveryBusy ? 'Verifying...' : 'Verify OTP'}
              onPress={handleVerifyRecoveryOtp}
              disabled={isRecoveryBusy}
              style={styles.recoveryActionButton}
            />

            {currentRecoveryEmail ? (
              <TouchableOpacity
                style={styles.recoveryRemoveBtn}
                activeOpacity={0.85}
                onPress={handleRemoveRecoveryEmail}
                disabled={isRecoveryBusy}
              >
                <AppText style={styles.recoveryRemoveText}>
                  {isRecoveryBusy ? 'Working...' : 'Remove recovery email'}
                </AppText>
              </TouchableOpacity>
            ) : null}

            {recoveryStatusText ? <AppText style={styles.recoverySuccess}>{recoveryStatusText}</AppText> : null}
            {recoveryError ? <AppText style={styles.recoveryError}>{recoveryError}</AppText> : null}

            <TouchableOpacity
              style={styles.cancelDeleteBtn}
              activeOpacity={0.85}
              onPress={() => setShowRecoveryModal(false)}
            >
              <AppText style={styles.cancelDeleteText}>Close</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)} />
          <View style={styles.deleteCard}>
            <AppText style={styles.deleteTitle}>Delete account?</AppText>
            <AppText style={styles.deleteSubtitle}>Input your password if you want to</AppText>

            <AppInput
              value={deletePassword}
              onChangeText={(value) => {
                setDeletePassword(value);
                setDeleteError('');
              }}
              placeholder="Enter password"
              secureTextEntry
            />

            {deleteError ? <AppText style={styles.deleteError}>{deleteError}</AppText> : null}

            <View style={styles.deleteActions}>
              <AppButton
                label={isDeleting ? 'Deleting...' : 'Delete'}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                style={styles.deleteButton}
              />
              <TouchableOpacity
                style={styles.cancelDeleteBtn}
                activeOpacity={0.85}
                onPress={() => setShowDeleteModal(false)}
              >
                <AppText style={styles.cancelDeleteText}>Cancel</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showLocationOffModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationOffModal(false)}
      >
        <View style={styles.deleteModalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLocationOffModal(false)} />
          <View style={styles.deleteCard}>
            <AppText style={styles.deleteTitle}>Manage location access</AppText>
            <AppText style={styles.deleteSubtitle}>
              Location permissions can only be changed from your phone's Settings. Tap below to open Settings and set access to "Allow" or "Ask every time" — then come back and tap the toggle once more to confirm.
            </AppText>
            <View style={styles.deleteActions}>
              <AppButton
                label="Open Settings"
                onPress={() => {
                  setShowLocationOffModal(false);
                  Linking.openSettings();
                }}
              />
              <TouchableOpacity
                style={styles.cancelDeleteBtn}
                activeOpacity={0.85}
                onPress={() => setShowLocationOffModal(false)}
              >
                <AppText style={styles.cancelDeleteText}>Cancel</AppText>
              </TouchableOpacity>
            </View>
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
  contentTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
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
  settingRowDanger: {
    borderBottomColor: 'rgba(255,123,138,0.25)',
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
  settingLabelDanger: {
    color: '#FF7B8A',
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
  deleteModalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deleteCard: {
    backgroundColor: '#11112E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  deleteTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  deleteSubtitle: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteActions: {
    marginTop: 6,
  },
  deleteButton: {
    backgroundColor: 'rgba(207,61,61,0.9)',
  },
  cancelDeleteBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelDeleteText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  deleteError: {
    color: '#FF7B8A',
    marginTop: -6,
    marginBottom: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  recoveryCard: {
    backgroundColor: '#11112E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  recoveryTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  recoverySubtitle: {
    marginTop: 6,
    marginBottom: 12,
    color: darkTheme.colors.muted,
    textAlign: 'center',
    fontSize: 13,
  },
  recoveryStatusRow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  recoveryStatusLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  recoveryStatusValue: {
    marginTop: 2,
    color: darkTheme.colors.text,
    fontSize: 13,
  },
  recoveryStatusBadge: {
    marginTop: 3,
    color: darkTheme.colors.accent,
    fontSize: 12,
  },
  recoveryActionButton: {
    marginTop: 10,
    minHeight: 42,
  },
  recoveryRemoveBtn: {
    marginTop: 10,
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,123,138,0.48)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryRemoveText: {
    color: '#FF7B8A',
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  recoverySuccess: {
    marginTop: 10,
    color: '#85E786',
    fontSize: 12,
    textAlign: 'center',
  },
  recoveryError: {
    marginTop: 10,
    color: '#FF7B8A',
    fontSize: 12,
    textAlign: 'center',
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

