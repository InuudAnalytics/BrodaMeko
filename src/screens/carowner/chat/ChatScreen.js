import React, { useMemo } from 'react';
import SharedChatScreen from '../../shared/ChatScreen';
import { AppBottomNav } from '../../../components';
import { ROLES, ROUTES } from '../../../utils';

const ChatScreen = ({ navigation, route }) => {
  const mechanic = route?.params?.mechanic || {
    name: 'Samuel Olamilekan',
    initials: 'SO',
    distanceKm: 1.2,
  };
  const jobId = route?.params?.jobId;

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
