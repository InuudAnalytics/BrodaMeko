import React, { useMemo } from 'react';
import SharedChatScreen from '../../shared/ChatScreen';
import { ROLES } from '../../../utils';

const MechanicChatScreen = ({ navigation, route }) => {
    const { conversation, interaction } = route.params || {};

    // Resolve recipient from conversation participants or interaction details
    const recipient = useMemo(() => {
        // If we have a direct interaction object with user details
        if (interaction?.user) {
            return {
                name: interaction.user.name,
                initials: interaction.user.initials,
                // metaText: 'Customer', // Optional
            };
        }

        // Fallback to conversation participant logic
        // Mechanic chats with User
        const otherUser = conversation?.user || conversation?.other_user;

        if (otherUser) {
            return {
                name: otherUser.name,
                initials: otherUser.initials || 'U',
            };
        }

        return {
            name: route.params?.name || 'Customer',
            initials: 'C',
        };
    }, [conversation, interaction, route.params]);

    return (
        <SharedChatScreen
            navigation={navigation}
            route={route}
            recipient={recipient}
            currentUserRole={ROLES.MECH}
            onBackPress={() => navigation.goBack()}
        />
    );
};

export default MechanicChatScreen;
