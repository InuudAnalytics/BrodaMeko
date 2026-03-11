import React from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Copy01Icon } from '@hugeicons/core-free-icons';
import AppText from '../AppText';
import { darkTheme } from '../../theme';

const showCopiedToast = () => {
  if (Platform.OS === 'android') {
    ToastAndroid.show('Copied', ToastAndroid.SHORT);
    return;
  }
  Alert.alert('Copied');
};

const TowingCompanyDetailsModal = ({ visible, company, onClose }) => {
  const phoneNumbers = Array.isArray(company?.phoneNumbers) ? company.phoneNumbers : [];

  const handleCopy = (phone) => {
    const safePhone = String(phone || '').trim();
    if (!safePhone) {
      return;
    }
    Clipboard.setString(safePhone);
    showCopiedToast();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing}>
              {company?.image ? (
                <Image source={{ uri: company.image }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarImageWrap}>
                  <AppText style={styles.imageFallback}>{String(company?.name || 'T').trim().charAt(0).toUpperCase() || 'T'}</AppText>
                </View>
              )}
            </View>
          </View>
          <AppText style={styles.name}>{company?.name || ''}</AppText>

          <AppText style={styles.sectionTitle}>Instructions</AppText>
          <AppText style={styles.sectionBody}>{company?.instructions || 'No instructions yet.'}</AppText>

          <AppText style={styles.sectionTitle}>Information details</AppText>
          <AppText style={styles.label}>Address</AppText>
          <AppText style={styles.sectionBody}>{company?.address || 'N/A'}</AppText>

          <AppText style={styles.label}>Contact details</AppText>
          <View style={styles.contactList}>
            {phoneNumbers.length ? (
              phoneNumbers.map((phone) => (
                <TouchableOpacity
                  key={`${company?.id || 'company'}-${phone}`}
                  activeOpacity={0.85}
                  onPress={() => handleCopy(phone)}
                  style={styles.contactRow}
                >
                  <AppText style={styles.phoneText}>{phone}</AppText>
                  <HugeiconsIcon icon={Copy01Icon} size={16} color={darkTheme.colors.accent} strokeWidth={2.2} />
                </TouchableOpacity>
              ))
            ) : (
              <AppText style={styles.sectionBody}>N/A</AppText>
            )}
          </View>
          {/* TODO: add towing booking CTA when backend endpoint is available */}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.56)',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#090C4D',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: 'cover',
  },
  imageFallback: {
    color: darkTheme.colors.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  name: {
    textAlign: 'center',
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
    marginBottom: 14,
  },
  sectionTitle: {
    marginTop: 4,
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 6,
  },
  sectionBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    marginTop: 10,
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  contactList: {
    rowGap: 8,
  },
  contactRow: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneText: {
    color: darkTheme.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default TowingCompanyDetailsModal;
