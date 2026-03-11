import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import SharedChatScreen from '../../shared/ChatScreen';
import { AppBottomNav, AppText } from '../../../components';
import { useChat } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';

const hexToRgba = (hex, alpha) => {
  const cleaned = String(hex || '')
    .replace('#', '')
    .trim();
  if (cleaned.length !== 6) {
    return `rgba(230,199,20,${alpha})`;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Statuses that mean the mechanic has been assigned and the job is active.
const ACTIVE_STATUSES = new Set([
  'accepted',
  'en_route',
  'arrived',
  'repairing',
  'in_progress',
]);

const isActiveStatus = value => {
  const s = String(value || '')
    .toLowerCase()
    .trim();
  return ACTIVE_STATUSES.has(s);
};

const CarOwnerChatScreen = ({ navigation, route }) => {
  const { latestJobStatusUpdate, setCarOwnerChatShortcut } = useChat();
  const autoOpenedTrackingRef = useRef(false);

  const jobId = route?.params?.jobId;
  const mechanicId = route?.params?.mechanicId;
  const conversationId = String(route?.params?.conversationId || '').trim();
  const hasValidParams = Boolean(conversationId || (jobId && mechanicId));

  // Seed the initial status from whatever was passed in route params.
  // EscrowFundingScreen passes `progressStatus: 'accepted'` after payment.
  // If the user navigates back to chat from elsewhere the status may already
  // be set. Defaults to empty - tracking banner stays hidden until we know.
  const [progressStatus, setProgressStatus] = useState(
    String(route?.params?.progressStatus || '')
      .toLowerCase()
      .trim(),
  );

  // When a live job_status_updated event arrives over the socket, update local
  // status so the tracking banner appears/updates without needing a re-navigate.
  useEffect(() => {
    if (!latestJobStatusUpdate) {
      return;
    }
    const incomingJobId = String(
      latestJobStatusUpdate?.job_id || latestJobStatusUpdate?.jobId || '',
    ).trim();
    // Only react to events for this specific job.
    if (incomingJobId && jobId && incomingJobId !== String(jobId).trim()) {
      return;
    }
    const newStatus = String(
      latestJobStatusUpdate?.new_status || latestJobStatusUpdate?.status || '',
    )
      .toLowerCase()
      .trim();
    if (newStatus) {
      setProgressStatus(newStatus);
      if (newStatus === 'en_route' && !autoOpenedTrackingRef.current) {
        autoOpenedTrackingRef.current = true;
        navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD, {
          activeSession: {
            status: 'active',
            progressStatus: newStatus,
            jobId,
            conversationId,
            mechanic: route?.params?.mechanic || null,
            mechanicId,
            issueSummary: route?.params?.issueSummary || null,
          },
        });
      }
    }
  }, [conversationId, jobId, latestJobStatusUpdate, mechanicId, navigation, route?.params?.issueSummary, route?.params?.mechanic]);

  // Sync if the route param changes (e.g. navigated back to chat with a new
  // progressStatus after payment).
  useEffect(() => {
    const fromParams = String(route?.params?.progressStatus || '')
      .toLowerCase()
      .trim();
    if (fromParams) {
      setProgressStatus(fromParams);
    }
  }, [route?.params?.progressStatus]);

  useEffect(() => {
    if (hasValidParams) {
      return;
    }
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD);
    }
  }, [hasValidParams, navigation]);

  useEffect(() => {
    if (!hasValidParams) {
      return;
    }

    setCarOwnerChatShortcut({
      conversationId,
      jobId: String(jobId || '').trim(),
      mechanicId,
      mechanic: route?.params?.mechanic || null,
      issueSummary: route?.params?.issueSummary || null,
      progressStatus,
    });
  }, [
    hasValidParams,
    conversationId,
    jobId,
    mechanicId,
    progressStatus,
    route?.params?.issueSummary,
    route?.params?.mechanic,
    setCarOwnerChatShortcut,
  ]);

  const mechanic = useMemo(
    () =>
      route?.params?.mechanic || {
        name: 'Assigned mechanic',
        initials: 'M',
        distanceKm: null,
      },
    [route?.params?.mechanic],
  );

  const recipient = {
    name: mechanic.name || mechanic.full_name || 'Assigned mechanic',
    initials: mechanic.initials || 'M',
    avatarUri:
      mechanic?.avatar?.url || mechanic?.avatarUrl || mechanic?.avatarUri || '',
    metaText: mechanic.distanceKm ? `${mechanic.distanceKm}km away` : null,
  };

  const issueSummary = useMemo(
    () => route?.params?.issueSummary || {},
    [route?.params?.issueSummary],
  );
  const summaryLines = [
    issueSummary?.issueType ? `Issue: ${issueSummary.issueType}` : '',
    issueSummary?.description ? `Description: ${issueSummary.description}` : '',
    issueSummary?.carMake ? `Car make: ${issueSummary.carMake}` : '',
    Array.isArray(issueSummary?.images) && issueSummary.images.length
      ? `Images: ${issueSummary.images.length}`
      : '',
  ].filter(Boolean);

  const handleOpenTracking = useCallback(() => {
    navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD, {
      activeSession: {
        status: 'active',
        progressStatus,
        jobId,
        conversationId,
        mechanic,
        mechanicId,
        issueSummary,
      },
    });
  }, [
    navigation,
    progressStatus,
    jobId,
    conversationId,
    mechanic,
    mechanicId,
    issueSummary,
  ]);

  const renderExtraContent = useCallback(() => {
    const showTrackingBanner = isActiveStatus(progressStatus);

    return (
      <View>
        {summaryLines.length ? (
          <View style={styles.summaryCard}>
            <AppText style={styles.summaryTitle}>Request details</AppText>
            {summaryLines.map(line => (
              <AppText key={line} style={styles.summaryLine}>
                {line}
              </AppText>
            ))}
          </View>
        ) : null}

        {showTrackingBanner ? (
          <TouchableOpacity
            style={styles.trackingBtn}
            activeOpacity={0.85}
            onPress={handleOpenTracking}
          >
            <AppText style={styles.trackingBtnText}>
              Mechanic assigned - View live tracking
            </AppText>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }, [summaryLines, progressStatus, handleOpenTracking]);

  const renderBottomNav = useCallback(
    () => (
      <AppBottomNav
        activeTab={ROUTES.CAR_OWNER_SETTINGS}
        onTabPress={routeName => navigation.navigate(routeName)}
      />
    ),
    [navigation],
  );
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  if (!hasValidParams) {
    return null;
  }

  return (
    <SharedChatScreen
      navigation={navigation}
      route={route}
      recipient={recipient}
      currentUserRole={ROLES.CAR_OWNER}
      renderBottomNav={renderBottomNav}
      renderExtraContent={renderExtraContent}
      onBackPress={handleBack}
    />
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: hexToRgba(darkTheme.colors.accent, 0.45),
    borderRadius: 12,
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.12),
    paddingHorizontal: 12,
    paddingVertical: 10,
    rowGap: 2,
  },
  summaryTitle: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryLine: {
    color: '#DCE2F0',
    fontSize: 12,
    lineHeight: 16,
  },
  trackingBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: hexToRgba(darkTheme.colors.accent, 0.45),
    borderRadius: 12,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.08),
  },
  trackingBtnText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});

export default CarOwnerChatScreen;
