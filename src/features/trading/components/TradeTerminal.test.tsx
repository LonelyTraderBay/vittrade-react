import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { OCOOrderParams } from './OCOOrderForm';
import type { TradingOrder } from '../model/trading-types';
import { TradeTerminal } from './TradeTerminal';

vi.mock('lightweight-charts', () => ({
  CandlestickSeries: {},
  ColorType: {},
  HistogramSeries: {},
  LineSeries: {},
  createChart: vi.fn(() => ({
    addSeries: vi.fn(() => ({
      priceScale: vi.fn(() => ({ applyOptions: vi.fn() })),
      setData: vi.fn(),
    })),
    remove: vi.fn(),
    timeScale: vi.fn(() => ({ fitContent: vi.fn() })),
  })),
}));

// The order lifecycle boundary is under test here. Presentation-heavy chart,
// order-book and advanced-form implementations have their own contracts/tests
// and must not expand this integration test's coverage denominator.
vi.mock('./MiniChart', () => ({ MiniChart: () => null }));
vi.mock('./OrderBook', () => ({ OrderBook: () => null }));
vi.mock('./RecentTrades', () => ({ RecentTrades: () => null }));
vi.mock('./TPSLForm', () => ({ TPSLForm: () => null }));
vi.mock('./QuickPairSwitcher', () => ({
  QuickPairSwitcher: ({ open, onSelect }: { open: boolean; onSelect: (pairId: string) => void }) =>
    open ? (
      <button type="button" onClick={() => onSelect('ethusdt')}>
        Select ETH/USDT fixture
      </button>
    ) : null,
}));
vi.mock('./OCOOrderForm', () => ({
  OCOOrderForm: ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (params: OCOOrderParams) => void | Promise<void>;
    onCancel: () => void;
  }) => (
    <>
      <button
        type="button"
        onClick={() => {
          void Promise.resolve(
            onSubmit({
              side: 'buy',
              symbol: 'BTC/USDT',
              baseAsset: 'BTC',
              currentPrice: 65_000,
              takeProfitPrice: '70000',
              takeProfitAmount: '0.1',
              stopLossPrice: '60000',
              stopLossAmount: '0.05',
              amountType: 'split',
            }),
          ).catch(() => undefined);
        }}
      >
        Submit OCO fixture
      </button>
      <button type="button" onClick={onCancel}>
        Hủy OCO
      </button>
    </>
  ),
}));
vi.mock('./TradingFeeNotice', () => ({ TradingFeeNotice: () => null }));

const server = setupServer();

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65_000,
  prevPrice: 64_000,
  change24h: 1.56,
  high24h: 66_000,
  low24h: 63_000,
  volume24h: 1_000_000_000,
  marketCap: 1_200_000_000_000,
  sparklineData: [64_000, 64_500, 65_000],
  logoColor: '#F7931A',
  category: 'Layer 1',
};

const assets = {
  items: [
    {
      id: 'asset-btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 1,
      available: 1,
      frozen: 0,
      inOrder: 0,
      usdValue: 65_000,
      change24h: 1.56,
      logoColor: '#F7931A',
    },
    {
      id: 'asset-usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 100_000,
      available: 100_000,
      frozen: 0,
      inOrder: 0,
      usdValue: 100_000,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: {
    totalUsd: 165_000,
    totalBtc: 1,
    availableUsd: 165_000,
    inOrderUsd: 0,
    frozenUsd: 0,
  },
};

const candles = {
  items: [
    { time: 1_700_000_000, open: 64_000, high: 65_000, low: 63_500, close: 64_500, volume: 100 },
    { time: 1_700_003_600, open: 64_500, high: 65_500, low: 64_000, close: 65_000, volume: 120 },
  ],
  updatedAt: '2026-09-22T10:00:00.000Z',
};

const openOrder = {
  id: 'open-order-1',
  symbol: 'BTC/USDT',
  side: 'buy' as const,
  type: 'limit' as const,
  price: 64_500,
  amount: 0.1,
  filled: 0,
  status: 'open' as const,
  createdAt: '2026-09-22T09:00:00.000Z',
  fee: 0,
};

function renderTrade(authAdapter: AuthAdapter = testAuthAdapter, initialEntry = '/trade/btc-usdt') {
  return renderWithProviders(
    <Routes>
      <Route path="/trade/:pairId" element={<TradeTerminal />} />
      <Route path="/trade/order-receipt" element={<OrderReceiptState />} />
    </Routes>,
    { routerProps: { initialEntries: [initialEntry] }, authAdapter },
  );
}

function OrderReceiptState() {
  const location = useLocation();
  const order = (location.state as { order?: { fee?: number; orderId?: string } } | null)?.order;
  return (
    <>
      <output data-testid="order-receipt-fee">{String(order?.fee)}</output>
      <output data-testid="order-receipt-id">{String(order?.orderId)}</output>
    </>
  );
}

function useDefaultHandlers(openOrders: TradingOrder[] = [], orderHistory: TradingOrder[] = []) {
  server.use(
    http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
    http.get('*/market/pairs/btc-usdt', () => HttpResponse.json(pair)),
    http.get('*/market/pairs/btc-usdt/candles', () => HttpResponse.json(candles)),
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/trading/orders', () => HttpResponse.json({ items: openOrders })),
    http.get('*/trading/orders/history', () => HttpResponse.json({ items: orderHistory })),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => useDefaultHandlers());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TradeTerminal contract-backed order lifecycle', () => {
  it('validates the form before opening confirmation and places a limit order', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;
    let idempotencyKey: string | null = null;

    server.use(
      http.post('*/trading/orders', async ({ request }) => {
        requestBody = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({
          ...openOrder,
          id: 'placed-order-1',
          fee: 12.34,
          status: 'open',
        });
      }),
    );

    renderTrade();
    await screen.findByText('BTC/USDT');

    const placeButton = screen.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i });
    expect(placeButton).toBeDisabled();

    fireEvent.change(screen.getByTestId('trade-amount'), { target: { value: '0.1' } });
    expect(placeButton).toBeEnabled();

    await user.click(placeButton);
    expect(screen.getByText('Xác nhận lệnh')).toBeInTheDocument();

    await user.click(screen.getByTestId('trade-confirm-submit'));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 65_000,
      });
      expect(idempotencyKey).toEqual(expect.any(String));
      expect(idempotencyKey).not.toBe('');
    });
    expect(await screen.findByTestId('order-receipt-fee')).toHaveTextContent('12.34');
  });

  it('submits OCO legs through the order contract and navigates to its receipt', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;
    let idempotencyKey: string | null = null;

    server.use(
      http.post('*/trading/orders', async ({ request }) => {
        requestBody = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({ ...openOrder, id: 'oco-order-1', fee: 4.56 });
      }),
    );

    renderTrade();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Hiện loại lệnh nâng cao' }));
    await user.click(screen.getByRole('button', { name: 'OCO' }));
    await user.click(screen.getByRole('button', { name: 'Submit OCO fixture' }));

    await waitFor(() => {
      expect(requestBody).toMatchObject({
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'oco',
        amount: 0.1,
        price: 65_000,
        tpPrice: 70_000,
        slPrice: 60_000,
        tpAmount: 0.1,
        slAmount: 0.05,
        amountType: 'split',
      });
      expect(idempotencyKey).toEqual(expect.any(String));
      expect(idempotencyKey).not.toBe('');
    });
    expect(await screen.findByTestId('order-receipt-fee')).toHaveTextContent('4.56');
  });

  it('keeps the same OCO idempotency key when retrying unchanged legs', async () => {
    const user = userEvent.setup();
    const idempotencyKeys: string[] = [];
    let requests = 0;

    server.use(
      http.post('*/trading/orders', ({ request }) => {
        requests += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (requests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...openOrder, id: 'oco-retry-order-1' });
      }),
    );

    renderTrade();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Hiện loại lệnh nâng cao' }));
    await user.click(screen.getByRole('button', { name: 'OCO' }));
    const submitButton = screen.getByRole('button', { name: 'Submit OCO fixture' });
    await user.click(submitButton);
    await waitFor(() => expect(requests).toBe(1));
    await user.click(submitButton);

    await waitFor(() => {
      expect(requests).toBe(2);
      expect(idempotencyKeys[0]).toEqual(expect.any(String));
      expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    });
    expect(await screen.findByTestId('order-receipt-id')).toHaveTextContent('oco-retry-order-1');
  });

  it('returns from OCO entry to a limit order when OCO is cancelled', async () => {
    const user = userEvent.setup();
    renderTrade();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Hiện loại lệnh nâng cao' }));
    await user.click(screen.getByRole('button', { name: 'OCO' }));
    expect(screen.getByRole('button', { name: 'Submit OCO fixture' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hủy OCO' }));

    expect(screen.queryByRole('button', { name: 'Submit OCO fixture' })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Giá đặt/)).toBeInTheDocument();
  });

  it('switches pairs through the route and reloads the selected market contract', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/market/pairs/ethusdt', () =>
        HttpResponse.json({ ...pair, id: 'ethusdt', symbol: 'ETH/USDT', baseAsset: 'ETH' }),
      ),
    );

    renderTrade();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'BTC BTC/USDT' }));
    await user.click(screen.getByRole('button', { name: 'Select ETH/USDT fixture' }));

    expect(await screen.findByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getByLabelText(/Khối lượng \(ETH\)/)).toBeInTheDocument();
  });

  it('uses the sell-side balance when applying a percentage amount', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;

    server.use(
      http.post('*/trading/orders', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ ...openOrder, id: 'sell-order-1', side: 'sell' });
      }),
    );

    renderTrade(testAuthAdapter, '/trade/btc-usdt?side=sell');
    await screen.findByText('BTC/USDT');
    const sellButton = screen.getByRole('button', { name: /Đặt lệnh bán BTC\/USDT/i });
    await user.click(screen.getByRole('button', { name: '100%' }));
    expect(screen.getByTestId('trade-amount')).toHaveValue(1);
    await user.click(sellButton);
    await user.click(screen.getByTestId('trade-confirm-submit'));

    await waitFor(() => {
      expect(requestBody).toMatchObject({ side: 'sell', amount: 1, symbol: 'BTC/USDT' });
    });
    expect(await screen.findByTestId('order-receipt-id')).toHaveTextContent('sell-order-1');
  });

  it('blocks a buy order whose total exceeds the available quote balance', async () => {
    renderTrade();
    await screen.findByText('BTC/USDT');

    fireEvent.change(screen.getByTestId('trade-amount'), { target: { value: '2' } });

    expect(screen.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i })).toBeDisabled();
  });

  it('blocks a sell order whose amount exceeds the available base balance', async () => {
    renderTrade(testAuthAdapter, '/trade/btc-usdt?side=sell');
    await screen.findByText('BTC/USDT');

    fireEvent.change(screen.getByTestId('trade-amount'), { target: { value: '1.1' } });

    expect(screen.getByRole('button', { name: /Đặt lệnh bán BTC\/USDT/i })).toBeDisabled();
  });

  it('opens a historical order receipt from the history tab', async () => {
    const user = userEvent.setup();
    const historyOrder = {
      ...openOrder,
      id: 'history-order-1',
      filled: openOrder.amount,
      status: 'filled' as const,
    };

    server.resetHandlers();
    useDefaultHandlers([], [historyOrder]);
    renderTrade();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('tab', { name: /Lịch sử/ }));
    await user.click(await screen.findByText('Đã khớp'));

    expect(await screen.findByTestId('order-receipt-id')).toHaveTextContent('history-order-1');
    expect(screen.getByTestId('order-receipt-fee')).toHaveTextContent('0');
  });

  it('cancels an open order with an idempotency key', async () => {
    const user = userEvent.setup();
    let cancelledOrderId: string | undefined;
    const idempotencyKeys: string[] = [];
    let cancelRequests = 0;

    server.resetHandlers();
    useDefaultHandlers([openOrder]);
    server.use(
      http.post('*/trading/orders/:orderId/cancel', ({ params, request }) => {
        cancelledOrderId = String(params.orderId);
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        cancelRequests += 1;
        if (cancelRequests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...openOrder, status: 'cancelled' });
      }),
    );

    renderTrade();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('tab', { name: /Đang mở/ }));
    const cancelButton = await screen.findByTestId('cancel-order-open-order-1');
    await user.click(cancelButton);
    await waitFor(() => expect(cancelRequests).toBe(1));
    await waitFor(() => expect(cancelButton).toBeEnabled());
    await user.click(cancelButton);

    await waitFor(() => {
      expect(cancelRequests).toBe(2);
      expect(cancelledOrderId).toBe('open-order-1');
      expect(idempotencyKeys[0]).toEqual(expect.any(String));
      expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    });
  });

  it('validates modified order values and sends a PATCH with an idempotency key', async () => {
    const user = userEvent.setup();
    let modifiedOrderId: string | undefined;
    let requestBody: unknown;
    const idempotencyKeys: string[] = [];
    let modifyRequests = 0;

    server.resetHandlers();
    useDefaultHandlers([openOrder]);
    server.use(
      http.patch('*/trading/orders/:orderId', async ({ params, request }) => {
        modifiedOrderId = String(params.orderId);
        requestBody = await request.json();
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        modifyRequests += 1;
        if (modifyRequests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...openOrder, price: 64_000, amount: 0.15 });
      }),
    );

    renderTrade();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('tab', { name: /Đang mở/ }));
    await user.click(await screen.findByRole('button', { name: 'Sửa' }));

    const priceInput = await screen.findByTestId('trade-modify-price');
    const amountInput = screen.getByTestId('trade-modify-amount');
    const saveButton = screen.getByRole('button', { name: 'Lưu thay đổi' });
    expect(saveButton).toBeEnabled();

    await user.clear(amountInput);
    expect(saveButton).toBeDisabled();
    expect(modifiedOrderId).toBeUndefined();

    await user.clear(priceInput);
    await user.type(priceInput, '64000');
    await user.type(amountInput, '0.15');
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);
    await waitFor(() => expect(modifyRequests).toBe(1));
    await waitFor(() => expect(saveButton).toBeEnabled());
    await user.click(saveButton);

    await waitFor(() => {
      expect(modifyRequests).toBe(2);
      expect(modifiedOrderId).toBe('open-order-1');
      expect(requestBody).toEqual({ price: 64_000, amount: 0.15 });
      expect(idempotencyKeys[0]).toEqual(expect.any(String));
      expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    });
    await waitFor(() => expect(screen.queryByText('Sửa lệnh')).not.toBeInTheDocument());
  });

  it('keeps the user on the terminal when the order API rejects the request', async () => {
    const user = userEvent.setup();
    let requestReceived = false;

    server.use(
      http.post('*/trading/orders', () => {
        requestReceived = true;
        return HttpResponse.json(
          { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' },
          { status: 409 },
        );
      }),
    );

    renderTrade();
    await screen.findByText('BTC/USDT');
    fireEvent.change(screen.getByTestId('trade-amount'), { target: { value: '0.1' } });
    await user.click(screen.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i }));
    await user.click(screen.getByTestId('trade-confirm-submit'));

    await waitFor(() => expect(requestReceived).toBe(true));
    expect(screen.queryByTestId('order-receipt-fee')).not.toBeInTheDocument();
  });

  it('reuses the order idempotency key when retrying unchanged values and validates URL side', async () => {
    const user = userEvent.setup();
    const idempotencyKeys: string[] = [];
    let requests = 0;

    server.use(
      http.post('*/trading/orders', ({ request }) => {
        requests += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (requests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...openOrder, id: 'retry-order-1', status: 'open' });
      }),
    );

    renderTrade(testAuthAdapter, '/trade/btc-usdt?side=unexpected');
    await screen.findByText('BTC/USDT');
    expect(screen.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i })).toBeVisible();
    fireEvent.change(screen.getByTestId('trade-amount'), { target: { value: '0.1' } });
    await user.click(screen.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i }));
    await user.click(screen.getByTestId('trade-confirm-submit'));

    await waitFor(() => expect(requests).toBe(1));
    await waitFor(() => expect(screen.getByTestId('trade-confirm-submit')).toBeEnabled());
    await user.click(screen.getByTestId('trade-confirm-submit'));

    await waitFor(() => {
      expect(requests).toBe(2);
      expect(idempotencyKeys[0]).toEqual(expect.any(String));
      expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    });
    expect(await screen.findByTestId('order-receipt-fee')).toBeInTheDocument();
  });

  it('keeps read-only sessions from submitting an order', async () => {
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['market:read'],
        },
      },
    };

    server.resetHandlers();
    useDefaultHandlers([openOrder]);
    renderTrade(readOnlyAdapter);
    await screen.findByText('BTC/USDT');

    expect(screen.getByTestId('trade-amount')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Trading permission is required');
    expect(screen.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i })).toBeDisabled();

    await userEvent.setup().click(screen.getByRole('tab', { name: /Đang mở/ }));
    expect(await screen.findByRole('button', { name: 'Sửa' })).toBeDisabled();
    expect(screen.getByTestId('cancel-order-open-order-1')).toBeDisabled();
  });

  it('rejects OCO submission in the terminal handler for a read-only session', async () => {
    const user = userEvent.setup();
    let orderRequests = 0;
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['market:read'],
        },
      },
    };

    server.use(
      http.post('*/trading/orders', () => {
        orderRequests += 1;
        return HttpResponse.json(openOrder);
      }),
    );

    renderTrade(readOnlyAdapter);
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Hiện loại lệnh nâng cao' }));
    await user.click(screen.getByRole('button', { name: 'OCO' }));

    // The fixture intentionally invokes the parent callback without applying
    // the real OCO form's disabled-button behavior.
    await user.click(screen.getByRole('button', { name: 'Submit OCO fixture' }));

    expect(orderRequests).toBe(0);
  });

  it('shows a market-pair error and retries the contract request', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/market/pairs/btc-usdt', () => {
        requestCount += 1;
        return requestCount <= 3
          ? HttpResponse.json({ message: 'Market unavailable' }, { status: 503 })
          : HttpResponse.json(pair);
      }),
    );

    renderTrade();

    expect(await screen.findByText('Không thể tải cặp giao dịch')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('BTC/USDT')).toBeInTheDocument();
    expect(requestCount).toBe(4);
  });
});
