import { describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { ApiError } from '@/shared/api/api-error';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { OTPPage } from './OTPPage';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

const challengeState = {
  challengeId: 'phone-login-challenge-001',
  method: 'totp' as const,
  expiresAt: '2099-01-01T00:05:00.000Z',
};

function renderOTP(state: unknown, overrides: Partial<AuthAdapter> = {}) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/auth/otp" element={<OTPPage />} />
        <Route path="/auth/register" element={<p>register route</p>} />
      </Routes>
      <CurrentPath />
    </>,
    {
      routerProps: { initialEntries: [{ pathname: '/auth/otp', state }] },
      authAdapter: { ...testAuthAdapter, initialSession: null, ...overrides },
    },
  );
}

describe('OTPPage login MFA challenge', () => {
  it('keeps generic registration verification in the development flow', async () => {
    const user = userEvent.setup();
    const verifyMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderOTP({ contact: 'new-user@example.com', purpose: 'register' }, { verifyMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    await waitFor(() =>
      expect(verifyMfa).toHaveBeenCalledWith({
        contact: 'new-user@example.com',
        code: '111111',
        purpose: 'register',
      }),
    );
  });

  it('replaces the fake resend timer with a return to the development registration route', async () => {
    const user = userEvent.setup();
    renderOTP({ contact: 'new-user@example.com', purpose: 'register' });

    expect(
      screen.getByText('Không nhận được mã? Hãy quay lại đăng ký để bắt đầu yêu cầu mới.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Gửi lại sau/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại đăng ký' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/register');
  });

  it('verifies using only challenge ID and code, then navigates home', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    await waitFor(() =>
      expect(verifyLoginMfa).toHaveBeenCalledWith({
        challengeId: challengeState.challengeId,
        code: '111111',
      }),
    );
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/home'));
  });

  it.each([
    ['missing', null],
    ['expired', { ...challengeState, expiresAt: '2000-01-01T00:00:00.000Z' }],
  ])('returns a %s login challenge to login without verifying', async (_, state) => {
    const verifyLoginMfa = vi.fn();
    renderOTP(state, { verifyLoginMfa });

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/login'),
    );
    expect(verifyLoginMfa).not.toHaveBeenCalled();
  });

  it('keeps an invalid code on OTP and never navigates into the app', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('invalid code', { status: 400 }));
    renderOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    expect(await screen.findByText('Mã OTP không đúng. Vui lòng thử lại.')).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/otp');
  });

  it('returns to login when the challenge expires while the OTP page is open', async () => {
    vi.useFakeTimers();
    try {
      const verifyLoginMfa = vi.fn();
      renderOTP(
        { ...challengeState, expiresAt: new Date(Date.now() + 250).toISOString() },
        { verifyLoginMfa },
      );

      await act(async () => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/login');
      expect(verifyLoginMfa).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns a locked account to the account-locked route', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('locked', { status: 423 }));
    renderOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    expect(
      await screen.findByText('Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quay lại đăng nhập' })).toBeInTheDocument();
  });

  it('explains rate limits without labeling the code invalid', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('limited', { status: 429 }));
    renderOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    expect(await screen.findByText(/Quá nhiều lần xác thực/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quay lại đăng nhập' })).toBeInTheDocument();
    expect(screen.queryByText(/Mã OTP không đúng/)).not.toBeInTheDocument();
  });
});
