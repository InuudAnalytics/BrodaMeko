import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, SentIcon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';

const buildInitialMessages = () => [
  {
    id: 'welcome-1',
    text: 'Welcome to BrodaMeko chat support! By continuing, you acknowledge that your chat may be monitored.',
    time: '8:45 PM',
  },
  {
    id: 'welcome-2',
    text: 'Hi, how can we help you today?',
    time: '8:45 PM',
  },
];

const SupportChatMockScreen = ({ navigation }) => {
  const [messages, setMessages] = useState(buildInitialMessages);
  const [input, setInput] = useState('');

  const canSend = useMemo(() => String(input || '').trim().length > 0, [input]);

  const handleSend = () => {
    const text = String(input || '').trim();
    if (!text) {
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, text, time, mine: true }]);
    setInput('');
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <AppText style={styles.title}>Chat support</AppText>
          <AppText style={styles.subtitle}>BrodaMeko</AppText>
        </View>
      </View>

      <AppText style={styles.todayText}>Today</AppText>

      <View style={styles.messagesWrap}>
        {messages.map((item) => (
          <View key={item.id} style={[styles.messageRow, item.mine ? styles.messageRowMine : null]}>
            <View style={[styles.messageBubble, item.mine ? styles.messageBubbleMine : null]}>
              <AppText style={[styles.messageText, item.mine ? styles.messageTextMine : null]}>{item.text}</AppText>
            </View>
            <AppText style={styles.messageTime}>{item.time}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type in your message"
            placeholderTextColor="rgba(255,255,255,0.38)"
            style={styles.input}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, !canSend ? styles.sendButtonDisabled : null]}
          activeOpacity={0.9}
          disabled={!canSend}
          onPress={handleSend}
        >
          <HugeiconsIcon icon={SentIcon} size={18} color="rgba(255,255,255,0.82)" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    marginRight: 36,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  subtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 16,
    lineHeight: 20,
  },
  todayText: {
    marginTop: 14,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  messagesWrap: {
    marginTop: 14,
    flex: 1,
    rowGap: 14,
  },
  messageRow: {
    alignSelf: 'flex-start',
    maxWidth: '76%',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 18,
    borderTopLeftRadius: 18,
    backgroundColor: '#F1F2F4',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#DADDF6',
  },
  messageText: {
    color: '#5B6072',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#2B2F42',
  },
  messageTime: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.48)',
    fontSize: 14,
    lineHeight: 18,
  },
  inputRow: {
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  inputWrap: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
});

export default SupportChatMockScreen;
