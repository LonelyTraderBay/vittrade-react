import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { invokeStaleReactHandler } from '@/test/invoke-stale-react-handler';
import { tradingApi } from '../api/trading-api';
import type { TPSLValues } from '../model/trading-types';
import { toast } from 'sonner';
import type { OCOOrderParams } from './OCOOrderForm';
import { TradeTerminal } from './TradeTerminal';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('./TradingOrderEntryPanel', () => ({
  TradingOrderEntryPanel: ({
    pair,
    canPlace,
    setAmount,
    setTpsl,
    onRequestConfirmation,
    onSubmitOco,
  }: {
    pair: { symbol: string } | null;
    canPlace: boolean;
    setAmount: (value: string) => void;
    setTpsl: (values: TPSLValues) => void;
    onRequestConfirmation: () => void;
    onSubmitOco: (params: OCOOrderParams) => void | Promise<void>;
  }) => (
    <>
      <output data-testid="market-symbol">{pair?.symbol ?? ''}</output>
      <button type="button" onClick={() => setAmount('0.1')}>
        Set valid order amount
      </button>
      <button
        type="button"
        onClick={() =>
          setTpsl({
            enabled: true,
            tpPrice: '70000',
            slPrice: '60000',
            tpTriggerType: 'last',
            slTriggerType: 'last',
          })
        }
      >
        Set TP/SL without bracket mode
      </button>
      <button type="button" disabled={!canPlace} onClick={onRequestConfirmation}>
        Open order confirmation
      </button>
      <button
        type="button"
        onClick={() =>
          void Promise.resolve(
            onSubmitOco({
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
          ).catch(() => undefined)
        }
      >
        Emit OCO submission
      </button>
    </>
  ),
}));
vi.mock('./TradingMarketPanel', () => ({ TradingMarketPanel: () => null }));
vi.mock('./QuickPairSwitcher', () => ({ QuickPairSwitcher: () => null }));
vi.mock('./OrderConfirmationSheet', () => ({
  OrderConfirmationSheet: ({
    open,
    isPlacing,
    onClose,
    onConfirm,
  }: {
    open: boolean;
    isPlacing: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Trade order confirmation">
        <p>{isPlacing ? 'Placing order' : 'Order ready'}</p>
        <button type="button" disabled={isPlacing} onClick={onClose}>
          Request close while placing
        </button>
        <button type="button" disabled={isPlacing} onClick={onConfirm}>
          Confirm order fixture
        </button>
      </div>
    ) : null,
}));
vi.mock('./OrderHistoryPanel', () => ({ OrderHistoryPanel: () => null }));
vi.mock('./OpenOrdersPanel', () => ({
  OpenOrdersPanel: ({
    orders,
    onModifyOrder,
    onCancelOrder,
  }: {
    orders: Array<{ id: string }>;
    onModifyOrder: (orderId: string) => void;
    onCancelOrder: (orderId: string) => void;
  }) => (
    <div>
      {orders.map(({ id }) => (
        <div key={id}>
          <button type="button" onClick={() => onModifyOrder(id)}>
            Emit modify callback
          </button>
          <button type="button" onClick={() => onCancelOrder(id)}>
            Emit cancel callback
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onModifyOrder('missing-order')}>
        Emit missing-order modify callback
      </button>
    </div>
  ),
}));
vi.mock('./OrderModifySheet', () => ({
  OrderModifySheet: ({
    open,
    order,
    onSave,
  }: {
    open: boolean;
    order: { id: string } | null;
    onSave: (values: { orderId: string; price: number; amount: number }) => void | Promise<void>;
  }) =>
    open && order ? (
      <button
        type="button"
        onClick={() => void onSave({ orderId: order.id, price: 64_000, amount: 0.15 })}
      >
        Emit save callback
      </button>
    ) : null,
}));

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

const tradeReadTestAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: {
      ...testAuthAdapter.initialSession!.user,
      permissions: [...testAuthAdapter.initialSession!.user.permissions, 'trade:read'],
    },
  },
};

function renderTradeTerminal(authAdapter: AuthAdapter = tradeReadTestAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/trade/:pairId" element={<TradeTerminal />} />
    </Routes>,
    { routerProps: { initialEntries: ['/trade/btc-usdt'] }, authAdapter },
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  server.use(
    http.get('*/market/pairs/btc-usdt', () => HttpResponse.json(pair)),
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
    http.get('*/trading/orders', () => HttpResponse.json({ items: [openOrder] })),
    http.get('*/trading/orders/history', () => HttpResponse.json({ items: [] })),
  );
});
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe('TradeTerminal parent write boundary', () => {
  it('rejects modify and cancel callbacks from a read-only child without sending writes', async () => {
    let writeRequests = 0;
    server.use(
      http.patch('*/trading/orders/:orderId', () => {
        writeRequests += 1;
        return HttpResponse.json(openOrder);
      }),
      http.post('*/trading/orders/:orderId/cancel', () => {
        writeRequests += 1;
        return HttpResponse.json(openOrder);
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['market:read', 'wallet:read', 'trade:read'],
        },
      },
    };

    renderTradeTerminal(readOnlyAdapter);

    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Đang mở (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Emit modify callback' }));
    await user.click(screen.getByRole('button', { name: 'Emit save callback' }));
    await user.click(screen.getByRole('button', { name: 'Emit cancel callback' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Trading permission is required to modify an order.',
        { duration: 2000 },
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Trading permission is required to cancel an order.',
        { duration: 2000 },
      );
    });
    expect(writeRequests).toBe(0);
  });

  it('ignores an order modification callback after its order has disappeared', async () => {
    renderTradeTerminal();

    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Đang mở (1)' }));
    await user.click(screen.getByRole('button', { name: 'Emit missing-order modify callback' }));

    expect(screen.queryByRole('button', { name: 'Emit save callback' })).not.toBeInTheDocument();
  });

  it('uses safe feedback when the order adapter rejects a non-Error value', async () => {
    vi.spyOn(tradingApi, 'placeOrder').mockRejectedValueOnce('adapter failure');
    renderTradeTerminal();

    const user = userEvent.setup();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Set valid order amount' }));
    await user.click(screen.getByRole('button', { name: 'Open order confirmation' }));
    await user.click(screen.getByRole('button', { name: 'Confirm order fixture' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể đặt lệnh.', { duration: 2000 }),
    );
  });

  it('uses safe feedback when an OCO adapter rejects a non-Error value', async () => {
    vi.spyOn(tradingApi, 'placeOrder').mockRejectedValueOnce('adapter failure');
    renderTradeTerminal();

    await screen.findByText('BTC/USDT');
    await userEvent.click(screen.getByRole('button', { name: 'Emit OCO submission' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể đặt lệnh OCO.', { duration: 2000 }),
    );
  });

  it('uses the persisted bracket mode when enabled TP/SL state omits it', async () => {
    let requestBody: unknown;
    server.use(
      http.post('*/trading/orders', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ ...openOrder, id: 'tpsl-default-mode-order' });
      }),
    );
    renderTradeTerminal();

    const user = userEvent.setup();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Set TP/SL without bracket mode' }));
    await user.click(screen.getByRole('button', { name: 'Set valid order amount' }));
    const openConfirmation = screen.getByRole('button', { name: 'Open order confirmation' });
    await waitFor(() => expect(openConfirmation).toBeEnabled());
    await user.click(openConfirmation);
    await user.click(screen.getByRole('button', { name: 'Confirm order fixture' }));

    await waitFor(() =>
      expect(requestBody).toMatchObject({
        tpPrice: 70_000,
        slPrice: 60_000,
        bracketMode: false,
      }),
    );
  });

  it('uses safe feedback when modify and cancel adapters reject non-Error values', async () => {
    vi.spyOn(tradingApi, 'modifyOrder').mockRejectedValueOnce('modify adapter failure');
    vi.spyOn(tradingApi, 'cancelOrder').mockRejectedValueOnce('cancel adapter failure');
    renderTradeTerminal();

    const user = userEvent.setup();
    await user.click(await screen.findByRole('tab', { name: 'Đang mở (1)' }));
    await user.click(screen.getByRole('button', { name: 'Emit modify callback' }));
    await user.click(screen.getByRole('button', { name: 'Emit save callback' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể sửa lệnh.', { duration: 2000 }),
    );

    await user.click(screen.getByRole('button', { name: 'Emit cancel callback' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể hủy lệnh.', { duration: 2000 }),
    );
  });

  it('ignores a stale close callback while an order request is pending', async () => {
    let finishRequest!: (response: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
    server.use(http.post('*/trading/orders', () => pendingResponse));
    renderWithProviders(
      <Routes>
        <Route path="/trade/:pairId" element={<TradeTerminal />} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/btc-usdt'] }, authAdapter: testAuthAdapter },
    );

    const user = userEvent.setup();
    await screen.findByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Set valid order amount' }));
    await user.click(screen.getByRole('button', { name: 'Open order confirmation' }));
    await user.click(screen.getByRole('button', { name: 'Confirm order fixture' }));
    expect(await screen.findByText('Placing order')).toBeInTheDocument();

    const close = screen.getByRole('button', { name: 'Request close while placing' });
    expect(close).toBeDisabled();
    invokeStaleReactHandler(close, 'onClick');
    expect(screen.getByRole('dialog', { name: 'Trade order confirmation' })).toBeInTheDocument();

    finishRequest(HttpResponse.json({ ...openOrder, id: 'pending-close-order' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Trade order confirmation' }),
      ).not.toBeInTheDocument(),
    );
  });
});
