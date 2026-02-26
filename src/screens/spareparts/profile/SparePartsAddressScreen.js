import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Tick04Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useSparePartsProfile } from '../../../context';
import { addSparePartsAddress, getSparePartsAddresses, updateSparePartsAddress } from '../../../services/spareParts.service';
import { darkTheme } from '../../../theme';
import { getSparePartsOnboardingStepIndex, ROUTES, SPARE_PARTS_ONBOARDING_STEPS } from '../../../utils';

const buildEmptyAddress = () => ({
  id: `new-${Date.now()}-${Math.random()}`,
  addressType: 'shop',
  label: '',
  street: '',
  city: '',
  state: '',
  country: '',
  latitude: '',
  longitude: '',
  isPrimary: false,
  isExisting: false,
  isEditing: true,
  error: '',
});

const normalizeAddresses = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.addresses)) {
    return payload.addresses;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.address)) {
    return payload.address;
  }

  return [];
};

const toDigits = (value) => String(value || '').replace(/[^0-9.-]/g, '');

const SparePartsAddressScreen = ({ navigation, route }) => {
  const { setAddresses, completedSteps } = useSparePartsProfile();
  const isOnboarding = Boolean(route?.params?.onboarding);
  const stepIndex = getSparePartsOnboardingStepIndex(ROUTES.SPARE_PARTS_ADDRESS);
  const totalSteps = SPARE_PARTS_ONBOARDING_STEPS.length;
  const progressPercent = useMemo(() => (stepIndex / totalSteps) * 100, [stepIndex, totalSteps]);

  const [rows, setRows] = useState([buildEmptyAddress()]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    if (!isOnboarding) {
      return;
    }

    if (!completedSteps.nin) {
      Alert.alert('Complete previous step', 'Please upload your NIN first.');
      navigation.replace(ROUTES.SPARE_PARTS_PROFILE_SETUP);
    }
  }, [completedSteps.nin, isOnboarding, navigation]);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setGlobalError('');

    try {
      const response = await getSparePartsAddresses();
      const list = normalizeAddresses(response?.data || response);
      const mapped = list.map((item, index) => ({
        id: String(item?.id || item?._id || `${index}`),
        addressType: String(item?.address_type || item?.addressType || 'shop'),
        label: String(item?.label || ''),
        street: String(item?.street || ''),
        city: String(item?.city || ''),
        state: String(item?.state || ''),
        country: String(item?.country || ''),
        latitude: String(item?.latitude ?? ''),
        longitude: String(item?.longitude ?? ''),
        isPrimary: Boolean(item?.is_primary || item?.isPrimary),
        isExisting: true,
        isEditing: false,
        error: '',
      }));

      setRows(mapped.length ? mapped : [buildEmptyAddress()]);
      setAddresses(mapped);
    } catch (error) {
      setGlobalError(error?.message || 'Unable to fetch addresses.');
      setRows([buildEmptyAddress()]);
    } finally {
      setLoading(false);
    }
  }, [setAddresses]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const updateRow = (rowId, patch) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch, error: patch.error ?? '' } : row))
    );
  };

  const togglePrimary = (rowId) => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        isPrimary: row.id === rowId,
      }))
    );
  };

  const validateRow = (row) => {
    if (!row.label || !row.street || !row.city || !row.state || !row.country) {
      return 'Please complete all address fields.';
    }

    if (row.latitude && Number.isNaN(Number(row.latitude))) {
      return 'Latitude must be a valid number.';
    }

    if (row.longitude && Number.isNaN(Number(row.longitude))) {
      return 'Longitude must be a valid number.';
    }

    return '';
  };

  const persistRow = async (row) => {
    const validationError = validateRow(row);
    if (validationError) {
      updateRow(row.id, { error: validationError });
      return false;
    }

    setSavingId(row.id);
    setGlobalError('');

    const payload = {
      address_type: row.addressType,
      label: row.label,
      street: row.street,
      city: row.city,
      state: row.state,
      country: row.country,
      latitude: row.latitude ? Number(row.latitude) : undefined,
      longitude: row.longitude ? Number(row.longitude) : undefined,
      is_primary: Boolean(row.isPrimary),
    };

    try {
      if (row.isExisting) {
        await updateSparePartsAddress(row.id, payload);
        updateRow(row.id, { isEditing: false });
        return true;
      }

      const response = await addSparePartsAddress(payload);
      const payloadData = response?.data || response || {};
      const created = payloadData?.address || payloadData?.data || payloadData;
      const createdId = String(created?.id || created?._id || '').trim();
      if (createdId) {
        updateRow(row.id, { id: createdId, isExisting: true, isEditing: false });
      } else {
        await fetchAddresses();
      }
      return true;
    } catch (error) {
      updateRow(row.id, { error: error?.message || 'Unable to save address.' });
      return false;
    } finally {
      setSavingId('');
    }
  };

  const handleAddAnother = () => {
    setRows((prev) => [...prev, buildEmptyAddress()]);
  };

  const handleFinish = () => {
    let hasPending = false;

    for (const row of rows) {
      const hasAnyInput = Boolean(row.label || row.street || row.city || row.state || row.country);
      if (row.isExisting && row.isEditing) {
        updateRow(row.id, { error: 'Please save your edits before continuing.' });
        hasPending = true;
      }
      if (!row.isExisting && hasAnyInput) {
        updateRow(row.id, { error: 'Please save this address before continuing.' });
        hasPending = true;
      }
    }

    if (hasPending) {
      return;
    }

    const persisted = rows.filter((row) => row.isExisting);
    if (isOnboarding && !persisted.length) {
      if (rows[0]) {
        updateRow(rows[0].id, { error: 'Please add at least one address to continue.' });
      }
      return;
    }
    setAddresses(persisted);

    if (isOnboarding) {
      navigation.replace(ROUTES.SPARE_PARTS_BANK_DETAILS, { onboarding: true });
      return;
    }

    navigation.goBack();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>{isOnboarding ? 'Verification screen' : 'Address'}</AppText>
        </View>

        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          {isOnboarding ? (
            <>
              <AppText style={styles.helper}>Please add your store address</AppText>
              <AppText style={styles.stepLabel}>Step {stepIndex} of {totalSteps}</AppText>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </>
          ) : null}

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {globalError ? <AppText style={styles.errorText}>{globalError}</AppText> : null}

          <View style={styles.list}>
            {rows.map((row, index) => {
              const readOnly = row.isExisting && !row.isEditing;
              const isSaving = savingId === row.id;
              return (
                <View key={`${row.id}-${index}`} style={styles.card}>
                  <AppText style={styles.sectionLabel}>Address type</AppText>
                  <View style={styles.typeRow}>
                    {['home', 'shop'].map((type) => {
                      const active = row.addressType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          activeOpacity={0.85}
                          style={[styles.typeChip, active ? styles.typeChipActive : null]}
                          onPress={() => updateRow(row.id, { addressType: type })}
                          disabled={readOnly}
                        >
                          <AppText style={[styles.typeText, active ? styles.typeTextActive : null]}>
                            {type === 'home' ? 'Home' : 'Shop'}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <AppInput
                    label="Label"
                    value={row.label}
                    onChangeText={(value) => updateRow(row.id, { label: value })}
                    placeholder="Main workshop"
                    editable={!readOnly}
                  />
                  <AppInput
                    label="Street"
                    value={row.street}
                    onChangeText={(value) => updateRow(row.id, { street: value })}
                    placeholder="Street address"
                    editable={!readOnly}
                  />
                  <View style={styles.rowInputs}>
                    <View style={styles.rowInputItem}>
                      <AppInput
                        label="City"
                        value={row.city}
                        onChangeText={(value) => updateRow(row.id, { city: value })}
                        placeholder="City"
                        editable={!readOnly}
                      />
                    </View>
                    <View style={styles.rowInputItem}>
                      <AppInput
                        label="State"
                        value={row.state}
                        onChangeText={(value) => updateRow(row.id, { state: value })}
                        placeholder="State"
                        editable={!readOnly}
                      />
                    </View>
                  </View>
                  <AppInput
                    label="Country"
                    value={row.country}
                    onChangeText={(value) => updateRow(row.id, { country: value })}
                    placeholder="Country"
                    editable={!readOnly}
                  />
                  <View style={styles.rowInputs}>
                    <View style={styles.rowInputItem}>
                      <AppInput
                        label="Latitude"
                        value={row.latitude}
                        onChangeText={(value) => updateRow(row.id, { latitude: toDigits(value) })}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        editable={!readOnly}
                      />
                    </View>
                    <View style={styles.rowInputItem}>
                      <AppInput
                        label="Longitude"
                        value={row.longitude}
                        onChangeText={(value) => updateRow(row.id, { longitude: toDigits(value) })}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        editable={!readOnly}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryRow}
                    activeOpacity={0.85}
                    onPress={() => togglePrimary(row.id)}
                    disabled={readOnly}
                  >
                    <View style={[styles.primaryBox, row.isPrimary ? styles.primaryBoxActive : null]}>
                      {row.isPrimary ? (
                        <HugeiconsIcon icon={Tick04Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
                      ) : null}
                    </View>
                    <AppText style={styles.primaryText}>Set as primary address</AppText>
                  </TouchableOpacity>

                  <View style={styles.actionRow}>
                    <AppButton
                      label={isSaving ? 'Saving...' : row.isExisting ? (row.isEditing ? 'Save' : 'Edit') : 'Save'}
                      onPress={() => {
                        if (row.isExisting && !row.isEditing) {
                          updateRow(row.id, { isEditing: true });
                          return;
                        }
                        persistRow(row);
                      }}
                      disabled={isSaving}
                      style={styles.actionBtn}
                    />
                  </View>

                  {row.error ? <AppText style={styles.errorText}>{row.error}</AppText> : null}
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.addMoreBtn} activeOpacity={0.85} onPress={handleAddAnother}>
            <AppText style={styles.addMoreText}>Add another address</AppText>
          </TouchableOpacity>

          <AppButton
            label={isOnboarding ? 'Continue' : 'Save'}
            onPress={handleFinish}
            style={styles.finishBtn}
            disabled={Boolean(savingId)}
          />
        </ScrollView>
      </View>
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
  list: {
    rowGap: 12,
  },
  card: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginBottom: 10,
  },
  typeChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  typeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  typeTextActive: {
    color: '#1A1A1A',
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  rowInputs: {
    flexDirection: 'row',
    columnGap: 12,
  },
  rowInputItem: {
    flex: 1,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    marginTop: 6,
  },
  primaryBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBoxActive: {
    borderColor: darkTheme.colors.accent,
  },
  primaryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  actionRow: {
    marginTop: 10,
  },
  actionBtn: {
    minHeight: 42,
  },
  addMoreBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  addMoreText: {
    color: darkTheme.colors.accent,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  finishBtn: {
    marginTop: 14,
  },
  errorText: {
    marginTop: 6,
    color: '#FF7B8A',
    fontSize: 12,
  },
});

export default SparePartsAddressScreen;
