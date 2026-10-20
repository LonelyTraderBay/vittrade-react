import { act, render, screen } from '@testing-library/react';
import { lazy, type ComponentType } from 'react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RootLayout } from './RootLayout';

vi.mock('../../contexts/AppContext', () => ({
  AppProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../mobile/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('./MobileFrame', () => ({
  MobileFrame: ({ children }: { children: ReactNode }) => (
    <div data-testid="mobile-frame">{children}</div>
  ),
}));

vi.mock('@/shared/ui/ThemedToaster', () => ({
  ThemedToaster: () => <div data-testid="themed-toaster" />,
}));

vi.mock('./PlatformSwitcher', () => ({
  PlatformSwitcher: ({ previewControlsVisible }: { previewControlsVisible: boolean }) => (
    <div data-testid="platform-switcher" data-preview-controls-visible={previewControlsVisible} />
  ),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="*" element={<div>Route content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RootLayout platform shells', () => {
  it('shows a lightweight loading status while a route chunk is pending', () => {
    const LazyRoute = lazy(() => new Promise<{ default: ComponentType }>(() => undefined));

    render(
      <MemoryRouter initialEntries={['/w/home']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="*" element={<LazyRoute />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status', { name: 'Đang tải trang' })).toBeInTheDocument();
    expect(screen.getByText('Đang tải…')).toBeInTheDocument();
  });

  it('renders the development control supplied by route composition', () => {
    const PreviewControl = () => <div data-testid="preview-control-stub">Mock controls</div>;
    render(
      <MemoryRouter initialEntries={['/w/home']}>
        <Routes>
          <Route element={<RootLayout developmentPreviewControls={PreviewControl} />}>
            <Route path="*" element={<div>Route content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('preview-control-stub')).toHaveTextContent('Mock controls');
    expect(screen.getByTestId('platform-switcher')).toHaveAttribute(
      'data-preview-controls-visible',
      'true',
    );
  });

  it('keeps the regular platform badge placement when no development controls are supplied', () => {
    renderAt('/w/home');

    expect(screen.getByTestId('platform-switcher')).toHaveAttribute(
      'data-preview-controls-visible',
      'false',
    );
  });

  it.each([
    ['/home', 390, true],
    ['/r/home', 767, true],
    ['/r/home', 768, true],
    ['/r/home', 1023, true],
    ['/r/home', 1024, false],
    ['/w/home', 390, true],
    ['/w/home', 1440, false],
    ['/t/home', 768, false],
  ])('reports actual shell navigation at %s, width %i', (path, width, expected) => {
    const previousWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    const PreviewControl = ({ bottomNavigationVisible }: { bottomNavigationVisible?: boolean }) => (
      <output data-testid="preview-navigation">{String(bottomNavigationVisible)}</output>
    );
    const view = render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RootLayout developmentPreviewControls={PreviewControl} />}>
            <Route path="*" element={<div>Route content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    try {
      expect(screen.getByTestId('preview-navigation')).toHaveTextContent(String(expected));
      if (path === '/r/home' && width === 768) {
        act(() => {
          Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
          window.dispatchEvent(new Event('resize'));
        });
        expect(screen.getByTestId('preview-navigation')).toHaveTextContent('false');
      }
    } finally {
      view.unmount();
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: previousWidth });
    }
  });

  it.each(['/home', '/markets'])('wraps phone route %s in MobileFrame', (path) => {
    renderAt(path);

    expect(screen.getByTestId('mobile-frame')).toHaveTextContent('Route content');
  });

  it.each(['/t/home', '/w/home', '/r/home', '/auth/login', '/onboarding/start'])(
    'renders route %s without the phone frame',
    (path) => {
      renderAt(path);

      expect(screen.getByText('Route content')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-frame')).not.toBeInTheDocument();
    },
  );
});
