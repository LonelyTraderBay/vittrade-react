import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { TokenInfoPage } from './TokenInfoPage';

vi.mock('@/shared/ui/charts/SparklineChart', () => ({
  SparklineChart: ({ data }: { data: number[] }) => (
    <output data-testid="sparkline" data-point-count={data.length} />
  ),
}));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65_000,
  prevPrice: 64_000,
  change24h: -1.56,
  high24h: 66_000,
  low24h: 63_000,
  volume24h: 1_000_000_000,
  marketCap: 1_200_000_000_000,
  sparklineData: [64_000, 64_500, 65_000],
  logoColor: '#F7931A',
  category: 'Layer 1',
};

function TradeRoute() {
  const location = useLocation();
  return <output data-testid="trade-path">{location.pathname}</output>;
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/w/markets/pair/:pairId/info" element={<TokenInfoPage />} />
      <Route path="/w/trade/:pairId" element={<TradeRoute />} />
    </Routes>,
    { routerProps: { initialEntries: ['/w/markets/pair/btc-usdt/info'] } },
  );
}

describe('TokenInfoPage', () => {
  it('renders validated market details and links to the pair trade route', async () => {
    server.use(http.get('*/market/pairs/btc-usdt', () => HttpResponse.json(pair)));

    renderPage();

    expect(await screen.findByText('BTC info')).toBeInTheDocument();
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline')).toHaveAttribute('data-point-count', '3');
    expect(screen.getAllByText(/1\.56%/)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Giao dịch BTC/USDT' }));
    expect(await screen.findByTestId('trade-path')).toHaveTextContent('/w/trade/btc-usdt');
  });

  it('shows a retry state for an unavailable pair and recovers from the market contract', async () => {
    let requests = 0;
    server.use(
      http.get('*/market/pairs/btc-usdt', () => {
        requests += 1;
        if (requests <= 3) {
          return HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json(pair);
      }),
    );

    renderPage();

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('BTC info')).toBeInTheDocument();
    await waitFor(() => expect(requests).toBe(4));
  });
});
