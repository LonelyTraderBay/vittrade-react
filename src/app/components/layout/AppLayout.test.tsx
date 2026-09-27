import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UIContext } from '../../contexts/ui-context';
import { AppLayout } from './AppLayout';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  signOut: vi.fn<() => Promise<void>>(),
}));

vi.mock('@/shared/session/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/shared/hooks/useThemeColors', () => ({
  useThemeColors: () => ({ bg: '#fff', text3: '#666' }),
}));

vi.mock('@/shared/hooks/useHaptic', () => ({
  useHaptic: () => ({ hapticLight: vi.fn() }),
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
vi.mock('@/shared/ui/OfflineBanner', () => ({ OfflineBanner: () => null }));
vi.mock('../states/NetworkStatusBanner', () => ({ NetworkStatusBanner: () => null }));
vi.mock('../states/SessionTimeoutOverlay', () => ({
  SessionWarningBar: ({ onExtend }: { onExtend: () => void }) => (
    <button onClick={onExtend}>Gia hạn</button>
  ),
  SessionTimedOutModal: ({ open, onReauth }: { open: boolean; onReauth: () => void }) =>
    open ? <button onClick={onReauth}>Xác thực lại</button> : null,
}));

vi.mock('../../hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    pullDistance: 0,
    isRefreshing: false,
    progress: 0,
    handlers: {},
  }),
}));

vi.mock('../../hooks/useScrollPosition', () => ({
  useScrollPosition: () => ({ showScrollTop: false, scrollToTop: vi.fn() }),
}));

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderAppLayout() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <UIContext.Provider value={null}>
        <Routes>
          <Route path="*" element={<AppLayout />} />
        </Routes>
        <CurrentPath />
      </UIContext.Provider>
    </MemoryRouter>,
  );
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
});

describe('AppLayout session timeout', () => {
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
});
