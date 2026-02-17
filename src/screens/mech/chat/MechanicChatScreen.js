import React, { useEffect, useMemo } from 'react';
import SharedChatScreen from '../../shared/ChatScreen';
import { ROLES, ROUTES } from '../../../utils';

const MechanicChatScreen = ({ navigation, route }) => {
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
            navigation.navigate(ROUTES.MECH_DASHBOARD_TABS);
        }
    }, [hasValidParams, navigation]);

    if (!hasValidParams) {
        return null;
    }

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
