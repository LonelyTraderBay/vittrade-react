import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { P2POrdersContractPage } from './P2POrdersContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const response = {
  items: [
    {
      id: 'order-1',
      orderNumber: 'P2P-001',
      adId: 'ad-1',
      type: 'buy',
      asset: 'USDT',
      amount: 100,
      price: 25_000,
      total: 2_500_000,
      currency: 'VND',
      status: 'pending_payment',
      merchant: 'Alpha Merchant',
      merchantId: 'merchant-1',
      counterparty: 'user-1',
      paymentMethod: 'Bank transfer',
      createdAt: '2026-09-21T10:00:00.000Z',
      expiresAt: '2026-09-21T10:30:00.000Z',
      escrowAmount: 100,
      fee: 0,
    },
    {
      id: 'order-2',
      orderNumber: 'P2P-002',
      adId: 'ad-2',
      type: 'sell',
      asset: 'BTC',
      amount: 0.1,
      price: 1_500_000_000,
      total: 150_000_000,
      currency: 'VND',
      status: 'released',
      merchant: 'Beta Merchant',
      merchantId: 'merchant-2',
      counterparty: 'user-2',
      paymentMethod: 'Bank transfer',
      createdAt: '2026-09-20T10:00:00.000Z',
      expiresAt: '2026-09-20T10:30:00.000Z',
      escrowAmount: 0.1,
      fee: 10,
    },
    {
      id: 'order-3',
      orderNumber: 'P2P-003',
      adId: 'ad-3',
      type: 'buy',
      asset: 'ETH',
      amount: 2,
      price: 80_000_000,
      total: 160_000_000,
      currency: 'VND',
      status: 'paid',
      merchant: 'Gamma Merchant',
      merchantId: 'merchant-3',
      counterparty: 'user-3',
      paymentMethod: 'E-wallet',
      createdAt: '2026-09-19T10:00:00.000Z',
      expiresAt: '2026-09-19T10:30:00.000Z',
      escrowAmount: 2,
      fee: 20,
    },
    {
      id: 'order-4',
      orderNumber: 'P2P-004',
      adId: 'ad-4',
      type: 'sell',
      asset: 'USDC',
      amount: 500,
      price: 25_000,
      total: 12_500_000,
      currency: 'VND',
      status: 'disputed',
      merchant: 'Delta Merchant',
      merchantId: 'merchant-4',
      counterparty: 'user-4',
      paymentMethod: 'Bank transfer',
      createdAt: '2026-09-18T10:00:00.000Z',
      expiresAt: '2026-09-18T10:30:00.000Z',
      escrowAmount: 500,
      fee: 15,
    },
    {
      id: 'order-5',
      orderNumber: 'P2P-005',
      adId: 'ad-5',
      type: 'buy',
      asset: 'SOL',
      amount: 10,
      price: 3_000_000,
      total: 30_000_000,
      currency: 'VND',
      status: 'cancelled',
      merchant: 'Epsilon Merchant',
      merchantId: 'merchant-5',
      counterparty: 'user-5',
      paymentMethod: 'Bank transfer',
      createdAt: '2026-09-17T10:00:00.000Z',
      expiresAt: '2026-09-17T10:30:00.000Z',
      escrowAmount: 10,
      fee: 0,
    },
  ],
  total: 5,
};

describe('P2P orders contract page', () => {
  it('renders processing orders from the typed contract', async () => {
    server.use(http.get('*/p2p/orders', () => HttpResponse.json(response)));

    renderWithProviders(<P2POrdersContractPage />);

    expect(await screen.findByText('#P2P-001')).toBeInTheDocument();
    expect(screen.getByText('#P2P-003')).toBeInTheDocument();
    expect(screen.getByText('Total orders')).toBeInTheDocument();
    expect(screen.queryByText('#P2P-002')).not.toBeInTheDocument();
    expect(screen.queryByText('#P2P-004')).not.toBeInTheDocument();
    expect(screen.queryByText('#P2P-005')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Date' }));
    expect(screen.getByRole('button', { name: 'Amount' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open P2P dashboard' }));
    await userEvent.click(screen.getByText('#P2P-001'));
  });

  it('switches tabs and searches within the server-owned order list', async () => {
    server.use(http.get('*/p2p/orders', () => HttpResponse.json(response)));

    renderWithProviders(<P2POrdersContractPage />);
    expect(await screen.findByText('#P2P-001')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.getByText('#P2P-002')).toBeInTheDocument();
    expect(screen.getByText('#P2P-005')).toBeInTheDocument();
    expect(screen.queryByText('#P2P-001')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search P2P orders'), 'Beta');
    expect(screen.getByText('#P2P-002')).toBeInTheDocument();
    expect(screen.queryByText('#P2P-005')).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Search P2P orders'));
    await userEvent.click(screen.getByRole('button', { name: 'Disputed' }));
    expect(screen.getByText('#P2P-004')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search P2P orders'), 'unknown');
    expect(screen.getByText('No orders match the selected view.')).toBeInTheDocument();
    expect(screen.getByText('1 disputed orders recorded.')).toBeInTheDocument();
  });

  it('renders the shared error state when the P2P order contract fails', async () => {
    server.use(
      http.get('*/p2p/orders', () =>
        HttpResponse.json({ code: 'P2P_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<P2POrdersContractPage />);

    expect(await screen.findByText('Unable to load P2P orders')).toBeInTheDocument();
    expect(screen.queryByText('Total orders')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Unable to load P2P orders')).toBeInTheDocument();
  });
});
