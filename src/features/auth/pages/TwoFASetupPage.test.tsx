import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { AuthAdapter } from '@/shared/session/auth-context-types';
import type { MfaSetupChallenge } from '@/shared/session/session-types';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { TwoFASetupPage } from './TwoFASetupPage';

const challenge: MfaSetupChallenge = {
  secret: 'TEST-SECRET',
  qrCodeUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
  backupCodes: ['TEST-001', 'TEST-002'],
};

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

function renderSetup(overrides: Partial<AuthAdapter> = {}) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/t/auth/2fa-setup" element={<TwoFASetupPage />} />
        <Route path="/t/home" element={<p>Trang chủ</p>} />
      </Routes>
      <CurrentPath />
    </>,
    {
      routerProps: { initialEntries: ['/t/auth/2fa-setup'] },
      authAdapter: { ...testAuthAdapter, ...overrides },
    },
  );
}

function mockClipboard(writeText: Clipboard['writeText']) {
  const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return () => {
    if (previousClipboard) Object.defineProperty(navigator, 'clipboard', previousClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  };
}

async function invokeDisabledButtonHandler(button: HTMLElement) {
  if (button.tagName !== 'BUTTON') throw new Error('Expected a button element');

  const propsKey = Object.keys(button).find((key) => key.startsWith('__reactProps$'));
  if (!propsKey) throw new Error('React click handler was not attached to the button');

  const props = (button as unknown as Record<string, { onClick?: () => void | Promise<void> }>)[
    propsKey
  ];
  if (typeof props?.onClick !== 'function') throw new Error('Button has no React click handler');

  // Native disabled buttons suppress clicks; invoke only the handler to verify its defensive guard.
  await act(async () => {
    await props.onClick?.();
  });
}

describe('TwoFASetupPage', () => {
  it('keeps verification disabled until the setup challenge is available', async () => {
    let resolveChallenge!: (value: MfaSetupChallenge) => void;
    const beginMfaSetup = vi.fn(
      () => new Promise<MfaSetupChallenge>((resolve) => (resolveChallenge = resolve)),
    );
    const writeText = vi.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    const restoreClipboard = mockClipboard(writeText);
    try {
      renderSetup({ beginMfaSetup });

      const nextButton = screen.getByRole('button', { name: /Tiếp theo/ });
      expect(nextButton).toBeDisabled();
      expect(screen.getByLabelText('Đang tải mã QR')).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
      expect(writeText).not.toHaveBeenCalled();

      await invokeDisabledButtonHandler(nextButton);
      expect(screen.getByRole('heading', { name: 'Bước 1: Quét mã QR' })).toBeVisible();

      await act(async () => resolveChallenge(challenge));

      expect(await screen.findByAltText('Mã QR thiết lập xác thực hai bước')).toHaveAttribute(
        'src',
        challenge.qrCodeUrl,
      );
      expect(screen.getByText(challenge.secret)).toBeVisible();
      expect(nextButton).toBeEnabled();
    } finally {
      restoreClipboard();
    }
  });

  it('ignores a setup response that resolves after the page unmounts', async () => {
    let resolveChallenge!: (value: MfaSetupChallenge) => void;
    const beginMfaSetup = vi.fn(
      () => new Promise<MfaSetupChallenge>((resolve) => (resolveChallenge = resolve)),
    );
    const { unmount } = renderSetup({ beginMfaSetup });

    unmount();
    await act(async () => {
      resolveChallenge(challenge);
      await Promise.resolve();
    });

    expect(beginMfaSetup).toHaveBeenCalledOnce();
  });

  it('ignores a setup failure that arrives after the page unmounts', async () => {
    let rejectChallenge!: (reason: Error) => void;
    const beginMfaSetup = vi.fn(
      () => new Promise<MfaSetupChallenge>((_, reject) => (rejectChallenge = reject)),
    );
    const { unmount } = renderSetup({ beginMfaSetup });

    unmount();
    await act(async () => {
      rejectChallenge(new Error('setup unavailable'));
      await Promise.resolve();
    });

    expect(beginMfaSetup).toHaveBeenCalledOnce();
  });

  it('offers retry after setup fails and stays on the QR step until retry succeeds', async () => {
    const beginMfaSetup = vi
      .fn(testAuthAdapter.beginMfaSetup)
      .mockRejectedValueOnce(new Error('setup unavailable'))
      .mockResolvedValue(challenge);
    renderSetup({ beginMfaSetup });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.',
    );
    const nextButton = screen.getByRole('button', { name: /Tiếp theo/ });
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại thiết lập 2FA' }));
    expect(await screen.findByText(challenge.secret)).toBeVisible();
    expect(nextButton).toBeEnabled();
    expect(beginMfaSetup).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('heading', { name: 'Bước 1: Quét mã QR' })).toBeVisible();
  });

  it('reports a copied secret only after the clipboard accepts it', async () => {
    const writeText = vi.fn<Clipboard['writeText']>().mockResolvedValue(undefined);
    const restoreClipboard = mockClipboard(writeText);
    try {
      renderSetup();
      await screen.findByText(challenge.secret);
      vi.useFakeTimers();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
        await Promise.resolve();
      });

      expect(screen.getByRole('button', { name: 'Đã sao chép' })).toBeVisible();
      expect(writeText).toHaveBeenCalledWith(challenge.secret);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(screen.getByRole('button', { name: 'Sao chép' })).toBeVisible();
    } finally {
      vi.useRealTimers();
      restoreClipboard();
    }
  });

  it('keeps the copy action available and reports failure when clipboard writing rejects', async () => {
    const writeText = vi
      .fn<Clipboard['writeText']>()
      .mockRejectedValue(new Error('clipboard denied'));
    const restoreClipboard = mockClipboard(writeText);
    try {
      renderSetup();
      await screen.findByText(challenge.secret);

      fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));

      await waitFor(() => expect(writeText).toHaveBeenCalledWith(challenge.secret));
      expect(screen.getByRole('button', { name: 'Sao chép' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Đã sao chép' })).not.toBeInTheDocument();
    } finally {
      restoreClipboard();
    }
  });

  it('reveals backup codes only after server confirmation and requires acknowledgement before leaving', async () => {
    type ConfirmMfaSetupResult = Awaited<ReturnType<NonNullable<AuthAdapter['confirmMfaSetup']>>>;
    let resolveConfirmation!: (session: ConfirmMfaSetupResult) => void;
    const pendingConfirmation = new Promise<ConfirmMfaSetupResult>(
      (resolve) => (resolveConfirmation = resolve),
    );
    const confirmMfaSetup = vi
      .fn(testAuthAdapter.confirmMfaSetup)
      .mockRejectedValueOnce(new Error('invalid setup code'))
      .mockReturnValue(pendingConfirmation);
    renderSetup({ confirmMfaSetup });

    await screen.findByText(challenge.secret);
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo/ }));
    expect(screen.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();

    const otpGroup = screen.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' });
    expect(otpGroup).toHaveClass('focus-within:outline');
    const otpInput = screen.getByRole('textbox', { name: 'Mã xác thực 6 chữ số' });
    expect(otpInput).toHaveFocus();
    expect(otpInput).toHaveAttribute('aria-describedby', 'setup-otp-instructions');
    const verifyButton = screen.getByRole('button', { name: 'Xác nhận' });
    await invokeDisabledButtonHandler(verifyButton);
    expect(confirmMfaSetup).not.toHaveBeenCalled();

    fireEvent.change(otpInput, { target: { value: '12a3456' } });
    expect(otpInput).toHaveValue('123456');
    expect(verifyButton).toBeEnabled();
    fireEvent.click(verifyButton);

    await waitFor(() => expect(confirmMfaSetup).toHaveBeenCalledWith({ code: '123456' }));
    expect(screen.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();
    expect(screen.queryByText('TEST-001')).not.toBeInTheDocument();

    fireEvent.click(verifyButton);
    const verifyingButton = await screen.findByRole('button', { name: 'Đang xác minh...' });
    expect(verifyingButton).toBeDisabled();
    expect(confirmMfaSetup).toHaveBeenCalledTimes(2);
    await invokeDisabledButtonHandler(verifyingButton);
    expect(confirmMfaSetup).toHaveBeenCalledTimes(2);

    await act(async () => resolveConfirmation(testAuthAdapter.initialSession!));
    expect(await screen.findByText('TEST-001')).toBeVisible();

    const finishButton = screen.getByRole('button', { name: /Hoàn tất thiết lập 2FA/ });
    expect(finishButton).toBeDisabled();
    await invokeDisabledButtonHandler(finishButton);
    expect(screen.getByTestId('current-path')).toHaveTextContent('/t/auth/2fa-setup');

    fireEvent.click(screen.getByRole('button', { name: 'Tôi đã lưu các mã dự phòng' }));
    expect(finishButton).toBeEnabled();
    fireEvent.click(finishButton);

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/t/home'));
  });
});
