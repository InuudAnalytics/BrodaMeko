import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Delete02Icon, Edit02Icon, Location01Icon, Tick04Icon } from '@hugeicons/core-free-icons';
import { openSettings } from 'react-native-permissions';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { useUserLocation } from '../../../hooks/useUserLocation';
import {
  addMechanicAddress,
  deleteMechanicAddress,
  getMechanicAddresses,
  setPrimaryMechanicAddress,
  updateMechanicAddress,
} from '../../../services/mechanic.service';
import { darkTheme } from '../../../theme';
import { getOnboardingStepIndex, MECH_ONBOARDING_STEPS, ROUTES } from '../../../utils';
import { fetchPlaceDetails, fetchPlaceSuggestions, parseAddressComponents, reverseGeocode } from '../../../utils/places';

const buildEmptyAddress = () => ({
  id: `new-${Date.now()}-${Math.random()}`,
  addressType: 'home',
  label: '',
  street: '',
  city: '',
  state: '',
  country: '',
  latitude: '',
  longitude: '',
  searchQuery: '',
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

const MechanicAddressScreen = ({ navigation, route }) => {
  const { setAddresses, completedSteps } = useMechanicProfile();
  const isOnboarding = Boolean(route?.params?.onboarding);
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_ADDRESS);
  const totalSteps = MECH_ONBOARDING_STEPS.length;
  const progressPercent = useMemo(() => (stepIndex / totalSteps) * 100, [stepIndex, totalSteps]);

  const [rows, setRows] = useState([buildEmptyAddress()]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [actionId, setActionId] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [showForm, setShowForm] = useState(isOnboarding);
  const [activeFormId, setActiveFormId] = useState('');
  const [activeSearchId, setActiveSearchId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [locationRowId, setLocationRowId] = useState('');
  const autocompleteTimer = useRef(null);
  const { permissionStatus, requestPermission, refreshOnce, error: locationError } = useUserLocation();

  useEffect(() => {
    if (!isOnboarding) {
      return;
    }

    if (!completedSteps.certificate) {
      Alert.alert('Complete previous step', 'Please upload your certificate first.');
      navigation.replace(ROUTES.MECH_PROFILE_SETUP);
    }
  }, [completedSteps.certificate, isOnboarding, navigation]);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setGlobalError('');

    try {
      const response = await getMechanicAddresses();
      const list = normalizeAddresses(response?.data || response);
      const mapped = list.map((item, index) => ({
        id: String(item?.id || item?._id || `${index}`),
        addressType: String(item?.address_type || item?.addressType || 'home'),
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

      if (mapped.length) {
        setRows(mapped);
      } else {
        setRows(isOnboarding ? [buildEmptyAddress()] : []);
      }
      setShowForm(isOnboarding);
      if (isOnboarding && mapped.length) {
        setActiveFormId(mapped[0].id);
      }
      setAddresses(mapped);
    } catch (error) {
      setGlobalError(error?.message || 'Unable to fetch addresses.');
      setRows(isOnboarding ? [buildEmptyAddress()] : []);
      setShowForm(isOnboarding);
      if (isOnboarding) {
        setActiveFormId((prev) => prev || buildEmptyAddress().id);
      }
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

  const handleSearchChange = (rowId, value) => {
    updateRow(rowId, { searchQuery: value });
    setActiveSearchId(rowId);

    if (autocompleteTimer.current) {
      clearTimeout(autocompleteTimer.current);
    }

    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setFetchingSuggestions(false);
      return;
    }

    autocompleteTimer.current = setTimeout(async () => {
      setFetchingSuggestions(true);
      try {
        const items = await fetchPlaceSuggestions(value.trim());
        setSuggestions(items);
      } catch (error) {
        setSuggestions([]);
        setGlobalError(error?.message || 'Unable to search addresses.');
      } finally {
        setFetchingSuggestions(false);
      }
    }, 400);
  };

  const applySuggestion = async (row, suggestion) => {
    if (!row?.id || !suggestion?.placeId) {
      return;
    }

    setFetchingSuggestions(true);
    setActiveSearchId(row.id);
    try {
      const details = await fetchPlaceDetails(suggestion.placeId);
      const parsed = parseAddressComponents(details.components);
      updateRow(row.id, {
        searchQuery: details.formattedAddress || suggestion.description || row.searchQuery,
        street: parsed.street || row.street,
        city: parsed.city || row.city,
        state: parsed.state || row.state,
        country: parsed.country || row.country,
        latitude: details.latitude !== null ? String(details.latitude) : row.latitude,
        longitude: details.longitude !== null ? String(details.longitude) : row.longitude,
      });
      setSuggestions([]);
    } catch (error) {
      setGlobalError(error?.message || 'Unable to fetch address details.');
    } finally {
      setFetchingSuggestions(false);
    }
  };

  const handleUseCurrentLocation = async (row) => {
    if (!row?.id) {
      return;
    }

    setLocationRowId(row.id);
    setGlobalError('');

    try {
      const status = permissionStatus === 'granted' ? permissionStatus : await requestPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Enable location permission to auto-fill your address.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: openSettings },
          ]
        );
        return;
      }

      const location = await refreshOnce();
      if (!location) {
        setGlobalError(locationError || 'Unable to read your location.');
        return;
      }

      const result = await reverseGeocode(location);
      const parsed = parseAddressComponents(result.components);

      updateRow(row.id, {
        searchQuery: result.formattedAddress || row.searchQuery,
        street: parsed.street || row.street,
        city: parsed.city || row.city,
        state: parsed.state || row.state,
        country: parsed.country || row.country,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      });
    } catch (error) {
      setGlobalError(error?.message || 'Unable to use current location.');
    } finally {
      setLocationRowId('');
    }
  };

  const togglePrimary = (rowId) => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        isPrimary: row.id === rowId,
      }))
    );
  };

  const handleSetPrimary = async (row) => {
    if (!row?.id || actionId) {
      return;
    }

    setActionId(row.id);
    setGlobalError('');
    try {
      await setPrimaryMechanicAddress(row.id);
      togglePrimary(row.id);
    } catch (error) {
      setGlobalError(error?.message || 'Unable to set primary address.');
    } finally {
      setActionId('');
    }
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
        await updateMechanicAddress(row.id, payload);
        updateRow(row.id, { isEditing: false });
        if (!isOnboarding) {
          setShowForm(false);
        }
        setActiveFormId('');
        return true;
      }

      const response = await addMechanicAddress(payload);
      const payloadData = response?.data || response || {};
      const created = payloadData?.address || payloadData?.data || payloadData;
      const createdId = String(created?.id || created?._id || '').trim();
      if (createdId) {
        updateRow(row.id, { id: createdId, isExisting: true, isEditing: false });
      } else {
        await fetchAddresses();
      }
      if (!isOnboarding) {
        setShowForm(false);
      }
      setActiveFormId('');
      return true;
    } catch (error) {
      updateRow(row.id, { error: error?.message || 'Unable to save address.' });
      return false;
    } finally {
      setSavingId('');
    }
  };

  const handleAddAnother = () => {
    const next = buildEmptyAddress();
    setRows((prev) => [...prev, next]);
    setShowForm(true);
    setActiveFormId(next.id);
  };

  const handleAddFirst = () => {
    if (rows.length === 0) {
      const next = buildEmptyAddress();
      setRows([next]);
      setActiveFormId(next.id);
    }
    setShowForm(true);
  };

  const handleDeleteRow = (row) => {
    if (!row?.isExisting) {
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      if (activeFormId === row.id) {
        setActiveFormId('');
      }
      return;
    }

    Alert.alert('Delete address?', 'This address will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionId(row.id);
          setGlobalError('');
          try {
            await deleteMechanicAddress(row.id);
            setRows((prev) => prev.filter((item) => item.id !== row.id));
            if (activeFormId === row.id) {
              setActiveFormId('');
            }
          } catch (error) {
            setGlobalError(error?.message || 'Unable to delete address.');
          } finally {
            setActionId('');
          }
        },
      },
    ]);
  };

  const handleFinish = async () => {
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
      navigation.replace(ROUTES.MECH_BANK_DETAILS, { onboarding: true });
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
              <AppText style={styles.helper}>Please add your service address</AppText>
              <AppText style={styles.stepLabel}>Step {stepIndex} of {totalSteps}</AppText>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>
            </>
          ) : null}

          {loading ? (
            <View style={styles.loadingRow}>
              {[0, 1, 2].map((item) => (
                <View key={`skeleton-${item}`} style={styles.skeletonCard}>
                  <View style={styles.skeletonLineWide} />
                  <View style={styles.skeletonLine} />
                  <View style={styles.skeletonLineShort} />
                </View>
              ))}
            </View>
          ) : null}

          {globalError ? <AppText style={styles.errorText}>{globalError}</AppText> : null}

          {!isOnboarding && !rows.length && !loading && !showForm ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <HugeiconsIcon icon={Location01Icon} size={28} color={darkTheme.colors.accent} strokeWidth={2} />
              </View>
              <AppText style={styles.emptyTitle}>No addresses added yet</AppText>
              <AppText variant="muted" style={styles.emptySubtitle}>
                Add your workshop or home address to appear in searches.
              </AppText>
              <AppButton label="Add address" onPress={handleAddFirst} style={styles.emptyButton} />
            </View>
          ) : null}

          {rows.length ? (
            <View style={styles.list}>
              {rows.map((row, index) => {
                const readOnly = row.isExisting && !row.isEditing;
                const isSaving = savingId === row.id;
                const showFormCard =
                  isOnboarding || row.id === activeFormId || row.isEditing || (!row.isExisting && showForm);
                const isPrimary = Boolean(row.isPrimary);

                if (!showFormCard && row.isExisting) {
                  return (
                    <View key={`${row.id}-${index}`} style={styles.summaryCard}>
                      <View style={styles.summaryHeader}>
                        <View style={styles.summaryBody}>
                          <AppText style={styles.summaryTitle}>
                            {row.label || 'Address'}
                          </AppText>
                          <AppText variant="muted" style={styles.summarySubtitle} numberOfLines={2}>
                            {row.street}, {row.city}, {row.state}, {row.country}
                          </AppText>
                        </View>
                        <View style={styles.summaryActions}>
                          <TouchableOpacity
                            onPress={() => {
                              updateRow(row.id, { isEditing: true });
                              setActiveFormId(row.id);
                              setShowForm(true);
                            }}
                            activeOpacity={0.85}
                            style={styles.editBtn}
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteRow(row)}
                            activeOpacity={0.85}
                            disabled={actionId === row.id}
                            style={styles.deleteBtn}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={18} color="#F87171" strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {row.addressType !== 'home' ? (
                        <View style={styles.summaryFooter}>
                          <TouchableOpacity
                            style={styles.primaryRow}
                            activeOpacity={0.85}
                            onPress={() => handleSetPrimary(row)}
                            disabled={isPrimary || actionId === row.id}
                          >
                            <View style={[styles.primaryBox, isPrimary ? styles.primaryBoxActive : null]}>
                              {isPrimary ? (
                                <HugeiconsIcon icon={Tick04Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
                              ) : null}
                            </View>
                            <AppText style={styles.primaryText}>
                              {isPrimary ? 'Primary address' : 'Set as primary'}
                            </AppText>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                }

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
                      label="Search address"
                      value={row.searchQuery}
                      onChangeText={(value) => handleSearchChange(row.id, value)}
                      placeholder="Search for a place"
                      editable={!readOnly}
                    />
                    {activeSearchId === row.id && suggestions.length ? (
                      <View style={styles.suggestionList}>
                        {suggestions.map((item) => (
                          <TouchableOpacity
                            key={item.placeId}
                            style={styles.suggestionItem}
                            activeOpacity={0.85}
                            onPress={() => applySuggestion(row, item)}
                          >
                            <AppText style={styles.suggestionText}>{item.description}</AppText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                    {activeSearchId === row.id && fetchingSuggestions ? (
                      <View style={styles.suggestionLoading}>
                        <ActivityIndicator size="small" color={darkTheme.colors.accent} />
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={styles.locationBtn}
                      activeOpacity={0.85}
                      onPress={() => handleUseCurrentLocation(row)}
                      disabled={readOnly || locationRowId === row.id}
                    >
                      <AppText style={styles.locationBtnText}>
                        {locationRowId === row.id ? 'Locating...' : 'Use current location'}
                      </AppText>
                    </TouchableOpacity>
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

                    {row.addressType !== 'home' ? (
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
                    ) : null}

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
                      {!isOnboarding ? (
                        <TouchableOpacity
                          style={styles.inlineDelete}
                          activeOpacity={0.85}
                          onPress={() => handleDeleteRow(row)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={18} color="#F87171" strokeWidth={2} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {row.error ? <AppText style={styles.errorText}>{row.error}</AppText> : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {!isOnboarding && rows.length ? (
            <TouchableOpacity style={styles.addMoreBtn} activeOpacity={0.85} onPress={handleAddAnother}>
              <AppText style={styles.addMoreText}>Add address</AppText>
            </TouchableOpacity>
          ) : null}

          {isOnboarding ? (
            <AppButton
              label="Continue"
              onPress={handleFinish}
              style={styles.finishBtn}
              disabled={Boolean(savingId)}
            />
          ) : null}
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
    rowGap: 12,
  },
  skeletonCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  skeletonLineWide: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    width: '70%',
    marginBottom: 8,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '90%',
    marginBottom: 6,
  },
  skeletonLineShort: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '45%',
  },
  list: {
    rowGap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyButton: {
    marginTop: 14,
    minWidth: 160,
  },
  card: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  summaryBody: {
    flex: 1,
  },
  summaryActions: {
    flexDirection: 'row',
    columnGap: 8,
  },
  summaryTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  summarySubtitle: {
    fontSize: 12,
    marginTop: 4,
    maxWidth: 240,
  },
  summaryFooter: {
    marginTop: 12,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230,199,20,0.12)',
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
  suggestionList: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  suggestionText: {
    color: darkTheme.colors.text,
    fontSize: 12,
  },
  suggestionLoading: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  locationBtn: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  locationBtnText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  actionBtn: {
    minHeight: 42,
    flex: 1,
  },
  inlineDelete: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
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

export default MechanicAddressScreen;
