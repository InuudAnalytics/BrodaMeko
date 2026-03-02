import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AppText from './AppText';
import { getContactStatus } from '../services/auth.service';
import { useAuth } from '../context';
import { ROLES, ROUTES } from '../utils';

const PersonalInfoAlert = ({ style }) => {
  const navigation = useNavigation();
  const { role } = useAuth();
  const [status, setStatus] = useState(null);

  const personalInfoRoute = role === ROLES.MECH
    ? ROUTES.MECH_EDIT_PROFILE
    : role === ROLES.SPARE_PARTS_SELLER
      ? ROUTES.SPARE_PARTS_PERSONAL_INFO
      : ROUTES.CAR_OWNER_EDIT_PROFILE;

  const shouldShow = useMemo(() => {
    if (!status) {
      return false;
    }
    const data = status?.data || status;
    const isComplete = Boolean(data?.is_complete);
    const hasEmail = Boolean(data?.has_email);
    const hasPhone = Boolean(data?.has_phone);
    return !isComplete || !hasEmail || !hasPhone;
  }, [status]);

  const subtitle = useMemo(() => {
    if (!status) return '';
    const data = status?.data || status;
    if (!data?.has_email) return 'Please add your email address.';
    if (!data?.has_phone) return 'Please add your phone number.';
    return 'Please complete your personal information.';
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          const response = await getContactStatus();
          if (active) setStatus(response);
        } catch {
          if (active) setStatus(null);
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [])
  );

  if (!shouldShow) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <AppText style={styles.title}>Complete your profile</AppText>
      <AppText style={styles.subtitle}>{subtitle}</AppText>
      <TouchableOpacity
        style={styles.action}
        onPress={() => navigation.navigate(personalInfoRoute)}
        activeOpacity={0.85}
      >
        <AppText style={styles.actionText}>Update personal info</AppText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    zIndex: 30,
    backgroundColor: '#1A1A4A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
  },
  action: {
    marginTop: 8,
    backgroundColor: '#E6C714',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  actionText: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default PersonalInfoAlert;
