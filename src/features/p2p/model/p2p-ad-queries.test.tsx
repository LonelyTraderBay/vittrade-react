import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { p2pApi } from '../api/p2p-api';
import { useP2PAdAnalyticsQuery } from './p2p-ad-queries';

const queryClients: QueryClient[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const client of queryClients.splice(0)) client.clear();
});

describe('useP2PAdAnalyticsQuery', () => {
  it('keeps an absent ad identifier disabled without requesting analytics', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    queryClients.push(client);
    const getAnalytics = vi
      .spyOn(p2pApi, 'getAdAnalytics')
      .mockResolvedValue({} as Awaited<ReturnType<typeof p2pApi.getAdAnalytics>>);
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client, children });

    const { result } = renderHook(() => useP2PAdAnalyticsQuery(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getAnalytics).not.toHaveBeenCalled();
    expect(client.getQueryState(['p2p', 'ad-analytics', ''])).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
    });
  });
});
