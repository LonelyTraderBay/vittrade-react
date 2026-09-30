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

import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { LoginPage } from './LoginPage';

describe('LoginPage in development API mode', () => {
  it('does not offer the mock demo login and submits entered credentials to the auth adapter', async () => {
    const user = userEvent.setup();
    const login = vi.fn(testAuthAdapter.login);
    renderWithProviders(<LoginPage />, {
      authAdapter: { ...testAuthAdapter, initialSession: null, login },
    });

    expect(screen.queryByRole('button', { name: 'Đăng nhập Demo' })).not.toBeInTheDocument();

    await user.type(screen.getByTestId('auth-email'), 'user@example.com');
    await user.type(screen.getByTestId('auth-password'), 'password');
    await user.click(screen.getByTestId('auth-submit'));

    expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password' });
  });
});
