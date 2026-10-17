import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { WalletDepositContractPage } from './WalletDepositContractPage';

const server = setupServer();

const networks = {
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      fee: '0.00 ETH',
      minDeposit: 10,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      arrivalTime: '~5 minutes',
      confirmations: 12,
    },
    {
      id: 'tron',
      name: 'Tron',
      fee: '1 USDT',
      minDeposit: 5,
      address: 'TQ8k2n3exampleaddress1234567890',
      arrivalTime: '~1 minute',
      confirmations: 20,
      memo: '123456',
    },
  ],
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

const noWalletReadAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
  },
};

function installHandlers() {
  server.use(http.get('*/wallet/deposit/networks', () => HttpResponse.json(networks)));
}

describe('Wallet deposit contract page', () => {
  it('does not request deposit addresses without wallet read permission', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/deposit/networks', () => {
        requests += 1;
        return HttpResponse.json(networks);
      }),
    );

    renderWithProviders(<WalletDepositContractPage />, { authAdapter: noWalletReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent('Wallet read permission');
    expect(requests).toBe(0);
  });

  it('renders a real QR value and typed network instructions', async () => {
    installHandlers();

    renderWithProviders(<WalletDepositContractPage />, {
      routerProps: { initialEntries: ['/wallet/deposit/USDT'] },
    });

    expect(await screen.findByLabelText('Deposit network')).toHaveValue('ethereum');
    expect(screen.getByRole('img', { name: 'Deposit address QR code' })).toBeInTheDocument();
    expect(screen.getByText(networks.networks[0].address)).toBeInTheDocument();
    expect(screen.getByText('12 confirmations')).toBeInTheDocument();
  });

  it('shows memo requirements after selecting a memo network', async () => {
    installHandlers();

    renderWithProviders(<WalletDepositContractPage />);
    const networkSelect = await screen.findByLabelText('Deposit network');

    await userEvent.selectOptions(networkSelect, 'tron');

    expect(screen.getByText(/Memo is required for this network/)).toBeInTheDocument();
    expect(screen.getByText(networks.networks[1].memo!)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy Memo' })).toBeInTheDocument();
  });

  it('copies the server-provided address through the browser clipboard', async () => {
    installHandlers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderWithProviders(<WalletDepositContractPage />);
    await screen.findByLabelText('Deposit network');
    await userEvent.click(screen.getByRole('button', { name: 'Copy USDT deposit address' }));

    expect(writeText).toHaveBeenCalledWith(networks.networks[0].address);
    await userEvent.selectOptions(screen.getByLabelText('Deposit network'), 'tron');
    await userEvent.click(screen.getByRole('button', { name: 'Copy Memo' }));
    expect(writeText).toHaveBeenCalledWith(networks.networks[1].memo);
  });

  it('shows a recovery action after a contract permission error', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/deposit/networks', () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ code: 'FORBIDDEN', message: 'Permission denied' }, { status: 403 })
          : HttpResponse.json(networks);
      }),
    );

    renderWithProviders(<WalletDepositContractPage />);

    expect(await screen.findByText('Unable to load deposit instructions')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByLabelText('Deposit network')).toHaveValue('ethereum');
    expect(requests).toBe(2);
  });

  it('returns to the empty-network error state when no deposit networks are assigned', async () => {
    server.use(http.get('*/wallet/deposit/networks', () => HttpResponse.json({ networks: [] })));

    renderWithProviders(<WalletDepositContractPage />);

    expect(await screen.findByText('Unable to load deposit instructions')).toBeInTheDocument();
  });

  it('shows clipboard failures and allows refreshing deposit instructions', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/deposit/networks', () => {
        requests += 1;
        return HttpResponse.json(networks);
      }),
    );
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderWithProviders(<WalletDepositContractPage />);
    await screen.findByLabelText('Deposit network');
    await userEvent.click(screen.getByRole('button', { name: 'Copy USDT deposit address' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Clipboard access is unavailable');

    await userEvent.click(screen.getByRole('button', { name: 'Refresh deposit instructions' }));
    await waitFor(() => expect(requests).toBe(2));
  });

  it('clears the copied indicator after two seconds', async () => {
    installHandlers();
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderWithProviders(<WalletDepositContractPage />);
    await screen.findByLabelText('Deposit network');
    const copyButton = screen.getByRole('button', { name: 'Copy USDT deposit address' });
    await userEvent.click(copyButton);
    expect(copyButton.querySelector('svg')).toHaveClass('lucide-check');

    const resetCopiedIndicator = setTimeoutSpy.mock.calls.find(([, delay]) => delay === 2_000)?.[0];
    if (typeof resetCopiedIndicator !== 'function') {
      throw new Error('Expected the copied indicator reset timeout to be scheduled.');
    }
    act(() => resetCopiedIndicator());
    expect(copyButton.querySelector('svg')).toHaveClass('lucide-copy');
    setTimeoutSpy.mockRestore();
  });
});
