import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
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
      http.get('http://localhost:3000/api/trading/positions', ({ request }) => {
        const query = new URL(request.url).searchParams;
        requests.push({
          productType: query.get('productType'),
          cursor: query.get('cursor'),
          limit: query.get('limit'),
        });

        if (query.get('productType') === 'futures' && query.get('cursor') === 'futures-next') {
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
});
