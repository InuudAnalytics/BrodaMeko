import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import {
  addMechanicBank,
  deleteMechanicBank,
  getMechanicBankList,
  setPrimaryMechanicBank,
  verifyMechanicBank,
} from '../../../services/mechanic.service';
import { darkTheme } from '../../../theme';
import { getNextOnboardingRoute, getOnboardingStepIndex, ROUTES } from '../../../utils';

const BankDetailsScreen = ({ navigation, route }) => {
  const { mechanicProfile, setBankDetails, completedSteps } = useMechanicProfile();
  const existing = mechanicProfile.bankDetails || {};

  const [accountName, setAccountName] = useState(existing.accountName || '');
  const [accountNumber, setAccountNumber] = useState(existing.accountNumber || '');
  const [bankName, setBankName] = useState(existing.bankName || '');
  const [bankCode, setBankCode] = useState('');
  const [banks, setBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankActionId, setBankActionId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const isOnboarding = Boolean(route?.params?.onboarding);
  const skippedSteps = route?.params?.skippedSteps || [];
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_BANK_DETAILS);
  const progressPercent = useMemo(() => (stepIndex / 4) * 100, [stepIndex]);

  const isValid = useMemo(
    () => {
      const normalizedNumber = String(accountNumber || '').replace(/\D/g, '');
      const hasAllFields =
        String(accountName).trim().length > 0 &&
        String(bankName).trim().length > 0 &&
        normalizedNumber.length >= 10;

      return hasAllFields;
    },
    [accountName, accountNumber, bankName]
  );

  const fetchBanks = React.useCallback(async () => {
    setLoadingBanks(true);
    setError('');

    try {
      const response = await getMechanicBankList();
      const payload = response?.data || response || {};
      const items = Array.isArray(payload) ? payload : (payload?.banks || payload?.items || payload?.results || []);
      setBanks(items);
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load bank list.');
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const getBankId = (bank) => String(bank?.id || bank?._id || bank?.bank_id || '').trim();

  const handleVerify = async () => {
    if (!bankName.trim() || String(accountNumber || '').replace(/\D/g, '').length < 10) {
      setError('Select a bank and enter a valid account number.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      await verifyMechanicBank({
        account_number: String(accountNumber || '').replace(/\D/g, ''),
        bank_name: String(bankName || '').trim(),
      });
      setVerified(true);
    } catch (verifyError) {
      setVerified(false);
      setError(verifyError?.message || 'Bank verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = () => {
    if (!isValid) {
      Alert.alert('Invalid details', 'Enter account name, bank name and a valid account number (10+ digits).');
      return;
    }
    if (!verified) {
      Alert.alert('Verify details', 'Please verify your bank details before continuing.');
      return;
    }

    const saveBank = async () => {
      setSaving(true);
      setError('');

      try {
        await addMechanicBank({
          account_name: String(accountName).trim(),
          account_number: String(accountNumber).replace(/\D/g, ''),
          bank_code: String(bankCode || '').trim(),
          bank_name: String(bankName).trim(),
        });

        setBankDetails({
          accountName: String(accountName).trim(),
          accountNumber: String(accountNumber).replace(/\D/g, ''),
          bankName: String(bankName).trim(),
        });
        await fetchBanks();

        if (isOnboarding) {
          const { nextRoute, nextSkipped } = getNextOnboardingRoute({
            currentRoute: ROUTES.MECH_BANK_DETAILS,
            completedSteps: { ...completedSteps, bank: true },
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
      } catch (saveError) {
        setError(saveError?.message || 'Could not save bank details.');
      } finally {
        setSaving(false);
      }
    };

    saveBank();
  };

  const handleSetPrimary = (bank) => {
    const bankId = getBankId(bank);

    if (!bankId) {
      Alert.alert('Action unavailable', 'Bank id is missing.');
      return;
    }

    const makePrimary = async () => {
      setBankActionId(bankId);
      try {
        await setPrimaryMechanicBank(bankId);
        Alert.alert('Success', 'Primary bank updated.');
        await fetchBanks();
      } catch (actionError) {
        Alert.alert('Error', actionError?.message || 'Could not set primary bank.');
      } finally {
        setBankActionId('');
      }
    };

    makePrimary();
  };

  const handleDeleteBank = (bank) => {
    const bankId = getBankId(bank);

    if (!bankId) {
      Alert.alert('Action unavailable', 'Bank id is missing.');
      return;
    }

    Alert.alert('Delete bank', 'Are you sure you want to delete this bank?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBankActionId(bankId);
          try {
            await deleteMechanicBank(bankId);
            Alert.alert('Deleted', 'Bank removed.');
            await fetchBanks();
          } catch (actionError) {
            Alert.alert('Error', actionError?.message || 'Could not delete bank.');
          } finally {
            setBankActionId('');
          }
        },
      },
    ]);
  };

  const handleSkipNext = () => {
    const nextSkipped = Array.from(new Set([...skippedSteps, ROUTES.MECH_BANK_DETAILS]));
    const { nextRoute, nextSkipped: resolvedSkipped } = getNextOnboardingRoute({
      currentRoute: ROUTES.MECH_BANK_DETAILS,
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

        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          <AppText style={styles.helper}>Please upload a correct bank details</AppText>
          <AppText style={styles.stepLabel}>Step {stepIndex} of 4</AppText>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <AppInput
            label="Account name"
            value={accountName}
            onChangeText={setAccountName}
            placeholder="John Doe"
            autoCapitalize="words"
          />

          <AppInput
            label="Account number"
            value={accountNumber}
            onChangeText={(value) => {
              setAccountNumber(value);
              setVerified(false);
            }}
            placeholder="0123456789"
            keyboardType="number-pad"
          />

          <AppInput
            label="Bank name"
            value={bankName}
            onChangeText={(value) => {
              setBankName(value);
              setVerified(false);
            }}
            placeholder="GTBank"
            autoCapitalize="words"
          />

          {loadingBanks ? <ActivityIndicator size="small" color={darkTheme.colors.accent} /> : null}

          {banks.length ? (
            <View style={styles.bankList}>
              {banks.slice(0, 8).map((bank, index) => {
                const itemName = String(bank?.name || bank?.bank_name || '').trim();
                const itemCode = String(bank?.code || bank?.bank_code || '').trim();
                const key = `${itemName}-${itemCode}-${index}`;
                const active = itemName.toLowerCase() === bankName.toLowerCase();

                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.85}
                    style={[styles.bankChip, active ? styles.bankChipActive : null]}
                    onPress={() => {
                      setBankName(itemName);
                      setBankCode(itemCode);
                      setVerified(false);
                    }}
                  >
                    <AppText style={[styles.bankChipText, active ? styles.bankChipTextActive : null]}>{itemName}</AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {banks.length ? (
            <View style={styles.savedBanksWrap}>
              <AppText style={styles.savedBanksTitle}>Saved banks</AppText>
              {banks.map((bank, index) => {
                const bankId = getBankId(bank) || String(index);
                const bankItemName = String(bank?.name || bank?.bank_name || bank?.bankName || 'Bank').trim();
                const account = String(bank?.account_number || bank?.accountNumber || '').trim();
                const accountNameValue = String(bank?.account_name || bank?.accountName || '').trim();
                const isPrimary = Boolean(bank?.is_primary || bank?.primary || bank?.isPrimary);
                const isActing = bankActionId === bankId;

                return (
                  <View key={`saved-${bankId}-${index}`} style={styles.savedBankItem}>
                    <View style={styles.savedBankInfo}>
                      <AppText style={styles.savedBankName}>{bankItemName}</AppText>
                      <AppText style={styles.savedBankMeta}>{accountNameValue || 'Account name unavailable'}</AppText>
                      <AppText style={styles.savedBankMeta}>{account || 'Account number unavailable'}</AppText>
                      {isPrimary ? <AppText style={styles.primaryBadge}>Primary</AppText> : null}
                    </View>
                    <View style={styles.savedBankActions}>
                      <TouchableOpacity
                        style={styles.bankActionBtn}
                        activeOpacity={0.85}
                        onPress={() => handleSetPrimary(bank)}
                        disabled={isActing || isPrimary}
                      >
                        {isActing ? (
                          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
                        ) : (
                          <AppText style={styles.bankActionText}>Set primary</AppText>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.bankActionBtn, styles.bankDeleteBtn]}
                        activeOpacity={0.85}
                        onPress={() => handleDeleteBank(bank)}
                        disabled={isActing}
                      >
                        <AppText style={styles.bankDeleteText}>Delete</AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <AppButton
            label={verifying ? 'Verifying...' : verified ? 'Verified' : 'Verify account'}
            onPress={handleVerify}
            style={styles.verifyBtn}
            disabled={verifying || verified}
            left={verifying ? <ActivityIndicator size="small" color="#1A1A1A" /> : null}
          />

          <AppButton
            label={saving ? 'Saving...' : 'Save & continue'}
            onPress={handleSave}
            style={styles.saveBtn}
            disabled={saving}
            left={saving ? <ActivityIndicator size="small" color="#1A1A1A" /> : null}
          />

          {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

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
        </ScrollView>
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
  formContent: {
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
  helper: {
    marginTop: 14,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 6,
  },
  stepLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  bankList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  savedBanksWrap: {
    marginTop: 14,
    rowGap: 8,
  },
  savedBanksTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  savedBankItem: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    rowGap: 10,
  },
  savedBankInfo: {
    rowGap: 2,
  },
  savedBankName: {
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  savedBankMeta: {
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  primaryBadge: {
    marginTop: 3,
    alignSelf: 'flex-start',
    color: darkTheme.colors.accent,
    fontSize: 11,
  },
  savedBankActions: {
    flexDirection: 'row',
    columnGap: 8,
  },
  bankActionBtn: {
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    borderRadius: 8,
    minHeight: 32,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankActionText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
  },
  bankDeleteBtn: {
    borderColor: '#FF7F7F',
  },
  bankDeleteText: {
    color: '#FF7F7F',
    fontSize: 12,
  },
  bankChip: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  bankChipActive: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(226,255,49,0.15)',
  },
  bankChipText: {
    color: darkTheme.colors.text,
    fontSize: 12,
  },
  bankChipTextActive: {
    color: darkTheme.colors.accent,
  },
  verifyBtn: {
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 10,
  },
  errorText: {
    marginTop: 10,
    color: '#FF7F7F',
  },
  skipRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  skipText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
});

export default BankDetailsScreen;
