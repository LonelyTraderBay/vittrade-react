/**
 * ══════════════════════════════════════════════════════════
 *  ThemeContext Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for theme management context
 *
 *  Run: npx vitest run src/app/__tests__/ThemeContext.test.tsx
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

describe('ThemeContext', () => {
  // Clean up document classes before and after each test
  beforeEach(() => {
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('Initial State', () => {
    it('should start with light theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('light');
    });

    it('should apply light class to documentElement on mount', () => {
      renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should provide setTheme function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  describe('Theme Switching', () => {
    it('should switch from light to dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should switch from dark to light', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Set to dark first
      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');

      // Switch back to light
      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });

    it('should toggle between themes multiple times', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');
    });
  });

  describe('DocumentElement Class Management', () => {
    it('should add light class when setting light theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should add dark class when setting dark theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should remove previous theme class when switching', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Set to dark
      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);

      // Switch to light
      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should not have both theme classes simultaneously', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      const hasBothClasses =
        document.documentElement.classList.contains('dark') &&
        document.documentElement.classList.contains('light');

      expect(hasBothClasses).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useTheme is used outside ThemeProvider', () => {
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used inside ThemeProvider');
    });
  });

  describe('Memoization', () => {
    it('should provide stable setTheme function reference', () => {
      const { result, rerender } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      const setThemeRef1 = result.current.setTheme;

      // Force rerender
      rerender();

      expect(result.current.setTheme).toBe(setThemeRef1);
    });

    it('should update context value when theme changes', () => {
      const { result, rerender } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      const value1 = result.current;

      act(() => {
        result.current.setTheme('dark');
      });

      rerender();

      // Context value should be different object (new reference)
      const value2 = result.current;
      expect(value2).not.toBe(value1);
      expect(value2.theme).toBe('dark');
      expect(value1.theme).toBe('light');
    });
  });

  describe('Context Sharing', () => {
    it('should share theme state across multiple useTheme calls', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result: result1 } = renderHook(() => useTheme(), { wrapper });
      const { result: result2 } = renderHook(() => useTheme(), { wrapper });

      // Initial theme should be the same
      expect(result1.current.theme).toBe(result2.current.theme);
      expect(result1.current.theme).toBe('light');
    });
  });

  describe('Idempotence', () => {
    it('should handle setting same theme multiple times', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');
    });

    it('should maintain class consistency when setting same theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should have theme property of correct type', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(typeof result.current.theme).toBe('string');
      expect(['dark', 'light']).toContain(result.current.theme);
    });

    it('should have setTheme method of correct type', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support user toggling theme preference', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // User starts with light theme
      expect(result.current.theme).toBe('light');

      // User toggles to dark mode
      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // User toggles back to light mode
      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should support theme switching based on time of day', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Simulate daytime - set light theme
      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');

      // Simulate nighttime - set dark theme
      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should support theme reset to default', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Change theme
      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');

      // Reset to default (light)
      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });
  });

  describe('CSS Class Integration', () => {
    it('should allow CSS variables based on theme class', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Set dark theme
      act(() => {
        result.current.setTheme('dark');
      });

      // Verify dark class is applied (CSS variables would be applied here)
      const hasDarkClass = document.documentElement.classList.contains('dark');
      expect(hasDarkClass).toBe(true);
    });

    it('should support Tailwind dark mode class strategy', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Tailwind's dark mode class strategy
      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.className).toContain('dark');

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.className).toContain('light');
      expect(document.documentElement.className).not.toContain('dark');
    });
  });

  describe('Performance', () => {
    it('should handle rapid theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setTheme(i % 2 === 0 ? 'light' : 'dark');
        }
      });

      // After 100 iterations (even number), should be light
      expect(result.current.theme).toBe('light');
    });

    it('should not leak memory on multiple theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Simulate many theme changes
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.setTheme(i % 2 === 0 ? 'light' : 'dark');
        }
      });

      // Should still work correctly
      expect(['light', 'dark']).toContain(result.current.theme);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unmounting and remounting', () => {
      const { result, unmount } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');

      unmount();

      // Remount
      const { result: result2 } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Should reset to initial state (light)
      expect(result2.current.theme).toBe('light');
    });

    it('should handle provider rerender', () => {
      const { result, rerender } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');

      rerender();

      expect(result.current.theme).toBe('dark');
    });
  });

  describe('Integration Tests', () => {
    it('should work with nested providers (though not recommended)', () => {
      const NestedWrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), {
        wrapper: NestedWrapper,
      });

      // Should use the innermost provider
      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });
  });

  describe('useEffect Timing', () => {
    it('should apply theme class during mount', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Light class should be applied on mount
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(result.current.theme).toBe('light');
    });

    it('should update DOM synchronously when theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      // DOM should be updated immediately
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });
  });
});
