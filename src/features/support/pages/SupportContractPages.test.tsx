import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { invokeStaleReactHandler } from '@/test/invoke-stale-react-handler';
import { supportApi } from '../api/support-api';
import { supportQueryKeys } from '../model/support-queries';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { HelpCenterContractPage } from './HelpCenterContractPage';
import { NotificationsContractPage } from './NotificationsContractPage';
import { SupportContractPage } from './SupportContractPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer(http.get('*/notifications', () => HttpResponse.json({ items: [] })));

const ticket = {
  id: 'ticket-1',
  subject: 'Cannot access account',
  category: 'other',
  status: 'open' as const,
  priority: 'normal',
  description: 'Login returns an error',
  createdAt: '2026-09-24T00:00:00.000Z',
  updatedAt: '2026-09-24T00:00:00.000Z',
  messages: [],
};

const notification = {
  id: 'notification-1',
  type: 'system' as const,
  title: 'System update',
  message: 'A new update is available.',
  time: '2026-09-24T00:00:00.000Z',
  isRead: false,
};

function QueryInvalidationTrigger({
  eventName,
  queryKey,
}: {
  eventName: string;
  queryKey: QueryKey;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => void queryClient.invalidateQueries({ queryKey });
    window.addEventListener(eventName, invalidate);
    return () => window.removeEventListener(eventName, invalidate);
  }, [eventName, queryClient, queryKey]);

  return null;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function supportWriteAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['support:read', 'support:write', 'notifications:read', 'notifications:write'],
      },
    },
  };
}

describe('SupportContractPage', () => {
  it('keeps support ticket creation blocked for a read-only support session', async () => {
    let createCalls = 0;
    server.use(
      http.get('*/support/tickets', () => HttpResponse.json({ items: [] })),
      http.post('*/support/tickets', () => {
        createCalls += 1;
        return HttpResponse.json(ticket, { status: 201 });
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['support:read'] },
      },
    };

    renderWithProviders(<SupportContractPage />, { authAdapter: readOnlyAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Support write permission is required to create a ticket.',
    );
    const submit = screen.getByRole('button', { name: 'Gửi ticket' });
    expect(submit).toBeDisabled();
    invokeStaleReactHandler(submit, 'onClick');
    expect(createCalls).toBe(0);
  });

  it('allows ticket creation without requesting the read-only ticket list', async () => {
    let listCalls = 0;
    let createCalls = 0;
    server.use(
      http.get('*/support/tickets', () => {
        listCalls += 1;
        return HttpResponse.json({ items: [] });
      }),
      http.post('*/support/tickets', () => {
        createCalls += 1;
        return HttpResponse.json(ticket, { status: 201 });
      }),
    );
    const writeOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['support:write'] },
      },
    };

    renderWithProviders(<SupportContractPage />, { authAdapter: writeOnlyAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Support read permission is required to view ticket history.',
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Tiêu đề ticket'), 'Account issue');
    await user.type(screen.getByLabelText('Nội dung ticket'), 'Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    await waitFor(() => expect(createCalls).toBe(1));
    expect(listCalls).toBe(0);
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('');
  });

  it('submits trimmed ticket content with an idempotency key and confirms success', async () => {
    let requestBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get('*/support/tickets', () => HttpResponse.json({ items: [] })),
      http.post('*/support/tickets', async ({ request }) => {
        requestBody = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json(ticket, { status: 201 });
      }),
    );
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Tiêu đề ticket'), '  Cannot access account  ');
    await user.type(screen.getByLabelText('Nội dung ticket'), '  Login returns an error  ');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã gửi yêu cầu hỗ trợ.', { duration: 1500 }),
    );
    expect(requestBody).toEqual({
      subject: 'Cannot access account',
      description: 'Login returns an error',
      category: 'other',
    });
    expect(idempotencyKey).toMatch(/^support-ticket-/);
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('');
  });

  it('locks the ticket form and prevents a second submission while the request is in flight', async () => {
    let attempts = 0;
    let resolveCreate!: (response: Response) => void;
    server.use(
      http.get('*/support/tickets', () => HttpResponse.json({ items: [] })),
      http.post(
        '*/support/tickets',
        () =>
          new Promise<Response>((resolve) => {
            attempts += 1;
            resolveCreate = resolve;
          }),
      ),
    );
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    const subjectField = await screen.findByLabelText('Tiêu đề ticket');
    const descriptionField = screen.getByLabelText('Nội dung ticket');
    await user.type(subjectField, 'Login issue');
    await user.type(descriptionField, 'Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    const pendingButton = await screen.findByRole('button', { name: 'Đang gửi…' });
    expect(pendingButton).toBeDisabled();
    expect(pendingButton).toHaveAttribute('aria-busy', 'true');
    expect(subjectField).toBeDisabled();
    expect(descriptionField).toBeDisabled();
    expect(attempts).toBe(1);

    resolveCreate(HttpResponse.json(ticket, { status: 201 }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã gửi yêu cầu hỗ trợ.', { duration: 1500 }),
    );
    expect(attempts).toBe(1);
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('');
  });

  it('reports ticket creation failures and retains the entered content', async () => {
    let attempts = 0;
    const idempotencyKeys: string[] = [];
    server.use(
      http.get('*/support/tickets', () => HttpResponse.json({ items: [] })),
      http.post('*/support/tickets', ({ request }) => {
        attempts += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Ticket service unavailable' }, { status: 503 })
          : HttpResponse.json(ticket, { status: 201 });
      }),
    );
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Tiêu đề ticket'), 'Login issue');
    await user.type(screen.getByLabelText('Nội dung ticket'), 'Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Ticket service unavailable', { duration: 2000 }),
    );
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('Login issue');
    expect(screen.getByLabelText('Nội dung ticket')).toHaveValue('Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã gửi yêu cầu hỗ trợ.', {
        duration: 1500,
      }),
    );
    expect(attempts).toBe(2);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('uses safe feedback when the ticket adapter rejects a non-Error value', async () => {
    server.use(http.get('*/support/tickets', () => HttpResponse.json({ items: [] })));
    vi.spyOn(supportApi, 'createTicket').mockRejectedValueOnce('adapter failure');
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Tiêu đề ticket'), 'Login issue');
    await user.type(screen.getByLabelText('Nội dung ticket'), 'Cannot sign in');
    await user.click(screen.getByRole('button', { name: 'Gửi ticket' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể gửi yêu cầu hỗ trợ.', {
        duration: 2000,
      }),
    );
    expect(screen.getByLabelText('Tiêu đề ticket')).toHaveValue('Login issue');
  });

  it('shows an empty ticket state', async () => {
    server.use(http.get('*/support/tickets', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    expect(await screen.findByRole('status')).toHaveTextContent('Bạn chưa có yêu cầu hỗ trợ nào.');
  });

  it('shows a ticket read failure instead of treating it as an empty list', async () => {
    server.use(http.get('*/support/tickets', () => HttpResponse.error()));
    renderWithProviders(<SupportContractPage />, { authAdapter: supportWriteAdapter() });

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Hỗ trợ' })).toBeVisible();
    expect(screen.getByLabelText('Tiêu đề ticket')).toBeVisible();
    expect(screen.queryByText('Bạn chưa có yêu cầu hỗ trợ nào.')).not.toBeInTheDocument();
  });

  it('keeps ticket content, form draft and focus when a refetch fails', async () => {
    let listCalls = 0;
    server.use(
      http.get('*/support/tickets', () => {
        listCalls += 1;
        return listCalls === 1 ? HttpResponse.json({ items: [ticket] }) : HttpResponse.error();
      }),
    );
    renderWithProviders(
      <>
        <SupportContractPage />
        <QueryInvalidationTrigger
          eventName="test:refetch-support-tickets"
          queryKey={supportQueryKeys.tickets}
        />
      </>,
      { authAdapter: supportWriteAdapter() },
    );

    const user = userEvent.setup();
    const subject = await screen.findByLabelText('Tiêu đề ticket');
    await user.type(subject, 'New account issue');
    const description = screen.getByLabelText('Nội dung ticket');
    await user.type(description, 'The page did not load.');
    description.focus();

    act(() => window.dispatchEvent(new Event('test:refetch-support-tickets')));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể cập nhật danh sách ticket; dữ liệu đang hiển thị có thể đã cũ.',
    );
    expect(screen.getByRole('heading', { name: 'Hỗ trợ' })).toBeVisible();
    expect(screen.getByText(ticket.subject)).toBeVisible();
    expect(subject).toHaveValue('New account issue');
    expect(description).toHaveValue('The page did not load.');
    expect(document.activeElement).toBe(description);
    expect(listCalls).toBe(4);
  });
});

describe('NotificationsContractPage', () => {
  it('does not query notifications without notification read permission', async () => {
    let readRequests = 0;
    server.use(
      http.get('*/notifications', () => {
        readRequests += 1;
        return HttpResponse.json({ items: [notification] });
      }),
    );
    const noReadAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };

    renderWithProviders(<NotificationsContractPage />, { authAdapter: noReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Notification read permission is required to view notifications.',
    );
    expect(readRequests).toBe(0);
  });

  it('allows notification reads but blocks acknowledgement without write permission', async () => {
    let writeCalls = 0;
    server.use(
      http.get('*/notifications', () => HttpResponse.json({ items: [notification] })),
      http.post('*/notifications/notification-1/read', () => {
        writeCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['notifications:read'] },
      },
    };

    renderWithProviders(<NotificationsContractPage />, { authAdapter: readOnlyAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Notification write permission is required to mark notifications as read.',
    );
    expect(screen.getByText('System update')).toBeInTheDocument();
    const markRead = screen.getByRole('button', { name: 'Đã đọc' });
    expect(markRead).toBeDisabled();
    invokeStaleReactHandler(markRead, 'onClick');
    expect(writeCalls).toBe(0);
  });

  it('marks a notification as read with an idempotency key and confirms success', async () => {
    let idempotencyKey: string | null = null;
    let isRead = false;
    server.use(
      http.get('*/notifications', () =>
        HttpResponse.json({ items: [{ ...notification, isRead }] }),
      ),
      http.post('*/notifications/notification-1/read', ({ request }) => {
        idempotencyKey = request.headers.get('Idempotency-Key');
        isRead = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<NotificationsContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Đã đọc' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã đánh dấu thông báo là đã đọc.', {
        duration: 1500,
      }),
    );
    expect(idempotencyKey).toMatch(/^notification-read-notification-1-/);
    expect(await screen.findByText('0 chưa đọc')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Đã đọc' })).not.toBeInTheDocument();
  });

  it('reports notification acknowledgement failures and keeps the action available', async () => {
    let attempts = 0;
    const idempotencyKeys: string[] = [];
    server.use(
      http.get('*/notifications', () => HttpResponse.json({ items: [notification] })),
      http.post('*/notifications/notification-1/read', ({ request }) => {
        attempts += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Notification service unavailable' }, { status: 503 })
          : new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<NotificationsContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Đã đọc' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Notification service unavailable', {
        duration: 2000,
      }),
    );
    expect(screen.getByRole('button', { name: 'Đã đọc' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Đã đọc' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã đánh dấu thông báo là đã đọc.', {
        duration: 1500,
      }),
    );
    expect(attempts).toBe(2);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('uses safe feedback when the notification adapter rejects a non-Error value', async () => {
    server.use(http.get('*/notifications', () => HttpResponse.json({ items: [notification] })));
    vi.spyOn(supportApi, 'markNotificationRead').mockRejectedValueOnce('adapter failure');
    renderWithProviders(<NotificationsContractPage />, { authAdapter: supportWriteAdapter() });

    await userEvent.click(await screen.findByRole('button', { name: 'Đã đọc' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật trạng thái thông báo.', {
        duration: 2000,
      }),
    );
    expect(screen.getByRole('button', { name: 'Đã đọc' })).toBeEnabled();
  });

  it('shows an empty notification state', async () => {
    server.use(http.get('*/notifications', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<NotificationsContractPage />, { authAdapter: supportWriteAdapter() });

    expect(await screen.findByRole('status')).toHaveTextContent('Bạn chưa có thông báo nào.');
  });
});

describe('HelpCenterContractPage', () => {
  it('does not request help content without support read permission', async () => {
    let listCalls = 0;
    server.use(
      http.get('*/support/help', () => {
        listCalls += 1;
        return HttpResponse.json({ categories: [], articles: [] });
      }),
    );
    const noReadAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };

    renderWithProviders(<HelpCenterContractPage />, { authAdapter: noReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Support read permission is required to view the help center.',
    );
    expect(screen.getByRole('heading', { name: 'Trung tâm trợ giúp' })).toBeVisible();
    expect(screen.queryByLabelText('Tìm kiếm trợ giúp')).not.toBeInTheDocument();
    expect(listCalls).toBe(0);
  });

  it('keeps the help heading and search available when the initial read fails', async () => {
    server.use(http.get('*/support/help', () => HttpResponse.error()));
    renderWithProviders(<HelpCenterContractPage />, { authAdapter: supportWriteAdapter() });

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Trung tâm trợ giúp' })).toBeVisible();
    expect(screen.getByLabelText('Tìm kiếm trợ giúp')).toBeVisible();
  });

  it('keeps help content, search and focus when a refetch fails', async () => {
    let listCalls = 0;
    server.use(
      http.get('*/support/help', () => {
        listCalls += 1;
        return listCalls === 1
          ? HttpResponse.json({
              categories: [{ id: 'account', name: 'Tài khoản', icon: '👤', count: 1 }],
              articles: [
                {
                  id: 'article-1',
                  category: 'account',
                  categoryIcon: '👤',
                  title: 'Bảo vệ tài khoản',
                  summary: 'Cách bảo vệ tài khoản của bạn.',
                  views: 20,
                },
              ],
            })
          : HttpResponse.error();
      }),
    );
    renderWithProviders(
      <>
        <HelpCenterContractPage />
        <QueryInvalidationTrigger eventName="test:refetch-help" queryKey={supportQueryKeys.help} />
      </>,
      { authAdapter: supportWriteAdapter() },
    );

    const user = userEvent.setup();
    const search = await screen.findByLabelText('Tìm kiếm trợ giúp');
    await user.type(search, 'Bảo vệ');

    act(() => window.dispatchEvent(new Event('test:refetch-help')));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Dữ liệu trợ giúp đang hiển thị có thể đã cũ vì không thể cập nhật.',
    );
    expect(screen.getByRole('heading', { name: 'Trung tâm trợ giúp' })).toBeVisible();
    expect(screen.getByText('Bảo vệ tài khoản')).toBeVisible();
    expect(search).toHaveValue('Bảo vệ');
    expect(document.activeElement).toBe(search);
    expect(listCalls).toBe(4);
  });

  it('explains when a search returns no help articles', async () => {
    server.use(
      http.get('*/support/help', () =>
        HttpResponse.json({
          categories: [{ id: 'account', name: 'Tài khoản', icon: '👤', count: 1 }],
          articles: [
            {
              id: 'article-1',
              category: 'account',
              categoryIcon: '👤',
              title: 'Bảo vệ tài khoản',
              summary: 'Cách bảo vệ tài khoản của bạn.',
              views: 20,
            },
          ],
        }),
      ),
    );
    renderWithProviders(<HelpCenterContractPage />, { authAdapter: supportWriteAdapter() });

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Tìm kiếm trợ giúp'), 'không tồn tại');

    expect(await screen.findByRole('status')).toHaveTextContent('Không tìm thấy bài viết phù hợp.');
  });
});
