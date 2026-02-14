import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowDownLeft01Icon,
  PlusSignIcon,
  ViewIcon,
  ViewOffIcon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import MechanicTabBar from '../../../components/navigation/MechanicTabBar';
import { darkTheme } from '../../../theme';

const TRANSACTIONS = [
  {
    id: 'tx_1',
    title: 'Escrow refund',
    subtitle: 'Job #1208 cancelled',
    amount: '+3000',
    isCredit: true,
    time: 'Today 2:14PM',
    icon: ArrowDownLeft01Icon,
  },
  {
    id: 'tx_2',
    title: 'Engine repair',
    subtitle: 'Emeka Okafor',
    amount: '-300',
    isCredit: false,
    time: 'Today 7:14PM',
    icon: Wrench01Icon,
  },
  {
    id: 'tx_3',
    title: 'Wallet top-up',
    subtitle: 'Visa card',
    amount: '+93600',
    isCredit: true,
    time: 'Today 7:14PM',
    icon: PlusSignIcon,
  },
  {
    id: 'tx_4',
    title: 'Brake service',
    subtitle: 'Chidi Nwosu',
    amount: '-9300',
    isCredit: false,
    time: 'Today 7:14PM',
    icon: Wrench01Icon,
  },
];

const TransactionRow = ({ item }) => {
  return (
    <View style={styles.txnRow}>
      <View style={styles.txnLeft}>
        <View style={styles.txnIconWrap}>
          <HugeiconsIcon icon={item.icon} size={18} color="#1A1A1A" strokeWidth={2.1} />
        </View>
        <View>
          <AppText style={styles.txnTitle}>{item.title}</AppText>
          <AppText style={styles.txnSubtitle}>{item.subtitle}</AppText>
        </View>
      </View>

      <View style={styles.txnRight}>
        <AppText style={[styles.txnAmount, item.isCredit ? styles.txnAmountCredit : styles.txnAmountDebit]}>
          {item.amount}
        </AppText>
        <AppText style={styles.txnTime}>{item.time}</AppText>
      </View>
    </View>
  );
};

const MechanicWalletScreen = ({ navigation, onTabPress, showTabBar = true }) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const balanceText = useMemo(() => (isBalanceVisible ? '# 5000' : '****'), [isBalanceVisible]);

  const handleTabPress = (tab) => {
    if (typeof onTabPress === 'function') {
      onTabPress(tab);
      return;
    }

    if (tab === 'wallet') {
      return;
    }

    if (tab === 'home') {
      navigation.navigate('MechanicDashboardTabs');
      return;
    }

    if (tab === 'jobs') {
      navigation.navigate('Placeholder', { title: 'Jobs', subtitle: 'Jobs page is coming soon.' });
      return;
    }

    navigation.navigate('Placeholder', { title: 'Chat', subtitle: 'Chat page is coming soon.' });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <AppText style={styles.balanceLabel}>Available balance</AppText>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.eyeBtn}
                onPress={() => setIsBalanceVisible((prev) => !prev)}
              >
                <HugeiconsIcon
                  icon={isBalanceVisible ? ViewIcon : ViewOffIcon}
                  size={20}
                  color={darkTheme.colors.muted}
                  strokeWidth={2.1}
                />
              </TouchableOpacity>
            </View>

            <AppText style={styles.balanceAmount}>{balanceText}</AppText>
            <AppText style={styles.weeklyText}>47,000 earned this week</AppText>

            <AppButton
              label="Withdraw to bank"
              onPress={() => navigation.navigate('Placeholder', { title: 'Withdraw to bank' })}
              style={styles.withdrawBtn}
              textStyle={styles.withdrawBtnText}
            />
          </View>

          <View style={styles.miniStatsRow}>
            <View style={styles.miniStatCard}>
              <AppText style={styles.miniStatLabel}>This month</AppText>
              <AppText style={styles.miniStatValue}>124,890</AppText>
            </View>
            <View style={styles.miniStatCard}>
              <AppText style={styles.miniStatLabel}>Total withdrawn</AppText>
              <AppText style={styles.miniStatValue}>100,000</AppText>
            </View>
          </View>

          <AppText style={styles.sectionTitle}>Recent transactions</AppText>
          <View style={styles.txnList}>
            {TRANSACTIONS.map((item) => (
              <TransactionRow key={item.id} item={item} />
            ))}
          </View>
        </ScrollView>

        {showTabBar ? <MechanicTabBar activeTab="wallet" onTabPress={handleTabPress} /> : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  container: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  balanceCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 14,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  eyeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAmount: {
    marginTop: 6,
    color: darkTheme.colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  weeklyText: {
    marginTop: 4,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  withdrawBtn: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 10,
  },
  withdrawBtnText: {
    color: '#1A1A1A',
    fontSize: 14,
  },
  miniStatsRow: {
    marginTop: 12,
    flexDirection: 'row',
    columnGap: 10,
  },
  miniStatCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  miniStatLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  miniStatValue: {
    marginTop: 4,
    color: darkTheme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  sectionTitle: {
    marginTop: 18,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  txnList: {
    marginTop: 10,
    rowGap: 12,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    columnGap: 10,
  },
  txnIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnTitle: {
    color: darkTheme.colors.text,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  txnSubtitle: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 16,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  txnAmountCredit: {
    color: '#A8FF3E',
  },
  txnAmountDebit: {
    color: '#FF6B6B',
  },
  txnTime: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default MechanicWalletScreen;
