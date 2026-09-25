import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders } from '@/test/test-utils';
import { SavingsHistoryPage, StakingHistoryPage } from './EarnHistoryPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const firstPage = {
  items: [
    {
      id: 'tx-subscribe',
      domain: 'savings',
      operation: 'subscribe',
      productId: 'sav001',
      product: 'USDT Flexible',
      asset: 'USDT',
      amount: 500,
      status: 'completed',
      createdAt: '2026-09-18T09:30:00.000Z',
    },
    {
      id: 'tx-redeem',
      domain: 'savings',
      operation: 'redeem',
      productId: 'sav001',
      product: 'USDT Flexible',
      asset: 'USDT',
      amount: 100,
      status: 'pending',
      createdAt: '2026-09-20T12:45:00.000Z',
    },
  ],
  nextCursor: 'opaque-next-page',
};

const secondPage = {
  items: [
    {
      id: 'tx-second-page',
      domain: 'savings',
      operation: 'subscribe',
      productId: 'sav002',
      product: 'BTC Fixed Savings',
      asset: 'BTC',
      amount: 0.02,
      status: 'failed',
      createdAt: '2026-09-21T15:10:00.000Z',
    },
  ],
};

describe('Savings history contract page', () => {
  it('filters by transaction type and loads the next cursor page', async () => {
    const receivedCursors: Array<string | null> = [];
    server.use(
      http.get('*/earn/transactions', ({ request }) => {
        const url = new URL(request.url);
        receivedCursors.push(url.searchParams.get('cursor'));
        expect(url.searchParams.get('domain')).toBe('savings');
        return HttpResponse.json(url.searchParams.has('cursor') ? secondPage : firstPage);
      }),
    );

    renderWithProviders(<SavingsHistoryPage />);

    expect(await screen.findByText('Đăng ký · USDT Flexible')).toBeInTheDocument();
    expect(screen.getByText('Rút vốn · USDT Flexible')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(screen.queryByText('Rút vốn · USDT Flexible')).not.toBeInTheDocument();
    expect(screen.getByText('Đăng ký · USDT Flexible')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tải thêm giao dịch' }));
    expect(await screen.findByText('Đăng ký · BTC Fixed Savings')).toBeInTheDocument();
    expect(receivedCursors).toContain('opaque-next-page');
  });

  it('shows an empty state when the selected savings domain has no transactions', async () => {
    server.use(http.get('*/earn/transactions', () => HttpResponse.json({ items: [] })));

    renderWithProviders(<SavingsHistoryPage />);

    expect(await screen.findByText('Chưa có giao dịch tiết kiệm')).toBeInTheDocument();
  });

  it('uses the same typed history boundary for staking transactions', async () => {
    server.use(
      http.get('*/earn/transactions', ({ request }) => {
        expect(new URL(request.url).searchParams.get('domain')).toBe('staking');
        return HttpResponse.json({
          items: [
            {
              id: 'staking-tx-1',
              domain: 'staking',
              operation: 'subscribe',
              productId: 'stk001',
              product: 'ETH Staking',
              asset: 'ETH',
              amount: 0.1,
              status: 'completed',
              createdAt: '2026-09-22T10:00:00.000Z',
            },
          ],
        });
      }),
    );

    renderWithProviders(<StakingHistoryPage />);

    expect(await screen.findByText('Lịch sử staking')).toBeInTheDocument();
    expect(await screen.findByText('Đăng ký · ETH Staking')).toBeInTheDocument();
  });

  it('allows retry after the first history page fails', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/earn/transactions', () => {
        requestCount += 1;
        return requestCount <= 3
          ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
          : HttpResponse.json(firstPage);
      }),
    );

    renderWithProviders(<SavingsHistoryPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.getByText('Đăng ký · USDT Flexible')).toBeInTheDocument());
  });

  it('allows retry when loading a later history page fails', async () => {
    let nextPageRequestCount = 0;
    server.use(
      http.get('*/earn/transactions', ({ request }) => {
        const url = new URL(request.url);
        if (!url.searchParams.has('cursor')) return HttpResponse.json(firstPage);
        nextPageRequestCount += 1;
        return nextPageRequestCount <= 3
          ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
          : HttpResponse.json(secondPage);
      }),
    );

    renderWithProviders(<SavingsHistoryPage />);
    await screen.findByText('Đăng ký · USDT Flexible');
    fireEvent.click(screen.getByRole('button', { name: 'Tải thêm giao dịch' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được trang tiếp theo');
    fireEvent.click(screen.getByRole('button', { name: 'Thử tải lại trang tiếp theo' }));
    expect(await screen.findByText('Đăng ký · BTC Fixed Savings')).toBeInTheDocument();
  });
});
