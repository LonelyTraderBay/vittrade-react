import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
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

function pasteCode(input: HTMLInputElement, code: string) {
  fireEvent.paste(input, { clipboardData: { getData: () => code } });
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

  it('does not steal focus after the user focuses another OTP digit', () => {
    vi.useFakeTimers();
    const rendered = renderWebOTP(challengeState);
    try {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
      act(() => inputs[2].focus());
      act(() => vi.advanceTimersByTime(200));

      expect(inputs[2]).toHaveFocus();
    } finally {
      rendered.unmount();
      vi.useRealTimers();
    }
  });

  it('focuses the first OTP input when the page opens without an active control', () => {
    vi.useFakeTimers();
    const rendered = renderWebOTP(challengeState);
    try {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
      expect(document.activeElement).toBe(document.body);
      act(() => vi.advanceTimersByTime(200));
      expect(inputs[0]).toHaveFocus();
    } finally {
      rendered.unmount();
      vi.useRealTimers();
    }
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

  it('keeps an unmasked value when a challenge contact cannot be masked', async () => {
    renderWebOTP({
      ...challengeState,
      maskedDestination: 'not-an-email-address',
    });
    expect(await screen.findByText('not-an-email-address')).toBeInTheDocument();
  });

  it('keeps a phone value unchanged when it does not match the masking format', async () => {
    renderWebOTP({ ...challengeState, method: 'sms', maskedDestination: 'phone hidden' });
    expect(await screen.findByText('phone hidden')).toBeInTheDocument();
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

  it('ignores a duplicate paste while verification is in flight', async () => {
    const verifyLoginMfa = vi.fn(
      () => new Promise<Awaited<ReturnType<NonNullable<AuthAdapter['verifyLoginMfa']>>>>(() => {}),
    );
    const rendered = renderWebOTP(challengeState, { verifyLoginMfa });

    try {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
      pasteCode(inputs[0], '111111');
      pasteCode(inputs[0], '222222');
      await waitFor(() => expect(verifyLoginMfa).toHaveBeenCalledOnce());
      expect(verifyLoginMfa).toHaveBeenCalledOnce();
    } finally {
      rendered.unmount();
    }
  });

  it('verifies registration using only its server challenge ID and code', async () => {
    const user = userEvent.setup();
    const verifyMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    renderWebOTP(
      {
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
        purpose: 'register',
      },
      { verifyMfa },
    );

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    await user.click(inputs[0]);
    await user.paste('111111');

    await waitFor(() =>
      expect(verifyMfa).toHaveBeenCalledWith({
        challengeId: 'registration-challenge-001',
        code: '111111',
        purpose: 'register',
      }),
    );
    expect(await screen.findByText('Xác thực thành công!')).toBeInTheDocument();
  });

  it('navigates to MFA setup after successful registration verification', async () => {
    vi.useFakeTimers();
    const verifyMfa = vi.fn(async () => testAuthAdapter.initialSession!);
    const rendered = renderWebOTP(
      {
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
        purpose: 'register',
      },
      { verifyMfa },
    );

    try {
      const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
      await act(async () => {
        pasteCode(inputs[0], '111111');
        await Promise.resolve();
      });
      expect(verifyMfa).toHaveBeenCalledOnce();
      expect(screen.getByText('Xác thực thành công!')).toBeInTheDocument();
      await act(async () => vi.advanceTimersByTime(1800));
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/2fa-setup');
    } finally {
      rendered.unmount();
      vi.useRealTimers();
    }
  });

  it.each([
    [410, '/w/auth/register', undefined],
    [429, '/w/auth/otp', 'Quá nhiều lần xác thực. Hãy bắt đầu yêu cầu đăng ký mới sau một lúc.'],
    [400, '/w/auth/otp', 'Mã xác thực không đúng. Vui lòng kiểm tra lại.'],
    [503, '/w/auth/otp', 'Không thể xác minh lúc này. Vui lòng thử lại.'],
  ] as const)(
    'handles registration verification status %s on the expected route',
    async (status, expectedPath, message) => {
      const user = userEvent.setup();
      const verifyMfa = vi
        .fn()
        .mockRejectedValue(new ApiError('registration verification failed', { status }));
      renderWebOTP(
        {
          challengeId: 'registration-challenge-001',
          channel: 'email',
          maskedDestination: 'n***@example.com',
          expiresAt: '2099-01-01T00:05:00.000Z',
          purpose: 'register',
        },
        { verifyMfa },
      );

      const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
      await user.click(inputs[0]);
      await user.paste('111111');

      await waitFor(() => expect(verifyMfa).toHaveBeenCalledOnce());
      await waitFor(() =>
        expect(screen.getByTestId('current-path')).toHaveTextContent(expectedPath),
      );
      if (message) expect(await screen.findByText(message)).toBeInTheDocument();
      if (status === 400) {
        expect(inputs[0]).toHaveValue('');
      }
    },
  );

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

  it('clears the code and restores focus after an unexpected adapter error', async () => {
    const verifyLoginMfa = vi.fn().mockRejectedValue(new Error('unexpected adapter failure'));
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    act(() => inputs[5].focus());
    pasteCode(inputs[0], '111111');

    await waitFor(() => expect(verifyLoginMfa).toHaveBeenCalledOnce());
    expect(
      await screen.findByText('Không thể xác minh lúc này. Vui lòng thử lại.'),
    ).toBeInTheDocument();
    expect(Array.from(inputs).map((input) => input.value)).toEqual(['', '', '', '', '', '']);
    await waitFor(() => expect(inputs[0]).toHaveFocus());
  });

  it('does not submit a pasted value with fewer than six digits', () => {
    const verifyLoginMfa = vi.fn();
    renderWebOTP(challengeState, { verifyLoginMfa });

    const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
    pasteCode(inputs[0], '12x3');

    expect(verifyLoginMfa).not.toHaveBeenCalled();
    expect(Array.from(inputs).map((input) => input.value)).toEqual(['', '', '', '', '', '']);
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

  it('reschedules the expiry check when the system clock moves backwards', () => {
    vi.useFakeTimers();
    const initialTime = Date.now();
    const rendered = renderWebOTP(
      { ...challengeState, expiresAt: new Date(initialTime + 250).toISOString() },
      {},
    );

    try {
      act(() => vi.setSystemTime(initialTime - 1000));
      act(() => vi.advanceTimersByTime(250));
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/otp');

      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/login');
    } finally {
      rendered.unmount();
      vi.useRealTimers();
    }
  });

  it('returns an expired registration challenge to registration', () => {
    vi.useFakeTimers();
    const rendered = renderWebOTP(
      {
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt: new Date(Date.now() + 250).toISOString(),
        purpose: 'register',
      },
      {},
    );

    try {
      act(() => vi.advanceTimersByTime(250));
      expect(screen.getByTestId('current-path')).toHaveTextContent('/w/auth/register');
    } finally {
      rendered.unmount();
      vi.useRealTimers();
    }
  });

  it.each([
    ['login', (expiresAt: string) => ({ ...challengeState, expiresAt }), '/w/auth/login'],
    [
      'registration',
      (expiresAt: string) => ({
        challengeId: 'registration-challenge-001',
        channel: 'email',
        maskedDestination: 'n***@example.com',
        expiresAt,
        purpose: 'register',
      }),
      '/w/auth/register',
    ],
  ] as const)(
    'does not submit an already-expired %s challenge',
    (_flow, createState, expectedPath) => {
      vi.useFakeTimers();
      const verifyLoginMfa = vi.fn();
      const verifyMfa = vi.fn();
      const expiresAt = new Date(Date.now() + 1000).toISOString();
      const rendered = renderWebOTP(createState(expiresAt), { verifyLoginMfa, verifyMfa });

      try {
        const inputs = document.querySelectorAll<HTMLInputElement>('input[maxlength="1"]');
        act(() => vi.setSystemTime(Date.parse(expiresAt) + 1));
        pasteCode(inputs[0], '111111');

        expect(screen.getByTestId('current-path')).toHaveTextContent(expectedPath);
        expect(verifyLoginMfa).not.toHaveBeenCalled();
        expect(verifyMfa).not.toHaveBeenCalled();
      } finally {
        rendered.unmount();
        vi.useRealTimers();
      }
    },
  );

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
