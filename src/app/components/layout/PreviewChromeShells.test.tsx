import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PreviewChromeContext } from '@/shared/ui/layout/preview-chrome-context';
import { AuthLayout } from './AuthLayout';
import { ResponsiveAppLayout } from './ResponsiveShell';
import { TabletShell } from './TabletShell';
import { WebShell } from './WebShell';

const shells = [
  { prefix: '/t', Shell: TabletShell, nativeAuth: true },
  { prefix: '/w', Shell: WebShell, nativeAuth: false },
  { prefix: '/r', Shell: ResponsiveAppLayout, nativeAuth: true },
];

describe('Shared preview chrome placement', () => {
  it.each(shells)('reserves one normal-route host inside $prefix shell', ({ prefix, Shell }) => {
    const hosts: (HTMLElement | null)[] = [];
    renderWithProviders(
      <PreviewChromeContext.Provider value={(host) => hosts.push(host)}>
        <Routes>
          <Route path={prefix} element={<Shell />}>
            <Route path="probe" element={<input aria-label="Page draft" defaultValue="draft" />} />
          </Route>
        </Routes>
      </PreviewChromeContext.Provider>,
      { routerProps: { initialEntries: [`${prefix}/probe`] } },
    );

    const elements = document.querySelectorAll('[data-preview-chrome-host]');
    expect(elements).toHaveLength(1);
    const host = elements[0] as HTMLElement;
    expect(hosts).toContain(host);
    expect(host).toHaveClass('shrink-0');
    expect(host.nextElementSibling).toContainElement(screen.getByLabelText('Page draft'));
    expect(screen.getByLabelText('Page draft')).toHaveValue('draft');
  });

  it.each(shells)(
    'keeps only the existing Auth host inside $prefix shell',
    ({ prefix, Shell, nativeAuth }) => {
      const hosts: (HTMLElement | null)[] = [];
      const input = <input aria-label="Auth draft" defaultValue="unchanged" />;
      renderWithProviders(
        <PreviewChromeContext.Provider value={(host) => hosts.push(host)}>
          <Routes>
            <Route path={prefix} element={<Shell />}>
              {nativeAuth ? (
                <Route path="auth" element={<AuthLayout />}>
                  <Route path="login" element={input} />
                </Route>
              ) : (
                <Route path="auth/login" element={input} />
              )}
            </Route>
          </Routes>
        </PreviewChromeContext.Provider>,
        { routerProps: { initialEntries: [`${prefix}/auth/login`] } },
      );

      const elements = document.querySelectorAll('[data-preview-chrome-host]');
      expect(elements).toHaveLength(1);
      expect(hosts).toContain(elements[0]);
      expect(screen.getByLabelText('Auth draft')).toHaveValue('unchanged');
    },
  );

  it.each(shells)(
    'adds no preview DOM without injection inside $prefix shell',
    ({ prefix, Shell }) => {
      renderWithProviders(
        <Routes>
          <Route path={prefix} element={<Shell />}>
            <Route path="probe" element={<p>Production-shaped content</p>} />
          </Route>
        </Routes>,
        { routerProps: { initialEntries: [`${prefix}/probe`] } },
      );

      expect(document.querySelector('[data-preview-chrome-host]')).toBeNull();
      expect(screen.getByText('Production-shaped content')).toBeVisible();
    },
  );
});
