import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';

const BankDetailsScreen = ({ navigation }) => {
  const { mechanicProfile, setBankDetails } = useMechanicProfile();
  const existing = mechanicProfile.bankDetails || {};

  const [accountName, setAccountName] = useState(existing.accountName || '');
  const [accountNumber, setAccountNumber] = useState(existing.accountNumber || '');
  const [bankName, setBankName] = useState(existing.bankName || '');

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

  const handleSave = () => {
    if (!isValid) {
      Alert.alert('Invalid details', 'Enter account name, bank name and a valid account number (10+ digits).');
      return;
    }

    setBankDetails({
      accountName: String(accountName).trim(),
      accountNumber: String(accountNumber).replace(/\D/g, ''),
      bankName: String(bankName).trim(),
    });
    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Add bank details</AppText>
        </View>

        <AppText style={styles.helper}>These details will be used for your withdrawals.</AppText>

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
          onChangeText={setAccountNumber}
          placeholder="0123456789"
          keyboardType="number-pad"
        />

        <AppInput
          label="Bank name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="GTBank"
          autoCapitalize="words"
        />

        <AppButton label="Save & continue" onPress={handleSave} style={styles.saveBtn} />
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
    marginBottom: 8,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  saveBtn: {
    marginTop: 'auto',
  },
});

export default BankDetailsScreen;
