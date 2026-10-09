import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { AuthSessionProvider, type AuthAdapter } from '@/shared/session/AuthContext';
import { queryClient as appQueryClient } from '@/shared/api/query-client';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import {
  useHelpQuery,
  useMarkNotificationReadMutation,
  useNewsQuery,
  useNotificationsQuery,
  useSupportTicketsQuery,
  useUnreadNotificationsCount,
  supportQueryKeys,
} from './support-queries';

const clients: QueryClient[] = [];
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

afterEach(() => {
  server.resetHandlers();
  for (const client of clients.splice(0)) client.clear();
  vi.restoreAllMocks();
});

function notificationsReadAdapter(canRead = true): AuthAdapter {
  const baseUser = testAuthAdapter.initialSession!.user;
  const permissions = baseUser.permissions.filter(
    (permission) => permission !== 'notifications:read',
  );
  if (canRead) permissions.push('notifications:read');

  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...baseUser, permissions },
    },
  };
}

function createClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  return client;
}

function queryAuthWrapper(
  client: QueryClient,
  authAdapter: AuthAdapter = notificationsReadAdapter(),
) {
  return ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, {
      client,
      children: createElement(AuthSessionProvider, { adapter: authAdapter, children }),
    });
}

describe('Support read query retry budget', () => {
  it('keeps three HTTP-client attempts for each read and does not multiply them on refetch', async () => {
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
      useNewsQuery,
      useNotificationsQuery,
      useHelpQuery,
      useSupportTicketsQuery,
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

describe('Unread notification count', () => {
  it('uses the Support query cache and refreshes after a successful mark-read response', async () => {
    let isRead = false;
    let listCalls = 0;
    let markReadCalls = 0;
    const notifications = [
      {
        id: 'notification-1',
        type: 'system',
        title: 'First notice',
        message: 'First message',
        time: '2026-09-24T00:00:00.000Z',
        isRead: false,
      },
      {
        id: 'notification-2',
        type: 'system',
        title: 'Second notice',
        message: 'Second message',
        time: '2026-09-24T00:00:00.000Z',
        isRead: false,
      },
    ];
    server.use(
      http.get('*/notifications', () => {
        listCalls += 1;
        return HttpResponse.json({
          items: notifications.map((notification) =>
            notification.id === 'notification-1' ? { ...notification, isRead } : notification,
          ),
        });
      }),
      http.post('*/notifications/notification-1/read', () => {
        markReadCalls += 1;
        isRead = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const client = createClient();
    const { result } = renderHook(
      () => ({
        unreadCount: useUnreadNotificationsCount(),
        markRead: useMarkNotificationReadMutation(),
      }),
      { wrapper: queryAuthWrapper(client) },
    );

    await waitFor(() => expect(result.current.unreadCount).toBe(2));
    expect(listCalls).toBe(1);
    await act(async () =>
      result.current.markRead.mutateAsync({
        id: 'notification-1',
        idempotencyKey: 'notification-read-1',
      }),
    );
    await waitFor(() => expect(result.current.unreadCount).toBe(1));
    expect(markReadCalls).toBe(1);
    expect(listCalls).toBe(2);
  });

  it('does not request or reveal cached notification data without read permission', () => {
    let listCalls = 0;
    server.use(
      http.get('*/notifications', () => {
        listCalls += 1;
        return HttpResponse.json({ items: [] });
      }),
    );

    const client = createClient();
    client.setQueryData(supportQueryKeys.notifications, {
      items: [
        {
          id: 'private-notification',
          type: 'system',
          title: 'Private notice',
          message: 'Private message',
          time: '2026-09-24T00:00:00.000Z',
          isRead: false,
        },
      ],
    });
    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: queryAuthWrapper(client, notificationsReadAdapter(false)),
    });

    expect(result.current).toBe(0);
    expect(listCalls).toBe(0);
  });

  it('returns zero during initial loading and does not keep a stale count after refresh error', async () => {
    let resolveList!: (response: Response) => void;
    server.use(
      http.get(
        '*/notifications',
        () =>
          new Promise<Response>((resolve) => {
            resolveList = resolve;
          }),
      ),
    );
    const client = createClient();
    const { result, unmount } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: queryAuthWrapper(client),
    });

    expect(result.current).toBe(0);
    await waitFor(() => expect(resolveList).toBeTypeOf('function'));
    resolveList(
      HttpResponse.json({
        items: [
          {
            id: 'notification-1',
            type: 'system',
            title: 'Notice',
            message: 'Message',
            time: '2026-09-24T00:00:00.000Z',
            isRead: false,
          },
        ],
      }),
    );
    await waitFor(() => expect(result.current).toBe(1));
    unmount();

    const staleClient = createClient();
    staleClient.setQueryData(supportQueryKeys.notifications, {
      items: [
        {
          id: 'old-notification',
          type: 'system',
          title: 'Old notice',
          message: 'Old message',
          time: '2026-09-24T00:00:00.000Z',
          isRead: false,
        },
      ],
    });
    server.use(http.get('*/notifications', () => HttpResponse.error()));
    const staleResult = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: queryAuthWrapper(staleClient),
    });

    expect(staleResult.result.current).toBe(1);
    await act(async () => {
      await staleClient.invalidateQueries({ queryKey: supportQueryKeys.notifications });
    });
    await waitFor(() => expect(staleResult.result.current).toBe(0));
  });
});
