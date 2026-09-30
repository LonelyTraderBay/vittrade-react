import { describe, expect, it } from 'vitest';
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
