import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { TabletSidebar } from './TabletSidebar';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('TabletSidebar', () => {
  it('expands accessibly and routes tablet navigation within its shell', () => {
    renderWithProviders(
      <UIContext.Provider
        value={{
          isBalanceHidden: false,
          isOffline: false,
          pendingRewards: 0,
          notifications: 3,
          toggleBalanceHidden: () => {},
          setIsOffline: () => {},
          setPendingRewards: () => {},
        }}
      >
        <>
          <TabletSidebar />
          <LocationProbe />
        </>
      </UIContext.Provider>,
      { routerProps: { initialEntries: ['/t/markets/overview'] } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng' }));
    expect(screen.getByText('Chính')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ví' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/t/wallet');
    expect(screen.getByText('3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Th.ng b.o/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/t/notifications');

    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }));
    expect(screen.getByRole('button', { name: 'Mở rộng' })).toBeInTheDocument();
  });
});
