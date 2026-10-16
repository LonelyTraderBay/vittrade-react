import { useRef, type ComponentProps } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import type { AuthAdapter } from '@/shared/session/auth-context-types';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Web2FASetupBackupStep } from './Web2FASetupBackupStep';
import { Web2FASetupFlow } from './Web2FASetupFlow';

type BackupStepProps = ComponentProps<typeof Web2FASetupBackupStep>;
type SetupChallenge = Awaited<ReturnType<NonNullable<AuthAdapter['beginMfaSetup']>>>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function LoadingBackupStepWithoutSetup({
  handleCopyBackupCodes,
}: Pick<BackupStepProps, 'handleCopyBackupCodes'>) {
  const colors = useThemeColors();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const props: BackupStepProps = {
    c: colors,
    setup: null,
    isLoading: true,
    savedCodes: true,
    copyError: '',
    setSavedCodes: () => undefined,
    copiedCodes: false,
    handleCopyBackupCodes,
    handleComplete: () => undefined,
    headingRef,
  };

  return <Web2FASetupBackupStep {...props} />;
}

function SuccessState() {
  const location = useLocation();
  return <output data-testid="success-state">{JSON.stringify(location.state)}</output>;
}

function renderSetup(authAdapter: AuthAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/w/auth/2fa-setup" element={<Web2FASetupFlow />} />
      <Route
        path="/w/auth/register"
        element={<output data-testid="register-page">register</output>}
      />
      <Route path="/w/auth/success" element={<SuccessState />} />
    </Routes>,
    { authAdapter, routerProps: { initialEntries: ['/w/auth/2fa-setup'] } },
  );
}

describe('Web2FASetupFlow', () => {
  it('renders the empty-code fallback and loading state of the backup step', () => {
    const handleCopyBackupCodes = vi.fn();
    render(<LoadingBackupStepWithoutSetup handleCopyBackupCodes={handleCopyBackupCodes} />);

    expect(screen.getByText('Lưu mã dự phòng')).toBeVisible();
    expect(screen.queryByText('TEST-001')).not.toBeInTheDocument();
    const completeButton = screen.getAllByRole('button').at(-1);
    expect(completeButton).toBeDisabled();
    expect(completeButton?.querySelector('[style*="animation"]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép tất cả mã' }));
    expect(handleCopyBackupCodes).not.toHaveBeenCalled();
  });

  it('verifies the server setup challenge before requiring backup-code acknowledgement', async () => {
    const beginMfaSetup = vi.fn(testAuthAdapter.beginMfaSetup);
    const confirmMfaSetup = vi.fn(testAuthAdapter.confirmMfaSetup);
    renderSetup({ ...testAuthAdapter, beginMfaSetup, confirmMfaSetup });

    await screen.findByText('TEST-SECRET');
    const currentStep = screen.getByRole('listitem', { name: 'Bước 1 trên 3: Quét mã QR' });
    const stepNumber = within(currentStep).getByText('1');
    expect(stepNumber).toHaveStyle({ color: '#fff' });
    expect(stepNumber.parentElement).toHaveStyle({ background: '#1d4ed8' });
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));

    const otpInputs = document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]');
    expect(otpInputs).toHaveLength(6);
    for (const [index, digit] of [...'123456'].entries()) {
      fireEvent.change(otpInputs[index], { target: { value: digit } });
    }

    const verifyButton = screen.getByRole('button', { name: 'Xác minh' });
    expect(verifyButton).toBeEnabled();
    fireEvent.click(verifyButton);
    await screen.findByText('Lưu mã dự phòng');
    expect(screen.getByRole('heading', { name: 'Lưu mã dự phòng' })).toHaveFocus();

    expect(confirmMfaSetup).toHaveBeenCalledWith({ code: '123456' });
    expect(screen.getByText('TEST-001')).toBeInTheDocument();
    const completeButton = screen.getByRole('button', { name: /Hoàn tất thiết lập/ });
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Tôi đã lưu mã dự phòng/ }));
    expect(completeButton).toBeEnabled();
    fireEvent.click(completeButton);

    await waitFor(() =>
      expect(screen.getByTestId('success-state')).toHaveTextContent(
        JSON.stringify({ purpose: '2fa-setup', from: '2fa-setup' }),
      ),
    );
  });

  it('keeps the verify step open with neutral guidance after a confirmation transport failure', async () => {
    const confirmMfaSetup = vi
      .fn(testAuthAdapter.confirmMfaSetup)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    renderSetup({ ...testAuthAdapter, confirmMfaSetup });

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
    const otpGroup = screen.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' });
    expect(otpGroup).toHaveAttribute('aria-describedby', 'setup-otp-instructions');
    const otpInputs = Array.from({ length: 6 }, (_, index) =>
      screen.getByRole('textbox', {
        name: `Mã xác thực 2FA, chữ số ${index + 1} trên 6`,
      }),
    );
    for (const [index, digit] of [...'123456'].entries()) {
      fireEvent.change(otpInputs[index], { target: { value: digit } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));

    const error = await screen.findByRole('alert');
    expect(error).toHaveTextContent('Không thể xác minh lúc này. Vui lòng thử lại.');
    for (const input of otpInputs) {
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', error.id);
    }
    expect(screen.getByText('Xác minh mã')).toBeInTheDocument();
    expect(screen.queryByText('Lưu mã dự phòng')).not.toBeInTheDocument();
  });

  it('shows setup failures and does not allow verification until retry succeeds', async () => {
    const defaultBeginMfaSetup = testAuthAdapter.beginMfaSetup;
    if (!defaultBeginMfaSetup) throw new Error('Test MFA setup adapter is required');
    const beginMfaSetup = vi
      .fn(defaultBeginMfaSetup)
      .mockRejectedValueOnce(new Error('setup unavailable'))
      .mockImplementation(defaultBeginMfaSetup);
    renderSetup({ ...testAuthAdapter, beginMfaSetup });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Khóa bảo mật chưa khả dụng')).toBeInTheDocument();
    const nextButton = screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại thiết lập 2FA' }));
    await waitFor(() => expect(beginMfaSetup).toHaveBeenCalledTimes(2));
    await screen.findByText('TEST-SECRET');
    expect(nextButton).toBeEnabled();
  });

  it('does not copy a missing challenge and ignores a successful response after unmount', async () => {
    const pendingChallenge = deferred<SetupChallenge>();
    const beginMfaSetup = vi.fn(() => pendingChallenge.promise);
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    try {
      const view = renderSetup({ ...testAuthAdapter, beginMfaSetup });
      expect(beginMfaSetup).toHaveBeenCalledOnce();
      fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
      expect(writeText).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Đã sao chép' })).not.toBeInTheDocument();

      view.unmount();
      await act(async () => {
        pendingChallenge.resolve({
          secret: 'TEST-SECRET',
          qrCodeUrl: 'data:image/svg+xml,<svg/>',
          backupCodes: ['TEST-001', 'TEST-002'],
        });
        await pendingChallenge.promise;
        await Promise.resolve();
      });
      expect(writeText).not.toHaveBeenCalled();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
  });

  it('ignores a rejected setup response after unmount', async () => {
    const pendingChallenge = deferred<SetupChallenge>();
    const beginMfaSetup = vi.fn(() => pendingChallenge.promise);
    const view = renderSetup({ ...testAuthAdapter, beginMfaSetup });

    expect(beginMfaSetup).toHaveBeenCalledOnce();
    view.unmount();
    await act(async () => {
      pendingChallenge.reject(new Error('setup unavailable'));
      await pendingChallenge.promise.catch(() => undefined);
      await Promise.resolve();
    });
  });

  it('rejects an incomplete OTP in the handler even if the disabled button is activated', async () => {
    const confirmMfaSetup = vi.fn(testAuthAdapter.confirmMfaSetup);
    renderSetup({ ...testAuthAdapter, confirmMfaSetup });

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
    const inputs = [...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]')];
    fireEvent.change(inputs[0], { target: { value: '7' } });
    expect(inputs.map((input) => input.value)).toEqual(['7', '', '', '', '', '']);

    const verifyButton = screen.getByRole('button', { name: 'Xác minh' });
    expect(verifyButton).toBeDisabled();
    // React suppresses clicks on disabled controls, so invoke the rendered callback
    // directly to verify its defense-in-depth guard independently of the UI affordance.
    const propsKey = Object.getOwnPropertyNames(verifyButton).find((key) =>
      key.startsWith('__reactProps$'),
    );
    if (!propsKey) throw new Error('React button props are unavailable in this test environment');
    const props = (
      verifyButton as unknown as Record<string, { onClick?: () => void | Promise<void> }>
    )[propsKey];
    await act(async () => {
      await props.onClick?.();
    });

    expect(screen.getByText(/Vui lòng nhập đủ 6 chữ số/)).toBeVisible();
    expect(confirmMfaSetup).not.toHaveBeenCalled();
  });

  it('accepts a six-digit paste and clears that code when returning to the QR step', async () => {
    renderSetup(testAuthAdapter);

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
    const otpInputs = [
      ...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]'),
    ];

    fireEvent.paste(otpInputs[0], {
      clipboardData: { getData: () => '12345' },
    });
    expect(otpInputs.map((input) => input.value)).toEqual(['', '', '', '', '', '']);
    expect(screen.getByRole('button', { name: 'Xác minh' })).toBeDisabled();

    fireEvent.paste(otpInputs[0], {
      clipboardData: { getData: () => '12a34-56' },
    });
    expect(otpInputs.map((input) => input.value)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(screen.getByRole('button', { name: 'Xác minh' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
    const clearedOtpInputs = [
      ...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]'),
    ];
    expect(clearedOtpInputs.map((input) => input.value)).toEqual(['', '', '', '', '', '']);
    expect(screen.getByRole('button', { name: 'Xác minh' })).toBeDisabled();
  });

  it('does not submit an empty or incomplete setup code', async () => {
    const confirmMfaSetup = vi.fn(testAuthAdapter.confirmMfaSetup);
    renderSetup({ ...testAuthAdapter, confirmMfaSetup });

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));

    const inputs = Array.from({ length: 6 }, (_, index) =>
      screen.getByRole('textbox', {
        name: `Mã xác thực 2FA, chữ số ${index + 1} trên 6`,
      }),
    );
    const verifyButton = screen.getByRole('button', { name: 'Xác minh' });

    expect(verifyButton).toBeDisabled();
    fireEvent.click(verifyButton);
    expect(confirmMfaSetup).not.toHaveBeenCalled();

    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(verifyButton).toBeDisabled();
    fireEvent.click(verifyButton);
    expect(confirmMfaSetup).not.toHaveBeenCalled();
  });

  it('moves focus between OTP fields for keyboard navigation and strips non-digits', async () => {
    renderSetup(testAuthAdapter);

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
    const inputs = [...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]')];

    fireEvent.change(inputs[0], { target: { value: 'x7' } });
    expect(inputs[0]).toHaveValue('7');
    expect(document.activeElement).toBe(inputs[1]);

    fireEvent.keyDown(inputs[1], { key: 'Backspace' });
    expect(document.activeElement).toBe(inputs[0]);
    fireEvent.keyDown(inputs[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(inputs[1]);
    fireEvent.keyDown(inputs[1], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(inputs[0]);
  });

  it('copies the setup secret and backup codes using the challenge values', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    try {
      renderSetup(testAuthAdapter);
      await screen.findByText('TEST-SECRET');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
        await Promise.resolve();
      });
      expect(writeText).toHaveBeenLastCalledWith('TEST-SECRET');
      expect(await screen.findByRole('button', { name: 'Đã sao chép' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
      const inputs = [...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]')];
      fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
      fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));
      await screen.findByText('Lưu mã dự phòng');

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sao chép tất cả mã' }));
        await Promise.resolve();
      });
      expect(writeText).toHaveBeenLastCalledWith('TEST-001\nTEST-002');
      expect(screen.getByRole('button', { name: 'Đã sao chép tất cả mã' })).toBeInTheDocument();
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
  });

  it('shows and clears clipboard success feedback for both secret and backup codes', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    try {
      renderSetup(testAuthAdapter);
      await screen.findByText('TEST-SECRET');
      vi.useFakeTimers();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
        await Promise.resolve();
      });
      expect(writeText).toHaveBeenLastCalledWith('TEST-SECRET');
      expect(screen.getByRole('button', { name: 'Đã sao chép' })).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.getByRole('button', { name: 'Sao chép' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
      const inputs = [...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]')];
      fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));
        await Promise.resolve();
      });
      expect(screen.getByText('Lưu mã dự phòng')).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sao chép tất cả mã' }));
        await Promise.resolve();
      });
      expect(writeText).toHaveBeenLastCalledWith('TEST-001\nTEST-002');
      expect(screen.getByRole('button', { name: 'Đã sao chép tất cả mã' })).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.getByRole('button', { name: 'Sao chép tất cả mã' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
  });

  it('does not claim either clipboard operation succeeded when writing rejects', async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    try {
      renderSetup(testAuthAdapter);
      await screen.findByText('TEST-SECRET');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
        await Promise.resolve();
      });
      expect(screen.getByRole('button', { name: 'Sao chép' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Đã sao chép' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
      const inputs = [...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]')];
      fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));
        await Promise.resolve();
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sao chép tất cả mã' }));
        await Promise.resolve();
      });
      expect(screen.getByRole('button', { name: 'Sao chép tất cả mã' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Đã sao chép tất cả mã' }),
      ).not.toBeInTheDocument();
      expect(writeText).toHaveBeenNthCalledWith(1, 'TEST-SECRET');
      expect(writeText).toHaveBeenNthCalledWith(2, 'TEST-001\nTEST-002');
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
  });

  it('allows leaving setup before a challenge is completed', async () => {
    renderSetup(testAuthAdapter);

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua thiết lập' }));

    expect(await screen.findByTestId('register-page')).toHaveTextContent('register');
  });
});
