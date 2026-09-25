import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from '@/shared/theme/ThemeContext';
import { AuthLayout } from './AuthLayout';

describe('AuthLayout', () => {
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

    act(() => vi.advanceTimersByTime(60_000));

    expect(screen.getByText('09:06')).toBeInTheDocument();
  });
});
