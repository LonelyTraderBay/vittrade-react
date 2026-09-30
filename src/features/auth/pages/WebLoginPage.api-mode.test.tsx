import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/config/env', async () => {
  const actual = await vi.importActual<typeof import('@/shared/config/env')>('@/shared/config/env');
  return {
    ...actual,
    env: {
      ...actual.env,
      mode: 'development',
      dataSource: 'api',
      isDev: true,
      isTest: false,
      isStaging: false,
      isProd: false,
    },
  };
});

import { useLocation } from 'react-router';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { WebLoginPage } from './WebLoginPage';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

describe('WebLoginPage in development API mode', () => {
  it('does not offer mock demo controls or list mock credentials', () => {
    renderWithProviders(<WebLoginPage />, {
      routerProps: { initialEntries: ['/w/auth/login'] },
    });

    expect(screen.queryByRole('button', { name: 'Trải nghiệm Demo' })).not.toBeInTheDocument();
    expect(screen.queryByText('Demo flows:')).not.toBeInTheDocument();
    expect(screen.queryByText(/developer@vittrade\.local/)).not.toBeInTheDocument();
    expect(screen.queryByText(/wrong@test\.com/)).not.toBeInTheDocument();
  });

  it.each(['wrong@test.com', 'device@test.com'])(
    'sends the development-only %s credential to the configured auth adapter',
    async (email) => {
      const user = userEvent.setup();
      const login = vi.fn().mockRejectedValue(new Error('API offline'));
      renderWithProviders(
        <>
          <WebLoginPage />
          <CurrentPath />
        </>,
        {
          routerProps: { initialEntries: ['/w/auth/login'] },
          authAdapter: { ...testAuthAdapter, initialSession: null, login },
        },
      );

      await user.type(screen.getByTestId('auth-email'), email);
      await user.type(screen.getByTestId('auth-password'), 'password');
      await user.click(screen.getByTestId('auth-submit'));

      await waitFor(() => expect(login).toHaveBeenCalledWith({ email, password: 'password' }));
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Không thể đăng nhập lúc này. Vui lòng thử lại.',
      );
    },
  );

  it('keeps a failed login recoverable after a transport error', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentPath />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: { ...testAuthAdapter, initialSession: null, login },
      },
    );

    await user.type(screen.getByTestId('auth-email'), 'developer@example.com');
    await user.type(screen.getByTestId('auth-password'), 'password');
    await user.click(screen.getByTestId('auth-submit'));

    const submit = screen.getByTestId('auth-submit');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể đăng nhập lúc này. Vui lòng thử lại.',
    );
    expect(submit).toBeEnabled();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');

    await user.click(submit);
    await waitFor(() => expect(login).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(submit).toBeEnabled());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể đăng nhập lúc này. Vui lòng thử lại.',
    );
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
  });
});
