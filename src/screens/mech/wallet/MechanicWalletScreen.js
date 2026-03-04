import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowDownLeft01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  CreditCardIcon,
  FilterHorizontalIcon,
  PlusSignIcon,
  SentIcon,
  ViewIcon,
  ViewOffIcon,
  WalletAdd02Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import MechanicTabBar from '../../../components/navigation/MechanicTabBar';
import { getTransactions } from '../../../services/transactions.service';
import { getWalletBalance, getWithdrawals, requestWithdrawal } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const toNaira = value => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

const toAmountWithSign = (amount, forceNegative = false) => {
  const numeric = Number(amount || 0);
  const sign = forceNegative ? '-' : numeric >= 0 ? '+' : '-';
  return `${sign}${Math.abs(numeric).toLocaleString('en-NG')}`;
};

const readTransactions = payload => {
  const root = payload?.data || payload || {};

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root.transactions)) {
    return root.transactions;
  }

  if (Array.isArray(root.items)) {
    return root.items;
  }

  if (Array.isArray(root.results)) {
    return root.results;
  }

  return [];
};

const normalizeTransaction = (item, index, source) => {
  const amount = Number(item?.amount || item?.value || 0);
  const inferredType =
    item?.type ||
    item?.transaction_type ||
    (item?.bank_name || item?.account_name || item?.account_number
      ? 'withdraw'
      : '');
  const type = String(inferredType || '').toLowerCase();
  const createdAtRaw = item?.created_at || item?.createdAt || item?.date || '';
  const parsedTime = Date.parse(String(createdAtRaw || ''));
  const createdAtMs = Number.isFinite(parsedTime) ? parsedTime : 0;
  const baseTitle = item?.title || item?.narration || item?.description || '';
  const isWithdrawal = source === 'withdrawals' || type.includes('withdraw');
  const resolvedTitle = baseTitle || (isWithdrawal ? 'Withdrawn' : 'Transaction');
  const forceNegative = isWithdrawal;

  return {
    id: String(item?.id || item?._id || item?.reference || `txn-${index}`),
    reference: String(item?.reference || item?.trxref || item?.id || '').trim(),
    title: resolvedTitle,
    subtitle: item?.subtitle || item?.channel || item?.status || '',
    amountText: toAmountWithSign(amount, forceNegative),
    time: createdAtRaw,
    createdAtMs,
    positive: forceNegative ? false : amount >= 0 || type.includes('credit'),
    icon: isWithdrawal || amount < 0 ? ArrowDownLeft01Icon : PlusSignIcon,
    rawAmount: amount,
    rawType: type,
    rawStatus: String(item?.status || '').toLowerCase(),
    rawTitle: String(
      item?.title || item?.narration || item?.description || '',
    ).toLowerCase(),
    rawSource: source || 'transactions',
  };
};

const FILTER_TYPE_OPTIONS = [
  { key: 'completed', label: 'Completed' },
  { key: 'refund', label: 'Refund' },
  { key: 'pending', label: 'Pending' },
  { key: 'top_up', label: 'Top up' },
  { key: 'withdraw', label: 'Withdraw' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_FILTER_OPTIONS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: '7_days', label: 'Last 7 days', days: 7 },
  { key: '30_days', label: 'Last 30 days', days: 30 },
];

const QUICK_WITHDRAW_AMOUNTS = [1000, 5000, 10000];

const matchesTypeFilter = (txn, filterKey) => {
  const haystack = `${txn?.rawType || ''} ${txn?.rawStatus || ''} ${
    txn?.rawTitle || ''
  }`.toLowerCase();
  const amount = Number(txn?.rawAmount || 0);

  switch (filterKey) {
    case 'completed':
      return haystack.includes('success') || haystack.includes('completed');
    case 'refund':
      return haystack.includes('refund') || haystack.includes('reversal');
    case 'pending':
      return haystack.includes('pending') || haystack.includes('processing');
    case 'top_up':
      return (
        haystack.includes('top') ||
        haystack.includes('fund') ||
        haystack.includes('deposit') ||
        haystack.includes('credit') ||
        amount > 0
      );
    case 'withdraw':
      return txn?.rawSource === 'withdrawals';
    default:
      return true;
  }
};

const resolveDateRangeFromOption = optionKey => {
  if (!optionKey) {
    return { fromMs: 0, toMs: 0 };
  }

  const option = DATE_FILTER_OPTIONS.find(entry => entry.key === optionKey);
  if (!option) {
    return { fromMs: 0, toMs: 0 };
  }

  const now = Date.now();
  if (option.days === 0) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return { fromMs: startOfDay.getTime(), toMs: now };
  }

  return { fromMs: now - option.days * DAY_MS, toMs: now };
};

const ActionButton = ({ label, icon, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.actionButton}
    >
      <HugeiconsIcon
        icon={icon}
        size={18}
        color={darkTheme.colors.text}
        strokeWidth={2}
      />
      <AppText style={styles.actionText}>{label}</AppText>
    </TouchableOpacity>
  );
};

const TransactionItem = ({ item }) => {
  return (
    <View style={styles.txnRow}>
      <View style={styles.txnIconWrap}>
        <HugeiconsIcon
          icon={item.icon || ArrowDownLeft01Icon}
          size={18}
          color={darkTheme.colors.background}
          strokeWidth={2}
        />
      </View>

      <View style={styles.txnBody}>
        <AppText style={styles.txnTitle}>{item.title}</AppText>
        <AppText variant="muted" style={styles.txnSubtitle} numberOfLines={1}>
          {item.subtitle}
        </AppText>
      </View>

      <View style={styles.txnMeta}>
        <AppText
          style={[
            styles.txnAmount,
            item.positive ? styles.txnAmountPositive : styles.txnAmountNegative,
          ]}
        >
          {item.amountText}
        </AppText>
        <AppText variant="muted" style={styles.txnTime} numberOfLines={1}>
          {item.time}
        </AppText>
      </View>
    </View>
  );
};

const FilterChip = ({ label, active, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.filterChip, active ? styles.filterChipActive : null]}
    >
      <AppText
        style={[
          styles.filterChipText,
          active ? styles.filterChipTextActive : null,
        ]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

const MetricCard = ({ icon, label, value }) => {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricLabelRow}>
        <HugeiconsIcon
          icon={icon}
          size={16}
          color="rgba(255,255,255,0.65)"
          strokeWidth={2}
        />
        <AppText style={styles.metricLabel}>{label}</AppText>
      </View>
      <AppText style={styles.metricValue}>{toNaira(value)}</AppText>
    </View>
  );
};

const MechanicWalletScreen = ({
  navigation,
  onTabPress,
  showTabBar = true,
}) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [fromDateOption, setFromDateOption] = useState('');
  const [toDateOption, setToDateOption] = useState('');
  const [draftSelectedTypes, setDraftSelectedTypes] = useState([]);
  const [draftFromDateOption, setDraftFromDateOption] = useState('');
  const [draftToDateOption, setDraftToDateOption] = useState('');
  const [datePickerTarget, setDatePickerTarget] = useState('');
  const sheetProgress = useRef(new Animated.Value(0)).current;
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawErrorAction, setWithdrawErrorAction] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [walletResponse, transactionsResponse, withdrawalsResponse] = await Promise.all([
        getWalletBalance(),
        getTransactions(),
        getWithdrawals(),
      ]);
      const walletPayload = walletResponse?.data || walletResponse || {};
      const transactionItems = [
        ...readTransactions(transactionsResponse).map((item, index) =>
          normalizeTransaction(item, index, 'transactions'),
        ),
        ...readTransactions(withdrawalsResponse).map((item, index) =>
          normalizeTransaction(item, index, 'withdrawals'),
        ),
      ];

      setBalance(
        Number(walletPayload?.balance || walletPayload?.available_balance || 0),
      );
      setTransactions(transactionItems);
    } catch (requestError) {
      setError('Could not load transactions right now.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [fetchWalletData]),
  );

  const emptyText = useMemo(() => {
    if (loading) {
      return 'Loading transactions...';
    }
    if (error) {
      return error;
    }
    return 'No transactions yet.';
  }, [loading, error]);

  const hasAppliedFilters =
    selectedTypes.length > 0 ||
    Boolean(fromDateOption) ||
    Boolean(toDateOption);
  const hasDraftFilters =
    draftSelectedTypes.length > 0 ||
    Boolean(draftFromDateOption) ||
    Boolean(draftToDateOption);

  const openFilterSheet = () => {
    setDraftSelectedTypes(selectedTypes);
    setDraftFromDateOption(fromDateOption);
    setDraftToDateOption(toDateOption);
    setDatePickerTarget('');
    setIsFilterVisible(true);
    Animated.timing(sheetProgress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeFilterSheet = () => {
    setDatePickerTarget('');
    Animated.timing(sheetProgress, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsFilterVisible(false);
      }
    });
  };

  const openWithdrawModal = () => {
    setWithdrawError('');
    setWithdrawErrorAction('');
    setWithdrawAmount('');
    setIsWithdrawModalOpen(true);
  };

  const closeWithdrawModal = () => {
    if (withdrawSubmitting) {
      return;
    }
    setIsWithdrawModalOpen(false);
  };

  const handleWithdrawAmountChange = value => {
    const sanitized = String(value || '').replace(/[^\d]/g, '');
    setWithdrawAmount(sanitized);
    if (withdrawError) {
      setWithdrawError('');
      setWithdrawErrorAction('');
    }
  };

  const handleSelectQuickAmount = amount => {
    setWithdrawAmount(String(amount));
    if (withdrawError) {
      setWithdrawError('');
      setWithdrawErrorAction('');
    }
  };

  const resolveWithdrawError = error => {
    const code = String(error?.data?.code || '').toUpperCase();
    const message = String(error?.message || '').toLowerCase();
    const requiredAmount = Number(error?.data?.required || 0);

    if (code.includes('INSUFFICIENT') || message.includes('insufficient')) {
      return {
        text: requiredAmount
          ? `Insufficient balance. You need ₦${requiredAmount.toLocaleString('en-NG')}.`
          : 'Insufficient balance.',
        action: '',
      };
    }

    if (code.includes('NO_PRIMARY') || message.includes('primary bank')) {
      return {
        text: 'No primary bank account found.',
        action: 'bank',
      };
    }

    return { text: 'Unable to request withdrawal right now.', action: '' };
  };

  const handleSubmitWithdraw = async () => {
    const parsedAmount = Number(withdrawAmount || 0);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setWithdrawError('Enter a valid amount to withdraw.');
      return;
    }

    setWithdrawSubmitting(true);
    setWithdrawError('');
    setWithdrawErrorAction('');
    try {
      await requestWithdrawal(parsedAmount);
      closeWithdrawModal();
      fetchWalletData();
    } catch (requestError) {
      const resolved = resolveWithdrawError(requestError);
      setWithdrawError(resolved.text);
      setWithdrawErrorAction(resolved.action);
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const toggleDraftType = typeKey => {
    setDraftSelectedTypes(prev =>
      prev.includes(typeKey)
        ? prev.filter(entry => entry !== typeKey)
        : [...prev, typeKey],
    );
  };

  const applyDraftFilters = () => {
    if (!hasDraftFilters) {
      return;
    }
    setSelectedTypes(draftSelectedTypes);
    setFromDateOption(draftFromDateOption);
    setToDateOption(draftToDateOption);
    closeFilterSheet();
  };

  const clearDraftFilters = () => {
    setDraftSelectedTypes([]);
    setDraftFromDateOption('');
    setDraftToDateOption('');
    setSelectedTypes([]);
    setFromDateOption('');
    setToDateOption('');
    setDatePickerTarget('');
  };

  const filteredTransactions = useMemo(() => {
    let next = [...transactions];

    if (selectedTypes.length) {
      next = next.filter(txn =>
        selectedTypes.some(filterKey => matchesTypeFilter(txn, filterKey)),
      );
    }

    const fromRange = resolveDateRangeFromOption(fromDateOption);
    const toRange = resolveDateRangeFromOption(toDateOption);
    const fromMs = fromRange.fromMs || 0;
    const toMs = toRange.toMs || 0;

    if (fromMs || toMs) {
      next = next.filter(txn => {
        const stamp = Number(txn?.createdAtMs || 0);
        if (!stamp) {
          return false;
        }
        if (fromMs && stamp < fromMs) {
          return false;
        }
        if (toMs && stamp > toMs) {
          return false;
        }
        return true;
      });
    }

    return next;
  }, [fromDateOption, selectedTypes, toDateOption, transactions]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    return transactions.reduce((sum, txn) => {
      const stamp = Number(txn?.createdAtMs || 0);
      if (!stamp) {
        return sum;
      }
      const date = new Date(stamp);
      if (date.getFullYear() !== year || date.getMonth() !== month) {
        return sum;
      }
      const amount = Number(txn?.rawAmount || 0);
      return amount > 0 ? sum + amount : sum;
    }, 0);
  }, [transactions]);

  const totalWithdrawn = useMemo(() => {
    return transactions.reduce((sum, txn) => {
      const amount = Number(txn?.rawAmount || 0);
      const rawType = String(txn?.rawType || '');
      const rawTitle = String(txn?.rawTitle || '');
      const looksWithdraw =
        rawType.includes('withdraw') ||
        rawType.includes('debit') ||
        rawTitle.includes('withdraw');
      if (amount < 0 || looksWithdraw) {
        return sum + Math.abs(amount);
      }
      return sum;
    }, 0);
  }, [transactions]);

  const backdropOpacity = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const sheetTranslateY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  const handleTabPress = tab => {
    if (typeof onTabPress === 'function') {
      onTabPress(tab);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['left', 'right']}>
        <View style={styles.content}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={darkTheme.colors.background}
          />

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.85}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                  return;
                }

                if (typeof onTabPress === 'function') {
                  onTabPress('home');
                }
              }}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                color={darkTheme.colors.text}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
            <AppText style={styles.headerTitle}>Wallet</AppText>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceDecorTopLeft} />
            <View style={styles.balanceDecorBottomRight} />
            <View style={styles.balanceRow}>
              <AppText variant="muted" style={styles.balanceLabel}>
                Available balance
              </AppText>
              <TouchableOpacity
                onPress={() => setIsBalanceVisible(prev => !prev)}
                activeOpacity={0.8}
              >
                <HugeiconsIcon
                  icon={isBalanceVisible ? ViewIcon : ViewOffIcon}
                  size={20}
                  color={darkTheme.colors.text}
                  strokeWidth={1.9}
                />
              </TouchableOpacity>
            </View>

            <AppText style={styles.balanceAmount}>
              {isBalanceVisible ? toNaira(balance) : '₦ *****'}
            </AppText>

            <AppText variant="muted" style={styles.balanceSubtext}>
              You have transacted {transactions.length} times today
            </AppText>
          </View>

          <View style={styles.actionsRow}>
            <ActionButton
              label="Withdraw"
              icon={SentIcon}
              onPress={openWithdrawModal}
            />
            <ActionButton
              label="Fund wallet"
              icon={WalletAdd02Icon}
              onPress={() =>
                navigation.navigate('Placeholder', { title: 'Fund wallet' })
              }
            />
          </View>

          <View style={styles.metricsRow}>
            <MetricCard
              icon={Calendar03Icon}
              label="This month"
              value={thisMonthTotal}
            />
            <MetricCard
              icon={CreditCardIcon}
              label="Total withdrawn"
              value={totalWithdrawn}
            />
          </View>

          <View style={styles.sectionHeader}>
            <AppText variant="muted" style={styles.sectionTitle}>
              Recent transactions
            </AppText>
            <TouchableOpacity
              onPress={openFilterSheet}
              activeOpacity={0.85}
              style={[
                styles.filterIconButton,
                hasAppliedFilters ? styles.filterIconButtonActive : null,
              ]}
            >
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                size={18}
                color={darkTheme.colors.muted}
                strokeWidth={1.9}
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {!loading && filteredTransactions.length ? (
            <View style={styles.txnList}>
              {filteredTransactions.map(txn => (
                <TransactionItem key={txn.id} item={txn} />
              ))}
            </View>
          ) : null}

          {!loading && !filteredTransactions.length ? (
            <View style={styles.centerState}>
              <AppText style={styles.errorText}>
                {hasAppliedFilters
                  ? 'No transactions match your current filters.'
                  : emptyText}
              </AppText>
            </View>
          ) : null}
        </View>
      </ScreenContainer>

      <Modal
        visible={isFilterVisible}
        transparent
        animationType="none"
        onRequestClose={closeFilterSheet}
      >
        <View style={styles.filterModalRoot}>
          <Animated.View
            style={[styles.filterBackdrop, { opacity: backdropOpacity }]}
          >
            <Pressable
              style={styles.filterBackdropTouch}
              onPress={closeFilterSheet}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.filterSheet,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <View style={styles.filterSheetHandle} />
            <View style={styles.filterTitleRow}>
              <View style={styles.filterHeadingWrap}>
                <AppText style={styles.filterTitle}>Set filters</AppText>
                <HugeiconsIcon
                  icon={FilterHorizontalIcon}
                  size={16}
                  color={darkTheme.colors.muted}
                  strokeWidth={1.9}
                />
              </View>
              <TouchableOpacity
                onPress={clearDraftFilters}
                style={styles.clearFilterButton}
                activeOpacity={0.85}
              >
                <AppText style={styles.clearFilterButtonText}>
                  x Clear filters
                </AppText>
              </TouchableOpacity>
            </View>

            <AppText style={styles.filterSectionLabel}>Type</AppText>
            <View style={styles.filterTypeWrap}>
              {FILTER_TYPE_OPTIONS.map(typeOption => (
                <FilterChip
                  key={typeOption.key}
                  label={typeOption.label}
                  active={draftSelectedTypes.includes(typeOption.key)}
                  onPress={() => toggleDraftType(typeOption.key)}
                />
              ))}
            </View>

            <AppText style={styles.filterSectionLabel}>Date</AppText>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[
                  styles.dateDropdown,
                  datePickerTarget === 'from' ? styles.dateDropdownOpen : null,
                  draftFromDateOption ? styles.dateDropdownSelected : null,
                ]}
                onPress={() =>
                  setDatePickerTarget(prev => (prev === 'from' ? '' : 'from'))
                }
                activeOpacity={0.85}
              >
                <AppText
                  style={[
                    styles.dateDropdownText,
                    draftFromDateOption
                      ? styles.dateDropdownTextSelected
                      : null,
                  ]}
                >
                  {draftFromDateOption
                    ? DATE_FILTER_OPTIONS.find(
                        entry => entry.key === draftFromDateOption,
                      )?.label || 'From'
                    : 'From'}
                </AppText>
                <AppText style={styles.dateDropdownChevron}>v</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateDropdown,
                  datePickerTarget === 'to' ? styles.dateDropdownOpen : null,
                  draftToDateOption ? styles.dateDropdownSelected : null,
                ]}
                onPress={() =>
                  setDatePickerTarget(prev => (prev === 'to' ? '' : 'to'))
                }
                activeOpacity={0.85}
              >
                <AppText
                  style={[
                    styles.dateDropdownText,
                    draftToDateOption ? styles.dateDropdownTextSelected : null,
                  ]}
                >
                  {draftToDateOption
                    ? DATE_FILTER_OPTIONS.find(
                        entry => entry.key === draftToDateOption,
                      )?.label || 'To'
                    : 'To'}
                </AppText>
                <AppText style={styles.dateDropdownChevron}>v</AppText>
              </TouchableOpacity>
            </View>

            {datePickerTarget ? (
              <View style={styles.dateOptionWrap}>
                {DATE_FILTER_OPTIONS.map(option => {
                  const activeForTarget =
                    datePickerTarget === 'from'
                      ? draftFromDateOption === option.key
                      : draftToDateOption === option.key;
                  return (
                    <FilterChip
                      key={`${datePickerTarget}-${option.key}`}
                      label={option.label}
                      active={activeForTarget}
                      onPress={() => {
                        if (datePickerTarget === 'from') {
                          setDraftFromDateOption(option.key);
                        } else {
                          setDraftToDateOption(option.key);
                        }
                        setDatePickerTarget('');
                      }}
                    />
                  );
                })}
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.applyFiltersButton,
                !hasDraftFilters ? styles.applyFiltersButtonDisabled : null,
              ]}
              disabled={!hasDraftFilters}
              onPress={applyDraftFilters}
              activeOpacity={0.9}
            >
              <AppText
                style={[
                  styles.applyFiltersButtonText,
                  !hasDraftFilters
                    ? styles.applyFiltersButtonTextDisabled
                    : null,
                ]}
              >
                Show transactions
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={isWithdrawModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeWithdrawModal}
      >
        <View style={styles.withdrawModalRoot}>
          <Pressable
            style={styles.withdrawBackdrop}
            onPress={closeWithdrawModal}
          />
          <View style={styles.withdrawCard}>
            <AppText style={styles.withdrawTitle}>Withdraw</AppText>
            <AppText variant="muted" style={styles.withdrawSubtitle}>
              Select an amount or enter a custom value
            </AppText>

            <View style={styles.withdrawQuickRow}>
              {QUICK_WITHDRAW_AMOUNTS.map((amount, index) => {
                const isActive = Number(withdrawAmount) === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    activeOpacity={0.85}
                    onPress={() => handleSelectQuickAmount(amount)}
                    style={[
                      styles.quickAmountChip,
                      index === QUICK_WITHDRAW_AMOUNTS.length - 1
                        ? styles.quickAmountChipLast
                        : null,
                      isActive ? styles.quickAmountChipActive : null,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.quickAmountText,
                        isActive ? styles.quickAmountTextActive : null,
                      ]}
                    >
                      {toNaira(amount)}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.withdrawInputWrap}>
              <AppText style={styles.withdrawInputLabel}>Custom amount</AppText>
              <TextInput
                placeholder="Enter amount"
                placeholderTextColor="rgba(255,255,255,0.45)"
                keyboardType="number-pad"
                value={withdrawAmount}
                onChangeText={handleWithdrawAmountChange}
                style={styles.withdrawInput}
              />
            </View>

            {withdrawError ? (
              <AppText style={styles.withdrawError}>{withdrawError}</AppText>
            ) : null}
            {withdrawErrorAction === 'bank' ? (
              <AppButton
                label="Add bank details"
                onPress={() => {
                  closeWithdrawModal();
                  navigation.navigate(ROUTES.PROFILE_BANK_DETAILS);
                }}
                style={styles.withdrawCta}
                textStyle={styles.withdrawCtaText}
              />
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSubmitWithdraw}
              disabled={withdrawSubmitting}
              style={[
                styles.withdrawSubmit,
                withdrawSubmitting ? styles.withdrawSubmitDisabled : null,
              ]}
            >
              {withdrawSubmitting ? (
                <ActivityIndicator
                  size="small"
                  color={darkTheme.colors.background}
                />
              ) : (
                <AppText style={styles.withdrawSubmitText}>
                  Request withdrawal
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showTabBar ? (
        <MechanicTabBar activeTab="wallet" onTabPress={handleTabPress} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: darkTheme.spacing.xl,
  },
  header: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  backButton: {
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
  balanceCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: darkTheme.radius.lg,
    backgroundColor: '#292C61',
    paddingHorizontal: 14,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  balanceDecorTopLeft: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 14,
    borderColor: 'rgba(255,255,255,0.18)',
    top: -46,
    left: -36,
  },
  balanceDecorBottomRight: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 12,
    borderColor: 'rgba(255,255,255,0.16)',
    bottom: -60,
    right: -42,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  balanceAmount: {
    marginTop: 4,
    color: darkTheme.colors.text,
    fontSize: 50,
    lineHeight: 54,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    letterSpacing: -0.3,
  },
  balanceSubtext: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    columnGap: 14,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: darkTheme.spacing.xs,
  },
  actionText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  metricsRow: {
    marginTop: 12,
    flexDirection: 'row',
    columnGap: 12,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 16,
  },
  metricValue: {
    marginTop: 6,
    color: darkTheme.colors.text,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  filterIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButtonActive: {
    backgroundColor: 'rgba(230,199,20,0.2)',
  },
  txnList: {
    marginTop: 2,
    rowGap: 6,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  txnIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnBody: {
    flex: 1,
  },
  txnTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  txnSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.48)',
    fontSize: 14,
    lineHeight: 16,
  },
  txnMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: darkTheme.spacing.sm,
    maxWidth: 120,
  },
  txnAmount: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  txnAmountPositive: {
    color: darkTheme.colors.accent,
  },
  txnAmountNegative: {
    color: 'rgba(255,255,255,0.65)',
  },
  txnTime: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.48)',
    fontSize: 14,
    lineHeight: 18,
  },
  filterModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 33, 0.5)',
  },
  filterBackdropTouch: {
    flex: 1,
    backgroundColor: 'rgba(130, 130, 160, 0.14)',
  },
  filterSheet: {
    backgroundColor: darkTheme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    minHeight: 350,
  },
  withdrawModalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 7, 24, 0.7)',
  },
  withdrawCard: {
    width: '86%',
    backgroundColor: '#1A1A4A',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  withdrawTitle: {
    fontSize: 18,
    fontFamily: darkTheme.fonts?.heading,
    color: darkTheme.colors.text,
  },
  withdrawSubtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  withdrawQuickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  quickAmountChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingVertical: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  quickAmountChipLast: {
    marginRight: 0,
  },
  quickAmountChipActive: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(230,199,20,0.12)',
  },
  quickAmountText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  quickAmountTextActive: {
    color: darkTheme.colors.accent,
    fontFamily: darkTheme.fonts?.heading,
  },
  withdrawInputWrap: {
    marginTop: 18,
  },
  withdrawInputLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 6,
  },
  withdrawInput: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  withdrawError: {
    marginTop: 10,
    color: '#F87171',
    fontSize: 12,
  },
  withdrawCta: {
    marginTop: 10,
    minHeight: 38,
    backgroundColor: darkTheme.colors.accent,
  },
  withdrawCtaText: {
    color: '#111827',
    fontSize: 12,
  },
  withdrawCta: {
    marginTop: 10,
    minHeight: 38,
    backgroundColor: darkTheme.colors.accent,
  },
  withdrawCtaText: {
    color: '#111827',
    fontSize: 12,
  },
  withdrawSubmit: {
    marginTop: 16,
    backgroundColor: darkTheme.colors.accent,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
  },
  withdrawSubmitDisabled: {
    opacity: 0.7,
  },
  withdrawSubmitText: {
    color: '#000',
    fontSize: 14,
    fontFamily: darkTheme.fonts?.heading,
  },
  filterSheetHandle: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.28)',
    marginBottom: 14,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterHeadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  filterTitle: {
    color: darkTheme.colors.text,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  clearFilterButton: {
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFilterButtonText: {
    color: 'rgba(26,26,26,0.65)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  filterSectionLabel: {
    marginTop: 20,
    marginBottom: 10,
    color: darkTheme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  filterTypeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
  },
  filterChip: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: darkTheme.colors.accent,
  },
  filterChipText: {
    color: 'rgba(26,26,26,0.65)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  filterChipTextActive: {
    color: darkTheme.colors.background,
  },
  dateRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  dateDropdown: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  dateDropdownOpen: {
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.8)',
  },
  dateDropdownSelected: {
    backgroundColor: darkTheme.colors.accent,
  },
  dateDropdownText: {
    color: 'rgba(26,26,26,0.65)',
    fontSize: 14,
    lineHeight: 21,
  },
  dateDropdownTextSelected: {
    color: darkTheme.colors.background,
  },
  dateDropdownChevron: {
    color: '#8D8D8D',
    fontSize: 14,
    lineHeight: 16,
  },
  dateOptionWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 10,
  },
  applyFiltersButton: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersButtonDisabled: {
    backgroundColor: '#d9d9d9',
  },
  applyFiltersButtonText: {
    color: darkTheme.colors.background,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  applyFiltersButtonTextDisabled: {
    color: 'rgba(255,255,255,0.85)',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  errorText: {
    color: darkTheme.colors.muted,
    textAlign: 'center',
  },
});

export default MechanicWalletScreen;
