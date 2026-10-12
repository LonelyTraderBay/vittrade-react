import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { tradingApi } from '../api/trading-api';
import { useCopyProviderProfileQuery } from './trading-queries';

const queryClients: QueryClient[] = [];

function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  queryClients.push(client);
  return client;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const client of queryClients.splice(0)) client.clear();
});

describe('useCopyProviderProfileQuery', () => {
  it('does not request a profile when the provider id is absent', () => {
    const client = createQueryClient();
    const getProfile = vi.spyOn(tradingApi, 'getCopyProviderProfile');
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client, children });

    const { result } = renderHook(() => useCopyProviderProfileQuery(undefined), { wrapper });

    expect(result.current.status).toBe('pending');
    expect(result.current.fetchStatus).toBe('idle');
    expect(getProfile).not.toHaveBeenCalled();
    expect(client.getQueryState(['trading', 'copy-provider', ''])).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
    });
  });
});
