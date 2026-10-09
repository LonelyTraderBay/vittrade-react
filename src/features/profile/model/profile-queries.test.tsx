import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryClient as appQueryClient } from '@/shared/api/query-client';
import {
  useActivityQuery,
  useDevicesQuery,
  useProfileQuery,
  useSubAccountsQuery,
} from './profile-queries';

const clients: QueryClient[] = [];

afterEach(() => {
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

describe('Profile read query hooks', () => {
  it('keeps the HTTP client retry budget without multiplying it on a manual retry', async () => {
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
    const { result } = renderHook(
      () => ({
        profile: useProfileQuery(),
        devices: useDevicesQuery(),
        activity: useActivityQuery(),
        subAccounts: useSubAccountsQuery(),
      }),
      { wrapper },
    );

    await waitFor(() =>
      expect(
        [
          result.current.profile,
          result.current.devices,
          result.current.activity,
          result.current.subAccounts,
        ].every((query) => query.isError),
      ).toBe(true),
    );
    expect(fetchMock).toHaveBeenCalledTimes(12);

    await act(async () => {
      await Promise.all([
        result.current.profile.refetch(),
        result.current.devices.refetch(),
        result.current.activity.refetch(),
        result.current.subAccounts.refetch(),
      ]);
    });
    expect(fetchMock).toHaveBeenCalledTimes(24);
  });
});
