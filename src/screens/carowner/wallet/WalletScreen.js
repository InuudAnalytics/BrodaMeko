import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  ArrowDownLeft01Icon,
  PlusSignIcon,
  SentIcon,
  ViewIcon,
  ViewOffIcon,
  WalletAdd02Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { AppBottomNav, AppText, ScreenContainer } from '../../../components';
import { getTransactions } from '../../../services/transactions.service';
import { getWalletBalance } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const toNaira = (value) => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

const toAmountWithSign = (amount) => {
  const numeric = Number(amount || 0);
  const sign = numeric >= 0 ? '+' : '-';
  return `${sign}${Math.abs(numeric).toLocaleString('en-NG')}`;
};

const readTransactions = (payload) => {
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

const normalizeTransaction = (item, index) => {
  const amount = Number(item?.amount || item?.value || 0);
  const type = String(item?.type || item?.transaction_type || '').toLowerCase();

  return {
    id: String(item?.id || item?._id || item?.reference || `txn-${index}`),
    reference: String(item?.reference || item?.trxref || item?.id || '').trim(),
    title: item?.title || item?.narration || item?.description || 'Transaction',
    subtitle: item?.subtitle || item?.channel || item?.status || '',
    amountText: toAmountWithSign(amount),
    time: item?.created_at || item?.createdAt || item?.date || '',
    positive: amount >= 0 || type.includes('credit'),
    icon: amount >= 0 ? PlusSignIcon : Wrench01Icon,
  };
};

const ActionButton = ({ label, icon, filled = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.actionButton, filled ? styles.actionButtonFilled : styles.actionButtonOutline]}
    >
      <HugeiconsIcon
        icon={icon}
        size={18}
        color={filled ? darkTheme.colors.background : darkTheme.colors.accent}
        strokeWidth={2}
      />
      <AppText style={[styles.actionText, filled ? styles.actionTextFilled : styles.actionTextOutline]}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
};

const TransactionItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.txnRow}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!item?.reference}
    >
      <View style={styles.txnIconWrap}>
        <HugeiconsIcon icon={item.icon || ArrowDownLeft01Icon} size={18} color={darkTheme.colors.text} strokeWidth={2} />
      </View>

      <View style={styles.txnBody}>
        <AppText style={styles.txnTitle}>{item.title}</AppText>
        <AppText variant="muted" style={styles.txnSubtitle} numberOfLines={1}>
          {item.subtitle}
        </AppText>
      </View>

      <View style={styles.txnMeta}>
        <AppText style={[styles.txnAmount, item.positive ? styles.txnAmountPositive : styles.txnAmountNegative]}>
          {item.amountText}
        </AppText>
        <AppText variant="muted" style={styles.txnTime} numberOfLines={1}>
          {item.time}
        </AppText>
      </View>
    </TouchableOpacity>
  );
};

const WalletScreen = ({ navigation }) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        getWalletBalance(),
        getTransactions(),
      ]);

      const walletPayload = walletResponse?.data || walletResponse || {};
      const transactionItems = readTransactions(transactionsResponse).map(normalizeTransaction);

      setBalance(Number(walletPayload?.balance || walletPayload?.available_balance || 0));
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
    }, [fetchWalletData])
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

  return (
    <ScreenContainer padded={false} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD);
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Wallet</AppText>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <AppText variant="muted" style={styles.balanceLabel}>
              Available balance
            </AppText>
            <TouchableOpacity onPress={() => setIsBalanceVisible((prev) => !prev)} activeOpacity={0.8}>
              <HugeiconsIcon
                icon={isBalanceVisible ? ViewIcon : ViewOffIcon}
                size={20}
                color={darkTheme.colors.muted}
                strokeWidth={1.9}
              />
            </TouchableOpacity>
          </View>

          <AppText style={styles.balanceAmount}>{isBalanceVisible ? toNaira(balance) : '₦ *****'}</AppText>

          <AppText variant="muted" style={styles.balanceSubtext}>
            Recent transactions from your wallet
          </AppText>

          <View style={styles.actionsRow}>
            <ActionButton
              label="Fund wallet"
              icon={WalletAdd02Icon}
              filled
              onPress={() => navigation.navigate(ROUTES.CAR_OWNER_FUND_WALLET)}
            />
            <ActionButton
              label="Withdraw"
              icon={SentIcon}
              onPress={() => navigation.navigate(ROUTES.CAR_OWNER_WITHDRAW)}
            />
          </View>
        </View>

        <AppText variant="muted" style={styles.sectionTitle}>
          Recent transactions
        </AppText>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}

        {!loading && transactions.length ? (
          <View style={styles.txnList}>
            {transactions.map((txn) => (
              <TransactionItem
                key={txn.id}
                item={txn}
                onPress={() => {
                  if (!txn.reference) {
                    return;
                  }

                  navigation.navigate(ROUTES.CAR_OWNER_TRANSACTION_DETAILS, { reference: txn.reference });
                }}
              />
            ))}
          </View>
        ) : null}

        {!loading && !transactions.length ? (
          <View style={styles.centerState}>
            <AppText style={styles.errorText}>{emptyText}</AppText>
          </View>
        ) : null}
      </View>

      <AppBottomNav
        activeTab={ROUTES.CAR_OWNER_REWARDS}
        onTabPress={(routeName) => navigation.navigate(routeName)}
        style={styles.bottomNav}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: darkTheme.spacing.xl,
    paddingTop: 4,
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
    borderColor: 'rgba(174, 255, 58, 0.4)',
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.01)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  balanceAmount: {
    marginTop: 4,
    color: darkTheme.colors.accent,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    letterSpacing: -0.3,
  },
  balanceSubtext: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    lineHeight: 16,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: darkTheme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: darkTheme.spacing.xs,
  },
  actionButtonFilled: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(174, 255, 58, 0.5)',
  },
  actionText: {
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  actionTextFilled: {
    color: darkTheme.colors.background,
  },
  actionTextOutline: {
    color: darkTheme.colors.accent,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 18,
  },
  txnList: {
    marginTop: 6,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  txnIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txnBody: {
    flex: 1,
  },
  txnTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  txnSubtitle: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.42)',
    fontSize: 12,
    lineHeight: 16,
  },
  txnMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: darkTheme.spacing.sm,
    maxWidth: 120,
  },
  txnAmount: {
    fontSize: 16,
    lineHeight: 20,
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
    color: 'rgba(255,255,255,0.42)',
    fontSize: 11,
    lineHeight: 14,
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
  bottomNav: {
    borderTopWidth: 0,
    paddingBottom: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.xs,
  },
});

export default WalletScreen;
