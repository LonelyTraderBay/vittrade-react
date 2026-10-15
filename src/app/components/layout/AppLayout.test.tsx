import { act, fireEvent, render, screen } from '@testing-library/react';
import { lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UIContext } from '../../contexts/ui-context';
import { AppLayout } from './AppLayout';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  signOut: vi.fn<() => Promise<void>>(),
}));
const pullToRefreshMock = vi.hoisted(() => ({
  onRefresh: undefined as (() => Promise<void> | void) | undefined,
}));
const hapticMock = vi.hoisted(() => ({ hapticLight: vi.fn() }));

const NeverLoadedPage = lazy(() => new Promise<{ default: ComponentType }>(() => {}));

vi.mock('@/shared/session/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/shared/config/env', () => ({
  env: { isDev: true, dataSource: 'mock' },
  isDevelopmentBuild: true,
}));

vi.mock('@/shared/hooks/useThemeColors', () => ({
  useThemeColors: () => ({ bg: '#fff', text3: '#666' }),
}));

vi.mock('@/shared/hooks/useHaptic', () => ({
  useHaptic: () => ({ hapticLight: hapticMock.hapticLight }),
}));

vi.mock('./StatusBar', () => ({ StatusBar: () => null }));
vi.mock('./BottomNav', () => ({ BottomNav: () => null }));
vi.mock('../mobile/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../mobile/PullToRefresh', () => ({ PullToRefreshIndicator: () => null }));
vi.mock('../mobile/ScrollToTopFAB', () => ({ ScrollToTopFAB: () => null }));
vi.mock('../mobile/SwipeBack', () => ({
  SwipeBack: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../mobile/PageTransition', () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/shared/ui/OfflineBanner', () => ({
  OfflineBanner: ({ isReconnecting }: { isReconnecting?: boolean }) => (
    <div data-testid="offline-banner" data-reconnecting={Boolean(isReconnecting)} />
  ),
}));
vi.mock('../states/NetworkStatusBanner', () => ({ NetworkStatusBanner: () => null }));
vi.mock('../states/SessionTimeoutOverlay', () => ({
  SessionWarningBar: ({ onExtend }: { onExtend: () => void }) => (
    <button onClick={onExtend}>Gia hạn</button>
  ),
  SessionTimedOutModal: ({ open, onReauth }: { open: boolean; onReauth: () => void }) =>
    open ? <button onClick={onReauth}>Xác thực lại</button> : null,
}));

vi.mock('../../hooks/usePullToRefresh', () => ({
  usePullToRefresh: ({ onRefresh }: { onRefresh: () => Promise<void> | void }) => {
    pullToRefreshMock.onRefresh = onRefresh;
    return { pullDistance: 0, isRefreshing: false, progress: 0, handlers: {} };
  },
}));

vi.mock('../../hooks/useScrollPosition', () => ({
  useScrollPosition: () => ({ showScrollTop: false, scrollToTop: vi.fn() }),
}));

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function appLayoutTree(offline = false, child: ReactNode = null) {
  const contextValue = offline
    ? {
        isBalanceHidden: false,
        isOffline: true,
        pendingRewards: 0,
        notifications: 0,
        toggleBalanceHidden: vi.fn(),
        setIsOffline: vi.fn(),
        setPendingRewards: vi.fn(),
      }
    : null;

  return (
    <MemoryRouter initialEntries={['/home']}>
      <UIContext.Provider value={contextValue}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="*" element={child} />
          </Route>
        </Routes>
        <CurrentPath />
      </UIContext.Provider>
    </MemoryRouter>
  );
}

function renderAppLayout(offline = false, child: ReactNode = null) {
  return render(appLayoutTree(offline, child));
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
  authState.isAuthenticated = false;
  authState.signOut.mockReset();
  pullToRefreshMock.onRefresh = undefined;
  hapticMock.hapticLight.mockReset();
});

describe('AppLayout session timeout', () => {
  it('shows the one-minute warning and restarts the idle window when extended', () => {
    vi.useFakeTimers();
    authState.isAuthenticated = true;
    renderAppLayout();

    act(() => vi.advanceTimersByTime(4 * 60 * 1000));

    expect(screen.getByRole('button', { name: 'Gia hạn' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gia hạn' }));
    expect(screen.queryByRole('button', { name: 'Gia hạn' })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60 * 1000));
    expect(authState.signOut).not.toHaveBeenCalled();
  });

  it('signs out and routes to login at the idle deadline', () => {
    vi.useFakeTimers();
    authState.isAuthenticated = true;
    authState.signOut.mockResolvedValue();
    renderAppLayout();

    act(() => vi.advanceTimersByTime(5 * 60 * 1000));

    expect(authState.signOut).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Xác thực lại' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/auth/login');
  });

  it('does not start an idle lock on an anonymous route', () => {
    vi.useFakeTimers();
    authState.isAuthenticated = false;
    renderAppLayout();

    act(() => vi.advanceTimersByTime(10 * 60 * 1000));

    expect(authState.signOut).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Xác thực lại' })).not.toBeInTheDocument();
  });

  it('runs the layout refresh action through its pull-to-refresh contract', async () => {
    vi.useFakeTimers();
    renderAppLayout();

    const refresh = pullToRefreshMock.onRefresh;
    expect(refresh).toBeDefined();

    let refreshPromise: Promise<void> | void;
    await act(async () => {
      refreshPromise = refresh?.();
      await vi.advanceTimersByTimeAsync(1200);
      await refreshPromise;
    });

    expect(hapticMock.hapticLight).toHaveBeenCalledOnce();
  });

  it('shows reconnecting while offline and clears the reconnect timer on recovery', () => {
    vi.useFakeTimers();
    const app = renderAppLayout(true);

    expect(screen.getByTestId('offline-banner')).toHaveAttribute('data-reconnecting', 'false');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByTestId('offline-banner')).toHaveAttribute('data-reconnecting', 'true');

    app.rerender(appLayoutTree(false));
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('renders the loading fallback while a nested route is still lazy', () => {
    renderAppLayout(false, <NeverLoadedPage />);

    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
  });

  it('reserves space below narrow development mock previews', () => {
    const previousWidth = window.innerWidth;
    window.innerWidth = 390;

    try {
      renderAppLayout();

      const marginBottom =
        document.querySelector<HTMLElement>('[data-pull-scroll]')?.style.marginBottom;
      expect(marginBottom).toContain('132px');
      expect(marginBottom).toContain('safe-area-inset-bottom');
    } finally {
      window.innerWidth = previousWidth;
    }
  });
});
