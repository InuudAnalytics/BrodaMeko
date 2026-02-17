import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BubbleChatIcon, PlusSignIcon, SentIcon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../components';
import { useChat } from '../../context/ChatContext';
import { darkTheme } from '../../theme';
import { pickSingleImageFromGallery, useKeyboardLift } from '../../utils';

const BackIcon = ({ color }) => {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M15 6L9 12L15 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
};

const CallIcon = ({ color }) => {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
                d="M6.5 3.5h2.1c.5 0 .9.3 1 .8l.6 2.7c.1.4 0 .8-.3 1.1l-1.2 1.2a13 13 0 0 0 5.8 5.8l1.2-1.2c.3-.3.7-.4 1.1-.3l2.7.6c.5.1.8.5.8 1v2.1c0 .6-.4 1.1-1 1.2-.8.1-1.6.2-2.4.2A15.6 15.6 0 0 1 4.8 6.9c0-.8.1-1.6.2-2.4.1-.6.6-1 1.2-1Z"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

const formatTime = (dateValue) => {
    const date = dateValue ? new Date(dateValue) : new Date();

    if (Number.isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const resolveConversationId = (routeParams) => {
    const fromParam = String(routeParams?.conversationId || '').trim();

    if (fromParam) {
        return fromParam;
    }

    const conversation = routeParams?.conversation;
    const fromConversation = String(
        conversation?.id || conversation?._id || conversation?.conversation_id || conversation?.conversationId || ''
    ).trim();

    if (fromConversation) {
        return fromConversation;
    }

    return 'local-preview';
};

const isSenderMe = (item, currentUserRole) => {
    // If no role logic is passed, default to checking if sender is 'user' or 'me'
    // But ideally, we want to know if *I* sent it.
    // existing logic:
    // const sender = String(item?.sender || item?.sender_type || item?.role || '').toLowerCase();
    // return sender === 'user' || sender === 'me' || sender === 'self' || sender === 'car_owner';

    // Updated logic for shared component:
    const sender = String(item?.sender || item?.sender_type || item?.role || '').toLowerCase();

    if (sender === 'me' || sender === 'self') return true;

    // If we know the current user role, we can check against it
    if (currentUserRole) {
        if (currentUserRole === 'CAR_OWNER' && (sender === 'user' || sender === 'car_owner')) return true;
        if (currentUserRole === 'MECH' && (sender === 'mechanic' || sender === 'mech')) return true;
    } else {
        // Fallback for backward compatibility if role isn't passed (assumes car owner view)
        return sender === 'user' || sender === 'car_owner';
    }

    return false;
};


const getMessageText = (item) => {
    if (item?.type === 'image') {
        if (item?.status === 'uploading') {
            return 'Uploading image...';
        }

        if (item?.status === 'upload-failed') {
            return 'Image upload failed';
        }

        return 'Image sent';
    }

    return item?.text || item?.message || '';
};

const MessageBubble = ({ item, currentUserRole }) => {
    if (item?.type === 'system') {
        return (
            <View style={styles.systemWrap}>
                <AppText style={styles.systemText}>{item.text}</AppText>
            </View>
        );
    }

    const isMe = isSenderMe(item, currentUserRole);

    return (
        <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
            <View style={[styles.bubble, isMe ? styles.meBubble : styles.otherBubble]}>
                <AppText style={[styles.messageText, isMe ? styles.meMessageText : styles.otherMessageText]}>
                    {getMessageText(item)}
                </AppText>
            </View>
            <AppText style={styles.timestamp}>{item?.timestamp || formatTime(item?.created_at)}</AppText>
        </View>
    );
};

const SharedChatScreen = ({
    route,
    navigation,
    recipient,
    currentUserRole,
    onBackPress,
    renderExtraContent
}) => {
    const listRef = useRef(null);
    const { targetRef, animatedStyle } = useKeyboardLift({
        extraOffset: darkTheme.spacing.xxxl,
        anchor: 'bottom',
    });

    const {
        messagesByConversationId,
        fetchMessages,
        markConversationRead,
        addMockTextMessage,
        uploadImages,
        uploadingImages,
    } = useChat();

    const conversationId = useMemo(() => resolveConversationId(route?.params), [route?.params]);
    const hasRealConversation = conversationId !== 'local-preview';

    const [inputValue, setInputValue] = useState('');
    const [hasInteracted, setHasInteracted] = useState(false); // Replaces 'accepted' state for generic interaction

    const messages = useMemo(
        () => messagesByConversationId[conversationId] || [],
        [conversationId, messagesByConversationId]
    );
    const isSendEnabled = inputValue.trim().length > 0;

    useEffect(() => {
        let mounted = true;

        const bootstrapConversation = async () => {
            if (!hasRealConversation) {
                return;
            }

            await fetchMessages(conversationId, { limit: 50, offset: 0 });

            if (mounted) {
                await markConversationRead(conversationId);
            }
        };

        bootstrapConversation();

        return () => {
            mounted = false;
        };
    }, [conversationId, fetchMessages, hasRealConversation, markConversationRead]);

    useEffect(() => {
        requestAnimationFrame(() => {
            if (listRef.current) {
                listRef.current.scrollToEnd({ animated: true });
            }
        });
    }, [messages]);

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text) {
            return;
        }

        addMockTextMessage(conversationId, text);
        setInputValue('');
        setHasInteracted(true);
    };

    const handleAttach = async () => {
        if (!hasRealConversation) {
            Alert.alert('Unavailable', 'Open a real conversation before uploading images.');
            return;
        }

        try {
            const { asset, cancelled, error } = await pickSingleImageFromGallery();

            if (cancelled) {
                return;
            }

            if (error) {
                Alert.alert('Upload failed', error);
                return;
            }

            if (asset?.uri) {
                await uploadImages(conversationId, [asset]);
                setHasInteracted(true);
            }
        } catch {
            Alert.alert('Upload failed', 'Could not attach image. Please try again.');
        }
    };

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    return (
        <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
            <Animated.View ref={targetRef} style={[styles.chatArea, animatedStyle]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconButton} onPress={handleBack} activeOpacity={0.85}>
                        <BackIcon color={darkTheme.colors.text} />
                    </TouchableOpacity>

                    <View style={styles.userBlock}>
                        <View style={styles.avatar}>
                            <AppText style={styles.avatarText}>{recipient?.initials || 'U'}</AppText>
                        </View>
                        <View style={styles.nameWrap}>
                            <AppText style={styles.name}>{recipient?.name || 'User'}</AppText>
                            <View style={styles.statusRow}>
                                <View style={styles.statusDot} />
                                <AppText style={styles.statusOnline}>Online</AppText>
                                {recipient?.metaText ? <AppText style={styles.statusMeta}>{recipient.metaText}</AppText> : null}
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
                        <CallIcon color={darkTheme.colors.muted} />
                    </TouchableOpacity>
                </View>

                {renderExtraContent ? renderExtraContent(hasInteracted) : null}

                {messages.length ? (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={(item, index) => String(item?.id || `${conversationId}_${index}`)}
                        renderItem={({ item }) => <MessageBubble item={item} currentUserRole={currentUserRole} />}
                        ListHeaderComponent={<AppText style={styles.todayLabel}>Today</AppText>}
                        contentContainerStyle={styles.messagesContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyStateWrap}>
                        <HugeiconsIcon icon={BubbleChatIcon} size={42} color={darkTheme.colors.muted} strokeWidth={1.8} />
                        <AppText variant="muted" style={styles.emptyStateText}>
                            No message.
                        </AppText>
                    </View>
                )}

                <View style={styles.composerWrap}>
                    <Pressable style={styles.attachButton} onPress={handleAttach}>
                        {uploadingImages ? (
                            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
                        ) : (
                            <HugeiconsIcon icon={PlusSignIcon} size={20} color={darkTheme.colors.accent} strokeWidth={2} />
                        )}
                    </Pressable>

                    <TextInput
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder="Message"
                        placeholderTextColor={darkTheme.colors.muted}
                        style={styles.input}
                    />
                    <Pressable
                        style={[
                            styles.sendButton,
                            isSendEnabled ? styles.sendButtonActive : styles.sendButtonInactive,
                        ]}
                        onPress={handleSend}
                        disabled={!isSendEnabled}
                    >
                        <HugeiconsIcon
                            icon={SentIcon}
                            size={22}
                            color={isSendEnabled ? darkTheme.colors.accent : darkTheme.colors.muted}
                            strokeWidth={1.9}
                        />
                    </Pressable>
                </View>
            </Animated.View>
        </ScreenContainer>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: darkTheme.colors.background,
    },
    chatArea: {
        flex: 1,
    },
    header: {
        paddingHorizontal: darkTheme.spacing.md,
        paddingTop: darkTheme.spacing.xs,
        paddingBottom: darkTheme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: darkTheme.spacing.xs,
    },
    iconButton: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userBlock: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: darkTheme.spacing.xs,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF7B4A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: darkTheme.colors.text,
        fontSize: darkTheme.typography.fontSizes.xs,
        fontWeight: darkTheme.typography.fontWeights.semibold,
    },
    nameWrap: {
        flex: 1,
    },
    name: {
        color: darkTheme.colors.text,
        fontSize: darkTheme.typography.fontSizes.md,
        lineHeight: 20,
        fontWeight: darkTheme.typography.fontWeights.medium,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: darkTheme.spacing.xs,
        marginTop: 1,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00D64F',
    },
    statusOnline: {
        color: '#00D64F',
        fontSize: darkTheme.typography.fontSizes.xs,
        lineHeight: 16,
    },
    statusMeta: {
        color: darkTheme.colors.muted,
        fontSize: darkTheme.typography.fontSizes.xs,
        lineHeight: 16,
    },
    todayLabel: {
        textAlign: 'center',
        color: darkTheme.colors.muted,
        fontSize: darkTheme.typography.fontSizes.md,
        marginVertical: darkTheme.spacing.sm,
    },
    messagesContent: {
        flexGrow: 1,
        paddingHorizontal: darkTheme.spacing.md,
        paddingBottom: darkTheme.spacing.sm,
    },
    emptyStateWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        rowGap: darkTheme.spacing.xs,
        paddingHorizontal: darkTheme.spacing.lg,
    },
    emptyStateText: {
        color: darkTheme.colors.muted,
        textAlign: 'center',
    },
    messageRow: {
        marginBottom: darkTheme.spacing.sm,
        maxWidth: '88%',
    },
    messageRowOther: {
        alignSelf: 'flex-start',
    },
    messageRowMe: {
        alignSelf: 'flex-end',
    },
    bubble: {
        borderRadius: 18,
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.sm,
    },
    otherBubble: {
        backgroundColor: '#F3F4F6',
        borderBottomLeftRadius: 6,
    },
    meBubble: {
        backgroundColor: darkTheme.colors.accent,
        borderBottomRightRadius: 6,
    },
    messageText: {
        fontSize: darkTheme.typography.fontSizes.sm,
        lineHeight: 20,
    },
    otherMessageText: {
        color: '#303030', // Keep dark text for light gray bubble
    },
    meMessageText: {
        color: '#1A1A1A', // Dark text on accent color
    },
    timestamp: {
        marginTop: 4,
        color: darkTheme.colors.muted,
        fontSize: 12,
        lineHeight: 16,
    },
    systemWrap: {
        alignSelf: 'center',
        backgroundColor: 'rgba(226,255,49,0.13)',
        borderRadius: darkTheme.radius.md,
        paddingHorizontal: darkTheme.spacing.md,
        paddingVertical: darkTheme.spacing.xs,
        marginVertical: darkTheme.spacing.xs,
    },
    systemText: {
        color: darkTheme.colors.accent,
        fontSize: darkTheme.typography.fontSizes.xs,
        lineHeight: 16,
    },
    composerWrap: {
        paddingHorizontal: darkTheme.spacing.md,
        paddingTop: darkTheme.spacing.sm,
        paddingBottom: darkTheme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: darkTheme.spacing.xs,
    },
    attachButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        borderColor: darkTheme.colors.inputBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        minHeight: 46,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        borderRadius: 23,
        paddingHorizontal: darkTheme.spacing.md,
        color: darkTheme.colors.text,
        fontSize: darkTheme.typography.fontSizes.sm,
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonActive: {
        borderColor: darkTheme.colors.accent,
        backgroundColor: 'transparent',
    },
    sendButtonInactive: {
        borderColor: darkTheme.colors.muted,
        backgroundColor: 'transparent',
    },
});

export default SharedChatScreen;
