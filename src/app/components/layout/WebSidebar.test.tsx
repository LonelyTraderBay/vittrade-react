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
