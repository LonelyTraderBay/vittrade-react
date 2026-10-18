import { lazy, type ComponentType, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { TabletShell } from './TabletShell';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { Header } from '@/shared/ui/layout/Header';
import { StickyFooter } from '@/shared/ui/layout/PageLayout';

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
  it('owns the horizontal gutter and aligns shared page layout primitives', () => {
    renderTablet(
      false,
      <>
        <Header title="Tablet gutter" />
        <PageContent>
          <p>Tablet content</p>
        </PageContent>
        <StickyFooter>
          <button type="button">Tablet action</button>
        </StickyFooter>
      </>,
    );

    const pageContent = screen.getByText('Tablet content').parentElement;
    const shellContent = pageContent?.parentElement;
    const header = screen.getByRole('heading', { name: 'Tablet gutter' }).parentElement
      ?.parentElement;
    const footer = screen.getByRole('button', { name: 'Tablet action' }).parentElement;

    expect(shellContent?.style.padding).toBe('0px 24px');
    expect(shellContent?.style.getPropertyValue('--tr-page-inline-gutter')).toBe('0px');
    expect(pageContent?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
    expect(header?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
    expect(footer?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
  });

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
