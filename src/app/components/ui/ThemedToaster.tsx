import React from 'react';
import { Toaster } from 'sonner';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ══════════════════════════════════════════════════════════
 *  ThemedToaster — Sonner Toaster with dynamic Light/Dark theme
 * ══════════════════════════════════════════════════════════
 *  Reads CSS variables via useThemeColors() and applies them
 *  as inline styles on the Toaster. Replaces hardcoded dark
 *  colors previously in RootLayout.
 *
 *  Light mode → white surface, dark text, subtle shadow
 *  Dark mode  → dark surface, light text, deep shadow
 */
export function ThemedToaster() {
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Toaster
      position="top-center"
      theme={isDark ? 'dark' : 'light'}
      toastOptions={{
        style: {
          background: c.surface,
          border: `1px solid ${c.cardBorder}`,
          color: c.text1,
          fontSize: 13,
          borderRadius: 14,
          maxWidth: 340,
          padding: '10px 16px',
          boxShadow: c.cardShadow,
          zIndex: 99999,
        },
        classNames: {
          success: 'themed-toast-success',
          error: 'themed-toast-error',
          warning: 'themed-toast-warning',
        },
      }}
      richColors
      offset={16}
      style={{ zIndex: 99999 }}
      containerAriaLabel="Thông báo"
    />
  );
}
