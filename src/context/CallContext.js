import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { getCall, getCallToken } from '../services/calls.service';

const CallContext = createContext(undefined);

const toSafeString = (value) => String(value || '').trim();

const buildUserProfile = (payload = {}) => ({
  id: toSafeString(payload?.id),
  name: toSafeString(payload?.full_name || payload?.name || 'User'),
  image: toSafeString(payload?.avatar_url || payload?.image || ''),
  role: toSafeString(payload?.role || ''),
});

const callTypeFromDetails = (details = {}) =>
  toSafeString(details?.provider_call_type || details?.call_type || 'audio_room') || 'audio_room';

const callProviderIdFromDetails = (details = {}) =>
  toSafeString(details?.provider_call_id || details?.stream_call_id || details?.id || '');

export const CallProvider = ({ children }) => {
  const clientRef = useRef(null);
  const clientUserIdRef = useRef('');
  const activeCallRef = useRef(null);
  const [activeCallSession, setActiveCallSession] = useState(null);
  const [joiningCall, setJoiningCall] = useState(false);
  const [callError, setCallError] = useState('');
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);

  const resetActiveCallState = useCallback(() => {
    activeCallRef.current = null;
    setActiveCallSession(null);
    setMicrophoneEnabled(true);
  }, []);

  const getOrCreateClient = useCallback(async ({ apiKey, token, user }) => {
    const safeApiKey = toSafeString(apiKey);
    const safeToken = toSafeString(token);
    const safeUserId = toSafeString(user?.id);

    if (!safeApiKey || !safeToken || !safeUserId) {
      throw new Error('Call token payload is incomplete.');
    }

    if (clientRef.current && clientUserIdRef.current === safeUserId) {
      return clientRef.current;
    }

    if (clientRef.current && clientUserIdRef.current && clientUserIdRef.current !== safeUserId) {
      await clientRef.current.disconnectUser();
      clientRef.current = null;
      clientUserIdRef.current = '';
    }

    const client = new StreamVideoClient({
      apiKey: safeApiKey,
      user: {
        id: safeUserId,
        name: toSafeString(user?.name || 'User'),
        image: toSafeString(user?.image || ''),
      },
      token: safeToken,
    });

    clientRef.current = client;
    clientUserIdRef.current = safeUserId;
    return client;
  }, []);

  const joinCallById = useCallback(async (callId) => {
    const safeCallId = toSafeString(callId);
    if (!safeCallId) {
      throw new Error('callId is required.');
    }

    setJoiningCall(true);
    setCallError('');

    try {
      const [callDetailsResponse, callTokenResponse] = await Promise.all([
        getCall(safeCallId),
        getCallToken({ call_id: safeCallId }),
      ]);

      const details = callDetailsResponse?.data || {};
      const tokenPayload = callTokenResponse?.data || {};
      const user = buildUserProfile(tokenPayload?.user || {});
      const apiKey = toSafeString(tokenPayload?.api_key);
      const token = toSafeString(tokenPayload?.token);
      const providerCallType = callTypeFromDetails(details);
      const providerCallId = callProviderIdFromDetails(details);

      if (!providerCallId) {
        throw new Error('Provider call identifier is missing.');
      }

      const client = await getOrCreateClient({ apiKey, token, user });
      const call = client.call(providerCallType, providerCallId, { reuseInstance: true });

      await call.join({
        create: false,
        audio: true,
        video: false,
      });

      try {
        await call.camera.disable(true);
      } catch {
        // Keep call active even if camera state cannot be forced off.
      }

      activeCallRef.current = call;
      setMicrophoneEnabled(Boolean(call?.microphone?.enabled ?? true));
      setActiveCallSession({
        callId: safeCallId,
        providerCallType,
        providerCallId,
        state: toSafeString(details?.state || 'accepted'),
      });
      return {
        call,
        details,
      };
    } catch (error) {
      const message = String(error?.message || 'Could not join call.');
      setCallError(message);
      throw error;
    } finally {
      setJoiningCall(false);
    }
  }, [getOrCreateClient]);

  const leaveActiveCall = useCallback(async () => {
    const activeCall = activeCallRef.current;
    if (activeCall) {
      try {
        await activeCall.leave();
      } catch {
        // Swallow leave errors to avoid blocking UI teardown.
      }
    }
    resetActiveCallState();
  }, [resetActiveCallState]);

  const setMicrophoneMute = useCallback(async (shouldMute) => {
    const activeCall = activeCallRef.current;
    if (!activeCall?.microphone) {
      return;
    }
    try {
      if (shouldMute) {
        await activeCall.microphone.disable();
      } else {
        await activeCall.microphone.enable();
      }
      setMicrophoneEnabled(Boolean(activeCall?.microphone?.enabled ?? !shouldMute));
    } catch {
      setMicrophoneEnabled((prev) => prev);
    }
  }, []);

  const toggleMicrophone = useCallback(async () => {
    const activeCall = activeCallRef.current;
    if (!activeCall?.microphone) {
      return false;
    }
    try {
      await activeCall.microphone.toggle();
      const next = Boolean(activeCall?.microphone?.enabled ?? false);
      setMicrophoneEnabled(next);
      return next;
    } catch {
      return microphoneEnabled;
    }
  }, [microphoneEnabled]);

  const disconnectClient = useCallback(async () => {
    await leaveActiveCall();
    if (clientRef.current) {
      try {
        await clientRef.current.disconnectUser();
      } catch {
        // no-op
      }
      clientRef.current = null;
      clientUserIdRef.current = '';
    }
  }, [leaveActiveCall]);

  const value = useMemo(() => ({
    activeCallSession,
    joiningCall,
    callError,
    microphoneEnabled,
    joinCallById,
    leaveActiveCall,
    toggleMicrophone,
    setMicrophoneMute,
    disconnectClient,
  }), [
    activeCallSession,
    joiningCall,
    callError,
    microphoneEnabled,
    joinCallById,
    leaveActiveCall,
    toggleMicrophone,
    setMicrophoneMute,
    disconnectClient,
  ]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCallSession = () => {
  const context = useContext(CallContext);
  if (!context) {
    if (__DEV__) {
      console.warn('[Call] useCallSession called outside CallProvider.');
    }
    return {
      activeCallSession: null,
      joiningCall: false,
      callError: 'Call provider unavailable',
      microphoneEnabled: true,
      joinCallById: async () => {
        throw new Error('Call provider unavailable');
      },
      leaveActiveCall: async () => {},
      toggleMicrophone: async () => true,
      setMicrophoneMute: async () => {},
      disconnectClient: async () => {},
    };
  }
  return context;
};

export default CallContext;
