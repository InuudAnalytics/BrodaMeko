import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../components';
import {
  addMechanicService,
  deleteMechanicService,
  getMyMechanicServices,
  updateMechanicService,
} from '../../services/mechanic.services.service';
import { darkTheme } from '../../theme';

const PRETTY_SPACE = 2;

const safeJson = (value) => {
  try {
    return JSON.stringify(value, null, PRETTY_SPACE);
  } catch {
    return String(value);
  }
};

const getServiceId = (service) => {
  if (!service || typeof service !== 'object') {
    return '';
  }

  return String(service.id || service._id || service.service_id || service.serviceId || '').trim();
};

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

const MechanicServicesApiTestScreen = () => {
  const [loadingAction, setLoadingAction] = useState('');
  const [output, setOutput] = useState('');
  const [services, setServices] = useState([]);

  const isBusy = useMemo(() => Boolean(loadingAction), [loadingAction]);

  const runAction = async (actionKey, runner) => {
    setLoadingAction(actionKey);

    try {
      const result = await runner();
      setOutput(
        safeJson({
          ok: true,
          action: actionKey,
          result,
        })
      );
    } catch (error) {
      setOutput(
        safeJson({
          ok: false,
          action: actionKey,
          error: {
            message: error?.message || 'Request failed',
            statusCode: error?.statusCode || 0,
            data: error?.data || null,
          },
        })
      );
    } finally {
      setLoadingAction('');
    }
  };

  const refreshServices = async () => {
    const response = await getMyMechanicServices();
    setServices(extractServices(response?.data));
    return response;
  };

  const handleGetMyServices = () =>
    runAction('get-my-services', async () => {
      const response = await refreshServices();
      return response;
    });

  const handleAddService = () =>
    runAction('add-service-engine-trouble', async () => {
      const response = await addMechanicService({
        issue_type: 'engine_trouble',
        min_price: 75000,
        max_price: 100000,
      });

      await refreshServices();
      return response;
    });

  const handleUpdateFirstService = () =>
    runAction('update-first-service', async () => {
      const firstService = services[0];
      const firstServiceId = getServiceId(firstService);

      if (!firstServiceId) {
        throw new Error('No service found. Tap "Get My Services" first.');
      }

      const response = await updateMechanicService(firstServiceId, {
        min_price: 80000,
        max_price: 95000,
      });

      await refreshServices();
      return response;
    });

  const handleDeleteFirstService = () =>
    runAction('delete-first-service', async () => {
      const firstService = services[0];
      const firstServiceId = getServiceId(firstService);

      if (!firstServiceId) {
        throw new Error('No service found. Tap "Get My Services" first.');
      }

      const response = await deleteMechanicService(firstServiceId);
      await refreshServices();
      return response;
    });

  const busyIndicator = (actionKey) =>
    loadingAction === actionKey ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null;

  return (
    <ScreenContainer style={styles.screen}>
      <AppText variant="title" style={styles.heading}>
        Mechanic Services API Test
      </AppText>
      <AppText variant="muted" style={styles.subheading}>
        Temporary dev-only test actions
      </AppText>

      <View style={styles.buttonList}>
        <AppButton
          label={loadingAction === 'get-my-services' ? 'Loading...' : 'Get My Services'}
          disabled={isBusy}
          onPress={handleGetMyServices}
          left={busyIndicator('get-my-services')}
        />

        <AppButton
          label={
            loadingAction === 'add-service-engine-trouble'
              ? 'Adding...'
              : 'Add Service (engine_trouble 75k-100k)'
          }
          disabled={isBusy}
          onPress={handleAddService}
          left={busyIndicator('add-service-engine-trouble')}
        />

        <AppButton
          label={
            loadingAction === 'update-first-service'
              ? 'Updating...'
              : 'Update First Service (80k-95k)'
          }
          disabled={isBusy}
          onPress={handleUpdateFirstService}
          left={busyIndicator('update-first-service')}
        />

        <AppButton
          label={loadingAction === 'delete-first-service' ? 'Deleting...' : 'Delete First Service'}
          disabled={isBusy}
          onPress={handleDeleteFirstService}
          left={busyIndicator('delete-first-service')}
        />
      </View>

      <View style={styles.outputCard}>
        <View style={styles.outputHeader}>
          <AppText variant="subtitle" style={styles.outputTitle}>
            Response JSON
          </AppText>
          {isBusy ? <ActivityIndicator size="small" color={darkTheme.colors.accent} /> : null}
        </View>

        <ScrollView style={styles.outputScroll} contentContainerStyle={styles.outputContent}>
          <AppText style={styles.outputText}>{output || 'No response yet. Tap an action above.'}</AppText>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.lg,
    backgroundColor: darkTheme.colors.background,
  },
  heading: {
    color: darkTheme.colors.text,
  },
  subheading: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.lg,
  },
  buttonList: {
    rowGap: darkTheme.spacing.sm,
  },
  outputCard: {
    flex: 1,
    marginTop: darkTheme.spacing.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: darkTheme.spacing.md,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  outputTitle: {
    color: darkTheme.colors.accent,
  },
  outputScroll: {
    flex: 1,
  },
  outputContent: {
    paddingBottom: darkTheme.spacing.md,
  },
  outputText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 18,
  },
});

export default MechanicServicesApiTestScreen;
