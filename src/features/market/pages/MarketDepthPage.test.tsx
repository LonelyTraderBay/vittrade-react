import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { MarketDepthPage } from './MarketDepthPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 67_543.21,
  prevPrice: 66_012.5,
  change24h: 2.34,
  high24h: 68_100,
  low24h: 65_800,
  volume24h: 23_456_789_000,
  marketCap: 1_324_567_890_000,
  sparklineData: [65_100, 66_200, 67_543.21],
  logoColor: '#F7931A',
  category: 'Layer 1',
};

const orderBook = {
  bids: [
    { price: 67_400, amount: 0.2, total: 47_230, depth: 0.7 },
    { price: 67_500, amount: 0.5, total: 33_750, depth: 0.5 },
  ],
  asks: [
    { price: 67_700, amount: 0.15, total: 27_055, depth: 0.4 },
    { price: 67_600, amount: 0.25, total: 16_900, depth: 0.25 },
  ],
  updatedAt: '2026-09-24T08:30:00.000Z',
};

function installHandlers(book = orderBook) {
  server.use(
    http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
    http.get('*/market/pairs/btc-usdt', () => HttpResponse.json(pair)),
    http.get('*/market/pairs/btc-usdt/orderbook', () => HttpResponse.json(book)),
  );
}

function renderMarketDepth() {
  return renderWithProviders(
    <Routes>
      <Route path="/pair/:pairId/depth" element={<MarketDepthPage />} />
      <Route path="/trade/:pairId" element={<p>Trade destination</p>} />
    </Routes>,
    { routerProps: { initialEntries: ['/pair/btc-usdt/depth'] } },
  );
}

describe('Market depth page', () => {
  it('renders sorted order-book levels and scales bars to the largest server total', async () => {
    installHandlers();
    renderMarketDepth();

    expect(await screen.findByText('BTC/USDT')).toBeVisible();
    expect(screen.getAllByText('Spread')).toHaveLength(2);
    expect(screen.getByText('0.1481%')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Order book' }));
    expect(screen.getByRole('button', { name: 'Order book' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const askBest = screen.getByText('67,600.00');
    const askNext = screen.getByText('67,700.00');
    const bidBest = screen.getByText('67,500.00');
    const bidNext = screen.getByText('67,400.00');
    expect(
      askBest.compareDocumentPosition(askNext) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      askNext.compareDocumentPosition(bidBest) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      bidBest.compareDocumentPosition(bidNext) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const bars = document.querySelectorAll('.relative.grid.grid-cols-3 .absolute');
    expect(bars.length).toBe(4);
    for (const bar of bars) {
      expect(Number.parseFloat((bar as HTMLElement).style.width)).toBeLessThanOrEqual(100);
    }
  });

  it('does not invent a spread and explains missing sides for an empty order book', async () => {
    installHandlers({ bids: [], asks: [], updatedAt: '2026-09-24T08:30:00.000Z' });
    renderMarketDepth();

    expect(await screen.findByText('BTC/USDT')).toBeVisible();
    expect(screen.getByText('—')).toBeVisible();
    expect(screen.getByText('Chưa đủ hai phía')).toBeVisible();
    expect(screen.getByText('Chưa có lệnh bán trong snapshot hiện tại.')).toBeVisible();
    expect(screen.getByText('Chưa có lệnh mua trong snapshot hiện tại.')).toBeVisible();
  });

  it('keeps whale alerts clearly marked as pending a backend contract', async () => {
    installHandlers();
    renderMarketDepth();

    await userEvent.click(await screen.findByRole('button', { name: 'Whale alerts' }));
    expect(screen.getByText('Whale alert contract chưa khả dụng')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Whale alerts' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
