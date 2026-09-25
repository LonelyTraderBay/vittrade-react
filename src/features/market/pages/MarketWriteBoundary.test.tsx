import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { MarketPriceAlert } from '../model/market-types';
import { MarketPriceAlertsPage } from './MarketPriceAlertsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 100_000,
  prevPrice: 99_000,
  change24h: 1.01,
  high24h: 101_000,
  low24h: 98_000,
  volume24h: 1_000_000,
  marketCap: 2_000_000_000,
  sparklineData: [99_000, 100_000],
  logoColor: '#F59E0B',
  category: 'Layer 1',
};

const alert = {
  id: 'alert-1',
  pairId: pair.id,
  symbol: pair.symbol,
  condition: 'above' as const,
  targetPrice: 101_000,
  currentPrice: pair.price,
  isActive: true,
  createdAt: '2026-09-23T00:00:00.000Z',
};

const triggeredAlert = {
  ...alert,
  id: 'alert-triggered',
  symbol: 'ETH/USDT',
  condition: 'below' as const,
  isActive: false,
  triggeredAt: '2026-09-23T12:00:00.000Z',
};

const pausedAlert = {
  ...alert,
  id: 'alert-paused',
  symbol: 'SOL/USDT',
  isActive: false,
};

function serveMarketData(alerts: MarketPriceAlert[] = [alert]) {
  server.use(
    http.get('*/market/price-alerts', () => HttpResponse.json({ items: alerts })),
    http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
  );
}

function readOnlyAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions: ['market:read'] },
    },
  };
}

function writeAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['market:alerts:write'],
      },
    },
  };
}

describe('Market write permission boundary', () => {
  it('keeps price-alert mutations disabled for read-only market sessions', async () => {
    server.use(
      http.get('*/market/price-alerts', () => HttpResponse.json({ items: [alert] })),
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
    );

    renderWithProviders(<MarketPriceAlertsPage />, { authAdapter: readOnlyAdapter() });

    expect(
      await screen.findByText('Market price alerts are read-only for this session.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Xóa cảnh báo/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Tắt cảnh báo/i })).toBeDisabled();
  });

  it('shows a loading state until both alert and pair data arrive', async () => {
    server.use(
      http.get('*/market/price-alerts', async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
        return HttpResponse.json({ items: [alert] });
      }),
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
    );

    renderWithProviders(<MarketPriceAlertsPage />);

    expect(await screen.findByText('Đang tải cảnh báo giá…')).toBeInTheDocument();
    expect(await screen.findAllByText('BTC/USDT')).not.toHaveLength(0);
  });

  it('filters all, active, and triggered alerts without counting paused alerts as triggered', async () => {
    serveMarketData([alert, triggeredAlert, pausedAlert]);
    renderWithProviders(<MarketPriceAlertsPage />);

    expect((await screen.findAllByText('BTC/USDT')).length).toBeGreaterThan(1);
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getByText('SOL/USDT')).toBeInTheDocument();
    expect(screen.getAllByText('Đã kích hoạt', { selector: 'span' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Đang hoạt động' }));
    expect(screen.getAllByText('BTC/USDT')).toHaveLength(2);
    expect(screen.queryByText('ETH/USDT')).not.toBeInTheDocument();
    expect(screen.queryByText('SOL/USDT')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Đã kích hoạt' }));
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getAllByText('BTC/USDT')).toHaveLength(1);
    expect(screen.queryByText('SOL/USDT')).not.toBeInTheDocument();
  });

  it('reuses the create idempotency key when retrying the same alert after failure', async () => {
    serveMarketData();
    let createRequest: unknown;
    let attempts = 0;
    const idempotencyKeys: string[] = [];
    server.use(
      http.post('*/market/price-alerts', async ({ request }) => {
        createRequest = await request.json();
        attempts += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (attempts === 1) {
          return HttpResponse.json({ message: 'Price alert service unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...alert, condition: 'below', targetPrice: 102_000 });
      }),
    );
    renderWithProviders(<MarketPriceAlertsPage />, { authAdapter: writeAdapter() });

    const targetInput = await screen.findByLabelText('Mức giá mục tiêu');
    fireEvent.change(targetInput, { target: { value: '102000' } });
    fireEvent.change(screen.getByLabelText('Điều kiện cảnh báo'), {
      target: { value: 'below' },
    });
    const createButton = screen.getByRole('button', { name: 'Tạo' });
    fireEvent.click(createButton);

    expect(await screen.findByRole('alert')).toHaveTextContent('Hãy thử lại.');
    fireEvent.click(createButton);

    await waitFor(() =>
      expect(createRequest).toEqual({
        pairId: pair.id,
        condition: 'below',
        targetPrice: 102_000,
      }),
    );
    await waitFor(() => expect(attempts).toBe(2));
    expect(idempotencyKeys[0]).toMatch(/^price-alert-create-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    expect((targetInput as HTMLInputElement).value).toBe('');
  });

  it('does not submit an alert with a zero target price', async () => {
    serveMarketData();
    let createCalls = 0;
    server.use(
      http.post('*/market/price-alerts', () => {
        createCalls += 1;
        return HttpResponse.json(alert);
      }),
    );
    renderWithProviders(<MarketPriceAlertsPage />, { authAdapter: writeAdapter() });

    const targetInput = await screen.findByLabelText('Mức giá mục tiêu');
    fireEvent.change(targetInput, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tạo' }));

    expect(createCalls).toBe(0);
  });

  it('reuses update and delete idempotency keys when retrying failed mutations', async () => {
    serveMarketData();
    let updateAttempts = 0;
    const updateKeys: string[] = [];
    let deleteAttempts = 0;
    const deleteKeys: string[] = [];
    server.use(
      http.patch('*/market/price-alerts/alert-1', async ({ request }) => {
        updateAttempts += 1;
        updateKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (updateAttempts === 1) {
          return HttpResponse.json({ message: 'Price alert update unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...alert, isActive: false });
      }),
      http.delete('*/market/price-alerts/alert-1', ({ request }) => {
        deleteAttempts += 1;
        deleteKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (deleteAttempts === 1) {
          return HttpResponse.json({ message: 'Price alert delete unavailable' }, { status: 503 });
        }
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<MarketPriceAlertsPage />, { authAdapter: writeAdapter() });

    const toggle = await screen.findByRole('button', { name: 'Tắt cảnh báo' });
    fireEvent.click(toggle);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể cập nhật cảnh báo giá.');
    fireEvent.click(toggle);
    await waitFor(() => expect(updateAttempts).toBe(2));
    expect(updateKeys[0]).toMatch(/^price-alert-update-alert-1-/);
    expect(updateKeys[1]).toBe(updateKeys[0]);

    const remove = screen.getByRole('button', { name: 'Xóa cảnh báo' });
    fireEvent.click(remove);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa cảnh báo giá.');
    fireEvent.click(remove);
    await waitFor(() => expect(deleteAttempts).toBe(2));
    expect(deleteKeys[0]).toMatch(/^price-alert-delete-alert-1-/);
    expect(deleteKeys[1]).toBe(deleteKeys[0]);
  });

  it('retries both dependent requests when pair data fails', async () => {
    let pairRequests = 0;
    let pairsAvailable = false;
    server.use(
      http.get('*/market/price-alerts', () => HttpResponse.json({ items: [alert] })),
      http.get('*/market/pairs', () => {
        pairRequests += 1;
        if (!pairsAvailable) {
          return HttpResponse.json({ code: 'MARKET_UNAVAILABLE' }, { status: 503 });
        }
        return HttpResponse.json({ items: [pair] });
      }),
    );
    renderWithProviders(<MarketPriceAlertsPage />);

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    pairsAvailable = true;
    fireEvent.click(retryButton);

    expect(await screen.findByRole('button', { name: 'Tạo' })).toBeInTheDocument();
    expect(pairRequests).toBeGreaterThan(1);
  });
});
