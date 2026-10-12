import { lazy, type ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { ResponsiveAppLayout } from './ResponsiveShell';

const originalWidth = window.innerWidth;

function contextValue(isOffline: boolean) {
  return {
    isBalanceHidden: false,
    isOffline,
    pendingRewards: 0,
    notifications: 0,
    toggleBalanceHidden: () => {},
    setIsOffline: () => {},
    setPendingRewards: () => {},
  };
}

const SuspendedPage = lazy(() => new Promise<{ default: ComponentType }>(() => {}));

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
});

describe('ResponsiveAppLayout', () => {
  it('switches from the phone shell to the adaptive desktop shell on resize', () => {
    setWidth(390);
    const view = renderWithProviders(<ResponsiveAppLayout />);

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    setWidth(1024);
    fireEvent.resize(window);

    expect(screen.getByText('VitTrade Desktop')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
    view.unmount();
  });

  it('keeps the centered phone-like shell on wide desktop screens when requested', () => {
    setWidth(1280);
    const { container } = renderWithProviders(<ResponsiveAppLayout desktopMode="centered" />);

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(container.querySelector('[style*="width: 480px"]')).toBeInTheDocument();
  });
  it('uses the tablet shell when the width is in the tablet range', () => {
    setWidth(900);
    renderWithProviders(
      <UIContext.Provider value={contextValue(false)}>
        <ResponsiveAppLayout />
      </UIContext.Provider>,
    );

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('shows the offline indicator in the tablet shell', () => {
    setWidth(900);
    renderWithProviders(
      <UIContext.Provider value={contextValue(true)}>
        <ResponsiveAppLayout />
      </UIContext.Provider>,
    );

    expect(screen.getByText(/M.t k.t n.i/)).toBeInTheDocument();
  });

  it('shows the offline indicator in desktop adaptive mode', () => {
    setWidth(1024);
    renderWithProviders(
      <UIContext.Provider value={contextValue(true)}>
        <ResponsiveAppLayout desktopMode="adaptive" />
      </UIContext.Provider>,
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('shows the offline indicator in desktop centered mode', () => {
    setWidth(1280);
    renderWithProviders(
      <UIContext.Provider value={contextValue(true)}>
        <ResponsiveAppLayout desktopMode="centered" />
      </UIContext.Provider>,
    );

    expect(screen.getByText(/M.t k.t n.i/)).toBeInTheDocument();
  });

  it('shows the offline indicator in mobile mode', () => {
    setWidth(390);
    renderWithProviders(
      <UIContext.Provider value={contextValue(true)}>
        <ResponsiveAppLayout />
      </UIContext.Provider>,
    );

    expect(screen.getByText(/M.t k.t n.i/)).toBeInTheDocument();
  });

  it('renders the loading fallback for a suspended responsive route', () => {
    setWidth(390);
    renderWithProviders(
      <Routes>
        <Route element={<ResponsiveAppLayout />}>
          <Route path="/r/loading" element={<SuspendedPage />} />
        </Route>
      </Routes>,
      { routerProps: { initialEntries: ['/r/loading'] } },
    );

    expect(screen.getByText(/t.i.../)).toBeInTheDocument();
  });
});
