import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ArrowRight01Icon, ImageUploadIcon } from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppInput,
  AppText,
  ScreenContainer,
} from '../../../components';
import { useSparePartsProfile } from '../../../context';
import {
  createSellerStore,
  getSellerStore,
  updateSellerStore,
  uploadSellerStoreBanner,
} from '../../../services/spareParts.service';
import { darkTheme, withAlpha } from '../../../theme';
import {
  getSparePartsOnboardingStepIndex,
  pickSingleImageFromGallery,
  ROUTES,
  SPARE_PARTS_ONBOARDING_STEPS,
} from '../../../utils';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
const DELIVERY_TYPES = ['pickup', 'delivery', 'both'];
const DELIVERY_SCOPES = ['state', 'nationwide'];
const TIME_OPTIONS = Array.from({ length: 24 * 60 }, (_, index) => {
  const hours = String(Math.floor(index / 60)).padStart(2, '0');
  const minutes = String(index % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
});

const normalizeStorePayload = payload => {
  const root = payload?.data || payload || {};
  const store = root?.store || root?.data || root;

  return store && typeof store === 'object' ? store : null;
};

const toNumberString = value => String(value || '').replace(/[^0-9.-]/g, '');

const SparePartsAddressScreen = ({ navigation, route }) => {
  const { setStoreDetails, sparePartsProfile, completedSteps } =
    useSparePartsProfile();
  const isOnboarding = Boolean(route?.params?.onboarding);
  const stepIndex = getSparePartsOnboardingStepIndex(
    ROUTES.SPARE_PARTS_ADDRESS,
  );
  const totalSteps = SPARE_PARTS_ONBOARDING_STEPS.length;
  const progressPercent = useMemo(
    () => (stepIndex / totalSteps) * 100,
    [stepIndex, totalSteps],
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [bannerUri, setBannerUri] = useState(
    sparePartsProfile.storeDetails?.bannerUrl || '',
  );

  const [storeName, setStoreName] = useState(
    sparePartsProfile.storeDetails?.storeName || '',
  );
  const [description, setDescription] = useState(
    sparePartsProfile.storeDetails?.description || '',
  );
  const [street, setStreet] = useState(
    sparePartsProfile.storeDetails?.street || '',
  );
  const [city, setCity] = useState(sparePartsProfile.storeDetails?.city || '');
  const [stateName, setStateName] = useState(
    sparePartsProfile.storeDetails?.state || '',
  );
  const [country, setCountry] = useState(
    sparePartsProfile.storeDetails?.country || '',
  );
  const [latitude, setLatitude] = useState(
    sparePartsProfile.storeDetails?.latitude || '',
  );
  const [longitude, setLongitude] = useState(
    sparePartsProfile.storeDetails?.longitude || '',
  );
  const [openingTime, setOpeningTime] = useState(
    sparePartsProfile.storeDetails?.openingTime || '',
  );
  const [closingTime, setClosingTime] = useState(
    sparePartsProfile.storeDetails?.closingTime || '',
  );
  const [openDays, setOpenDays] = useState(
    sparePartsProfile.storeDetails?.openDays || [],
  );
  const [deliveryType, setDeliveryType] = useState(
    sparePartsProfile.storeDetails?.deliveryType || 'both',
  );
  const [deliveryScope, setDeliveryScope] = useState(
    sparePartsProfile.storeDetails?.deliveryScope || 'state',
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeTarget, setTimeTarget] = useState('opening');

  const [storeExists, setStoreExists] = useState(false);

  useEffect(() => {
    if (!isOnboarding) {
      return;
    }

    if (!completedSteps.nin) {
      Alert.alert('Complete previous step', 'Please upload your NIN first.');
      navigation.replace(ROUTES.SPARE_PARTS_PROFILE_SETUP);
    }
  }, [completedSteps.nin, isOnboarding, navigation]);

  const seedFromStore = useCallback(store => {
    if (!store) {
      return;
    }

    setStoreName(String(store?.store_name || store?.storeName || ''));
    setDescription(String(store?.description || ''));
    setStreet(String(store?.street || ''));
    setCity(String(store?.city || ''));
    setStateName(String(store?.state || ''));
    setCountry(String(store?.country || ''));
    setLatitude(String(store?.latitude ?? ''));
    setLongitude(String(store?.longitude ?? ''));
    setOpeningTime(String(store?.opening_time || store?.openingTime || ''));
    setClosingTime(String(store?.closing_time || store?.closingTime || ''));
    setOpenDays(
      Array.isArray(store?.open_days || store?.openDays)
        ? store?.open_days || store?.openDays
        : [],
    );
    setDeliveryType(
      String(store?.delivery_type || store?.deliveryType || 'both'),
    );
    setDeliveryScope(
      String(store?.delivery_scope || store?.deliveryScope || 'state'),
    );
    setBannerUri(String(store?.banner_url || store?.bannerUrl || ''));
  }, []);

  useEffect(() => {
    let active = true;

    const fetchStore = async () => {
      setLoading(true);
      setErrorText('');
      try {
        const response = await getSellerStore();
        const store = normalizeStorePayload(response);
        if (!active) {
          return;
        }
        if (store) {
          setStoreExists(true);
          seedFromStore(store);
          setStoreDetails(store);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        // ignore if no store yet
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchStore();

    return () => {
      active = false;
    };
  }, [seedFromStore, setStoreDetails]);

  const toggleDay = day => {
    setOpenDays(prev =>
      prev.includes(day) ? prev.filter(value => value !== day) : [...prev, day],
    );
  };

  const openTimePicker = target => {
    setTimeTarget(target);
    setShowTimePicker(true);
  };

  const pickBanner = async () => {
    const { cancelled, asset, error } = await pickSingleImageFromGallery();
    if (cancelled) {
      return;
    }
    if (error) {
      Alert.alert('Upload failed', error);
      return;
    }
    if (asset?.uri) {
      setBannerUri(asset.uri);
    }
  };

  const handleSubmit = async () => {
    if (!storeName || !street || !city || !stateName || !country) {
      setErrorText('Please complete the store name and address fields.');
      return;
    }

    if (!openingTime || !closingTime) {
      setErrorText('Please provide opening and closing time.');
      return;
    }

    if (!openDays.length) {
      setErrorText('Please select at least one open day.');
      return;
    }

    setSaving(true);
    setErrorText('');

    const payload = {
      store_name: storeName,
      description,
      street,
      city,
      state: stateName,
      country,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      opening_time: openingTime,
      closing_time: closingTime,
      open_days: openDays,
      delivery_type: deliveryType,
      delivery_scope: deliveryScope,
    };

    try {
      if (storeExists) {
        await updateSellerStore(payload);
      } else {
        await createSellerStore(payload);
        setStoreExists(true);
      }

      if (bannerUri && !bannerUri.startsWith('http')) {
        await uploadSellerStoreBanner({
          uri: bannerUri,
          fileName: 'store-banner.jpg',
          type: 'image/jpeg',
        });
      }

      setStoreDetails({
        store_name: storeName,
        description,
        street,
        city,
        state: stateName,
        country,
        latitude,
        longitude,
        opening_time: openingTime,
        closing_time: closingTime,
        open_days: openDays,
        delivery_type: deliveryType,
        delivery_scope: deliveryScope,
        banner_url: bannerUri,
      });

      if (isOnboarding) {
        navigation.replace(ROUTES.SPARE_PARTS_BANK_DETAILS, {
          onboarding: true,
        });
        return;
      }

      navigation.goBack();
    } catch (error) {
      setErrorText(error?.message || 'Unable to save store details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      padded={false}
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.screen}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              color={darkTheme.colors.text}
              strokeWidth={2.1}
            />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>
            {isOnboarding ? 'Store setup' : 'Manage store'}
          </AppText>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          {isOnboarding ? (
            <>
              <AppText style={styles.helper}>Set up your store details</AppText>
              <AppText style={styles.stepLabel}>
                Step {stepIndex} of {totalSteps}
              </AppText>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </>
          ) : null}

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {errorText ? (
            <AppText style={styles.errorText}>{errorText}</AppText>
          ) : null}

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Store details</AppText>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
          </View>
          <AppInput
            label="Store name"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Boda Auto Hub"
          />
          <AppInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Quality spare parts and certified mechanic services."
            multiline
            inputStyle={styles.multilineInput}
          />

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Store banner</AppText>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
          </View>
          <TouchableOpacity
            style={styles.bannerCard}
            activeOpacity={0.85}
            onPress={pickBanner}
          >
            {bannerUri ? (
              <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
            ) : (
              <>
                <View style={styles.uploadIconBadge}>
                  <HugeiconsIcon
                    icon={ImageUploadIcon}
                    size={22}
                    color={darkTheme.colors.accent}
                    strokeWidth={1.9}
                  />
                </View>
                <AppText style={styles.bannerTitle}>
                  Upload store banner
                </AppText>
                <AppText style={styles.bannerSubtitle}>
                  Add a wide banner image for your store
                </AppText>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Location</AppText>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
          </View>
          <AppInput
            label="Street"
            value={street}
            onChangeText={setStreet}
            placeholder="12 Admiralty Way"
          />
          <View style={styles.rowInputs}>
            <View style={styles.rowInputItem}>
              <AppInput
                label="City"
                value={city}
                onChangeText={setCity}
                placeholder="Lekki"
              />
            </View>
            <View style={styles.rowInputItem}>
              <AppInput
                label="State"
                value={stateName}
                onChangeText={setStateName}
                placeholder="Lagos"
              />
            </View>
          </View>
          <AppInput
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="Nigeria"
          />
          <View style={styles.rowInputs}>
            <View style={styles.rowInputItem}>
              <AppInput
                label="Latitude"
                value={latitude}
                onChangeText={value => setLatitude(toNumberString(value))}
                placeholder="6.4698"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.rowInputItem}>
              <AppInput
                label="Longitude"
                value={longitude}
                onChangeText={value => setLongitude(toNumberString(value))}
                placeholder="3.5852"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Operating hours</AppText>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
          </View>
          <View style={styles.rowInputs}>
            <View style={styles.rowInputItem}>
              <AppText style={styles.sectionLabel}>Opening time</AppText>
              <TouchableOpacity
                style={styles.timePickerTrigger}
                activeOpacity={0.85}
                onPress={() => openTimePicker('opening')}
              >
                <AppText style={[styles.timePickerText, !openingTime ? styles.timePlaceholder : null]}>
                  {openingTime || '08:00'}
                </AppText>
              </TouchableOpacity>
            </View>
            <View style={styles.rowInputItem}>
              <AppText style={styles.sectionLabel}>Closing time</AppText>
              <TouchableOpacity
                style={styles.timePickerTrigger}
                activeOpacity={0.85}
                onPress={() => openTimePicker('closing')}
              >
                <AppText style={[styles.timePickerText, !closingTime ? styles.timePlaceholder : null]}>
                  {closingTime || '18:00'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Open days</AppText>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
          </View>
          <View style={styles.chipRow}>
            {DAYS.map(day => {
              const active = openDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, active ? styles.dayChipActive : null]}
                  activeOpacity={0.85}
                  onPress={() => toggleDay(day)}
                >
                  <AppText
                    style={[
                      styles.dayChipText,
                      active ? styles.dayChipTextActive : null,
                    ]}
                  >
                    {day.slice(0, 3)}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle}>Delivery</AppText>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(255,255,255,0.5)" strokeWidth={2} />
          </View>
          <AppText style={styles.sectionLabel}>Delivery type</AppText>
          <View style={styles.chipRow}>
            {DELIVERY_TYPES.map(type => {
              const active = deliveryType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.dayChip, active ? styles.dayChipActive : null]}
                  activeOpacity={0.85}
                  onPress={() => setDeliveryType(type)}
                >
                  <AppText
                    style={[
                      styles.dayChipText,
                      active ? styles.dayChipTextActive : null,
                    ]}
                  >
                    {type === 'pickup'
                      ? 'Pickup'
                      : type === 'delivery'
                      ? 'Delivery'
                      : 'Both'}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppText style={styles.sectionLabel}>Delivery scope</AppText>
          <View style={styles.chipRow}>
            {DELIVERY_SCOPES.map(scope => {
              const active = deliveryScope === scope;
              return (
                <TouchableOpacity
                  key={scope}
                  style={[styles.dayChip, active ? styles.dayChipActive : null]}
                  activeOpacity={0.85}
                  onPress={() => setDeliveryScope(scope)}
                >
                  <AppText
                    style={[
                      styles.dayChipText,
                      active ? styles.dayChipTextActive : null,
                    ]}
                  >
                    {scope === 'state' ? 'State' : 'Nationwide'}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <AppButton
            label={saving ? 'Saving...' : isOnboarding ? 'Continue' : 'Save'}
            onPress={handleSubmit}
            disabled={saving}
            style={styles.saveBtn}
          />
        </ScrollView>
      </View>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timeModalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowTimePicker(false)} />
          <View style={styles.timeModalCard}>
            <AppText style={styles.timeModalTitle}>
              {timeTarget === 'opening' ? 'Select opening time' : 'Select closing time'}
            </AppText>
            <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
              {TIME_OPTIONS.map(time => (
                <TouchableOpacity
                  key={time}
                  style={styles.timeRow}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (timeTarget === 'opening') {
                      setOpeningTime(time);
                    } else {
                      setClosingTime(time);
                    }
                    setShowTimePicker(false);
                  }}
                >
                  <AppText style={styles.timeRowText}>{time}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
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
  formContent: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  helper: {
    marginTop: 8,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  stepLabel: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  loadingRow: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 10,
    color: '#FF7B8A',
    fontSize: 12,
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 6,
  },
  rowInputs: {
    flexDirection: 'row',
    columnGap: 12,
  },
  rowInputItem: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dayChipActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  dayChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  dayChipTextActive: {
    color: '#1A1A1A',
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  bannerCard: {
    minHeight: 140,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: withAlpha(darkTheme.colors.accent, 0.5),
    borderStyle: 'dashed',
    backgroundColor: '#727497',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  bannerImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  uploadIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  bannerSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    textAlign: 'center',
  },
  timePickerTrigger: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  timePickerText: {
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  timePlaceholder: {
    color: darkTheme.colors.muted,
  },
  timeModalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  timeModalCard: {
    backgroundColor: '#11112E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '70%',
  },
  timeModalTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 10,
    textAlign: 'center',
  },
  timeList: {
    maxHeight: 360,
  },
  timeRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  timeRowText: {
    color: darkTheme.colors.text,
    fontSize: 14,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 12,
  },
  multilineInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});

export default SparePartsAddressScreen;
