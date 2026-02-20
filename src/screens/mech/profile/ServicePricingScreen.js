import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, LiftableTextInput, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import {
  addMechanicService,
  deleteMechanicService,
  getMyMechanicServices,
  updateMechanicService,
} from '../../../services/mechanic.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const SERVICE_OPTIONS = [
  { label: 'Flat tyres', value: 'flat_tyres' },
  { label: 'Tyre burst', value: 'tyre_burst' },
  { label: 'Wheel alignment issue', value: 'wheel_alignment_issue' },
  { label: 'Battery problem', value: 'battery_problem' },
  { label: 'Dead battery', value: 'dead_battery' },
  { label: 'Alternator failure', value: 'alternator_failure' },
  { label: 'Starter motor fault', value: 'starter_motor_fault' },
  { label: 'Engine overheating', value: 'engine_overheating' },
  { label: 'Engine knocking', value: 'engine_knocking' },
  { label: 'Engine misfire', value: 'engine_misfire' },
  { label: 'Engine stalling', value: 'engine_stalling' },
  { label: 'Brake failure', value: 'brake_failure' },
  { label: 'Brake pad worn', value: 'brake_pad_worn' },
  { label: 'Brake fluid leak', value: 'brake_fluid_leak' },
  { label: 'ABS fault', value: 'abs_fault' },
  { label: 'Gear not shifting', value: 'gear_not_shifting' },
  { label: 'Clutch problem', value: 'clutch_problem' },
  { label: 'Transmission leak', value: 'transmission_leak' },
  { label: 'Electrical fault', value: 'electrical_fault' },
  { label: 'Headlight issue', value: 'headlight_issue' },
  { label: 'Dashboard warning light', value: 'dashboard_warning_light' },
  { label: 'Wiring problem', value: 'wiring_problem' },
  { label: 'Fuse problem', value: 'fuse_problem' },
  { label: 'Oil leak', value: 'oil_leak' },
  { label: 'Coolant leak', value: 'coolant_leak' },
  { label: 'Fuel leak', value: 'fuel_leak' },
  { label: 'Power steering leak', value: 'power_steering_leak' },
  { label: 'Steering problem', value: 'steering_problem' },
  { label: 'Suspension noise', value: 'suspension_noise' },
  { label: 'Shock absorber issue', value: 'shock_absorber_issue' },
  { label: 'Fuel pump failure', value: 'fuel_pump_failure' },
  { label: 'Injector problem', value: 'injector_problem' },
  { label: 'Car not accelerating', value: 'car_not_accelerating' },
  { label: 'AC not cooling', value: 'ac_not_cooling' },
  { label: 'Key locked inside', value: 'key_locked_inside' },
  { label: 'Ignition problem', value: 'ignition_problem' },
  { label: 'Car accident damage', value: 'car_accident_damage' },
  { label: 'Towing needed', value: 'towing_needed' },
  { label: 'General inspection', value: 'general_inspection' },
  { label: 'Other', value: 'other' },
];

const makeRow = (overrides = {}) => ({
  id: `${Date.now()}-${Math.random()}`,
  serviceId: '',
  issue_type: '',
  min_price: '',
  max_price: '',
  isExisting: false,
  isEditing: true,
  ...overrides,
});

const readServices = (payload) => {
  const root = payload?.data || payload || {};

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root.services)) {
    return root.services;
  }

  if (Array.isArray(root.items)) {
    return root.items;
  }

  if (Array.isArray(root.results)) {
    return root.results;
  }

  return [];
};

const mapServiceToRow = (service, index) => {
  const serviceId = String(service?.id || service?._id || service?.service_id || '').trim();
  return makeRow({
    id: serviceId || `existing-${index}`,
    serviceId,
    issue_type: String(service?.issue_type || '').trim(),
    min_price: String(service?.min_price ?? ''),
    max_price: String(service?.max_price ?? ''),
    isExisting: true,
    isEditing: false,
  });
};

const toDigits = (value) => String(value || '').replace(/\D/g, '');

const RowSelector = ({ value, options, onSelect, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((item) => item.value === value)?.label || 'Select service';

  return (
    <View style={styles.selectorWrap}>
      <TouchableOpacity
        style={[styles.selectorBtn, disabled ? styles.selectorBtnDisabled : null]}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={() => setOpen((prev) => !prev)}
      >
        <AppText style={[styles.selectorText, !value ? styles.selectorPlaceholder : null]}>{currentLabel}</AppText>
      </TouchableOpacity>
      {open ? (
        <View style={styles.selectorList}>
          {options.length ? (
            options.map((item) => (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.85}
                style={styles.selectorItem}
                onPress={() => {
                  onSelect(item.value);
                  setOpen(false);
                }}
              >
                <AppText style={styles.selectorItemText}>{item.label}</AppText>
              </TouchableOpacity>
            ))
          ) : (
            <AppText style={styles.noOptionsText}>No more options</AppText>
          )}
        </View>
      ) : null}
    </View>
  );
};

const SkeletonRow = () => {
  return (
    <View style={styles.rowCard}>
      <View style={styles.skeletonSelector} />
      <View style={styles.priceRow}>
        <View style={styles.priceCell}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonInput} />
        </View>
        <View style={styles.priceCell}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonInput} />
        </View>
      </View>
      <View style={styles.rowActions}>
        <View style={styles.skeletonAction} />
        <View style={styles.skeletonAction} />
      </View>
    </View>
  );
};

const ServicePricingScreen = ({ navigation, route }) => {
  const { setHasServicePricing, setServicePricing, completedSteps } = useMechanicProfile();
  const scrollRef = useRef(null);
  const rowPositionsRef = useRef({});

  const isOnboarding = Boolean(route?.params?.onboarding);
  const [rows, setRows] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowLoadingMap, setRowLoadingMap] = useState({});
  const [globalErrorText, setGlobalErrorText] = useState('');
  const [rowErrors, setRowErrors] = useState({});
  React.useEffect(() => {
    if (!isOnboarding) {
      return;
    }

    if (!completedSteps.bank) {
      Alert.alert('Complete previous step', 'Please add your bank details first.');
      navigation.replace(ROUTES.MECH_PROFILE_SETUP);
    }
  }, [completedSteps.bank, isOnboarding, navigation]);

  React.useEffect(() => {
    let active = true;

    const fetchServices = async () => {
      setLoadingServices(true);
      setGlobalErrorText('');
      setRowErrors({});

      try {
        const response = await getMyMechanicServices();
        const nextRows = readServices(response).map(mapServiceToRow);

        if (!active) {
          return;
        }

        setRows(nextRows.length ? nextRows : [makeRow()]);
      } catch (fetchError) {
        if (!active) {
          return;
        }
        const fallbackRow = makeRow();
        setRows([fallbackRow]);
        setRowErrors({
          [fallbackRow.id]: fetchError?.message || 'Could not load current services.',
        });
      } finally {
        if (active) {
          setLoadingServices(false);
        }
      }
    };

    fetchServices();

    return () => {
      active = false;
    };
  }, []);

  const selectedServices = useMemo(() => rows.map((row) => row.issue_type).filter(Boolean), [rows]);

  const availableOptionsForRow = (rowId) => {
    const row = rows.find((item) => item.id === rowId);
    const ownValue = row?.issue_type;

    return SERVICE_OPTIONS.filter((option) => {
      if (option.value === ownValue) {
        return true;
      }
      return !selectedServices.includes(option.value);
    });
  };

  const updateRow = (rowId, patch) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
    setGlobalErrorText('');
    setRowErrors((prev) => {
      if (!prev[rowId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const addRow = () => {
    if (rows.length >= SERVICE_OPTIONS.length) {
      return;
    }
    setRows((prev) => [...prev, makeRow()]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== rowId);
      return next.length ? next : [makeRow()];
    });
    setGlobalErrorText('');
    setRowErrors((prev) => {
      if (!prev[rowId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const validateRow = (row) => {
    if (!row.issue_type || !row.min_price || !row.max_price) {
      return 'Service, min price and max price are required.';
    }

    const minPrice = Number(row.min_price);
    const maxPrice = Number(row.max_price);

    if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
      return 'Prices must be numbers.';
    }

    if (minPrice > maxPrice) {
      return 'Min price cannot be greater than max price.';
    }

    return '';
  };

  const upsertRow = async (row) => {
    const validationError = validateRow(row);
    if (validationError) {
      setRowErrors((prev) => ({ ...prev, [row.id]: validationError }));
      return false;
    }

    setRowLoadingMap((prev) => ({ ...prev, [row.id]: true }));
    setGlobalErrorText('');
    setRowErrors((prev) => {
      if (!prev[row.id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[row.id];
      return next;
    });

    try {
      if (row.isExisting && row.serviceId) {
        await updateMechanicService(row.serviceId, {
          min_price: Number(row.min_price),
          max_price: Number(row.max_price),
        });
        setRows((prev) =>
          prev.map((item) => (item.id === row.id ? { ...item, isEditing: false } : item))
        );
        return true;
      }

      const response = await addMechanicService({
        issue_type: row.issue_type,
        min_price: Number(row.min_price),
        max_price: Number(row.max_price),
      });

      const createdService =
        response?.data?.service ||
        response?.service ||
        response?.data?.data?.service ||
        response?.data?.data ||
        response?.data ||
        null;
      const createdServiceId = String(
        createdService?.id || createdService?._id || createdService?.service_id || ''
      ).trim();

      if (createdServiceId) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? {
                  ...item,
                  serviceId: createdServiceId,
                  isExisting: true,
                  isEditing: false,
                }
              : item
          )
        );
        return true;
      }

      const refreshResponse = await getMyMechanicServices();
      const persistedRows = readServices(refreshResponse).map(mapServiceToRow);
      setRows((prev) => {
        const remainingUnsavedRows = prev.filter((item) => !item.isExisting && item.id !== row.id);
        const nextRows = [...persistedRows, ...remainingUnsavedRows];
        return nextRows.length ? nextRows : [makeRow()];
      });
      return true;
    } catch (serviceError) {
      setRowErrors((prev) => ({
        ...prev,
        [row.id]: serviceError?.message || 'Could not save service.',
      }));
      return false;
    } finally {
      setRowLoadingMap((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
    }
  };

  const handleDeleteRow = async (row) => {
    if (row.isExisting && row.serviceId) {
      setRowLoadingMap((prev) => ({ ...prev, [row.id]: true }));
      setGlobalErrorText('');
      setRowErrors((prev) => {
        if (!prev[row.id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      try {
        await deleteMechanicService(row.serviceId);
        setRows((prev) => {
          const next = prev.filter((item) => item.id !== row.id);
          return next.length ? next : [makeRow()];
        });
      } catch (deleteError) {
        setRowErrors((prev) => ({
          ...prev,
          [row.id]: deleteError?.message || 'Could not remove service.',
        }));
      } finally {
        setRowLoadingMap((prev) => {
          const next = { ...prev };
          delete next[row.id];
          return next;
        });
      }
      return;
    }

    removeRow(row.id);
  };

  const handleAddMore = async (row) => {
    if (!row || saving) {
      return;
    }

    const hasAnyInput = Boolean(row.issue_type || row.min_price || row.max_price);
    if (row.isExisting || !hasAnyInput) {
      addRow();
      return;
    }

    const ok = await upsertRow(row);
    if (!ok) {
      return;
    }

    addRow();
  };

  const handleDone = async () => {
    setSaving(true);
    setGlobalErrorText('');
    setRowErrors({});

    try {
      const pendingRows = rows.filter(
        (row) => !row.isExisting && (row.issue_type || row.min_price || row.max_price)
      );
      const failedRowIds = [];

      for (let index = 0; index < pendingRows.length; index += 1) {
        const ok = await upsertRow(pendingRows[index]);
        if (!ok) {
          failedRowIds.push(pendingRows[index].id);
        }
      }

      if (failedRowIds.length) {
        setGlobalErrorText('Some services could not be saved. Review the highlighted rows.');
        setSaving(false);
        return;
      }

      const persistedResponse = await getMyMechanicServices();
      const persistedRows = readServices(persistedResponse).map(mapServiceToRow);
      const pricingMap = persistedRows.reduce((acc, row) => {
        acc[row.issue_type] = { min_price: row.min_price, max_price: row.max_price };
        return acc;
      }, {});

      if (!Object.keys(pricingMap).length) {
        const firstRowId = rows?.[0]?.id || '';
        setRowErrors((prev) => ({
          ...prev,
          [firstRowId]: 'Add at least one service estimate before continuing.',
        }));
        setSaving(false);
        return;
      }

      setServicePricing(pricingMap);
      setHasServicePricing(true);

      if (isOnboarding) {
        navigation.replace(ROUTES.MECH_PROFILE_SETUP);
        return;
      }

      navigation.goBack();
    } catch (submitError) {
      setGlobalErrorText(submitError?.message || 'Could not save service pricing.');
    } finally {
      setSaving(false);
    }
  };

  const handleTemporarySkip = () => {
    setHasServicePricing(true);
    setServicePricing({});

    if (isOnboarding) {
      navigation.replace(ROUTES.MECH_PROFILE_SETUP);
      return;
    }

    navigation.goBack();
  };

  const handleRowLayout = (rowId, event) => {
    rowPositionsRef.current[rowId] = event?.nativeEvent?.layout?.y || 0;
  };

  const centerRow = (rowId) => {
    const rowY = rowPositionsRef.current[rowId];
    if (typeof rowY !== 'number') {
      return;
    }
    const targetY = Math.max(0, rowY - 180);
    scrollRef.current?.scrollTo?.({ y: targetY, animated: true });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen} keyboardAware={false}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>{isOnboarding ? 'Verification screen' : 'Service pricing'}</AppText>
        </View>

        <AppText style={styles.note}>Please select your service offered</AppText>
        {isOnboarding ? (
          <>
            <AppText style={styles.stepLabel}>Step 5 of 5</AppText>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </>
        ) : null}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loadingServices ? (
            <View style={styles.skeletonWrap}>
              {[1, 2, 3].map((key) => (
                <SkeletonRow key={`skeleton-${key}`} />
              ))}
            </View>
          ) : null}
          {globalErrorText ? <AppText style={styles.errorText}>{globalErrorText}</AppText> : null}
          {rows.map((row, index) => {
            const rowOptions = availableOptionsForRow(row.id);
            const busy = Boolean(rowLoadingMap[row.id]) || saving;

            return (
              <View key={row.id} style={styles.rowCard} onLayout={(event) => handleRowLayout(row.id, event)}>
                <RowSelector
                  value={row.issue_type}
                  options={rowOptions}
                  disabled={row.isExisting}
                  onSelect={(value) => updateRow(row.id, { issue_type: value })}
                />

                <View style={styles.priceRow}>
                  <View style={styles.priceCell}>
                    <AppText style={styles.priceLabel}>Min price</AppText>
                    <LiftableTextInput
                      value={row.min_price}
                      onChangeText={(value) => updateRow(row.id, { min_price: toDigits(value) })}
                      onFocus={() => centerRow(row.id)}
                      placeholder="0"
                      placeholderTextColor={darkTheme.colors.muted}
                      keyboardType="number-pad"
                      style={styles.priceInput}
                      editable={!row.isExisting || row.isEditing}
                    />
                  </View>

                  <View style={styles.priceCell}>
                    <AppText style={styles.priceLabel}>Max price</AppText>
                    <LiftableTextInput
                      value={row.max_price}
                      onChangeText={(value) => updateRow(row.id, { max_price: toDigits(value) })}
                      onFocus={() => centerRow(row.id)}
                      placeholder="0"
                      placeholderTextColor={darkTheme.colors.muted}
                      keyboardType="number-pad"
                      style={styles.priceInput}
                      editable={!row.isExisting || row.isEditing}
                    />
                  </View>
                </View>

                <View style={styles.rowActions}>
                  {row.isExisting ? (
                    row.isEditing ? (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.rowAction}
                        disabled={busy}
                        onPress={() => upsertRow(row)}
                      >
                        <AppText style={styles.rowActionText}>{busy ? 'Saving...' : 'Save'}</AppText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.rowAction}
                        disabled={busy}
                        onPress={() => updateRow(row.id, { isEditing: true })}
                      >
                        <AppText style={styles.rowActionText}>Edit</AppText>
                      </TouchableOpacity>
                    )
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.rowAction}
                      disabled={busy}
                      onPress={() => upsertRow(row)}
                    >
                      <AppText style={styles.rowActionText}>{busy ? 'Saving...' : 'Save'}</AppText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.rowActionDanger}
                    disabled={busy}
                    onPress={() => handleDeleteRow(row)}
                  >
                    <AppText style={styles.rowActionDangerText}>{busy ? 'Removing...' : 'Remove'}</AppText>
                  </TouchableOpacity>

                  {index === rows.length - 1 ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.rowAction}
                      disabled={busy}
                      onPress={() => handleAddMore(row)}
                    >
                      <AppText style={styles.rowActionText}>Add more</AppText>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {rowErrors[row.id] ? (
                  <AppText style={styles.errorText}>{rowErrors[row.id]}</AppText>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        <AppButton
          label={saving ? 'Processing...' : (isOnboarding ? 'Continue' : 'Done')}
          onPress={handleDone}
          disabled={saving}
          left={saving ? <ActivityIndicator size="small" color="#1A1A1A" /> : null}
        />
        {isOnboarding ? (
          <TouchableOpacity activeOpacity={0.85} onPress={handleTemporarySkip} style={styles.skipTempBtn}>
            <AppText style={styles.skipTempText}>Skip for now</AppText>
          </TouchableOpacity>
        ) : null}
      </KeyboardAvoidingView>
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
  note: {
    marginTop: 16,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  stepLabel: {
    marginTop: 8,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  progressTrack: {
    marginTop: 6,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
    width: '100%',
  },
  list: {
    marginTop: 16,
    paddingBottom: 12,
  },
  rowCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    marginBottom: 12,
  },
  selectorWrap: {
    position: 'relative',
    zIndex: 2,
  },
  selectorBtn: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  selectorBtnDisabled: {
    opacity: 0.7,
  },
  selectorText: {
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  selectorPlaceholder: {
    color: darkTheme.colors.muted,
  },
  selectorList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 10,
    backgroundColor: '#0B0B56',
    overflow: 'hidden',
  },
  selectorItem: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  selectorItemText: {
    color: darkTheme.colors.text,
    fontSize: 13,
  },
  noOptionsText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  priceCell: {
    flex: 1,
  },
  priceLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  priceInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    color: darkTheme.colors.text,
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  rowAction: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
  },
  rowActionText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  rowActions: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowActionDanger: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF7F7F',
  },
  rowActionDangerText: {
    color: '#FF7F7F',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  loadingWrap: {
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonWrap: {
    marginBottom: 8,
  },
  skeletonSelector: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skeletonLabel: {
    width: 70,
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 6,
  },
  skeletonInput: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skeletonAction: {
    width: 86,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  errorText: {
    color: '#FF7F7F',
    fontSize: 12,
    marginTop: 2,
  },
  skipTempBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipTempText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default ServicePricingScreen;
