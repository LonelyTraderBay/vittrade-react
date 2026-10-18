import { describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { ApiError } from '@/shared/api/api-error';
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
  it.each(['/auth/login', '/t/auth/login', '/r/auth/login'])(
    'routes a server-locked account to the matching shell without inventing an expiry at %s',
    async (path) => {
      const user = userEvent.setup();
      const login = vi
        .fn()
        .mockRejectedValue(new ApiError('private server detail', { status: 423 }));
      renderWithProviders(
        <>
          <LoginPage />
          <CurrentPath />
          <CurrentRouteState />
        </>,
        { routerProps: { initialEntries: [path] }, authAdapter: createAuthAdapter(login) },
      );
      await user.type(screen.getByTestId('auth-email'), 'locked@example.com');
      await user.type(screen.getByTestId('auth-password'), 'password');
      await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

      await waitFor(() =>
        expect(screen.getByTestId('current-path')).toHaveTextContent(
          path.replace('/login', '/account-locked'),
        ),
      );
      expect(screen.getByTestId('current-route-state')).toHaveTextContent('null');
      expect(screen.queryByText('private server detail')).not.toBeInTheDocument();
      expect(login).toHaveBeenCalledTimes(1);
    },
  );

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

    expect(screen.getByText('Vui lòng nhập email.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it.each(['/auth/login', '/t/auth/login', '/r/auth/login'])(
    'validates email and password with Enter before sending a request at %s',
    async (path) => {
      const user = userEvent.setup();
      const login = vi.fn(async () => ({
        status: 'authenticated' as const,
        session: testAuthSession,
      }));
      renderWithProviders(<LoginPage />, {
        routerProps: { initialEntries: [path] },
        authAdapter: createAuthAdapter(login),
      });
      const email = screen.getByTestId('auth-email');

      await user.click(email);
      await user.keyboard('{Enter}');
      expect(screen.getByText('Vui lòng nhập email.')).toBeInTheDocument();

      await user.type(email, 'user@example.com');
      await user.keyboard('{Enter}');
      expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument();
      expect(login).not.toHaveBeenCalled();
    },
  );

  it('associates malformed email feedback with the email field and does not call the adapter', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => ({
      status: 'authenticated' as const,
      session: testAuthSession,
    }));
    renderWithProviders(<LoginPage />, { authAdapter: createAuthAdapter(login) });
    const email = screen.getByTestId('auth-email');

    await user.type(email, 'invalid-email');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Định dạng email không hợp lệ')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-describedby', 'input-email-error');
    expect(email.parentElement?.getAttribute('style')).toContain(
      'border: 1.5px solid var(--input-border-error)',
    );
    expect(login).not.toHaveBeenCalled();

    await user.clear(email);
    await user.type(email, 'user@example.com');
    expect(screen.queryByText('Định dạng email không hợp lệ')).not.toBeInTheDocument();
  });

  it.each([
    ['/auth/login', '/home'],
    ['/t/auth/login', '/t/home'],
    ['/r/auth/login', '/r/home'],
  ])('submits once with Enter from Email at %s', async (path, destination) => {
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
        routerProps: { initialEntries: [path] },
        authAdapter: createAuthAdapter(login),
      },
    );
    const email = screen.getByTestId('auth-email');

    await user.type(email, 'user@example.com');
    await user.type(screen.getByTestId('auth-password'), 'correct-password');
    await user.click(email);
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent(destination));
    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'correct-password' });
  });

  it('exposes the identity field with the email-only contract name', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByTestId('auth-email')).toHaveAccessibleName('Email');
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

  it('submits credentials on Enter and ignores other password-field keys', async () => {
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
        routerProps: { initialEntries: ['/auth/login'] },
        authAdapter: createAuthAdapter(login),
      },
    );

    await user.type(screen.getByTestId('auth-email'), 'user@example.com');
    await user.type(screen.getByTestId('auth-password'), 'valid-secret');
    await user.keyboard('{Escape}');
    expect(login).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'valid-secret' });
      expect(screen.getByTestId('current-path')).toHaveTextContent('/home');
    });
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
