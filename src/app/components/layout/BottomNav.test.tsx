import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { BottomNav } from './BottomNav';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('BottomNav', () => {
  it('marks the legacy current route and wraps keyboard navigation across tabs', () => {
    renderWithProviders(
      <UIContext.Provider value={null}>
        <>
          <BottomNav />
          <LocationProbe />
        </>
      </UIContext.Provider>,
      { routerProps: { initialEntries: ['/r/home'] } },
    );

    expect(screen.getByRole('button', { name: 'Trang chủ' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'Trang chủ' }), { key: 'ArrowLeft' });
    expect(screen.getByTestId('location')).toHaveTextContent('/r/profile');

    fireEvent.keyDown(screen.getByRole('button', { name: 'Tôi' }), { key: 'ArrowRight' });
    expect(screen.getByTestId('location')).toHaveTextContent('/r/home');
  });

  it('navigates to the raised trading action when activated', () => {
    renderWithProviders(
      <>
        <BottomNav />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/home'] } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Giao dịch' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/trade/btcusdt');
  });

  it('marks the matching tab for Web-prefixed routes rendered in the narrow Web shell', () => {
    renderWithProviders(<BottomNav />, { routerProps: { initialEntries: ['/w/markets'] } });

    expect(screen.getByRole('button', { name: 'Thị trường' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows pending rewards, ignores non-arrow keys and activates a regular tab', () => {
    renderWithProviders(
      <UIContext.Provider
        value={{
          isBalanceHidden: false,
          isOffline: false,
          pendingRewards: 3,
          notifications: 0,
          toggleBalanceHidden: () => {},
          setIsOffline: () => {},
          setPendingRewards: () => {},
        }}
      >
        <>
          <BottomNav />
          <LocationProbe />
        </>
      </UIContext.Provider>,
      { routerProps: { initialEntries: ['/home'] } },
    );

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(nav).getByText('3')).toBeInTheDocument();
    fireEvent.keyDown(within(nav).getByRole('button', { name: 'Giao d\u1ecbch' }), {
      key: 'Enter',
    });
    expect(screen.getByTestId('location')).toHaveTextContent('/home');

    fireEvent.click(within(nav).getAllByRole('button')[3]);
    expect(screen.getByTestId('location')).toHaveTextContent('/wallet');
  });
});
