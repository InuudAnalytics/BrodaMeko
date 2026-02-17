import React, { useEffect, useMemo } from 'react';
import SharedChatScreen from '../../shared/ChatScreen';
import { AppBottomNav } from '../../../components';
import { ROLES, ROUTES } from '../../../utils';

const ChatScreen = ({ navigation, route }) => {
  const jobId = route?.params?.jobId;
  const mechanicId = route?.params?.mechanicId;
  const hasValidParams = Boolean(jobId && mechanicId);

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

  if (!hasValidParams) {
    return null;
  }

  const mechanic = route?.params?.mechanic || {
    name: 'Samuel Olamilekan',
    initials: 'SO',
    distanceKm: 1.2,
  };

  const recipient = useMemo(() => ({
    name: mechanic.name,
    initials: mechanic.initials || 'M',
    metaText: mechanic.distanceKm ? `${mechanic.distanceKm}km away` : null,
  }), [mechanic]);

  const renderBottomNav = () => (
    <AppBottomNav activeTab={ROUTES.CAR_OWNER_SETTINGS} onTabPress={(routeName) => navigation.navigate(routeName)} />
  );

  return (
    <SharedChatScreen
      navigation={navigation}
      route={route}
      recipient={recipient}
      currentUserRole={ROLES.CAR_OWNER}
      renderBottomNav={renderBottomNav}
      onBackPress={() => navigation.goBack()}
    />
  );
};

export default ChatScreen;
