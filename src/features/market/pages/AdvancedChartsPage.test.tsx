import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useQueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';
import { AdvancedChartsPage } from './AdvancedChartsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const pair = (id: string, symbol: string, change24h = 2.5) => ({
  id,
  symbol,
  baseAsset: symbol.split('/')[0],
  quoteAsset: symbol.split('/')[1],
  price: id === 'eth-usdt' ? 3_500 : 67_000,
  prevPrice: 66_000,
  change24h,
  high24h: 68_000,
  low24h: 65_000,
  volume24h: 1_000_000,
  marketCap: 10_000_000,
  sparklineData: [65_000, 66_000, 67_000],
  logoColor: '#627EEA',
  category: 'Layer 1',
});

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

function PairListTestControls() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <>
      <button
        onClick={() =>
          queryClient.setQueryData(['market', 'pairs', { limit: 100 }], {
            items: [pair('btc-usdt', 'BTC/USDT')],
          })
        }
      >
        Refresh pair list without selected pair
      </button>
      <button onClick={() => navigate('/trade/advanced-chart/btc-usdt')}>
        Open BTC chart route
      </button>
    </>
  );
}

describe('AdvancedChartsPage route pair', () => {
  it('loads the pair identified by the protected route instead of defaulting to the first list item', async () => {
    const requestedPairIds: string[] = [];
    const candleRequests: Array<{ pairId: string; interval: string | null }> = [];
    server.use(
      http.get('*/market/pairs', () =>
        HttpResponse.json({ items: [pair('btc-usdt', 'BTC/USDT')] }),
      ),
      http.get('*/market/pairs/:pairId', ({ params }) => {
        requestedPairIds.push(String(params.pairId));
        return HttpResponse.json(pair('eth-usdt', 'ETH/USDT'));
      }),
      http.get('*/market/pairs/:pairId/candles', ({ params, request }) => {
        candleRequests.push({
          pairId: String(params.pairId),
          interval: new URL(request.url).searchParams.get('interval'),
        });
        return HttpResponse.json({
          items: [
            { time: 1_790_000_000, open: 3_400, high: 3_600, low: 3_350, close: 3_500, volume: 20 },
          ],
          updatedAt: '2026-09-25T08:30:00.000Z',
        });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/trade/advanced-chart/:pairId" element={<AdvancedChartsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/advanced-chart/eth-usdt'] } },
    );

    expect(await screen.findByText('3,500.00')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Chọn cặp cho biểu đồ' })).toHaveValue('eth-usdt');
    expect(requestedPairIds).toContain('eth-usdt');

    await waitFor(() =>
      expect(candleRequests).toContainEqual({ pairId: 'eth-usdt', interval: '1d' }),
    );
    await userEvent.click(screen.getByRole('button', { name: '4h' }));
    await waitFor(() =>
      expect(candleRequests).toContainEqual({ pairId: 'eth-usdt', interval: '4h' }),
    );
  });

  it('shows an explicit empty state when the candle contract has no data', async () => {
    server.use(
      http.get('*/market/pairs', () =>
        HttpResponse.json({ items: [pair('btc-usdt', 'BTC/USDT')] }),
      ),
      http.get('*/market/pairs/:pairId', () => HttpResponse.json(pair('eth-usdt', 'ETH/USDT'))),
      http.get('*/market/pairs/:pairId/candles', () =>
        HttpResponse.json({ items: [], updatedAt: '2026-09-25T08:30:00.000Z' }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/trade/advanced-chart/:pairId" element={<AdvancedChartsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/advanced-chart/eth-usdt'] } },
    );

    expect(await screen.findByText('Chưa có dữ liệu nến cho khung 1d.')).toBeVisible();
    expect(screen.queryByRole('img', { name: /Giá đóng cửa/ })).not.toBeInTheDocument();
  });

  it('offers retry after a candle contract failure and renders returned data', async () => {
    let attempts = 0;
    let allowSuccess = false;
    server.use(
      http.get('*/market/pairs', () =>
        HttpResponse.json({ items: [pair('btc-usdt', 'BTC/USDT')] }),
      ),
      http.get('*/market/pairs/:pairId', () => HttpResponse.json(pair('eth-usdt', 'ETH/USDT'))),
      http.get('*/market/pairs/:pairId/candles', () => {
        attempts += 1;
        return allowSuccess
          ? HttpResponse.json({
              items: [
                {
                  time: 1_790_000_000,
                  open: 3_400,
                  high: 3_600,
                  low: 3_350,
                  close: 3_500,
                  volume: 20,
                },
              ],
              updatedAt: '2026-09-25T08:30:00.000Z',
            })
          : HttpResponse.json({ message: 'Candle service unavailable' }, { status: 503 });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/trade/advanced-chart/:pairId" element={<AdvancedChartsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/advanced-chart/eth-usdt'] } },
    );

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 5_000 });
    allowSuccess = true;
    await userEvent.click(retryButton);

    expect(
      await screen.findByRole('img', { name: 'Giá đóng cửa ETH/USDT, khung 1d' }),
    ).toBeInTheDocument();
    expect(attempts).toBeGreaterThan(1);
  });

  it('uses the first listed pair without a route id, switches pairs, and follows chart actions', async () => {
    const candleRequests: string[] = [];
    server.use(
      http.get('*/market/pairs', () =>
        HttpResponse.json({
          items: [pair('btc-usdt', 'BTC/USDT'), pair('eth-usdt', 'ETH/USDT', -1.25)],
        }),
      ),
      http.get('*/market/pairs/:pairId/candles', ({ params }) => {
        candleRequests.push(String(params.pairId));
        return HttpResponse.json({
          items: [
            { time: 1_790_000_000, open: 3_400, high: 3_600, low: 3_350, close: 3_500, volume: 20 },
          ],
          updatedAt: '2026-09-25T08:30:00.000Z',
        });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/trade/advanced-chart" element={<AdvancedChartsPage />} />
        <Route
          path="*"
          element={
            <>
              <AdvancedChartsPage />
              <CurrentPath />
            </>
          }
        />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/advanced-chart'] } },
    );

    expect(
      await screen.findByRole('img', { name: 'Giá đóng cửa BTC/USDT, khung 1d' }),
    ).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Chọn cặp cho biểu đồ' }),
      'eth-usdt',
    );
    expect(
      await screen.findByRole('img', { name: 'Giá đóng cửa ETH/USDT, khung 1d' }),
    ).toBeInTheDocument();
    expect(screen.getByText('-1.25%')).toBeVisible();
    await waitFor(() => expect(candleRequests).toContain('eth-usdt'));

    await userEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/pair/eth-usdt');
    await userEvent.click(screen.getByRole('button', { name: 'Market depth' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/pair/eth-usdt/depth');
    await userEvent.click(screen.getByRole('button', { name: 'Screener' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/markets/screener');
  });

  it('falls back to the first available pair when refreshed data removes the selected pair', async () => {
    server.use(
      http.get('*/market/pairs', () =>
        HttpResponse.json({
          items: [pair('btc-usdt', 'BTC/USDT'), pair('eth-usdt', 'ETH/USDT')],
        }),
      ),
      http.get('*/market/pairs/:pairId', ({ params }) =>
        HttpResponse.json(pair(String(params.pairId), 'BTC/USDT')),
      ),
      http.get('*/market/pairs/:pairId/candles', () =>
        HttpResponse.json({
          items: [
            { time: 1_790_000_000, open: 3_400, high: 3_600, low: 3_350, close: 3_500, volume: 20 },
          ],
          updatedAt: '2026-09-25T08:30:00.000Z',
        }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route
          path="/trade/advanced-chart/:pairId?"
          element={
            <>
              <AdvancedChartsPage />
              <PairListTestControls />
            </>
          }
        />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/advanced-chart'] } },
    );

    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: 'Chọn cặp cho biểu đồ' }),
      'eth-usdt',
    );
    await waitFor(() => expect(screen.getByText('3,500.00')).toBeVisible());
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh pair list without selected pair' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open BTC chart route' }));

    expect(
      await screen.findByRole('img', { name: 'Giá đóng cửa BTC/USDT, khung 1d' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Chọn cặp cho biểu đồ' })).toHaveValue('btc-usdt');
  });

  it('retries a failed pair-list request and shows the empty-pairs error state', async () => {
    let allowSuccess = false;
    server.use(
      http.get('*/market/pairs', () =>
        allowSuccess
          ? HttpResponse.json({ items: [] })
          : HttpResponse.json({ message: 'Market service unavailable' }, { status: 503 }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/trade/advanced-chart" element={<AdvancedChartsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/advanced-chart'] } },
    );

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    allowSuccess = true;
    await userEvent.click(retryButton);
    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(
      screen.queryByRole('combobox', { name: 'Chọn cặp cho biểu đồ' }),
    ).not.toBeInTheDocument();
  });

  it('retries a missing route pair while preserving a successful pair list', async () => {
    let allowSuccess = false;
    let pairAttempts = 0;
    server.use(
      http.get('*/market/pairs', () =>
        HttpResponse.json({ items: [pair('btc-usdt', 'BTC/USDT')] }),
      ),
      http.get('*/market/pairs/:pairId', () => {
        pairAttempts += 1;
        return allowSuccess
          ? HttpResponse.json(pair('eth-usdt', 'ETH/USDT'))
          : HttpResponse.json({ message: 'Pair not found' }, { status: 404 });
      }),
      http.get('*/market/pairs/:pairId/candles', () =>
        HttpResponse.json({ items: [], updatedAt: '2026-09-25T08:30:00.000Z' }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/trade/advanced-chart/:pairId" element={<AdvancedChartsPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/advanced-chart/eth-usdt'] } },
    );

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    allowSuccess = true;
    await userEvent.click(retryButton);
    expect(await screen.findByText('3,500.00')).toBeVisible();
    expect(pairAttempts).toBeGreaterThan(1);
    expect(screen.getByRole('combobox', { name: 'Chọn cặp cho biểu đồ' })).toHaveValue('eth-usdt');
  });
});
