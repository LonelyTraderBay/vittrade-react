import { describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { WebLoginPage } from './WebLoginPage';

function CurrentRoute() {
  const { pathname, state } = useLocation();
  return (
    <>
      <output data-testid="current-path">{pathname}</output>
      <output data-testid="current-route-state">{JSON.stringify(state)}</output>
    </>
  );
}

describe('WebLoginPage', () => {
  it('does not advertise social login without a configured provider contract', () => {
    renderWithProviders(<WebLoginPage />, {
      routerProps: { initialEntries: ['/w/auth/login'] },
    });

    expect(screen.queryByRole('button', { name: 'Google' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('routes backend MFA challenge to web OTP without authenticating first', async () => {
    const user = userEvent.setup();
    const challenge = {
      id: 'web-login-challenge-001',
      method: 'email' as const,
      maskedDestination: 'u***@example.com',
      expiresAt: '2099-01-01T00:05:00.000Z',
    };
    const login = vi.fn(async () => ({ status: 'mfa_required' as const, challenge }));
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentRoute />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: { ...testAuthAdapter, initialSession: null, login },
      },
    );

    await user.type(screen.getByTestId('auth-email'), 'user@example.com');
    await user.type(screen.getByTestId('auth-password'), 'secret-password');
    await user.click(screen.getByTestId('auth-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/otp'),
    );
    expect(JSON.parse(screen.getByTestId('current-route-state').textContent ?? 'null')).toEqual({
      challengeId: challenge.id,
      method: challenge.method,
      maskedDestination: challenge.maskedDestination,
      expiresAt: challenge.expiresAt,
    });
    expect(screen.getByTestId('current-route-state')).not.toHaveTextContent('secret-password');
  });

  it('does not route the legacy dev 2FA fixture directly to OTP', async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => ({
      status: 'authenticated' as const,
      session: testAuthAdapter.initialSession!,
    }));
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentRoute />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: { ...testAuthAdapter, initialSession: null, login },
      },
    );

    await user.type(screen.getByTestId('auth-email'), '2fa@test.com');
    await user.type(screen.getByTestId('auth-password'), 'password');
    await user.click(screen.getByTestId('auth-submit'));

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/w/home'));
    expect(login).toHaveBeenCalledWith({ email: '2fa@test.com', password: 'password' });
    expect(screen.queryByText('2fa@test.com')).not.toBeInTheDocument();
  });

  it('validates fields on submit and blur, and reveals or hides the password', async () => {
    const user = userEvent.setup();
    const login = vi.fn(testAuthAdapter.login);
    renderWithProviders(<WebLoginPage />, {
      routerProps: { initialEntries: ['/w/auth/login'] },
      authAdapter: { ...testAuthAdapter, initialSession: null, login },
    });

    await user.click(screen.getByTestId('auth-submit'));
    expect(screen.getByText('Vui lòng nhập email hoặc số điện thoại.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();

    const email = screen.getByTestId('auth-email');
    await user.type(email, 'invalid-email');
    fireEvent.blur(email);
    expect(screen.getByText('Định dạng email không hợp lệ')).toBeInTheDocument();
    await user.click(screen.getByTestId('auth-submit'));
    expect(screen.getAllByText('Định dạng email không hợp lệ')).toHaveLength(2);
    expect(login).not.toHaveBeenCalled();

    await user.clear(email);
    await user.type(email, 'user@example.com');
    await user.click(screen.getByTestId('auth-submit'));
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument();

    const password = screen.getByTestId('auth-password');
    await user.type(password, 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('navigates to password recovery', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentRoute />
      </>,
      { routerProps: { initialEntries: ['/w/auth/login'] } },
    );

    await user.click(screen.getByRole('button', { name: 'Quên mật khẩu?' }));
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/forgot-password'),
    );
  });

  it('routes the development device fixture to trust verification without invoking login', async () => {
    const user = userEvent.setup();
    const login = vi.fn(testAuthAdapter.login);
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentRoute />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: { ...testAuthAdapter, initialSession: null, login },
      },
    );

    await user.type(screen.getByTestId('auth-email'), 'device@test.com');
    await user.type(screen.getByTestId('auth-password'), 'password');
    await user.click(screen.getByTestId('auth-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/device-trust'),
    );
    expect(JSON.parse(screen.getByTestId('current-route-state').textContent ?? 'null')).toEqual({
      email: 'device@test.com',
      returnTo: '/w/home',
    });
    expect(login).not.toHaveBeenCalled();
  });

  it('locks the development fixture after five failed attempts without calling the backend', async () => {
    const user = userEvent.setup();
    const login = vi.fn(testAuthAdapter.login);
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentRoute />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: { ...testAuthAdapter, initialSession: null, login },
      },
    );
    await user.type(screen.getByTestId('auth-email'), 'wrong@test.com');
    await user.type(screen.getByTestId('auth-password'), 'incorrect');

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await user.click(screen.getByTestId('auth-submit'));
    }

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/account-locked'),
    );
    expect(
      JSON.parse(screen.getByTestId('current-route-state').textContent ?? 'null'),
    ).toMatchObject({ email: 'wrong@test.com', attempts: 5 });
    expect(login).not.toHaveBeenCalled();
  });

  it('reports backend failure and keeps the user on the login route', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentRoute />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: { ...testAuthAdapter, initialSession: null, login },
      },
    );
    await user.type(screen.getByTestId('auth-email'), 'user@example.com');
    await user.type(screen.getByTestId('auth-password'), 'incorrect');
    await user.click(screen.getByTestId('auth-submit'));

    expect(
      await screen.findByText('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
  });

  it('completes the demo login only through its development control', async () => {
    const user = userEvent.setup();
    const login = vi.fn(testAuthAdapter.login);
    renderWithProviders(
      <>
        <WebLoginPage />
        <CurrentRoute />
      </>,
      {
        routerProps: { initialEntries: ['/w/auth/login'] },
        authAdapter: { ...testAuthAdapter, initialSession: null, login },
      },
    );

    await user.click(screen.getByRole('button', { name: 'Trải nghiệm Demo' }));

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/w/home'));
    expect(login).toHaveBeenCalledWith({ email: 'demo@vittrade.vn', password: 'demo' });
  });
});
