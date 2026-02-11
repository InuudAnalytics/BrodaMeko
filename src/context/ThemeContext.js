import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkTheme } from '../theme';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  const toggleTheme = () => {
    // Stub for future multi-theme support.
    setMode((prevMode) => (prevMode === 'dark' ? 'dark' : 'dark'));
  };

  const value = useMemo(
    () => ({
      mode,
      theme: darkTheme,
      toggleTheme,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
