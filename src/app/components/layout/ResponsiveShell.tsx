import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ResponsiveBottomNav } from './ResponsiveBottomNav';
import { LeftRail } from './LeftRail';
import { StatusBar } from './StatusBar';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useUI } from '../../hooks/useUI';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

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
  const location = useLocation();
  const isAuthRoute = /^\/r\/auth(?:\/|$)/.test(location.pathname);
  const { isTablet, isDesktop } = useBreakpoint();
  const { isOffline } = useUI();
  const c = useThemeColors();
  const adaptiveDesktop = isDesktop && desktopMode === 'adaptive';
  const centeredDesktop = isDesktop && desktopMode === 'centered';

  // The Outlet keeps the same ancestor tree across breakpoints, preserving drafts and pending work.
  return (
    <div
      className={
        centeredDesktop
          ? 'min-h-screen flex items-center justify-center py-4'
          : 'relative flex overflow-hidden'
      }
      style={{
        background: centeredDesktop
          ? 'radial-gradient(ellipse at 50% 0%, #0d1b3e 0%, #050810 70%)'
          : c.bg,
        ...(centeredDesktop
          ? {}
          : {
              width: '100%',
              height: isDesktop || isTablet ? '100vh' : '100dvh',
              overscrollBehavior: 'none',
            }),
      }}
    >
      {adaptiveDesktop && <LeftRail />}
      <div
        className="relative flex flex-col overflow-hidden"
        style={
          centeredDesktop
            ? {
                width: 480,
                height: '90vh',
                maxHeight: 900,
                borderRadius: 24,
                background: c.bg,
                border: '1px solid ' + c.border,
                boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
              }
            : { flex: 1, minWidth: 0 }
        }
      >
        {adaptiveDesktop && (
          <div
            className="flex items-center justify-between px-6 shrink-0"
            style={{
              height: 48,
              background: c.navBg,
              borderBottom: '1px solid ' + c.navBorder,
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
              <span style={{ color: c.text1, fontSize: 12 }}>v2.4.1</span>
            </div>
          </div>
        )}
        {!adaptiveDesktop && !isAuthRoute && <StatusBar />}
        {!adaptiveDesktop && isOffline && (
          <div
            className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium"
            style={{ background: '#92400E', color: '#FDE68A' }}
          >
            <span>●</span>
            <span>
              {centeredDesktop ? 'Mất kết nối' : 'Mất kết nối — Đang hiển thị dữ liệu lưu trữ'}
            </span>
          </div>
        )}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none"
          style={{
            paddingBottom: adaptiveDesktop ? 0 : 80,
            overscrollBehaviorY: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            style={{
              maxWidth: adaptiveDesktop ? 1200 : isTablet ? 720 : undefined,
              margin: '0 auto',
              padding: adaptiveDesktop ? '0 24px' : isTablet ? '0 16px' : undefined,
            }}
          >
            <Suspense fallback={<PageLoadingFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
        {!adaptiveDesktop && <ResponsiveBottomNav />}
        <div id="sheet-portal" />
      </div>
    </div>
  );
}
