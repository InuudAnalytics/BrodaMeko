import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth, useMechanicProfile } from '../../../context';
import { deleteMechanicBank, setPrimaryMechanicBank } from '../../../services/mechanic.service';
import { getMyProfile } from '../../../services/user.service';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';

const normalizeBankAccounts = (payload) => {
  const root = payload?.data || payload || {};
  const candidates = [
    root?.mechanic?.bank_accounts,
    root?.mechanic?.banks,
    root?.bank_accounts,
    root?.banks,
    root?.data?.bank_accounts,
    root?.data?.banks,
  ];

  for (let index = 0; index < candidates.length; index += 1) {
    if (Array.isArray(candidates[index])) {
      return candidates[index];
    }
  }

  return [];
};

const mapBank = (item, fallbackId = '') => ({
  id: String(item?.id || item?._id || fallbackId || '').trim(),
  accountName: String(item?.account_name || item?.accountName || '').trim(),
  accountNumber: String(item?.account_number || item?.accountNumber || '').trim(),
  bankName: String(item?.bank_name || item?.bankName || '').trim(),
  isPrimary: Boolean(item?.is_primary || item?.primary || item?.isPrimary),
});

const maskAccount = (value) => {
  const digits = String(value || '').trim();
  if (digits.length <= 4) {
    return digits;
  }
  return `****${digits.slice(-4)}`;
};

const PersonalInfoScreen = ({ navigation }) => {
  const { role } = useAuth();
  const { mechanicProfile, setBankDetails } = useMechanicProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState([]);
  const [busyBankId, setBusyBankId] = useState('');
  const [busyAction, setBusyAction] = useState('');

  const canManageBank = role === ROLES.MECH;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyProfile();
      const fetchedBanks = normalizeBankAccounts(response).map((item, index) => mapBank(item, `bank-${index}`));
      setBanks(fetchedBanks);

      const primary = fetchedBanks.find((item) => item.isPrimary) || fetchedBanks[0] || null;
      if (primary) {
        setBankDetails({
          id: primary.id,
          accountName: primary.accountName,
          accountNumber: primary.accountNumber,
          bankName: primary.bankName,
          isPrimary: primary.isPrimary,
        });
      }
    } catch (requestError) {
      setError(requestError?.message || 'Could not load personal information.');
      setBanks([]);
    } finally {
      setLoading(false);
    }
  }, [setBankDetails]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const fallbackBank = useMemo(() => {
    const bank = mechanicProfile?.bankDetails || null;
    if (!bank || !bank.accountNumber) {
      return null;
    }

    return {
      id: String(bank.id || '').trim(),
      accountName: String(bank.accountName || '').trim(),
      accountNumber: String(bank.accountNumber || '').trim(),
      bankName: String(bank.bankName || '').trim(),
      isPrimary: Boolean(bank.isPrimary),
    };
  }, [mechanicProfile?.bankDetails]);

  const bankList = useMemo(() => {
    if (banks.length) {
      return banks;
    }
    return fallbackBank ? [fallbackBank] : [];
  }, [banks, fallbackBank]);

  const handleSetPrimary = async (bankId) => {
    const safeBankId = String(bankId || '').trim();
    if (!safeBankId || !canManageBank || busyBankId) {
      return;
    }

    setBusyBankId(safeBankId);
    setBusyAction('primary');
    try {
      await setPrimaryMechanicBank(safeBankId);
      await refresh();
    } catch (requestError) {
      Alert.alert('Action failed', requestError?.message || 'Could not set this bank as primary.');
    } finally {
      setBusyBankId('');
      setBusyAction('');
    }
  };

  const handleDelete = async (bankId) => {
    const safeBankId = String(bankId || '').trim();
    if (!safeBankId || !canManageBank || busyBankId) {
      return;
    }

    setBusyBankId(safeBankId);
    setBusyAction('delete');
    try {
      await deleteMechanicBank(safeBankId);
      await refresh();
    } catch (requestError) {
      Alert.alert('Action failed', requestError?.message || 'Could not delete this bank.');
    } finally {
      setBusyBankId('');
      setBusyAction('');
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Personal</AppText>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle}>Bank details</AppText>

          {loading ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {!loading && error ? <AppText style={styles.errorText}>{error}</AppText> : null}

          {!loading && !error && !bankList.length ? (
            <AppText style={styles.emptyText}>No bank details added yet.</AppText>
          ) : null}

          {!loading && !error
            ? bankList.map((bank) => {
                const canRunActions = canManageBank && Boolean(bank.id);
                const busy = busyBankId === bank.id;

                return (
                  <View key={`${bank.id || bank.accountNumber}-${bank.bankName}`} style={styles.bankCard}>
                    <View style={styles.bankRow}>
                      <AppText style={styles.bankName}>{bank.bankName || 'Bank'}</AppText>
                      {bank.isPrimary ? <AppText style={styles.primaryPill}>Primary</AppText> : null}
                    </View>
                    <AppText style={styles.bankMeta}>{bank.accountName || 'Account name unavailable'}</AppText>
                    <AppText style={styles.bankMeta}>{maskAccount(bank.accountNumber)}</AppText>

                    {canManageBank ? (
                      <View style={styles.actionRow}>
                        <AppButton
                          label={busy && busyAction === 'primary' ? 'Updating...' : 'Set primary'}
                          onPress={() => handleSetPrimary(bank.id)}
                          disabled={!canRunActions || busy || bank.isPrimary}
                          style={styles.secondaryActionBtn}
                          textStyle={styles.secondaryActionText}
                        />
                        {!bank.isPrimary ? (
                          <AppButton
                            label={busy && busyAction === 'delete' ? 'Deleting...' : 'Delete'}
                            onPress={() => handleDelete(bank.id)}
                            disabled={!canRunActions || busy}
                            style={styles.deleteBtn}
                            textStyle={styles.deleteText}
                          />
                        ) : null}
                      </View>
                    ) : null}

                    {canManageBank && !bank.id ? (
                      <AppText style={styles.hintText}>
                        This local bank record has no server ID yet. Open bank details and save to sync.
                      </AppText>
                    ) : null}
                  </View>
                );
              })
            : null}

          {canManageBank ? (
            <AppButton
              label="Manage bank details"
              onPress={() => navigation.navigate(ROUTES.MECH_BANK_DETAILS)}
              style={styles.manageBtn}
            />
          ) : null}
        </View>
      </ScrollView>
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
    paddingBottom: 24,
  },
  header: {
    minHeight: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  backBtn: {
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
  sectionCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  stateWrap: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FF7F7F',
    marginTop: 4,
  },
  emptyText: {
    color: darkTheme.colors.muted,
    marginTop: 4,
  },
  bankCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 10,
  },
  bankName: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  primaryPill: {
    color: '#1A1A1A',
    backgroundColor: darkTheme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    overflow: 'hidden',
  },
  bankMeta: {
    marginTop: 4,
    color: darkTheme.colors.muted,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    columnGap: 8,
  },
  secondaryActionBtn: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'transparent',
  },
  secondaryActionText: {
    color: darkTheme.colors.accent,
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#FF7F7F',
    backgroundColor: 'transparent',
  },
  deleteText: {
    color: '#FF7F7F',
    fontSize: 13,
  },
  hintText: {
    marginTop: 8,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  manageBtn: {
    marginTop: 12,
  },
});

export default PersonalInfoScreen;
