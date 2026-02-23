import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import MechanicServicesContext from '../../../context/MechanicServicesContext';
import {
  ISSUE_TYPES,
  addMechanicService,
  deleteMechanicService,
  getMyMechanicServices,
  updateMechanicService,
} from '../../../services/mechanic.services.service';
import { darkTheme } from '../../../theme';

const hexToRgba = (hex, alpha) => {
  const cleaned = String(hex || '').replace('#', '').trim();
  if (cleaned.length !== 6) {
    return `rgba(230,199,20,${alpha})`;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const formatIssueType = (value) =>
  String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getServiceId = (service) =>
  String(service?.id || service?._id || service?.service_id || service?.serviceId || '').trim();

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

  return [];
};

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

const IssueTypePicker = ({ selected, onSelect }) => {
  return (
    <View style={styles.issueWrap}>
      {ISSUE_TYPES.map((type) => {
        const isSelected = selected === type;

        return (
          <Pressable
            key={type}
            onPress={() => onSelect(type)}
            style={[styles.issuePill, isSelected ? styles.issuePillSelected : null]}
          >
            <AppText style={[styles.issuePillText, isSelected ? styles.issuePillTextSelected : null]}>
              {formatIssueType(type)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const ServiceRow = ({ item, onEdit, onDelete, isDeleting }) => {
  return (
    <View style={styles.serviceRow}>
      <View style={styles.serviceInfo}>
        <AppText style={styles.serviceIssue}>{formatIssueType(item.issue_type)}</AppText>
        <AppText variant="muted" style={styles.servicePrice}>
          N {Number(item.min_price || 0).toLocaleString()} - N {Number(item.max_price || 0).toLocaleString()}
        </AppText>
      </View>

      <View style={styles.rowActions}>
        <AppButton label="Edit" onPress={onEdit} style={styles.smallButton} />
        <AppButton
          label={isDeleting ? 'Deleting...' : 'Delete'}
          onPress={onDelete}
          disabled={isDeleting}
          style={styles.smallButton}
        />
      </View>
    </View>
  );
};

const SetServicesScreen = () => {
  const mechanicServicesContext = useContext(MechanicServicesContext);
  const hasContext = Boolean(mechanicServicesContext);

  const [localServices, setLocalServices] = useState([]);
  const [loadingAction, setLoadingAction] = useState('');
  const [formError, setFormError] = useState('');

  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [editingServiceId, setEditingServiceId] = useState('');
  const [editMinPrice, setEditMinPrice] = useState('');
  const [editMaxPrice, setEditMaxPrice] = useState('');
  const [editError, setEditError] = useState('');

  const services = hasContext ? mechanicServicesContext.services : localServices;
  const contextError = hasContext ? mechanicServicesContext.error : '';

  const fetchServices = useCallback(async () => {
    if (hasContext) {
      return mechanicServicesContext.fetchServices();
    }

    const response = await getMyMechanicServices();
    const nextServices = extractServices(response?.data);
    setLocalServices(nextServices);
    return response;
  }, [hasContext, mechanicServicesContext]);

  const addService = useCallback(async (payload) => {
    if (hasContext) {
      return mechanicServicesContext.addService(payload);
    }

    const response = await addMechanicService(payload);
    await fetchServices();
    return response;
  }, [fetchServices, hasContext, mechanicServicesContext]);

  const updateService = useCallback(async (serviceId, payload) => {
    if (hasContext) {
      return mechanicServicesContext.updateService(serviceId, payload);
    }

    const response = await updateMechanicService(serviceId, payload);
    await fetchServices();
    return response;
  }, [fetchServices, hasContext, mechanicServicesContext]);

  const removeService = useCallback(async (serviceId) => {
    if (hasContext) {
      return mechanicServicesContext.deleteService(serviceId);
    }

    const response = await deleteMechanicService(serviceId);
    await fetchServices();
    return response;
  }, [fetchServices, hasContext, mechanicServicesContext]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setLoadingAction('fetch-services');

      try {
        await fetchServices();
      } catch (error) {
        if (isMounted) {
          setFormError(error?.message || 'Failed to fetch services.');
        }
      } finally {
        if (isMounted) {
          setLoadingAction('');
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [fetchServices]);

  const validateAddForm = () => {
    if (!issueType) {
      return 'Please select an issue type.';
    }

    const minErr = parsePrice(minPrice, 'Min price');
    if (minErr) {
      return minErr;
    }

    const maxErr = parsePrice(maxPrice, 'Max price');
    if (maxErr) {
      return maxErr;
    }

    if (Number(minPrice) > Number(maxPrice)) {
      return 'Min price cannot be greater than max price.';
    }

    return '';
  };

  const handleAddService = async () => {
    setFormError('');
    setEditError('');

    const validationError = validateAddForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setLoadingAction('add-service');

    try {
      const response = await addService({
        issue_type: issueType,
        min_price: Number(minPrice),
        max_price: Number(maxPrice),
      });

      if (!response?.success && response?.message) {
        setFormError(response.message);
        return;
      }

      setMinPrice('');
      setMaxPrice('');
    } catch (error) {
      setFormError(error?.message || 'Failed to add service.');
    } finally {
      setLoadingAction('');
    }
  };

  const startEdit = (service) => {
    const id = getServiceId(service);

    setEditingServiceId(id);
    setEditMinPrice(String(service?.min_price ?? ''));
    setEditMaxPrice(String(service?.max_price ?? ''));
    setEditError('');
  };

  const handleUpdateService = async () => {
    if (!editingServiceId) {
      return;
    }

    const minErr = parsePrice(editMinPrice, 'Min price');
    if (minErr) {
      setEditError(minErr);
      return;
    }

    const maxErr = parsePrice(editMaxPrice, 'Max price');
    if (maxErr) {
      setEditError(maxErr);
      return;
    }

    if (Number(editMinPrice) > Number(editMaxPrice)) {
      setEditError('Min price cannot be greater than max price.');
      return;
    }

    setLoadingAction(`update-${editingServiceId}`);
    setEditError('');

    try {
      const response = await updateService(editingServiceId, {
        min_price: Number(editMinPrice),
        max_price: Number(editMaxPrice),
      });

      if (!response?.success && response?.message) {
        setEditError(response.message);
        return;
      }

      setEditingServiceId('');
      setEditMinPrice('');
      setEditMaxPrice('');
    } catch (error) {
      setEditError(error?.message || 'Failed to update service.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!serviceId) {
      return;
    }

    setLoadingAction(`delete-${serviceId}`);
    setFormError('');
    setEditError('');

    try {
      await removeService(serviceId);
    } catch (error) {
      setFormError(error?.message || 'Failed to delete service.');
    } finally {
      setLoadingAction('');
    }
  };

  const inlineError = useMemo(() => formError || contextError || '', [formError, contextError]);

  return (
    <ScreenContainer style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" style={styles.heading}>
          Set Services
        </AppText>
        <AppText variant="muted" style={styles.subheading}>
          Add and manage your pricing estimates
        </AppText>

        <AppText variant="muted" style={styles.fieldLabel}>
          Issue type
        </AppText>
        <IssueTypePicker selected={issueType} onSelect={setIssueType} />

        <AppInput
          label="Min price"
          value={minPrice}
          onChangeText={setMinPrice}
          keyboardType="numeric"
          placeholder="75000"
        />
        <AppInput
          label="Max price"
          value={maxPrice}
          onChangeText={setMaxPrice}
          keyboardType="numeric"
          placeholder="100000"
        />

        {inlineError ? <AppText style={styles.errorText}>{inlineError}</AppText> : null}

        <AppButton
          label={loadingAction === 'add-service' ? 'Adding...' : 'Add Service'}
          onPress={handleAddService}
          disabled={Boolean(loadingAction)}
          left={
            loadingAction === 'add-service' ? (
              <ActivityIndicator size="small" color={darkTheme.colors.background} />
            ) : null
          }
        />

        <View style={styles.listHeader}>
          <AppText variant="subtitle" style={styles.listTitle}>
            Current Services
          </AppText>
          {loadingAction === 'fetch-services' ? (
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          ) : null}
        </View>

        {!services.length ? (
          <AppText variant="muted" style={styles.emptyText}>
            No services yet.
          </AppText>
        ) : (
          services.map((service) => {
            const serviceId = getServiceId(service);
            const isEditing = editingServiceId && editingServiceId === serviceId;
            const isDeleting = loadingAction === `delete-${serviceId}`;
            const isUpdating = loadingAction === `update-${serviceId}`;

            return (
              <View key={serviceId || `${service.issue_type}-${service.min_price}-${service.max_price}`} style={styles.serviceBlock}>
                <ServiceRow
                  item={service}
                  onEdit={() => startEdit(service)}
                  onDelete={() => handleDeleteService(serviceId)}
                  isDeleting={isDeleting}
                />

                {isEditing ? (
                  <View style={styles.editBlock}>
                    <AppInput
                      label="Edit min price"
                      value={editMinPrice}
                      onChangeText={setEditMinPrice}
                      keyboardType="numeric"
                      placeholder="80000"
                    />
                    <AppInput
                      label="Edit max price"
                      value={editMaxPrice}
                      onChangeText={setEditMaxPrice}
                      keyboardType="numeric"
                      placeholder="95000"
                    />

                    {editError ? <AppText style={styles.errorText}>{editError}</AppText> : null}

                    <View style={styles.editActions}>
                      <AppButton
                        label={isUpdating ? 'Saving...' : 'Save'}
                        onPress={handleUpdateService}
                        disabled={Boolean(loadingAction)}
                        left={
                          isUpdating ? (
                            <ActivityIndicator size="small" color={darkTheme.colors.background} />
                          ) : null
                        }
                      />
                      <AppButton
                        label="Cancel"
                        onPress={() => {
                          setEditingServiceId('');
                          setEditError('');
                        }}
                        disabled={Boolean(loadingAction)}
                        style={styles.cancelButton}
                        textStyle={styles.cancelText}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xxl,
  },
  heading: {
    color: darkTheme.colors.accent,
  },
  subheading: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.md,
  },
  fieldLabel: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  issueWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.md,
  },
  issuePill: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.sm,
    paddingVertical: darkTheme.spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  issuePillSelected: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.12),
  },
  issuePillText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  issuePillTextSelected: {
    color: darkTheme.colors.accent,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  errorText: {
    color: '#FF7B8A',
    marginBottom: darkTheme.spacing.sm,
  },
  listHeader: {
    marginTop: darkTheme.spacing.lg,
    marginBottom: darkTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    color: darkTheme.colors.text,
  },
  emptyText: {
    color: darkTheme.colors.muted,
  },
  serviceBlock: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    padding: darkTheme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: darkTheme.spacing.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceIssue: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  servicePrice: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.xxs,
  },
  rowActions: {
    flexDirection: 'row',
    columnGap: darkTheme.spacing.xs,
    marginLeft: darkTheme.spacing.sm,
  },
  smallButton: {
    minHeight: 38,
    paddingHorizontal: darkTheme.spacing.sm,
  },
  editBlock: {
    marginTop: darkTheme.spacing.sm,
  },
  editActions: {
    rowGap: darkTheme.spacing.xs,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
  },
  cancelText: {
    color: darkTheme.colors.text,
  },
});

export default SetServicesScreen;
