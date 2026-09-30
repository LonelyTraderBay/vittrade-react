import { render, screen } from '@testing-library/react';
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
  PlatformSwitcher: () => <div data-testid="platform-switcher" />,
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
