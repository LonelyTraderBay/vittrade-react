import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ThemeContext } from './theme-context';
import type { ThemeMode } from './theme-context';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(t);
  }, []);

  // Apply initial theme class on mount
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
