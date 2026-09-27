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
        <Route path="/t/security/2fa-setup" element={<TwoFASetupPage />} />
        <Route path="/t/home" element={<p>Trang chủ</p>} />
      </Routes>
      <CurrentPath />
    </>,
    {
      routerProps: { initialEntries: ['/t/security/2fa-setup'] },
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

describe('TwoFASetupPage', () => {
  it('keeps verification disabled until the setup challenge is available', async () => {
    let resolveChallenge!: (value: MfaSetupChallenge) => void;
    const beginMfaSetup = vi.fn(
      () => new Promise<MfaSetupChallenge>((resolve) => (resolveChallenge = resolve)),
    );
    renderSetup({ beginMfaSetup });

    const nextButton = screen.getByRole('button', { name: /Tiếp theo/ });
    expect(nextButton).toBeDisabled();
    expect(screen.getByLabelText('Đang tải mã QR')).toBeVisible();

    await act(async () => resolveChallenge(challenge));

    expect(await screen.findByAltText('Mã QR thiết lập xác thực hai bước')).toHaveAttribute(
      'src',
      challenge.qrCodeUrl,
    );
    expect(screen.getByText(challenge.secret)).toBeVisible();
    expect(nextButton).toBeEnabled();
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

      fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));

      expect(await screen.findByRole('button', { name: 'Đã sao chép' })).toBeVisible();
      expect(writeText).toHaveBeenCalledWith(challenge.secret);
    } finally {
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
    const confirmMfaSetup = vi
      .fn(testAuthAdapter.confirmMfaSetup)
      .mockRejectedValueOnce(new Error('invalid setup code'))
      .mockResolvedValue(testAuthAdapter.initialSession!);
    renderSetup({ confirmMfaSetup });

    await screen.findByText(challenge.secret);
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo/ }));
    expect(screen.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();

    const otpInput = screen.getByRole('textbox', { name: 'Mã xác thực 6 chữ số' });
    const verifyButton = screen.getByRole('button', { name: 'Xác nhận' });
    fireEvent.change(otpInput, { target: { value: '12a3456' } });
    expect(otpInput).toHaveValue('123456');
    expect(verifyButton).toBeEnabled();
    fireEvent.click(verifyButton);

    await waitFor(() => expect(confirmMfaSetup).toHaveBeenCalledWith({ code: '123456' }));
    expect(screen.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();
    expect(screen.queryByText('TEST-001')).not.toBeInTheDocument();

    fireEvent.click(verifyButton);
    expect(await screen.findByText('TEST-001')).toBeVisible();
    expect(confirmMfaSetup).toHaveBeenCalledTimes(2);

    const finishButton = screen.getByRole('button', { name: /Hoàn tất thiết lập 2FA/ });
    expect(finishButton).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tôi đã lưu các mã dự phòng' }));
    expect(finishButton).toBeEnabled();
    fireEvent.click(finishButton);

    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/t/home'));
  });
});
