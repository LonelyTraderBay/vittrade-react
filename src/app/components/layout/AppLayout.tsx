import React, { useRef, useCallback, useState, useEffect, useContext, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from './BottomNav';
import { StatusBar } from './StatusBar';
import { UIContext } from '../../contexts/UIContext';
import { ErrorBoundary } from '../mobile/ErrorBoundary';
import { PullToRefreshIndicator } from '../mobile/PullToRefresh';
import { ScrollToTopFAB } from '../mobile/ScrollToTopFAB';
import { SwipeBack } from '../mobile/SwipeBack';
import { PageTransition } from '../mobile/PageTransition';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { useHaptic } from '../../hooks/useHaptic';
import { OfflineBanner } from '../states/OfflineBanner';
import { NetworkStatusBanner } from '../states/NetworkStatusBanner';
import { SessionWarningBar, SessionTimedOutModal } from '../states/SessionTimeoutOverlay';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { DEVICE } from './MobileFrame';
import { useThemeColors } from '../../hooks/useThemeColors';

// ... existing code ...

/** Suspense Fallback for lazy-loaded pages */
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
      {/* Simple loading state - inherits PageTransition animation */}
      <div style={{ opacity: 0.6 }}>Đang tải...</div>
    </div>
  );
}

/** Routes where swipe-back should be disabled (root tabs) */
const NO_SWIPE_ROUTES = ['/home', '/markets', '/wallet', '/profile'];

export function AppLayout() {
  const uiCtx = useContext(UIContext);
  const isOffline = uiCtx?.isOffline ?? false;
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hapticLight } = useHaptic();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const c = useThemeColors();

  // ─── Session timeout (5 min idle → warning → lock) ───
  const sessionTimeout = useSessionTimeout({
    timeout: 5 * 60 * 1000,
    warningBefore: 60 * 1000,
    onTimeout: () => { /* handled by isTimedOut state */ },
    enabled: true,
  });

  // ─── Pull-to-refresh ───
  const handleRefresh = useCallback(async () => {
    hapticLight();
    // Simulate data refresh
    await new Promise(r => setTimeout(r, 1200));
  }, [hapticLight]);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 72,
  });

  // ─── Scroll-to-top ───
  const { showScrollTop, scrollToTop } = useScrollPosition(scrollRef);

  // ─── Swipe-back disabled on root tabs ───
  const isRootTab = NO_SWIPE_ROUTES.some(r => location.pathname === r);

  // ─── Simulated reconnection logic ───
  useEffect(() => {
    if (isOffline) {
      const timer = setTimeout(() => setIsReconnecting(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setIsReconnecting(false);
    }
  }, [isOffline]);

  // ─── Scroll to top on route change ───
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div
      id="app-layout-root"
      className="relative flex flex-col overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        overscrollBehavior: 'none',
        background: c.bg,
        transition: 'background var(--tr-duration-slow) ease',
      }}
    >
      <StatusBar />

      {/* Network connectivity banner (auto-show/hide) */}
      <NetworkStatusBanner />

      {/* Session timeout warning bar */}
      {sessionTimeout.isWarning && !sessionTimeout.isTimedOut && (
        <SessionWarningBar
          remainingSeconds={sessionTimeout.remainingSeconds}
          onExtend={sessionTimeout.extendSession}
        />
      )}

      {/* Offline / Reconnecting Banner (legacy — kept for offline simulation) */}
      {isOffline && (
        <div className="py-1.5">
          <OfflineBanner
            variant="warn"
            showStaleHint
            isReconnecting={isReconnecting}
          />
        </div>
      )}

      {/* Main scrollable content area */}
      <div
        ref={scrollRef}
        data-pull-scroll
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none scroll-contain-y"
        style={{
          /* BottomNav: 56pt tab + 34pt home indicator = 90pt */
          paddingBottom: DEVICE.BOTTOM_CHROME,
          overscrollBehaviorY: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
        {...pullToRefresh.handlers}
      >
        {/* Pull-to-refresh indicator */}
        <PullToRefreshIndicator
          pullDistance={pullToRefresh.pullDistance}
          isRefreshing={pullToRefresh.isRefreshing}
          progress={pullToRefresh.progress}
        />

        {/* SwipeBack wrapper */}
        <SwipeBack disabled={isRootTab}>
          {/* Error boundary per page */}
          <ErrorBoundary section="Trang">
            {/* Page transition animation */}
            <PageTransition>
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </PageTransition>
          </ErrorBoundary>
        </SwipeBack>
      </div>

      {/* Scroll-to-top FAB */}
      <ScrollToTopFAB visible={showScrollTop} onClick={scrollToTop} />

      {/* Bottom Navigation */}
      <BottomNav />
      {/* Portal root for BottomSheetV2 — outside scroll area & PageTransition */}
      <div id="sheet-portal" />

      {/* Session timed-out modal */}
      <SessionTimedOutModal
        open={sessionTimeout.isTimedOut}
        onReauth={sessionTimeout.resetTimer}
      />
    </div>
  );
}