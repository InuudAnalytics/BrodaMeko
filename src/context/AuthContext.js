import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [role, setRole] = useState(null);

  const login = (nextRole) => {
    setRole(nextRole);
    setToken('mock-token');
    setIsAuthed(true);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setIsAuthed(false);
  };

  const value = useMemo(
    () => ({
      token,
      isAuthed,
      role,
      login,
      logout,
      setRole,
    }),
    [token, isAuthed, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
