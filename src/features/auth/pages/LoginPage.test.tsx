import { describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { LoginPage } from './LoginPage';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

function CurrentRouteState() {
  const { state } = useLocation();
  return <output data-testid="current-route-state">{JSON.stringify(state)}</output>;
}

function createAuthAdapter(
  login: AuthAdapter['login'] = async () => ({
    status: 'authenticated',
    session: testAuthSession,
  }),
): AuthAdapter {
  return { ...testAuthAdapter, initialSession: null, login };
}

describe('auth LoginPage', () => {
  it('validates required credentials before calling the session adapter', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => ({
      status: 'authenticated' as const,
      session: testAuthSession,
    }));
    renderWithProviders(<LoginPage />, {
      routerProps: { initialEntries: ['/auth/login'] },
      authAdapter: createAuthAdapter(login),
    });

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(screen.getByText('Vui lòng nhập email hoặc số điện thoại.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('requires a password after an email has been entered', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => ({
      status: 'authenticated' as const,
      session: testAuthSession,
    }));
    renderWithProviders(<LoginPage />, { authAdapter: createAuthAdapter(login) });

    await user.type(screen.getByTestId('auth-email'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('toggles password visibility and follows the forgot-password and registration routes', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LoginPage />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/w/auth/login'] } },
    );
    const password = screen.getByTestId('auth-password');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Quên mật khẩu?' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/forgot-password');
  });

  it('submits credentials, reports failure and allows a later login attempt', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => ({
      status: 'authenticated' as const,
      session: testAuthSession,
    }));
    login.mockRejectedValueOnce(new Error('invalid credentials'));
    renderWithProviders(
      <>
        <LoginPage />
        <CurrentPath />
      </>,
      {
        routerProps: { initialEntries: ['/auth/login'] },
        authAdapter: createAuthAdapter(login),
      },
    );

    await user.type(screen.getByTestId('auth-email'), 'user@example.com');
    await user.type(screen.getByTestId('auth-password'), 'bad-secret');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.',
    );
    expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'bad-secret' });

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/home'));
    expect(login).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('routes a backend MFA challenge to phone OTP without copying credentials into route state', async () => {
    const user = userEvent.setup();
    const challenge = {
      id: 'login-challenge-001',
      method: 'totp' as const,
      maskedDestination: 'u***@example.com',
      expiresAt: '2099-01-01T00:05:00.000Z',
    };
    const login = vi.fn(async () => ({ status: 'mfa_required' as const, challenge }));
    renderWithProviders(
      <>
        <LoginPage />
        <CurrentPath />
        <CurrentRouteState />
      </>,
      {
        routerProps: { initialEntries: ['/auth/login'] },
        authAdapter: createAuthAdapter(login),
      },
    );

    await user.type(screen.getByTestId('auth-email'), 'user@example.com');
    await user.type(screen.getByTestId('auth-password'), 'secret-password');
    await user.click(screen.getByTestId('auth-submit'));

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/otp'));
    expect(JSON.parse(screen.getByTestId('current-route-state').textContent ?? 'null')).toEqual({
      challengeId: challenge.id,
      method: challenge.method,
      maskedDestination: challenge.maskedDestination,
      expiresAt: challenge.expiresAt,
    });
    expect(screen.getByTestId('current-route-state')).not.toHaveTextContent('secret-password');
  });

  it('submits from Enter and exposes the demo sign-in only in test mode', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => ({
      status: 'authenticated' as const,
      session: testAuthSession,
    }));
    renderWithProviders(
      <>
        <LoginPage />
        <CurrentPath />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: createAuthAdapter(login),
      },
    );

    expect(screen.getByRole('button', { name: 'Đăng nhập Demo' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đăng nhập Demo' }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'demo@vittrade.vn', password: 'demo' }),
    );
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/home');
  });

  it('routes registration within the active shell', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <LoginPage />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/t/auth/login'] } },
    );

    await user.click(screen.getByRole('button', { name: 'Đăng ký ngay' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/t/auth/register');
  });
});
