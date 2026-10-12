import { lazy, type ComponentType, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { TabletShell } from './TabletShell';

const SuspendedPage = lazy(() => new Promise<{ default: ComponentType }>(() => {}));

function renderTablet(isOffline: boolean, child: ReactElement) {
  return renderWithProviders(
    <UIContext.Provider
      value={{
        isBalanceHidden: false,
        isOffline,
        pendingRewards: 0,
        notifications: 0,
        toggleBalanceHidden: () => {},
        setIsOffline: () => {},
        setPendingRewards: () => {},
      }}
    >
      <Routes>
        <Route element={<TabletShell />}>
          <Route path="/t/test" element={child} />
        </Route>
      </Routes>
    </UIContext.Provider>,
    { routerProps: { initialEntries: ['/t/test'] } },
  );
}

describe('TabletShell', () => {
  it('renders the tablet route without an offline banner when online', () => {
    renderTablet(false, <div>tablet route content</div>);

    expect(screen.getByText('tablet route content')).toBeInTheDocument();
    expect(screen.queryByText(/k.t n.i/)).not.toBeInTheDocument();
  });

  it('shows the offline banner while keeping tablet route content available', () => {
    renderTablet(true, <div>tablet route content</div>);

    expect(screen.getByText(/k.t n.i/)).toBeInTheDocument();
    expect(screen.getByText('tablet route content')).toBeInTheDocument();
  });

  it('shows the tablet loading fallback for a suspended route', () => {
    renderTablet(false, <SuspendedPage />);

    expect(screen.getByText(/t.i.../)).toBeInTheDocument();
  });
});
