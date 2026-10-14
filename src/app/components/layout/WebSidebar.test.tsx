import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import { WebSidebar } from './WebSidebar';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('WebSidebar', () => {
  it.each([
    { username: 'test-handle', email: undefined, name: 'test-handle' },
    { username: undefined, email: 'fallback@example.com', name: 'fallback@example.com' },
    { username: undefined, email: undefined, name: 'Tài khoản' },
  ])('uses $name for an account without a display name', ({ username, email, name }) => {
    const session = {
      ...testAuthSession,
      user: { ...testAuthSession.user, fullName: ' ', username, email },
    };
    renderWithProviders(
      <>
        <WebSidebar />
        <LocationProbe />
      </>,
      {
        authAdapter: {
          ...testAuthAdapter,
          initialSession: session,
          getSession: async () => session,
        },
        routerProps: { initialEntries: ['/w/home'] },
      },
    );
    fireEvent.click(screen.getByText(name).closest('button')!);
    expect(screen.getByTestId('location')).toHaveTextContent('/w/profile');
    fireEvent.click(screen.getByRole('button', { name: 'Ví' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/wallet');
  });

  it('shows the signed-out identity when the session is absent', () => {
    renderWithProviders(<WebSidebar />, {
      authAdapter: { ...testAuthAdapter, initialSession: null, getSession: async () => null },
    });
    expect(screen.getByText('Chưa đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText(testAuthSession.user.fullName)).not.toBeInTheDocument();
  });
  it('reveals and marks the active module route in the scrollable sidebar', () => {
    const scrollIntoView = vi.fn();
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView',
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    try {
      renderWithProviders(<WebSidebar />, {
        routerProps: { initialEntries: ['/w/arena'] },
      });

      const arenaButton = screen.getByRole('button', { name: 'Open Arena' });
      expect(arenaButton).toHaveAttribute('aria-current', 'page');
      expect(scrollIntoView).toHaveBeenCalledOnce();
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' });
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalDescriptor);
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
      }
    }
  });

  it('selects DCA instead of Home on the DCA route', () => {
    renderWithProviders(<WebSidebar />, {
      routerProps: { initialEntries: ['/w/dca'] },
    });

    expect(screen.getByRole('button', { name: 'DCA' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Trang chủ' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it.each([
    { pathname: '/w/profile/edit', currentItem: 'profile' },
    { pathname: '/w/profile/security', currentItem: 'Bảo mật' },
    { pathname: '/w/profile/settings', currentItem: 'Cài đặt' },
  ])('marks the matching profile navigation active at $pathname', ({ pathname, currentItem }) => {
    renderWithProviders(<WebSidebar />, { routerProps: { initialEntries: [pathname] } });

    const currentButton =
      currentItem === 'profile'
        ? screen.getByText(testAuthSession.user.fullName).closest('button')
        : screen.getByRole('button', { name: currentItem });
    expect(currentButton).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('button', { current: 'page' })).toHaveLength(1);
  });

  it('exposes and marks the standalone news route in the utility navigation', () => {
    renderWithProviders(
      <>
        <WebSidebar />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/home'] } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tin tức' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/news');
    expect(screen.getByRole('button', { name: 'Tin tức' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps the active market section expanded and follows web routes', () => {
    renderWithProviders(
      <>
        <WebSidebar />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/markets/overview'] } },
    );

    expect(screen.getByText('VitTrade')).toBeInTheDocument();
    expect(screen.getByText(testAuthSession.user.fullName)).toBeInTheDocument();
    expect(screen.queryByText('VitTrader Pro')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tổng quan' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Biến động' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/markets/movers');

    fireEvent.click(screen.getByRole('button', { name: /Thông báo/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/notifications');
  });

  it('does not show a fixture identity while the session is loading', () => {
    renderWithProviders(<WebSidebar />, {
      authAdapter: {
        ...testAuthAdapter,
        initialSession: undefined,
        getSession: () => new Promise(() => {}),
      },
    });

    expect(screen.getByText('Đang kiểm tra phiên đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('VitTrader Pro')).not.toBeInTheDocument();
    expect(screen.queryByText(/VIP 3/)).not.toBeInTheDocument();
  });
});
