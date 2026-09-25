import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
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
      memoLabel: 'Memo',
    },
  ],
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function installHandlers() {
  server.use(http.get('*/wallet/deposit/networks', () => HttpResponse.json(networks)));
}

describe('Wallet deposit contract page', () => {
  it('renders a real QR value and typed network instructions', async () => {
    installHandlers();

    renderWithProviders(<WalletDepositContractPage />, {
      routerProps: { initialEntries: ['/wallet/deposit/USDT'] },
    });

    expect(await screen.findByLabelText('Deposit network')).toHaveValue('ethereum');
    expect(screen.getByLabelText('Deposit QR code')).toBeInTheDocument();
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
  });

  it('renders the shared error boundary when the deposit contract fails', async () => {
    server.use(
      http.get('*/wallet/deposit/networks', () =>
        HttpResponse.json({ code: 'DEPOSIT_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<WalletDepositContractPage />);

    expect(await screen.findByText('Unable to load deposit instructions')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
  });
});
