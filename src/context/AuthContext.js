import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as loginService, signup as signupService } from '../services/auth.service';

const AuthContext = createContext(undefined);

const STORAGE_KEYS = {
  token: '@brodameko/token',
  user: '@brodameko/user',
  role: '@brodameko/role',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  const persistAuthState = async (nextToken, nextUser, nextRole) => {
    // Basic storage for mocked auth tokens.
    // For real production tokens, switch to secure storage.
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, nextToken || ''],
      [STORAGE_KEYS.user, JSON.stringify(nextUser || {})],
      [STORAGE_KEYS.role, nextRole || ''],
    ]);
  };

  const clearPersistedAuthState = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user, STORAGE_KEYS.role]);
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      setIsLoading(true);

      try {
        const [storedToken, storedUser, storedRole] = await AsyncStorage.multiGet([
          STORAGE_KEYS.token,
          STORAGE_KEYS.user,
          STORAGE_KEYS.role,
        ]);

        const nextToken = storedToken?.[1] || null;
        const nextRole = storedRole?.[1] || null;
        const userPayload = storedUser?.[1] ? JSON.parse(storedUser[1]) : null;

        if (nextToken) {
          setToken(nextToken);
          setRole(nextRole);
          setUser(userPayload);
        }
      } catch (bootstrapError) {
        setError('Failed to restore your session.');
        await clearPersistedAuthState();
        setToken(null);
        setUser(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const signIn = async ({ email, password }) => {
    setIsLoading(true);
    clearError();

    try {
      const response = await loginService({ email, password });

      setToken(response.token || null);
      setUser(response.user || null);
      setRole(response.role || null);

      await persistAuthState(response.token || '', response.user || null, response.role || '');

      return response;
    } catch (signInError) {
      setError(signInError?.message || 'Sign in failed.');
      await clearPersistedAuthState();
      setToken(null);
      setUser(null);
      setRole(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async ({ fullName, email, phone, password }) => {
    setIsLoading(true);
    clearError();

    try {
      const response = await signupService({
        name: fullName,
        email,
        phone,
        password,
      });

      setToken(response.token || null);
      setUser(response.user || null);
      setRole(response.role || null);

      await persistAuthState(response.token || '', response.user || null, response.role || '');

      return response;
    } catch (signUpError) {
      setError(signUpError?.message || 'Sign up failed.');
      await clearPersistedAuthState();
      setToken(null);
      setUser(null);
      setRole(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    clearError();

    try {
      await clearPersistedAuthState();
    } finally {
      setToken(null);
      setUser(null);
      setRole(null);
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
        error,
        signIn,
        signUp,
        signOut,
        clearError,
        // Backward-compatible aliases for older scaffold usage.
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
