import { lazy, useState, type ComponentType } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { ResponsiveAppLayout } from './ResponsiveShell';
import { PageContent } from '@/shared/ui/layout/PageContent';

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

function DraftPage() {
  const [draft, setDraft] = useState('');
  return (
    <input
      aria-label="Registration draft"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  );
}

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
});

describe('ResponsiveAppLayout', () => {
  it.each([
    { width: 1280, desktopMode: 'adaptive' as const, padding: '0px 24px', owner: '0px' },
    { width: 900, desktopMode: 'adaptive' as const, padding: '0px 16px', owner: '0px' },
    { width: 390, desktopMode: 'adaptive' as const, padding: '', owner: '' },
    { width: 1280, desktopMode: 'centered' as const, padding: '', owner: '' },
  ])(
    'uses one gutter owner at $width px in $desktopMode mode',
    ({ width, desktopMode, padding, owner }) => {
      setWidth(width);
      renderWithProviders(
        <Routes>
          <Route element={<ResponsiveAppLayout desktopMode={desktopMode} />}>
            <Route
              path="/r/layout"
              element={
                <PageContent className="responsive-gutter-probe">
                  <p>Responsive page content</p>
                </PageContent>
              }
            />
          </Route>
        </Routes>,
        { routerProps: { initialEntries: ['/r/layout'] } },
      );

      const pageContent = screen.getByText('Responsive page content').parentElement;
      const shellContent = pageContent?.parentElement;

      expect(shellContent?.style.padding).toBe(padding);
      expect(shellContent?.style.getPropertyValue('--tr-page-inline-gutter')).toBe(owner);
      expect(pageContent?.style.paddingInline).toBe('var(--tr-page-inline-gutter, 20px)');
    },
  );

  it.each(['adaptive', 'centered'] as const)(
    'preserves the route form and DOM identity across breakpoint changes in %s mode',
    (desktopMode) => {
      setWidth(1280);
      renderWithProviders(
        <Routes>
          <Route element={<ResponsiveAppLayout desktopMode={desktopMode} />}>
            <Route path="/r/auth/register" element={<DraftPage />} />
          </Route>
        </Routes>,
        { routerProps: { initialEntries: ['/r/auth/register'] } },
      );
      const input = screen.getByRole('textbox', { name: 'Registration draft' });
      fireEvent.change(input, { target: { value: 'Unsaved registration' } });
      for (const width of [1, 390, 900, 1280]) {
        setWidth(width);
        fireEvent.resize(window);
        expect(screen.getByRole('textbox', { name: 'Registration draft' })).toBe(input);
        expect(input).toHaveValue('Unsaved registration');
      }
    },
  );

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
