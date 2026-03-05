import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowDown01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, CenteredHeader, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import {
  addMechanicBank,
  deleteMechanicBank,
  getMechanicBankDetails,
  getMechanicBankList,
  setPrimaryMechanicBank,
  verifyMechanicBank,
} from '../../../services/mechanic.service';
import {
  addCarOwnerBank,
  deleteCarOwnerBank,
  getCarOwnerBankDetails,
  setPrimaryCarOwnerBank,
  verifyCarOwnerBank,
} from '../../../services/carOwner.service';
import {
  addSellerBank,
  deleteSellerBank,
  getSellerBankDetails,
  setPrimarySellerBank,
  verifySellerBank,
} from '../../../services/spareParts.service';
import { darkTheme, withAlpha } from '../../../theme';
import { ROLES } from '../../../utils';

const normalizeBankItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.banks)) return payload.banks;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const sanitizeDigits = (value) => String(value || '').replace(/\D/g, '');
const toPrimaryFlag = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const extractBanks = (user) => {
  const rawList = user?.bank_details || user?.bankDetails;
  const fallback =
    user?.bank ||
    user?.bank_account ||
    user?.bankAccount ||
    user?.bank_info ||
    null;
  const list = Array.isArray(rawList) ? rawList : fallback ? [fallback] : [];

  return list.map((raw) => ({
    id: String(raw?.id || raw?._id || '').trim(),
    bankName: String(raw?.bank_name || raw?.bankName || raw?.name || '').trim(),
    accountNumber: String(raw?.account_number || raw?.accountNumber || '').trim(),
    accountName: String(raw?.account_name || raw?.accountName || '').trim(),
    isPrimary: toPrimaryFlag(raw?.is_primary ?? raw?.isPrimary ?? raw?.primary),
  }));
};

const ProfileBankDetailsScreen = ({ navigation }) => {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [allBanks, setAllBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [fetchError, setFetchError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [savingError, setSavingError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const banks = useMemo(() => extractBanks(profile), [profile]);
  const hasBank = banks.length > 0;

  const selectedBankName = String(selectedBank?.name || selectedBank?.bank_name || bankSearch || '').trim();
  const selectedBankCode = String(selectedBank?.code || selectedBank?.bank_code || '').trim();

  const verifyDebounce = React.useRef(null);

  const reloadProfile = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      if (role === ROLES.MECH) {
        const response = await getMechanicBankDetails();
        const payload = response?.data || response || {};
        setProfile((prev) => ({
          ...(prev || {}),
          bank_details: normalizeBankItems(payload),
        }));
      } else if (role === ROLES.CAR_OWNER) {
        const response = await getCarOwnerBankDetails();
        const payload = response?.data || response || {};
        setProfile((prev) => ({
          ...(prev || {}),
          bank_details: normalizeBankItems(payload),
        }));
      } else {
        const response = await getSellerBankDetails();
        const payload = response?.data || response || {};
        setProfile((prev) => ({
          ...(prev || {}),
          bank_details: normalizeBankItems(payload),
        }));
      }
    } catch (error) {
      setFetchError(error?.message || 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

  useEffect(() => {
    if (!showForm) {
      setBankSearch('');
      setSelectedBank(null);
      setAccountNumber('');
      setAccountName('');
      setVerifyError('');
      setSavingError('');
    }
  }, [showForm]);

  useEffect(() => {
    const loadBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await getMechanicBankList();
        setAllBanks(normalizeBankItems(response?.data || response));
      } catch (error) {
        // Noop, still allow manual entry
      } finally {
        setLoadingBanks(false);
      }
    };

    if (showForm) {
      loadBanks();
    }
  }, [showForm]);

  const filteredBanks = useMemo(() => {
    const query = String(bankSearch || '').trim().toLowerCase();
    if (!query) return allBanks.slice(0, 25);
    return allBanks
      .filter((bank) => String(bank?.name || bank?.bank_name || '').toLowerCase().includes(query))
      .slice(0, 25);
  }, [allBanks, bankSearch]);

  const runVerify = useCallback(async () => {
    const cleanAccount = sanitizeDigits(accountNumber);

    if (!selectedBankName || cleanAccount.length !== 10) {
      return;
    }

    setVerifying(true);
    setVerifyError('');
    setSavingError('');

    try {
      const response =
        role === ROLES.CAR_OWNER
          ? await verifyCarOwnerBank({ account_number: cleanAccount, bank_name: selectedBankName })
          : role === ROLES.SPARE_PARTS_SELLER
            ? await verifySellerBank({ account_number: cleanAccount, bank_name: selectedBankName })
            : await verifyMechanicBank({ account_number: cleanAccount, bank_name: selectedBankName });

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
  }, [accountNumber, role, selectedBankName]);

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

  const handleSave = async () => {
    const cleanAccount = sanitizeDigits(accountNumber);

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

    setSaving(true);
    setSavingError('');

    try {
      if (role === ROLES.CAR_OWNER) {
        await addCarOwnerBank({
          account_name: String(accountName).trim(),
          account_number: cleanAccount,
          bank_code: selectedBankCode,
          bank_name: selectedBankName,
        });
      } else if (role === ROLES.SPARE_PARTS_SELLER) {
        await addSellerBank({
          account_name: String(accountName).trim(),
          account_number: cleanAccount,
          bank_code: selectedBankCode,
          bank_name: selectedBankName,
        });
      } else {
        await addMechanicBank({
          account_name: String(accountName).trim(),
          account_number: cleanAccount,
          bank_code: selectedBankCode,
          bank_name: selectedBankName,
        });
      }

      setShowForm(false);
      await reloadProfile();
    } catch (error) {
      setSavingError(error?.message || 'Could not save bank details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bankId) => {
    if (!bankId || deleting) {
      return;
    }

    Alert.alert('Delete bank details', 'Are you sure you want to delete this bank account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            if (role === ROLES.CAR_OWNER) {
              await deleteCarOwnerBank(bankId);
            } else if (role === ROLES.SPARE_PARTS_SELLER) {
              await deleteSellerBank(bankId);
            } else {
              await deleteMechanicBank(bankId);
            }
            await reloadProfile();
          } catch (error) {
            setFetchError(error?.message || 'Could not delete bank details.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const handleSetPrimary = async (bankId) => {
    if (!bankId) return;
    try {
      if (role === ROLES.CAR_OWNER) {
        await setPrimaryCarOwnerBank(bankId);
      } else if (role === ROLES.SPARE_PARTS_SELLER) {
        await setPrimarySellerBank(bankId);
      } else {
        await setPrimaryMechanicBank(bankId);
      }
      await reloadProfile();
    } catch (error) {
      setFetchError(error?.message || 'Could not set primary bank.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <CenteredHeader title="Bank details" onBackPress={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {hasBank ? (
            banks.map((bank, index) => {
              const isPrimary = bank.isPrimary || banks.length === 1;
              return (
                <View key={bank.id || `${bank.bankName}-${index}`} style={styles.card}>
                  <View style={styles.cardTop}>
                    <AppText style={styles.cardTitle}>{bank.bankName || 'Bank'}</AppText>
                    {isPrimary ? (
                      <AppText style={styles.primaryBadge}>Primary</AppText>
                    ) : bank.id ? (
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(bank.id)} activeOpacity={0.85}>
                        <HugeiconsIcon icon={Delete02Icon} size={18} color="#F87171" strokeWidth={2} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={styles.cardRow}>
                    <AppText style={styles.cardLabel}>Account number</AppText>
                    <AppText style={styles.cardValue}>{bank.accountNumber || '—'}</AppText>
                  </View>
                  <View style={styles.cardRow}>
                    <AppText style={styles.cardLabel}>Account name</AppText>
                    <AppText style={styles.cardValue}>{bank.accountName || '—'}</AppText>
                  </View>
                  {!isPrimary ? (
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => handleSetPrimary(bank.id)}
                      activeOpacity={0.85}
                    >
                      <AppText style={styles.primaryButtonText}>Set as primary</AppText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <AppText style={styles.emptyTitle}>No bank details yet</AppText>
              <AppText style={styles.emptySubtitle}>Add a bank account to receive payouts.</AppText>
            </View>
          )}

          {!showForm ? (
            <AppButton label={hasBank ? 'Add account' : 'Add bank details'} onPress={() => setShowForm(true)} style={styles.addButton} />
          ) : null}

          {showForm ? (
            <View style={styles.form}>
              <AppText style={styles.formLabel}>Bank name</AppText>
              <TouchableOpacity style={styles.dropdownTrigger} activeOpacity={0.85} onPress={() => setShowBankDropdown((prev) => !prev)}>
                <AppText style={styles.dropdownText}>{selectedBankName || 'Select bank'}</AppText>
                <HugeiconsIcon icon={ArrowDown01Icon} size={18} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>

              {showBankDropdown ? (
                <View style={styles.dropdown}>
                  <AppInput
                    value={bankSearch}
                    onChangeText={setBankSearch}
                    placeholder="Search bank"
                    containerStyle={styles.searchInput}
                  />
                  {loadingBanks ? (
                    <View style={styles.stateWrap}>
                      <ActivityIndicator size="small" color={darkTheme.colors.accent} />
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.dropdownList}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {filteredBanks.map((bank) => {
                        const name = String(bank?.name || bank?.bank_name || '').trim();
                        const code = String(bank?.code || bank?.bank_code || '').trim();
                        return (
                          <TouchableOpacity
                            key={`${name}-${code}`}
                            onPress={() => handleSelectBank(bank)}
                            style={styles.dropdownItem}
                            activeOpacity={0.85}
                          >
                            <AppText style={styles.dropdownItemText}>{name}</AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              ) : null}

              <AppInput
                label="Account number"
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Enter 10 digit account number"
                keyboardType="number-pad"
              />
              <AppInput
                label="Account name"
                value={accountName}
                placeholder="Resolved account name"
                editable={false}
              />

              {verifyError ? <AppText style={styles.errorText}>{verifyError}</AppText> : null}
              {savingError ? <AppText style={styles.errorText}>{savingError}</AppText> : null}

              <AppButton
                label={saving ? 'Saving...' : 'Save bank details'}
                onPress={handleSave}
                disabled={saving || verifying}
                style={styles.saveButton}
              />
            </View>
          ) : null}

          {fetchError ? <AppText style={styles.errorText}>{fetchError}</AppText> : null}
          {deleting ? <AppText style={styles.helperText}>Deleting bank details...</AppText> : null}
        </ScrollView>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000033',
  },
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  card: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  primaryBadge: {
    color: '#000000',
    backgroundColor: '#E6C714',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
    overflow: 'hidden',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardRow: {
    marginBottom: 10,
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 6,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  emptyCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha('#FFFFFF', 0.08),
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  addButton: {
    marginTop: 12,
  },
  form: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 14,
  },
  formLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 6,
  },
  dropdownTrigger: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0B0B3A',
    marginBottom: 12,
    overflow: 'hidden',
  },
  searchInput: {
    marginBottom: 6,
  },
  dropdownList: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  saveButton: {
    marginTop: 12,
  },
  errorText: {
    color: '#F87171',
    fontSize: 11,
    marginTop: 6,
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ProfileBankDetailsScreen;
