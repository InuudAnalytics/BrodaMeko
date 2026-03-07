import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowDown01Icon, ArrowLeft01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import MechanicServicesContext from '../../../context/MechanicServicesContext';
import {
  ISSUE_TYPES,
  addMechanicService,
  deleteMechanicService,
  getMyMechanicServices,
  updateMechanicService,
} from '../../../services/mechanic.services.service';
import { darkTheme, withAlpha } from '../../../theme';
import { ROUTES } from '../../../utils';

const formatIssueType = (value) =>
  String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getServiceId = (service) =>
  String(
    service?.id ||
      service?._id ||
      service?.service_id ||
      service?.serviceId ||
      service?.uuid ||
      service?.service_uuid ||
      '',
  ).trim();

const extractServices = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.services)) {
    return payload.services;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (payload?.data && typeof payload.data === 'object') {
    return extractServices(payload.data);
  }

  return [];
};

const sanitizeDigits = (value) => String(value || '').replace(/\D/g, '');

const parsePrice = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return `${fieldName} must be a valid number.`;
  }

  if (parsed < 0) {
    return `${fieldName} cannot be negative.`;
  }

  return null;
};

const ServiceSelector = ({
  value,
  onChange,
  options,
  open,
  onToggle,
  search,
  onSearch,
  disabled,
}) => {
  const displayValue = value ? formatIssueType(value) : '';

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownTrigger, disabled ? styles.dropdownDisabled : null]}
        activeOpacity={0.85}
        onPress={disabled ? undefined : onToggle}
      >
        <AppText style={[styles.dropdownTriggerText, !displayValue ? styles.dropdownPlaceholder : null]}>
          {displayValue || 'No options selected yet'}
        </AppText>
        <HugeiconsIcon icon={ArrowDown01Icon} size={18} color={darkTheme.colors.muted} strokeWidth={2} />
      </TouchableOpacity>
      {open ? (
        <View style={styles.dropdownPanel}>
          <AppInput
            value={search}
            onChangeText={onSearch}
            placeholder="Search service"
            autoCapitalize="words"
            containerStyle={styles.dropdownSearch}
          />
          <ScrollView style={styles.dropdownList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                activeOpacity={0.85}
                style={[styles.dropdownItem, option === value ? styles.dropdownItemActive : null]}
                onPress={() => {
                  onChange(option);
                  onToggle();
                }}
              >
                <AppText style={[styles.dropdownItemText, option === value ? styles.dropdownItemTextActive : null]}>
                  {formatIssueType(option)}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const SetServicesScreen = ({ navigation }) => {
  const mechanicServicesContext = useContext(MechanicServicesContext);
  const hasContext = Boolean(mechanicServicesContext);
  const contextFetchServices = mechanicServicesContext?.fetchServices;
  const contextAddService = mechanicServicesContext?.addService;
  const contextUpdateService = mechanicServicesContext?.updateService;
  const contextDeleteService = mechanicServicesContext?.deleteService;

  const [localServices, setLocalServices] = useState([]);
  const [loadingAction, setLoadingAction] = useState('');
  const [formError, setFormError] = useState('');
  const [rows, setRows] = useState([]);
  const [openRowId, setOpenRowId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const services = hasContext ? mechanicServicesContext.services : localServices;
  const contextError = hasContext ? mechanicServicesContext.error : '';

  const serviceOptions = useMemo(() => {
    const query = String(searchText || '').trim().toLowerCase();
    const base = ISSUE_TYPES || [];
    // TODO: Replace ISSUE_TYPES with backend-provided service list if available.
    if (!query) {
      return base;
    }
    return base.filter((entry) => formatIssueType(entry).toLowerCase().includes(query));
  }, [searchText]);

  const fetchServices = useCallback(async () => {
    if (hasContext && typeof contextFetchServices === 'function') {
      return contextFetchServices();
    }

    const response = await getMyMechanicServices();
    const payload = response?.data || response || {};
    const nextServices = extractServices(payload);
    setLocalServices(nextServices);
    return response;
  }, [contextFetchServices, hasContext]);

  const addService = useCallback(async (payload) => {
    if (hasContext && typeof contextAddService === 'function') {
      return contextAddService(payload);
    }

    const response = await addMechanicService(payload);
    await fetchServices();
    return response;
  }, [contextAddService, fetchServices, hasContext]);

  const updateService = useCallback(async (serviceId, payload) => {
    if (hasContext && typeof contextUpdateService === 'function') {
      return contextUpdateService(serviceId, payload);
    }

    const response = await updateMechanicService(serviceId, payload);
    await fetchServices();
    return response;
  }, [contextUpdateService, fetchServices, hasContext]);

  const removeService = useCallback(async (serviceId) => {
    if (hasContext && typeof contextDeleteService === 'function') {
      return contextDeleteService(serviceId);
    }

    const response = await deleteMechanicService(serviceId);
    await fetchServices();
    return response;
  }, [contextDeleteService, fetchServices, hasContext]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setLoadingAction('fetch-services');
      if (__DEV__) {
        console.log('[SetServices] bootstrap fetch start');
      }
      try {
        const response = await fetchServices();
        if (__DEV__) {
          const payload = response?.data || response || {};
          console.log('[SetServices] bootstrap fetch success', {
            hasData: Boolean(payload),
            servicesCount:
              Array.isArray(payload) ? payload.length : Array.isArray(payload?.services) ? payload.services.length : undefined,
          });
        }
      } catch (error) {
        if (isMounted) {
          if (__DEV__) {
            console.log('[SetServices] bootstrap fetch error', error?.message || error);
          }
          setFormError(error?.message || 'Failed to fetch services.');
        }
      } finally {
        if (isMounted) {
          if (__DEV__) {
            console.log('[SetServices] bootstrap fetch end');
          }
          setLoadingAction('');
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [fetchServices]);

  useEffect(() => {
    const nextRows = services.map((service) => ({
      id: getServiceId(service) || `${service.issue_type}-${service.min_price}-${service.max_price}`,
      serviceId: getServiceId(service),
      issueType: service.issue_type || '',
      minPrice: String(service.min_price ?? ''),
      maxPrice: String(service.max_price ?? ''),
      isExisting: true,
      isEditing: false,
      error: '',
    }));

    setRows([
      ...nextRows,
      { id: 'new', serviceId: '', issueType: '', minPrice: '', maxPrice: '', isExisting: false, isEditing: true, error: '' },
    ]);
  }, [services]);

  const updateRow = (rowId, patch) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch, error: patch.error ?? '' } : row))
    );
  };

  const validateRow = (row) => {
    if (!row.issueType) {
      return 'Please select a service option.';
    }
    const minErr = parsePrice(row.minPrice, 'Min price');
    if (minErr) {
      return minErr;
    }
    const maxErr = parsePrice(row.maxPrice, 'Max price');
    if (maxErr) {
      return maxErr;
    }
    if (Number(row.minPrice) > Number(row.maxPrice)) {
      return 'Min price cannot be greater than max price.';
    }
    return '';
  };

  const handleAddService = async () => {
    const draft = rows[rows.length - 1];
    if (!draft) {
      return;
    }

    const validationError = validateRow(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    setLoadingAction('add-service');

    try {
      const response = await addService({
        issue_type: draft.issueType,
        min_price: Number(draft.minPrice),
        max_price: Number(draft.maxPrice),
      });

      if (response?.success === false && response?.message) {
        setFormError(response.message);
        return;
      }

      await fetchServices();
    } catch (error) {
      setFormError(error?.message || 'Failed to add service.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleUpdateService = async (row) => {
    if (!row.serviceId) {
      return;
    }

    const validationError = validateRow(row);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError('');
    setLoadingAction(`update-${row.serviceId}`);

    try {
      const response = await updateService(row.serviceId, {
        min_price: Number(row.minPrice),
        max_price: Number(row.maxPrice),
      });

      if (response?.success === false && response?.message) {
        setFormError(response.message);
        return;
      }

      await fetchServices();
    } catch (error) {
      setFormError(error?.message || 'Failed to update service.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleFinish = () => {
    let hasEditingRows = false;
    const draft = rows[rows.length - 1];

    setRows((prev) =>
      prev.map((row) => {
        if (row.isExisting && row.isEditing) {
          hasEditingRows = true;
          return { ...row, error: 'Please save your edits before finishing.' };
        }
        if (row.id === 'new') {
          const hasAnyValue = Boolean(row.issueType || row.minPrice || row.maxPrice);
          if (hasAnyValue) {
            return { ...row, error: 'Please save this service before finishing.' };
          }
        }
        return row;
      })
    );

    if (hasEditingRows) {
      return;
    }

    if (draft) {
      const hasAnyValue = Boolean(draft.issueType || draft.minPrice || draft.maxPrice);
      if (hasAnyValue) {
        return;
      }
    }

    navigation.navigate(ROUTES.USER_PROFILE);
  };

  const handleDeleteService = async (row) => {
    if (!row.serviceId) {
      return;
    }
    setFormError('');
    setLoadingAction(`delete-${row.serviceId}`);
    try {
      await removeService(row.serviceId);
      await fetchServices();
    } catch (error) {
      setFormError(error?.message || 'Failed to delete service.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setFormError('');
    try {
      await fetchServices();
    } catch (error) {
      setFormError(error?.message || 'Failed to refresh services.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchServices]);

  const inlineError = useMemo(() => formError || contextError || '', [formError, contextError]);
  const lastRow = rows[rows.length - 1];
  const canAddMore = Boolean(lastRow && lastRow.issueType && lastRow.minPrice && lastRow.maxPrice);

  return (
    <ScreenContainer padded={false} style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={darkTheme.colors.accent}
            colors={[darkTheme.colors.accent]}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.heading}>Services Offered</AppText>
        </View>
        <AppText variant="muted" style={styles.subheading}>
          Set your services and pricing ranges
        </AppText>

        {loadingAction === 'fetch-services' ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            <AppText style={styles.loadingText}>Loading services...</AppText>
          </View>
        ) : null}

        {inlineError ? <AppText style={styles.errorText}>{inlineError}</AppText> : null}

        <View style={styles.servicesList}>
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            const isBusy = row.serviceId && loadingAction.includes(row.serviceId);
            const readOnly = row.isExisting && !row.isEditing;
            return (
              <View key={row.id} style={styles.serviceBlock}>
                <AppText style={styles.sectionLabel}>Service</AppText>
                <ServiceSelector
                  value={row.issueType}
                  onChange={(value) => updateRow(row.id, { issueType: value })}
                  options={serviceOptions}
                  open={openRowId === row.id}
                  onToggle={() => {
                    if (row.isExisting) {
                      return;
                    }
                    setSearchText('');
                    setOpenRowId((prev) => (prev === row.id ? '' : row.id));
                  }}
                  search={searchText}
                  onSearch={setSearchText}
                  disabled={row.isExisting}
                />

                <View style={styles.priceRow}>
                  <View style={styles.priceInput}>
                    <AppText style={styles.sectionLabel}>Min price</AppText>
                    <AppInput
                      value={row.minPrice}
                      onChangeText={(value) => updateRow(row.id, { minPrice: sanitizeDigits(value) })}
                      keyboardType="numeric"
                      placeholder="0"
                      editable={!readOnly}
                      containerStyle={readOnly ? styles.readOnlyInput : null}
                      inputStyle={readOnly ? styles.readOnlyInputText : null}
                    />
                  </View>
                  <View style={styles.priceInput}>
                    <AppText style={styles.sectionLabel}>Max price</AppText>
                    <AppInput
                      value={row.maxPrice}
                      onChangeText={(value) => updateRow(row.id, { maxPrice: sanitizeDigits(value) })}
                      keyboardType="numeric"
                      placeholder="0"
                      editable={!readOnly}
                      containerStyle={readOnly ? styles.readOnlyInput : null}
                      inputStyle={readOnly ? styles.readOnlyInputText : null}
                    />
                  </View>
                </View>

                {!isLast ? (
                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.removeBtn]}
                      activeOpacity={0.85}
                      onPress={() => handleDeleteService(row)}
                      disabled={isBusy}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} color="#FFFFFF" strokeWidth={2} />
                      <AppText style={styles.actionText}>{isBusy ? 'Removing...' : 'Remove'}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (row.isEditing) {
                          handleUpdateService(row);
                          return;
                        }
                        updateRow(row.id, { isEditing: true });
                      }}
                      disabled={isBusy}
                    >
                      <AppText style={styles.editText}>
                        {isBusy ? 'Saving...' : row.isEditing ? 'Save' : 'Edit'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {row.error ? <AppText style={styles.rowErrorText}>{row.error}</AppText> : null}
              </View>
            );
          })}
        </View>

        <AppButton
          label={loadingAction === 'add-service' ? 'Adding...' : 'Add more'}
          onPress={handleAddService}
          disabled={!canAddMore || Boolean(loadingAction)}
          style={styles.addMoreBtn}
          left={
            loadingAction === 'add-service' ? (
              <ActivityIndicator size="small" color={darkTheme.colors.background} />
            ) : null
          }
        />

      </ScrollView>
      <View style={styles.finishBar}>
        <AppButton
          label="Finish"
          onPress={handleFinish}
          disabled={Boolean(loadingAction)}
          style={styles.finishBtn}
        />
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
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 120,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    height: 34,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  subheading: {
    color: darkTheme.colors.muted,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: darkTheme.spacing.md,
  },
  loadingText: {
    color: darkTheme.colors.muted,
  },
  servicesList: {
    rowGap: 12,
  },
  serviceBlock: {
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 6,
  },
  dropdownTrigger: {
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dropdownDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dropdownTriggerText: {
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  dropdownPlaceholder: {
    color: 'rgba(255,255,255,0.55)',
  },
  dropdownPanel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#0B0B34',
    marginBottom: 10,
  },
  dropdownSearch: {
    marginBottom: 8,
  },
  dropdownList: {
    maxHeight: 160,
  },
  dropdownItem: {
    minHeight: 40,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemActive: {
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.2),
  },
  dropdownItemText: {
    color: '#F5F5F5',
  },
  dropdownItemTextActive: {
    color: darkTheme.colors.accent,
  },
  priceRow: {
    flexDirection: 'row',
    columnGap: 12,
  },
  priceInput: {
    flex: 1,
  },
  errorText: {
    color: '#FF7B8A',
    marginBottom: darkTheme.spacing.sm,
  },
  rowActions: {
    marginTop: 10,
    flexDirection: 'row',
    columnGap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 6,
  },
  removeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  editBtn: {
    backgroundColor: darkTheme.colors.accent,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  editText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  addMoreBtn: {
    marginTop: 16,
  },
  finishBtn: {
    width: '100%',
  },
  finishBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 10,
    backgroundColor: darkTheme.colors.background,
  },
  readOnlyInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  readOnlyInputText: {
    color: 'rgba(255,255,255,0.6)',
  },
  rowErrorText: {
    color: '#FF7B8A',
    marginTop: 8,
    fontSize: 12,
  },
});

export default SetServicesScreen;
