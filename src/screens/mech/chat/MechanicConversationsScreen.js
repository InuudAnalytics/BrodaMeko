import React from 'react';
import SharedConversationsScreen from '../../shared/ConversationsScreen';
import { ROUTES } from '../../../utils';

const MechanicConversationsScreen = ({ navigation }) => {
    const handleConversationPress = (conversation) => {
        navigation.navigate(ROUTES.MECH_CHAT, {
            conversation,
            conversationId: conversation?.id || conversation?.conversation_id,
        });
    };

    return (
        <SharedConversationsScreen
            onConversationPress={handleConversationPress}
            emptyStateMessage="No chats with customers yet."
        />
    );
};

export default MechanicConversationsScreen;
