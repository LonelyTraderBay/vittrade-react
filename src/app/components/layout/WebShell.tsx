import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { WebSidebar } from './WebSidebar';
import { WebCommandBar } from './WebCommandBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useUI } from '../../contexts/UIContext';
import { PlatformProvider } from '../../hooks/usePlatform';
import type { PlatformInfo } from '../../hooks/usePlatform';
import {
  WEB_SIDEBAR_WIDTH,
  WEB_COMMAND_BAR_HEIGHT,
  WEB_CONTENT_MAX_WIDTH,
  WEB_CONTENT_PADDING,
  isFullBleedRoute,
} from './webConstants';

/**
 * ══════════════════════════════════════════════════════════
 *  WEB SHELL — Enterprise Desktop Trading Platform
 * ══════════════════════════════════════════════════════════
 *
 *  ┌──────────┬───────────────────────────────────────────┐
 *  │          │  CommandBar: breadcrumbs + ⌘K search + user│
 *  │          ├───────────────────────────────────────────┤
 *  │   Web    │                                           │
 *  │ Sidebar  │     Main Content Area                     │
 *  │  260px   │     maxWidth: 1600px, padding: 0 32px    │
 *  │  always  │     Responsive pages manage their own     │
 *  │ expanded │     multi-column layouts                  │
 *  │          │                                           │
 *  └──────────┴───────────────────────────────────────────┘
 *
 *  FULL-BLEED MODE:
 *  Pages like TradePage, Scanner, Analytics that need to fill
 *  the entire viewport width can use the full-bleed pattern:
 *    - Shell detects route and removes maxWidth + padding
 *    - Page manages its own padding/layout internally
 *
 *  IMPORTANT: No built-in RightPanel here.
 *  Pages handle their own desktop layouts (2-col, 3-col, etc.)
 *  to avoid conflict with page-level side panels.
 */

// Re-export constants for backward compatibility
export {
  WEB_SIDEBAR_WIDTH,
  WEB_COMMAND_BAR_HEIGHT,
  WEB_CONTENT_MAX_WIDTH,
  WEB_CONTENT_PADDING,
} from './webConstants';

const WEB_PLATFORM: PlatformInfo = {
  platform: 'web',
  prefix: '/w',
  isPhone: false,
  isTablet: false,
  isWeb: true,
  contentMaxWidth: WEB_CONTENT_MAX_WIDTH,
  contentPadding: WEB_CONTENT_PADDING,
  gridColumns: 3,
  hasBottomNav: false,
  hasSidebar: true,
  modalStyle: 'dialog',
  minTouchTarget: 32,
  sidebarWidth: WEB_SIDEBAR_WIDTH,
  commandBarHeight: WEB_COMMAND_BAR_HEIGHT,
};

function WebLoadingFallback() {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh', color: c.text3 }}>
      <div className="flex flex-col items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            border: '2px solid rgba(59,130,246,0.15)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 13, opacity: 0.6 }}>Đang tải...</span>
      </div>
    </div>
  );
}

export function WebShell() {
  const c = useThemeColors();
  const { isOffline } = useUI();
  const location = useLocation();
  const fullBleed = isFullBleedRoute(location.pathname);
  const isAuthRoute = location.pathname.startsWith('/w/auth');

  // Auth pages render full-screen without shell chrome
  if (isAuthRoute) {
    return (
      <PlatformProvider value={WEB_PLATFORM}>
        <div data-platform="web" className="h-screen overflow-hidden" style={{ background: c.bg }}>
          <div className="h-full overflow-y-auto scrollbar-none">
            <Suspense fallback={<WebLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
          <div id="sheet-portal" />
        </div>
      </PlatformProvider>
    );
  }

  return (
    <PlatformProvider value={WEB_PLATFORM}>
      <div
        data-platform="web"
        className="flex h-screen overflow-hidden"
        style={{ background: c.bg }}
      >
        {/* ─── Full Sidebar ─── */}
        <WebSidebar />

        {/* ─── Main Area (Command Bar + Content) ─── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <WebCommandBar />

          {/* Offline Banner */}
          {isOffline && (
            <div
              className="flex items-center justify-center gap-2 py-2 shrink-0"
              style={{
                background: 'rgba(245,158,11,0.08)',
                color: '#F59E0B',
                fontSize: 13,
                fontWeight: 500,
                borderBottom: `1px solid rgba(245,158,11,0.15)`,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
              <span>Mất kết nối mạng — Đang hiển thị dữ liệu lưu trữ</span>
            </div>
          )}

          {/* Main scrollable content */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
            style={{ overscrollBehaviorY: 'contain' }}
          >
            {fullBleed ? (
              /* Full-bleed: no maxWidth, no padding — page controls its own layout + scroll */
              <div style={{ minHeight: '100%' }}>
                <Suspense fallback={<WebLoadingFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            ) : (
              /* Standard: centered with maxWidth + padding */
              <div
                style={{
                  maxWidth: WEB_CONTENT_MAX_WIDTH,
                  margin: '0 auto',
                  padding: `0 ${WEB_CONTENT_PADDING}px`,
                  minHeight: '100%',
                }}
              >
                <Suspense fallback={<WebLoadingFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        {/* Portal root for modal dialogs */}
        <div id="sheet-portal" />
      </div>
    </PlatformProvider>
  );
}
