import React from 'react';
import { Outlet, useLocation } from 'react-router';
import { AppProvider } from '../../contexts/AppContext';
import { DCAProvider } from '../../contexts/DCAContext';
import { MobileFrame } from './MobileFrame';
import { ErrorBoundary } from '../mobile/ErrorBoundary';
import { ThemedToaster } from '../ui/ThemedToaster';
import { PlatformSwitcher } from './PlatformSwitcher';

/**
 * ══════════════════════════════════════════════════════════
 *  ROOT LAYOUT — Platform-Aware App Shell Router
 * ══════════════════════════════════════════════════════════
 *
 *  Routes to 3 fundamentally different platform experiences:
 *
 *  /home, /markets, ...   → PHONE   → MobileFrame (440×956)
 *  /t/home, /t/markets    → TABLET  → Full viewport, sidebar
 *  /w/home, /w/markets    → WEB     → Multi-panel desktop
 *  /r/...                 → LEGACY  → Responsive (deprecated)
 *
 *  Each platform has its own shell component that provides:
 *  - Navigation (bottom nav / sidebar / command bar)
 *  - Layout (single-col / split-view / multi-panel)
 *  - Interaction model (gesture / touch / keyboard)
 *  - Modal system (sheets / floating / dialog)
 */
export function RootLayout() {
  const location = useLocation();

  // Determine which platform shell we're in
  const isTabletRoute = location.pathname.startsWith('/t/') || location.pathname === '/t';
  const isWebRoute = location.pathname.startsWith('/w/') || location.pathname === '/w';
  const isResponsiveRoute = location.pathname.startsWith('/r/') || location.pathname === '/r';
  const isStandaloneRoute =
    location.pathname.startsWith('/auth') || location.pathname.startsWith('/onboarding');

  // Phone routes get MobileFrame wrapper
  // Tablet, Web, Responsive routes render full viewport
  const needsMobileFrame =
    !isTabletRoute && !isWebRoute && !isResponsiveRoute && !isStandaloneRoute;

  return (
    <ErrorBoundary section="VitTrade App">
      <AppProvider>
        <DCAProvider>
          <React.Suspense fallback={<RouteChunkFallback />}>
            {needsMobileFrame ? (
              <MobileFrame>
                <Outlet />
              </MobileFrame>
            ) : (
              <Outlet />
            )}
          </React.Suspense>
          <ThemedToaster />
          <PlatformSwitcher />
        </DCAProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

/**
 * Shown while a lazy route chunk downloads.
 * Lightweight by design — no animation library imports.
 */
function RouteChunkFallback() {
  return (
    <div
      role="status"
      aria-label="Đang tải trang"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(59,130,246,0.2)',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ fontSize: 13, opacity: 0.6 }}>Đang tải…</span>
    </div>
  );
}
