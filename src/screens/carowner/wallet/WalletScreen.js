import React, { useState } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowDownLeft01Icon,
  PlusSignIcon,
  SentIcon,
  ViewIcon,
  ViewOffIcon,
  WalletAdd02Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { AppBottomNav, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const TRANSACTIONS = [
  {
    id: 'txn-1',
    title: 'Escrow refund',
    subtitle: 'Job #1208 cancelled',
    amount: '+3000',
    time: 'Today 2:14PM',
    positive: true,
    icon: ArrowDownLeft01Icon,
  },
  {
    id: 'txn-2',
    title: 'Engine repair',
    subtitle: 'Emeka Okafor',
    amount: '-300',
    time: 'Today 7:14PM',
    positive: false,
    icon: Wrench01Icon,
  },
  {
    id: 'txn-3',
    title: 'Wallet top-up',
    subtitle: 'Visa card',
    amount: '+93600',
    time: 'Today 7:14PM',
    positive: true,
    icon: PlusSignIcon,
  },
  {
    id: 'txn-4',
    title: 'Brake service',
    subtitle: 'Chidi Nwosu',
    amount: '-9300',
    time: 'Today 7:14PM',
    positive: false,
    icon: Wrench01Icon,
  },
];

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

const TransactionItem = ({ item }) => {
  return (
    <View style={styles.txnRow}>
      <View style={styles.txnIconWrap}>
        <HugeiconsIcon icon={item.icon} size={18} color={darkTheme.colors.text} strokeWidth={2} />
      </View>

      <View style={styles.txnBody}>
        <AppText style={styles.txnTitle}>{item.title}</AppText>
        <AppText variant="muted" style={styles.txnSubtitle}>
          {item.subtitle}
        </AppText>
      </View>

      <View style={styles.txnMeta}>
        <AppText style={[styles.txnAmount, item.positive ? styles.txnAmountPositive : styles.txnAmountNegative]}>
          {item.amount}
        </AppText>
        <AppText variant="muted" style={styles.txnTime}>
          {item.time}
        </AppText>
      </View>
    </View>
  );
};

const WalletScreen = ({ navigation }) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  return (
    <ScreenContainer padded={false} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>
        <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

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

          <AppText style={styles.balanceAmount}>{isBalanceVisible ? 'N 5000' : 'N *****'}</AppText>

          <AppText variant="muted" style={styles.balanceSubtext}>
            You have transacted 4 times today
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

        <View style={styles.txnList}>
          {TRANSACTIONS.map((txn) => (
            <TransactionItem key={txn.id} item={txn} />
          ))}
        </View>
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
    paddingTop: 20,
  },
  balanceCard: {
    borderWidth: 1,
    borderColor: 'rgba(174, 255, 58, 0.4)',
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.01)',
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.lg,
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
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.accent,
    fontSize: 52,
    lineHeight: 58,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    letterSpacing: -0.3,
  },
  balanceSubtext: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.35)',
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 18,
  },
  actionsRow: {
    marginTop: darkTheme.spacing.lg,
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
    marginTop: darkTheme.spacing.xl,
    marginBottom: darkTheme.spacing.xs,
    color: 'rgba(255,255,255,0.6)',
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 22,
  },
  txnList: {
    marginTop: darkTheme.spacing.sm,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  txnIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.sm,
  },
  txnBody: {
    flex: 1,
  },
  txnTitle: {
    color: darkTheme.colors.text,
    fontSize: 30 / 2,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  txnSubtitle: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.42)',
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 18,
  },
  txnMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: darkTheme.spacing.sm,
  },
  txnAmount: {
    fontSize: darkTheme.typography.fontSizes.lg,
    lineHeight: 24,
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
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 18,
  },
  bottomNav: {
    borderTopWidth: 0,
    paddingBottom: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.xs,
  },
});

export default WalletScreen;

