import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { BottomNav } from './BottomNav';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('BottomNav', () => {
  it('marks the legacy current route and wraps keyboard navigation across tabs', () => {
    renderWithProviders(
      <>
        <BottomNav />
        <LocationProbe />
      </>,
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
});
