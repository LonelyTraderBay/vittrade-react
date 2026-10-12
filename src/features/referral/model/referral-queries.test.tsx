import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryClient as appQueryClient } from '@/shared/api/query-client';
import { useReferralOverviewQuery } from './referral-queries';

const clients: QueryClient[] = [];

afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe('Referral overview query retry budget', () => {
  it('keeps the HTTP-client retry budget without multiplying it on manual retry', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('Failed to fetch'));
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: appQueryClient.getDefaultOptions().queries?.retry,
          retryDelay: 0,
          refetchOnWindowFocus: false,
        },
      },
    });
    clients.push(client);
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client, children });
    const { result } = renderHook(() => useReferralOverviewQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5_000 });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await act(async () => {
      await result.current.refetch();
    });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
