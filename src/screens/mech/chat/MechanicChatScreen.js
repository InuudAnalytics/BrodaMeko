import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import SharedChatScreen from '../../shared/ChatScreen';
import { AppText } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';

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

const MechanicChatScreen = ({ navigation, route }) => {
    const jobId = route?.params?.jobId;
    const mechanicId = route?.params?.mechanicId;
    const conversationId = String(route?.params?.conversationId || '').trim();
    const hasValidParams = Boolean(conversationId || (jobId && mechanicId));

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
    const recipient = (() => {
        if (route?.params?.customer) {
            return {
                name: route.params.customer.name || 'Customer',
                initials: route.params.customer.initials || 'C',
                rating: route.params.customer.rating || '',
                id: route.params.customer.id || route.params.carOwnerId || null,
            };
        }

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
    })();

    const issueSummary = route?.params?.issueSummary || {};
    const summaryLines = [
        issueSummary?.issueType ? `Issue: ${issueSummary.issueType}` : '',
        issueSummary?.description ? `Description: ${issueSummary.description}` : '',
        issueSummary?.carMake ? `Car make: ${issueSummary.carMake}` : '',
        Array.isArray(issueSummary?.images) && issueSummary.images.length ? `Images: ${issueSummary.images.length}` : '',
    ].filter(Boolean);

    const renderIssueSummary = () => (
        <View>
            {summaryLines.length ? (
                <View style={styles.summaryCard}>
                    <AppText style={styles.summaryTitle}>Client request</AppText>
                    {summaryLines.map((line) => (
                        <AppText key={line} style={styles.summaryLine}>
                            {line}
                        </AppText>
                    ))}
                </View>
            ) : null}

            <TouchableOpacity
                style={styles.trackingBtn}
                activeOpacity={0.85}
                onPress={() =>
                    navigation.navigate(ROUTES.MECH_LIVE_TRACKING, {
                        jobId: route?.params?.jobId,
                        mechanicId: route?.params?.mechanicId,
                        carOwnerId: route?.params?.carOwnerId,
                        customer: recipient,
                        conversationId: route?.params?.conversationId,
                        issueSummary,
                    })
                }
            >
                <AppText style={styles.trackingBtnText}>Open live tracking</AppText>
            </TouchableOpacity>
        </View>
    );

    return (
        <SharedChatScreen
            navigation={navigation}
            route={route}
            recipient={recipient}
            currentUserRole={ROLES.MECH}
            renderExtraContent={renderIssueSummary}
            onBackPress={() => navigation.goBack()}
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
    },
    trackingBtnText: {
        color: darkTheme.colors.accent,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '600',
    },
});

export default MechanicChatScreen;
