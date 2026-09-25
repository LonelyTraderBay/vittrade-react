import React, { Suspense } from 'react';
import { Outlet } from 'react-router';
import { TabletSidebar } from './TabletSidebar';
import { TabletTopBar } from './TabletTopBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useUI } from '../../hooks/useUI';
import { PlatformProvider } from '../../hooks/usePlatform';
import type { PlatformInfo } from '../../hooks/usePlatform';

/**
 * ══════════════════════════════════════════════════════════
 *  TABLET SHELL — Split-View Enterprise Layout
 * ══════════════════════════════════════════════════════════
 *
 *  Fundamentally different from Phone and Web:
 *
 *  ┌──────┬──────────────────────────────────────┐
 *  │      │  TopBar: breadcrumbs + search + user  │
 *  │ Side ├──────────────────────────────────────┤
 *  │ bar  │                                      │
 *  │ 80/  │       Main Content Area              │
 *  │ 260  │       max-width: 960px               │
 *  │ px   │       centered with 24px pad         │
 *  │      │                                      │
 *  │      │                                      │
 *  └──────┴──────────────────────────────────────┘
 *
 *  Key differences from Phone:
 *  - NO bottom navigation (sidebar replaces it)
 *  - NO MobileFrame (runs full viewport)
 *  - NO pull-to-refresh (button refresh instead)
 *  - NO swipe-back gesture (sidebar nav instead)
 *  - NO page transition animations (instant swap)
 *  - Content centered at max 960px
 *  - 24px side padding
 *
 *  Key differences from Web:
 *  - Sidebar is collapsible (80↔260px)
 *  - NO right panel
 *  - NO command bar with keyboard shortcuts
 *  - Touch-optimized targets (44px min)
 *  - Simpler breadcrumbs (no keyboard hint)
 *  - Floating panels for modals (not centered dialog)
 *  - Content at max 960px (vs 1400px)
 */

const TABLET_PLATFORM: PlatformInfo = {
  platform: 'tablet',
  prefix: '/t',
  isPhone: false,
  isTablet: true,
  isWeb: false,
  contentMaxWidth: 960,
  contentPadding: 24,
  gridColumns: 2,
  hasBottomNav: false,
  hasSidebar: true,
  modalStyle: 'floating',
  minTouchTarget: 40,
  sidebarWidth: 80,
  commandBarHeight: 56,
};

function TabletLoadingFallback() {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh', color: c.text3 }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="rounded-full"
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(59,130,246,0.15)',
            borderTopColor: '#3B82F6',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 13, opacity: 0.6 }}>Đang tải...</span>
      </div>
    </div>
  );
}

export function TabletShell() {
  const c = useThemeColors();
  const { isOffline } = useUI();

  return (
    <PlatformProvider value={TABLET_PLATFORM}>
      <div
        data-platform="tablet"
        className="flex h-screen overflow-hidden"
        style={{ background: c.bg }}
      >
        {/* ─── Collapsible Sidebar ─── */}
        <TabletSidebar />

        {/* ─── Main Area ─── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar */}
          <TabletTopBar />

          {/* Offline Banner */}
          {isOffline && (
            <div
              className="flex items-center justify-center gap-2 py-2 text-xs font-medium shrink-0"
              style={{
                background: 'rgba(245,158,11,0.1)',
                color: '#F59E0B',
                borderBottom: `1px solid rgba(245,158,11,0.2)`,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
              <span>Mất kết nối mạng — Đang hiển thị dữ liệu lưu trữ</span>
            </div>
          )}

          {/* Scrollable Content */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
            style={{
              overscrollBehaviorY: 'contain',
            }}
          >
            <div
              style={{
                maxWidth: TABLET_PLATFORM.contentMaxWidth,
                margin: '0 auto',
                padding: `0 ${TABLET_PLATFORM.contentPadding}px`,
                minHeight: '100%',
              }}
            >
              <Suspense fallback={<TabletLoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Portal root for floating panels */}
        <div id="sheet-portal" />
      </div>
    </PlatformProvider>
  );
}
