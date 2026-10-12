import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
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

function renderOTP(state: unknown, overrides: Partial<AuthAdapter> = {}, pathname = '/auth/otp') {
  const initialPath =
    pathname === '/auth/otp' || pathname.endsWith('/auth/otp') ? pathname : `${pathname}/auth/otp`;
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/auth/otp" element={<OTPPage />} />
        <Route path="/t/auth/otp" element={<OTPPage />} />
        <Route path="/r/auth/otp" element={<OTPPage />} />
        <Route path="/w/auth/otp" element={<OTPPage />} />
        <Route path="/auth/register" element={<p>register route</p>} />
        <Route path="/t/auth/register" element={<p>register route</p>} />
        <Route path="/r/auth/register" element={<p>register route</p>} />
        <Route path="/w/auth/account-locked" element={<p>account locked route</p>} />
        <Route path="/auth/account-locked" element={<p>account locked route</p>} />
        <Route path="/t/auth/account-locked" element={<p>account locked route</p>} />
        <Route path="/r/auth/account-locked" element={<p>account locked route</p>} />
        <Route path="*" element={<p>other route</p>} />
      </Routes>
      <CurrentPath />
    </>,
    {
      routerProps: { initialEntries: [{ pathname: initialPath, state }] },
      authAdapter: { ...testAuthAdapter, initialSession: null, ...overrides },
    },
  );
}

describe('OTPPage login MFA challenge', () => {
  it('verifies registration using only its server challenge ID and code', async () => {
    const user = userEvent.setup();
    const verifyMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderOTP(
      {
        purpose: 'register',
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
      { verifyMfa },
    );

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    await waitFor(() =>
      expect(verifyMfa).toHaveBeenCalledWith({
        challengeId: 'registration-challenge-001',
        code: '111111',
        purpose: 'register',
      }),
    );
  });

  it('returns to registration instead of offering a local resend action', async () => {
    const user = userEvent.setup();
    renderOTP({
      purpose: 'register',
      challengeId: 'registration-challenge-001',
      channel: 'email',
      maskedDestination: 'n***@example.com',
      expiresAt: '2099-01-01T00:05:00.000Z',
    });

    expect(
      screen.getByText('Không nhận được mã? Hãy quay lại đăng ký để bắt đầu yêu cầu mới.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Gửi lại sau/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại đăng ký' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/register');
  });

  it('returns an expired registration challenge to registration without verifying', async () => {
    const verifyMfa = vi.fn();
    renderOTP(
      {
        purpose: 'register',
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2000-01-01T00:00:00.000Z',
      },
      { verifyMfa },
    );
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/register'),
    );
    expect(verifyMfa).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'Mã OTP không đúng. Vui lòng thử lại.'],
    [503, 'Không thể xác minh lúc này. Vui lòng thử lại.'],
  ])('keeps registration OTP retryable for HTTP %i', async (status, message) => {
    const user = userEvent.setup();
    const verifyMfa = vi.fn().mockRejectedValue(new ApiError('verification failed', { status }));
    renderOTP(
      {
        purpose: 'register',
        challengeId: 'registration-challenge-undocumented-status',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
      { verifyMfa },
    );

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/otp');
    expect(screen.queryByText(/Quá nhiều lần xác thực/)).not.toBeInTheDocument();
    expect(verifyMfa).toHaveBeenCalledTimes(1);
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

  it('uses the explicit confirm action to retry a service failure with the entered code', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('unavailable', { status: 503 }));
    renderOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');
    expect(
      await screen.findByText('Không thể xác minh lúc này. Vui lòng thử lại.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xác nhận' }));

    await waitFor(() => expect(verifyLoginMfa).toHaveBeenCalledTimes(2));
  });

  it('sends a non-API verification error through the generic recovery state', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new Error('adapter failed'));
    renderOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    expect(
      await screen.findByText('Không thể xác minh lúc này. Vui lòng thử lại.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Ký tự OTP 1')).toHaveValue('');
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/otp');
  });

  it('rejects a challenge that expires immediately before verification', () => {
    vi.useFakeTimers();
    try {
      const startedAt = Date.now();
      const verifyLoginMfa = vi.fn();
      renderOTP(
        { ...challengeState, expiresAt: new Date(startedAt + 10_000).toISOString() },
        { verifyLoginMfa },
      );
      const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
      for (const input of Array.from(inputs).slice(0, 5)) {
        fireEvent.change(input, { target: { value: '1' } });
      }

      vi.setSystemTime(startedAt + 10_000);
      fireEvent.change(inputs[5], { target: { value: '1' } });

      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/login');
      expect(verifyLoginMfa).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('rechecks a long-lived challenge after the maximum timer interval', async () => {
    vi.useFakeTimers();
    try {
      const verifyLoginMfa = vi.fn();
      renderOTP(
        {
          ...challengeState,
          expiresAt: new Date(Date.now() + 2_147_483_647 + 5_000).toISOString(),
        },
        { verifyLoginMfa },
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_147_483_647);
      });

      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/otp');
      expect(vi.getTimerCount()).toBe(1);
      expect(verifyLoginMfa).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('normalizes a pasted code and verifies only its six digits', async () => {
    const verifyLoginMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderOTP(challengeState, { verifyLoginMfa });

    fireEvent.paste(document.querySelector('input[aria-label="Ký tự OTP 1"]')!, {
      clipboardData: { getData: () => '12-a34 56' },
    });

    await waitFor(() =>
      expect(verifyLoginMfa).toHaveBeenCalledWith({
        challengeId: challengeState.challengeId,
        code: '123456',
      }),
    );
  });

  it('ignores a paste that does not contain six digits', () => {
    const verifyLoginMfa = vi.fn();
    renderOTP(challengeState, { verifyLoginMfa });

    fireEvent.paste(screen.getByLabelText('Ký tự OTP 1'), {
      clipboardData: { getData: () => '12-a3' },
    });

    expect(verifyLoginMfa).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Ký tự OTP 1')).toHaveValue('');
  });

  it('filters input to the last digit and moves focus with Backspace', () => {
    renderOTP(challengeState);
    const first = screen.getByLabelText('Ký tự OTP 1');
    const second = screen.getByLabelText('Ký tự OTP 2');

    fireEvent.change(first, { target: { value: 'a12' } });
    expect(first).toHaveValue('2');
    expect(second).toHaveFocus();

    fireEvent.keyDown(second, { key: 'Backspace' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: 'Backspace' });
    expect(first).toHaveFocus();
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

    const group = screen.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' });
    expect(group).toHaveAttribute('aria-describedby', 'otp-instructions');
    const inputs = Array.from({ length: 6 }, (_, index) =>
      screen.getByRole('textbox', { name: `Ký tự OTP ${index + 1}` }),
    );
    for (const input of inputs) await user.type(input, '1');

    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent('Mã OTP không đúng. Vui lòng thử lại.');
    for (const input of inputs) {
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', error.id);
    }
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/otp');
  });

  it('returns an expired server challenge to login after verification', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('expired', { status: 410 }));
    renderOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/login'),
    );
    expect(verifyLoginMfa).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Mã OTP không đúng/)).not.toBeInTheDocument();
  });

  it('returns an expired registration challenge to registration after verification', async () => {
    const user = userEvent.setup();
    const verifyMfa = vi.fn().mockRejectedValue(new ApiError('expired', { status: 410 }));
    renderOTP(
      {
        purpose: 'register',
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
      { verifyMfa },
    );

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/register'),
    );
    expect(verifyMfa).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers registration restart after a registration challenge is rate limited', async () => {
    const user = userEvent.setup();
    const verifyMfa = vi.fn().mockRejectedValue(new ApiError('limited', { status: 429 }));
    renderOTP(
      {
        purpose: 'register',
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
      { verifyMfa },
    );

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    expect(await screen.findByText(/Quá nhiều lần xác thực/)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Quay lại đăng ký' })[0]);
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/register');
  });

  it.each([
    ['registration', 400, 'Mã OTP không đúng. Vui lòng thử lại.'],
    ['registration', 503, 'Không thể xác minh lúc này. Vui lòng thử lại.'],
    ['login', 503, 'Không thể xác minh lúc này. Vui lòng thử lại.'],
  ] as const)(
    'shows the expected retry message for %s verification status %s',
    async (flow, status, message) => {
      const user = userEvent.setup();
      const error = new ApiError('verification failed', { status });
      const verify = vi.fn().mockRejectedValue(error);
      const registrationState = {
        purpose: 'register',
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
      };
      renderOTP(flow === 'registration' ? registrationState : challengeState, {
        ...(flow === 'registration' ? { verifyMfa: verify } : { verifyLoginMfa: verify }),
      });

      const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
      for (const input of inputs) await user.type(input, '1');

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/otp');
    },
  );

  it('routes a web login challenge to the locked-account page on HTTP 423', async () => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('locked', { status: 423 }));
    renderOTP(challengeState, { verifyLoginMfa }, '/w/auth/otp');

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/account-locked'),
    );
    expect(verifyLoginMfa).toHaveBeenCalledOnce();
  });

  it('ignores a repeated valid paste while an earlier verification is pending', async () => {
    let resolveVerification!: (value: NonNullable<typeof testAuthAdapter.initialSession>) => void;
    const pendingVerification = new Promise<NonNullable<typeof testAuthAdapter.initialSession>>(
      (resolve) => {
        resolveVerification = resolve;
      },
    );
    const verifyLoginMfa = vi.fn(() => pendingVerification);
    renderOTP(challengeState, { verifyLoginMfa });
    const firstInput = screen.getByLabelText('Ký tự OTP 1');

    fireEvent.paste(firstInput, { clipboardData: { getData: () => '123456' } });
    fireEvent.paste(firstInput, { clipboardData: { getData: () => '654321' } });
    expect(verifyLoginMfa).toHaveBeenCalledOnce();

    await act(async () => resolveVerification(testAuthAdapter.initialSession!));
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

  it.each([
    ['', '/auth/account-locked'],
    ['/t', '/t/auth/account-locked'],
    ['/r', '/r/auth/account-locked'],
  ])('routes a server-locked MFA account to its shell route (%s)', async (prefix, lockedPath) => {
    const user = userEvent.setup();
    const verifyLoginMfa = vi.fn().mockRejectedValue(new ApiError('locked', { status: 423 }));
    renderOTP(challengeState, { verifyLoginMfa }, prefix);

    const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
    for (const input of inputs) await user.type(input, '1');

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent(lockedPath));
    expect(verifyLoginMfa).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText('Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau.'),
    ).not.toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'Quay lại đăng nhập' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/login');
  });

  it('returns an expired registration challenge to registration before sending verification', () => {
    vi.useFakeTimers();
    try {
      const startedAt = Date.now();
      const verifyMfa = vi.fn();
      renderOTP(
        {
          purpose: 'register',
          challengeId: 'registration-challenge-001',
          channel: 'email',
          maskedDestination: 'n***@example.com',
          expiresAt: new Date(startedAt + 10_000).toISOString(),
        },
        { verifyMfa },
      );
      const inputs = document.querySelectorAll<HTMLInputElement>('input[aria-label^="Ký tự OTP"]');
      for (const input of Array.from(inputs).slice(0, 5)) {
        fireEvent.change(input, { target: { value: '1' } });
      }

      vi.setSystemTime(startedAt + 10_000);
      fireEvent.change(inputs[5], { target: { value: '1' } });

      expect(screen.getByTestId('current-path')).toHaveTextContent('/auth/register');
      expect(verifyMfa).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
