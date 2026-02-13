import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { MOCK_FCM_TOKEN, getMockDeviceType } from '../config/mockDevice';
import {
  forgotPassword as forgotPasswordService,
  getCurrentUser,
  login as loginService,
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

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [error, setError] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null);

  const clearError = () => setError(null);

  const persistAuthState = async (nextToken, nextUser, nextRole) => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, nextToken || ''],
      [STORAGE_KEYS.user, JSON.stringify(nextUser || {})],
      [STORAGE_KEYS.role, nextRole || ''],
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

  useEffect(() => {
    const bootstrapAuth = async () => {
      setIsLoading(true);

      try {
        const [storedToken] = await AsyncStorage.multiGet([STORAGE_KEYS.token]);
        const nextToken = storedToken?.[1] || null;

        if (!nextToken) {
          setToken(null);
          setUser(null);
          setRole(null);
          return;
        }

        setToken(nextToken);

        const me = await getCurrentUser();
        const mePayload = pickAuthPayload(me);

        const nextUser = mePayload.user || null;
        const nextRole = mePayload.role || null;

        setUser(nextUser);
        setRole(nextRole);

        await persistAuthState(nextToken, nextUser, nextRole || '');
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

    bootstrapAuth();
  }, []);

  const signUp = async ({ fullName, email, phoneNumber, password, role: selectedRole }) => {
    setIsLoading(true);
    clearError();

    const pendingData = {
      method: email ? 'email' : 'phone',
      email: email || '',
      phoneNumber: phoneNumber || '',
      role: selectedRole || ROLES.CAR_OWNER,
    };

    try {
      await signupService({
        fullName,
        email,
        phoneNumber,
        password,
        role: selectedRole,
      });

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
        // Backend may still create the account/send OTP even when client times out.
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

  const signIn = async ({ email, phoneNumber, password }) => {
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

      if (!nextUser || !nextRole) {
        const me = await getCurrentUser();
        const mePayload = pickAuthPayload(me);
        nextUser = nextUser || mePayload.user;
        nextRole = nextRole || mePayload.role;
      }

      await setAuthedState({
        nextToken: authPayload.token,
        nextUser,
        nextRole: nextRole || ROLES.CAR_OWNER,
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
      await clearPersistedAuthState();
      setToken(null);
      setUser(null);
      setRole(null);
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
        isLoading,
        isBootstrapped,
        error,
        pendingVerification,
        signIn,
        signUp,
        verifyOtp,
        resendOtp,
        requestPasswordReset,
        resetPasswordWithOtp,
        updatePassword,
        signOut,
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

