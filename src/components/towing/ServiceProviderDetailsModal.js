import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Copy01Icon, Location06Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import AppText from '../AppText';
import { darkTheme } from '../../theme';

const showCopiedToast = () => {
  if (Platform.OS === 'android') {
    ToastAndroid.show('Copied', ToastAndroid.SHORT);
    return;
  }

  Alert.alert('Copied');
};

const makeLocationLabel = (provider) => {
  const parts = [provider?.street, provider?.city, provider?.state, provider?.country]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return parts.join(', ');
};

const makeCoverageLabel = (provider) => {
  const parts = [provider?.city, provider?.state, provider?.country]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return parts.join(', ');
};

const normalizePriceRows = (priceList) => {
  if (!priceList) {
    return [];
  }

  if (Array.isArray(priceList)) {
    return priceList
      .map((entry) => {
        if (entry === null || entry === undefined) {
          return null;
        }

        if (typeof entry === 'string' || typeof entry === 'number') {
          return {
            title: String(entry),
            detail: '',
          };
        }

        if (typeof entry === 'object') {
          const values = Object.values(entry).filter((value) => value !== null && value !== undefined && String(value).trim());
          const [title, ...rest] = values;

          if (!title) {
            return null;
          }

          return {
            title: String(title),
            detail: rest.map((value) => String(value)).join(' · '),
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  if (typeof priceList === 'object') {
    return Object.entries(priceList)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
      .map(([key, value]) => ({
        title: String(key),
        detail: String(value),
      }));
  }

  return [];
};

const CopyRow = ({ value, icon }) => {
  const safeValue = String(value || '').trim();

  if (!safeValue) {
    return null;
  }

  const handleCopy = () => {
    Clipboard.setString(safeValue);
    showCopiedToast();
  };

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handleCopy} style={styles.contactRow}>
      <View style={styles.contactValueWrap}>
        <HugeiconsIcon icon={icon} size={14} color={darkTheme.colors.accent} strokeWidth={2} />
        <AppText style={styles.contactValue}>{safeValue}</AppText>
      </View>
      <HugeiconsIcon icon={Copy01Icon} size={16} color={darkTheme.colors.accent} strokeWidth={2.2} />
    </TouchableOpacity>
  );
};

const ServiceProviderDetailsModal = ({ visible, provider, onClose, serviceLabel = 'provider' }) => {
  const phoneNumbers = Array.isArray(provider?.phone_numbers) ? provider.phone_numbers : [];
  const emails = Array.isArray(provider?.emails) ? provider.emails : [];
  const priceRows = normalizePriceRows(provider?.price_list);
  const fullLocation = makeLocationLabel(provider);
  const coverageLabel = makeCoverageLabel(provider);
  const hoursLabel =
    String(provider?.hours || provider?.operating_hours || provider?.availability || '')
      .trim();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.heroIconWrap}>
              <View style={styles.heroIconRing}>
                <HugeiconsIcon icon={Location06Icon} size={26} color={darkTheme.colors.accent} strokeWidth={1.8} />
              </View>
            </View>

            <AppText style={styles.name}>{provider?.company_name || `Selected ${serviceLabel}`}</AppText>

            <AppText style={styles.sectionTitle}>Location</AppText>
            <AppText style={styles.sectionBody}>{fullLocation || 'Address not available yet.'}</AppText>

            <AppText style={styles.label}>Coverage</AppText>
            <AppText style={styles.sectionBody}>{coverageLabel || 'Coverage not available yet.'}</AppText>

            {hoursLabel ? (
              <>
                <AppText style={styles.label}>Hours</AppText>
                <AppText style={styles.sectionBody}>{hoursLabel}</AppText>
              </>
            ) : null}

            <AppText style={styles.sectionTitle}>Contact details</AppText>
            <View style={styles.contactList}>
              {phoneNumbers.length ? phoneNumbers.map((phone) => <CopyRow key={`phone-${phone}`} value={phone} icon={Location06Icon} />) : null}
              {emails.length ? emails.map((email) => <CopyRow key={`email-${email}`} value={email} icon={Mail01Icon} />) : null}
              {!phoneNumbers.length && !emails.length ? (
                <AppText style={styles.sectionBody}>No contact details available yet.</AppText>
              ) : null}
            </View>

            <AppText style={styles.sectionTitle}>Price list</AppText>
            {priceRows.length ? (
              <View style={styles.priceList}>
                {priceRows.map((row, index) => (
                  <View key={`${row.title}-${index}`} style={styles.priceRow}>
                    <AppText style={styles.priceTitle}>{row.title}</AppText>
                    {row.detail ? <AppText style={styles.priceDetail}>{row.detail}</AppText> : null}
                  </View>
                ))}
              </View>
            ) : (
              <AppText style={styles.sectionBody}>No price list available yet.</AppText>
            )}
          </ScrollView>
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
    maxHeight: '78%',
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
  heroIconWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  heroIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  contactValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  contactValue: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  priceList: {
    rowGap: 8,
  },
  priceRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceTitle: {
    color: darkTheme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  priceDetail: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default ServiceProviderDetailsModal;
