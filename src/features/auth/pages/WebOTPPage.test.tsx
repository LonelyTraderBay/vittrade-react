import { describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { ApiError } from '@/shared/api/api-error';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { WebOTPPage } from './WebOTPPage';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

const challengeState = {
  challengeId: 'web-login-challenge-001',
  method: 'email' as const,
  maskedDestination: 'u***@example.com',
  expiresAt: '9999-01-01T00:05:00.000Z',
};

function renderWebOTP(state: unknown, overrides: Partial<AuthAdapter> = {}) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/w/auth/otp" element={<WebOTPPage />} />
        <Route path="/w/auth/account-locked" element={<p>account locked route</p>} />
      </Routes>
      <CurrentPath />
    </>,
    {
      routerProps: { initialEntries: [{ pathname: '/w/auth/otp', state }] },
      authAdapter: { ...testAuthAdapter, initialSession: null, ...overrides },
    },
  );
}

describe('WebOTPPage login MFA challenge', () => {
  it('advances focus, supports keyboard navigation and verifies six entered digits', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.type(inputs[0], '1');
    expect(inputs[1]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(inputs[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await user.type(inputs[1], '2');
    expect(inputs[2]).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(inputs[1]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    await user.type(inputs[2], '3');
    await user.type(inputs[3], '4');
    await user.type(inputs[4], '5');
    await user.type(inputs[5], '6');

    await waitFor(() =>
      expect(verifyLoginMfa).toHaveBeenCalledWith({
        challengeId: challengeState.challengeId,
        code: '123456',
      }),
    );
  });

  it('shows the authenticator instructions and returns to login from a TOTP challenge', async () => {
    const user = userEvent.setup();
    renderWebOTP({ ...challengeState, method: 'totp', maskedDestination: undefined });

    expect(await screen.findByText('Ứng dụng xác thực')).toBeInTheDocument();
    expect(
      screen.getByText('Mở ứng dụng xác thực đã liên kết và nhập mã 6 số hiện tại.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
  });

  it('renders the server-masked SMS destination for a phone challenge', async () => {
    renderWebOTP({
      ...challengeState,
      method: 'sms',
      maskedDestination: '+1 415 •••• 0192',
    });

    expect(await screen.findByText('+1 415 •••• 0192')).toBeInTheDocument();
  });

  it('verifies using only challenge ID and code, then navigates home', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.click(inputs[0]);
    await user.paste('111111');

    await waitFor(() =>
      expect(verifyLoginMfa).toHaveBeenCalledWith({
        challengeId: challengeState.challengeId,
        code: '111111',
      }),
    );
    expect(await screen.findByText('Xác thực thành công!')).toBeInTheDocument();
  });

  it('keeps development registration OTP on its generic registration contract', async () => {
    const user = userEvent.setup();
    const verifyMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderWebOTP(
      { contact: 'new-user@example.com', type: 'email', purpose: 'register' },
      { verifyMfa },
    );

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.click(inputs[0]);
    await user.paste('111111');

    await waitFor(() =>
      expect(verifyMfa).toHaveBeenCalledWith({
        contact: 'new-user@example.com',
        code: '111111',
        purpose: 'register',
      }),
    );
    expect(await screen.findByText('Xác thực thành công!')).toBeInTheDocument();
  });

  it.each([
    ['missing', null],
    ['expired', { ...challengeState, expiresAt: '2000-01-01T00:00:00.000Z' }],
  ])('returns a %s login challenge to login without verifying', async (_, state) => {
    const verifyLoginMfa = vi.fn();
    renderWebOTP(state, { verifyLoginMfa });

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login'),
    );
    expect(verifyLoginMfa).not.toHaveBeenCalled();
  });

  it('keeps an invalid code on OTP and never navigates into the app', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('invalid code', { status: 400 }));
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.click(inputs[0]);
    await user.paste('111111');

    await waitFor(() => expect(verifyLoginMfa).toHaveBeenCalled(), { timeout: 5_000 });
    expect(
      await screen.findByText('Mã xác thực không đúng. Vui lòng kiểm tra lại.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/otp');
  });

  it.each([
    ['expired', 410, '/w/auth/login'],
    ['temporary', 503, '/w/auth/otp'],
  ])('handles a %s server response without authenticating', async (_case, status, expectedPath) => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi
      .fn()
      .mockRejectedValue(new ApiError('verification failed', { status }));
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.click(inputs[0]);
    await user.paste('111111');

    await waitFor(() => expect(verifyLoginMfa).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent(expectedPath));
    if (status === 503) {
      expect(screen.getByText('Không thể xác minh lúc này. Vui lòng thử lại.')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Quay lại đăng nhập để thử lại' }));
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
    }
  });

  it('returns to login when the challenge expires while the OTP page is open', async () => {
    vi.useFakeTimers();
    try {
      const verifyLoginMfa = vi.fn();
      renderWebOTP(
        { ...challengeState, expiresAt: new Date(Date.now() + 250).toISOString() },
        { verifyLoginMfa },
      );

      await act(async () => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
      expect(verifyLoginMfa).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns a locked account to the account-locked route', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('locked', { status: 423 }));
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.click(inputs[0]);
    await user.paste('111111');

    await waitFor(() =>
      expect(verifyLoginMfa).toHaveBeenCalledWith({
        challengeId: challengeState.challengeId,
        code: '111111',
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/account-locked'),
    );
  });

  it('explains rate limits without labeling the code invalid', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('limited', { status: 429 }));
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.click(inputs[0]);
    await user.paste('111111');

    await waitFor(() =>
      expect(verifyLoginMfa).toHaveBeenCalledWith({
        challengeId: challengeState.challengeId,
        code: '111111',
      }),
    );

    expect(await screen.findByText(/Quá nhiều lần xác thực/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Quay lại đăng nhập để thử lại' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Mã xác thực không đúng/)).not.toBeInTheDocument();
  });
});
