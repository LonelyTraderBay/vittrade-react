import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { focusManager } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { OpenPositionsPage } from './OpenPositionsPage';

const server = setupServer();
const updatedAt = '2026-09-26T10:00:00.000Z';
const position = {
  id: 'position-btc',
  symbol: 'BTC/USDT',
  productType: 'spot' as const,
  side: 'long' as const,
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  quantity: 0.025,
  entryPrice: 65_000,
  markPrice: 66_000,
  unrealizedPnl: 25.5,
  openedAt: '2026-09-26T09:00:00.000Z',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    },
  };
}

describe('OpenPositionsPage', () => {
  it('uses server filters and cursor pages and displays returned values without totals', async () => {
    const requests: Array<{
      productType: string | null;
      cursor: string | null;
      limit: string | null;
    }> = [];
    server.use(
      http.get('http://localhost:3000/api/trading/positions', async ({ request }) => {
        const query = new URL(request.url).searchParams;
        requests.push({
          productType: query.get('productType'),
          cursor: query.get('cursor'),
          limit: query.get('limit'),
        });

        if (query.get('productType') === 'futures' && query.get('cursor') === 'futures-next') {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json({
            items: [
              {
                ...position,
                id: 'position-eth-2',
                symbol: 'ETH/USDT',
                productType: 'futures',
                baseAsset: 'ETH',
                openedAt: '2026-09-26T08:00:00.000Z',
                unrealizedPnl: -3.25,
              },
            ],
            updatedAt,
            nextCursor: 'futures-next',
          });
        }

        if (query.get('productType') === 'futures') {
          return HttpResponse.json({
            items: [
              {
                ...position,
                id: 'position-eth-1',
                symbol: 'ETH/USDT',
                productType: 'futures',
                baseAsset: 'ETH',
                openedAt: '2026-09-26T09:30:00.000Z',
              },
            ],
            updatedAt,
            nextCursor: 'futures-next',
          });
        }

        return HttpResponse.json({ items: [position], updatedAt });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('BTC/USDT')).toBeVisible();
    expect(screen.getByText('+25.5000 USDT')).toBeVisible();
    expect(screen.queryByText('Tổng P/L')).not.toBeInTheDocument();
    expect(requests[0]).toEqual({ productType: null, cursor: null, limit: '50' });

    await user.click(screen.getByRole('button', { name: 'Futures' }));
    expect(await screen.findByText('ETH/USDT')).toBeVisible();
    expect(requests.at(-1)).toEqual({ productType: 'futures', cursor: null, limit: '50' });

    await user.click(screen.getByRole('button', { name: 'Tải thêm vị thế' }));
    expect(screen.getByRole('button', { name: 'Đang tải…' })).toBeDisabled();
    expect(await screen.findByText('−3.2500 USDT')).toBeVisible();
    expect(requests.at(-1)).toEqual({
      productType: 'futures',
      cursor: 'futures-next',
      limit: '50',
    });
    expect(screen.queryByRole('button', { name: 'Tải thêm vị thế' })).not.toBeInTheDocument();
  });

  it('does not request positions without trade read permission', async () => {
    let requested = false;
    server.use(
      http.get('http://localhost:3000/api/trading/positions', () => {
        requested = true;
        return HttpResponse.json({ items: [], updatedAt });
      }),
    );

    renderWithProviders(<OpenPositionsPage />, { authAdapter: adapterWithPermissions([]) });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tài khoản của bạn không có quyền xem vị thế.',
    );
    expect(requested).toBe(false);
  });

  it('stops pagination if the server repeats an opaque cursor', async () => {
    const cursors: Array<string | null> = [];
    server.use(
      http.get('http://localhost:3000/api/trading/positions', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        cursors.push(cursor);

        return HttpResponse.json({
          items: [cursor ? { ...position, id: 'position-eth', symbol: 'ETH/USDT' } : position],
          updatedAt,
          nextCursor: 'same-cursor',
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('BTC/USDT')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tải thêm vị thế' }));

    expect(await screen.findByText('ETH/USDT')).toBeVisible();
    expect(cursors).toEqual([null, 'same-cursor']);
    expect(screen.queryByRole('button', { name: 'Tải thêm vị thế' })).not.toBeInTheDocument();
  });

  it('shows an explicit permission-denied state for a contract-declared 403', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/positions', () =>
        HttpResponse.json({ code: 'PREVIEW_FORBIDDEN' }, { status: 403 }),
      ),
    );

    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Không có quyền xem vị thế')).toBeVisible();
    expect(screen.getByText('Tài khoản của bạn không có quyền xem vị thế.')).toBeVisible();
    expect(screen.queryByText('Không có vị thế phù hợp.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });

  it('shows an empty state when the server returns no open positions', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/positions', () =>
        HttpResponse.json({ items: [], updatedAt }),
      ),
    );

    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Không có vị thế phù hợp.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Tải thêm vị thế' })).not.toBeInTheDocument();
  });

  it('offers a retry for a generic request error and recovers to the empty state', async () => {
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/trading/positions', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ code: 'POSITIONS_TEMPORARILY_FAILED' }, { status: 422 })
          : HttpResponse.json({ items: [], updatedAt });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    expect(screen.getByText('Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Không có vị thế phù hợp.')).toBeVisible();
    expect(attempts).toBe(2);
  });

  it('explains an unavailable positions source and retries after the source recovers', async () => {
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/trading/positions', () => {
        attempts += 1;
        return attempts <= 3
          ? HttpResponse.json({ code: 'positions_source_unavailable' }, { status: 503 })
          : HttpResponse.json({ items: [], updatedAt });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Nguồn dữ liệu vị thế chưa được kết nối')).toBeVisible();
    expect(screen.getByText('Frontend chưa có backend cung cấp dữ liệu tài khoản.')).toBeVisible();
    expect(attempts).toBe(3);
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Không có vị thế phù hợp.')).toBeVisible();
    expect(attempts).toBe(4);
  });

  it('recovers from a failed next page without losing the first server page', async () => {
    let nextPageAttempts = 0;
    server.use(
      http.get('http://localhost:3000/api/trading/positions', ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        if (cursor === 'positions-next') {
          nextPageAttempts += 1;
          return nextPageAttempts === 1
            ? HttpResponse.json({ code: 'POSITIONS_TEMPORARILY_FAILED' }, { status: 422 })
            : HttpResponse.json({
                items: [{ ...position, id: 'position-eth', symbol: 'ETH/USDT' }],
                updatedAt,
              });
        }

        return HttpResponse.json({ items: [position], updatedAt, nextCursor: 'positions-next' });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('BTC/USDT')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tải thêm vị thế' }));

    expect(await screen.findByText('Không tải được các vị thế tiếp theo')).toBeVisible();
    expect(screen.getByText('BTC/USDT')).toBeVisible();
    expect(nextPageAttempts).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('ETH/USDT')).toBeVisible();
    expect(screen.getByText('BTC/USDT')).toBeVisible();
    expect(nextPageAttempts).toBe(2);
    expect(screen.queryByText('Không tải được các vị thế tiếp theo')).not.toBeInTheDocument();
  });

  it('renders short positions and zero P/L using the server-provided values', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/positions', () =>
        HttpResponse.json({
          items: [
            {
              ...position,
              id: 'position-short',
              symbol: 'SOL/USDT',
              productType: 'margin',
              side: 'short',
              baseAsset: 'SOL',
              quantity: 12,
              unrealizedPnl: 0,
            },
          ],
          updatedAt,
        }),
      ),
    );

    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByRole('article', { name: 'Margin SOL/USDT' })).toBeVisible();
    expect(screen.getByText('Short')).toBeVisible();
    expect(screen.getByText('12.0000 SOL')).toBeVisible();
    expect(screen.getByText('+0.00 USDT')).toBeVisible();
  });

  it('keeps the last server snapshot visible and reports a failed background refresh', async () => {
    let requests = 0;
    server.use(
      http.get('http://localhost:3000/api/trading/positions', () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ items: [position], updatedAt })
          : HttpResponse.json({ code: 'POSITIONS_TEMPORARILY_FAILED' }, { status: 422 });
      }),
    );

    renderWithProviders(<OpenPositionsPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('BTC/USDT')).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 5_100));
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      focusManager.setFocused(undefined);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể làm mới dữ liệu. Các số liệu đang hiển thị là bản gần nhất từ máy chủ.',
    );
    expect(screen.getByText('BTC/USDT')).toBeVisible();
    expect(requests).toBe(2);
  });
});
