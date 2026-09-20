import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'react-router';

/**
 * ══════════════════════════════════════════════════════════
 *  Platform Detection — 3 Distinct Enterprise Shells
 * ══════════════════════════════════════════════════════════
 *
 *  Phone   → /home, /markets, ...     (touch-first, single-column)
 *  Tablet  → /t/home, /t/markets, ... (split-view, floating sidebar)
 *  Web     → /w/home, /w/markets, ... (multi-panel, keyboard-first)
 *
 *  Each platform has fundamentally different:
 *  - Navigation paradigm
 *  - Layout structure
 *  - Interaction model
 *  - Information density
 *  - Modal/sheet system
 */

export type Platform = 'phone' | 'tablet' | 'web';

export interface PlatformInfo {
  platform: Platform;
  /** Route prefix for this platform */
  prefix: string;
  /** Is running on phone shell */
  isPhone: boolean;
  /** Is running on tablet shell */
  isTablet: boolean;
  /** Is running on web shell */
  isWeb: boolean;
  /** Content max width */
  contentMaxWidth: number;
  /** Side padding */
  contentPadding: number;
  /** Card columns (for grid layouts) */
  gridColumns: number;
  /** Show bottom navigation */
  hasBottomNav: boolean;
  /** Show sidebar */
  hasSidebar: boolean;
  /** Use bottom sheets (phone) or dialogs (tablet/web) */
  modalStyle: 'sheet' | 'floating' | 'dialog';
  /** Touch target minimum size */
  minTouchTarget: number;
  /** Sidebar width in pixels (0 if no sidebar) */
  sidebarWidth: number;
  /** Top bar / command bar height in pixels (0 if none) */
  commandBarHeight: number;
}

const PLATFORM_CONFIG: Record<Platform, Omit<PlatformInfo, 'platform' | 'prefix' | 'isPhone' | 'isTablet' | 'isWeb'>> = {
  phone: {
    contentMaxWidth: 440,
    contentPadding: 20,
    gridColumns: 1,
    hasBottomNav: true,
    hasSidebar: false,
    modalStyle: 'sheet',
    minTouchTarget: 44,
    sidebarWidth: 0,
    commandBarHeight: 0,
  },
  tablet: {
    contentMaxWidth: 960,
    contentPadding: 24,
    gridColumns: 2,
    hasBottomNav: false,
    hasSidebar: true,
    modalStyle: 'floating',
    minTouchTarget: 40,
    sidebarWidth: 80,
    commandBarHeight: 56,
  },
  web: {
    contentMaxWidth: 1600,
    contentPadding: 32,
    gridColumns: 3,
    hasBottomNav: false,
    hasSidebar: true,
    modalStyle: 'dialog',
    minTouchTarget: 32,
    sidebarWidth: 260,
    commandBarHeight: 64,
  },
};

/** Detect platform from route prefix */
export function detectPlatformFromPath(pathname: string): Platform {
  if (pathname.startsWith('/w/') || pathname.startsWith('/w')) return 'web';
  if (pathname.startsWith('/t/') || pathname.startsWith('/t')) return 'tablet';
  return 'phone';
}

/** Detect platform from viewport (for auto-redirect) */
export function detectPlatformFromViewport(): Platform {
  const w = window.innerWidth;
  if (w >= 1024) return 'web';
  if (w >= 768) return 'tablet';
  return 'phone';
}

/** Get route prefix for a platform */
export function getPlatformPrefix(platform: Platform): string {
  switch (platform) {
    case 'web': return '/w';
    case 'tablet': return '/t';
    default: return '';
  }
}

/** Build full PlatformInfo */
function buildPlatformInfo(platform: Platform): PlatformInfo {
  const prefix = getPlatformPrefix(platform);
  return {
    platform,
    prefix,
    isPhone: platform === 'phone',
    isTablet: platform === 'tablet',
    isWeb: platform === 'web',
    ...PLATFORM_CONFIG[platform],
  };
}

// ─── Context ───
const PlatformContext = createContext<PlatformInfo>(buildPlatformInfo('phone'));

export const PlatformProvider = PlatformContext.Provider;

/** Hook: get current platform info */
export function usePlatform(): PlatformInfo {
  return useContext(PlatformContext);
}

/** Hook: detect platform from current route */
export function usePlatformFromRoute(): PlatformInfo {
  const location = useLocation();
  const platform = detectPlatformFromPath(location.pathname);
  return buildPlatformInfo(platform);
}

/** Hook: get route prefix (backward compat with useRoutePrefix) */
export function usePlatformPrefix(): string {
  const location = useLocation();
  if (location.pathname.startsWith('/w/')) return '/w';
  if (location.pathname.startsWith('/t/')) return '/t';
  if (location.pathname.startsWith('/r/')) return '/r'; // legacy compat
  return '';
}