import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  CallIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import { acceptCall, rejectCall } from '../../../services/calls.service';
import AppAlert from '../../../components/AppAlert';
import { trackTelemetryEvent } from '../../../services/telemetry.service';

const IncomingCallScreen = ({ navigation, route }) => {
  const callerName = String(route?.params?.callerName || 'Contact').trim();
  const contextLabel = String(route?.params?.contextLabel || 'Incoming call').trim();
  const contextType = String(route?.params?.contextType || '').trim().toLowerCase();
  const contextId = String(route?.params?.contextId || '').trim();
  const callId = String(route?.params?.callId || '').trim();
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    trackTelemetryEvent('incoming_screen_shown', {
      call_id: callId,
      context_type: contextType,
      context_id: contextId,
    });
  }, [callId, contextId, contextType]);

  const handleAccept = async () => {
    if (!callId) {
      AppAlert.alert('Call unavailable', 'Missing call session.');
      return;
    }
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await acceptCall(callId);
      navigation.replace(ROUTES.CALL_IN_PROGRESS, {
        callId,
        participantName: callerName,
        contextLabel,
        contextType,
        contextId,
      });
    } catch (error) {
      AppAlert.alert('Could not accept call', error?.message || 'Please try again.');
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!callId) {
      navigation.goBack();
      return;
    }
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await rejectCall(callId, { reason: 'declined' });
      navigation.goBack();
    } catch (error) {
      AppAlert.alert('Could not reject call', error?.message || 'Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <AppText style={styles.avatarText}>{callerName.charAt(0).toUpperCase() || 'C'}</AppText>
        </View>
        <AppText style={styles.name}>{callerName}</AppText>
        <AppText style={styles.subtitle}>{contextLabel}</AppText>
        <AppText style={styles.ringing}>Incoming call...</AppText>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.actionBtn, styles.endBtn]} activeOpacity={0.85} onPress={handleReject}>
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#fff" strokeWidth={2.2} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} activeOpacity={0.85} onPress={handleAccept}>
          <HugeiconsIcon icon={CallIcon} size={20} color="#0F132A" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 18,
  },
  header: {
    minHeight: 52,
    justifyContent: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(124,240,166,0.2)',
    borderWidth: 1,
    borderColor: '#7CF0A6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#7CF0A6',
    fontSize: 38,
    lineHeight: 42,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  name: {
    marginTop: 18,
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    lineHeight: 18,
  },
  ringing: {
    marginTop: 24,
    color: '#7CF0A6',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  footer: {
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 22,
  },
  actionBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    backgroundColor: '#E05353',
  },
  callBtn: {
    backgroundColor: '#7CF0A6',
  },
});

export default IncomingCallScreen;
