import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import { GOOGLE_CONFIG } from '../config/google';
import { MOCK_FCM_TOKEN, getMockDeviceType } from '../config/mockDevice';
import {
  forgotPassword as forgotPasswordService,
  getCurrentUser,
  login as loginService,
  googleLogin as googleLoginService,
  logout as logoutService,
  resendOtp as resendOtpService,
  resetPassword as resetPasswordService,
  signup as signupService,
  updatePassword as updatePasswordService,
  verifyOtp as verifyOtpService,
} from '../services/auth.service';
import { registerDevice as registerDeviceService } from '../services/device.service';
import { TOKEN_STORAGE_KEY } from '../services/api';
import { ROLES } from '../utils';

const AuthContext = createContext(undefined);

const STORAGE_KEYS = {
  token: TOKEN_STORAGE_KEY,
  user: '@brodameko/user',
  role: '@brodameko/role',
  selectedRole: '@brodameko:selectedRole',
  hasSeenRoleSelection: '@brodameko:hasSeenRoleSelection',
  skipRoleSelectionOnNextLaunch: '@brodameko:skipRoleSelectionOnNextLaunch',
};

const GOOGLE_STATUS = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

const getGoogleSigninClient = () => {
  if (!NativeModules?.RNGoogleSignin) {
    return null;
  }

  try {
    // Lazy load to avoid crashing app startup when native module is not linked yet.
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
    return { GoogleSignin, statusCodes: statusCodes || GOOGLE_STATUS };
  } catch (error) {
    return null;
  }
};

const normalizeRole = (value) => {
  const role = String(value || '').toLowerCase();

  if (role === 'mechanic' || role === 'mech') {
    return ROLES.MECH;
  }

  if (role === 'admin') {
    return ROLES.ADMIN;
  }

  if (role === 'car_owner' || role === 'carowner' || role === 'user') {
    return ROLES.CAR_OWNER;
  }

  return null;
};

const pickAuthPayload = (payload) => {
  const root = payload?.data || payload || {};
  const nested = root?.data || {};
  const token =
    root?.token ||
    root?.access_token ||
    nested?.token ||
    nested?.access_token ||
    payload?.token ||
    payload?.access_token ||
    null;

  const user = root?.user || nested?.user || payload?.user || null;
  const role = normalizeRole(user?.role || root?.role || nested?.role || payload?.role);

  return { token, user, role };
};

const makeAuthResult = ({ ok, status, message }) => ({
  ok: Boolean(ok),
  status,
  message: message || '',
});

const parseStoredUser = (rawUser) => {
  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser);

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return Object.keys(parsed).length ? parsed : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [selectedRole, setSelectedRoleState] = useState(null);
  const [hasSeenRoleSelection, setHasSeenRoleSelection] = useState(false);
  const [skipRoleSelectionOnNextLaunch, setSkipRoleSelectionOnNextLaunch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [error, setError] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null);

  const clearError = () => setError(null);

  useEffect(() => {
    const googleClient = getGoogleSigninClient();

    if (!googleClient?.GoogleSignin) {
      return;
    }

    googleClient.GoogleSignin.configure({
      webClientId: GOOGLE_CONFIG.webClientId,
      offlineAccess: GOOGLE_CONFIG.offlineAccess,
      forceCodeForRefreshToken: GOOGLE_CONFIG.forceCodeForRefreshToken,
    });
  }, []);

  const persistAuthState = async (nextToken, nextUser, nextRole) => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, nextToken || ''],
      [STORAGE_KEYS.user, JSON.stringify(nextUser || {})],
      [STORAGE_KEYS.role, nextRole || ''],
    ]);
  };

  const persistRoleSelection = async (nextSelectedRole, { skip = false } = {}) => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.selectedRole, nextSelectedRole || ''],
      [STORAGE_KEYS.hasSeenRoleSelection, nextSelectedRole ? 'true' : 'false'],
      [STORAGE_KEYS.skipRoleSelectionOnNextLaunch, skip ? 'true' : 'false'],
    ]);
  };

  const clearPersistedAuthState = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user, STORAGE_KEYS.role]);
  };

  const setAuthedState = async ({ nextToken, nextUser, nextRole }) => {
    setToken(nextToken || null);
    setUser(nextUser || null);
    setRole(nextRole || null);
    await persistAuthState(nextToken || '', nextUser || null, nextRole || '');

    const normalizedNextRole = normalizeRole(nextRole);
    if (normalizedNextRole) {
      setSelectedRoleState(normalizedNextRole);
      setHasSeenRoleSelection(true);
      setSkipRoleSelectionOnNextLaunch(false);
      await persistRoleSelection(normalizedNextRole, { skip: false });
    }
  };

  const updateUserData = async (updates = {}) => {
    const current = user && typeof user === 'object' ? user : {};
    const patch = updates && typeof updates === 'object' ? updates : {};
    const nextUser = { ...current, ...patch };

    setUser(nextUser);
    await persistAuthState(token || '', nextUser, role || '');
  };

  const refreshUserProfile = async () => {
    if (!token) {
      return null;
    }

    const me = await getCurrentUser();
    const mePayload = pickAuthPayload(me);
    const nextUser = mePayload.user || user || null;
    const nextRole = mePayload.role || role || null;

    setUser(nextUser);
    setRole(nextRole);
    await persistAuthState(token || '', nextUser, nextRole || '');

    const normalizedNextRole = normalizeRole(nextRole);
    if (normalizedNextRole) {
      setSelectedRoleState(normalizedNextRole);
      setHasSeenRoleSelection(true);
      await persistRoleSelection(normalizedNextRole, { skip: skipRoleSelectionOnNextLaunch });
    }
    return nextUser;
  };

  const registerCurrentDevice = async () => {
    const fcmToken = String(MOCK_FCM_TOKEN || '').trim();

    if (!fcmToken) {
      return;
    }

    try {
      await registerDeviceService({
        fcm_token: fcmToken,
        device_type: getMockDeviceType(),
      });
    } catch (deviceError) {
      if (__DEV__) {
        // Non-blocking registration: auth flow should continue even when this fails.
        console.log('[AuthContext] Device registration failed:', deviceError?.message || deviceError);
      }
    }
  };

  const bootstrapAuth = async () => {
    setIsLoading(true);

    try {
      const entries = await AsyncStorage.multiGet([
        STORAGE_KEYS.token,
        STORAGE_KEYS.user,
        STORAGE_KEYS.role,
        STORAGE_KEYS.selectedRole,
        STORAGE_KEYS.hasSeenRoleSelection,
        STORAGE_KEYS.skipRoleSelectionOnNextLaunch,
      ]);
      const map = Object.fromEntries(entries);
      const nextToken = map?.[STORAGE_KEYS.token] || null;
      const storedUser = parseStoredUser(map?.[STORAGE_KEYS.user]);
      const storedRole = normalizeRole(map?.[STORAGE_KEYS.role]);
      const storedSelectedRole = normalizeRole(map?.[STORAGE_KEYS.selectedRole]);
      const seenRoleSelection =
        String(map?.[STORAGE_KEYS.hasSeenRoleSelection] || '').toLowerCase() === 'true' || Boolean(storedSelectedRole);
      const skipRoleSelection =
        String(map?.[STORAGE_KEYS.skipRoleSelectionOnNextLaunch] || '').toLowerCase() === 'true';

      setSelectedRoleState(storedSelectedRole);
      setHasSeenRoleSelection(seenRoleSelection);
      setSkipRoleSelectionOnNextLaunch(skipRoleSelection);

      if (!nextToken) {
        setToken(null);
        setUser(null);
        setRole(null);
        return;
      }

      setToken(nextToken);
      setUser(storedUser);
      setRole(storedRole);

      try {
        const me = await getCurrentUser();
        const mePayload = pickAuthPayload(me);

        const nextUser = mePayload.user || storedUser || null;
        const nextRole = mePayload.role || storedRole || null;

        setUser(nextUser);
        setRole(nextRole);
        await persistAuthState(nextToken, nextUser, nextRole || '');

        const normalizedNextRole = normalizeRole(nextRole);
        if (normalizedNextRole) {
          setSelectedRoleState(normalizedNextRole);
          setHasSeenRoleSelection(true);
          setSkipRoleSelectionOnNextLaunch(false);
          await persistRoleSelection(normalizedNextRole, { skip: false });
        }
      } catch (meError) {
        const isUnauthorized = Number(meError?.statusCode || 0) === 401;

        if (isUnauthorized) {
          throw meError;
        }

        await persistAuthState(nextToken, storedUser, storedRole || '');
      }
    } catch (bootstrapError) {
      setError(bootstrapError?.message || 'Failed to restore your session.');
      await clearPersistedAuthState();
      setToken(null);
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  useEffect(() => {
    const runBootstrap = async () => {
      await bootstrapAuth();
    };

    runBootstrap();
    // Bootstrap should run once on provider mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSelectedRole = async (nextRoleValue) => {
    const normalized = normalizeRole(nextRoleValue);

    if (!normalized) {
      return false;
    }

    setSelectedRoleState(normalized);
    setHasSeenRoleSelection(true);
    setSkipRoleSelectionOnNextLaunch(false);
    await persistRoleSelection(normalized, { skip: false });
    return true;
  };

  const clearSkipRoleSelection = async () => {
    setSkipRoleSelectionOnNextLaunch(false);
    await AsyncStorage.setItem(STORAGE_KEYS.skipRoleSelectionOnNextLaunch, 'false');
  };

  const signUp = async ({ fullName, email, phoneNumber, password, role: selectedRoleInput }) => {
    setIsLoading(true);
    clearError();

    const normalizedSelectedRole = normalizeRole(selectedRoleInput || selectedRole || ROLES.CAR_OWNER) || ROLES.CAR_OWNER;
    const pendingData = {
      method: email ? 'email' : 'phone',
      email: email || '',
      phoneNumber: phoneNumber || '',
      role: normalizedSelectedRole,
    };

    try {
      await signupService({
        fullName,
        email,
        phoneNumber,
        password,
        role: normalizedSelectedRole,
      });

      await setSelectedRole(normalizedSelectedRole);
      setPendingVerification(pendingData);

      return makeAuthResult({
        ok: true,
        status: 'success',
        message: 'Sign up successful. OTP sent.',
      });
    } catch (signUpError) {
      const normalizedMessage = signUpError?.message || 'Sign up failed.';
      const isTransportFailure = Number(signUpError?.statusCode || 0) === 0;

      if (isTransportFailure) {
        setPendingVerification(pendingData);
        setError('Could not confirm sign up due to network issues. If you received OTP, continue verification.');
        return makeAuthResult({
          ok: false,
          status: 'uncertain',
          message: 'Could not confirm sign up. If OTP was sent, continue to verification.',
        });
      }

      setError(normalizedMessage);
      return makeAuthResult({
        ok: false,
        status: 'error',
        message: normalizedMessage,
      });
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const verifyOtp = async ({ otp }) => {
    setIsLoading(true);
    clearError();

    try {
      const response = await verifyOtpService({ otp });
      let authPayload = pickAuthPayload(response);

      if (!authPayload.token || !authPayload.user) {
        const me = await getCurrentUser();
        const mePayload = pickAuthPayload(me);
        authPayload = {
          token: authPayload.token,
          user: authPayload.user || mePayload.user,
          role: authPayload.role || mePayload.role,
        };
      }

      if (!authPayload.token) {
        throw new Error('Verification succeeded but no token was returned. Please log in.');
      }

      await setAuthedState({
        nextToken: authPayload.token,
        nextUser: authPayload.user,
        nextRole: authPayload.role || pendingVerification?.role || ROLES.CAR_OWNER,
      });
      registerCurrentDevice();

      setPendingVerification(null);
      return true;
    } catch (verifyError) {
      setError(verifyError?.message || 'OTP verification failed.');
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    clearError();

    try {
      if (!pendingVerification?.email && !pendingVerification?.phoneNumber) {
        throw new Error('No verification destination found. Please sign up again.');
      }

      await resendOtpService({
        email: pendingVerification?.email,
        phoneNumber: pendingVerification?.phoneNumber,
      });

      return true;
    } catch (resendError) {
      setError(resendError?.message || 'Failed to resend OTP.');
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const signIn = async ({ email, phoneNumber, password, role: selectedRoleInput }) => {
    setIsLoading(true);
    clearError();

    try {
      const response = await loginService({ email, phoneNumber, password });
      const authPayload = pickAuthPayload(response);

      if (!authPayload.token) {
        throw new Error('Login response did not include an auth token.');
      }

      let nextUser = authPayload.user;
      let nextRole = authPayload.role;
      const normalizedSelectedRole = normalizeRole(selectedRoleInput || selectedRole);

      if (!nextUser || !nextRole) {
        const me = await getCurrentUser();
        const mePayload = pickAuthPayload(me);
        nextUser = nextUser || mePayload.user;
        nextRole = nextRole || mePayload.role;
      }

      await setAuthedState({
        nextToken: authPayload.token,
        nextUser,
        nextRole: nextRole || normalizedSelectedRole || ROLES.CAR_OWNER,
      });
      registerCurrentDevice();

      return true;
    } catch (signInError) {
      setError(signInError?.message || 'Invalid credentials.');
      await clearPersistedAuthState();
      setToken(null);
      setUser(null);
      setRole(null);
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const signInWithGoogle = async ({ role: selectedRoleInput }) => {
    setIsLoading(true);
    clearError();

    try {
      const googleClient = getGoogleSigninClient();

      if (!googleClient?.GoogleSignin) {
        throw new Error('Google Sign-In is not available in this build yet.');
      }

      const { GoogleSignin } = googleClient;

      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();

      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('Failed to get Google ID token.');
      }

      const normalizedSelectedRole = normalizeRole(selectedRoleInput || selectedRole || ROLES.CAR_OWNER) || ROLES.CAR_OWNER;
      const response = await googleLoginService({
        idToken,
        role: normalizedSelectedRole
      });

      const authPayload = pickAuthPayload(response);

      if (!authPayload.token) {
        throw new Error('Google login succeeded but no app token was returned.');
      }

      await setAuthedState({
        nextToken: authPayload.token,
        nextUser: authPayload.user,
        nextRole: authPayload.role || normalizedSelectedRole || ROLES.CAR_OWNER,
      });
      registerCurrentDevice();

      return true;
    } catch (googleError) {
      const statusCodes = getGoogleSigninClient()?.statusCodes || GOOGLE_STATUS;
      let errorMessage = 'Google Sign-In failed.';

      if (googleError.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign in cancelled.';
      } else if (googleError.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign in is in progress.';
      } else if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Play services not available.';
      } else {
        errorMessage = googleError.message || errorMessage;
      }

      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const requestPasswordReset = async ({ email, phoneNumber }) => {
    setIsLoading(true);
    clearError();

    try {
      await forgotPasswordService({ email, phoneNumber });
      return true;
    } catch (forgotError) {
      setError(forgotError?.message || 'Failed to send reset OTP.');
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const resetPasswordWithOtp = async ({ email, phoneNumber, otp, newPassword, confirmPassword }) => {
    setIsLoading(true);
    clearError();

    try {
      await resetPasswordService({
        email,
        phoneNumber,
        otp,
        newPassword,
        confirmPassword,
      });

      return true;
    } catch (resetError) {
      setError(resetError?.message || 'Password reset failed.');
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const updatePassword = async ({ currentPassword, newPassword }) => {
    setIsLoading(true);
    clearError();

    try {
      await updatePasswordService({ currentPassword, newPassword });
      return true;
    } catch (updateError) {
      setError(updateError?.message || 'Failed to update password.');
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    clearError();

    try {
      await logoutService();
    } catch (logoutError) {
      // Even when API logout fails, clear local auth state.
    } finally {
      const currentSelectedRole = normalizeRole(selectedRole) || null;
      const hasSelectedRole = Boolean(currentSelectedRole);

      await clearPersistedAuthState();
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.skipRoleSelectionOnNextLaunch, 'true'],
        [STORAGE_KEYS.selectedRole, currentSelectedRole || ''],
        [STORAGE_KEYS.hasSeenRoleSelection, hasSelectedRole ? 'true' : 'false'],
      ]);
      setToken(null);
      setUser(null);
      setRole(null);
      setSelectedRoleState(currentSelectedRole);
      setHasSeenRoleSelection(hasSelectedRole);
      setSkipRoleSelectionOnNextLaunch(true);
      setPendingVerification(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        selectedRole,
        hasSeenRoleSelection,
        skipRoleSelectionOnNextLaunch,
        isLoading,
        isBootstrapped,
        error,
        pendingVerification,
        signIn,
        signInWithGoogle,
        signUp,
        verifyOtp,
        resendOtp,
        requestPasswordReset,
        resetPasswordWithOtp,
        updatePassword,
        signOut,
        setSelectedRole,
        clearSkipRoleSelection,
        bootstrapAuth,
        updateUserData,
        refreshUserProfile,
        clearError,
        login: signIn,
        logout: signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

