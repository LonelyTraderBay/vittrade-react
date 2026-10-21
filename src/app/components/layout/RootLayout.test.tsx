import { act, fireEvent, render, screen } from '@testing-library/react';
import { lazy, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { RootLayout } from './RootLayout';
import { PreviewChromeSlot } from '@/shared/ui/layout/PreviewChromeSlot';

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
  it('moves one persistent preview control between shell hosts and unregisters on exit', () => {
    function PreviewControl({ portalHost }: { portalHost?: HTMLElement | null }) {
      const [count, setCount] = useState(0);
      const content = <button onClick={() => setCount(count + 1)}>Preview count {count}</button>;
      return portalHost ? createPortal(content, portalHost) : content;
    }
    function Page({ name, next }: { name: string; next: string }) {
      const navigate = useNavigate();
      return (
        <div data-testid={name}>
          <PreviewChromeSlot />
          <button onClick={() => navigate(next)}>Next page</button>
        </div>
      );
    }
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<RootLayout developmentPreviewControls={PreviewControl} />}>
            <Route path="home" element={<Page name="phone-host" next="/w/home" />} />
            <Route path="w/home" element={<Page name="web-host" next="/auth/login" />} />
            <Route path="auth/login" element={<p>Standalone form</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('phone-host')).toContainElement(
      screen.getByRole('button', { name: 'Preview count 0' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview count 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByTestId('web-host')).toContainElement(
      screen.getByRole('button', { name: 'Preview count 1' }),
    );
    expect(document.querySelectorAll('[data-preview-chrome-host]')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Standalone form')).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Preview count 1' })).toHaveLength(1);
    expect(document.querySelector('[data-preview-chrome-host]')).toBeNull();
  });

  it('adds no empty preview region when development controls are absent', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route
              path="*"
              element={
                <>
                  <PreviewChromeSlot />
                  <p>Product content</p>
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Product content')).toBeVisible();
    expect(document.querySelector('[data-preview-chrome-host]')).toBeNull();
  });

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
