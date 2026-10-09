import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryClient as appQueryClient } from '@/shared/api/query-client';
import {
  useAdminAbTestQuery,
  useAdminAbTestsQuery,
  useAdminFunnelQuery,
  useAdminOverviewQuery,
} from './admin-queries';

const clients: QueryClient[] = [];

afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe('Admin read query retry budget', () => {
  it('keeps three HTTP-client attempts for every read and does not multiply them on refetch', async () => {
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
    const readHooks = [
      useAdminOverviewQuery,
      useAdminFunnelQuery,
      useAdminAbTestsQuery,
      () => useAdminAbTestQuery('test-1'),
    ] as const;

    for (const useReadQuery of readHooks) {
      const beforeExecution = fetchMock.mock.calls.length;
      const { result, unmount } = renderHook(() => useReadQuery(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5_000 });
      expect(fetchMock).toHaveBeenCalledTimes(beforeExecution + 3);

      await act(async () => {
        await result.current.refetch();
      });
      expect(fetchMock).toHaveBeenCalledTimes(beforeExecution + 6);
      unmount();
    }
  });
});
