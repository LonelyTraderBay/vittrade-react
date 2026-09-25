import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { toast } from 'sonner';
import { WithdrawPage } from './WithdrawPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer();

const assets = {
  items: [
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 100,
      available: 75,
      frozen: 25,
      inOrder: 25,
      usdValue: 100,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: { totalUsd: 100, totalBtc: 0.001, availableUsd: 75, inOrderUsd: 25, frozenUsd: 0 },
};

const networks = {
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      fee: 0.5,
      minWithdraw: 5,
      maxWithdraw: 50,
    },
  ],
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function installReadHandlers() {
  server.use(
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/wallet/withdrawal/networks', () => HttpResponse.json(networks)),
  );
}

function getContinueButton() {
  const button = screen
    .getAllByRole('button')
    .find((candidate) => candidate.textContent?.includes('→'));
  if (!button) throw new Error('Withdrawal continue button was not rendered');
  return button;
}

function getButtonContaining(text: string) {
  const button = screen
    .getAllByRole('button')
    .find((candidate) => candidate.textContent?.includes(text));
  if (!button) throw new Error('Button was not rendered: ' + text);
  return button;
}

describe('WithdrawPage', () => {
  it('blocks invalid withdrawal input before creating an MFA challenge', async () => {
    installReadHandlers();
    let challengeRequested = false;
    server.use(
      http.post('*/wallet/withdrawals/challenge', () => {
        challengeRequested = true;
        return HttpResponse.json({
          id: 'challenge-1',
          method: 'totp',
          expiresAt: '2026-09-22T09:00:00Z',
        });
      }),
    );

    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');

    await userEvent.click(getContinueButton());

    expect(challengeRequested).toBe(false);
    expect(await screen.findByText('Địa chỉ ví không hợp lệ.')).toBeVisible();
    expect(screen.getByText('Nhập số tiền cần rút.')).toBeVisible();
    expect(document.getElementById('withdraw-address')).toHaveValue('');
  });

  it('enforces both available-balance and network maximum limits before MFA', async () => {
    installReadHandlers();
    let challengeRequested = false;
    server.use(
      http.get('*/wallet/withdrawal/networks', () =>
        HttpResponse.json({
          networks: [{ ...networks.networks[0], maxWithdraw: 100 }],
        }),
      ),
      http.post('*/wallet/withdrawals/challenge', () => {
        challengeRequested = true;
        return HttpResponse.json({ id: 'unexpected', method: 'totp' });
      }),
    );

    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    const amountInput = document.getElementById('withdraw-amount') as HTMLInputElement;

    await userEvent.type(amountInput, '76');
    await userEvent.click(getContinueButton());
    expect(await screen.findByText('Số dư không đủ.')).toBeVisible();

    fireEvent.change(amountInput, { target: { value: '101' } });
    await userEvent.click(getContinueButton());
    expect(await screen.findByText('Tối đa 100 USDT.')).toBeVisible();
    expect(challengeRequested).toBe(false);
  });

  it('recovers from a withdrawal-network read error by refreshing both dependencies', async () => {
    let assetReads = 0;
    let networkReads = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        assetReads += 1;
        return HttpResponse.json(assets);
      }),
      http.get('*/wallet/withdrawal/networks', () => {
        networkReads += 1;
        if (networkReads <= 3) {
          return HttpResponse.json({ message: 'Policy service unavailable' }, { status: 503 });
        }
        return HttpResponse.json(networks);
      }),
    );

    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    expect(await screen.findByText('Không thể tải thông tin rút tiền')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('combobox')).toBeVisible();
    expect(networkReads).toBe(4);
    expect(assetReads).toBeGreaterThanOrEqual(2);
  });

  it('validates required network memo and minimum amount before requesting a challenge', async () => {
    installReadHandlers();
    let challengeRequested = false;
    server.use(
      http.get('*/wallet/withdrawal/networks', () =>
        HttpResponse.json({
          networks: [
            {
              id: 'tag-network',
              name: 'Tag Network',
              fee: 0.25,
              minWithdraw: 5,
              maxWithdraw: 50,
              requiresMemo: true,
              memoLabel: 'Destination tag',
            },
          ],
        }),
      ),
      http.post('*/wallet/withdrawals/challenge', () => {
        challengeRequested = true;
        return HttpResponse.json({ id: 'challenge-1', method: 'totp' });
      }),
    );

    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '4');
    await userEvent.click(getContinueButton());

    expect(await screen.findByText('Destination tag là bắt buộc cho mạng này.')).toBeVisible();
    expect(screen.getByText('Tối thiểu 5 USDT.')).toBeVisible();
    expect(challengeRequested).toBe(false);
  });

  it('sets the maximum withdrawable amount to the lower of available balance and network limit', async () => {
    installReadHandlers();
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');

    await userEvent.click(getButtonContaining('Tất cả'));
    expect(document.getElementById('withdraw-amount')).toHaveValue(50);
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.click(getContinueButton());

    expect(await screen.findByText('50.000000 USDT')).toBeVisible();
  });

  it('closes the confirmation sheet when the user chooses to edit', async () => {
    installReadHandlers();
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12');
    await userEvent.click(getContinueButton());
    expect(await screen.findByText('Xác nhận rút tiền')).toBeVisible();

    await userEvent.click(getButtonContaining('Sửa'));

    await waitFor(() => expect(screen.queryByText('Xác nhận rút tiền')).not.toBeInTheDocument());
    expect(document.getElementById('withdraw-address')).toHaveValue(
      'wallet-address-long-enough-for-validation-123456',
    );
  });

  it('keeps the user on the form and reports challenge creation failures', async () => {
    installReadHandlers();
    server.use(
      http.post('*/wallet/withdrawals/challenge', () =>
        HttpResponse.json({ message: 'Risk check unavailable' }, { status: 503 }),
      ),
    );
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('Xác minh 2FA'));

    await waitFor(() => {
      expect(screen.queryByText('Xác nhận rút tiền')).not.toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Không thể tạo phiên xác minh. Vui lòng thử lại.', {
        duration: 2000,
      });
    });
    expect(document.getElementById('withdraw-address')).toBeInTheDocument();
  });

  it('does not submit a withdrawal when MFA verification fails', async () => {
    installReadHandlers();
    let withdrawalRequested = false;
    server.use(
      http.post('*/wallet/withdrawals/challenge', () =>
        HttpResponse.json({
          id: 'challenge-1',
          method: 'totp',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals/challenge/:challengeId/verify', () =>
        HttpResponse.json({ message: 'Invalid code' }, { status: 401 }),
      ),
      http.post('*/wallet/withdrawals', () => {
        withdrawalRequested = true;
        return HttpResponse.json({ id: 'unexpected' }, { status: 201 });
      }),
    );
    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      'wallet-address-long-enough-for-validation-123456',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('Xác minh 2FA'));
    await userEvent.type(await screen.findByLabelText(/Mã xác minh/i), '123456');
    await userEvent.click(getButtonContaining('Xác nhận rút tiền'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Mã xác minh không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
        { duration: 2000 },
      ),
    );
    expect(withdrawalRequested).toBe(false);
    expect(screen.getByText('Xác minh bảo mật')).toBeVisible();
  });

  it('completes challenge, MFA verification and idempotent withdrawal submission', async () => {
    installReadHandlers();
    let challengeBody: unknown;
    let verificationBody: unknown;
    let withdrawalBody: unknown;
    let withdrawalIdempotencyKey: string | null = null;

    server.use(
      http.post('*/wallet/withdrawals/challenge', async ({ request }) => {
        challengeBody = await request.json();
        return HttpResponse.json({
          id: 'challenge-1',
          method: 'totp',
          maskedDestination: 'Authenticator app',
          expiresAt: '2026-09-22T09:00:00Z',
        });
      }),
      http.post('*/wallet/withdrawals/challenge/:challengeId/verify', async ({ request }) => {
        verificationBody = await request.json();
        return HttpResponse.json({
          verificationToken: 'verification-token-1',
          expiresAt: '2026-09-22T09:00:00Z',
        });
      }),
      http.post('*/wallet/withdrawals', async ({ request }) => {
        withdrawalBody = await request.json();
        withdrawalIdempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json(
          {
            id: 'withdrawal-1',
            transactionId: 'transaction-1',
            asset: 'USDT',
            amount: 12.5,
            status: 'pending',
            createdAt: '2026-09-22T08:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');

    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      '0x1234567890abcdef1234567890abcdef12345678',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12.5');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('2FA'));

    expect(challengeBody).toEqual({
      asset: 'USDT',
      networkId: 'ethereum',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      amount: 12.5,
    });

    const codeInput = await screen.findByLabelText(/Mã xác minh/i);
    await userEvent.type(codeInput, '000000');
    await userEvent.click(getButtonContaining('Xác nhận'));

    await waitFor(() =>
      expect(document.getElementById('withdraw-address')).not.toBeInTheDocument(),
    );
    expect(verificationBody).toEqual({ code: '000000' });
    expect(withdrawalBody).toEqual({
      asset: 'USDT',
      networkId: 'ethereum',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      amount: 12.5,
      verificationToken: 'verification-token-1',
    });
    expect(withdrawalIdempotencyKey).toEqual(expect.any(String));
  });

  it('reuses the withdrawal idempotency key after a transient submit failure', async () => {
    installReadHandlers();
    const withdrawalKeys: string[] = [];
    let withdrawalRequests = 0;
    server.use(
      http.post('*/wallet/withdrawals/challenge', () =>
        HttpResponse.json({
          id: 'challenge-retry-1',
          method: 'totp',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals/challenge/:challengeId/verify', () =>
        HttpResponse.json({
          verificationToken: 'verification-token-retry',
          expiresAt: '2026-09-22T09:00:00Z',
        }),
      ),
      http.post('*/wallet/withdrawals', ({ request }) => {
        withdrawalRequests += 1;
        withdrawalKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (withdrawalRequests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({
          id: 'withdrawal-retry-1',
          transactionId: 'transaction-retry-1',
          asset: 'USDT',
          amount: 12.5,
          status: 'pending',
          createdAt: '2026-09-22T08:00:00.000Z',
        });
      }),
    );

    renderWithProviders(<WithdrawPage />, {
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });
    await screen.findByRole('combobox');
    await userEvent.type(
      document.getElementById('withdraw-address') as HTMLInputElement,
      '0x1234567890abcdef1234567890abcdef12345678',
    );
    await userEvent.type(document.getElementById('withdraw-amount') as HTMLInputElement, '12.5');
    await userEvent.click(getContinueButton());
    await userEvent.click(getButtonContaining('2FA'));
    await userEvent.type(await screen.findByLabelText(/Mã xác minh/i), '000000');

    const submitButton = getButtonContaining('Xác nhận');
    await userEvent.click(submitButton);
    await waitFor(() => expect(withdrawalRequests).toBe(1));
    await userEvent.click(submitButton);

    await waitFor(() => expect(withdrawalRequests).toBe(2));
    expect(withdrawalKeys[0]).toEqual(expect.any(String));
    expect(withdrawalKeys[1]).toBe(withdrawalKeys[0]);
    expect(await screen.findByText('Đang xử lý')).toBeInTheDocument();
  });

  it('keeps withdrawal actions disabled for read-only wallet users', async () => {
    installReadHandlers();
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['wallet:read'] },
      },
    };

    renderWithProviders(<WithdrawPage />, {
      authAdapter: readOnlyAdapter,
      routerProps: { initialEntries: ['/wallet/withdraw/USDT'] },
    });

    expect(
      await screen.findByText('Wallet withdrawal permission is required to submit a withdrawal.'),
    ).toBeInTheDocument();
    expect(getContinueButton()).toBeDisabled();
    expect(document.getElementById('withdraw-address')).toBeDisabled();
  });
});
