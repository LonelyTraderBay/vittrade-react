import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { TabletTopBar } from './TabletTopBar';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderTabletTopBar({
  initialEntry = '/t/markets/trade',
  notifications = 0,
}: {
  initialEntry?: string;
  notifications?: number;
} = {}) {
  return renderWithProviders(
    <UIContext.Provider
      value={{
        isBalanceHidden: false,
        isOffline: false,
        pendingRewards: 0,
        notifications,
        toggleBalanceHidden: () => {},
        setIsOffline: () => {},
        setPendingRewards: () => {},
      }}
    >
      <>
        <TabletTopBar />
        <LocationProbe />
      </>
    </UIContext.Provider>,
    { routerProps: { initialEntries: [initialEntry] } },
  );
}

describe('TabletTopBar', () => {
  it('navigates to a parent breadcrumb and leaves the current breadcrumb in place', () => {
    renderTabletTopBar();

    const [parentCrumb, currentCrumb] = screen.getAllByRole('button');
    expect(screen.getByTestId('location')).toHaveTextContent('/t/markets/trade');

    fireEvent.click(currentCrumb);
    expect(screen.getByTestId('location')).toHaveTextContent('/t/markets/trade');

    fireEvent.click(parentCrumb);
    expect(screen.getByTestId('location')).toHaveTextContent('/t/markets');
  });

  it('routes search, notifications and profile quick actions', () => {
    renderTabletTopBar({ initialEntry: '/t/home' });

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(screen.getByTestId('location')).toHaveTextContent('/t/search');

    fireEvent.click(buttons[2]);
    expect(screen.getByTestId('location')).toHaveTextContent('/t/notifications');

    fireEvent.click(buttons[3]);
    expect(screen.getByTestId('location')).toHaveTextContent('/t/profile');
  });

  it.each([
    { count: 0, badge: null },
    { count: 3, badge: '3' },
    { count: 10, badge: '9+' },
  ])('renders the unread count $count as $badge', ({ count, badge }) => {
    renderTabletTopBar({ notifications: count });

    if (badge === null) {
      expect(screen.queryByText(/^\d+\+?$/)).not.toBeInTheDocument();
    } else {
      expect(screen.getByText(badge)).toBeInTheDocument();
    }
  });

  it('falls back to the product label and hides a non-numeric notification count', () => {
    renderTabletTopBar({
      initialEntry: '/t/unmapped-route',
      notifications: 'unavailable' as unknown as number,
    });

    expect(screen.getByText('VitTrade')).toBeInTheDocument();
    expect(screen.queryByText(/^\d+\+?$/)).not.toBeInTheDocument();
  });
});
