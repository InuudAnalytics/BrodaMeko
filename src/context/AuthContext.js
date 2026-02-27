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
  hasSeenOnboarding: '@brodameko:hasSeenOnboarding',
  hasSeenRoleSelectionLegacy: '@brodameko:hasSeenRoleSelection',
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
    const {
      GoogleSignin,
      statusCodes,
    } = require('@react-native-google-signin/google-signin');
    return { GoogleSignin, statusCodes: statusCodes || GOOGLE_STATUS };
  } catch (error) {
    return null;
  }
};

const normalizeRole = value => {
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

  if (role === 'seller') {
    return ROLES.SPARE_PARTS_SELLER;
  }

  return null;
};

const normalizeUserShape = rawUser => {
  if (!rawUser || typeof rawUser !== 'object' || Array.isArray(rawUser)) {
    return null;
  }

  const avatarValue = rawUser?.avatar;
  const avatarUrl =
    typeof avatarValue === 'string'
      ? avatarValue
      : avatarValue && typeof avatarValue === 'object'
      ? String(
          avatarValue?.url ||
            avatarValue?.secure_url ||
            avatarValue?.avatar_url ||
            '',
        ).trim()
      : '';

  return {
    ...rawUser,
    ...(avatarUrl
      ? {
          avatar: avatarUrl,
          avatar_url: avatarUrl,
          avatarUrl,
          profile_photo: avatarUrl,
          profile_photo_url: avatarUrl,
          profile_picture: avatarUrl,
          image_url: avatarUrl,
          photo_url: avatarUrl,
        }
      : {}),
  };
};

const pickAuthPayload = payload => {
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

  const rootLooksLikeUser = Boolean(root?.id || root?.full_name || root?.email);
  const nestedLooksLikeUser = Boolean(
    nested?.id || nested?.full_name || nested?.email,
  );

  const rawUser =
    root?.user ||
    nested?.user ||
    payload?.user ||
    (rootLooksLikeUser ? root : null) ||
    (nestedLooksLikeUser ? nested : null) ||
    null;

  const user = normalizeUserShape(rawUser);
  const role = normalizeRole(
    user?.role || root?.role || nested?.role || payload?.role,
  );

  return { token, user, role };
};

const makeAuthResult = ({ ok, status, message }) => ({
  ok: Boolean(ok),
  status,
  message: message || '',
});

const parseStoredUser = rawUser => {
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
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
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

  const persistRoleSelection = async nextSelectedRole => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.selectedRole, nextSelectedRole || ''],
      [STORAGE_KEYS.hasSeenOnboarding, nextSelectedRole ? 'true' : 'false'],
      [
        STORAGE_KEYS.hasSeenRoleSelectionLegacy,
        nextSelectedRole ? 'true' : 'false',
      ],
    ]);
  };

  const clearPersistedAuthState = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.token,
      STORAGE_KEYS.user,
      STORAGE_KEYS.role,
    ]);
  };

  const setAuthedState = async ({ nextToken, nextUser, nextRole }) => {
    setToken(nextToken || null);
    setUser(nextUser || null);
    setRole(nextRole || null);
    await persistAuthState(nextToken || '', nextUser || null, nextRole || '');

    const normalizedNextRole = normalizeRole(nextRole);
    if (normalizedNextRole) {
      setSelectedRoleState(normalizedNextRole);
      setHasSeenOnboarding(true);
      await persistRoleSelection(normalizedNextRole);
    }
  };

  const updateUserData = async (updates = {}) => {
    const current = user && typeof user === 'object' ? user : {};
    const patch = updates && typeof updates === 'object' ? updates : {};
    const nextUser = { ...current, ...patch };

    setUser(nextUser);
    await persistAuthState(token || '', nextUser, role || '');
  };

  const refreshUserProfile = async (tokenOverride = null) => {
    const effectiveToken = String(tokenOverride || token || '').trim();

    if (!effectiveToken) {
      return null;
    }

    if (tokenOverride) {
      await AsyncStorage.setItem(STORAGE_KEYS.token, effectiveToken);
    }

    const me = await getCurrentUser();
    const mePayload = pickAuthPayload(me);
    const currentUser = user && typeof user === 'object' ? user : {};
    const incomingUser =
      mePayload.user && typeof mePayload.user === 'object'
        ? mePayload.user
        : null;
    const nextUser = incomingUser
      ? { ...currentUser, ...incomingUser }
      : Object.keys(currentUser).length
      ? currentUser
      : null;
    const nextRole = mePayload.role || role || null;

    setUser(nextUser);
    setRole(nextRole);
    await persistAuthState(effectiveToken, nextUser, nextRole || '');

    const normalizedNextRole = normalizeRole(nextRole);
    if (normalizedNextRole) {
      setSelectedRoleState(normalizedNextRole);
      setHasSeenOnboarding(true);
      await persistRoleSelection(normalizedNextRole);
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
        console.log(
          '[AuthContext] Device registration failed:',
          deviceError?.message || deviceError,
        );
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
        STORAGE_KEYS.hasSeenOnboarding,
        STORAGE_KEYS.hasSeenRoleSelectionLegacy,
      ]);
      const map = Object.fromEntries(entries);
      const nextToken = map?.[STORAGE_KEYS.token] || null;
      const storedUser = parseStoredUser(map?.[STORAGE_KEYS.user]);
      const storedRole = normalizeRole(map?.[STORAGE_KEYS.role]);
      const storedSelectedRole = normalizeRole(
        map?.[STORAGE_KEYS.selectedRole],
      );
      const seenOnboarding =
        String(
          map?.[STORAGE_KEYS.hasSeenOnboarding] ||
            map?.[STORAGE_KEYS.hasSeenRoleSelectionLegacy] ||
            '',
        ).toLowerCase() === 'true' || Boolean(storedSelectedRole);

      setSelectedRoleState(storedSelectedRole);
      setHasSeenOnboarding(seenOnboarding);

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
          setHasSeenOnboarding(true);
          await persistRoleSelection(normalizedNextRole);
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

  const setSelectedRole = async nextRoleValue => {
    const normalized = normalizeRole(nextRoleValue);

    if (!normalized) {
      return false;
    }

    setSelectedRoleState(normalized);
    setHasSeenOnboarding(true);
    await persistRoleSelection(normalized);
    return true;
  };

  const signUp = async ({
    fullName,
    email,
    phoneNumber,
    password,
    role: selectedRoleInput,
  }) => {
    setIsLoading(true);
    clearError();

    const normalizedSelectedRole = normalizeRole(selectedRoleInput || selectedRole);
    if (!normalizedSelectedRole) {
      setError('Invalid role selected. Please choose a role to continue.');
      setIsLoading(false);
      return makeAuthResult({
        ok: false,
        status: 'error',
        message: 'Invalid role selected.',
      });
    }
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
        setPendingVerification(null);
        setError(
          'Network error. Please check your connection and try again.',
        );
        return makeAuthResult({
          ok: false,
          status: 'error',
          message: 'Network error. Please try again.',
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
      const authPayload = pickAuthPayload(response);

      if (!authPayload.token) {
        throw new Error(
          'Verification succeeded but no token was returned. Please log in.',
        );
      }

      const nextRole = authPayload.role || pendingVerification?.role;
      if (!nextRole) {
        throw new Error('Role could not be determined. Please log in again.');
      }

      await setAuthedState({
        nextToken: authPayload.token,
        nextUser: authPayload.user,
        nextRole,
      });
      await refreshUserProfile(authPayload.token).catch(() => {});
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
        throw new Error(
          'No verification destination found. Please sign up again.',
        );
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

  const signIn = async ({
    email,
    phoneNumber,
    password,
    role: selectedRoleInput,
  }) => {
    setIsLoading(true);
    clearError();

    try {
      const response = await loginService({ email, phoneNumber, password });
      const authPayload = pickAuthPayload(response);

      if (!authPayload.token) {
        throw new Error('Login response did not include an auth token.');
      }

      const normalizedSelectedRole = normalizeRole(
        selectedRoleInput || selectedRole,
      );
      const nextRole = authPayload.role || normalizedSelectedRole;
      if (!nextRole) {
        throw new Error('Role could not be determined. Please select a role and try again.');
      }

      await setAuthedState({
        nextToken: authPayload.token,
        nextUser: authPayload.user,
        nextRole,
      });
      await refreshUserProfile(authPayload.token).catch(() => {});
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

      const normalizedSelectedRole = normalizeRole(selectedRoleInput || selectedRole);
      if (!normalizedSelectedRole) {
        throw new Error('Role could not be determined. Please select a role and try again.');
      }
      const response = await googleLoginService({
        idToken,
        role: normalizedSelectedRole,
      });

      const authPayload = pickAuthPayload(response);

      if (!authPayload.token) {
        throw new Error(
          'Google login succeeded but no app token was returned.',
        );
      }

      await setAuthedState({
        nextToken: authPayload.token,
        nextUser: authPayload.user,
        nextRole: authPayload.role || normalizedSelectedRole,
      });
      await refreshUserProfile(authPayload.token).catch(() => {});
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
      const statusCode = Number(forgotError?.statusCode || 0);
      if (statusCode === 401) {
        setError(
          'Could not send reset OTP. Please verify the email/phone and try again.',
        );
      } else {
        setError(forgotError?.message || 'Failed to send reset OTP.');
      }
      return false;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const resetPasswordWithOtp = async ({
    email,
    phoneNumber,
    otp,
    newPassword,
    confirmPassword,
  }) => {
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

      await clearPersistedAuthState();
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.selectedRole, currentSelectedRole || ''],
        [STORAGE_KEYS.hasSeenOnboarding, 'true'],
        [STORAGE_KEYS.hasSeenRoleSelectionLegacy, 'true'],
      ]);
      setToken(null);
      setUser(null);
      setRole(null);
      setSelectedRoleState(currentSelectedRole);
      setHasSeenOnboarding(true);
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
        hasSeenOnboarding,
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
