import React from 'react';
import SharedConversationsScreen from '../../shared/ConversationsScreen';
import { AppBottomNav } from '../../../components';
import { ROUTES } from '../../../utils';

const ConversationsScreen = ({ navigation }) => {
  const handleConversationPress = (conversation) => {
    // Determine mechanic from conversation details if available
    const mechanic = conversation?.mechanic || { name: 'Mechanic' };

    navigation.navigate(ROUTES.CAR_OWNER_CHAT, {
      conversationId: conversation?.id || conversation?.conversation_id,
      conversation,
      mechanic,
      fromConversations: true,
    });
  };

  const renderBottomNav = () => (
    <AppBottomNav
      activeTab={ROUTES.CAR_OWNER_SETTINGS}
      onTabPress={(routeName) => navigation.navigate(routeName)}
    />
  );

  return (
    <SharedConversationsScreen
      onConversationPress={handleConversationPress}
      renderBottomNav={renderBottomNav}
    />
  );
};

export default ConversationsScreen;
