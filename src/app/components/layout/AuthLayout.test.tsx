import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { AuthLayout } from './AuthLayout';
import { PreviewChromeContext } from '@/shared/ui/layout/preview-chrome-context';

describe('AuthLayout', () => {
  it('registers preview chrome outside the form scroller only when enabled', () => {
    const register = vi.fn();
    const view = render(
      <ThemeProvider>
        <PreviewChromeContext.Provider value={register}>
          <MemoryRouter initialEntries={['/auth/login']}>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route
                  path="/auth/login"
                  element={<input aria-label="Auth draft" defaultValue="draft" />}
                />
              </Route>
            </Routes>
          </MemoryRouter>
        </PreviewChromeContext.Provider>
      </ThemeProvider>,
    );
    const host = document.querySelector('[data-preview-chrome-host]');
    expect(register).toHaveBeenCalledWith(host);
    expect(host?.nextElementSibling).toContainElement(screen.getByLabelText('Auth draft'));
    expect(screen.getByLabelText('Auth draft')).toHaveValue('draft');
    view.unmount();
    expect(register).toHaveBeenLastCalledWith(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders its child route and updates the status bar clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 1, 9, 5));

    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/auth/login']}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<div>Login form</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByText('Login form')).toBeInTheDocument();
    expect(screen.getByText('09:05')).toBeInTheDocument();
    expect(document.querySelector('[data-preview-chrome-host]')).toBeNull();

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByText('09:06')).toBeInTheDocument();
  });
});
