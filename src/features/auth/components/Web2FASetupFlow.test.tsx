import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { AuthAdapter } from '@/shared/session/auth-context-types';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Web2FASetupFlow } from './Web2FASetupFlow';

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
  it('verifies the server setup challenge before requiring backup-code acknowledgement', async () => {
    const beginMfaSetup = vi.fn(testAuthAdapter.beginMfaSetup);
    const confirmMfaSetup = vi.fn(testAuthAdapter.confirmMfaSetup);
    renderSetup({ ...testAuthAdapter, beginMfaSetup, confirmMfaSetup });

    await screen.findByText('TEST-SECRET');
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

    expect(confirmMfaSetup).toHaveBeenCalledWith({ code: '123456' });
    expect(screen.getByText('TEST-001')).toBeInTheDocument();
    const completeButton = screen.getByRole('button', { name: /Hoàn tất thiết lập/ });
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Tôi đã lưu mã dự phòng/ }));
    expect(completeButton).toBeEnabled();
    fireEvent.click(completeButton);

    await waitFor(() => expect(screen.getByTestId('success-state')).toHaveTextContent('2fa-setup'));
  });

  it('keeps the verify step open and shows the server error when the code is rejected', async () => {
    const confirmMfaSetup = vi
      .fn(testAuthAdapter.confirmMfaSetup)
      .mockRejectedValueOnce(new Error('invalid setup code'));
    renderSetup({ ...testAuthAdapter, confirmMfaSetup });

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
    const otpInputs = document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]');
    for (const [index, digit] of [...'123456'].entries()) {
      fireEvent.change(otpInputs[index], { target: { value: digit } });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));

    expect(
      await screen.findByText('Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.'),
    ).toBeVisible();
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
    const nextButton = screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại thiết lập 2FA' }));
    await waitFor(() => expect(beginMfaSetup).toHaveBeenCalledTimes(2));
    await screen.findByText('TEST-SECRET');
    expect(nextButton).toBeEnabled();
  });

  it('accepts a six-digit paste and clears that code when returning to the QR step', async () => {
    renderSetup(testAuthAdapter);

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
    const otpInputs = [
      ...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]'),
    ];

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
      fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
      expect(writeText).toHaveBeenLastCalledWith('TEST-SECRET');
      expect(screen.getByRole('button', { name: 'Đã sao chép' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }));
      const inputs = [...document.querySelectorAll<HTMLInputElement>('input[inputmode="numeric"]')];
      fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
      fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));
      await screen.findByText('Lưu mã dự phòng');

      fireEvent.click(screen.getByRole('button', { name: 'Sao chép tất cả mã' }));
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

  it('allows leaving setup before a challenge is completed', async () => {
    renderSetup(testAuthAdapter);

    await screen.findByText('TEST-SECRET');
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua thiết lập' }));

    expect(await screen.findByTestId('register-page')).toHaveTextContent('register');
  });
});
