import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { p2pApi } from '../api/p2p-api';
import { useP2PMerchantProfileQuery } from './p2p-trust-queries';

const queryClients: QueryClient[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const client of queryClients.splice(0)) client.clear();
});

describe('useP2PMerchantProfileQuery', () => {
  it('keeps an absent merchant identifier disabled without requesting a profile', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });
    queryClients.push(client);
    const getProfile = vi
      .spyOn(p2pApi, 'getMerchantProfile')
      .mockResolvedValue({} as Awaited<ReturnType<typeof p2pApi.getMerchantProfile>>);
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client, children });

    const { result } = renderHook(() => useP2PMerchantProfileQuery(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getProfile).not.toHaveBeenCalled();
    expect(client.getQueryState(['p2p', 'merchant', ''])).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
    });
  });
});
