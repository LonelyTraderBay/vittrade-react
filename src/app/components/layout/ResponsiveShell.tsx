import React, { Suspense } from 'react';
import { Outlet } from 'react-router';
import { ResponsiveBottomNav } from './ResponsiveBottomNav';
import { LeftRail } from './LeftRail';
import { StatusBar } from './StatusBar';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useUI } from '../../contexts/UIContext';
import { useThemeColors } from '../../hooks/useThemeColors';

/** Suspense Fallback for lazy-loaded responsive pages */
function PageLoadingFallback() {
  const c = useThemeColors();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: c.text3,
        fontSize: 14,
      }}
    >
      <div style={{ opacity: 0.6 }}>Đang tải...</div>
    </div>
  );
}

/**
 * Desktop mode:
 * - "centered"  → keeps BottomNav, content max-width 480 centered (phone-like)
 * - "adaptive"  → LeftRail sidebar, content max-width 1200 centered
 */
interface ResponsiveShellProps {
  desktopMode?: 'centered' | 'adaptive';
  children?: React.ReactNode;
}

export function ResponsiveAppLayout({ desktopMode = 'adaptive' }: ResponsiveShellProps) {
  const { bp, isMobile, isTablet, isDesktop } = useBreakpoint();
  const { isOffline } = useUI();
  const c = useThemeColors();

  // ─── Desktop Adaptive: LeftRail + wide content ───
  if (isDesktop && desktopMode === 'adaptive') {
    return (
      <div className="relative flex h-screen overflow-hidden" style={{ background: c.bg }}>
        <LeftRail />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar for desktop */}
          <div
            className="flex items-center justify-between px-6 shrink-0"
            style={{
              height: 48,
              background: c.navBg,
              borderBottom: `1px solid ${c.navBorder}`,
              backdropFilter: 'blur(20px)',
            }}
          >
            <span style={{ color: c.text2, fontSize: 13 }}>VitTrade Desktop</span>
            <div className="flex items-center gap-2">
              {isOffline && (
                <span
                  className="px-2 py-1 rounded-lg text-xs"
                  style={{ background: '#92400E', color: '#FDE68A' }}
                >
                  Offline
                </span>
              )}
              <span style={{ color: c.text3, fontSize: 12 }}>v2.4.1</span>
            </div>
          </div>

          {/* Main content */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
            style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </div>
        <div id="sheet-portal" />
      </div>
    );
  }

  // ─── Desktop Centered: phone-like with ResponsiveBottomNav ───
  if (isDesktop && desktopMode === 'centered') {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-4"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d1b3e 0%, #050810 70%)' }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: 480,
            height: '90vh',
            maxHeight: 900,
            borderRadius: 24,
            background: c.bg,
            border: `1px solid ${c.border}`,
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex flex-col h-full">
            <StatusBar />
            {isOffline && (
              <div
                className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium"
                style={{ background: '#92400E', color: '#FDE68A' }}
              >
                <span>●</span>
                <span>Mất kết nối</span>
              </div>
            )}
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: 80 }}>
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </div>
            <ResponsiveBottomNav />
            <div id="sheet-portal" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Tablet: wider content, still ResponsiveBottomNav ───
  if (isTablet) {
    return (
      <div
        className="relative flex flex-col h-screen overflow-hidden"
        style={{ background: c.bg, overscrollBehavior: 'none' }}
      >
        <StatusBar />
        {isOffline && (
          <div
            className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium"
            style={{ background: '#92400E', color: '#FDE68A' }}
          >
            <span>●</span>
            <span>Mất kết nối — Đang hiển thị dữ liệu lưu trữ</span>
          </div>
        )}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
          style={{
            paddingBottom: 80,
            overscrollBehaviorY: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
        <ResponsiveBottomNav />
        <div id="sheet-portal" />
      </div>
    );
  }

  // ─── Mobile S / Mobile L: original layout ───
  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{ width: '100%', height: '100dvh', overscrollBehavior: 'none', background: c.bg }}
    >
      <StatusBar />
      {isOffline && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium"
          style={{ background: '#92400E', color: '#FDE68A' }}
        >
          <span>●</span>
          <span>Mất kết nối — Đang hiển thị dữ liệu lưu trữ</span>
        </div>
      )}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
        style={{
          paddingBottom: 80,
          overscrollBehaviorY: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <ResponsiveBottomNav />
      <div id="sheet-portal" />
    </div>
  );
}
