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
  useAdminFeatureFlagUpdateMutation,
  adminQueryKeys,
} from './admin-queries';
import { adminApi } from '../api/admin-api';

const clients: QueryClient[] = [];

afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe('Admin read query retry budget', () => {
  it.each([true, false])(
    'invalidates cached overview and experiments only for a confirmed flag update: %s',
    async (confirmed) => {
      const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
      clients.push(client);
      client.setQueryData(adminQueryKeys.overview, { activeUsers: 1 });
      client.setQueryData(adminQueryKeys.abTests, []);
      const update = vi.spyOn(adminApi, 'updateFeatureFlag');
      const response = {
        key: 'dca_enabled',
        enabled: false,
        rolloutPercentage: 0,
        owner: 'test-owner',
        expiresAt: '2099-01-01T00:00:00.000Z',
      };
      if (confirmed) update.mockResolvedValue(response);
      else update.mockRejectedValue(new Error('Update rejected'));
      const wrapper = ({ children }: PropsWithChildren) =>
        createElement(QueryClientProvider, { client, children });
      const { result } = renderHook(() => useAdminFeatureFlagUpdateMutation(), { wrapper });
      const request = { enabled: false, rolloutPercentage: 0, expiresAt: response.expiresAt };
      await act(async () => {
        const completion = result.current.mutateAsync({
          flagKey: 'dca_enabled',
          request,
          idempotencyKey: 'test-key',
        });
        if (confirmed) expect(await completion).toEqual(response);
        else await expect(completion).rejects.toThrow('Update rejected');
      });
      expect(update).toHaveBeenCalledOnce();
      expect(update).toHaveBeenCalledWith('dca_enabled', request, 'test-key');
      expect(client.getQueryState(adminQueryKeys.overview)?.isInvalidated).toBe(confirmed);
      expect(client.getQueryState(adminQueryKeys.abTests)?.isInvalidated).toBe(confirmed);
      await waitFor(() => expect(result.current.isSuccess).toBe(confirmed));
    },
  );
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
