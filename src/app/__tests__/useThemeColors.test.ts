/**
 * ══════════════════════════════════════════════════════════
 *  useThemeColors Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for theme colors hook
 *
 *  Run: npx vitest run src/app/__tests__/useThemeColors.test.ts
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThemeColors } from '../hooks/useThemeColors';

describe('useThemeColors', () => {
  describe('Return Value', () => {
    it('should return color tokens object', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('object');
    });

    it('should return consistent reference on re-render', () => {
      const { result, rerender } = renderHook(() => useThemeColors());

      const colors1 = result.current;

      rerender();

      const colors2 = result.current;

      expect(colors2).toBe(colors1);
    });
  });

  describe('Base Tokens', () => {
    it('should provide bg token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.bg).toBe('var(--tr-bg)');
    });

    it('should provide surface tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.surface).toBe('var(--tr-surface)');
      expect(result.current.surface2).toBe('var(--tr-surface-2)');
      expect(result.current.surface3).toBe('var(--tr-surface-3)');
    });

    it('should provide border tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.border).toBe('var(--tr-border)');
      expect(result.current.borderSolid).toBe('var(--tr-border-solid)');
    });

    it('should provide primary color token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.primary).toBe('var(--tr-primary)');
    });

    it('should provide buy/sell tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.buy).toBe('var(--tr-buy)');
      expect(result.current.sell).toBe('var(--tr-sell)');
    });

    it('should provide warning token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.warn).toBe('var(--tr-warn)');
    });
  });

  describe('Text Tokens', () => {
    it('should provide text hierarchy tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.text1).toBe('var(--tr-text-1)');
      expect(result.current.text2).toBe('var(--tr-text-2)');
      expect(result.current.text3).toBe('var(--tr-text-3)');
    });
  });

  describe('Chip/Tab Tokens', () => {
    it('should provide chip active tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.chipActiveBg).toBe('var(--tr-chip-active-bg)');
      expect(result.current.chipActiveText).toBe('var(--tr-chip-active-text)');
      expect(result.current.chipActiveBorder).toBe('var(--tr-chip-active-border)');
    });

    it('should provide chip inactive tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.chipBg).toBe('var(--tr-chip-bg)');
      expect(result.current.chipText).toBe('var(--tr-chip-text)');
      expect(result.current.chipBorder).toBe('var(--tr-chip-border)');
    });
  });

  describe('StatusBar Tokens', () => {
    it('should provide status bar tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.statusBarText).toBe('var(--tr-status-bar-text)');
      expect(result.current.statusBarIcon).toBe('var(--tr-status-bar-icon)');
      expect(result.current.statusBarIconDim).toBe('var(--tr-status-bar-icon-dim)');
      expect(result.current.statusBarBattery).toBe('var(--tr-status-bar-battery)');
    });
  });

  describe('BottomNav Tokens', () => {
    it('should provide nav background and border tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.navBg).toBe('var(--tr-nav-bg)');
      expect(result.current.navBorder).toBe('var(--tr-nav-border)');
    });

    it('should provide nav state tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.navInactive).toBe('var(--tr-nav-inactive)');
      expect(result.current.navActive).toBe('var(--tr-nav-active)');
    });

    it('should provide nav center button tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.navCenterBg).toBe('var(--tr-nav-center-bg)');
      expect(result.current.navCenterIcon).toBe('var(--tr-nav-center-icon)');
    });

    it('should provide nav gradient tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.navGradientFrom).toBe('var(--tr-nav-gradient-from)');
      expect(result.current.navGradientMid).toBe('var(--tr-nav-gradient-mid)');
      expect(result.current.navGradientTo).toBe('var(--tr-nav-gradient-to)');
    });
  });

  describe('Frame Tokens', () => {
    it('should provide mobile frame tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.frameBg).toBe('var(--tr-frame-bg)');
      expect(result.current.frameOuter).toBe('var(--tr-frame-outer)');
    });

    it('should provide Dynamic Island token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.diBackground).toBe('var(--tr-di-bg)');
    });

    it('should provide home indicator token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.homeBar).toBe('var(--tr-home-bar)');
    });
  });

  describe('Card Tokens', () => {
    it('should provide card tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.cardBg).toBe('var(--tr-card-bg)');
      expect(result.current.cardBorder).toBe('var(--tr-card-border)');
      expect(result.current.cardShadow).toBe('var(--tr-card-shadow)');
    });
  });

  describe('Interaction Tokens', () => {
    it('should provide hover token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.hoverBg).toBe('var(--tr-hover-bg)');
    });
  });

  describe('Search Tokens', () => {
    it('should provide search bar tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.searchBg).toBe('var(--tr-search-bg)');
      expect(result.current.searchBorder).toBe('var(--tr-search-border)');
      expect(result.current.searchPlaceholder).toBe('var(--tr-search-placeholder)');
    });
  });

  describe('Divider Tokens', () => {
    it('should provide divider token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.divider).toBe('var(--tr-divider)');
    });
  });

  describe('Portfolio Card Tokens', () => {
    it('should provide portfolio background and border tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.portfolioBg).toBe('var(--tr-portfolio-bg)');
      expect(result.current.portfolioBorder).toBe('var(--tr-portfolio-border)');
      expect(result.current.portfolioShadow).toBe('var(--tr-portfolio-shadow)');
    });

    it('should provide portfolio text tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.portfolioTextDim).toBe('var(--tr-portfolio-text-dim)');
      expect(result.current.portfolioTextMuted).toBe('var(--tr-portfolio-text-muted)');
    });

    it('should provide portfolio button tokens', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.portfolioBtnGhost).toBe('var(--tr-portfolio-btn-ghost)');
      expect(result.current.portfolioBtnGhostBorder).toBe('var(--tr-portfolio-btn-ghost-border)');
      expect(result.current.portfolioBtnGhostText).toBe('var(--tr-portfolio-btn-ghost-text)');
    });
  });

  describe('Section Tokens', () => {
    it('should provide section label token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.sectionLabelColor).toBe('var(--tr-section-label-color)');
    });
  });

  describe('Toggle Tokens', () => {
    it('should provide toggle track token', () => {
      const { result } = renderHook(() => useThemeColors());

      expect(result.current.toggleTrackOff).toBe('var(--tr-toggle-track-off)');
    });
  });

  describe('CSS Variable Format', () => {
    it('should return all tokens as CSS variables', () => {
      const { result } = renderHook(() => useThemeColors());

      const allTokens = Object.values(result.current);

      allTokens.forEach((token) => {
        expect(token).toMatch(/^var\(--tr-[a-z0-9-]+\)$/);
      });
    });

    it('should use correct variable prefix', () => {
      const { result } = renderHook(() => useThemeColors());

      const allTokens = Object.values(result.current);

      allTokens.forEach((token) => {
        expect(token).toContain('--tr-');
      });
    });
  });

  describe('Usage with Inline Styles', () => {
    it('should work with React inline styles', () => {
      const { result } = renderHook(() => useThemeColors());

      const style = {
        color: result.current.text1,
        backgroundColor: result.current.bg,
        borderColor: result.current.border,
      };

      expect(style.color).toBe('var(--tr-text-1)');
      expect(style.backgroundColor).toBe('var(--tr-bg)');
      expect(style.borderColor).toBe('var(--tr-border)');
    });

    it('should provide tokens for common use cases', () => {
      const { result } = renderHook(() => useThemeColors());

      // Button styles
      const buttonStyle = {
        backgroundColor: result.current.primary,
        color: result.current.text1,
      };

      expect(buttonStyle.backgroundColor).toBe('var(--tr-primary)');
      expect(buttonStyle.color).toBe('var(--tr-text-1)');
    });

    it('should provide tokens for card components', () => {
      const { result } = renderHook(() => useThemeColors());

      const cardStyle = {
        backgroundColor: result.current.cardBg,
        borderColor: result.current.cardBorder,
        boxShadow: result.current.cardShadow,
      };

      expect(cardStyle.backgroundColor).toBe('var(--tr-card-bg)');
      expect(cardStyle.borderColor).toBe('var(--tr-card-border)');
      expect(cardStyle.boxShadow).toBe('var(--tr-card-shadow)');
    });
  });

  describe('Completeness', () => {
    it('should provide all expected token categories', () => {
      const { result } = renderHook(() => useThemeColors());

      const tokenKeys = Object.keys(result.current);

      // Base tokens
      expect(tokenKeys).toContain('bg');
      expect(tokenKeys).toContain('surface');
      expect(tokenKeys).toContain('border');
      expect(tokenKeys).toContain('primary');

      // Text tokens
      expect(tokenKeys).toContain('text1');
      expect(tokenKeys).toContain('text2');
      expect(tokenKeys).toContain('text3');

      // Trading tokens
      expect(tokenKeys).toContain('buy');
      expect(tokenKeys).toContain('sell');
      expect(tokenKeys).toContain('warn');

      // Navigation tokens
      expect(tokenKeys).toContain('navBg');
      expect(tokenKeys).toContain('navActive');
      expect(tokenKeys).toContain('navInactive');
    });

    it('should have consistent token count', () => {
      const { result } = renderHook(() => useThemeColors());

      const tokenCount = Object.keys(result.current).length;

      // Should have all tokens defined
      expect(tokenCount).toBeGreaterThan(40);
    });
  });

  describe('Type Safety', () => {
    it('should return ThemeColors type', () => {
      const { result } = renderHook(() => useThemeColors());

      // TypeScript should enforce correct types
      expect(result.current).toHaveProperty('bg');
      expect(result.current).toHaveProperty('surface');
      expect(result.current).toHaveProperty('primary');
    });

    it('should have read-only token values', () => {
      const { result } = renderHook(() => useThemeColors());

      const colors = result.current;

      // Tokens should be constant
      expect(colors.bg).toBe('var(--tr-bg)');

      // Same reference on every call
      const colors2 = renderHook(() => useThemeColors()).result.current;
      expect(colors2.bg).toBe(colors.bg);
    });
  });

  describe('Performance', () => {
    it('should not recreate tokens on every call', () => {
      const { result, rerender } = renderHook(() => useThemeColors());

      const colors1 = result.current;

      rerender();
      rerender();
      rerender();

      const colors2 = result.current;

      expect(colors2).toBe(colors1);
    });

    it('should handle high-frequency access', () => {
      for (let i = 0; i < 1000; i++) {
        const { result } = renderHook(() => useThemeColors());
        expect(result.current.bg).toBe('var(--tr-bg)');
      }
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support component styling', () => {
      const { result } = renderHook(() => useThemeColors());

      const componentStyle = {
        backgroundColor: result.current.surface,
        color: result.current.text1,
        borderColor: result.current.border,
        borderRadius: '8px',
        padding: '16px',
      };

      expect(componentStyle.backgroundColor).toBe('var(--tr-surface)');
      expect(componentStyle.color).toBe('var(--tr-text-1)');
    });

    it('should support trading interface colors', () => {
      const { result } = renderHook(() => useThemeColors());

      const buyButtonStyle = {
        backgroundColor: result.current.buy,
      };

      const sellButtonStyle = {
        backgroundColor: result.current.sell,
      };

      expect(buyButtonStyle.backgroundColor).toBe('var(--tr-buy)');
      expect(sellButtonStyle.backgroundColor).toBe('var(--tr-sell)');
    });

    it('should support navigation styling', () => {
      const { result } = renderHook(() => useThemeColors());

      const navStyle = {
        backgroundColor: result.current.navBg,
        borderTopColor: result.current.navBorder,
      };

      const activeTabStyle = {
        color: result.current.navActive,
      };

      const inactiveTabStyle = {
        color: result.current.navInactive,
      };

      expect(navStyle.backgroundColor).toBe('var(--tr-nav-bg)');
      expect(activeTabStyle.color).toBe('var(--tr-nav-active)');
      expect(inactiveTabStyle.color).toBe('var(--tr-nav-inactive)');
    });
  });
});
