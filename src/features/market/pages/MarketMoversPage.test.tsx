import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { MarketMoverSummary } from '@/features/market';
import { MarketMoversPage } from './MarketMoversPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function mover(overrides: Partial<MarketMoverSummary> = {}): MarketMoverSummary {
  return {
    id: 'sol-usdt',
    symbol: 'SOL',
    name: 'Solana',
    price: 178.32,
    change1h: 1.2,
    change24h: 8.07,
    change7d: 12.34,
    volume24h: 3_456_789_000,
    volumeChange24h: 45.2,
    marketCap: 78_456_789_000,
    category: 'Layer 1',
    color: '#9945FF',
    sparkline: [165, 168, 170, 172, 175, 178],
    ...overrides,
  };
}

function PairDestination() {
  const { pairId } = useParams();
  return <p>Pair detail: {pairId}</p>;
}

function renderMovers() {
  return renderWithProviders(
    <Routes>
      <Route path="/w/markets/movers" element={<MarketMoversPage />} />
      <Route path="/w/pair/:pairId" element={<PairDestination />} />
    </Routes>,
    { routerProps: { initialEntries: ['/w/markets/movers'] } },
  );
}

describe('MarketMoversPage contract', () => {
  it('loads server movers and navigates to the pair in the current web shell', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/movers', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({
          items: [mover({ isNew: true, listingDate: '2026-09-20' })],
          updatedAt: '2026-09-27T08:00:00.000Z',
        });
      }),
    );
    const user = userEvent.setup();
    renderMovers();

    expect(screen.getByText('Đang tải danh sách biến động…')).toBeVisible();
    expect(await screen.findByText('Solana')).toBeVisible();
    expect(screen.getByText('NEW')).toBeVisible();
    expect(screen.getByText(/1 tài sản · cập nhật/)).toBeVisible();

    const row = screen.getByText('Solana').closest('button');
    expect(row).not.toBeNull();
    await user.click(row as HTMLButtonElement);
    expect(await screen.findByText('Pair detail: sol-usdt')).toBeVisible();
  });

  it('sends the selected view, timeframe and category to the API', async () => {
    const requestedFilters: string[] = [];
    server.use(
      http.get('http://localhost:3000/api/market/movers', ({ request }) => {
        const url = new URL(request.url);
        requestedFilters.push(
          [
            url.searchParams.get('view'),
            url.searchParams.get('timeframe'),
            url.searchParams.get('category'),
          ].join('|'),
        );
        return HttpResponse.json({ items: [mover()], updatedAt: '2026-09-27T08:00:00.000Z' });
      }),
    );
    const user = userEvent.setup();
    renderMovers();

    expect(await screen.findByText('Solana')).toBeVisible();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc theo ngành' }), 'DeFi');
    await user.click(screen.getByRole('button', { name: 'Hoạt động' }));
    await user.click(screen.getByRole('button', { name: '1h' }));
    await user.click(screen.getByRole('button', { name: 'KL bất thường' }));

    await waitFor(() => expect(requestedFilters).toContain('unusual-volume|1h|DeFi'));
    expect(await screen.findByText(/KL$/)).toBeVisible();
  });

  it('offers retry after failure and renders an empty result state', async () => {
    let shouldFail = true;
    server.use(
      http.get('http://localhost:3000/api/market/movers', () =>
        shouldFail
          ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
          : HttpResponse.json({ items: [], updatedAt: '2026-09-27T08:00:00.000Z' }),
      ),
    );
    const user = userEvent.setup();
    renderMovers();

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    shouldFail = false;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Không có dữ liệu cho bộ lọc hiện tại.')).toBeVisible();
  });
});
