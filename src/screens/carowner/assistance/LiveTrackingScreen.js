import { useEffect } from 'react';
import { ROUTES } from '../../../utils';

const LiveTrackingScreen = ({ navigation, route }) => {
  useEffect(() => {
    navigation.replace(ROUTES.CAR_OWNER_DASHBOARD, {
      activeSession: {
        status: 'active',
        progressStatus: route?.params?.trackingStatus || route?.params?.progressStatus || 'accepted',
        mechanic: route?.params?.mechanic || null,
        mechanicId: route?.params?.mechanicId || null,
        jobId: route?.params?.jobId || null,
        conversationId: route?.params?.conversationId || null,
        issueSummary: route?.params?.issueSummary || null,
        requestId: route?.params?.requestId || null,
      },
    });
  }, [navigation, route?.params]);

  return null;
};

export default LiveTrackingScreen;
