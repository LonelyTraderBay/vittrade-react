import { createElement, type PropsWithChildren } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { marketApi } from '../api/market-api';
import {
  marketQueryKeys,
  useMarketCandlesQuery,
  useMarketMoversQuery,
  useMarketOrderBookQuery,
  useMarketOverviewQuery,
  useMarketPairQuery,
  useMarketPairsQuery,
  useMarketPriceAlertCreateMutation,
  useMarketPriceAlertDeleteMutation,
  useMarketPriceAlertUpdateMutation,
  useMarketPriceAlertsQuery,
  useMarketRecentTradesQuery,
  useMarketWatchlistCreateMutation,
  useMarketWatchlistDeleteMutation,
  useMarketWatchlistQuery,
  useMarketWatchlistUpdateMutation,
} from './market-queries';
import type { MarketPair } from './market-types';

const queryClients: QueryClient[] = [];

function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  queryClients.push(client);
  return client;
}

function createWrapper(client: QueryClient) {
  return ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, { client, children });
}

async function renderQuery<T>(query: () => UseQueryResult<T, Error>) {
  const client = createQueryClient();
  const rendered = renderHook(query, { wrapper: createWrapper(client) });
  await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true));
  return { ...rendered, client };
}

async function runMutation<TData, TVariables>(
  hook: () => UseMutationResult<TData, Error, TVariables, unknown>,
  variables: TVariables,
) {
  const client = createQueryClient();
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries');
  const rendered = renderHook(hook, { wrapper: createWrapper(client) });
  await act(async () => {
    await rendered.result.current.mutateAsync(variables);
  });
  return { ...rendered, client, invalidateQueries };
}

beforeEach(() => {
  vi.spyOn(marketApi, 'listPairs').mockResolvedValue({ items: [] });
  vi.spyOn(marketApi, 'getPair').mockResolvedValue({ id: 'btc-usdt' } as MarketPair);
  vi.spyOn(marketApi, 'getWatchlist').mockResolvedValue({ items: [] });
  vi.spyOn(marketApi, 'createWatchlistItem').mockResolvedValue({
    id: 'watch-1',
    pairId: 'btc-usdt',
    addedAt: '2026-09-24T00:00:00.000Z',
  });
  vi.spyOn(marketApi, 'updateWatchlistItem').mockResolvedValue({
    id: 'watch-1',
    pairId: 'btc-usdt',
    addedAt: '2026-09-24T00:00:00.000Z',
    note: 'support level',
  });
  vi.spyOn(marketApi, 'deleteWatchlistItem').mockResolvedValue(undefined);
  vi.spyOn(marketApi, 'getOrderBook').mockResolvedValue({ bids: [], asks: [], updatedAt: '' });
  vi.spyOn(marketApi, 'getRecentTrades').mockResolvedValue({ items: [] });
  vi.spyOn(marketApi, 'getCandles').mockResolvedValue({ items: [], updatedAt: '' });
  vi.spyOn(marketApi, 'getOverview').mockResolvedValue(
    {} as Awaited<ReturnType<typeof marketApi.getOverview>>,
  );
  vi.spyOn(marketApi, 'getMovers').mockResolvedValue({ items: [], updatedAt: '' });
  vi.spyOn(marketApi, 'listPriceAlerts').mockResolvedValue({ items: [] });
  vi.spyOn(marketApi, 'createPriceAlert').mockResolvedValue({
    id: 'alert-1',
    pairId: 'btc-usdt',
    symbol: 'BTC/USDT',
    condition: 'above',
    targetPrice: 70_000,
    currentPrice: 65_000,
    isActive: true,
    createdAt: '2026-09-24T00:00:00.000Z',
  });
  vi.spyOn(marketApi, 'updatePriceAlert').mockResolvedValue({
    id: 'alert-1',
    pairId: 'btc-usdt',
    symbol: 'BTC/USDT',
    condition: 'above',
    targetPrice: 72_000,
    currentPrice: 65_000,
    isActive: true,
    createdAt: '2026-09-24T00:00:00.000Z',
  });
  vi.spyOn(marketApi, 'deletePriceAlert').mockResolvedValue(undefined);
});

afterEach(() => {
  for (const client of queryClients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe('market query hooks', () => {
  it('loads pairs with the supplied filters and stable query key', async () => {
    const query = { search: 'btc', category: 'Layer 1', limit: 20 };
    const { client } = await renderQuery(() => useMarketPairsQuery(query));

    expect(marketApi.listPairs).toHaveBeenCalledWith(query, expect.anything());
    expect(client.getQueryCache().find({ queryKey: marketQueryKeys.pairs(query) })).toBeDefined();
  });

  it('loads a pair and skips the request when its ID is empty', async () => {
    await renderQuery(() => useMarketPairQuery('btc-usdt'));
    expect(marketApi.getPair).toHaveBeenCalledWith('btc-usdt', expect.anything());

    const { result } = renderHook(() => useMarketPairQuery(''), {
      wrapper: createWrapper(createQueryClient()),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(marketApi.getPair).toHaveBeenCalledTimes(1);
  });

  it('loads the watchlist under a user-scoped key and honors the disabled option', async () => {
    const { client } = await renderQuery(() => useMarketWatchlistQuery({ userId: 'account-a' }));
    expect(marketApi.getWatchlist).toHaveBeenCalledWith(expect.anything());
    expect(
      client.getQueryCache().find({ queryKey: marketQueryKeys.watchlistForUser('account-a') }),
    ).toBeDefined();
    expect(
      client.getQueryCache().find({ queryKey: marketQueryKeys.watchlistForUser('account-b') }),
    ).toBeUndefined();

    const { result } = renderHook(
      () => useMarketWatchlistQuery({ userId: 'account-a', enabled: false }),
      {
        wrapper: createWrapper(createQueryClient()),
      },
    );
    expect(result.current.fetchStatus).toBe('idle');
    expect(marketApi.getWatchlist).toHaveBeenCalledTimes(1);
  });

  it('does not fetch user-owned watchlist data without an account identity', () => {
    const { result } = renderHook(() => useMarketWatchlistQuery(), {
      wrapper: createWrapper(createQueryClient()),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(marketApi.getWatchlist).not.toHaveBeenCalled();
  });

  it('loads order book and recent trades for the selected pair', async () => {
    await renderQuery(() => useMarketOrderBookQuery('btc-usdt'));
    await renderQuery(() => useMarketRecentTradesQuery('btc-usdt'));

    expect(marketApi.getOrderBook).toHaveBeenCalledWith('btc-usdt', expect.anything());
    expect(marketApi.getRecentTrades).toHaveBeenCalledWith('btc-usdt', expect.anything());
  });

  it('loads candles with the default interval or a caller-supplied interval', async () => {
    await renderQuery(() => useMarketCandlesQuery('btc-usdt'));
    await renderQuery(() => useMarketCandlesQuery('eth-usdt', { interval: '4h', limit: 48 }));

    expect(marketApi.getCandles).toHaveBeenNthCalledWith(
      1,
      'btc-usdt',
      { interval: '1h', limit: 24 },
      expect.anything(),
    );
    expect(marketApi.getCandles).toHaveBeenNthCalledWith(
      2,
      'eth-usdt',
      { interval: '4h', limit: 48 },
      expect.anything(),
    );
  });

  it('loads overview, movers, and price alerts using their query parameters', async () => {
    const movers = { timeframe: '24h', view: 'gainers' } as const;
    const alerts = { status: 'active' } as const;

    await renderQuery(() => useMarketOverviewQuery());
    await renderQuery(() => useMarketMoversQuery(movers));
    await renderQuery(() => useMarketPriceAlertsQuery(alerts));

    expect(marketApi.getOverview).toHaveBeenCalledWith(expect.anything());
    expect(marketApi.getMovers).toHaveBeenCalledWith(movers, expect.anything());
    expect(marketApi.listPriceAlerts).toHaveBeenCalledWith(alerts, expect.anything());
  });
});

describe('market mutation hooks', () => {
  it('invalidates the watchlist and pair list after creating a watchlist item', async () => {
    const request = { pairId: 'btc-usdt' };
    const { invalidateQueries } = await runMutation(() => useMarketWatchlistCreateMutation(), {
      request,
      idempotencyKey: 'watchlist-create-1',
    });

    expect(marketApi.createWatchlistItem).toHaveBeenCalledWith(request, 'watchlist-create-1');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: marketQueryKeys.watchlist });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['market', 'pairs'] });
  });

  it('invalidates the watchlist and pair list after updating a watchlist item', async () => {
    const request = { note: 'support level' };
    const { invalidateQueries } = await runMutation(() => useMarketWatchlistUpdateMutation(), {
      id: 'watch-1',
      request,
      idempotencyKey: 'watchlist-update-1',
    });

    expect(marketApi.updateWatchlistItem).toHaveBeenCalledWith(
      'watch-1',
      request,
      'watchlist-update-1',
    );
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: marketQueryKeys.watchlist });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['market', 'pairs'] });
  });

  it('invalidates the watchlist and pair list after deleting a watchlist item', async () => {
    const { invalidateQueries } = await runMutation(() => useMarketWatchlistDeleteMutation(), {
      id: 'watch-1',
      idempotencyKey: 'watchlist-delete-1',
    });

    expect(marketApi.deleteWatchlistItem).toHaveBeenCalledWith('watch-1', 'watchlist-delete-1');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: marketQueryKeys.watchlist });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['market', 'pairs'] });
  });

  it('invalidates price alerts after create, update, and delete mutations', async () => {
    const request = { pairId: 'btc-usdt', condition: 'above', targetPrice: 70_000 } as const;
    const created = await runMutation(() => useMarketPriceAlertCreateMutation(), {
      request,
      idempotencyKey: 'alert-create-1',
    });
    const updateRequest = { targetPrice: 72_000, isActive: true };
    const updated = await runMutation(() => useMarketPriceAlertUpdateMutation(), {
      id: 'alert-1',
      request: updateRequest,
      idempotencyKey: 'alert-update-1',
    });
    const deleted = await runMutation(() => useMarketPriceAlertDeleteMutation(), {
      id: 'alert-1',
      idempotencyKey: 'alert-delete-1',
    });

    expect(marketApi.createPriceAlert).toHaveBeenCalledWith(request, 'alert-create-1');
    expect(marketApi.updatePriceAlert).toHaveBeenCalledWith(
      'alert-1',
      updateRequest,
      'alert-update-1',
    );
    expect(marketApi.deletePriceAlert).toHaveBeenCalledWith('alert-1', 'alert-delete-1');
    for (const { invalidateQueries } of [created, updated, deleted]) {
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['market', 'price-alerts'] });
    }
  });
});
