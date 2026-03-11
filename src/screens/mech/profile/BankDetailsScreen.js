import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowDown01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useAuth, useMechanicProfile } from '../../../context';
import { addMechanicBank, getMechanicBankList, verifyMechanicBank } from '../../../services/mechanic.service';
import { darkTheme, withAlpha } from '../../../theme';
import { getOnboardingStepIndex, MECH_ONBOARDING_STEPS, ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';
const normalizeBankItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.banks)) {
    return payload.banks;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};

const sanitizeDigits = (value) => String(value || '').replace(/\D/g, '');

const BankDetailsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { mechanicProfile, setBankDetails, completedSteps } = useMechanicProfile();

  const existing = mechanicProfile.bankDetails || {};
  const isOnboarding = Boolean(route?.params?.onboarding);
  const bankFromUser = useMemo(() => {
    const rawList = user?.bank_details || user?.bankDetails;
    const raw =
      (Array.isArray(rawList) ? rawList[0] : null) ||
      user?.bank ||
      user?.bank_account ||
      user?.bankAccount ||
      user?.bank_info ||
      {};

    // TODO: Confirm /auth/me bank fields with backend and map explicitly.
    return {
      id: String(raw?.id || raw?._id || '').trim(),
      bankName: String(raw?.bank_name || raw?.bankName || raw?.name || '').trim(),
      accountNumber: String(raw?.account_number || raw?.accountNumber || '').trim(),
      accountName: String(raw?.account_name || raw?.accountName || '').trim(),
      bvn: String(raw?.bvn || raw?.bvn_number || '').trim(),
    };
  }, [user]);
  const [didSeed, setDidSeed] = useState(false);

  const [allBanks, setAllBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState(existing.bankName || bankFromUser.bankName || '');
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const [accountNumber, setAccountNumber] = useState(existing.accountNumber || bankFromUser.accountNumber || '');
  const [accountName, setAccountName] = useState(existing.accountName || bankFromUser.accountName || '');
  const [bvn, setBvn] = useState(bankFromUser.bvn || '');
  const [nin, setNin] = useState('');

  const [fetchError, setFetchError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [savingError, setSavingError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_BANK_DETAILS);
  const totalSteps = MECH_ONBOARDING_STEPS.length;
  const progressPercent = useMemo(() => (stepIndex / totalSteps) * 100, [stepIndex, totalSteps]);

  const verifyDebounce = React.useRef(null);

  useEffect(() => {
    if (!isOnboarding) {
      return;
    }

    if (!completedSteps.address) {
      AppAlert.alert('Complete previous step', 'Please add your address first.');
      navigation.replace(ROUTES.MECH_PROFILE_SETUP);
    }
  }, [completedSteps.address, isOnboarding, navigation]);

  useEffect(() => {
    if (didSeed) {
      return;
    }
    if (!isOnboarding) {
      if (!bankSearch && bankFromUser.bankName) {
        setBankSearch(bankFromUser.bankName);
      }
      if (!accountNumber && bankFromUser.accountNumber) {
        setAccountNumber(bankFromUser.accountNumber);
      }
      if (!accountName && bankFromUser.accountName) {
        setAccountName(bankFromUser.accountName);
      }
      if (!bvn && bankFromUser.bvn) {
        setBvn(bankFromUser.bvn);
      }
      setDidSeed(true);
    }
  }, [accountName, accountNumber, bankFromUser, bankSearch, bvn, didSeed, isOnboarding]);

  const filteredBanks = useMemo(() => {
    const query = String(bankSearch || '').trim().toLowerCase();
    if (!query) {
      return allBanks.slice(0, 25);
    }

    return allBanks
      .filter((bank) => {
        const name = String(bank?.name || bank?.bank_name || '').toLowerCase();
        return name.includes(query);
      })
      .slice(0, 25);
  }, [allBanks, bankSearch]);

  useEffect(() => {
    const loadBanks = async () => {
      setLoadingBanks(true);
      setFetchError('');

      try {
        const response = await getMechanicBankList();
        const nextBanks = normalizeBankItems(response?.data || response);
        setAllBanks(nextBanks);

        const existingName = String(existing.bankName || '').trim().toLowerCase();
        if (existingName && !selectedBank) {
          const matched = nextBanks.find(
            (bank) => String(bank?.name || bank?.bank_name || '').trim().toLowerCase() === existingName
          );
          if (matched) {
            setSelectedBank(matched);
          }
        }
      } catch (error) {
        setFetchError(error?.message || 'Could not load bank list.');
      } finally {
        setLoadingBanks(false);
      }
    };

    loadBanks();
  }, [existing.bankName, selectedBank]);

  const selectedBankName = String(selectedBank?.name || selectedBank?.bank_name || bankSearch || '').trim();
  const selectedBankCode = String(selectedBank?.code || selectedBank?.bank_code || '').trim();

  const runVerify = useCallback(async () => {
    const cleanAccount = sanitizeDigits(accountNumber);

    if (!selectedBankName || cleanAccount.length !== 10) {
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setSavingError('');

    try {
      const response = await verifyMechanicBank({
        account_number: cleanAccount,
        bank_name: selectedBankName,
      });

      const payload = response?.data || response || {};
      const resolvedName =
        String(payload?.account_name || payload?.data?.account_name || payload?.accountName || payload?.name || '').trim();

      if (!resolvedName) {
        setAccountName('');
        setVerifyError('Could not resolve account name for this bank account.');
        return;
      }

      setAccountName(resolvedName);
      setVerifyError('');
    } catch (error) {
      setAccountName('');
      setVerifyError(error?.message || 'Account verification failed.');
    } finally {
      setVerifying(false);
    }
  }, [accountNumber, selectedBankName]);

  useEffect(() => {
    if (verifyDebounce.current) {
      clearTimeout(verifyDebounce.current);
    }

    const cleanAccount = sanitizeDigits(accountNumber);
    if (!selectedBankName || cleanAccount.length !== 10) {
      return undefined;
    }

    verifyDebounce.current = setTimeout(() => {
      runVerify();
    }, 350);

    return () => {
      if (verifyDebounce.current) {
        clearTimeout(verifyDebounce.current);
      }
    };
  }, [accountNumber, selectedBankName, runVerify]);

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
    setBankSearch(String(bank?.name || bank?.bank_name || '').trim());
    setAccountName('');
    setVerifyError('');
    setShowBankDropdown(false);
  };

  const handleContinue = async () => {
    const cleanAccount = sanitizeDigits(accountNumber);
    const cleanNin = sanitizeDigits(nin);

    if (!selectedBankName) {
      setSavingError('Please select a bank.');
      return;
    }

    if (cleanAccount.length !== 10) {
      setSavingError('Account number must be exactly 10 digits.');
      return;
    }

    if (!String(accountName || '').trim()) {
      setSavingError('Please verify your account number to resolve account name.');
      return;
    }

    if (!cleanNin) {
      setSavingError('NIN is required.');
      return;
    }

    setSaving(true);
    setSavingError('');

    try {
      const response = await addMechanicBank({
        account_name: String(accountName).trim(),
        account_number: cleanAccount,
        bank_code: selectedBankCode,
        bank_name: selectedBankName,
      });

      const payload = response?.data || response || {};
      const savedBank = payload?.bank || payload?.data?.bank || payload;
      const savedBankId = String(savedBank?.id || savedBank?._id || '').trim();
      const savedPrimary = Boolean(savedBank?.is_primary || savedBank?.isPrimary);

      setBankDetails({
        id: savedBankId,
        accountName: String(accountName).trim(),
        accountNumber: cleanAccount,
        bankName: selectedBankName,
        isPrimary: savedPrimary,
      });

      if (isOnboarding) {
        navigation.replace(ROUTES.MECH_SERVICE_PRICING, { onboarding: true });
        return;
      }

      navigation.goBack();
    } catch (error) {
      setSavingError(error?.message || 'Could not save bank details.');
    } finally {
      setSaving(false);
    }
  };

  const handleTemporarySkip = () => {
    const cleanAccount = sanitizeDigits(accountNumber);

    setBankDetails({
      accountName: String(accountName || '').trim() || 'Pending verification',
      accountNumber: cleanAccount || '0000000000',
      bankName: selectedBankName || String(bankSearch || '').trim() || 'Pending bank',
    });

    if (isOnboarding) {
      navigation.replace(ROUTES.MECH_SERVICE_PRICING, { onboarding: true });
      return;
    }

    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>{isOnboarding ? 'Verification screen' : 'Edit bank details'}</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          {isOnboarding ? (
            <>
              <AppText style={styles.helper}>Please upload a correct bank details</AppText>
              <AppText style={styles.stepLabel}>Step {stepIndex} of {totalSteps}</AppText>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </>
          ) : null}

          <AppText style={styles.bankLabel}>Bank name</AppText>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.dropdownTrigger}
            onPress={() => setShowBankDropdown((prev) => !prev)}
          >
            <AppText style={[styles.dropdownTriggerText, !selectedBankName ? styles.dropdownPlaceholder : null]}>
              {selectedBankName || 'Select bank'}
            </AppText>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={18}
              color={darkTheme.colors.muted}
              strokeWidth={2.2}
            />
          </TouchableOpacity>

          {loadingBanks ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {fetchError ? <AppText style={styles.errorText}>{fetchError}</AppText> : null}

          {showBankDropdown ? (
            <View style={styles.dropdownPanel}>
              <AppInput
                value={bankSearch}
                onChangeText={(value) => {
                  setBankSearch(value);
                  setSelectedBank(null);
                  setAccountName('');
                  setVerifyError('');
                  setSavingError('');
                }}
                placeholder="Search bank"
                autoCapitalize="words"
                containerStyle={styles.dropdownSearchWrap}
              />
              <ScrollView style={styles.dropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {filteredBanks.map((bank, index) => {
                  const name = String(bank?.name || bank?.bank_name || '').trim();
                  const code = String(bank?.code || bank?.bank_code || '').trim();
                  const active =
                    name.toLowerCase() === String(selectedBankName || '').trim().toLowerCase() &&
                    (!selectedBankCode || !code || code === selectedBankCode);

                  return (
                    <TouchableOpacity
                      key={`${name}-${code}-${index}`}
                      activeOpacity={0.85}
                      style={[styles.dropdownItem, active ? styles.dropdownItemActive : null]}
                      onPress={() => handleSelectBank(bank)}
                    >
                      <AppText style={[styles.dropdownItemText, active ? styles.dropdownItemTextActive : null]}>{name}</AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <AppInput
            label="Account number"
            value={accountNumber}
            onChangeText={(value) => {
              setAccountNumber(sanitizeDigits(value).slice(0, 10));
              setAccountName('');
              setVerifyError('');
              setSavingError('');
            }}
            placeholder="0123456789"
            keyboardType="number-pad"
            maxLength={10}
          />

          {verifying ? (
            <View style={styles.inlineRow}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
              <AppText style={styles.inlineMuted}>Verifying account...</AppText>
            </View>
          ) : null}

          {verifyError ? <AppText style={styles.errorText}>{verifyError}</AppText> : null}

          <AppInput
            label="Account name"
            value={accountName}
            onChangeText={(value) => {
              setAccountName(value);
              setSavingError('');
            }}
            placeholder="Resolved account name"
            editable={!verifying}
            inputStyle={!verifying ? null : styles.readOnlyInput}
          />

          <AppInput
            label="BVN (optional)"
            value={bvn}
            onChangeText={(value) => setBvn(sanitizeDigits(value))}
            placeholder="Enter BVN"
            keyboardType="number-pad"
          />

          {isOnboarding ? (
            <AppInput
              label="NIN"
              value={nin}
              onChangeText={(value) => {
                setNin(sanitizeDigits(value));
                setSavingError('');
              }}
              placeholder="Enter NIN"
              keyboardType="number-pad"
            />
          ) : null}

          {savingError ? <AppText style={styles.errorText}>{savingError}</AppText> : null}

          <AppButton
            label={saving ? 'Saving...' : 'Continue'}
            onPress={handleContinue}
            style={styles.saveBtn}
            disabled={saving || verifying}
            left={saving ? <ActivityIndicator size="small" color="#1A1A1A" /> : null}
          />
          {isOnboarding ? (
            <TouchableOpacity activeOpacity={0.85} onPress={handleTemporarySkip} style={styles.skipTempBtn}>
              <AppText style={styles.skipTempText}>Skip for now</AppText>
            </TouchableOpacity>
          ) : null}

        </ScrollView>
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
    width: '80%',
  },
  loadingRow: {
    marginBottom: 10,
  },
  bankLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  dropdownTrigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dropdownTriggerText: {
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  dropdownPlaceholder: {
    color: darkTheme.colors.muted,
  },
  dropdownPanel: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 12,
  },
  dropdownSearchWrap: {
    marginBottom: 8,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    minHeight: 40,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  dropdownItemActive: {
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.15),
  },
  dropdownItemText: {
    color: darkTheme.colors.text,
    fontSize: 13,
  },
  dropdownItemTextActive: {
    color: darkTheme.colors.accent,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 8,
  },
  inlineMuted: {
    marginLeft: 8,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  readOnlyInput: {
    color: 'rgba(255,255,255,0.82)',
  },
  errorText: {
    marginTop: -6,
    marginBottom: 10,
    color: '#FF7F7F',
    fontSize: 12,
  },
  saveBtn: {
    marginTop: 8,
  },
  skipTempBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipTempText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default BankDetailsScreen;




